# Project Report: Buzzivo - Smart Food Ordering & Notification System

## Table of Contents
1. [Abstract](#1-abstract)
2. [Introduction](#2-introduction)
3. [Literature Survey](#3-literature-survey)
4. [Research Gap](#4-research-gap)
5. [Problem Statement](#5-problem-statement)
6. [Objective](#6-objective)
7. [Methodology](#7-methodology)
8. [Results and Discussion](#8-results-and-discussion)
9. [Conclusion](#9-conclusion)
10. [References](#10-references)

---

## 1. Abstract
The rapid growth of the quick-service restaurant and food court industry has highlighted the inefficiencies of traditional queuing and order notification methods. **Buzzivo** is a smart, IoT-based food ordering and notification system designed to eliminate physical queues and improve customer experience. The system integrates a centralized web-based employee dashboard with an ESP32-based wireless notification device handed to the customer. When an order is placed, the customer device displays an estimated waiting timer, keeping them informed. Once the food is ready, the dashboard triggers the customer's device to emit a buzzing sound and flash an LED, alerting them for pickup. This report details the architecture, hardware-software integration, and evaluation of the Buzzivo system, demonstrating its effectiveness in streamlining restaurant operations and enhancing customer satisfaction.

## 2. Introduction
In crowded food courts, cafes, and quick-service restaurants, managing customer wait times and order pickups is a significant operational challenge. Customers often have to wait in long lines or hover near the pickup counter, leading to congestion and a poor dining experience. While traditional buzzer systems exist, they often lack informative feedback such as estimated wait times and can be expensive to deploy. 

**Buzzivo** introduces an upgraded, cost-effective digital ecosystem to solve this problem. By combining real-time web technologies with affordable IoT hardware (ESP32), Buzzivo provides a seamless communication bridge between the kitchen staff and the customers. The dual-component system consists of an admin dashboard for order management and a portable customer node featuring a buzzer, LED indicators, and an interactive timer, redefining wait-time management in the hospitality sector.

## 3. Literature Survey
- **Traditional Queuing Systems:** Historically, restaurants have relied on verbal call-outs, printed receipts with numbers, or localized screen displays. These require the customer's constant visual or auditory attention.
- **RF Pager Systems:** Systems like the classic "restaurant coasters" use simple RF signals to trigger a vibration or light. However, these are hardware-locked, lack detailed information (like countdown timers), and are difficult to integrate with modern software POS systems.
- **Mobile App Notifications:** While effective, they require customers to download an app or provide a phone number, causing friction and privacy concerns.
- **IoT in Hospitality:** Recent studies show that integrating Wi-Fi-enabled microcontrollers (like NodeMCU/ESP32) with restaurant dashboards drastically lowers infrastructure costs and allows for 2-way communication.

## 4. Research Gap
Despite the availability of various queuing systems, a distinct gap remains in providing **informative and seamlessly integrated hardware-software solutions** at a low cost. Existing restaurant coasters only tell the customer when the food is ready, leaving them anxious about the wait time. Furthermore, legacy pager systems operate on closed RF protocols that do not easily interface with modern, web-based employee dashboards. There is a need for an open, Wi-Fi-based IoT solution that gives customers real-time timer feedback while giving staff a comprehensive, easy-to-use digital management interface.

## 5. Problem Statement
The conventional customer notification process in self-service restaurants is inefficient, leading to crowds around the pickup area, customer anxiety due to unknown wait times, and a chaotic environment for the staff. A localized, affordable, and smart notification system is required to manage customer flow, provide estimated wait times dynamically, and seamlessly alert customers when their order is ready for collection without requiring them to install any mobile applications.

## 6. Objective
The primary objectives of the Buzzivo project are:
1. To develop a **web-based Dashboard** for restaurant employees to input orders, assign customer devices, and trigger notification alerts.
2. To design an **ESP32-based Customer Device** that provides visual (LED and screen) and auditory (Buzzer) feedback.
3. To implement a **Countdown Timer** feature on the customer device, updated in real-time by the dashboard, to inform customers of their exact wait time.
4. To establish reliable, low-latency wireless communication between the software dashboard and the hardware devices over a local network.

## 7. Methodology
The development of Buzzivo is divided into Hardware Design, Software Development, and System Integration:

### 7.1 Hardware Architecture
- **Microcontroller:** ESP32 is used for its built-in Wi-Fi capabilities and robust processing power.
- **Output Components:** 
  - **Buzzer:** To provide an audible alert when the order is ready.
  - **LEDs:** To provide visual statuses (e.g., waiting, ready).
  - **Display (Optional/OLED):** To show the live countdown timer.
- **Input Components:** A mute/stop button for the customer to acknowledge the alert upon picking up the food.

### 7.2 Software Architecture
- **Frontend Dashboard:** Built using HTML, CSS (for a modern, clean UI), and JavaScript. It features an interface to set timers, update order statuses, and trigger ready alerts.
- **Backend Communication:** A lightweight server (e.g., Python/Flask or Node.js) handles WebSocket or MQTT communication to broadcast signals instantly from the dashboard to the respective IP addresses of the ESP32 devices.
- **ESP32 Firmware:** Programmed in C++ (via Arduino IDE), the firmware continuously listens for network payloads. Upon receiving a "timer update," it starts the local countdown. Upon receiving a "ready" signal, it triggers the GPIO pins connected to the buzzer and LED.

### 7.3 Workflow
1. Customer places an order. Employee assigns a Buzzivo device (e.g., Device #3) and sets a preparation timer (e.g., 10 minutes) on the Dashboard.
2. The Dashboard sends the timer data to Device #3 over Wi-Fi.
3. Device #3 displays the countdown. The customer sits comfortably at their table.
4. Once food is prepared, the employee clicks the "Notify" button for Device #3 on the Dashboard.
5. Device #3 flashes the LED and sounds the Buzzer. 
6. Customer proceeds to the counter, collects food, and hands over the device (or presses the mute button).

## 8. Results and Discussion
Testing of the Buzzivo prototype yielded the following positive outcomes:
- **Communication Latency:** The delay between clicking "Notify" on the dashboard and the ESP32 reacting was effectively unnoticeable (under 200ms) on a local network.
- **Timer Accuracy:** The wait time was accurately reflected on the devices and could be modified on-the-fly by the admin dashboard.
- **User Interface:** The dashboard was intuitive for employees to use alongside standard billing operations.
- **Reliability:** The ESP32 successfully maintained its network connection and successfully recovered from simulated brief network dropouts.

## 9. Conclusion
The **Buzzivo** project successfully bridges the gap between software order management and physical customer notification. By utilizing the ESP32 platform integrated with a modern web frontend, the project provides a vastly superior alternative to traditional restaurant pagers. It eliminates the anxiety of waiting by introducing real-time timers and completely declutters the physical space near the restaurant counters. Future scopes for this project include integrating it directly with POS billing APIs, adding battery management features to the hardware, and utilizing mesh networking for extremely large food courts to extend range.

## 10. References
1. Espressif Systems. (2023). *ESP32 Technical Reference Manual*. 
2. MDN Web Docs. (n.d.). *WebSockets API*. Mozilla.
3. Arduino. (n.d.). *Arduino Reference - C++*. 
4. Relevant literature on IoT applications in the hospitality industry.
