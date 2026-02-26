-- FinSentinel MySQL Schema
-- CLEAN SLATE: Delete and Recreate Database
DROP DATABASE IF EXISTS finsentinel;
CREATE DATABASE finsentinel CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE finsentinel;

-- Users Table
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Expenses Table
CREATE TABLE expenses (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DOUBLE NOT NULL,
  description TEXT,
  date BIGINT NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'cash',
  mood VARCHAR(50),
  is_donation TINYINT(1) DEFAULT 0,
  tags TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  CONSTRAINT fk_expenses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Donations Table
CREATE TABLE donations (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  organization VARCHAR(255) NOT NULL,
  amount DOUBLE NOT NULL,
  cause VARCHAR(255) NOT NULL,
  date BIGINT NOT NULL,
  impact_description TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  CONSTRAINT fk_donations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Income Table
CREATE TABLE income (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  source VARCHAR(255) NOT NULL,
  amount DOUBLE NOT NULL,
  description TEXT,
  date BIGINT NOT NULL,
  recurring TINYINT(1) DEFAULT 0,
  recurrence_period VARCHAR(50),
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  CONSTRAINT fk_income_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Budgets Table
CREATE TABLE budgets (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  limit_amount DOUBLE NOT NULL,
  spent_amount DOUBLE DEFAULT 0,
  period VARCHAR(50) DEFAULT 'monthly',
  start_date BIGINT NOT NULL,
  end_date BIGINT,
  alert_threshold DOUBLE DEFAULT 80,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  CONSTRAINT fk_budgets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Goals Table
CREATE TABLE goals (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  target_amount DOUBLE NOT NULL,
  current_amount DOUBLE DEFAULT 0,
  deadline BIGINT NOT NULL,
  category VARCHAR(100) NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'active',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Recurring Transactions Table
CREATE TABLE recurring_transactions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  amount DOUBLE NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  frequency VARCHAR(50) NOT NULL,
  next_date BIGINT NOT NULL,
  last_executed BIGINT,
  is_active TINYINT(1) DEFAULT 1,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  CONSTRAINT fk_recurring_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insights Table
CREATE TABLE insights (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  data JSON NOT NULL,
  generated_at BIGINT NOT NULL,
  CONSTRAINT fk_insights_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Investments Table
CREATE TABLE investments (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  ticker VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'stock',
  shares DOUBLE NOT NULL DEFAULT 0,
  buy_price DOUBLE NOT NULL,
  current_price DOUBLE NOT NULL,
  buy_date BIGINT NOT NULL,
  sector VARCHAR(100),
  notes TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  CONSTRAINT fk_investments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Family Groups Table
CREATE TABLE family_groups (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id VARCHAR(255) NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  CONSTRAINT fk_family_groups_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Family Members Table
CREATE TABLE family_members (
  id VARCHAR(255) PRIMARY KEY,
  group_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  joined_at BIGINT NOT NULL,
  CONSTRAINT fk_family_members_group FOREIGN KEY (group_id) REFERENCES family_groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_family_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Family Invites Table
CREATE TABLE family_invites (
  id VARCHAR(255) PRIMARY KEY,
  group_id VARCHAR(255) NOT NULL,
  invited_email VARCHAR(255) NOT NULL,
  invited_by VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  expires_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tax Events Table
CREATE TABLE tax_events (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  year INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DOUBLE NOT NULL,
  description TEXT,
  is_deductible TINYINT(1) DEFAULT 0,
  receipt_ref VARCHAR(255),
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  CONSTRAINT fk_tax_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Notification Log Table
CREATE TABLE notification_log (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  payload JSON,
  sent_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Indexes
CREATE INDEX idx_expenses_user_id ON expenses (user_id);
CREATE INDEX idx_expenses_date ON expenses (date);
CREATE INDEX idx_expenses_user_date ON expenses (user_id, date);
CREATE INDEX idx_income_user_id ON income (user_id);
CREATE INDEX idx_budgets_user_id ON budgets (user_id);
CREATE INDEX idx_goals_user_id ON goals (user_id);
CREATE INDEX idx_recurring_user_id ON recurring_transactions (user_id);
CREATE INDEX idx_insights_user_id ON insights (user_id);
CREATE INDEX idx_investments_user_id ON investments (user_id);
CREATE INDEX idx_family_members_group ON family_members (group_id);
CREATE INDEX idx_family_members_user ON family_members (user_id);
CREATE INDEX idx_tax_events_user_year ON tax_events (user_id, year);
