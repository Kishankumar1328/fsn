import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDbAsync } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { DonationSchema } from '@/lib/schemas';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
    try {
        await initializeDbAsync();
        const user = getCurrentUser(request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const db = getDb();
        const donations = db.prepare('SELECT * FROM donations WHERE user_id = ? ORDER BY date DESC').all(user.id);

        return NextResponse.json({
            success: true,
            data: donations,
        });
    } catch (error) {
        console.error('[v0] Get donations error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await initializeDbAsync();
        const user = getCurrentUser(request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validation = DonationSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const db = getDb();
        const donationId = uuidv4();
        const { organization, amount, cause, date, impact_description } = validation.data;
        const now = Date.now();

        db.prepare(`
      INSERT INTO donations (id, user_id, organization, amount, cause, date, impact_description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            donationId,
            user.id,
            organization,
            amount,
            cause,
            date,
            impact_description || '',
            now,
            now
        );

        // Also Log as an expense automatically tagged as donation
        const expenseId = uuidv4();
        db.prepare(`
      INSERT INTO expenses (id, user_id, category, amount, description, date, payment_method, is_donation, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            expenseId,
            user.id,
            'Donations',
            amount,
            `Charity: ${organization} (${cause})`,
            date,
            'charity',
            1,
            now,
            now
        );

        return NextResponse.json({
            success: true,
            data: { id: donationId, organization, amount, cause },
        });
    } catch (error: any) {
        console.error('[v0] Create donation error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}
