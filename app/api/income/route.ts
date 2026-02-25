import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from '@/lib/auth';
import { getDb, initializeDbAsync } from '@/lib/db';
import { IncomeSchema } from '@/lib/schemas';

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
    const validation = IncomeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { source, amount, description, date, recurring, recurrence_period } = validation.data;
    const db = getDb();
    const now = Date.now();
    const incomeId = uuidv4();

    db.prepare(`
      INSERT INTO income (id, user_id, source, amount, description, date, recurring, recurrence_period, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(incomeId, user.id, source, amount, description || null, date, recurring ? 1 : 0, recurrence_period || null, now, now);

    const income = db.prepare('SELECT * FROM income WHERE id = ?').get(incomeId);

    return NextResponse.json(
      {
        success: true,
        data: income,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Create income error:', error);
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const db = getDb();

    // Get total count
    const countResult = db.prepare('SELECT COUNT(*) as count FROM income WHERE user_id = ?').get(user.id) as any;
    const total = countResult.count;

    // Get paginated results
    const offset = (page - 1) * limit;
    const incomes = db.prepare(`
      SELECT * FROM income WHERE user_id = ?
      ORDER BY date DESC LIMIT ? OFFSET ?
    `).all(user.id, limit, offset);

    return NextResponse.json({
      success: true,
      data: {
        incomes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('[v0] Get income error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
