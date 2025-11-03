# Technical Overview of NikParser

## Core Components

### Frontend Components
- **App.tsx**: Main application component that manages global state (parse results, history, loading state) and orchestrates UI layout with header, main content area, and footer
- **NikInput.tsx**: Input form component with validation, clear functionality, and parsing capabilities
- **ParseResult.tsx**: Main results display component with inline editing capabilities, showing detailed NIK information with real-time preview
- **ThemeContext.tsx**: React context for managing dark/light theme preferences with localStorage persistence

### Library Components
- **nikParser.ts**: Core parsing, generation, and validation logic using external NIK parser
- **regionData.ts**: Hierarchical region code data (provinces, cities, districts) with loading from external source
- **storage.ts**: localStorage management for history with automatic cleanup
- **serverApi.ts**: Server-side API implementation for development endpoints

### Build & Infrastructure
- **vite.config.ts**: Vite configuration with custom plugin for development API endpoints
- **Dockerfile**: Multi-stage Dockerfile for containerized deployment
- **captain-definition**: CapRover deployment configuration

## Component Interactions

### Data Flow
The application follows a unidirectional data flow:
1. User inputs NIK in `NikInput.tsx`
2. `App.tsx` handles parsing and stores result in state
3. `ParseResult.tsx` displays results and allows editing
4. Edited values are automatically previewed and can be saved to history
5. History updates trigger UI refresh via callbacks

### State Management
- Global state is managed in `App.tsx` using React hooks
- Local state is used in components for UI-specific data
- Theme state is managed using React Context
- History state is persisted in browser localStorage

## Deployment Architecture

### Development Environment
- `npm run dev`: Starts Vite development server with API endpoints
- Hot Module Replacement (HMR) for rapid development
- Type checking and linting integration

### Production Build
- `npm run build`: Creates optimized static build in `dist/` directory
- `npm run preview`: Serves production build locally for testing
- Static file deployment to any web server

### Containerization
- Dockerfile with multi-stage build for optimized image
- CapRover configuration for one-click deployment

## Runtime Behavior

### Initialization
1. App loads with theme preference detection
2. History data is loaded from localStorage
3. External NIK parser is fetched when needed
4. Region data is loaded when editing mode is accessed

### Request Handling
- NIK parsing is done client-side with external parser
- Real-time preview updates during editing
- History operations are handled via localStorage
- API endpoints (dev only) proxy to external parser service

### Error Management
- Format validation before parsing
- Graceful error handling for network failures
- User-friendly error messages in UI
- Fallback handling for parser loading issues