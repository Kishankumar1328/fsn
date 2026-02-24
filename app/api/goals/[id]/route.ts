import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { UpdateGoalSchema } from '@/lib/schemas';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDb();
    const goal = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(params.id, user.id);

    if (!goal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: goal,
    });
  } catch (error) {
    console.error('[v0] Get goal error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(params.id, user.id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = UpdateGoalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, target_amount, current_amount, deadline, priority, status } = validation.data;
    const now = Date.now();

    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (target_amount !== undefined) {
      updates.push('target_amount = ?');
      values.push(target_amount);
    }
    if (current_amount !== undefined) {
      updates.push('current_amount = ?');
      values.push(current_amount);
    }
    if (deadline !== undefined) {
      updates.push('deadline = ?');
      values.push(deadline);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    values.push(params.id, user.id);

    db.prepare(`UPDATE goals SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(params.id);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('[v0] Update goal error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(params.id, user.id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      );
    }

    db.prepare('DELETE FROM goals WHERE id = ?').run(params.id);

    return NextResponse.json({
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    console.error('[v0] Delete goal error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
