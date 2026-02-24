# FinSentinel - AI-Powered Personal Finance Management

A comprehensive financial management application built with Next.js, featuring voice-based expense entry, AI-driven insights, budget tracking, and financial goal management.

## Features

### Core Features
- **User Authentication**: Secure JWT-based authentication with password hashing
- **Expense Management**: Create, read, update, and delete expenses with category support
- **Income Tracking**: Track multiple income sources and amounts
- **Budget Management**: Set spending limits by category with real-time tracking
- **Financial Goals**: Create and monitor savings goals with progress tracking
- **Dashboard**: Real-time overview of financial summary with key metrics
- **Voice Entry**: Natural language voice input for hands-free expense tracking
- **AI Insights**: Intelligent analysis of spending patterns and personalized recommendations
- **Financial Reports**: Generate comprehensive financial reports in JSON and CSV formats
- **Recurring Transactions**: Manage recurring expenses and income automatically

### Advanced Features
- **Spending Pattern Analysis**: Month-over-month comparison and trend detection
- **Budget Warnings**: Automatic alerts when approaching or exceeding budget limits
- **Saving Opportunities**: AI-powered recommendations for potential savings
- **Goal Progress Tracking**: Monitor progress toward financial goals with daily targets
- **Category-based Analysis**: Detailed expense breakdown by category
- **Data Export**: Download financial data for external analysis and backup

## Technology Stack

### Frontend
- **Next.js 16**: React framework with App Router
- **Tailwind CSS v4**: Utility-first CSS framework
- **shadcn/ui**: Reusable component library
- **React Hook Form**: Form state management
- **SWR**: Data fetching and caching
- **Recharts**: Data visualization library
- **Lucide Icons**: Icon library

### Backend
- **Next.js API Routes**: Serverless backend endpoints
- **SQLite**: Lightweight database with better-sqlite3
- **JWT (jsonwebtoken)**: Authentication tokens
- **bcryptjs**: Password hashing and security
- **Zod**: Schema validation
- **Natural**: NLP for voice parsing

### Development
- **TypeScript**: Type safety
- **pnpm**: Package manager

## Project Structure

```
/app
  /api                 # API endpoints
    /auth             # Authentication routes
    /expenses         # Expense management
    /income           # Income tracking
    /budgets          # Budget management
    /goals            # Financial goals
    /dashboard        # Dashboard data
    /insights         # AI insights
    /voice            # Voice parsing
    /reports          # Report generation
    /recurring        # Recurring transactions
  /auth               # Authentication pages
  /dashboard          # Dashboard and main app
    /expenses         # Expenses management
    /budgets          # Budget management
    /goals            # Goals management
    /voice-entry      # Voice entry interface
    /insights         # Insights page
    /reports          # Reports page
/components
  /ui                # Reusable UI components
  /dashboard        # Dashboard-specific components
/hooks              # React hooks for data fetching
/lib                # Utilities and helpers
  /auth.ts         # Authentication utilities
  /db.ts           # Database connection
  /db-init.ts      # Database initialization
  /types.ts        # TypeScript type definitions
  /schemas.ts      # Zod validation schemas
  /utils-format.ts # Formatting utilities
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Expenses Table
```sql
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

### Income Table
```sql
CREATE TABLE income (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source TEXT NOT NULL,
  amount REAL NOT NULL,
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

### Budgets Table
```sql
CREATE TABLE budgets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  limit REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

### Goals Table
```sql
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  targetAmount REAL NOT NULL,
  currentAmount REAL DEFAULT 0,
  targetDate DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

### Recurring Transactions Table
```sql
CREATE TABLE recurring_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT,
  frequency TEXT NOT NULL,
  nextDueDate DATETIME NOT NULL,
  isActive INTEGER DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

## Getting Started

### Installation
1. Clone the repository
2. Install dependencies: `pnpm install`
3. Initialize the database: The database will be created automatically on first run

### Running the Application
```bash
pnpm dev
```

The application will be available at http://localhost:3000

### Building for Production
```bash
pnpm build
pnpm start
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user
- `POST /api/auth/logout` - Logout user

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/[id]` - Update expense
- `DELETE /api/expenses/[id]` - Delete expense

### Income
- `GET /api/income` - Get all income
- `POST /api/income` - Create income
- `PUT /api/income/[id]` - Update income
- `DELETE /api/income/[id]` - Delete income

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/[id]` - Update budget
- `DELETE /api/budgets/[id]` - Delete budget

### Goals
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create goal
- `PUT /api/goals/[id]` - Update goal
- `DELETE /api/goals/[id]` - Delete goal

### Data
- `GET /api/dashboard` - Get dashboard summary
- `GET /api/insights` - Get AI insights
- `POST /api/reports/generate` - Generate financial report
- `POST /api/voice/parse` - Parse voice input

## Key Components

### Dashboard
Main dashboard showing financial overview with summary cards, expense charts, budget status, and upcoming goals.

### Voice Entry
Hands-free expense entry using Web Speech API with natural language processing for automatic categorization.

### Insights Engine
AI-powered analysis providing spending pattern insights, budget warnings, saving opportunities, and goal progress tracking.

### Reports
Comprehensive financial reports with category breakdown, budget comparison, and export capabilities.

## Security Features

- JWT-based authentication with HTTP-only cookies
- Password hashing with bcryptjs
- Input validation with Zod schemas
- SQL injection prevention through parameterized queries
- CORS protection and secure headers

## Performance Optimizations

- SWR for efficient data fetching and caching
- Database query optimization with indexes
- Component code splitting
- Image optimization
- CSS-in-JS for dynamic styling

## Future Enhancements

- Advanced ML-based spending predictions
- Multi-currency support
- Bill reminders and notifications
- Investment tracking
- Tax optimization suggestions
- Mobile app native version
- Data synchronization across devices

## License

MIT

## Support

For issues or questions, please contact support or submit an issue in the repository.
