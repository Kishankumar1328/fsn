import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, initializeDbAsync } from '@/lib/db';
import { ExpenseSchema } from '@/lib/schemas';

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
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?').get(id, user.id);

    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error('[v0] Get expense error:', error);
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
    const existing = db.prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?').get(id, user.id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = ExpenseSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { category, amount, description, date, payment_method, tags } = validation.data;
    const now = Date.now();

    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (amount !== undefined) {
      updates.push('amount = ?');
      values.push(amount);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (date !== undefined) {
      updates.push('date = ?');
      values.push(date);
    }
    if (payment_method !== undefined) {
      updates.push('payment_method = ?');
      values.push(payment_method);
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      values.push(tags);
    }

    values.push(id, user.id);

    db.prepare(`UPDATE expenses SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('[v0] Update expense error:', error);
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
    const existing = db.prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?').get(id, user.id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      );
    }

    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    console.error('[v0] Delete expense error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
