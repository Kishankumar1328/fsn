import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { BudgetSchema } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  try {
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

    const { category, limit_amount, period, start_date, end_date, alert_threshold } = validation.data;
    const db = getDb();
    const now = Date.now();
    const budgetId = uuidv4();

    db.prepare(`
      INSERT INTO budgets (id, user_id, category, limit_amount, spent_amount, period, start_date, end_date, alert_threshold, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(budgetId, user.id, category, limit_amount, 0, period, start_date, end_date || null, alert_threshold, now, now);

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
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDb();
    const budgets = db.prepare(`
      SELECT * FROM budgets WHERE user_id = ? ORDER BY created_at DESC
    `).all(user.id);

    return NextResponse.json({
      success: true,
      data: budgets,
    });
  } catch (error) {
    console.error('[v0] Get budgets error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
