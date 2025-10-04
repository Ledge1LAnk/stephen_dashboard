#include <Arduino.h>
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <PZEM004Tv30.h>

// === PZEM Wiring for ESP32 DevKitC ===
// PZEM TX → GPIO16 (RX2)
// PZEM RX ← GPIO17 (TX2)
// Use a voltage divider or level shifter on PZEM TX → ESP32 RX

// WiFi credentials
#define WIFI_SSID "SMEM_2025"
#define WIFI_PASSWORD "SMEM_2025"

// Firebase configuration
#define FIREBASE_HOST "smart-energy-management-meter-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "AIzaSyAiDlSZC8NqsL1k2ZCtYk2t51WjFoO8HC0"


// PZEM Configuration
#define PZEM_RX_PIN 16
#define PZEM_TX_PIN 17
#define PZEM_SERIAL Serial2

// Relay Pins (Active LOW - turns on when pulled to GND)
#define LIGHT_1 27
#define LIGHT_2 26
#define OUTLET_1 25
#define OUTLET_2 33


// Firebase objects
FirebaseData firebaseData;
FirebaseAuth auth;
FirebaseConfig config;

// PZEM object
PZEM004Tv30 pzem(PZEM_SERIAL, PZEM_RX_PIN, PZEM_TX_PIN);

// Relay states
bool relayStates[4] = {false}; // Stores states for all 4 relays
const int relayPins[4] = {LIGHT_1, LIGHT_2, OUTLET_1, OUTLET_2};

// Timing variables
unsigned long lastDataSend = 0;
const unsigned long dataSendInterval = 1000; // Send data every 1 second

// Energy measurement
float totalEnergyWh = 0.0;        // Total energy in Watt-hours
float sessionEnergyWh = 0.0;      // Energy since last reset
unsigned long lastMeasurementTime = 0;
bool energyResetFlag = false;


void setup() {
  Serial.begin(115200);
  delay(1000);

  // Initialize relay pins (Active LOW)
  for (int i = 0; i < 4; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], HIGH); // Start with all relays OFF
  }

  // Initialize PZEM serial
  PZEM_SERIAL.begin(9600, SERIAL_8N1, PZEM_RX_PIN, PZEM_TX_PIN);
  
  Serial.println("ESP32 Smart Energy Monitor Started");
  Serial.println("Initializing PZEM-004T V3...");
  
  // Connect to WiFi
  Serial.println();
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());

  // Initialize Firebase (simplified like working projects)
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  // Set database read/write timeout (like working projects)
  firebaseData.setBSSLBufferSize(1024, 1024);
  firebaseData.setResponseSize(1024);
  
  Serial.println("Firebase initialized");
  
  // Note: Initial Firebase values will be set when first data is sent

  // Test PZEM connection with detailed debugging
  Serial.println("Testing PZEM-004T V3 connection...");
  Serial.println("PZEM Wiring Check:");
  Serial.println("- TX (PZEM) -> GPIO16 (ESP32)");
  Serial.println("- RX (PZEM) -> GPIO17 (ESP32)");  
  Serial.println("- GND (PZEM) -> GND (ESP32)");
  Serial.println("- VCC (PZEM) -> 5V or 3.3V (ESP32)");
  Serial.println("- PZEM must be connected to AC mains power");
  
  delay(1000); // Give PZEM time to initialize
  
  float testVoltage = pzem.voltage();
  delay(200);
  float testCurrent = pzem.current();
  delay(200);
  
  Serial.print("Raw PZEM readings - Voltage: ");
  Serial.print(testVoltage);
  Serial.print("V, Current: ");
  Serial.print(testCurrent);
  Serial.println("A");
  
  if (isnan(testVoltage) && isnan(testCurrent)) {
    Serial.println("❌ PZEM-004T V3 not responding!");
    Serial.println("Troubleshooting:");
    Serial.println("1. Check PZEM power LED is ON");
    Serial.println("2. Verify AC mains connection to PZEM");
    Serial.println("3. Check wiring connections");
    Serial.println("4. Try different baud rate or reset PZEM");
  } else {
    Serial.println("✅ PZEM-004T V3 responding correctly");
  }
  
  Serial.println("System initialization complete!");
}

void sendToFirebase() {
  // Read PZEM sensor values (simplified like working projects)
  float voltage = pzem.voltage();
  float current = pzem.current();
  float power = pzem.power();
  float energy = pzem.energy();  // in kWh
  float frequency = pzem.frequency();
  float pf = pzem.pf();

  // Simple error handling (like working projects)
  if (isnan(voltage) || isnan(current) || isnan(power) || isnan(energy) || isnan(frequency) || isnan(pf)) {
    Serial.println("Error reading PZEM sensor values");
    return;
  }

  // Calculate session energy
  unsigned long currentTime = millis();
  float timeElapsedHours = (lastMeasurementTime == 0) ? 0 : (currentTime - lastMeasurementTime) / 3600000.0;
  lastMeasurementTime = currentTime;

  if (power > 0) {
    float energyIncrement = power * timeElapsedHours;
    sessionEnergyWh += energyIncrement;
  }

  if (energyResetFlag) {
    sessionEnergyWh = 0.0;
    energyResetFlag = false;
    Serial.println("Energy counter reset!");
  }

  FirebaseJson json;
  json.set("voltage", voltage);
  json.set("current", current);
  json.set("power", power);
  json.set("energy", sessionEnergyWh / 1000.0); // Convert to kWh
  json.set("frequency", frequency);
  json.set("power_factor", pf);
  json.set("timestamp", millis());

  // Send live data (using working project pattern)
  if (Firebase.setJSON(firebaseData, "/sensor_data", json)) {
    Serial.println("✅ Live data uploaded");

    // Store historical data with millis timestamp
    String timePath = "/history/" + String((unsigned long)(millis() / 1000));
    if (Firebase.setJSON(firebaseData, timePath.c_str(), json)) {
      Serial.println("Historical data stored");
    } else {
      Serial.println("Failed to store history: " + firebaseData.errorReason());
    }
  } else {
    Serial.print("❌ Firebase upload failed: ");
    Serial.println(firebaseData.errorReason());
  }

  lastDataSend = millis();

  // Debug output
  Serial.print("V: ");
  Serial.print(voltage, 1);
  Serial.print("V | I: ");
  Serial.print(current, 3);
  Serial.print("A | P: ");
  Serial.print(power, 2);
  Serial.print("W | PF: ");
  Serial.print(pf, 2);
  Serial.print(" | Freq: ");
  Serial.print(frequency, 1);
  Serial.print("Hz | E: ");
  Serial.print(sessionEnergyWh, 3);
  Serial.println("Wh");
}

void checkRelayStates() {
  for (int i = 0; i < 4; i++) {
    String path = "/control/relay" + String(i+1);
    
    if (Firebase.getBool(firebaseData, path.c_str())) {
      if (firebaseData.dataType() == "boolean") {
        bool newState = firebaseData.boolData();
        if (newState != relayStates[i]) {
          relayStates[i] = newState;
          digitalWrite(relayPins[i], newState ? LOW : HIGH); // Active LOW logic
          Serial.print("Relay ");
          Serial.print(i+1);
          Serial.print(" changed to: ");
          Serial.println(newState ? "ON" : "OFF");
        }
      }
    }
  }
}

void checkMainPower() {
  // Check for main power control (5th control)
  if (Firebase.getBool(firebaseData, "/control/main_power")) {
    if (firebaseData.dataType() == "boolean") {
      bool mainPowerState = firebaseData.boolData();
      
      // Apply main power state to all relays
      for (int i = 0; i < 4; i++) {
        relayStates[i] = mainPowerState;
        digitalWrite(relayPins[i], mainPowerState ? LOW : HIGH); // Active LOW logic
        String path = "/control/relay" + String(i+1);
        Firebase.setBool(firebaseData, path.c_str(), mainPowerState);
      }
      
      Serial.print("Main power changed to: ");
      Serial.println(mainPowerState ? "ON" : "OFF");
    }
  }
}

void loop() {
  // Check WiFi connection first
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, attempting reconnection...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    delay(5000);
    return;
  }
  
  // Try Firebase operations with retry logic
  static unsigned long lastFirebaseAttempt = 0;
  static int firebaseRetryCount = 0;
  
  if (Firebase.ready()) {
    checkRelayStates();             // Read remote control states
    checkMainPower();               // Check main power control

    if (millis() - lastDataSend >= dataSendInterval) {
      sendToFirebase();             // Send stored measurements
      firebaseRetryCount = 0;       // Reset retry count on success
    }
  } else {
    // Firebase not ready - implement retry logic
    if (millis() - lastFirebaseAttempt > 10000) { // Try every 10 seconds
      Serial.println("Firebase not ready, attempting reconnection...");
      Firebase.begin(&config, &auth);
      lastFirebaseAttempt = millis();
      firebaseRetryCount++;
      
      if (firebaseRetryCount > 5) {
        Serial.println("Firebase connection failed multiple times, restarting WiFi...");
        WiFi.disconnect();
        delay(1000);
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        firebaseRetryCount = 0;
      }
    }
    delay(1000);
  }

  // Handle serial commands
  if (Serial.available()) {
    char c = Serial.read();
    if (c == 'r' || c == 'R') {
      energyResetFlag = true;
      Serial.println("Energy counter reset requested");
    }
  }

  delay(50); // Prevent watchdog resets
}