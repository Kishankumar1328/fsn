import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb, initializeDbAsync } from '@/lib/db';

// Vercel Cron – runs every Monday at 09:00 UTC
// Sends budget warning emails when spend > alert_threshold % of limit
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await initializeDbAsync();
        const db = getDb();
        const now = Date.now();
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

        // Get all budgets with user email
        const budgets = db.prepare(`
      SELECT b.*, u.email, u.name
      FROM budgets b
      JOIN users u ON u.id = b.user_id
    `).all() as any[];

        const alerts: Array<{ email: string; name: string; category: string; spent: number; limit: number; pct: number }> = [];

        for (const budget of budgets) {
            const spentResult = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as spent
        FROM expenses
        WHERE user_id = ? AND LOWER(category) = LOWER(?) AND date >= ?
      `).get(budget.user_id, budget.category, thirtyDaysAgo) as any;

            const spent = spentResult?.spent || 0;
            const pct = budget.limit_amount > 0 ? (spent / budget.limit_amount) * 100 : 0;

            if (pct >= (budget.alert_threshold || 80)) {
                alerts.push({ email: budget.email, name: budget.name, category: budget.category, spent, limit: budget.limit_amount, pct });
            }
        }

        if (alerts.length === 0) {
            return NextResponse.json({ success: true, sent: 0, message: 'No budgets exceeded threshold' });
        }

        // Group by email
        const byUser: Record<string, typeof alerts> = {};
        alerts.forEach((a) => { (byUser[a.email] = byUser[a.email] || []).push(a); });

        let sent = 0;
        for (const [email, userAlerts] of Object.entries(byUser)) {
            const emailSent = await sendBudgetAlertEmail(email, userAlerts[0].name, userAlerts);
            if (emailSent) {
                // Log notification
                db.prepare(`
          INSERT INTO notification_log (id, user_id, type, payload, sent_at)
          SELECT ?, id, 'budget_alert', ?, ? FROM users WHERE email = ?
        `).run(uuidv4(), JSON.stringify(userAlerts.map(a => a.category)), now, email);
                sent++;
            }
        }

        return NextResponse.json({ success: true, sent, total: Object.keys(byUser).length });
    } catch (error) {
        console.error('[FinSentinel] Cron - budget-alerts error:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

async function sendBudgetAlertEmail(
    email: string,
    name: string,
    alerts: Array<{ category: string; spent: number; limit: number; pct: number }>
): Promise<boolean> {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[FinSentinel] RESEND_API_KEY not set – skipping email');
        return false;
    }

    const rows = alerts
        .map(a => `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-weight:600">${a.category}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#ef4444">$${a.spent.toFixed(2)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#6b7280">$${a.limit.toFixed(2)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-weight:700;color:${a.pct >= 100 ? '#ef4444' : '#f59e0b'}">${a.pct.toFixed(1)}%</td>
    </tr>`)
        .join('');

    const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#fafafa;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px">⚠️ Budget Alert</h1>
        <p style="color:#e0e7ff;margin:8px 0 0">FinSentinel – Financial Guardian</p>
      </div>
      <div style="padding:24px">
        <p style="color:#374151;font-size:15px">Hi ${name},</p>
        <p style="color:#6b7280;font-size:14px">The following budgets are approaching or have exceeded their limits:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06)">
          <thead>
            <tr style="background:#f5f3ff;color:#6d28d9;font-size:12px;text-transform:uppercase">
              <th style="padding:10px 12px;text-align:left">Category</th>
              <th style="padding:10px 12px;text-align:left">Spent</th>
              <th style="padding:10px 12px;text-align:left">Limit</th>
              <th style="padding:10px 12px;text-align:left">Used</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/budgets"
           style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;margin-top:8px">
          Review Budgets →
        </a>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:12px;padding:16px">FinSentinel · You can update alert thresholds in Settings</p>
    </div>
  `;

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'noreply@finsentinel.app',
            to: email,
            subject: `⚠️ Budget Alert – ${alerts.length} budget${alerts.length > 1 ? 's' : ''} over threshold`,
            html,
        }),
    });

    return res.ok;
}
