import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

interface Insight {
  type: 'spending_pattern' | 'budget_warning' | 'saving_opportunity' | 'goal_progress' | 'trend';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success';
  data?: any;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    const insights: Insight[] = [];

    // Get current month expenses by category
    const currentExpenses = db
      .prepare(
        `
        SELECT category, SUM(amount) as total, COUNT(*) as count
        FROM expenses
        WHERE user_id = ? AND date >= ?
        GROUP BY category
        ORDER BY total DESC
      `
      )
      .all(userId, monthAgo.toISOString()) as Array<{ category: string; total: number; count: number }>;

    // Get previous month expenses for trend analysis
    const previousExpenses = db
      .prepare(
        `
        SELECT category, SUM(amount) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date < ?
        GROUP BY category
      `
      )
      .all(userId, twoMonthsAgo.toISOString(), monthAgo.toISOString()) as Array<{
      category: string;
      total: number;
    }>;

    const totalCurrentSpending = currentExpenses.reduce((sum, e) => sum + e.total, 0);

    // Analyze spending patterns and trends
    for (const expense of currentExpenses) {
      const previousAmount = previousExpenses.find((e) => e.category === expense.category)?.total || 0;
      const change = previousAmount > 0 ? ((expense.total - previousAmount) / previousAmount) * 100 : 100;
      let trend: string = 'stable';
      let severity: 'info' | 'warning' | 'success' = 'info';

      if (change > 15) {
        trend = 'increasing';
        severity = 'warning';
      } else if (change < -15) {
        trend = 'decreasing';
        severity = 'success';
      }

      if (trend !== 'stable') {
        insights.push({
          type: 'trend',
          title: trend === 'increasing' ? 'Spending Increased' : 'Spending Decreased',
          description:
            trend === 'increasing'
              ? `Your ${expense.category} spending increased by ${change.toFixed(1)}% this month compared to last month.`
              : `Great! Your ${expense.category} spending decreased by ${Math.abs(change).toFixed(1)}% this month.`,
          severity,
          data: { category: expense.category, changePercent: change },
        });
      }
    }

    // Top spending category insight
    const topCategory = currentExpenses[0];
    if (topCategory) {
      const percentage = (topCategory.total / totalCurrentSpending) * 100;
      insights.push({
        type: 'spending_pattern',
        title: 'Top Spending Category',
        description: `You spent the most on ${topCategory.category} (${percentage.toFixed(1)}% of monthly expenses). Average transaction: $${(topCategory.total / topCategory.count).toFixed(2)}`,
        severity: 'info',
        data: { category: topCategory.category, amount: topCategory.total, percentage },
      });
    }

    // Check budget warnings
    const budgets = db
      .prepare(
        `
        SELECT id, category, name, limit
        FROM budgets
        WHERE user_id = ?
      `
      )
      .all(userId) as Array<{ id: string; category: string; name: string; limit: number }>;

    for (const budget of budgets) {
      const spent = currentExpenses.find((e) => e.category === budget.category)?.total || 0;
      const percentage = (spent / budget.limit) * 100;

      if (percentage > 80) {
        insights.push({
          type: 'budget_warning',
          title: percentage >= 100 ? 'Budget Exceeded' : 'Budget Alert',
          description:
            percentage >= 100
              ? `You have exceeded your ${budget.name} budget by $${(spent - budget.limit).toFixed(2)}`
              : `Your ${budget.name} budget is ${percentage.toFixed(0)}% used. $${(budget.limit - spent).toFixed(2)} remaining.`,
          severity: percentage >= 100 ? 'warning' : 'info',
          data: { category: budget.category, percentage, spent, limit: budget.limit },
        });
      }
    }

    // Saving opportunities
    if (currentExpenses.length > 0) {
      const averageSpending = totalCurrentSpending / currentExpenses.length;
      const highSpendCategories = currentExpenses.filter((e) => e.total > averageSpending * 1.5);

      if (highSpendCategories.length > 0) {
        const topHigh = highSpendCategories[0];
        const potentialSavings = topHigh.total * 0.15;
        insights.push({
          type: 'saving_opportunity',
          title: 'Saving Opportunity',
          description: `By reducing ${topHigh.category} spending by just 15%, you could save approximately $${potentialSavings.toFixed(2)} this month.`,
          severity: 'success',
          data: { category: topHigh.category, potentialSavings },
        });
      }
    }

    // Goal progress insights
    const goals = db
      .prepare(
        `
        SELECT id, name, targetAmount, currentAmount, targetDate
        FROM goals
        WHERE user_id = ? AND currentAmount < targetAmount
        ORDER BY targetDate ASC
      `
      )
      .all(userId) as Array<{
      id: string;
      name: string;
      targetAmount: number;
      currentAmount: number;
      targetDate: string | null;
    }>;

    for (const goal of goals.slice(0, 1)) {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      const remaining = goal.targetAmount - goal.currentAmount;

      if (goal.targetDate) {
        const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0) {
          const dailyRequired = remaining / daysLeft;
          insights.push({
            type: 'goal_progress',
            title: 'Goal Progress',
            description: `To reach your ${goal.name} goal by ${new Date(goal.targetDate).toLocaleDateString()}, you need to save $${dailyRequired.toFixed(2)} per day.`,
            severity: 'info',
            data: { goalName: goal.name, progress, daysLeft, dailyRequired },
          });
        }
      }
    }

    return NextResponse.json({
      insights,
      summary: {
        totalSpending: totalCurrentSpending,
        categoriesTracked: currentExpenses.length,
        budgetsOnTrack: budgets.length - insights.filter((i) => i.type === 'budget_warning').length,
      },
    });
  } catch (error) {
    console.error('[v0] Insights error:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
