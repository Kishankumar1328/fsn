import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDbAsync } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils-format';

interface Insight {
  type: 'spending_pattern' | 'budget_warning' | 'saving_opportunity' | 'goal_progress' | 'trend';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success';
  data?: any;
}

export async function GET(request: NextRequest) {
  try {
    await initializeDbAsync();
    const userProfile = await getCurrentUser(request);
    if (!userProfile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = userProfile.id;

    const db = getDb();
    const now = Date.now();
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
    const twoMonthsAgo = now - 60 * 24 * 60 * 60 * 1000;

    const insights: Insight[] = [];

    // Get current month expenses by category
    const currentExpenses = await db
      .prepare(
        `
        SELECT category, SUM(amount) as total, COUNT(*) as count
        FROM expenses
        WHERE user_id = ? AND date >= ?
        GROUP BY category
        ORDER BY total DESC
      `
      )
      .all(userId, monthAgo) as Array<{ category: string; total: number; count: number }>;

    // Get previous month expenses for trend analysis
    const previousExpenses = await db
      .prepare(
        `
        SELECT category, SUM(amount) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date < ?
        GROUP BY category
      `
      )
      .all(userId, twoMonthsAgo, monthAgo) as Array<{
        category: string;
        total: number;
      }>;

    const totalCurrentSpending = currentExpenses.reduce((sum, e) => sum + e.total, 0);
    const totalTransactions = currentExpenses.reduce((sum, e) => sum + e.count, 0);
    const avgTransactionAmount = totalTransactions > 0 ? totalCurrentSpending / totalTransactions : 0;

    // Behavioral Detection - Emotional Spending
    const emotionalExpenses = await db.prepare(`
        SELECT category, amount, mood, description
        FROM expenses
        WHERE user_id = ? AND date >= ? AND (mood = 'stressed' OR mood = 'bored' OR mood = 'sad')
    `).all(userId, monthAgo) as Array<{ category: string; amount: number; mood: string; description: string }>;

    if (emotionalExpenses.length > 0) {
      const emotionalTotal = emotionalExpenses.reduce((sum, e) => sum + e.amount, 0);
      if (emotionalTotal > totalCurrentSpending * 0.15) {
        insights.push({
          type: 'spending_pattern',
          title: 'Emotional Spending Spike',
          description: `You've spent ${formatCurrency(emotionalTotal)} while feeling stressed or bored. This accounts for ${(emotionalTotal / (totalCurrentSpending || 1) * 100).toFixed(0)}% of your monthly budget.`,
          severity: 'warning'
        });
      }
    }

    // Behavioral Detection - Anomaly Detection (Statistical)
    const largeTransactions = await db.prepare(`
       SELECT category, amount, description
       FROM expenses
       WHERE user_id = ? AND date >= ? AND amount > ?
    `).all(userId, monthAgo, avgTransactionAmount * 4) as Array<{ category: string; amount: number; description: string }>;

    if (largeTransactions.length > 0) {
      insights.push({
        type: 'trend',
        title: 'Financial Anomaly Detected',
        description: `We noticed ${largeTransactions.length} transactions significantly higher than your average (${formatCurrency(avgTransactionAmount)}). Review these for potential mis-logging or impulse.`,
        severity: 'info'
      });
    }

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

    // Behavioral Detection - Weekend Spikes
    // MySQL use DAYOFWEEK(FROM_UNIXTIME(date/1000)) IN (1, 7) for Sunday and Saturday
    const weekendExpenses = await db.prepare(`
      SELECT SUM(amount) as total
      FROM expenses
      WHERE user_id = ? AND date >= ? AND DAYOFWEEK(FROM_UNIXTIME(date/1000)) IN (1, 7)
    `).get(userId, monthAgo) as { total: number };

    const weekendTotal = weekendExpenses?.total || 0;
    const weekdayExpenses = totalCurrentSpending - weekendTotal;
    if (weekendTotal > weekdayExpenses * 0.8 && totalCurrentSpending > 0) {
      insights.push({
        type: 'spending_pattern',
        title: 'Weekend Spike Detected',
        description: 'Your weekend spending is significantly higher than your weekday average. This may indicate impulse spending.',
        severity: 'warning'
      });
    }

    // Behavioral Detection - Subscription Creep
    const potentialSubscriptions = await db.prepare(`
      SELECT category, amount, COUNT(*) as frequency
      FROM expenses
      WHERE user_id = ? AND date >= ?
      GROUP BY category, amount
      HAVING frequency >= 2
    `).all(userId, monthAgo) as Array<{ category: string; amount: number; frequency: number }>;

    if (potentialSubscriptions.length > 3) {
      insights.push({
        type: 'spending_pattern',
        title: 'Subscription Creep Alert',
        description: `We detected ${potentialSubscriptions.length} recurring transaction patterns. Review these to optimize your monthly outflow.`,
        severity: 'info'
      });
    }

    // Top spending category insight
    const topCategory = currentExpenses[0];
    if (topCategory) {
      const percentage = (topCategory.total / (totalCurrentSpending || 1)) * 100;
      insights.push({
        type: 'spending_pattern',
        title: 'Top Spending Category',
        description: `You spent the most on ${topCategory.category} (${percentage.toFixed(1)}% of monthly expenses).`,
        severity: 'info',
        data: { category: topCategory.category, amount: topCategory.total, percentage },
      });
    }

    // Budget warnings
    const budgets = await db
      .prepare(
        `
        SELECT id, category, limit_amount
        FROM budgets
        WHERE user_id = ?
      `
      )
      .all(userId) as Array<{ id: string; category: string; limit_amount: number }>;

    for (const budget of budgets) {
      const spent = currentExpenses.find((e) => e.category === budget.category)?.total || 0;
      const percentage = (spent / (budget.limit_amount || 1)) * 100;

      if (percentage > 80) {
        insights.push({
          type: 'budget_warning',
          title: percentage >= 100 ? 'Budget Exceeded' : 'Budget Alert',
          description:
            percentage >= 100
              ? `You have exceeded your ${budget.category} budget by ${formatCurrency(spent - budget.limit_amount)}`
              : `Your ${budget.category} budget is ${percentage.toFixed(0)}% used.`,
          severity: percentage >= 100 ? 'warning' : 'info',
          data: { category: budget.category, percentage, spent, limit: budget.limit_amount },
        });
      }
    }

    // Goal progress
    const goals = await db
      .prepare(
        `
        SELECT id, title, target_amount, current_amount, deadline
        FROM goals
        WHERE user_id = ? AND current_amount < target_amount
        ORDER BY deadline ASC
        LIMIT 1
      `
      )
      .all(userId) as Array<{
        id: string;
        title: string;
        target_amount: number;
        current_amount: number;
        deadline: number;
      }>;

    if (goals.length > 0) {
      const goal = goals[0];
      const remaining = goal.target_amount - goal.current_amount;
      const daysLeft = Math.ceil((goal.deadline - now) / (1000 * 60 * 60 * 24));

      if (daysLeft > 0) {
        const dailyRequired = remaining / daysLeft;
        insights.push({
          type: 'goal_progress',
          title: 'Goal Target Analysis',
          description: `To reach your ${goal.title} goal in ${daysLeft} days, you need to set aside ${formatCurrency(dailyRequired)} per day.`,
          severity: 'info'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        insights,
        summary: {
          totalSpending: totalCurrentSpending,
          categoriesTracked: currentExpenses.length,
          budgetsOnTrack: budgets.length - insights.filter((i: any) => i.type === 'budget_warning').length,
        },
      },
    });
  } catch (error) {
    console.error('[v0] Insights error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
