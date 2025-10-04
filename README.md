# Smart Energy Monitoring & Management System

A comprehensive IoT-based energy monitoring and management system using ESP32, PZEM-004T V3 energy meter, and Firebase for real-time data storage and web interface.

## Features

- **Real-time Energy Monitoring**: Voltage, Current, Power, Energy, Frequency, and Power Factor
- **Smart Relay Control**: 4 individually controllable relays for lights and outlets
- **Power Switch**: Emergency power-off button that turns off all relays
- **Real-time Charts**: Live power consumption and historical energy usage charts
- **Firebase Integration**: Cloud-based data storage and real-time synchronization
- **Responsive Web Interface**: Modern, mobile-friendly dashboard
- **Historical Data**: Energy consumption tracking with time-based filtering

## Hardware Requirements

### ESP32 DevKit
- GPIO 16 (RX2) → PZEM TX
- GPIO 17 (TX2) → PZEM RX
- GPIO 4 → Relay 1 (Light 1)
- GPIO 5 → Relay 2 (Light 2)
- GPIO 18 → Relay 3 (Outlet 1)
- GPIO 19 → Relay 4 (Outlet 2)
- GPIO 2 → Status LED

### PZEM-004T V3 Energy Meter
- **Input**: 80-260V AC, 50/60Hz
- **Current Range**: 0-100A
- **Accuracy**: Class 1.0
- **Communication**: Modbus RTU over RS485

### Relay Module
- 4-channel relay module (Active LOW)
- 5V or 12V operation
- Maximum 10A per channel

## Wiring Diagram

```
ESP32 DevKit          PZEM-004T V3
┌─────────┐          ┌─────────────┐
│         │          │             │
│ GPIO 16 ├─────────┤ TX          │
│         │          │             │
│ GPIO 17 ├─────────┤ RX          │
│         │          │             │
│   GND   ├─────────┤ GND         │
└─────────┘          └─────────────┘

ESP32 DevKit          Relay Module
┌─────────┐          ┌─────────────┐
│         │          │             │
│ GPIO 4  ├─────────┤ IN1         │
│         │          │             │
│ GPIO 5  ├─────────┤ IN2         │
│         │          │             │
│ GPIO 18 ├─────────┤ IN3         │
│         │          │             │
│ GPIO 19 ├─────────┤ IN4         │
│         │          │             │
│   GND   ├─────────┤ GND         │
└─────────┘          └─────────────┘
```

## Software Setup

### 1. PlatformIO Configuration
The project uses PlatformIO with the following dependencies:
- `pzem004t` - PZEM-004T V3 library
- `firebase-esp32` - Firebase ESP32 library
- `wifi` - WiFi library

### 2. Firebase Setup
1. Create a new Firebase project
2. Enable Realtime Database
3. Set database rules to allow read/write
4. Update the Firebase configuration in `src/main.cpp`

### 3. WiFi Configuration
Update the WiFi credentials in `src/main.cpp`:
```cpp
#define WIFI_SSID "Your_WiFi_SSID"
#define WIFI_PASSWORD "Your_WiFi_Password"
```

## Web Interface

The web interface is split into three files:
- `index.html` - Main HTML structure
- `styles.css` - Styling and responsive design
- `script.js` - Firebase integration and chart functionality

### Features
- **Real-time Dashboard**: Live energy readings
- **Interactive Charts**: Power consumption and energy history
- **Relay Controls**: Individual toggle switches for each relay
- **Power Switch**: Emergency power-off button
- **Time Range Selection**: 24h, 7d, 4w historical views
- **Connection Status**: Real-time Firebase connection indicator

## Deployment

### ESP32
1. Connect hardware according to wiring diagram
2. Update WiFi and Firebase credentials
3. Upload code using PlatformIO
4. Monitor serial output for debugging

### Web Interface
1. Host files on GitHub Pages or any web server
2. Update Firebase configuration in `script.js`
3. Ensure CORS is properly configured

## Data Structure

### Firebase Database Schema
```
/sensor_data
├── voltage: float
├── current: float
├── power: float
├── energy: float (kWh)
├── frequency: float
├── power_factor: float
└── timestamp: long

/control
├── relay1: boolean
├── relay2: boolean
├── relay3: boolean
├── relay4: boolean
└── power_switch: boolean

/history
└── {timestamp}
    ├── voltage: float
    ├── current: float
    ├── power: float
    ├── energy: float
    ├── frequency: float
    └── power_factor: float
```

## Troubleshooting

### Common Issues

1. **PZEM Communication Errors**
   - Check wiring connections
   - Verify voltage levels (PZEM TX may need level shifting)
   - Ensure correct baud rate (9600)

2. **Firebase Connection Issues**
   - Verify WiFi credentials
   - Check Firebase project configuration
   - Ensure database rules allow read/write

3. **Relay Control Problems**
   - Verify relay module power supply
   - Check GPIO pin assignments
   - Ensure relay module is Active LOW

### Debug Commands
- Send 'r' or 'R' via serial monitor to reset energy counter
- Monitor serial output for detailed status information

## Safety Notes

- **High Voltage Warning**: PZEM-004T operates at mains voltage
- **Proper Grounding**: Ensure proper electrical grounding
- **Relay Ratings**: Do not exceed relay current ratings
- **Insulation**: Use proper insulation for all connections

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.
