# Installation Guide

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- Git

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd openalgo-chart

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5001`

## Available Scripts

### Development

```bash
# Start development server
npm run dev

# Type check (without emit)
npm run type-check

# Type check in watch mode
npm run type-check:watch

# Lint code
npm run lint

# Fix lint errors
npm run lint:fix
```

### Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Open Vitest UI
npm run test:ui

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
openalgo-chart/
├── src/
│   ├── types/          # TypeScript type definitions
│   ├── services/       # API services
│   ├── store/          # Zustand stores
│   ├── hooks/          # Custom React hooks
│   ├── context/        # React context providers
│   ├── components/     # React components
│   ├── constants/      # Application constants
│   └── utils/          # Utility functions
├── tests/              # Test files
├── docs/               # Documentation
├── e2e/                # E2E tests
└── .github/            # GitHub workflows
```

## Configuration

### TypeScript

The project uses strict TypeScript configuration. Key settings:

- `strict: true` - Enable all strict type checking options
- `noImplicitAny: true` - Error on implied `any` types
- `strictNullChecks: true` - Strict null checking

Path aliases are configured for cleaner imports:

```typescript
import { Order } from '@/types';
import { useDebounce } from '@/hooks';
import { accountService } from '@/services/trading';
```

### Environment Variables

Create a `.env` file for local development:

```env
VITE_API_BASE=http://127.0.0.1:5000
VITE_WS_URL=ws://127.0.0.1:8765
```

## Backend Integration

This frontend connects to the OpenAlgo backend:

- **REST API**: Port 5000 (proxied through Vite in development)
- **WebSocket**: Port 8765 (for real-time market data)

Ensure the OpenAlgo backend is running before starting the frontend.

## Troubleshooting

### TypeScript Errors

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache/typescript
npm run type-check
```

### Build Errors

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Port Conflicts

If port 5001 is in use:

```bash
# Use a different port
npm run dev -- --port 3000
```
