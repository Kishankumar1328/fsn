import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from '@/lib/auth';
import { getDb, initializeDbAsync } from '@/lib/db';
import { z } from 'zod';

const InvestmentSchema = z.object({
    ticker: z.string().min(1).max(10).toUpperCase(),
    name: z.string().min(1).max(100),
    type: z.enum(['stock', 'etf', 'crypto', 'bond', 'mutual_fund', 'real_estate', 'other']),
    shares: z.number().positive(),
    buy_price: z.number().positive(),
    current_price: z.number().positive(),
    buy_date: z.number().int().positive(),
    sector: z.string().optional(),
    notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        await initializeDbAsync();
        const user = getCurrentUser(request);
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const db = getDb();
        const investments = db.prepare(`SELECT * FROM investments WHERE user_id = ? ORDER BY buy_date DESC`).all(user.id) as any[];

        // Compute summary stats
        const totalInvested = investments.reduce((s, i) => s + i.buy_price * i.shares, 0);
        const totalValue = investments.reduce((s, i) => s + i.current_price * i.shares, 0);
        const totalGain = totalValue - totalInvested;
        const totalGainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

        // Portfolio allocation by type
        const allocationMap: Record<string, number> = {};
        investments.forEach((inv) => {
            const val = inv.current_price * inv.shares;
            allocationMap[inv.type] = (allocationMap[inv.type] || 0) + val;
        });
        const allocation = Object.entries(allocationMap).map(([type, value]) => ({
            type,
            value,
            percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
        }));

        return NextResponse.json({
            success: true,
            data: {
                investments,
                summary: { totalInvested, totalValue, totalGain, totalGainPct },
                allocation,
            },
        });
    } catch (error) {
        console.error('[FinSentinel] Get investments error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await initializeDbAsync();
        const user = getCurrentUser(request);
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const validation = InvestmentSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 });
        }

        const { ticker, name, type, shares, buy_price, current_price, buy_date, sector, notes } = validation.data;
        const db = getDb();
        const now = Date.now();
        const id = uuidv4();

        db.prepare(`
      INSERT INTO investments (id, user_id, ticker, name, type, shares, buy_price, current_price, buy_date, sector, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, user.id, ticker, name, type, shares, buy_price, current_price, buy_date, sector || null, notes || null, now, now);

        const investment = db.prepare(`SELECT * FROM investments WHERE id = ?`).get(id);
        return NextResponse.json({ success: true, data: investment }, { status: 201 });
    } catch (error) {
        console.error('[FinSentinel] Create investment error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
