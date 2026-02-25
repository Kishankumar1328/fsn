'use client';

import { useState } from 'react';
import { Plus, Trash2, TrendingUp, Loader2, Calendar, DollarSign, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIncome } from '@/hooks/use-income';
import { formatCurrency, formatDate } from '@/lib/utils-format';
import { toast } from 'sonner';

const SOURCE_COLORS: Record<string, string> = {
  salary: '#10b981',
  freelance: '#6366f1',
  business: '#f59e0b',
  investment: '#3b82f6',
  rental: '#a855f7',
  dividend: '#14b8a6',
  bonus: '#f43f5e',
  other: '#94a3b8',
};

function getSourceColor(source: string) {
  const lower = source.toLowerCase();
  for (const key of Object.keys(SOURCE_COLORS)) {
    if (lower.includes(key)) return SOURCE_COLORS[key];
  }
  return SOURCE_COLORS.other;
}

export default function IncomePage() {
  const { income, loading, addIncome, deleteIncome } = useIncome();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ source: '', amount: '', date: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.source || !formData.amount || !formData.date) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsSubmitting(true);
    try {
      await (addIncome as any)({
        source: formData.source,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).getTime(),
      });
      toast.success(`Income of ${formatCurrency(parseFloat(formData.amount))} added`);
      setFormData({ source: '', amount: '', date: '' });
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add income');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalIncome = income?.reduce((sum: number, inc: any) => sum + inc.amount, 0) || 0;
  const highestIncome = income?.length ? Math.max(...income.map((i: any) => i.amount)) : 0;
  const avgIncome = income?.length ? totalIncome / income.length : 0;

  return (
    <div className="space-y-8 pb-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight">Income</h1>
          <p className="text-sm text-muted-foreground">Track all your revenue streams</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 h-10 px-5 rounded-xl font-semibold text-sm transition-all ${showForm
            ? 'bg-muted text-foreground border border-border'
            : 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90'
            }`}
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add Income'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 p-5">
          <p className="text-xs font-semibold text-muted-foreground mb-3">Total Income</p>
          <p className="text-3xl font-extrabold text-emerald-600">{formatCurrency(totalIncome)}</p>
          <p className="text-xs text-muted-foreground mt-1">All time</p>
        </div>
        <div className="rounded-2xl border bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 p-5">
          <p className="text-xs font-semibold text-muted-foreground mb-3">Highest Entry</p>
          <p className="text-3xl font-extrabold text-blue-600">{formatCurrency(highestIncome)}</p>
          <p className="text-xs text-muted-foreground mt-1">Single transaction</p>
        </div>
        <div className="rounded-2xl border bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20 p-5">
          <p className="text-xs font-semibold text-muted-foreground mb-3">Average Entry</p>
          <p className="text-3xl font-extrabold text-violet-600">{formatCurrency(avgIncome)}</p>
          <p className="text-xs text-muted-foreground mt-1">Per record</p>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-bold">Add Income Entry</h2>
              <p className="text-xs text-muted-foreground">Record a new revenue source</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source</label>
              <Input
                placeholder="e.g., Salary, Freelance"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  className="pl-9"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-9"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="sm:col-span-3 flex gap-3 pt-2">
              <Button type="submit" className="flex-1 font-bold h-11" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Income
              </Button>
              <Button type="button" variant="outline" className="h-11 px-6" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Income List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="font-medium animate-pulse">Loading income records…</p>
        </div>
      ) : income && income.length > 0 ? (
        <div className="space-y-3">
          {income.map((inc: any) => {
            const color = getSourceColor(inc.source);
            return (
              <div
                key={inc.id}
                className="flex items-center gap-4 p-4 rounded-2xl border bg-card hover:border-primary/20 hover:shadow-sm transition-all group"
              >
                {/* Color dot */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-white text-sm"
                  style={{ backgroundColor: color }}
                >
                  {inc.source.substring(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold capitalize truncate">{inc.source}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(inc.date)}</p>
                </div>

                {/* Amount bar */}
                <div className="hidden sm:flex flex-col items-end gap-1 w-36">
                  <span className="text-sm font-extrabold text-emerald-600">{formatCurrency(inc.amount)}</span>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${highestIncome > 0 ? (inc.amount / highestIncome) * 100 : 0}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>

                <span className="font-extrabold text-emerald-600 sm:hidden">{formatCurrency(inc.amount)}</span>

                <button
                  onClick={() => deleteIncome(inc.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed bg-muted/20 py-24 flex flex-col items-center justify-center gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-emerald-500" />
          </div>
          <div className="space-y-1.5 max-w-xs">
            <h3 className="text-xl font-bold">No income recorded yet</h3>
            <p className="text-sm text-muted-foreground">Start tracking your salary, freelance, and other income streams.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 h-11 px-8 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition shadow-md shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> Add First Income
          </button>
        </div>
      )}
    </div>
  );
}
