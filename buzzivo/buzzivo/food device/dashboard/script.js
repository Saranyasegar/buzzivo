document.addEventListener('DOMContentLoaded', () => {

    // --- State Management ---
    const state = {
        availableDevices: new Set(['01', '02', '03']), // Initial dummy devices
        activeOrders: new Map() // Key: deviceId, Value: { token, items, type, remainingSeconds, intervalId, isReady }
    };

    // --- DOM Elements ---
    const els = {
        addDeviceForm: document.getElementById('add-device-form'),
        newDeviceIdInput: document.getElementById('new-device-id'),

        assignOrderForm: document.getElementById('assign-order-form'),
        assignDeviceSelect: document.getElementById('assign-device-id'),
        orderBillNoInput: document.getElementById('order-bill-no'),
        orderItemsInput: document.getElementById('order-items'),
        orderTimerInput: document.getElementById('order-timer'),

        availableContainer: document.getElementById('available-devices-container'),
        activeContainer: document.getElementById('active-orders-container'),

        statAvailable: document.getElementById('stat-available'),
        statActive: document.getElementById('stat-active'),
        statReady: document.getElementById('stat-ready'),

        modal: document.getElementById('update-timer-modal'),
        modalDeviceName: document.getElementById('modal-device-name'),
        modalDeviceIdInput: document.getElementById('modal-device-id'),
        modalNewTimeInput: document.getElementById('modal-new-time'),
        modalForm: document.getElementById('update-timer-form'),
        closeModalBtn: document.getElementById('close-modal-btn'),
        quickAddBtns: document.querySelectorAll('.quick-add')
    };

    // --- Initialization ---
    renderAvailableDevices();
    updateStats();

    // --- Event Listeners ---

    // 1. Add New Device
    els.addDeviceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const deviceId = els.newDeviceIdInput.value.trim().toUpperCase();

        if (!deviceId) return;
        if (state.availableDevices.has(deviceId) || state.activeOrders.has(deviceId)) {
            alert('Device ID already exists!');
            return;
        }

        const defaultTimerValue = els.orderTimerInput.value;
        if (!defaultTimerValue || defaultTimerValue <= 0) return alert('Please enter a default timer value');

        state.availableDevices.add(deviceId);
        els.newDeviceIdInput.value = '';
        renderAvailableDevices();
        updateStats();
    });

    // 2. Assign Order & Start Timer
    els.assignOrderForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const deviceId = els.assignDeviceSelect.value;
        if (!deviceId) return alert('Select a device first!');

        const minutes = parseInt(els.orderTimerInput.value, 10);
        if (isNaN(minutes) || minutes <= 0) return alert('Invalid time');

        const orderData = {
            deviceId: deviceId,
            token: els.orderBillNoInput.value.trim(),
            items: els.orderItemsInput.value.trim(),
            type: document.querySelector('input[name="order-type"]:checked').value,
            remainingSeconds: minutes * 60,
            isReady: false,
            intervalId: null
        };

        // Transfer device from available to active
        state.availableDevices.delete(deviceId);
        state.activeOrders.set(deviceId, orderData);

        // Reset form
        els.assignOrderForm.reset();

        // Start Timer Interval
        startTimer(deviceId);

        // Notify Backend
        fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                device_number: deviceId,
                token_no: orderData.token,
                items: orderData.items,
                order_type: orderData.type,
                estimated_minutes: minutes
            })
        }).catch(err => console.error(err));

        // Render Updates
        renderAvailableDevices();
        renderActiveOrders();
        updateStats();
    });

    // 3. Main Dashboard Clicks (Delegation for dynamic elements)
    els.activeContainer.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('button');
        if (!actionBtn) return;

        const card = actionBtn.closest('.order-card');
        const deviceId = card.dataset.deviceId;

        if (actionBtn.classList.contains('btn-update-timer')) {
            openModal(deviceId);
        }
        else if (actionBtn.classList.contains('btn-remove-timer')) {
            removeTimer(deviceId);
        }
        else if (actionBtn.classList.contains('btn-mark-ready')) {
            markOrderReady(deviceId);
        }
        else if (actionBtn.classList.contains('btn-complete')) {
            completeOrder(deviceId);
        }
    });

    // 4. Modal Events
    els.closeModalBtn.addEventListener('click', closeModal);

    els.quickAddBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const addMins = parseInt(btn.dataset.add, 10);
            const deviceId = els.modalDeviceIdInput.value;
            addTimeToOrder(deviceId, addMins);
            closeModal();
        });
    });

    els.modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const mins = parseInt(els.modalNewTimeInput.value, 10);
        const deviceId = els.modalDeviceIdInput.value;
        if (!isNaN(mins) && mins > 0) {
            setExactTimeToOrder(deviceId, mins);
            closeModal();
        }
    });

    // --- Core Functions ---

    function startTimer(deviceId) {
        const order = state.activeOrders.get(deviceId);
        if (!order) return;

        // Clear existing interval just in case
        if (order.intervalId) clearInterval(order.intervalId);

        order.intervalId = setInterval(() => {
            order.remainingSeconds--;

            if (order.remainingSeconds <= 0) {
                // Time's up! Unhandled case: we'll mark it ready automatically for this demo
                clearInterval(order.intervalId);
                order.intervalId = null;
                order.remainingSeconds = 0;
                // Optional: Auto-mark ready here. For now we just let it sit at 00:00 until staff clicks "Alert".
                updateTimerUI(deviceId);
                markOrderReady(deviceId); // Let's auto-alert when time is up
            } else {
                updateTimerUI(deviceId);
            }
        }, 1000);
    }

    function removeTimer(deviceId) {
        const order = state.activeOrders.get(deviceId);
        if (order && order.intervalId) {
            clearInterval(order.intervalId);
            order.intervalId = null;
        }
        // In this implementation, if timer is removed, we just clear the display but keep card open
        const timeDisplay = document.querySelector(`.order-card[data-device-id="${deviceId}"] .time-remaining`);
        if (timeDisplay) timeDisplay.textContent = "--:--";

        // Disable timer buttons
        const card = document.querySelector(`.order-card[data-device-id="${deviceId}"]`);
        if (card) {
            card.querySelectorAll('.btn-update-timer, .btn-remove-timer').forEach(btn => btn.disabled = true);
        }
    }

    function addTimeToOrder(deviceId, minutes) {
        const order = state.activeOrders.get(deviceId);
        if (order) {
            order.remainingSeconds += (minutes * 60);
            updateTimerUI(deviceId);
            if (!order.intervalId && order.remainingSeconds > 0 && !order.isReady) {
                startTimer(deviceId); // restart if it was stopped
            }

            // Notify Backend
            fetch(`/api/devices/${deviceId}/add_time`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ minutes: minutes })
            }).catch(console.error);
        }
    }

    function setExactTimeToOrder(deviceId, minutes) {
        const order = state.activeOrders.get(deviceId);
        if (order) {
            order.remainingSeconds = (minutes * 60);
            updateTimerUI(deviceId);
            if (!order.intervalId && order.remainingSeconds > 0 && !order.isReady) {
                startTimer(deviceId);
            }

            // Notify Backend
            fetch(`/api/devices/${deviceId}/set_time`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ minutes: minutes })
            }).catch(console.error);
        }
    }

    function markOrderReady(deviceId) {
        const order = state.activeOrders.get(deviceId);
        if (!order) return;

        if (order.intervalId) {
            clearInterval(order.intervalId);
            order.intervalId = null;
        }

        order.isReady = true;
        order.remainingSeconds = 0;

        // Notify Backend
        fetch(`/api/devices/${deviceId}/ready`, { method: 'POST' }).catch(console.error);

        // Here is where you would send WebSocket/MQTT message to ESP32 to ring the buzzer and blink the LED

        renderActiveOrders(); // Re-render to apply ready styling
        updateStats();
    }

    function completeOrder(deviceId) {
        const order = state.activeOrders.get(deviceId);
        if (!order) return;

        if (order.intervalId) clearInterval(order.intervalId);

        // Move device back to available pool
        state.activeOrders.delete(deviceId);
        state.availableDevices.add(deviceId);

        // Notify Backend
        fetch(`/api/devices/${deviceId}/complete`, { method: 'POST' }).catch(console.error);

        // Here you would send a command to ESP32 to clear the screen

        renderAvailableDevices();
        renderActiveOrders();
        updateStats();
    }

    // --- Utility / UI Functions ---

    function formatTime(seconds) {
        if (seconds <= 0) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    function updateTimerUI(deviceId) {
        const order = state.activeOrders.get(deviceId);
        if (!order) return;
        const timeDisplay = document.querySelector(`.order-card[data-device-id="${deviceId}"] .time-remaining`);
        if (timeDisplay) {
            timeDisplay.textContent = formatTime(order.remainingSeconds);

            // Visual feedback if time is low (< 2 mins)
            if (order.remainingSeconds < 120 && order.remainingSeconds > 0) {
                timeDisplay.style.color = 'var(--status-yellow)';
                timeDisplay.style.textShadow = '0 0 10px rgba(251, 191, 36, 0.5)';
            } else {
                timeDisplay.style.color = '';
                timeDisplay.style.textShadow = '';
            }
        }
    }

    function openModal(deviceId) {
        els.modalDeviceIdInput.value = deviceId;
        els.modalDeviceName.textContent = deviceId;
        els.modalNewTimeInput.value = '';
        els.modal.classList.remove('hidden');
    }

    function closeModal() {
        els.modal.classList.add('hidden');
    }

    function updateStats() {
        els.statAvailable.textContent = state.availableDevices.size;

        let inKitchen = 0;
        let ready = 0;
        state.activeOrders.forEach(order => {
            if (order.isReady) ready++;
            else inKitchen++;
        });

        els.statActive.textContent = inKitchen;
        els.statReady.textContent = ready;
    }

    // --- Render Functions ---

    function renderAvailableDevices() {
        // Update Select Dropdown
        els.assignDeviceSelect.innerHTML = '<option value="" disabled selected>Select Available Device</option>';

        const sortedArray = Array.from(state.availableDevices).sort();

        // Update View Container
        if (state.availableDevices.size === 0) {
            els.availableContainer.innerHTML = '<div class="empty-message">No devices available.</div>';
            els.availableContainer.classList.add('empty-state');
        } else {
            els.availableContainer.innerHTML = '';
            els.availableContainer.classList.remove('empty-state');

            sortedArray.forEach(id => {
                // Add to Select
                const option = document.createElement('option');
                option.value = id;
                option.textContent = `Device ${id}`;
                els.assignDeviceSelect.appendChild(option);

                // Add to Grid
                const pill = document.createElement('div');
                pill.className = 'device-pill';
                pill.innerHTML = `<i class="fa-solid fa-pager"></i> Device ${id}`;
                els.availableContainer.appendChild(pill);
            });
        }
    }

    function renderActiveOrders() {
        if (state.activeOrders.size === 0) {
            els.activeContainer.innerHTML = '<div class="empty-message">No active orders right now.</div>';
            els.activeContainer.classList.add('empty-state');
            return;
        }

        els.activeContainer.innerHTML = '';
        els.activeContainer.classList.remove('empty-state');

        // Sort: Not Ready first, then Ready
        const ordersArray = Array.from(state.activeOrders.values()).sort((a, b) => (a.isReady === b.isReady) ? 0 : a.isReady ? 1 : -1);

        ordersArray.forEach(order => {
            const card = document.createElement('div');
            card.className = `order-card ${order.isReady ? 'status-ready' : ''}`;
            card.dataset.deviceId = order.deviceId;

            const typeClass = order.type === 'Dine-in' ? 'type-dinein' : 'type-takeaway';

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-title">
                        <span class="device-id-tag"><i class="fa-solid fa-pager"></i> Device ${order.deviceId}</span>
                        <span class="token-no">#${order.token}</span>
                    </div>
                    <span class="order-type-tag ${typeClass}">${order.type}</span>
                </div>

                <div class="card-content">
                    ${order.items}
                </div>

                <div class="timer-display">
                    <div class="time-remaining">${formatTime(order.remainingSeconds)}</div>
                    <div class="timer-tools">
                        <button class="btn-icon btn-update-timer" title="Update Time" ${order.isReady ? 'disabled' : ''}>
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-icon btn-remove-timer" title="Remove Timer" ${order.isReady ? 'disabled' : ''}>
                            <i class="fa-solid fa-eraser"></i>
                        </button>
                    </div>
                </div>
                
                <div class="ready-msg">
                    <i class="fa-solid fa-bell-ringing"></i> PLEASE PICKUP
                </div>

                <div class="card-actions">
                    ${!order.isReady ?
                    `<button class="btn btn-warning btn-mark-ready"><i class="fa-solid fa-bell"></i> Alert Ready</button>`
                    :
                    `<div></div>` // Spacer
                }
                    <button class="btn ${order.isReady ? 'btn-success' : 'btn-danger'} btn-complete">
                        <i class="fa-solid fa-rotate-left"></i> ${order.isReady ? 'Got Food / Return' : 'Cancel Order'}
                    </button>
                </div>
            `;
            els.activeContainer.appendChild(card);
        });
    }

});
