// User types
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  currency: string;
  timezone: string;
  created_at: number;
  updated_at: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  currency: string;
  timezone: string;
}

// Expense types
export interface Expense {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  description?: string;
  date: number;
  payment_method: string;
  tags?: string;
  created_at: number;
  updated_at: number;
}

export interface ExpenseInput {
  category: string;
  amount: number;
  description?: string;
  date: number;
  payment_method: string;
  tags?: string;
}

// Income types
export interface Income {
  id: string;
  user_id: string;
  source: string;
  amount: number;
  description?: string;
  date: number;
  recurring: boolean;
  recurrence_period?: string;
  created_at: number;
  updated_at: number;
}

export interface IncomeInput {
  source: string;
  amount: number;
  description?: string;
  date: number;
  recurring: boolean;
  recurrence_period?: string;
}

// Budget types
export interface Budget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  spent_amount: number;
  period: string;
  start_date: number;
  end_date?: number;
  alert_threshold: number;
  created_at: number;
  updated_at: number;
}

export interface BudgetInput {
  category: string;
  limit_amount: number;
  period: string;
  start_date: number;
  end_date?: number;
  alert_threshold: number;
}

// Goal types
export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: number;
  category: string;
  priority: string;
  status: string;
  created_at: number;
  updated_at: number;
}

export interface GoalInput {
  title: string;
  target_amount: number;
  deadline: number;
  category: string;
  priority: string;
}

// Recurring transaction types
export interface RecurringTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description?: string;
  category: string;
  frequency: string;
  next_date: number;
  last_executed?: number;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface RecurringTransactionInput {
  type: string;
  amount: number;
  description?: string;
  category: string;
  frequency: string;
  next_date: number;
}

// Insight types
export interface Insight {
  id: string;
  user_id: string;
  type: string;
  data: string;
  generated_at: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard summary types
export interface DashboardSummary {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  topExpenseCategories: Array<{ category: string; amount: number }>;
  budgetStatus: Array<{ category: string; spent: number; limit: number }>;
  upcomingGoals: Goal[];
}

// Expense summary by category
export interface CategorySummary {
  category: string;
  total: number;
  percentage: number;
  count: number;
}
