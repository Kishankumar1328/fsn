'use client';

import { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import { useAuth } from '@/hooks/use-auth';
import {
    Users, Plus, UserPlus, Mail, Copy, Check, Crown, RefreshCw,
    DollarSign, Share2, X, LogIn
} from 'lucide-react';

const fetcher = (url: string) =>
    fetch(url, { credentials: 'include' }).then(r => r.json()).then(d => d.data);

const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

export default function FamilyPage() {
    const { user } = useAuth();
    const { data, isLoading } = useSWR(user ? '/api/family' : null, fetcher);

    const [creating, setCreating] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteToken, setInviteToken] = useState('');
    const [copiedToken, setCopiedToken] = useState(false);
    const [joinToken, setJoinToken] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [tab, setTab] = useState<'overview' | 'expenses' | 'invite'>('overview');

    const post = async (payload: object) => {
        const res = await fetch('/api/family', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
        });
        return res.json();
    };

    const handleCreateGroup = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        await post({ action: 'create', name: groupName });
        mutate('/api/family');
        setCreating(false);
        setGroupName('');
        setSubmitting(false);
    }, [groupName]);

    const handleInvite = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const result = await post({ action: 'invite', groupId: data?.group?.id, email: inviteEmail });
        if (result.success) {
            setInviteToken(result.data.token);
            mutate('/api/family');
        }
        setSubmitting(false);
    }, [inviteEmail, data]);

    const handleJoin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const result = await post({ action: 'accept', token: joinToken });
        if (result.success) {
            mutate('/api/family');
            setJoinToken('');
        }
        setSubmitting(false);
    }, [joinToken]);

    const copyToken = () => {
        navigator.clipboard.writeText(`${window.location.origin}/dashboard/family?invite=${inviteToken}`);
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 text-violet-500 animate-spin" />
                    </div>
                    <p className="text-muted-foreground text-sm">Loading family data…</p>
                </div>
            </div>
        );
    }

    const group = data?.group;
    const members: any[] = data?.members || [];
    const owner = data?.owner;
    const invites: any[] = data?.invites || [];
    const sharedExpenses: any[] = data?.sharedExpenses || [];

    const totalSharedSpend = sharedExpenses.reduce((s, e) => s + e.amount, 0);
    const memberSpend: Record<string, number> = {};
    sharedExpenses.forEach(e => { memberSpend[e.member_name] = (memberSpend[e.member_name] || 0) + e.amount; });

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">
                        Family Sharing
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Share budgets and track household finances together</p>
                </div>
                {!group && (
                    <button onClick={() => setCreating(true)}
                        className="flex items-center gap-2 h-10 px-5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition shadow-lg shadow-violet-500/20">
                        <Plus className="h-4 w-4" /> Create Family Group
                    </button>
                )}
            </div>

            {/* No group yet */}
            {!group ? (
                <div className="space-y-6">
                    {/* Join Group */}
                    <div className="rounded-2xl border bg-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <LogIn className="h-4 w-4 text-violet-500" />
                            <h2 className="font-semibold">Join a Family Group</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">If you received an invite link, enter the token below.</p>
                        <form onSubmit={handleJoin} className="flex gap-3">
                            <input required value={joinToken} onChange={e => setJoinToken(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" placeholder="Paste invite token…" />
                            <button type="submit" disabled={submitting}
                                className="h-10 px-5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition disabled:opacity-50">
                                {submitting ? '…' : 'Join'}
                            </button>
                        </form>
                    </div>

                    {/* Or create */}
                    <div className="rounded-2xl border border-dashed border-violet-500/30 bg-violet-500/5 p-10 text-center">
                        <Users className="h-12 w-12 text-violet-500/50 mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2">No Family Group Yet</h3>
                        <p className="text-sm text-muted-foreground mb-6">Create a group to invite family members and get a unified view of your household finances.</p>
                        <button onClick={() => setCreating(true)}
                            className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition">
                            <Plus className="h-4 w-4" /> Create Family Group
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Group Banner */}
                    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-pink-500/5 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                                <Users className="h-7 w-7 text-violet-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold">{group.name}</h2>
                                <p className="text-sm text-muted-foreground">{members.length + 1} member{members.length + 1 !== 1 ? 's' : ''} · Created {new Date(group.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
                        {(['overview', 'expenses', 'invite'] as const).map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition capitalize ${tab === t ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* Overview Tab */}
                    {tab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-violet-500/5 p-5">
                                    <Users className="h-5 w-5 text-violet-500 mb-3" />
                                    <p className="text-2xl font-extrabold text-violet-600">{members.length + 1}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Members</p>
                                </div>
                                <div className="rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-500/10 to-pink-500/5 p-5">
                                    <DollarSign className="h-5 w-5 text-pink-500 mb-3" />
                                    <p className="text-2xl font-extrabold text-pink-600">{fmt(totalSharedSpend)}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Shared Spend (30d)</p>
                                </div>
                                <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-5">
                                    <Mail className="h-5 w-5 text-amber-500 mb-3" />
                                    <p className="text-2xl font-extrabold text-amber-600">{invites.length}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Pending Invites</p>
                                </div>
                            </div>

                            {/* Members List */}
                            <div className="rounded-2xl border bg-card overflow-hidden">
                                <div className="p-5 border-b border-border font-semibold">Members</div>
                                <div className="divide-y divide-border">
                                    {/* Owner */}
                                    {owner && (
                                        <div className="flex items-center justify-between px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                                    <Crown className="h-4 w-4 text-amber-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{owner.name}</p>
                                                    <p className="text-xs text-muted-foreground">{owner.email}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-semibold">Owner</span>
                                        </div>
                                    )}
                                    {members.map((m) => (
                                        <div key={m.id} className="flex items-center justify-between px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center font-bold text-sm text-violet-600">
                                                    {m.name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{m.name}</p>
                                                    <p className="text-xs text-muted-foreground">{m.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold capitalize">{m.role}</span>
                                                {memberSpend[m.name] != null && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">{fmt(memberSpend[m.name])} this month</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Shared Expenses Tab */}
                    {tab === 'expenses' && (
                        <div className="rounded-2xl border bg-card overflow-hidden">
                            <div className="p-5 border-b border-border font-semibold">Shared Expenses – Last 30 Days</div>
                            {sharedExpenses.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground">
                                    <Share2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p>No shared expenses yet</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
                                                {['Member', 'Category', 'Description', 'Amount', 'Date'].map(h => (
                                                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sharedExpenses.map((e) => (
                                                <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3 font-medium">{e.member_name}</td>
                                                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-muted text-xs">{e.category}</span></td>
                                                    <td className="px-4 py-3 text-muted-foreground">{e.description || '—'}</td>
                                                    <td className="px-4 py-3 font-semibold">{fmt(e.amount)}</td>
                                                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(e.date).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Invite Tab */}
                    {tab === 'invite' && (
                        <div className="space-y-6">
                            <div className="rounded-2xl border bg-card p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <UserPlus className="h-4 w-4 text-violet-500" />
                                    <h2 className="font-semibold">Invite a Member</h2>
                                </div>
                                <form onSubmit={handleInvite} className="flex gap-3">
                                    <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                                        className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" placeholder="family@email.com" />
                                    <button type="submit" disabled={submitting}
                                        className="h-10 px-5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition disabled:opacity-50">
                                        {submitting ? '…' : 'Send Invite'}
                                    </button>
                                </form>
                                {inviteToken && (
                                    <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border">
                                        <p className="text-xs font-semibold text-muted-foreground mb-2">Share this invite link:</p>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 text-xs font-mono break-all">{window.location.origin}/dashboard/family?invite={inviteToken}</code>
                                            <button onClick={copyToken} className="p-1.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0">
                                                {copiedToken ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-2">Link expires in 7 days</p>
                                    </div>
                                )}
                            </div>

                            {/* Pending Invites */}
                            {invites.length > 0 && (
                                <div className="rounded-2xl border bg-card p-6">
                                    <h2 className="font-semibold mb-4">Pending Invitations</h2>
                                    <div className="space-y-3">
                                        {invites.map((inv) => (
                                            <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                                                <Mail className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{inv.invited_email}</p>
                                                    <p className="text-xs text-muted-foreground">Expires {new Date(inv.expires_at).toLocaleDateString()}</p>
                                                </div>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-semibold">Pending</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Create Group Modal */}
            {creating && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="font-semibold text-lg">Create Family Group</h2>
                            <button onClick={() => setCreating(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Group Name *</label>
                                <input required value={groupName} onChange={e => setGroupName(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" placeholder="e.g. The Smith Family" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setCreating(false)} className="flex-1 h-10 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition">Cancel</button>
                                <button type="submit" disabled={submitting}
                                    className="flex-1 h-10 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition disabled:opacity-50">
                                    {submitting ? 'Creating…' : 'Create Group'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
