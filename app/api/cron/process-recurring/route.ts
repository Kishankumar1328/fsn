import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb, initializeDbAsync } from '@/lib/db';

// Secured Vercel Cron endpoint – runs daily at 08:00 UTC
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await initializeDbAsync();
        const db = getDb();
        const now = Date.now();
        let processed = 0;

        // Fetch all active recurring transactions due today or earlier
        const dueTransactions = db.prepare(`
      SELECT * FROM recurring_transactions
      WHERE is_active = 1 AND next_date <= ?
    `).all(now) as any[];

        for (const tx of dueTransactions) {
            const id = uuidv4();

            if (tx.type === 'expense') {
                db.prepare(`
          INSERT INTO expenses (id, user_id, category, amount, description, date, payment_method, is_donation, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 'auto-recurring', 0, ?, ?)
        `).run(id, tx.user_id, tx.category, tx.amount, tx.description, now, now, now);
            } else if (tx.type === 'income') {
                db.prepare(`
          INSERT INTO income (id, user_id, source, amount, description, date, recurring, recurrence_period, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
        `).run(id, tx.user_id, tx.category, tx.amount, tx.description, now, tx.frequency, now, now);
            }

            // Compute next run date
            const nextDate = computeNextDate(tx.next_date, tx.frequency);
            db.prepare(`
        UPDATE recurring_transactions SET last_executed = ?, next_date = ?, updated_at = ? WHERE id = ?
      `).run(now, nextDate, now, tx.id);

            processed++;
        }

        return NextResponse.json({ success: true, processed, total: dueTransactions.length });
    } catch (error) {
        console.error('[FinSentinel] Cron - process-recurring error:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

function computeNextDate(currentNext: number, frequency: string): number {
    const d = new Date(currentNext);
    switch (frequency) {
        case 'daily': d.setDate(d.getDate() + 1); break;
        case 'weekly': d.setDate(d.getDate() + 7); break;
        case 'biweekly': d.setDate(d.getDate() + 14); break;
        case 'monthly': d.setMonth(d.getMonth() + 1); break;
        case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
        default: d.setMonth(d.getMonth() + 1); break;
    }
    return d.getTime();
}
