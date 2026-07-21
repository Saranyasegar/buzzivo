from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import math
import socket

app = Flask(__name__)
# Secret key required for session management
app.config['SECRET_KEY'] = 'your-secret-key-change-this' 
# Use absolute path for DB to avoid issues, or relative to instance
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///restaurant_pager.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# --- Models ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Device(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.String(10), unique=True, nullable=False)
    # is_active: True if currently assigned to an incomplete order
    is_active = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'number': self.number,
            'is_active': self.is_active
        }

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, db.ForeignKey('device.id'), nullable=False)
    token_no = db.Column(db.String(20), nullable=False)
    items = db.Column(db.String(200), nullable=False)
    order_type = db.Column(db.String(20), nullable=False) # 'Dine-in' or 'Takeaway'
    # status: 'preparing', 'ready', 'completed'
    status = db.Column(db.String(20), default='preparing')
    target_time = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    device = db.relationship('Device', backref=db.backref('orders', lazy=True))

    def to_dict(self):
        remaining_seconds = 0
        if self.target_time and self.status == 'preparing':
            diff = (self.target_time - datetime.utcnow()).total_seconds()
            remaining_seconds = max(0, int(diff))

        return {
            'id': self.id,
            'device_number': self.device.number,
            'token_no': self.token_no,
            'items': self.items,
            'order_type': self.order_type,
            'status': self.status,
            'remaining_seconds': remaining_seconds,
            'has_timer': self.target_time is not None,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- Initialize DB & Create Admin ---
with app.app_context():
    db.create_all()
    # Create default admin if not exists
    if not User.query.filter_by(username='admin').first():
        admin = User(username='admin')
        admin.set_password('admin123') # Default password
        db.session.add(admin)
        db.session.commit()
        print("Created default admin user: admin / admin123")

# --- Routes ---

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash('Invalid username or password')
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/')
@login_required
def index():
    return render_template('index.html')

# Device Management
@app.route('/api/devices', methods=['GET', 'POST'])
@login_required
def handle_devices():
    if request.method == 'POST':
        data = request.json
        number = data.get('number')
        if not number:
            return jsonify({'error': 'Number is required'}), 400
        
        if Device.query.filter_by(number=number).first():
            return jsonify({'error': 'Device already exists'}), 400

        new_device = Device(number=number)
        db.session.add(new_device)
        db.session.commit()
        return jsonify(new_device.to_dict()), 201
    
    else:
        # GET all devices
        devices = Device.query.all()
        return jsonify([d.to_dict() for d in devices])

# Get Available Devices (Not currently active)
@app.route('/api/devices/available', methods=['GET'])
@login_required
def get_available_devices():
    # A device is available if is_active is False
    devices = Device.query.filter_by(is_active=False).all()
    return jsonify([d.to_dict() for d in devices])

@app.route('/api/devices/<number>', methods=['DELETE'])
@login_required
def delete_device(number):
    device = Device.query.filter_by(number=number).first()
    if not device:
        return jsonify({'error': 'Device not found'}), 404
    if device.is_active:
        return jsonify({'error': 'Cannot remove active device'}), 400
    
    # Delete associated orders to avoid integrity errors
    Order.query.filter_by(device_id=device.id).delete()
    db.session.delete(device)
    db.session.commit()
    return jsonify({'success': True})

# Order Management
@app.route('/api/orders', methods=['GET', 'POST'])
@login_required
def handle_orders():
    if request.method == 'POST':
        data = request.json
        device_number = data.get('device_number')
        token_no = data.get('token_no')
        items = data.get('items')
        order_type = data.get('order_type', 'Dine-in')
        estimated_minutes = int(data.get('estimated_minutes', 0))

        device = Device.query.filter_by(number=device_number).first()
        if not device:
            return jsonify({'error': 'Device not found'}), 404
        if device.is_active:
            return jsonify({'error': 'Device is currently active'}), 400

        target_time = None
        if estimated_minutes > 0:
            target_time = datetime.utcnow() + timedelta(minutes=estimated_minutes)

        new_order = Order(
            device_id=device.id,
            token_no=token_no,
            items=items,
            order_type=order_type,
            target_time=target_time,
            status='preparing'
        )
        device.is_active = True
        db.session.add(new_order)
        db.session.commit()
        return jsonify(new_order.to_dict()), 201

    else:
        # GET active orders (not completed)
        active_orders = Order.query.filter(Order.status != 'completed').all()
        return jsonify([o.to_dict() for o in active_orders])

# Additional Endpoints to sync state with frontend
@app.route('/api/devices/<number>/add_time', methods=['POST'])
@login_required
def add_time_by_device(number):
    device = Device.query.filter_by(number=number).first()
    if not device: return jsonify({'error': 'Device not found'}), 404
    order = Order.query.filter_by(device_id=device.id, status='preparing').first()
    if order and order.target_time:
        minutes = int(request.json.get('minutes', 0))
        order.target_time += timedelta(minutes=minutes)
        db.session.commit()
        return jsonify({'success': True})
    return jsonify({'error': 'No active order'}), 400

@app.route('/api/devices/<number>/set_time', methods=['POST'])
@login_required
def set_time_by_device(number):
    device = Device.query.filter_by(number=number).first()
    if not device: return jsonify({'error': 'Device not found'}), 404
    order = Order.query.filter_by(device_id=device.id, status='preparing').first()
    if order:
        minutes = int(request.json.get('minutes', 0))
        order.target_time = datetime.utcnow() + timedelta(minutes=minutes)
        db.session.commit()
        return jsonify({'success': True})
    return jsonify({'error': 'No active order'}), 400

@app.route('/api/devices/<number>/ready', methods=['POST'])
@login_required
def ready_by_device(number):
    device = Device.query.filter_by(number=number).first()
    if not device: return jsonify({'error': 'Device not found'}), 404
    order = Order.query.filter_by(device_id=device.id, status='preparing').first()
    if order:
        order.status = 'ready'
        db.session.commit()
        return jsonify({'success': True})
    return jsonify({'error': 'No active order'}), 400

@app.route('/api/devices/<number>/complete', methods=['POST'])
@login_required
def complete_by_device(number):
    device = Device.query.filter_by(number=number).first()
    if not device: return jsonify({'error': 'Device not found'}), 404
    order = Order.query.filter(Order.device_id==device.id, Order.status != 'completed').first()
    if order:
        order.status = 'completed'
        device.is_active = False
        db.session.commit()
        return jsonify({'success': True})
    return jsonify({'error': 'No active order'}), 400

@app.route('/api/orders/<int:order_id>/call', methods=['POST'])
@login_required
def call_order(order_id):
    order = Order.query.get_or_404(order_id)
    order.status = 'ready'
    db.session.commit()
    return jsonify({'message': 'Customer notified', 'order': order.to_dict()})

@app.route('/api/orders/<int:order_id>/complete', methods=['POST'])
@login_required
def complete_order(order_id):
    order = Order.query.get_or_404(order_id)
    order.status = 'completed'
    
    # Free up the device
    device = Device.query.get(order.device_id)
    device.is_active = False
    
    db.session.commit()
    return jsonify({'message': 'Order completed', 'order': order.to_dict()})

# ESP32 Polling Endpoint
@app.route('/api/device_poll/<number>', methods=['GET'])
def device_poll(number):
    device = Device.query.filter_by(number=number).first()
    if not device:
        # Device not registered
        return jsonify({'alert': False, 'error': 'Unknown Device', 'remaining_seconds': 0})
    
    # Find active order for this device (preparing or ready)
    active_order = Order.query.filter(Order.device_id == device.id, Order.status != 'completed').first()
    
    if not active_order:
        return jsonify({'alert': False, 'remaining_seconds': 0})
    
    alert = (active_order.status == 'ready')
    
    remaining_seconds = 0
    if active_order.target_time:
        diff = (active_order.target_time - datetime.utcnow()).total_seconds()
        remaining_seconds = max(0, int(math.ceil(diff)))

    return jsonify({'alert': alert, 'remaining_seconds': remaining_seconds})

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

if __name__ == '__main__':
    ip_address = get_ip()
    print(f"Server starting on http://{ip_address}:5000")
    print(f"Configure your ESP32 to connect to this IP.")
    app.run(host='0.0.0.0', port=5000, debug=True)
