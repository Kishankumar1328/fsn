import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, initializeDbAsync } from '@/lib/db';
import { z } from 'zod';

const UpdateSchema = z.object({
    ticker: z.string().optional(),
    name: z.string().optional(),
    shares: z.number().positive().optional(),
    buy_price: z.number().positive().optional(),
    current_price: z.number().positive().optional(),
    sector: z.string().optional(),
    notes: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await initializeDbAsync();
        const user = getCurrentUser(request);
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const validation = UpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 });
        }

        const db = getDb();
        const existing = db.prepare(`SELECT * FROM investments WHERE id = ? AND user_id = ?`).get(params.id, user.id) as any;
        if (!existing) return NextResponse.json({ success: false, error: 'Investment not found' }, { status: 404 });

        const data = validation.data;
        db.prepare(`
      UPDATE investments SET
        ticker = ?, name = ?, shares = ?, buy_price = ?, current_price = ?, sector = ?, notes = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
            data.ticker ?? existing.ticker,
            data.name ?? existing.name,
            data.shares ?? existing.shares,
            data.buy_price ?? existing.buy_price,
            data.current_price ?? existing.current_price,
            data.sector ?? existing.sector,
            data.notes ?? existing.notes,
            Date.now(),
            params.id,
            user.id
        );

        const updated = db.prepare(`SELECT * FROM investments WHERE id = ?`).get(params.id);
        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error('[FinSentinel] Update investment error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await initializeDbAsync();
        const user = getCurrentUser(request);
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const db = getDb();
        const result = db.prepare(`DELETE FROM investments WHERE id = ? AND user_id = ?`).run(params.id, user.id);
        if (!result.changes) return NextResponse.json({ success: false, error: 'Investment not found' }, { status: 404 });

        return NextResponse.json({ success: true, message: 'Investment deleted' });
    } catch (error) {
        console.error('[FinSentinel] Delete investment error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
