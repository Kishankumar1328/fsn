import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { v4 as uuid } from 'uuid';
import { recurringSchema } from '@/lib/schemas';

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
        SELECT id, name, amount, category, frequency, nextDueDate, isActive
        FROM recurring_transactions
        WHERE user_id = ?
        ORDER BY nextDueDate ASC
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
    const validated = recurringSchema.parse(body);

    const db = getDb();
    const id = uuid();

    db.prepare(
      `
      INSERT INTO recurring_transactions (id, user_id, name, amount, category, frequency, nextDueDate, isActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `
    ).run(id, userId, validated.name, validated.amount, validated.category, validated.frequency, validated.nextDueDate);

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('[v0] Recurring creation error:', error);
    return NextResponse.json({ error: 'Failed to create recurring transaction' }, { status: 500 });
  }
}
