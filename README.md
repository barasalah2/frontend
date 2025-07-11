# Workpacks Genie™ - AI Chat Application for Work Package Management

A comprehensive full-stack web application that provides an AI-powered chat interface for managing and analyzing Advanced Work Packages (AWP). The application allows users to have conversations about work packages, generate reports, visualize data, and export information in various formats.

## 🚀 Features

- **AI-Powered Chat Interface**: Interactive conversations with intelligent responses about work packages
- **Advanced Data Visualization**: Dynamic charts including scatter plots, bar charts, line charts, and pie charts
- **Real-time Data Processing**: Live data visualization with external AI integration
- **Conversation Management**: Categorized conversations with persistent storage
- **Excel Export**: Export work package data and reports to Excel format
- **Dark/Light Theme**: Complete theme switching with system preference detection
- **Responsive Design**: Mobile-first design that works on all devices
- **PostgreSQL Integration**: Full database persistence with Drizzle ORM

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Animations**: Framer Motion for smooth UI transitions

### Backend (Node.js + Express)
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **Database**: PostgreSQL with Drizzle ORM
- **API Pattern**: RESTful endpoints with JSON responses
- **Session Management**: Express sessions with PostgreSQL storage

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);
```

#### Conversations Table
```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  metadata JSONB
);
```

#### Messages Table
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) NOT NULL,
  content TEXT NOT NULL,
  sender TEXT NOT NULL, -- 'user' or 'bot'
  message_type TEXT DEFAULT 'text', -- 'text', 'table', 'visualization'
  data JSONB, -- For storing table data, chart data, etc.
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

#### Work Packages Table
```sql
CREATE TABLE work_packages (
  id SERIAL PRIMARY KEY,
  wp_id TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  due_date TIMESTAMP,
  assigned_team TEXT,
  cwa_id TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 20+ 
- PostgreSQL database (automatically provided by Replit)

### Environment Configuration

The application uses the following environment variables:

```bash
# Frontend Environment Variables
VITE_API_URL=http://localhost:5000
VITE_AI_BACKEND_URL=http://localhost:5000/api/datavis

# Database Configuration (automatically set by Replit)
DATABASE_URL=postgresql://username:password@host:5432/database
PGHOST=your_neon_host
PGPORT=5432
PGUSER=neondb_owner
PGPASSWORD=your_password
PGDATABASE=neondb

# Server Configuration
NODE_ENV=development
PORT=5000
SESSION_SECRET=your_session_secret_here
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
LOG_LEVEL=info
```

### Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Database**
   ```bash
   # Push schema to database
   npm run db:push
   
   # Seed with sample data
   npx tsx server/seed.ts
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## 📊 API Endpoints

### Chat API
- `POST /api/genie` - Send message to AI assistant
  ```json
  {
    "question": "Show me work package progress",
    "conv_id": 123
  }
  ```

### Conversation Management
- `GET /api/conversations` - List all conversations
- `GET /api/conversations/:id/messages` - Get messages for conversation
- `POST /api/conversations` - Create new conversation
- `DELETE /api/conversations/:id` - Delete conversation

### Work Package Management
- `GET /api/workpackages` - List all work packages
- `GET /api/workpackages?cwa_id=CWA-2301` - Get work packages by CWA ID
- `POST /api/workpackages` - Create new work package
- `PUT /api/workpackages/:id` - Update work package
- `DELETE /api/workpackages/:id` - Delete work package

### Data Visualization
- `POST /api/datavis` - Generate visualization configuration
  ```json
  {
    "columns": [{"name": "column1"}, {"name": "column2"}],
    "data_snippet": [{"column1": "value1", "column2": "value2"}]
  }
  ```

## 🎨 UI Components

### Core Components
- **ChatMessage**: Displays individual chat messages with support for text, tables, and visualizations
- **ChatInput**: Message input with validation and submission handling
- **ConversationSidebar**: Navigation and conversation management
- **DynamicChart**: Renders various chart types (scatter, bar, line, pie, histogram)
- **WorkPackageTable**: Enhanced table with sorting, filtering, and export capabilities

### Conversation Categories
- **General**: Basic conversations and queries
- **Project Planning**: Project-related discussions
- **CWA Analysis**: Construction Work Activity analysis
- **Scheduling**: Timeline and scheduling conversations
- **Resource Planning**: Resource allocation and management

## 📈 Data Visualization Features

### Chart Types Supported
1. **Scatter Plot**: For correlation analysis between two variables
2. **Bar Chart**: For categorical data comparison
3. **Line Chart**: For trend analysis over time
4. **Pie Chart**: For percentage distribution
5. **Histogram**: For frequency distribution

### Transform Operations
- **Date Grouping**: Group dates by month/year for time-series analysis
- **Aggregation**: Sum, count, average operations
- **Top-K**: Show top N results for better focus
- **Filtering**: Dynamic data filtering by various criteria

### Advanced Features
- **Interactive Charts**: Hover tooltips and responsive design
- **Export Functionality**: Export charts and data to Excel
- **Real-time Updates**: Dynamic chart generation based on live data
- **Multiple Visualizations**: Display multiple charts simultaneously

## 🗃️ Database Management

### Schema Management
The application uses Drizzle ORM for database operations:

```bash
# Push schema changes to database
npm run db:push

# Generate migrations (if needed)
npx drizzle-kit generate

# View database studio
npx drizzle-kit studio
```

### Data Types and Relationships

**User Management**
```typescript
type User = {
  id: number;
  username: string;
  password: string;
}
```

**Conversation System**
```typescript
type Conversation = {
  id: number;
  title: string;
  category: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: any;
}

type Message = {
  id: number;
  conversationId: number;
  content: string;
  sender: 'user' | 'bot';
  messageType: 'text' | 'table' | 'visualization';
  data: any;
  createdAt: Date;
}
```

**Work Package Management**
```typescript
type WorkPackage = {
  id: number;
  wpId: string;
  description: string;
  status: string;
  progress: number;
  dueDate?: Date;
  assignedTeam?: string;
  cwaId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔧 Configuration Files

### Key Configuration Files
- `drizzle.config.ts`: Database configuration and connection settings
- `vite.config.ts`: Frontend build configuration with path aliases
- `tailwind.config.ts`: Theme customization and styling configuration
- `tsconfig.json`: TypeScript configuration for client/server/shared code

### Build Scripts
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "vite build",
    "build:backend": "esbuild server/index.ts --bundle --platform=node --target=node20 --outfile=dist/server.js --external:@neondatabase/serverless --external:ws",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

## 🚀 Deployment

### Production Build
```bash
# Build for production
npm run build

# Start production server
node dist/server.js
```

### Environment Setup
- **Frontend**: Static assets served from `/dist/public`
- **Backend**: ESM bundle targeting Node.js 20+
- **Database**: PostgreSQL with connection pooling
- **Static Serving**: Express serves frontend assets in production

## 🔒 Security Features

- **Session Management**: Secure session handling with PostgreSQL storage
- **Input Validation**: Zod schema validation for all API inputs
- **CORS Protection**: Configured CORS policies for frontend-backend communication
- **Environment Isolation**: Separate environment configurations for development/production

## 🧪 Testing & Quality

### Code Quality
- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Code quality and consistency enforcement
- **Drizzle**: Type-safe database operations
- **Zod**: Runtime type validation for API inputs

### Development Tools
- **Hot Module Replacement**: Vite HMR for fast development
- **File Watching**: Automatic server restarts with tsx
- **Database Studio**: Visual database management with Drizzle Kit

## 📚 Additional Resources

### External Dependencies
- **UI Components**: Extensive Radix UI primitives for accessibility
- **Data Visualization**: Recharts for chart generation and rendering
- **File Processing**: SheetJS (xlsx) for Excel import/export
- **Date Handling**: date-fns for date manipulation and formatting
- **Animation**: Framer Motion for smooth UI transitions

### Development Guidelines
- **Component Structure**: Reusable components following shadcn/ui patterns
- **State Management**: TanStack Query for server state with proper cache invalidation
- **Styling**: Tailwind CSS with custom properties for theme support
- **File Organization**: Clear separation between client, server, and shared code

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ for Advanced Work Package Management**