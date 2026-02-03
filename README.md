# GigChain

A React Native mobile application for managing gig economy workflows and payments.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (>= 20.x)
- **npm** or **yarn**
- **React Native CLI** (`npm install -g react-native-cli`)

### For Android Development:
- **Android Studio** with Android SDK
- **Java Development Kit (JDK)** 17 or newer
- Android Virtual Device (AVD) or physical Android device

### For iOS Development (macOS only):
- **Xcode** (latest version)
- **CocoaPods** (`sudo gem install cocoapods`)
- iOS Simulator or physical iOS device

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd gigchain
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install iOS Dependencies (macOS only)

```bash
cd ios
pod install
cd ..
```

### 4. Start the Metro Bundler

```bash
npm start
```

### 5. Run the Application

#### Android

```bash
npm run android
```

Make sure you have an Android emulator running or a device connected via USB with debugging enabled.

#### iOS (macOS only)

```bash
npm run ios
```

Make sure you have an iOS simulator running or a physical device connected.

## Project Structure

```
gigchain/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # Screen components
│   └── navigation/      # Navigation configuration
├── android/             # Android native code
├── ios/                 # iOS native code
├── __tests__/          # Test files
└── App.tsx             # Root component
```

## Available Scripts

- `npm start` - Start the Metro bundler
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm test` - Run tests with Jest
- `npm run lint` - Run ESLint

## Features

- Custom navigation with React Navigation
- Type-safe development with TypeScript
- Modular component architecture
- Profile management
- Payment processing screens

## Troubleshooting

### Android Build Issues

- Clean the build: `cd android && ./gradlew clean && cd ..`
- Reset Metro cache: `npm start -- --reset-cache`
- Ensure Android SDK is properly configured in Android Studio

### iOS Build Issues

- Clean build folder in Xcode: Product → Clean Build Folder
- Reinstall pods: `cd ios && pod deintegrate && pod install && cd ..`
- Reset Metro cache: `npm start -- --reset-cache`

### Metro Bundler Issues

```bash
# Reset cache and restart
npm start -- --reset-cache
```

## Development

This project uses:
- **React Native** 0.83.1
- **React** 19.2.0
- **React Navigation** for routing
- **TypeScript** for type safety
- **Jest** for testing

## License

See the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
