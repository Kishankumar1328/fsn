import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, initializeDbAsync } from '@/lib/db';
import { BudgetSchema } from '@/lib/schemas';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initializeDbAsync();
    const { id } = await params;
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDb();
    const budget = db.prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?').get(id, user.id);

    if (!budget) {
      return NextResponse.json(
        { success: false, error: 'Budget not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: budget,
    });
  } catch (error) {
    console.error('[v0] Get budget error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initializeDbAsync();
    const { id } = await params;
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?').get(id, user.id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Budget not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    console.log(`[v0] Updating budget ${id}:`, body);

    const validation = BudgetSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { category, limit_amount, spent_amount, period, start_date, end_date, alert_threshold } = validation.data;
    const now = Date.now();

    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (limit_amount !== undefined) {
      updates.push('limit_amount = ?');
      values.push(limit_amount);
    }
    if (spent_amount !== undefined) {
      updates.push('spent_amount = ?');
      values.push(spent_amount);
    }
    if (period !== undefined) {
      updates.push('period = ?');
      values.push(period);
    }
    if (start_date !== undefined) {
      updates.push('start_date = ?');
      values.push(start_date);
    }
    if (end_date !== undefined) {
      updates.push('end_date = ?');
      values.push(end_date || null);
    }
    if (alert_threshold !== undefined) {
      updates.push('alert_threshold = ?');
      values.push(alert_threshold);
    }

    values.push(id, user.id);

    const result = db.prepare(`UPDATE budgets SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
    console.log(`[v0] Budget update result for ${id}:`, result);

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update budget (no changes made or unauthorized)' },
        { status: 400 }
      );
    }

    const updated = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Budget updated successfully'
    });
  } catch (error) {
    console.error('[v0] Update budget error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initializeDbAsync();
    const { id } = await params;
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?').get(id, user.id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Budget not found' },
        { status: 404 }
      );
    }

    db.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?').run(id, user.id);

    return NextResponse.json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    console.error('[v0] Delete budget error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
