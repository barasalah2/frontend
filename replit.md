# Workpacks Genie - AI Chat Application for Work Package Management

## Overview

Workpacks Genie is a full-stack web application that provides an AI-powered chat interface for managing and analyzing work packages. The application allows users to have conversations about work packages, generate reports, visualize data, and export information in various formats.

## User Preferences

Preferred communication style: Simple, everyday language.
Backend compatibility: Use existing backend API format with enhanced frontend UI components.

## System Architecture

The application follows a modern full-stack architecture with a clear separation between frontend and backend:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Animations**: Framer Motion for smooth UI transitions
- **Styling**: CSS custom properties with dark/light theme support

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **Database**: PostgreSQL with Drizzle ORM
- **API Pattern**: RESTful endpoints with JSON responses
- **Session Management**: Express sessions with PostgreSQL storage

## Key Components

### Database Schema
The application uses four main entities:
- **Users**: Basic user authentication (username/password)
- **Conversations**: Chat sessions with categorization and metadata
- **Messages**: Individual chat messages with support for different content types
- **Work Packages**: Project work items with status tracking and progress monitoring

### Chat System
- Real-time messaging interface with typing indicators
- Support for multiple message types (text, tables, visualizations)
- Conversation categorization (general, project-planning, cwa-analysis, scheduling, resource-planning)
- Message persistence and retrieval

### Data Visualization
- Interactive tables with sorting and filtering capabilities
- Chart generation for work package status and progress
- Gantt chart visualization for project timelines
- Excel export functionality for reports and data

### UI Components
- Responsive design with mobile-first approach
- Dark/light theme switching with system preference detection
- Sidebar navigation for conversation management
- Reusable component library following shadcn/ui patterns

## Data Flow

1. **User Interaction**: Users interact through the chat interface or sidebar
2. **Frontend Processing**: React components handle user input and state management
3. **API Communication**: TanStack Query manages HTTP requests to backend APIs
4. **Backend Processing**: Express routes handle business logic and database operations
5. **Database Operations**: Drizzle ORM manages PostgreSQL interactions
6. **Response Handling**: Formatted data returns through the API chain
7. **UI Updates**: React components re-render with new data

### Message Processing Flow
1. User types message in chat input
2. Frontend sends message to `/api/genie` endpoint
3. Backend processes message and determines response type
4. If work package data is requested, system queries database
5. Response includes generated content and optional structured data
6. Frontend renders message with appropriate visualization components

## External Dependencies

### Frontend Dependencies
- **UI Components**: Extensive Radix UI primitives for accessibility
- **Data Visualization**: Recharts for chart generation
- **File Processing**: SheetJS (xlsx) for Excel import/export
- **Date Handling**: date-fns for date manipulation
- **Animation**: Framer Motion for UI transitions

### Backend Dependencies
- **Database**: Neon serverless PostgreSQL driver
- **ORM**: Drizzle with Zod validation schemas
- **Session Storage**: connect-pg-simple for PostgreSQL session store
- **Development**: tsx for TypeScript execution, ESBuild for production builds

### Development Tools
- **Type Checking**: TypeScript with strict mode enabled
- **Linting**: ESLint configuration for code quality
- **Build Process**: Vite for frontend, ESBuild for backend
- **Database Migrations**: Drizzle Kit for schema management

## Deployment Strategy

### Development Environment
- **Frontend**: Vite development server with hot module replacement
- **Backend**: tsx with file watching for automatic restarts
- **Database**: Local PostgreSQL or Neon cloud database
- **Environment Variables**: DATABASE_URL for database connection

### Production Build
- **Frontend**: Static assets built with Vite and served from `/dist/public`
- **Backend**: ESM bundle created with ESBuild targeting Node.js
- **Database**: Production PostgreSQL with connection pooling
- **Static Serving**: Express serves frontend assets in production

### Key Configuration Files
- **Vite Config**: Frontend build configuration with path aliases
- **Drizzle Config**: Database schema and migration settings
- **TypeScript Config**: Shared configuration for client/server/shared code
- **Tailwind Config**: Theme customization and content paths

The application is designed to be deployment-ready for platforms like Replit, with automatic environment detection and appropriate serving strategies for development vs. production environments.

## Recent Changes (July 11, 2025)

- **Replit Agent Migration Complete**: Successfully migrated the project from Replit Agent to standard Replit environment
  - Set up PostgreSQL database with proper environment variables
  - Fixed visualization chart errors by ensuring consistent data structures across all chart types
  - All chart processing functions now return both `count` and `value` properties for compatibility
  - Project now runs cleanly in Replit with proper client/server separation and security practices

### Migration to Standard Replit Environment (Latest)
- **Replit Agent to Replit Migration**: Successfully migrated the project from Replit Agent to standard Replit environment
- **PostgreSQL Database Setup**: Created and configured PostgreSQL database with proper environment variables
- **Visualization Bug Fixes**: Fixed critical error in DynamicChart component where charts were trying to access undefined 'count' properties
- **Data Processing Enhancement**: Enhanced all chart data processing functions to include both 'count' and 'value' properties for consistent chart rendering
- **Security Compliance**: Ensured proper client/server separation and robust security practices during migration
- **Environment Compatibility**: Verified all dependencies are correctly installed and the application starts without errors

- **Enhanced Frontend Integration**: Modified frontend to work with existing backend API while maintaining modern UI components
- **Environment Configuration**: Added comprehensive .env file with all necessary configuration options
- **API Compatibility**: Ensured new enhanced UI components work seamlessly with original backend response format
- **Local Storage**: Implemented conversation persistence using browser local storage for better UX
- **Advanced Visualization System**: Added comprehensive visualization components including:
  - Progress charts (pie charts showing status distribution)
  - Gantt charts (horizontal bar charts showing progress by work package)
  - Status count analysis (bar charts showing status counts)
  - Toggle button to show/hide visualizations
- **Enhanced Table Features**: Added comprehensive table functionality including:
  - Global search across all columns
  - Advanced filtering by column and value
  - Multi-column sorting with visual indicators
  - Horizontal and vertical scrolling with sticky headers
  - Custom scrollbar styling for better UX
  - Results count and filter status indicators
  - Clear filters functionality
- **Replit Migration Complete**: Successfully migrated project from Replit Agent to standard Replit environment
  - Fixed visualization button to call external AI app at `http://localhost:5000/api/datavis`
  - Updated request format to match external app API specification
  - Maintained all existing functionality while ensuring Replit compatibility
- **Visualization Fixes**: Fixed chart rendering issues in dynamic visualization system:
  - Fixed scatter plot rendering for date-to-date comparisons (cwp_plan_start vs cwp_plan_finish)
  - Fixed bar chart aggregate sum calculations with topk transforms (cwp_name vs total_tag_qty)
  - Improved date formatting in charts for better readability
  - Enhanced chart data processing to handle multiple transform combinations
- **Database Integration Complete**: Successfully migrated from memory storage to PostgreSQL database
  - Created PostgreSQL database with Drizzle ORM integration
  - Implemented DatabaseStorage class with full CRUD operations for users, conversations, messages, and work packages
  - Added database seeding with sample conversations and work package data
  - Fixed conversation timestamp formatting to show proper relative times instead of "Unknown"
  - All data is now persisted in the database with proper relationships and constraints
- **Comprehensive Documentation**: Created detailed README.md with complete application documentation
  - Full database schema documentation with SQL DDL statements
  - Complete API endpoint documentation with request/response examples
  - Detailed setup and deployment instructions
  - Architecture overview with frontend/backend technology stack
  - TypeScript type definitions and data flow documentation
  - Environment configuration details and security features