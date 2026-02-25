import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from '@/lib/auth';
import { getDb, initializeDbAsync } from '@/lib/db';
import { z } from 'zod';

const TaxEventSchema = z.object({
    year: z.number().int().min(2000).max(2100),
    category: z.enum([
        'medical', 'charity', 'education', 'home_office', 'business_travel',
        'investment_loss', 'retirement_contribution', 'mortgage_interest', 'property_tax', 'other',
    ]),
    amount: z.number().positive(),
    description: z.string().optional(),
    is_deductible: z.boolean().default(false),
    receipt_ref: z.string().optional(),
});

const TAX_TIPS: Record<string, string> = {
    medical: 'Medical expenses exceeding 7.5% of AGI are deductible.',
    charity: 'Charitable donations up to 60% of AGI can be deducted if itemizing.',
    education: 'American Opportunity Credit offers up to $2,500/year per eligible student.',
    home_office: 'Exclusive business use of home qualifies for the home office deduction.',
    business_travel: 'Keep mileage logs — standard rate in 2024 is 67¢/mile for business.',
    investment_loss: 'Capital losses offset gains and up to $3,000 of ordinary income annually.',
    retirement_contribution: '401(k) contributions reduce taxable income — max $23,000 in 2024.',
    mortgage_interest: 'Interest on up to $750,000 of mortgage principal is deductible.',
    property_tax: 'SALT deduction capped at $10,000 combined state/local taxes.',
    other: 'Keep all receipts and consult a CPA for unusual deductions.',
};

export async function GET(request: NextRequest) {
    try {
        await initializeDbAsync();
        const user = getCurrentUser(request);
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const url = new URL(request.url);
        const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));

        const db = getDb();
        const events = db.prepare(`
      SELECT * FROM tax_events WHERE user_id = ? AND year = ? ORDER BY created_at DESC
    `).all(user.id, year) as any[];

        // Auto-scan deductible expenses from the main expenses table
        const deductibleExpenses = db.prepare(`
      SELECT category, SUM(amount) as total, COUNT(*) as count
      FROM expenses
      WHERE user_id = ?
        AND date >= ?
        AND date < ?
        AND LOWER(category) IN ('medical','charity','education','home office','business')
      GROUP BY category
    `).all(user.id, new Date(year, 0, 1).getTime(), new Date(year + 1, 0, 1).getTime()) as any[];

        const totalDeductible = events.filter(e => e.is_deductible).reduce((s, e) => s + e.amount, 0);
        const totalNonDeductible = events.filter(e => !e.is_deductible).reduce((s, e) => s + e.amount, 0);

        // Category breakdown
        const byCategory: Record<string, { deductible: number; nonDeductible: number; tip: string }> = {};
        events.forEach((e) => {
            if (!byCategory[e.category]) byCategory[e.category] = { deductible: 0, nonDeductible: 0, tip: TAX_TIPS[e.category] || '' };
            if (e.is_deductible) byCategory[e.category].deductible += e.amount;
            else byCategory[e.category].nonDeductible += e.amount;
        });

        return NextResponse.json({
            success: true,
            data: {
                events,
                year,
                summary: { totalDeductible, totalNonDeductible, estimatedTaxSaving: totalDeductible * 0.22 },
                deductibleExpenses,
                byCategory,
                tips: Object.values(TAX_TIPS),
            },
        });
    } catch (error) {
        console.error('[FinSentinel] Tax GET error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await initializeDbAsync();
        const user = getCurrentUser(request);
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const validation = TaxEventSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 });
        }

        const { year, category, amount, description, is_deductible, receipt_ref } = validation.data;
        const db = getDb();
        const now = Date.now();
        const id = uuidv4();

        db.prepare(`
      INSERT INTO tax_events (id, user_id, year, category, amount, description, is_deductible, receipt_ref, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, user.id, year, category, amount, description || null, is_deductible ? 1 : 0, receipt_ref || null, now, now);

        const event = db.prepare(`SELECT * FROM tax_events WHERE id = ?`).get(id);
        return NextResponse.json({ success: true, data: event }, { status: 201 });
    } catch (error) {
        console.error('[FinSentinel] Tax POST error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
