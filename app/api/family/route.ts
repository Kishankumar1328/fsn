import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from '@/lib/auth';
import { getDb, initializeDbAsync } from '@/lib/db';
import { z } from 'zod';

const GroupSchema = z.object({ name: z.string().min(1).max(60) });
const InviteSchema = z.object({ email: z.string().email() });

// GET /api/family → get user's group + members
export async function GET(request: NextRequest) {
    try {
        await initializeDbAsync();
        const user = getCurrentUser(request);
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const db = getDb();

        // Find a group where user is owner or member
        const membership = db.prepare(`
      SELECT fg.* FROM family_groups fg
      LEFT JOIN family_members fm ON fm.group_id = fg.id AND fm.user_id = ?
      WHERE fg.owner_id = ? OR fm.user_id = ?
      LIMIT 1
    `).get(user.id, user.id, user.id) as any;

        if (!membership) {
            return NextResponse.json({ success: true, data: { group: null, members: [], invites: [] } });
        }

        const members = db.prepare(`
      SELECT fm.id, fm.role, fm.joined_at, u.name, u.email
      FROM family_members fm
      JOIN users u ON u.id = fm.user_id
      WHERE fm.group_id = ?
    `).all(membership.id) as any[];

        // Also include owner info
        const owner = db.prepare(`SELECT id, name, email FROM users WHERE id = ?`).get(membership.owner_id) as any;

        const pendingInvites = db.prepare(`
      SELECT * FROM family_invites WHERE group_id = ? AND status = 'pending'
    `).all(membership.id) as any[];

        // Combined recent expenses of all members (for shared view)
        const memberIds = [membership.owner_id, ...members.map((m: any) => m.user_id ?? m.id)].filter(Boolean);
        const placeholders = memberIds.map(() => '?').join(',');
        const sharedExpenses = memberIds.length > 0
            ? db.prepare(`
          SELECT e.*, u.name AS member_name
          FROM expenses e
          JOIN users u ON u.id = e.user_id
          WHERE e.user_id IN (${placeholders})
            AND e.date >= ?
          ORDER BY e.date DESC LIMIT 50
        `).all(...memberIds, Date.now() - 30 * 24 * 60 * 60 * 1000) as any[]
            : [];

        return NextResponse.json({
            success: true,
            data: { group: membership, owner, members, invites: pendingInvites, sharedExpenses },
        });
    } catch (error) {
        console.error('[FinSentinel] Family GET error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/family → create a new group
export async function POST(request: NextRequest) {
    try {
        await initializeDbAsync();
        const user = getCurrentUser(request);
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const action = body.action as string;
        const db = getDb();
        const now = Date.now();

        if (action === 'create') {
            const validation = GroupSchema.safeParse(body);
            if (!validation.success) {
                return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 });
            }
            const groupId = uuidv4();
            db.prepare(`
        INSERT INTO family_groups (id, name, owner_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(groupId, validation.data.name, user.id, now, now);
            return NextResponse.json({ success: true, data: { groupId } }, { status: 201 });
        }

        if (action === 'invite') {
            const { groupId } = body;
            const validation = InviteSchema.safeParse(body);
            if (!validation.success) {
                return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 });
            }
            // Verify requester is owner
            const group = db.prepare(`SELECT * FROM family_groups WHERE id = ? AND owner_id = ?`).get(groupId, user.id) as any;
            if (!group) return NextResponse.json({ success: false, error: 'Group not found or not owner' }, { status: 403 });

            const token = uuidv4();
            const inviteId = uuidv4();
            db.prepare(`
        INSERT INTO family_invites (id, group_id, invited_email, invited_by, token, status, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
      `).run(inviteId, groupId, validation.data.email, user.id, token, now + 7 * 24 * 60 * 60 * 1000, now);

            // Token returned so caller can send email / display link
            return NextResponse.json({ success: true, data: { token, inviteId } }, { status: 201 });
        }

        if (action === 'accept') {
            const { token } = body;
            const invite = db.prepare(`
        SELECT * FROM family_invites WHERE token = ? AND status = 'pending' AND expires_at > ?
      `).get(token, now) as any;
            if (!invite) return NextResponse.json({ success: false, error: 'Invalid or expired invite' }, { status: 400 });

            db.prepare(`
        INSERT OR IGNORE INTO family_members (id, group_id, user_id, role, joined_at)
        VALUES (?, ?, ?, 'member', ?)
      `).run(uuidv4(), invite.group_id, user.id, now);
            db.prepare(`UPDATE family_invites SET status = 'accepted' WHERE id = ?`).run(invite.id);
            return NextResponse.json({ success: true, message: 'Joined family group' });
        }

        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    } catch (error) {
        console.error('[FinSentinel] Family POST error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
