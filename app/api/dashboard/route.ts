import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, initializeDbAsync } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await initializeDbAsync();
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

    // Get budget status — fetch ALL budgets for user and calculate real spending per category
    const budgets = db.prepare(`
      SELECT b.id, b.category, b.limit_amount, b.alert_threshold
      FROM budgets b
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).all(user.id) as any[];

    const budgetStatus = budgets.map((budget: any) => {
      const spentResult = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as spent
        FROM expenses
        WHERE user_id = ? AND LOWER(category) = LOWER(?) AND date >= ?
      `).get(user.id, budget.category, thirtyDaysAgo) as any;
      return {
        category: budget.category,
        spent: spentResult?.spent || 0,
        limit: budget.limit_amount,
        threshold: budget.alert_threshold,
      };
    });

    // Get upcoming goals
    const upcomingGoals = db.prepare(`
      SELECT * FROM goals
      WHERE user_id = ? AND status = 'active' AND deadline > ?
      ORDER BY deadline ASC
      LIMIT 5
    `).all(user.id, now) as any[];

    // Calculate Financial Health Score (Simplified)
    // 1. Savings Rate (40%)
    const savingsRatio = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
    const savingsScore = Math.min(Math.max(savingsRatio * 100, 0), 100);

    // 2. Budget Adherence (30%)
    const budgetsCount = budgetStatus.length;
    const cleanBudgets = budgetStatus.filter(b => b.spent <= b.limit).length;
    const budgetScore = budgetsCount > 0 ? (cleanBudgets / budgetsCount) * 100 : 80;

    // 3. Goal Progress (30%)
    const avgGoalProgress = upcomingGoals.length > 0
      ? upcomingGoals.reduce((sum, g) => sum + (g.current_amount / g.target_amount), 0) / upcomingGoals.length
      : 0.5;
    const goalScore = avgGoalProgress * 100;

    const healthScore = Math.round((savingsScore * 0.4) + (budgetScore * 0.3) + (goalScore * 0.3));

    // Simple Insight for Banner
    const alertingBudget = budgetStatus.find(b => b.spent > b.limit);
    const primaryInsight = alertingBudget
      ? {
        title: 'Budget Alert Detected',
        description: `You have exceeded your ${alertingBudget.category} budget limit.`,
        severity: 'warning'
      }
      : savingsRatio > 0.2
        ? {
          title: 'Wealth Growth Positive',
          description: 'Your savings rate is above 20% this month. Good job building security!',
          severity: 'success'
        }
        : {
          title: 'Steady Progress',
          description: 'Continue tracking your expenses to build long-term wealth.',
          severity: 'info'
        };

    return NextResponse.json({
      success: true,
      data: {
        healthScore,
        primaryInsight,
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
