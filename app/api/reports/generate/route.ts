import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { format = 'json', startDate, endDate } = await request.json();

    const db = getDb();
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Get user profile
    const user = db
      .prepare('SELECT email, name FROM users WHERE id = ?')
      .get(userId) as { email: string; name: string } | undefined;

    // Get expenses for the period
    const expenses = db
      .prepare(
        `
        SELECT id, description, amount, category, date
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ?
        ORDER BY date DESC
      `
      )
      .all(userId, start.toISOString(), end.toISOString()) as Array<{
      id: string;
      description: string;
      amount: number;
      category: string;
      date: string;
    }>;

    // Get income for the period
    const income = db
      .prepare(
        `
        SELECT id, source, amount, date
        FROM income
        WHERE user_id = ? AND date >= ? AND date <= ?
        ORDER BY date DESC
      `
      )
      .all(userId, start.toISOString(), end.toISOString()) as Array<{
      id: string;
      source: string;
      amount: number;
      date: string;
    }>;

    // Calculate summary
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const netIncome = totalIncome - totalExpenses;

    // Group expenses by category
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach((exp) => {
      expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amount;
    });

    // Get budgets for comparison
    const budgets = db
      .prepare(
        `
        SELECT category, name, limit
        FROM budgets
        WHERE user_id = ?
      `
      )
      .all(userId) as Array<{ category: string; name: string; limit: number }>;

    const reportData = {
      generatedAt: new Date().toISOString(),
      period: {
        from: start.toISOString().split('T')[0],
        to: end.toISOString().split('T')[0],
      },
      user: {
        name: user?.name || 'User',
        email: user?.email,
      },
      summary: {
        totalIncome,
        totalExpenses,
        netIncome,
        transactionCount: expenses.length + income.length,
      },
      expensesByCategory,
      budgetComparison: budgets.map((b) => ({
        category: b.category,
        name: b.name,
        limit: b.limit,
        spent: expensesByCategory[b.category] || 0,
        remaining: b.limit - (expensesByCategory[b.category] || 0),
        percentage: ((expensesByCategory[b.category] || 0) / b.limit) * 100,
      })),
      topExpenses: expenses.slice(0, 5).map((e) => ({
        description: e.description,
        amount: e.amount,
        category: e.category,
        date: e.date.split('T')[0],
      })),
    };

    if (format === 'json') {
      return NextResponse.json(reportData);
    } else if (format === 'csv') {
      // Generate CSV format
      let csv = 'Financial Report\n';
      csv += `Generated: ${new Date().toLocaleString()}\n`;
      csv += `Period: ${reportData.period.from} to ${reportData.period.to}\n\n`;

      csv += 'SUMMARY\n';
      csv += `Total Income,${reportData.summary.totalIncome}\n`;
      csv += `Total Expenses,${reportData.summary.totalExpenses}\n`;
      csv += `Net Income,${reportData.summary.netIncome}\n\n`;

      csv += 'EXPENSES BY CATEGORY\n';
      csv += 'Category,Amount\n';
      Object.entries(expensesByCategory).forEach(([category, amount]) => {
        csv += `${category},${amount}\n`;
      });

      csv += '\nBUDGET COMPARISON\n';
      csv += 'Category,Limit,Spent,Remaining,Percentage\n';
      reportData.budgetComparison.forEach((b) => {
        csv += `${b.category},${b.limit},${b.spent},${b.remaining},${b.percentage.toFixed(2)}%\n`;
      });

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=financial-report.csv',
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('[v0] Report generation error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
