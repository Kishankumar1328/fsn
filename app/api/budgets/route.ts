import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from '@/lib/auth';
import { getDb, initializeDbAsync } from '@/lib/db';
import { BudgetSchema } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  try {
    await initializeDbAsync();
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = BudgetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { category, limit_amount, spent_amount, period, start_date, end_date, alert_threshold } = validation.data;
    const db = getDb();
    const now = Date.now();
    const budgetId = uuidv4();

    db.prepare(`
      INSERT INTO budgets (id, user_id, category, limit_amount, spent_amount, period, start_date, end_date, alert_threshold, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(budgetId, user.id, category, limit_amount, spent_amount || 0, period, start_date, end_date || null, alert_threshold, now, now);

    const budget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(budgetId);

    return NextResponse.json(
      {
        success: true,
        data: budget,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Create budget error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Fetch all budgets for this user
    const budgets = db.prepare(`
      SELECT * FROM budgets WHERE user_id = ? ORDER BY created_at DESC
    `).all(user.id) as any[];

    // Calculate LIVE spent_amount from actual expenses (last 30 days, case-insensitive category match)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const budgetsWithLiveSpend = budgets.map((budget: any) => {
      const spentResult = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as spent
        FROM expenses
        WHERE user_id = ? AND LOWER(category) = LOWER(?) AND date >= ?
      `).get(user.id, budget.category, thirtyDaysAgo) as any;

      return {
        ...budget,
        spent_amount: spentResult?.spent || 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: budgetsWithLiveSpend,
    });
  } catch (error) {
    console.error('[v0] Get budgets error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

