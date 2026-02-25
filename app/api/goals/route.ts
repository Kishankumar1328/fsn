import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from '@/lib/auth';
import { getDb, initializeDbAsync } from '@/lib/db';
import { GoalSchema } from '@/lib/schemas';

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
    const validation = GoalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, target_amount, current_amount, deadline, category, priority } = validation.data;
    const db = getDb();
    const now = Date.now();
    const goalId = uuidv4();

    db.prepare(`
      INSERT INTO goals (id, user_id, title, target_amount, current_amount, deadline, category, priority, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(goalId, user.id, title, target_amount, current_amount || 0, deadline, category, priority, 'active', now, now);

    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(goalId);

    return NextResponse.json(
      {
        success: true,
        data: goal,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Create goal error:', error);
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
    const goals = db.prepare(`
      SELECT * FROM goals WHERE user_id = ? ORDER BY deadline ASC
    `).all(user.id);

    return NextResponse.json({
      success: true,
      data: goals,
    });
  } catch (error) {
    console.error('[v0] Get goals error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
