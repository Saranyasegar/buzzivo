#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino_JSON.h>
#include <TM1637Display.h> // Include TM1637 library for LED Display

// --- CONFIGURATION START ---

const char* ssid = "YOUR_WIFI_NAME";        // <--- ENTER YOUR WIFI NAME
const char* password = "YOUR_WIFI_PASSWORD"; // <--- ENTER YOUR WIFI PASSWORD

// Server IP (Your PC's IP Address)
// Example: "http://192.168.1.10:5000/api/device_poll/"
// Check the terminal running python app.py for the correct IP.
const char* serverName = "http://172.28.216.70:5000/api/device_poll/"; 

// Device Identity
const String deviceNumber = "101"; // <--- CHANGE THIS for each unique device (101, 102, etc.)

// --- CONFIGURATION END ---

// Pins
const int BUZZER_PIN = 2; // User specified GPIO 2
const int VIBRATION_PIN = 4; // Default Vibration Motor Pin (Change if needed)
const int LED_PIN = 12;   // Default LED Pin (Change if needed)
const int BUTTON_PIN = 13;// Default Button Pin (Change if needed)

// TM1637 Display Pins
const int CLK_PIN = 22;   // Connect CLK to GPIO 22
const int DIO_PIN = 23;   // Connect DIO to GPIO 23

// State
bool isAlerting = false;
bool isMuted = false;
unsigned long lastPollTime = 0;
const long pollInterval = 2000; // Poll every 2 seconds

// Display Object
TM1637Display display(CLK_PIN, DIO_PIN);

void setup() {
  Serial.begin(115200);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(VIBRATION_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // Set display brightness
  display.setBrightness(0x0f); // Max brightness
  display.clear();

  // Initial State: OFF
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(VIBRATION_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  // Connect to Wi-Fi
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("Connected to WiFi");
  Serial.print("Device IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // 1. Check Button for Mute
  if (digitalRead(BUTTON_PIN) == LOW) {
    if (isAlerting && !isMuted) {
      Serial.println("Button Pressed: Muting");
      isMuted = true;
      stopAlert();
    }
    delay(200); // Debounce
  }

  // 2. Poll Server
  if (millis() - lastPollTime > pollInterval) {
    lastPollTime = millis();
    if(WiFi.status() == WL_CONNECTED){
      pollServer();
    } else {
      Serial.println("WiFi Disconnected. Reconnecting...");
      WiFi.reconnect();
    }
  }

  // 3. Handle Alert Effects
  if (isAlerting) {
    // Blinking LED (happens in both states)
    digitalWrite(LED_PIN, (millis() / 200) % 2); 
    
    if (!isMuted) {
      // Unmuted: Buzz and Vibrate
      digitalWrite(BUZZER_PIN, HIGH); 
      digitalWrite(VIBRATION_PIN, HIGH);
    } else {
      // Muted: Vibrate only, no Buzz
      digitalWrite(BUZZER_PIN, LOW);
      digitalWrite(VIBRATION_PIN, HIGH);
    }
  } else {
    stopAlert();
  }
  
  delay(50);
}

void pollServer() {
  HTTPClient http;
  String url = String(serverName) + deviceNumber;
  
  http.begin(url.c_str());
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String payload = http.getString();
    // Payload e.g. {"alert": true}
    
    JSONVar myObject = JSON.parse(payload);
    
    if (JSON.typeof(myObject) == "undefined") {
      Serial.println("Parsing input failed!");
      return;
    }
    
    bool shouldAlert = (bool)myObject["alert"];
    int remainingSeconds = (int)myObject["remaining_seconds"];
    
    // Display Remaining Time
    if (remainingSeconds > 0 && !shouldAlert) {
        int minutes = remainingSeconds / 60;
        int seconds = remainingSeconds % 60;
        int displayTime = (minutes * 100) + seconds;
        // Blink colon
        bool showColon = (millis() / 500) % 2 == 0;
        display.showNumberDecEx(displayTime, showColon ? 0b01000000 : 0, true);
    } else if (!shouldAlert) {
        display.clear();
    } else {
        // When alerting, we can show "00:00" or blink it
        bool showColon = (millis() / 200) % 2 == 0;
        if (showColon) {
             display.showNumberDecEx(0, 0b01000000, true);
        } else {
             display.clear();
        }
    }
    
    if (shouldAlert) {
      if (!isAlerting) {
        // New Alert!
        Serial.println("Alert Received!");
        isAlerting = true;
        isMuted = false; 
      }
    } else {
      // Server says stop
      if (isAlerting) {
        Serial.println("Alert Stopped by /complete");
        isAlerting = false;
        isMuted = false;
        stopAlert();
      }
    }
  }
  else {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
  }
  http.end();
}

void stopAlert() {
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(VIBRATION_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
}
