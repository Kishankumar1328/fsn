import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, initializeDbAsync } from '@/lib/db';
import { IncomeSchema } from '@/lib/schemas';

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
    const income = db.prepare('SELECT * FROM income WHERE id = ? AND user_id = ?').get(id, user.id);

    if (!income) {
      return NextResponse.json(
        { success: false, error: 'Income not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: income,
    });
  } catch (error) {
    console.error('[v0] Get income error:', error);
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
    const existing = db.prepare('SELECT * FROM income WHERE id = ? AND user_id = ?').get(id, user.id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Income not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = IncomeSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { source, amount, description, date, recurring, recurrence_period } = validation.data;
    const now = Date.now();

    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (source !== undefined) {
      updates.push('source = ?');
      values.push(source);
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
    if (recurring !== undefined) {
      updates.push('recurring = ?');
      values.push(recurring ? 1 : 0);
    }
    if (recurrence_period !== undefined) {
      updates.push('recurrence_period = ?');
      values.push(recurrence_period);
    }

    values.push(id, user.id);

    db.prepare(`UPDATE income SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM income WHERE id = ?').get(id);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('[v0] Update income error:', error);
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
    const existing = db.prepare('SELECT * FROM income WHERE id = ? AND user_id = ?').get(id, user.id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Income not found' },
        { status: 404 }
      );
    }

    db.prepare('DELETE FROM income WHERE id = ?').run(id);

    return NextResponse.json({
      success: true,
      message: 'Income deleted successfully',
    });
  } catch (error) {
    console.error('[v0] Delete income error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
