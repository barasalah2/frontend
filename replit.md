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

## Recent Changes (July 12, 2025)

### Chart Saving System Implementation (Local Storage)
- **Migration Complete**: Successfully migrated from Replit Agent to standard Replit environment
  - Switched from PostgreSQL to in-memory storage for simplicity
  - Removed database dependencies and used local storage for chart persistence
  - Application now runs cleanly with memory-based storage and client/server separation
- **Chart Saving Functionality Added**: Implemented comprehensive chart persistence system
  - Enhanced backend API with `/api/charts/save` endpoint for saving chart configurations
  - Added local storage fallback for chart persistence independent of database
  - Added "Save Chart" buttons to existing pie charts and Gantt charts in chat messages
  - Charts are saved both locally and in memory storage with full metadata and timestamps
- **Chart Display Integration**: Fixed saved chart visibility on conversation reload
  - Modified useChat hook to merge local storage charts with API messages
  - Charts now persist and display correctly after page refresh or server restart
  - Added storage event listeners to update chat in real-time when charts are saved
  - Created SavedChartsViewer component with dialog for managing all saved charts
- **External API Integration Fixed**: Chart generation now correctly calls user's external AI app
  - Updated visualization generation to call `http://localhost:5000/api/datavis` (user's external app)
  - Removed internal chart processing to prevent conflicts with external AI system
  - Added proper error handling and fallback for external API connectivity issues
  - Added validation to filter out invalid chart configurations (e.g., inappropriate box plots for categorical data)
- **Enhanced Chat Message Component**: Added support for displaying saved visualization messages
  - Created dedicated section for saved charts with DynamicChart renderer
  - Charts persist in conversation history and can be viewed anytime
  - Added conversation ID passing to enable chart saving from any message context

## Previous Changes (July 12, 2025)

### Chart Rendering Issues Resolved
- **Bar Chart Fix Complete**: Successfully resolved critical bar chart rendering issues
  - Fixed BarChart component layout prop conflict that prevented bars from displaying
  - Enhanced dataKey selection logic to properly handle sum and count transforms
  - Pie charts now correctly aggregate by x-axis categories with y-axis value summation
  - All chart types now display data accurately with proper aggregation
- **Data Processing Enhancements**: Improved chart data processing pipeline
  - Fixed sum transforms to properly aggregate categorical data (e.g., total_tag_qty by cwp_name)
  - Enhanced count transforms for occurrence-based charts
  - Consistent data structure across all chart types with proper value/count properties
- **Line Chart Series Support**: Implemented multi-series line chart functionality
  - Added support for series field in line chart specifications for multiple lines
  - Enhanced date grouping transforms (date_group:month, date_group:year, etc.)
  - Proper data aggregation by x-axis and series values with sum/count transforms
  - Recharts-compatible data restructuring for multi-line visualization
- **Visualization System Stability**: All chart types working correctly in production
  - Bar charts display proper aggregated values for categorical x-axis data
  - Pie charts show correct proportions based on summed y-axis values
  - Line charts support both single and multi-series configurations
  - Enhanced chart renderer handles all transform combinations reliably

### Enhanced Visualization System Migration
- **Complete Chart Type Support**: Successfully implemented comprehensive chart support for all DataVisAgent specification types:
  - Core charts: pie, donut, bar, horizontal_bar, stacked_bar, grouped_bar, line, area, scatter, bubble
  - Advanced charts: histogram, waterfall, funnel, box, violin, heatmap, treemap, sunburst, radar
- **Enhanced Transformation Engine**: Added complete support for all DataVisAgent transformations:
  - Date/time: date_group (year, quarter, month_year, month, day_of_week, hour)
  - Numeric: bin (auto, quartile, custom), log_scale, normalize, z_score
  - Aggregation: count, sum, mean, median, min, max, std
  - Categorical: topk, bottomk, other_group, alphabetical, frequency
- **New Enhanced Chart Renderer**: Created dedicated EnhancedChartRenderer component with:
  - Proper responsive design and consistent styling across all chart types
  - Advanced tooltip system with formatted values and percentages
  - Horizontal and vertical layout support for different chart orientations
  - Color-coded legends and consistent COLORS palette
- **Improved Data Processing**: Enhanced chart data processing functions to handle complex transformations:
  - Multi-step transform pipelines (e.g., topk + aggregate_sum)
  - Date formatting and timestamp handling for scatter plots
  - Quartile binning and statistical aggregations
  - Smart fallback handling for unsupported chart combinations
- **Migration to Standard Replit Complete**: Successfully migrated all chart functionality to work in standard Replit environment
  - Fixed all syntax errors and component structure issues
  - Maintained backward compatibility with existing backend API
  - Enhanced error handling and graceful degradation for missing data

## Previous Changes (July 11, 2025)

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