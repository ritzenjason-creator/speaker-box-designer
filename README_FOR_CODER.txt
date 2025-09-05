# Speaker Box Designer - Full Feature App

## 1. Requirements
- Node.js (LTS) installed
- Expo CLI installed globally (`npm install -g expo-cli`)
- iOS or Android device with Expo Go installed for testing
- Git installed (optional, but useful)

## 2. Installing Dependencies
1. Open a terminal and navigate to the project folder:
   cd speaker-box-designer
2. Install dependencies:
   npm install

## 3. Running the App
- Start development server:
  npx expo start
- Scan the QR code with Expo Go (on iOS use the Camera app if QR scanning is enabled, or use the Expo Go app directly)

## 4. Building for TestFlight (iOS)
1. Make sure you are signed in with an Apple Developer account in Expo:
   expo login
2. Run:
   eas build -p ios
3. Follow prompts to configure Apple certificates
4. Once build is complete, upload to TestFlight

## 5. Features Included
- Ported, Sealed, 4th & 6th order bandpass enclosure calculators
- Full-resolution SPL + port velocity graphs
- Velocity warning indicators
- Slot port mode & geometry helpers
- Cut-sheet calculator for panel dimensions
- DXF/SVG export for CNC/laser cutting
- Preset loader/saver

## 6. File Layout
- App.tsx (main app logic)
- src/presets.js (preloaded drivers/boxes)
- src/math/tsMath.js (all enclosure calculation functions)
- src/export/exportDXF.js (DXF/SVG cut-sheet exporter)

## 7. Notes
- Charts are built using `victory-native` and `react-native-svg`
- DXF/SVG export currently outputs via console log — can be wired to file sharing API
- All formulas based on WinISD, BassBox Pro, and provided equations

