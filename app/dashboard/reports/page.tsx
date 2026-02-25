'use client';

import { useState } from 'react';
import {
  FileText, Download, Loader2, Calendar, TrendingDown,
  TrendingUp, BarChart3, Wallet, ArrowUpRight, RefreshCw
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils-format';

interface ReportData {
  generatedAt: string;
  period: { from: string; to: string };
  user: { name: string; email: string };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    transactionCount: number;
  };
  expensesByCategory: Record<string, number>;
  budgetComparison: Array<{
    category: string;
    limit: number;
    spent: number;
    remaining: number;
    percentage: number;
  }>;
  topExpenses: Array<{
    description: string;
    amount: number;
    category: string;
    date: string;
  }>;
}

const PALETTE = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#a855f7'];

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ format: 'json', startDate, endDate }),
      });
      if (response.ok) {
        setReportData(await response.json());
      } else {
        const err = await response.json().catch(() => ({}));
        console.error('Report error:', err);
      }
    } catch (e) {
      console.error('Failed to generate report:', e);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (format: 'csv' | 'json') => {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ format, startDate, endDate }),
    });
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finsentinel-report-${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCategoryAmount = reportData
    ? Object.values(reportData.expensesByCategory).reduce((s, v) => s + v, 0)
    : 0;

  return (
    <div className="space-y-8 pb-10">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Financial Reports</h1>
        <p className="text-sm text-muted-foreground">Generate, analyze, and export your financial data</p>
      </div>

      {/* Control Panel */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm">Generate Report</p>
            <p className="text-xs text-muted-foreground">Select a date range to analyze your finances</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={generateReport}
            disabled={loading}
            className="flex items-center gap-2 h-10 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition shadow-md shadow-primary/20 disabled:opacity-60"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
              : <><FileText className="h-4 w-4" /> Generate Report</>
            }
          </button>

          {reportData && (
            <>
              <button
                onClick={() => downloadReport('json')}
                className="flex items-center gap-2 h-10 px-5 rounded-xl border font-semibold text-sm hover:bg-muted transition"
              >
                <Download className="h-4 w-4" /> JSON
              </button>
              <button
                onClick={() => downloadReport('csv')}
                className="flex items-center gap-2 h-10 px-5 rounded-xl border font-semibold text-sm hover:bg-muted transition"
              >
                <Download className="h-4 w-4" /> CSV
              </button>
              <button
                onClick={generateReport}
                className="flex items-center gap-2 h-10 px-4 rounded-xl border font-semibold text-sm hover:bg-muted transition text-muted-foreground"
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border bg-muted/40 h-28 animate-pulse" />
          ))}
        </div>
      )}

      {/* Results */}
      {reportData && !loading && (
        <div className="space-y-6 animate-in fade-in duration-500">

          {/* Period label */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Calendar className="h-3.5 w-3.5" />
            Report period: <span className="font-bold text-foreground">{reportData.period.from}</span>
            &nbsp;→&nbsp;
            <span className="font-bold text-foreground">{reportData.period.to}</span>
            <span className="ml-auto">Generated {new Date(reportData.generatedAt).toLocaleString()}</span>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 p-5">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Total Income</p>
              <p className="text-2xl font-extrabold text-emerald-600">{formatCurrency(reportData.summary.totalIncome)}</p>
            </div>
            <div className="rounded-2xl border bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-rose-500/20 p-5">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Total Expenses</p>
              <p className="text-2xl font-extrabold text-rose-600">{formatCurrency(reportData.summary.totalExpenses)}</p>
            </div>
            <div className={`rounded-2xl border p-5 bg-gradient-to-br ${reportData.summary.netIncome >= 0
              ? 'from-blue-500/10 to-blue-500/5 border-blue-500/20'
              : 'from-orange-500/10 to-orange-500/5 border-orange-500/20'}`}>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Net Income</p>
              <div className="flex items-center gap-2">
                {reportData.summary.netIncome >= 0
                  ? <TrendingUp className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  : <TrendingDown className="h-4 w-4 text-orange-600 flex-shrink-0" />
                }
                <p className={`text-2xl font-extrabold ${reportData.summary.netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatCurrency(reportData.summary.netIncome)}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20 p-5">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Transactions</p>
              <p className="text-2xl font-extrabold text-violet-600">{reportData.summary.transactionCount}</p>
            </div>
          </div>

          {/* Expenses by Category */}
          {Object.keys(reportData.expensesByCategory).length > 0 && (
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <Wallet className="h-4 w-4 text-primary" />
                <h2 className="font-bold">Expenses by Category</h2>
              </div>
              <div className="space-y-4">
                {Object.entries(reportData.expensesByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount], idx) => {
                    const pct = totalCategoryAmount > 0 ? (amount / totalCategoryAmount) * 100 : 0;
                    const color = PALETTE[idx % PALETTE.length];
                    return (
                      <div key={category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                            <span className="font-semibold capitalize">{category}</span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="font-extrabold">{formatCurrency(amount)}</span>
                            <span className="text-xs font-bold w-10 text-right" style={{ color }}>{pct.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: `${color}22` }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Budget Comparison */}
          {reportData.budgetComparison.length > 0 && (
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h2 className="font-bold">Budget Comparison</h2>
              </div>
              <div className="space-y-5">
                {reportData.budgetComparison.map(b => {
                  const over = b.percentage >= 100;
                  const warn = b.percentage >= 80 && !over;
                  const barColor = over ? '#f43f5e' : warn ? '#f59e0b' : '#10b981';
                  return (
                    <div key={b.category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold capitalize">{b.category}</span>
                        <div className="flex items-center gap-3 text-xs font-bold">
                          <span className={over ? 'text-rose-600' : warn ? 'text-amber-600' : 'text-emerald-600'}>
                            {b.percentage.toFixed(0)}% used
                          </span>
                          <span className="text-muted-foreground">
                            {b.remaining >= 0 ? `${formatCurrency(b.remaining)} left` : `${formatCurrency(-b.remaining)} over`}
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full rounded-full overflow-hidden bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(b.percentage, 100)}%`, backgroundColor: barColor }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(b.spent)} spent</span>
                        <span>{formatCurrency(b.limit)} limit</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Expenses */}
          {reportData.topExpenses.length > 0 && (
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <ArrowUpRight className="h-4 w-4 text-primary" />
                <h2 className="font-bold">Top Expenses</h2>
              </div>
              <div className="space-y-3">
                {reportData.topExpenses.map((exp, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition"
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0"
                      style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                    >
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{exp.description || '—'}</p>
                      <p className="text-xs text-muted-foreground capitalize">{exp.category} · {exp.date}</p>
                    </div>
                    <span className="font-extrabold text-sm flex-shrink-0">{formatCurrency(exp.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Empty state */}
      {!reportData && !loading && (
        <div className="rounded-2xl border border-dashed bg-muted/20 py-24 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1 max-w-xs">
            <h3 className="font-bold text-lg">No report generated yet</h3>
            <p className="text-sm text-muted-foreground">Select a date range above and click Generate Report to see your financial analysis.</p>
          </div>
        </div>
      )}

    </div>
  );
}
