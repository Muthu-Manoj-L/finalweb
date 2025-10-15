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

Developer: Muthu Manoj L

## Deploying to Netlify

This project is an Expo web-exportable React app. To host the web build on Netlify, follow these steps:

1. Install dependencies and build the web export:

```bash
npm install
npm run build
```

2. The build output will be placed into the `dist` directory (Expo's static export). Netlify should publish that directory.

3. Netlify configuration: this repo includes a `netlify.toml` at the project root. It instructs Netlify to run `npm run build` and publish the `web-build` directory, and contains a redirect so client-side routes resolve to `index.html`.

4. Environment variables:
 - `EXPO_PUBLIC_SUPABASE_URL` — Your Supabase URL
 - `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon key

Set the above variables in your Netlify site dashboard under "Site settings → Build & deploy → Environment" (or use the Netlify CLI). These must be present for the app to connect to Supabase after deployment.

5. Optional: Use Netlify Git integration — connect the repository, and Netlify will run the `npm run build` command automatically on each push to the configured branch.

Troubleshooting:
- If you see a blank page after deploy, check the browser console for runtime errors. Ensure the environment variables are set in Netlify.
- If routing fails on refresh, ensure the redirects in `netlify.toml` exist (they are included by default in this repo).

If you want, I can create a CI workflow or GitHub Action to automatically deploy to Netlify on push.
