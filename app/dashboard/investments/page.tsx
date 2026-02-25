'use client';

import { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import { useAuth } from '@/hooks/use-auth';
import {
    TrendingUp, TrendingDown, Plus, Trash2, Edit3, DollarSign,
    PieChart, BarChart3, RefreshCw, Briefcase, X, ChevronUp, ChevronDown
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const fetcher = (url: string) =>
    fetch(url, { credentials: 'include' }).then(r => r.json()).then(d => d.data);

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const TYPES = ['stock', 'etf', 'crypto', 'bond', 'mutual_fund', 'real_estate', 'other'];

const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

export default function InvestmentsPage() {
    const { user } = useAuth();
    const { data, isLoading, error } = useSWR(user ? '/api/investments' : null, fetcher);

    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        ticker: '', name: '', type: 'stock', shares: '', buy_price: '', current_price: '', buy_date: '',
        sector: '', notes: '',
    });

    const resetForm = () => {
        setForm({ ticker: '', name: '', type: 'stock', shares: '', buy_price: '', current_price: '', buy_date: '', sector: '', notes: '' });
        setEditId(null);
        setShowForm(false);
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const payload = {
            ticker: form.ticker.toUpperCase(),
            name: form.name,
            type: form.type,
            shares: parseFloat(form.shares),
            buy_price: parseFloat(form.buy_price),
            current_price: parseFloat(form.current_price),
            buy_date: new Date(form.buy_date).getTime(),
            sector: form.sector || undefined,
            notes: form.notes || undefined,
        };

        const url = editId ? `/api/investments/${editId}` : '/api/investments';
        const method = editId ? 'PATCH' : 'POST';

        const res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            await mutate('/api/investments');
            resetForm();
        }
        setSubmitting(false);
    }, [form, editId]);

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this position?')) return;
        await fetch(`/api/investments/${id}`, { method: 'DELETE', credentials: 'include' });
        mutate('/api/investments');
    };

    const handleEdit = (inv: any) => {
        setForm({
            ticker: inv.ticker, name: inv.name, type: inv.type,
            shares: String(inv.shares), buy_price: String(inv.buy_price), current_price: String(inv.current_price),
            buy_date: new Date(inv.buy_date).toISOString().slice(0, 10),
            sector: inv.sector || '', notes: inv.notes || '',
        });
        setEditId(inv.id);
        setShowForm(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 text-indigo-500 animate-spin" />
                    </div>
                    <p className="text-muted-foreground text-sm">Loading portfolio…</p>
                </div>
            </div>
        );
    }

    const investments: any[] = data?.investments || [];
    const summary = data?.summary || { totalInvested: 0, totalValue: 0, totalGain: 0, totalGainPct: 0 };
    const allocation: any[] = data?.allocation || [];

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                        Investment Portfolio
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{investments.length} position{investments.length !== 1 ? 's' : ''} tracked</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditId(null); }}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20"
                >
                    <Plus className="h-4 w-4" /> Add Position
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Invested', value: fmt(summary.totalInvested), icon: DollarSign, color: 'blue', sub: 'Cost basis' },
                    { label: 'Portfolio Value', value: fmt(summary.totalValue), icon: Briefcase, color: 'indigo', sub: 'Current market value' },
                    {
                        label: 'Total Gain/Loss', value: fmt(Math.abs(summary.totalGain)),
                        icon: summary.totalGain >= 0 ? TrendingUp : TrendingDown,
                        color: summary.totalGain >= 0 ? 'green' : 'red',
                        sub: fmtPct(summary.totalGainPct),
                    },
                    { label: 'Positions', value: String(investments.length), icon: BarChart3, color: 'violet', sub: `${TYPES.filter(t => investments.some(i => i.type === t)).length} asset type(s)` },
                ].map(({ label, value, icon: Icon, color, sub }) => (
                    <div key={label} className={`relative overflow-hidden rounded-2xl border border-${color}-500/20 bg-gradient-to-br from-${color}-500/10 to-${color}-500/5 p-5 group hover:shadow-lg transition-all duration-300`}>
                        <div className={`w-9 h-9 rounded-xl bg-${color}-500/20 flex items-center justify-center mb-3`}>
                            <Icon className={`h-4 w-4 text-${color}-500`} />
                        </div>
                        <p className={`text-2xl font-extrabold text-${color}-600`}>{value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{label}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            {investments.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Allocation Pie */}
                    <div className="rounded-2xl border bg-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <PieChart className="h-4 w-4 text-indigo-500" />
                            <h2 className="font-semibold">Portfolio Allocation</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <RePieChart>
                                <Pie data={allocation} dataKey="value" nameKey="type" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                                    {allocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <ReTooltip
                                    formatter={(val: any, _: any, props: any) => [fmt(val), `${props.payload.type} (${props.payload.percentage.toFixed(1)}%)`]}
                                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }}
                                />
                            </RePieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {allocation.map((a, i) => (
                                <div key={a.type} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                    <span className="text-xs text-muted-foreground capitalize">{a.type.replace('_', ' ')}</span>
                                    <span className="text-xs font-semibold ml-auto">{a.percentage.toFixed(1)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Gain/Loss per Position */}
                    <div className="rounded-2xl border bg-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="h-4 w-4 text-violet-500" />
                            <h2 className="font-semibold">Gain / Loss by Position</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={investments.map(i => ({ name: i.ticker, gain: (i.current_price - i.buy_price) * i.shares }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                                <ReTooltip formatter={(v: any) => [fmt(v), 'Gain/Loss']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                                <Bar dataKey="gain" radius={[6, 6, 0, 0]}>
                                    {investments.map((inv, i) => (
                                        <Cell key={i} fill={(inv.current_price - inv.buy_price) >= 0 ? '#10b981' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Holdings Table */}
            <div className="rounded-2xl border bg-card overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h2 className="font-semibold">Holdings</h2>
                </div>
                {investments.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No positions yet</p>
                        <p className="text-sm mt-1">Add your first investment to start tracking your portfolio</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
                                    {['Ticker', 'Name', 'Type', 'Shares', 'Buy', 'Current', 'Value', 'Gain/Loss', ''].map(h => (
                                        <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {investments.map((inv) => {
                                    const value = inv.current_price * inv.shares;
                                    const gain = (inv.current_price - inv.buy_price) * inv.shares;
                                    const gainPct = ((inv.current_price - inv.buy_price) / inv.buy_price) * 100;
                                    const positive = gain >= 0;
                                    return (
                                        <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-bold text-indigo-600">{inv.ticker}</td>
                                            <td className="px-4 py-3 font-medium">{inv.name}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-semibold uppercase">{inv.type.replace('_', ' ')}</span>
                                            </td>
                                            <td className="px-4 py-3">{inv.shares.toLocaleString()}</td>
                                            <td className="px-4 py-3">{fmt(inv.buy_price)}</td>
                                            <td className="px-4 py-3">{fmt(inv.current_price)}</td>
                                            <td className="px-4 py-3 font-semibold">{fmt(value)}</td>
                                            <td className="px-4 py-3">
                                                <div className={`flex items-center gap-1 font-semibold ${positive ? 'text-green-600' : 'text-red-600'}`}>
                                                    {positive ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                                    {fmt(Math.abs(gain))} ({fmtPct(gainPct)})
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleEdit(inv)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                                        <Edit3 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(inv.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-600">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="font-semibold text-lg">{editId ? 'Edit Position' : 'Add Investment'}</h2>
                            <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">Ticker *</label>
                                    <input required value={form.ticker} onChange={e => setForm(p => ({ ...p, ticker: e.target.value }))}
                                        className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm uppercase" placeholder="AAPL" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">Type *</label>
                                    <select required value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                                        className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm">
                                        {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Company / Asset Name *</label>
                                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" placeholder="Apple Inc." />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">Shares *</label>
                                    <input required type="number" step="any" value={form.shares} onChange={e => setForm(p => ({ ...p, shares: e.target.value }))}
                                        className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" placeholder="10" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">Buy Price *</label>
                                    <input required type="number" step="any" value={form.buy_price} onChange={e => setForm(p => ({ ...p, buy_price: e.target.value }))}
                                        className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" placeholder="150.00" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">Current Price *</label>
                                    <input required type="number" step="any" value={form.current_price} onChange={e => setForm(p => ({ ...p, current_price: e.target.value }))}
                                        className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" placeholder="175.00" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">Buy Date *</label>
                                    <input required type="date" value={form.buy_date} onChange={e => setForm(p => ({ ...p, buy_date: e.target.value }))}
                                        className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">Sector</label>
                                    <input value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))}
                                        className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" placeholder="Technology" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Notes</label>
                                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm resize-none" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={resetForm} className="flex-1 h-10 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition">Cancel</button>
                                <button type="submit" disabled={submitting}
                                    className="flex-1 h-10 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50">
                                    {submitting ? 'Saving…' : editId ? 'Update' : 'Add Position'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
