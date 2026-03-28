# Rodaki

A React Native Expo mobile application for managing ridesharing trips, payments, and passenger communications. Built with TypeScript, Firebase, and React Navigation.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Firebase Setup](#firebase-setup)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

## 🎯 Project Overview

Rodaki is a full-featured ridesharing platform with distinct user roles:

- **Drivers**: Register via the app, manage passengers, track trips, and handle payments
- **Passengers**: Registered by drivers, can schedule trips, upload payment receipts, and receive notifications

### Key Features

- 🔐 Firebase Authentication (Email/Password)
  - Drivers can self-register through the app
  - Passengers are registered by their assigned driver
- 📍 Trip management and scheduling
- 💳 Payment tracking and receipt uploads
- 🔔 Push notifications via Expo
- 📸 Image picker for payment verification
- 👥 Dual-role user system (Driver/Passenger)
- 🌐 Cross-platform support (iOS, Android, Web)

### Tech Stack

- **Framework**: Expo 54.0 + React Native 0.81.5
- **Language**: TypeScript
- **State Management**: Zustand
- **Backend**: Firebase (Auth, Firestore, Storage)
- **UI Library**: React Native Paper
- **Navigation**: React Navigation
- **Notifications**: Expo Notifications
- **Storage**: Async Storage

---

## 📦 Prerequisites

Before running the project, ensure you have installed:

1. **Node.js** (v18.x or higher) - [Download](https://nodejs.org/)
   ```bash
   node --version  # Verify installation
   ```

2. **npm or yarn** (comes with Node.js)
   ```bash
   npm --version   # Verify npm
   ```

3. **Expo CLI** (recommended globally)
   ```bash
   npm install -g expo-cli
   ```

4. **Git** (optional, for version control)

### Mobile Device/Emulator Options

Choose one of the following for testing:

- **Expo Go App** (easiest for development)
  - [iOS App Store](https://apps.apple.com/app/expo-go/id1618559407)
  - [Android Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

- **iOS Development**
  - Xcode installed on macOS (for building/running on iOS)
  - Apple Developer account (for physical device testing)

- **Android Development**
  - Android Studio with Android SDK (for emulator or physical device)
  - Or use the Expo Go app

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Rodaki
```

### Step 2: Install Dependencies

Using npm:
```bash
npm install
```

Or using yarn:
```bash
yarn install
```

### Step 3: Install Expo CLI (if not already done)

```bash
npm install -g expo-cli
```

### Step 4: Verify Installation

```bash
expo --version
```

---

## 🔥 Firebase Setup

The app uses Firebase for authentication, database, and storage. You must configure Firebase credentials before running the app.

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a new project"**
3. Enter project name (e.g., "Rodaki") and continue
4. Wait for project creation to complete

### Step 2: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (⚙️ icon)
2. Select the **"Your apps"** section
3. Create a new **Web App** if you don't have one
4. Copy the Firebase configuration object

Your config will look like:
```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
}
```

### Step 3: Add Configuration to Project

Open [src/services/firebase.ts](src/services/firebase.ts) and replace the empty `firebaseConfig` object:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSy...",                          // Your API Key
  authDomain: "your-project.firebaseapp.com",   // Your Auth Domain
  projectId: "your-project-id",                 // Your Project ID
  storageBucket: "your-project.appspot.com",    // Your Storage Bucket
  messagingSenderId: "123456789",               // Your Messaging Sender ID
  appId: "1:123456789:web:abc123def456",        // Your App ID
};
```

### Step 4: Enable Required Firebase Services

In Firebase Console:

1. **Authentication**
   - Go to **Authentication** → **Sign-in method**
   - Enable **Email/Password**

2. **Firestore Database**
   - Go to **Firestore Database**
   - Click **Create database**
   - Start in **test mode** (for development)
   - Choose a region (e.g., `us-central1`)



---

## ▶️ Running the Project

### Option 1: Development Server (Fastest)

Start the Expo development server:

```bash
npm start
```

Or:
```bash
expo start
```

You'll see a menu with platform options:
- Press **i** to open on iOS Simulator
- Press **a** to open on Android Emulator
- Press **w** to open in web browser
- Press **s** to send app link via QR code
- Press **j** to open debugger

### Option 2: Run on iOS

**Using iOS Simulator** (requires Xcode on macOS):
```bash
npm run ios
```

**Using physical device**:
1. Install Expo Go from App Store
2. Run: `npm start`
3. Press **s** to get QR code
4. Scan QR code with iPhone camera and open link in Expo Go

### Option 3: Run on Android

**Using Android Emulator**:
```bash
npm run android
```

Make sure Android emulator is running first (via Android Studio).

**Using physical device**:
1. Install Expo Go from Google Play
2. Run: `npm start`
3. Press **s** to get QR code
4. Open Expo Go app and scan QR code

### Option 4: Run on Web

Display the app in your browser:
```bash
npm run web
```

Opens at `http://localhost:19006`

---

## 📁 Project Structure

```
Rodaki/
├── src/
│   ├── @types/              # TypeScript type definitions
│   │   ├── navigation.types.ts
│   │   ├── payment.types.ts
│   │   ├── trip.types.ts
│   │   └── user.types.ts
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Shared components (Avatar, Badge, Button, etc.)
│   │   └── forms/           # Form-specific components
│   ├── constants/           # App constants
│   │   ├── routes.ts        # Navigation route names
│   │   └── theme.ts         # UI theme configuration
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts       # Authentication hook
│   │   ├── useNotifications.ts
│   │   ├── usePassengers.ts
│   │   └── usePayments.ts
│   ├── navigation/          # Navigation setup
│   │   ├── AppNavigator.tsx     # Main app navigator
│   │   ├── AuthNavigator.tsx    # Auth screens
│   │   ├── DriverNavigator.tsx  # Driver flows
│   │   └── PassengerNavigator.tsx # Passenger flows
│   ├── screens/             # Screen components
│   │   ├── auth/            # Login/Register screens
│   │   ├── driver/          # Driver-specific screens
│   │   └── passenger/       # Passenger-specific screens
│   ├── services/            # Business logic services
│   │   ├── auth.service.ts  # Auth operations
│   │   ├── firebase.ts      # Firebase init & config
│   │   ├── trip.service.ts
│   │   ├── payment.service.ts
│   │   └── notification.service.ts
│   ├── store/               # Zustand state management
│   │   ├── auth.store.ts
│   │   ├── passengers.store.ts
│   │   ├── payment.store.ts
│   │   └── trip.store.ts
│   └── utils/               # Utility functions
│       ├── formatters.ts    # Data formatting helpers
│       └── validators.ts    # Input validation
├── assets/                  # App icons, splash screen, etc.
├── app.json                 # Expo configuration
├── App.tsx                  # App entry point
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript configuration
└── babel.config.js          # Babel configuration
```

---

## 🔄 Development Workflow

### Hot Reloading

The Expo development server supports fast refresh:

- **Save a file** → App updates automatically
- Changes appear within 1-2 seconds
- Preserves app state when possible

### Debugging

#### Using Expo DevTools

Press these keys in the development server:

- **j** → Open JavaScript debugger
- **r** → Restart app
- **m** → Toggle menu
- **p** → Toggle device performance monitor

#### Using React Developer Tools

1. Install React DevTools: `npm install -g react-devtools`
2. Run: `react-devtools`
3. A window opens connecting to your debugger

### Common npm Scripts

```bash
npm start         # Start development server
npm run android   # Run on Android emulator
npm run ios       # Run on iOS simulator
npm run web       # Run on web browser
```

---

## 🐛 Troubleshooting

### Problem: "Cannot find module '@types/...'"

**Solution**: Ensure path aliases are configured correctly in `tsconfig.json`. Restart Expo server:
```bash
npm start
```

### Problem: Firebase credentials are empty

**Solution**: Verify you've added Firebase config to [src/services/firebase.ts](src/services/firebase.ts). The app will not authenticate until this is set.

```bash
# To verify, check for these error patterns in console:
# "authDomain is required for Auth"
# "Firebase SDK initialization failed"
```

### Problem: App crashes on Android

**Solution**: Try clearing cache and reinstalling:
```bash
npm start -- --clear
```

Then restart your Android emulator.

### Problem: "EADDRINUSE: address already in use"

**Solution**: Another Expo server is running on port 19000. Kill it:
```bash
# macOS/Linux
lsof -i :19000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or just use a different port
expo start --port 19001
```

### Problem: iOS simulator doesn't open

**Solution**: Make sure Xcode is installed and launch simulator first:
```bash
open -a Simulator
npm run ios
```

### Problem: "Cannot read property 'getApps' of undefined"

**Solution**: Firebase initialization failed. Check:
1. Firebase credentials are correctly set in [src/services/firebase.ts](src/services/firebase.ts)
2. No typos in configuration object
3. Restart development server: `npm start`

---

## 📱 Testing a New Screen/Feature

After creating a new screen:

1. **Add navigation route** in [src/constants/routes.ts](src/constants/routes.ts)
2. **Register in navigator** (e.g., [src/navigation/DriverNavigator.tsx](src/navigation/DriverNavigator.tsx))
3. **Test with Hot Reload**:
   ```bash
   npm start
   ```
4. **Navigate to your screen** in the app

---

## 🚢 Building for Production

When ready to release, use EAS Build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure your project
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

Update your `app.json` with a valid EAS project ID before building.

---

## 📚 Useful Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Navigation Guide](https://reactnavigation.org/)
- [React Native Paper UI](https://callstack.github.io/react-native-paper/)

---

## 📄 License

This project is private and proprietary.
