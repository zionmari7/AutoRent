# AutoRent Mobile — React Native Android App

> Complete setup guide. Follow every step in order.

---

## Prerequisites — Install These First

### 1. Node.js (v18 or later)
Download from https://nodejs.org

### 2. Java Development Kit (JDK 17)
```bash
# Windows — use installer from:
https://adoptium.net/temurin/releases/?version=17

# macOS (with Homebrew)
brew install --cask temurin@17

# Verify
java -version   # should show "17.x.x"
```

### 3. Android Studio
Download from https://developer.android.com/studio

During setup, make sure these are checked:
- ✅ Android SDK
- ✅ Android SDK Platform
- ✅ Android Virtual Device (AVD)

After install, open Android Studio → More Actions → SDK Manager and install:
- Android SDK Platform **35** (Android 15)
- Android SDK Build-Tools **35.0.0**

### 4. Set Environment Variables

**Windows** (add to System Environment Variables):
```
ANDROID_HOME = C:\Users\YourName\AppData\Local\Android\Sdk
Add to PATH:  %ANDROID_HOME%\emulator
              %ANDROID_HOME%\platform-tools
```

**macOS / Linux** (add to `~/.zshrc` or `~/.bashrc`):
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Reload: `source ~/.zshrc`

### 5. React Native CLI
```bash
npm install -g react-native-cli
```

---

## Project Setup

### Step 1 — Initialize React Native project
```bash
# Inside the autorent/mobile folder, create the RN project
npx react-native@0.75.4 init AutoRentApp --template react-native-template-typescript

# Then copy our source files into it:
cp -r src/         AutoRentApp/src/
cp App.tsx         AutoRentApp/App.tsx
cp package.json    AutoRentApp/package.json   # replace the generated one
cp babel.config.js AutoRentApp/babel.config.js
cp tsconfig.json   AutoRentApp/tsconfig.json
```

### Step 2 — Install dependencies
```bash
cd AutoRentApp
npm install
```

### Step 3 — Link native modules
```bash
# react-native-vector-icons (for icon fonts)
npx react-native-asset

# iOS only (skip for Android-only)
cd ios && pod install && cd ..
```

### Step 4 — Add Google Maps API Key (for MapView)

Open `AutoRentApp/android/app/src/main/AndroidManifest.xml`

Find the `<application>` tag and add inside it:
```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_GOOGLE_MAPS_API_KEY_HERE"/>
```

Get a free API key at: https://console.cloud.google.com
Enable: **Maps SDK for Android**

> **Tip:** For testing without a Maps key, comment out the `<MapView>` in TrackingScreen.tsx
> and use a placeholder view instead.

### Step 5 — Add Picker package
```bash
npm install @react-native-picker/picker
cd android && ./gradlew clean && cd ..
```

---

## Running on Android Emulator

### Create a Virtual Device
1. Open Android Studio
2. Tools → Device Manager → Create Virtual Device
3. Choose: **Pixel 6** (or any)
4. System Image: **Android 15 (API 35)**
5. Click Finish, then the ▶ Play button to start the emulator

### Run the app
```bash
# Terminal 1 — start Metro bundler
npx react-native start

# Terminal 2 — deploy to emulator
npx react-native run-android
```

The app should appear on the emulator in ~2 minutes.

---

## Running on a Real Android Phone

### 1. Enable Developer Options on your phone
- Settings → About Phone → tap **Build Number** 7 times
- Settings → Developer Options → turn on **USB Debugging**

### 2. Connect via USB
```bash
adb devices   # your phone should appear
```

### 3. Update API base URL
Open `src/services/api.ts` and change:
```typescript
// Emulator uses: 10.0.2.2 (maps to your PC's localhost)
const BASE_URL = 'http://10.0.2.2:3000/api';

// Real device — use your PC's Wi-Fi IP address
// Find it: ipconfig (Windows) or ifconfig (Mac/Linux)
const BASE_URL = 'http://192.168.1.XXX:3000/api';
```

Make sure your phone and PC are on the **same Wi-Fi network**.

### 4. Run
```bash
npx react-native run-android
```

---

## Connect to the Backend

The mobile app talks to the same Express + SQLite backend as the web app.

```
┌────────────────────┐        HTTP/JSON       ┌─────────────────────┐
│   Android App      │  ──────────────────►   │  Express Backend    │
│  (React Native)    │  ◄────────────────────  │  localhost:3000     │
└────────────────────┘                        └─────────────────────┘
                                                       │
                                               drivefleet.db (SQLite)
```

Make sure the backend is running before launching the app:
```bash
cd autorent/backend
npm run dev    # keep this running
```

---

## Building a Release APK

```bash
cd android

# Generate signing key (first time only)
keytool -genkeypair -v \
  -storefile autorent.keystore \
  -alias autorent \
  -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
./gradlew assembleRelease
```

APK output: `android/app/build/outputs/apk/release/app-release.apk`

Transfer to your phone and install!

---

## Project Structure

```
mobile/
├── App.tsx                    ← Root component
├── src/
│   ├── theme/index.ts         ← Colors, fonts, spacing constants
│   ├── services/api.ts        ← All HTTP calls to the backend
│   ├── components/index.tsx   ← Shared UI: Card, Button, Badge, etc.
│   ├── navigation/
│   │   └── AppNavigator.tsx   ← Bottom tab + stack navigation
│   └── screens/
│       ├── DashboardScreen.tsx
│       ├── FleetScreen.tsx
│       ├── RentalsScreen.tsx
│       ├── CustomersScreen.tsx
│       ├── PaymentsScreen.tsx
│       ├── TrackingScreen.tsx ← MapView + live vehicle list
│       └── modals/
│           ├── VehicleModal.tsx
│           ├── RentalModal.tsx
│           ├── CustomerModal.tsx
│           └── PaymentModal.tsx
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `SDK location not found` | Set `ANDROID_HOME` env variable |
| `adb: command not found` | Add `platform-tools` to PATH |
| `Network request failed` | Backend not running, or wrong IP in `api.ts` |
| `Google Maps blank` | Add Google Maps API key to AndroidManifest.xml |
| `Execution failed for task :app:mergeDebugResources` | Run `cd android && ./gradlew clean` |
| Metro bundler port in use | Kill with `npx react-native start --reset-cache` |

---

## Screens Overview

| Screen | Features |
|--------|----------|
| **Dashboard** | Revenue stat, fleet overview, active rentals, live count, recent rentals |
| **Fleet** | Vehicle cards, filter chips, edit/status/delete, Add Vehicle modal |
| **Live Tracking** | Google Maps with colored pins, vehicle list, tap to fly-to, 15s auto-refresh |
| **Rentals** | Summary strip, filter chips, complete rental action, New Rental modal |
| **Customers** | Search, avatar cards with spend stats, Add Customer modal |
| **Payments** | Payment log, method color tags, Record Payment modal |
