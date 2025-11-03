# AI Agent Instructions for NikParser

## Project Overview
NikParser is a client-side web application for parsing Indonesian NIK (National Identity Number). It features inline editing, PWA capabilities, dark mode, and localStorage-based history management.

## Development Commands
- `npm run dev`: Start development server (with API endpoints)
- `npm run build`: Create production build
- `npm run lint`: Run ESLint
- `npm run typecheck`: Run TypeScript checks
- `npm run preview`: Preview production build

## Key Architecture
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Build System**: Vite
- **State Management**: React hooks + Context API
- **Data Storage**: Browser localStorage
- **Parsing**: External NIK parser from GitHub

## Critical Rules:
- ✅ **ALWAYS consult all 3 files before work**
- ✅ **MUST update PROGRESS.md before commits**
- ✅ **Maintain consistency with patterns**
- ✅ **Document significant changes**
- ✅ **Preserve client-side only architecture**

## API Endpoints (Development Only)
- GET `/api/nik/validate?nik=1234567890123456`
- POST `/api/validate/nik` with body `{"nik": "1234567890123456"}`

## Files Structure
- `/src/components/` - React UI components
- `/src/lib/` - Core logic and utilities
- `/src/contexts/` - React Context providers
- `vite.config.ts` - Build configuration with API endpoints
- `Dockerfile` - Containerization
- `captain-definition` - CapRover deployment

## Important Notes
- Changes should maintain client-side only architecture
- API endpoints only function in development
- All data stored in localStorage (no server calls in production)
- Follow existing code patterns and TypeScript practices