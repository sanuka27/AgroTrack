# AgroTrack Frontend

This directory contains all the frontend code and configuration for the AgroTrack application.

## 🚀 Quick Start

```bash
# Navigate to the frontend directory
cd Frontend

# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build
```

## 📁 Directory Structure

```
Frontend/
├── src/                    # Source code
│   ├── components/         # React components
│   │   ├── ui/            # Shadcn/ui components
│   │   ├── AIAssistant.tsx
│   │   ├── Features.tsx
│   │   ├── Community.tsx
│   │   └── ...
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   └── assets/            # Static assets
├── public/                # Public assets
│   ├── favicon.svg        # Custom AgroTrack favicon
│   └── ...
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── index.html             # HTML entry point
```

## 🛠️ Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui (built on Radix UI)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router
- **Icons**: Lucide React

## 📝 Available Scripts

- `npm run dev` - Start development server (http://localhost:8080)
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Features

- ✅ Responsive design with mobile-first approach
- ✅ Dark/light theme support
- ✅ AI-powered plant care assistant
- ✅ Community features and forums
- ✅ Plant health analytics
- ✅ Custom AgroTrack branding (no third-party watermarks)

## 🔧 Development

The application uses modern React patterns and includes:

- **Component Library**: Pre-built UI components with Shadcn/ui
- **Type Safety**: Full TypeScript support
- **Hot Reload**: Instant updates during development
- **Code Quality**: ESLint configuration for consistent code style
- **Performance**: Optimized builds with Vite

## 🌱 AgroTrack Theme

The application uses a green agricultural theme with:
- Custom plant-themed favicon
- Green color scheme for better brand identity
- Agricultural-focused iconography
- Clean, modern design optimized for gardening workflows
