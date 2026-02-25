import { z } from 'zod';

// Auth schemas
export const SignUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const SignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  timezone: z.string().optional(),
});

// Expense schemas
export const ExpenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  date: z.number().positive('Valid date is required'),
  payment_method: z.string().default('cash'),
  mood: z.string().optional(),
  is_donation: z.boolean().default(false),
  tags: z.string().optional(),
});

// Donation schemas
export const DonationSchema = z.object({
  organization: z.string().min(1, 'Organization is required'),
  amount: z.number().positive('Amount must be positive'),
  cause: z.string().min(1, 'Cause is required'),
  date: z.number().positive('Valid date is required'),
  impact_description: z.string().optional(),
});

export const ExpenseQuerySchema = z.object({
  startDate: z.number().optional(),
  endDate: z.number().optional(),
  category: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

// Income schemas
export const IncomeSchema = z.object({
  source: z.string().min(1, 'Source is required'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  date: z.number().positive('Valid date is required'),
  recurring: z.boolean().default(false),
  recurrence_period: z.string().optional(),
});

// Budget schemas
export const BudgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  limit_amount: z.number().positive('Limit must be positive'),
  spent_amount: z.number().min(0).default(0),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  start_date: z.number(),
  end_date: z.number().optional(),
  alert_threshold: z.number().min(0).max(100).default(80),
});

// Goal schemas
export const GoalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  target_amount: z.number().positive('Target amount must be positive'),
  current_amount: z.number().min(0).default(0),
  deadline: z.number().positive('Valid deadline is required'),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

export const UpdateGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  target_amount: z.number().positive('Target amount must be positive').optional(),
  current_amount: z.number().min(0, 'Current amount cannot be negative').optional(),
  deadline: z.number().positive('Valid deadline is required').optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['active', 'completed', 'paused']).optional(),
});

// Recurring transaction schemas
export const RecurringTransactionSchema = z.object({
  type: z.enum(['expense', 'income']),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
  next_date: z.number().positive('Valid date is required'),
});

// Voice input schema
export const VoiceTranscriptionSchema = z.object({
  text: z.string().min(1, 'Transcription is required'),
  type: z.enum(['expense', 'income']).default('expense'),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type ExpenseInput = z.infer<typeof ExpenseSchema>;
export type IncomeInput = z.infer<typeof IncomeSchema>;
export type BudgetInput = z.infer<typeof BudgetSchema>;
export type GoalInput = z.infer<typeof GoalSchema>;
export type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>;
export type RecurringTransactionInput = z.infer<typeof RecurringTransactionSchema>;
export type DonationInput = z.infer<typeof DonationSchema>;
export type VoiceTranscriptionInput = z.infer<typeof VoiceTranscriptionSchema>;
