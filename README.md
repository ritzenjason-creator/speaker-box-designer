# Speaker Box Designer

A professional React Native / Expo mobile application for designing speaker enclosures with real-time acoustic calculations, SPL/frequency response visualization, and automated DXF cut sheet generation for fabrication.

## Features

### 🔊 Acoustic Design

- **Multiple enclosure types**: Sealed, Ported, Bandpass 4th Order, Bandpass 6th Order
- **Real Thiele-Small calculations**: Accurate frequency response modeling using driver T/S parameters
- **Port velocity analysis**: Automatic calculation and validation to prevent turbulence
- **Box resonance calculations**: Fb, F3, Qtc, system Q optimization
- **Preset driver database**: Common woofer specifications for quick prototyping
- **Custom driver support**: Manual input of any driver’s T/S parameters

### 📊 Visualization

- **Real-time SPL curves**: Frequency response graphs updated dynamically
- **Port velocity charts**: Visualize airflow characteristics
- **Impedance curves**: System impedance vs frequency (planned)
- **Phase response**: Phase angle visualization (planned)

### 🔧 Design Tools

- **Interactive parameter adjustment**: Volume, dimensions, port configuration
- **Intelligent warnings**: Automatic detection of design issues
  - High port velocity warnings (>15 m/s)
  - Thin wall thickness alerts (<18mm)
  - Volume ratio recommendations
  - Excessive Q warnings
- **Material specifications**: Wall thickness, bracing patterns, material notes

### 📐 Export & Fabrication

- **DXF cut sheet generation**: Industry-standard CAD format for CNC/router
- **All 6 panels included**: Front, back, left, right, top, bottom with dimensions
- **Automatic material compensation**: Accounts for wall thickness in panel sizing
- **Title block with specs**: Full design metadata embedded in drawings
- **Share directly**: Export to cloud storage, email, or fabrication partners

## Technology Stack

- **Framework**: React Native 0.79.3 + Expo SDK 53
- **Language**: TypeScript 5.8.3 (strict mode, full type safety)
- **Acoustic Calculations**: mathjs (complex math, signal processing)
- **Charting**: Victory Native (native-optimized charts with react-native-svg)
- **DXF Export**: dxf-writer (CAD-standard file generation)
- **Data Utilities**: lodash (data manipulation, driver filtering)
- **State Management**: React hooks (useState, useCallback, useMemo)

## Project Structure

```
speaker-box-designer/
├── src/
│   ├── types/           # TypeScript type definitions
│   ├── data/            # Driver presets, lookup tables
│   ├── utils/           # Acoustic calculations, DXF export, validation
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   └── screens/         # Main app screens
├── assets/              # Icons, splash screens
├── App.tsx              # Main application entry
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Expo CLI (install globally: `npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Studio for emulation

### Setup

```bash
# Clone the repository
git clone https://github.com/ritzenjason-creator/speaker-box-designer.git
cd speaker-box-designer

# Install dependencies
npm install

# Start the development server
npm start

# Run on specific platforms
npm run ios      # iOS simulator (Mac only)
npm run android  # Android emulator
npm run web      # Web browser
```

## Usage

### Basic Workflow

1. **Select a Driver**
- Choose from preset drivers (8”, 10”, 12” woofers)
- Or manually input Thiele-Small parameters:
  - Fs (resonant frequency)
  - Vas (equivalent volume)
  - Qts, Qms, Qes (Q factors)
  - Xmax (excursion limit)
  - Sensitivity, impedance
1. **Configure Enclosure**
- Select enclosure type (sealed/ported/bandpass)
- Set internal volume (liters)
- Define box dimensions (W x H x D)
- Specify wall thickness (18mm+ recommended)
- For ported: configure port diameter, length, quantity
1. **Calculate & Analyze**
- Tap “Calculate” to run acoustic analysis
- Review SPL curve (frequency response)
- Check port velocity (if ported)
- Read design warnings/recommendations
1. **Export for Fabrication**
- Tap “Export DXF”
- Cut sheets generated with all 6 panels
- Share file to email, cloud storage, or CNC operator
- Import DXF into CAD software (AutoCAD, Fusion 360, etc.)

### Example: Sealed Box Design

```typescript
Driver: Generic 10" Woofer
- Fs: 38 Hz
- Vas: 60 L
- Qts: 0.35

Enclosure:
- Type: Sealed
- Volume: 40 L (0.67 x Vas ratio)
- Dimensions: 300mm W x 400mm H x 300mm D
- Wall Thickness: 18mm MDF

Results:
- Fb: 48 Hz (box resonance)
- F3: 52 Hz (-3dB point)
- Qtc: 0.58 (slightly underdamped, punchy bass)
- SPL at resonance: 89 dB
```

### Example: Ported Box Design

```typescript
Driver: Generic 12" Woofer
- Fs: 32 Hz
- Vas: 95 L
- Qts: 0.30

Enclosure:
- Type: Ported
- Volume: 80 L (0.84 x Vas ratio)
- Port: 100mm diameter, 200mm length, qty 1
- Dimensions: 400mm W x 500mm H x 400mm D
- Wall Thickness: 19mm Baltic Birch

Results:
- Fb: 29 Hz (box resonance)
- Fp: 35 Hz (port tuning)
- F3: 32 Hz (-3dB point)
- Port velocity: 12.3 m/s (safe, no turbulence)
- SPL at resonance: 92 dB
```

## Acoustic Theory Background

This app implements industry-standard loudspeaker design calculations:

- **Thiele-Small Parameters**: Driver characterization developed by A.N. Thiele and Richard Small
- **Sealed Box**: Simple compliance-based system, Qtc determines response shape
- **Ported Box (Bass Reflex)**: Helmholtz resonator, extends low frequency response
- **Port Velocity**: Air velocity = (2π × f × Vd) / Sd, kept under 15-17 m/s to avoid turbulence
- **Frequency Response**: Modeled using second-order high-pass filter transfer functions

### Key Formulas

**Sealed Box Resonance:**

```
Fb = Fs × √(1 + Vas/Vb)
Qtc = Qts × √(1 + Vas/Vb)
```

**Port Tuning:**

```
Fp = (c / 2π) × √(Sp / (Vb × Lv))
where c = speed of sound, Sp = port area, Lv = port length
```

## Validation & Warnings

The app provides intelligent design guidance:

|Warning Type          |Threshold |Recommendation                            |
|----------------------|----------|------------------------------------------|
|Port Velocity         |>15 m/s   |Increase port diameter or add second port |
|Port Velocity Critical|>20 m/s   |Severe turbulence risk, redesign required |
|Thin Walls            |<18mm     |Use 18mm+ MDF/plywood to prevent resonance|
|Low Volume            |<0.5 × Vas|Overly small box, peaky response expected |
|High Volume           |>5 × Vas  |Large box reduces efficiency, extends bass|
|Excessive Qtc         |>0.9      |Boomy, underdamped response               |

## DXF Export Details

Generated DXF files include:

- **6 panels** with exact cutting dimensions
- **Material thickness compensation** (joints accounted for)
- **Panel labels** (Front, Back, Left, Right, Top, Bottom)
- **Dimension annotations** (width, height in mm)
- **Title block** with design metadata
- **CAD-compatible format** (AutoCAD R12 DXF standard)

Import into:

- AutoCAD, Fusion 360, SolidWorks (professional CAD)
- VCarve, Aspire (CNC routing software)
- SketchUp, FreeCAD (hobbyist tools)

## Development

### Scripts

```bash
npm start          # Start Expo development server
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator (Mac only)
npm run web        # Run in web browser
npm run typecheck  # Run TypeScript type checking
npm run lint       # Run ESLint code quality checks
```

### Adding Custom Drivers

Edit `src/data/driverPresets.ts`:

```typescript
{
  id: uuidv4(),
  name: 'My Custom Driver',
  fs: 40,        // Resonant frequency (Hz)
  vas: 50,       // Equivalent volume (liters)
  qts: 0.35,     // Total Q
  qms: 5.0,      // Mechanical Q
  qes: 0.37,     // Electrical Q
  xmax: 6,       // Max excursion (mm)
  sensitivity: 87, // dB @ 1W/1m
  impedance: 8,    // Nominal impedance (ohms)
  diameter: 10,    // Woofer diameter (inches)
  power: 150,      // RMS power handling (watts)
}
```

## Roadmap

### Current Status (v1.0)

- ✅ Sealed box calculations
- ✅ Ported box calculations
- ✅ Driver preset database
- ✅ DXF export
- ✅ Basic validation warnings

### Planned Features (v1.1+)

- ⏳ Bandpass 4th order calculations
- ⏳ Bandpass 6th order calculations
- ⏳ Impedance curve visualization
- ⏳ Phase response graphs
- ⏳ Design comparison tool (A/B testing)
- ⏳ Cloud save/sync (Firebase integration)
- ⏳ Driver database import (CSV/JSON)
- ⏳ Advanced port shapes (rectangular, slot ports)
- ⏳ Multi-driver configurations
- ⏳ Crossover design integration

## Contributing

Contributions welcome! Please:

1. Fork the repository
1. Create a feature branch (`git checkout -b feature/amazing-feature`)
1. Commit changes (`git commit -m 'Add amazing feature'`)
1. Push to branch (`git push origin feature/amazing-feature`)
1. Open a Pull Request

### Development Guidelines

- Maintain TypeScript strict mode compliance
- Add tests for acoustic calculations (accuracy critical)
- Follow existing code style (ESLint rules)
- Update documentation for new features

## License

MIT License - see LICENSE file for details

## Acknowledgments

- **Thiele-Small Theory**: A.N. Thiele & Richard Small (pioneering loudspeaker research)
- **Acoustic Formulas**: “Loudspeaker Design Cookbook” by Vance Dickason
- **DXF Standard**: Autodesk DXF R12 specification
- **React Native Community**: Expo team, Victory Native maintainers

## Support

- **Issues**: [GitHub Issues](https://github.com/ritzenjason-creator/speaker-box-designer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ritzenjason-creator/speaker-box-designer/discussions)
- **Email**: (Add your contact email)

-----

**Built with precision for audio enthusiasts, DIY builders, and professional enclosure designers.**