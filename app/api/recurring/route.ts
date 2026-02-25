import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { v4 as uuid } from 'uuid';
import { RecurringTransactionSchema } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const recurring = db
      .prepare(
        `
        SELECT id, type, description, amount, category, frequency, next_date, is_active
        FROM recurring_transactions
        WHERE user_id = ?
        ORDER BY next_date ASC
      `
      )
      .all(userId);

    return NextResponse.json(recurring);
  } catch (error) {
    console.error('[v0] Recurring fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch recurring transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = RecurringTransactionSchema.parse(body);

    const db = getDb();
    const id = uuid();
    const now = Date.now();

    db.prepare(
      `
      INSERT INTO recurring_transactions (id, user_id, type, amount, description, category, frequency, next_date, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `
    ).run(id, userId, validated.type, validated.amount, validated.description || null, validated.category, validated.frequency, validated.next_date, now, now);

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('[v0] Recurring creation error:', error);
    return NextResponse.json({ error: 'Failed to create recurring transaction' }, { status: 500 });
  }
}
