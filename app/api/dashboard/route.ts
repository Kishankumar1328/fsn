import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDb();
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Get total expenses for current month
    const expenseResult = db.prepare(`
      SELECT SUM(amount) as total FROM expenses 
      WHERE user_id = ? AND date >= ?
    `).get(user.id, thirtyDaysAgo) as any;
    const totalExpenses = expenseResult?.total || 0;

    // Get total income for current month
    const incomeResult = db.prepare(`
      SELECT SUM(amount) as total FROM income 
      WHERE user_id = ? AND date >= ?
    `).get(user.id, thirtyDaysAgo) as any;
    const totalIncome = incomeResult?.total || 0;

    // Get expenses by category
    const categoryExpenses = db.prepare(`
      SELECT category, SUM(amount) as amount, COUNT(*) as count
      FROM expenses 
      WHERE user_id = ? AND date >= ?
      GROUP BY category
      ORDER BY amount DESC
      LIMIT 5
    `).all(user.id, thirtyDaysAgo) as any[];

    // Calculate category totals for pie chart
    const topExpenseCategories = categoryExpenses.map((cat: any) => ({
      category: cat.category,
      amount: cat.amount,
    }));

    // Get budget status
    const budgets = db.prepare(`
      SELECT b.*, COALESCE(SUM(e.amount), 0) as spent
      FROM budgets b
      LEFT JOIN expenses e ON b.user_id = e.user_id AND b.category = e.category
      WHERE b.user_id = ? AND b.start_date <= ? AND (b.end_date IS NULL OR b.end_date >= ?)
      GROUP BY b.id
    `).all(user.id, now, now) as any[];

    const budgetStatus = budgets.map((budget: any) => ({
      category: budget.category,
      spent: budget.spent || 0,
      limit: budget.limit_amount,
      threshold: budget.alert_threshold,
    }));

    // Get upcoming goals
    const upcomingGoals = db.prepare(`
      SELECT * FROM goals
      WHERE user_id = ? AND status = 'active' AND deadline > ?
      ORDER BY deadline ASC
      LIMIT 5
    `).all(user.id, now) as any[];

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalExpenses,
          totalIncome,
          balance: totalIncome - totalExpenses,
          period: 'last_30_days',
        },
        topExpenseCategories,
        budgetStatus,
        upcomingGoals: upcomingGoals.map((goal: any) => ({
          id: goal.id,
          title: goal.title,
          target_amount: goal.target_amount,
          current_amount: goal.current_amount,
          deadline: goal.deadline,
          progress: Math.round((goal.current_amount / goal.target_amount) * 100),
        })),
      },
    });
  } catch (error) {
    console.error('[v0] Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
