# 🔔 Buzzivo – Smart Food Order Notification & ETA Prediction System

**Buzzivo** is a smart food-order management and notification system designed to improve the customer experience in restaurants and food-service environments.

The system combines an **ESP32-based physical notification device**, an **admin dashboard**, and an **AI-powered Estimated Time of Arrival (ETA) prediction system** to help restaurant staff manage orders efficiently and notify customers when their orders are ready.

---

## 🚀 Features

### 📟 Smart ESP32 Pager

* ESP32-based wireless notification device
* TM1637 display for displaying order/token information
* Built-in buzzer for order-ready notifications
* Unique device identification for each pager

### 🖥️ Admin Dashboard

* Add and manage notification devices
* View active devices
* Select a specific customer device
* Trigger the buzzer remotely
* Display:

  * Device Number
  * Token/Bill Number
  * Ordered Items
  * Order Type
  * Order Status

### 🤖 AI-Based ETA Prediction

Buzzivo can estimate the approximate preparation time of an order using factors such as:

* Number of items
* Order type (Dine-in / Takeaway)
* Time of day
* Historical preparation time

The predicted ETA helps staff and customers get a better idea of when an order is likely to be ready.

### 🍽️ Order Management

Supports different order types:

* Dine-in
* Takeaway

The system is designed to make the order workflow more organized and reduce unnecessary customer inquiries.

---

## 🏗️ System Architecture

```text
                 ┌─────────────────────┐
                 │   Admin Dashboard   │
                 │                     │
                 │  • Manage Devices   │
                 │  • Manage Orders    │
                 │  • Trigger Alerts   │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │     Backend / API   │
                 │                     │
                 │ • Order Management  │
                 │ • Device Management │
                 │ • ETA Prediction    │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │      ESP32          │
                 │                     │
                 │ • Receive Alert     │
                 │ • Display Token     │
                 │ • Activate Buzzer   │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │      Customer       │
                 │                     │
                 │   🔔 Order Ready    │
                 └─────────────────────┘
```

---

## 🔄 How Buzzivo Works

```text
Customer Places Order
          ↓
Order Details Recorded
          ↓
ETA Prediction
          ↓
Order Preparation
          ↓
Order Becomes Ready
          ↓
Admin Selects Customer Device
          ↓
ESP32 Receives Notification
          ↓
Buzzer Sounds 🔔
          ↓
Customer Collects Order
```

---

## 🧠 ETA Prediction

Buzzivo uses order-related information to estimate preparation time.

### Input Parameters

```text
Number of Items
       +
Order Type
       +
Time of Day
       +
Historical Preparation Time
       ↓
   ETA Prediction
       ↓
Estimated Preparation Time
```

This can be further improved by collecting more historical order data and training a machine-learning model on actual preparation times.

---

## 🛠️ Technologies Used

### Hardware

* **ESP32**
* **TM1637 Display**
* **Buzzer**

### Frontend

* React.js
* Vite
* CSS

### Backend

* Node.js
* Express.js

### Database / Storage

* MongoDB

### AI / Machine Learning

* ETA prediction based on historical order data

---

## 📂 Project Structure

```text
Buzzivo/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── server.js
│
├── esp32/
│   ├── buzzivo.ino
│   └── README.md
│
├── docs/
│   ├── architecture/
│   └── screenshots/
│
└── README.md
```

> The exact folder structure may vary depending on the current implementation of the project.

---

## 💡 Problem Statement

In restaurants and food-service environments, customers often need to repeatedly check with staff to know whether their orders are ready.

This can:

* Increase workload for restaurant staff
* Create unnecessary customer waiting
* Cause confusion during busy hours
* Make order management less efficient

### Buzzivo Solution

Buzzivo provides a simple notification mechanism where customers receive a **physical alert through an ESP32-powered device** when their order is ready.

At the same time, the dashboard gives restaurant staff centralized control over connected devices and orders.

---

## 🎯 Objectives

* Reduce unnecessary customer inquiries
* Improve restaurant order management
* Provide real-time order notifications
* Automate customer alerts
* Estimate order preparation time
* Create a scalable smart restaurant solution

---

## 🔮 Future Enhancements

Some possible future improvements include:

* 📱 Customer mobile application
* 📊 Advanced analytics dashboard
* 🤖 Improved ML-based ETA prediction
* 📈 Real-time preparation-time analytics
* 🔔 Multiple notification methods
* ☁️ Cloud-based device management
* 🔐 User authentication and role-based access
* 📡 Support for multiple restaurants/branches
* 📦 Order queue optimization

---

## 📸 Screenshots

Add screenshots of your dashboard and hardware here.

```text
/screenshots/
├── dashboard.png
├── device-management.png
├── order-management.png
└── esp32-device.jpg
```

Example:

![Buzzivo Dashboard](screenshots/dashboard.png)

![Buzzivo ESP32 Device](screenshots/esp32-device.jpg)

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/Buzzivo.git
cd Buzzivo
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Start the Frontend

```bash
npm run dev
```

### 4. Install Backend Dependencies

Open another terminal:

```bash
cd backend
npm install
```

### 5. Start the Backend

```bash
npm start
```

> Update the commands above according to the scripts defined in your `package.json`.

---

## 🔌 ESP32 Setup

1. Open the ESP32 firmware in **Arduino IDE**.
2. Install the required ESP32 board package.
3. Connect the ESP32 to your computer.
4. Connect the TM1637 display and buzzer according to the circuit configuration.
5. Update the required Wi-Fi/API configuration.
6. Upload the firmware to the ESP32.
7. Register the device through the admin dashboard.

---

## 🌐 Use Case

Buzzivo can be used in:

* Restaurants
* Cafeterias
* College canteens
* Food courts
* Cloud kitchens
* Takeaway counters
* Quick-service restaurants

---

## 👩‍💻 Project

**Buzzivo – Smart Food Order Notification & ETA Prediction System**

Developed as a smart IoT-based solution combining:

**Web Development + IoT + Embedded Systems + AI**

---

## 📌 Project Highlights

| Component       | Purpose                          |
| --------------- | -------------------------------- |
| ESP32           | Controls the notification device |
| TM1637          | Displays token/order information |
| Buzzer          | Alerts the customer              |
| Admin Dashboard | Manages devices and orders       |
| Backend API     | Handles system communication     |
| ETA Prediction  | Estimates preparation time       |
| Database        | Stores order/device information  |

---

## ⭐ Why Buzzivo?

Buzzivo aims to bridge the gap between **restaurant order management and IoT-based customer notification**.

Instead of customers continuously checking their order status, the system provides a simple and efficient **"order ready" notification** through a dedicated physical device.

---

## 📄 License

This project is developed for educational and demonstration purposes.
