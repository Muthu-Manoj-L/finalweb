# DeepSpectrum Analytics - AI-Enabled Multispectral Tricorder

A cross-platform mobile application for qualitative material analysis using ESP32 spectrometers and AI-powered spectral data analysis.

## Features

### Authentication
- Secure email/password login
- Biometric authentication (fingerprint/Face ID)
- Profile management with company affiliation

### Device Management
- WiFi-based ESP32 spectrometer discovery and connection
- Real-time device status monitoring (battery, signal strength)
- Connection state management

### Dashboard
- Device connection status overview
- Quick access to calibration, measurement, and data viewing
- Measurement statistics and recent activity

### Measurements
- Multi-parameter spectral analysis:
  - Color Analysis
  - State Analysis
  - Quality Assessment
  - Contamination Detection
  - Material Composition
- Parameter selection interface
- Measurement history tracking

### Data Synchronization
- Cloud-based data sync
- AI model updates
- Sync operation history and status tracking

### Settings
- Dark/Light mode toggle
- Biometric authentication preferences
- Profile and device information

## Technology Stack

- **Framework**: Expo SDK (React Native)
- **Routing**: Expo Router (file-based routing)
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Styling**: React Native StyleSheet with Linear Gradients
- **Animations**: React Native Reanimated
- **State Management**: React Context API
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
The `.env` file is already configured with Supabase credentials.

3. Start the development server:
```bash
npm run dev
```

4. Run on your device:
- Scan the QR code with Expo Go app (iOS/Android)
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web

### Testing the Application

**Create a test account:**

1. Sign up through the login screen with any email/password
2. The profile will be automatically created

**Testing Device Connection:**

Currently, the app expects ESP32 devices to be pre-registered in the database. For testing:
- The Device Connection screen will show registered devices
- Tap on a device to connect
- Once connected, you'll be redirected to the dashboard

**Running Measurements:**

1. From the dashboard, tap "Measure"
2. Select parameters to analyze
3. Tap "Start Measurement"
4. View results in the Measurements tab

## Project Structure

```
├── app/                      # Expo Router pages
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── index.tsx        # Dashboard
│   │   ├── measurements.tsx # Measurement history
│   │   ├── sync.tsx         # Data sync & AI models
│   │   └── settings.tsx     # User settings
│   ├── _layout.tsx          # Root layout with providers
│   ├── login.tsx            # Authentication screen
│   ├── device-connection.tsx # Device discovery
│   └── parameter-selection.tsx # Measurement parameters
├── components/              # Reusable UI components
│   ├── GradientCard.tsx
│   ├── GradientButton.tsx
│   ├── IconCard.tsx
│   ├── AnimatedProgress.tsx
│   └── CircularProgress.tsx
├── contexts/               # React Context providers
│   ├── AuthContext.tsx     # Authentication state
│   └── ThemeContext.tsx    # Theme management
├── lib/                    # Utilities and services
│   └── supabase.ts        # Supabase client
└── types/                 # TypeScript definitions
    └── env.d.ts           # Environment variables

```

## Database Schema

### Tables
- **profiles**: User profiles with biometric and theme preferences
- **devices**: ESP32 spectrometer device registry
- **measurements**: Measurement records with parameters
- **spectral_data**: Raw spectral readings
- **analysis_results**: AI-processed analysis results
- **ai_models**: Available AI models for analysis
- **sync_operations**: Data synchronization history
- **calibration_data**: Device calibration records

All tables have Row Level Security (RLS) enabled with secure policies.

## Design Philosophy

The app follows a modern, futuristic design aesthetic inspired by the reference image:

- **Gradient-rich UI**: Smooth color transitions and vibrant accents
- **Semi-transparent cards**: Layered glass-morphism effects
- **Responsive layouts**: Optimized for all screen sizes
- **Dark mode first**: Professional dark theme with light mode support
- **Micro-interactions**: Subtle animations for enhanced UX
- **High contrast**: Readable text on all backgrounds

## Scripts

- `npm run dev` - Start development server
- `npm run build:web` - Build for web deployment
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint

## Future Enhancements

- Real-time spectral data visualization
- Export measurement data (PDF, CSV)
- Multi-device support
- Advanced filtering and search
- Offline mode with local storage
- Push notifications for sync completion
- Collaborative measurement sharing

## License

Private - DeepSpectrum Analytics Private Limited

## Contact

For support or inquiries, contact DeepSpectrum Analytics.
