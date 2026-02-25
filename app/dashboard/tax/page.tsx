'use client';

import { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import { useAuth } from '@/hooks/use-auth';
import {
    Receipt, Plus, X, Lightbulb, TrendingDown, CheckCircle2,
    Circle, FileText, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const fetcher = (url: string) =>
    fetch(url, { credentials: 'include' }).then(r => r.json()).then(d => d.data);

const TAX_CATEGORIES = [
    { value: 'medical', label: '🏥 Medical' },
    { value: 'charity', label: '💝 Charity' },
    { value: 'education', label: '🎓 Education' },
    { value: 'home_office', label: '🏠 Home Office' },
    { value: 'business_travel', label: '✈️ Business Travel' },
    { value: 'investment_loss', label: '📉 Investment Loss' },
    { value: 'retirement_contribution', label: '🏦 Retirement Contribution' },
    { value: 'mortgage_interest', label: '🏡 Mortgage Interest' },
    { value: 'property_tax', label: '🏗️ Property Tax' },
    { value: 'other', label: '📁 Other' },
];

const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6', '#84cc16', '#a3a3a3'];

export default function TaxPage() {
    const { user } = useAuth();
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const { data, isLoading } = useSWR(user ? `/api/tax?year=${year}` : null, fetcher);

    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showAllTips, setShowAllTips] = useState(false);
    const [form, setForm] = useState({
        year: String(currentYear), category: 'medical', amount: '', description: '', is_deductible: true, receipt_ref: '',
    });

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const res = await fetch('/api/tax', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                year: parseInt(form.year),
                category: form.category,
                amount: parseFloat(form.amount),
                description: form.description || undefined,
                is_deductible: form.is_deductible,
                receipt_ref: form.receipt_ref || undefined,
            }),
        });
        if (res.ok) {
            mutate(`/api/tax?year=${year}`);
            setShowForm(false);
        }
        setSubmitting(false);
    }, [form, year]);

    const events: any[] = data?.events || [];
    const summary = data?.summary || { totalDeductible: 0, totalNonDeductible: 0, estimatedTaxSaving: 0 };
    const tips: string[] = data?.tips || [];
    const byCategory: Record<string, any> = data?.byCategory || {};

    const pieData = Object.entries(byCategory).map(([cat, val]: [string, any]) => ({
        name: cat.replace('_', ' '), value: val.deductible + val.nonDeductible,
    })).filter(d => d.value > 0);

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                        Tax Optimization
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Track deductible expenses and maximize your tax savings</p>
                </div>
                <div className="flex items-center gap-3">
                    <select value={year} onChange={e => setYear(parseInt(e.target.value))}
                        className="px-3 py-2 rounded-xl border border-border bg-background text-sm font-medium">
                        {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <button onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/20">
                        <Plus className="h-4 w-4" /> Add Event
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3">
                        <TrendingDown className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-extrabold text-emerald-600">{fmt(summary.totalDeductible)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Deductible</p>
                </div>
                <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 p-5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-3">
                        <Receipt className="h-4 w-4 text-indigo-500" />
                    </div>
                    <p className="text-2xl font-extrabold text-indigo-600">{fmt(summary.totalNonDeductible)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Non-Deductible</p>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center mb-3">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                    </div>
                    <p className="text-2xl font-extrabold text-amber-600">{fmt(summary.estimatedTaxSaving)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Est. Tax Savings <span className="text-[10px]">(~22% rate)</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown & Pie */}
                {pieData.length > 0 && (
                    <div className="rounded-2xl border bg-card p-6">
                        <h2 className="font-semibold mb-4">By Category</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
                                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(v: any) => [fmt(v)]} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2 mt-3">
                            {Object.entries(byCategory).map(([cat, val]: [string, any], i) => (
                                <div key={cat} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                    <span className="text-xs capitalize">{cat.replace('_', ' ')}</span>
                                    <div className="flex-1 h-1 bg-muted rounded-full ml-2">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((val.deductible / (summary.totalDeductible || 1)) * 100, 100)}%` }} />
                                    </div>
                                    <span className="text-xs font-semibold text-emerald-600 ml-2">{fmt(val.deductible)} ded.</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tax Tips */}
                <div className="rounded-2xl border bg-gradient-to-br from-amber-500/5 to-emerald-500/5 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        <h2 className="font-semibold">Tax-Saving Tips</h2>
                    </div>
                    <div className="space-y-3">
                        {(showAllTips ? tips : tips.slice(0, 4)).map((tip, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
                            </div>
                        ))}
                    </div>
                    {tips.length > 4 && (
                        <button onClick={() => setShowAllTips(!showAllTips)}
                            className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 mt-3">
                            {showAllTips ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            {showAllTips ? 'Show less' : `Show ${tips.length - 4} more tips`}
                        </button>
                    )}
                </div>
            </div>

            {/* Events Table */}
            <div className="rounded-2xl border bg-card overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h2 className="font-semibold">Tax Events – {year}</h2>
                </div>
                {isLoading ? (
                    <div className="p-8 flex items-center justify-center">
                        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No tax events for {year}</p>
                        <p className="text-sm mt-1">Add medical, charity, or other deductible expenses</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
                                    {['Category', 'Description', 'Amount', 'Deductible', 'Receipt'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((ev) => (
                                    <tr key={ev.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium capitalize">{ev.category.replace('_', ' ')}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{ev.description || '—'}</td>
                                        <td className="px-4 py-3 font-semibold">{fmt(ev.amount)}</td>
                                        <td className="px-4 py-3">
                                            {ev.is_deductible
                                                ? <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs"><CheckCircle2 className="h-3.5 w-3.5" />Yes</span>
                                                : <span className="flex items-center gap-1 text-muted-foreground text-xs"><Circle className="h-3.5 w-3.5" />No</span>}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">{ev.receipt_ref || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Event Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="font-semibold text-lg">Add Tax Event</h2>
                            <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">Tax Year *</label>
                                    <input required type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
                                        className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">Amount *</label>
                                    <input required type="number" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                                        className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" placeholder="0.00" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Category *</label>
                                <select required value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm">
                                    {TAX_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" placeholder="Optional details" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Receipt Reference</label>
                                <input value={form.receipt_ref} onChange={e => setForm(p => ({ ...p, receipt_ref: e.target.value }))}
                                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" placeholder="REF-001 or file path" />
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={form.is_deductible} onChange={e => setForm(p => ({ ...p, is_deductible: e.target.checked }))}
                                    className="w-4 h-4 rounded" />
                                <span className="text-sm font-medium">This expense is tax-deductible</span>
                            </label>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 h-10 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition">Cancel</button>
                                <button type="submit" disabled={submitting}
                                    className="flex-1 h-10 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-50">
                                    {submitting ? 'Saving…' : 'Add Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
