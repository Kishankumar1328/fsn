'use client';

import { useInsights } from '@/hooks/use-insights';
import {
  AlertTriangle, Lightbulb, TrendingUp, TrendingDown,
  Target, Sparkles, Brain, Loader2, ShoppingCart, Activity
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils-format';

const TYPE_CONFIG: Record<string, { icon: any; label: string; color: string; bgColor: string; borderColor: string }> = {
  spending_pattern: {
    icon: ShoppingCart,
    label: 'Spending Pattern',
    color: 'text-violet-600',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
  },
  budget_warning: {
    icon: AlertTriangle,
    label: 'Budget Alert',
    color: 'text-rose-600',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
  },
  saving_opportunity: {
    icon: Lightbulb,
    label: 'Opportunity',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  goal_progress: {
    icon: Target,
    label: 'Goal Progress',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  trend: {
    icon: Activity,
    label: 'Trend',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
};

const SEVERITY_PILL: Record<string, string> = {
  warning: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
};

export default function InsightsPage() {
  const { insights, summary, loading } = useInsights();

  if (loading) {
    return (
      <div className="space-y-8 pb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight">AI Insights</h1>
          <p className="text-sm text-muted-foreground">Analyzing your financial patterns…</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Brain className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="font-medium">Generating insights from your data…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight">AI Insights</h1>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="h-3 w-3" /> Live
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Behavioral finance analysis · Last 30 days</p>
        </div>
      </div>

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20 p-5">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Total Spending</p>
            <p className="text-3xl font-extrabold text-violet-600">{formatCurrency(summary.totalSpending)}</p>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </div>
          <div className="rounded-2xl border bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 p-5">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Categories Tracked</p>
            <p className="text-3xl font-extrabold text-blue-600">{summary.categoriesTracked}</p>
            <p className="text-xs text-muted-foreground mt-1">Active spend categories</p>
          </div>
          <div className="rounded-2xl border bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 p-5">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Budgets on Track</p>
            <p className="text-3xl font-extrabold text-emerald-600">{summary.budgetsOnTrack}</p>
            <p className="text-xs text-muted-foreground mt-1">Within budget limits</p>
          </div>
        </div>
      )}

      {/* Insights Feed */}
      {insights.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 py-24 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1.5 max-w-xs">
            <h3 className="font-bold text-lg">No insights yet</h3>
            <p className="text-sm text-muted-foreground">
              Start tracking expenses and budgets to unlock AI-powered behavioral finance insights.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Brain className="h-3.5 w-3.5" />
            {insights.length} insight{insights.length !== 1 ? 's' : ''} found
          </div>

          {insights.map((insight: any, i: number) => {
            const cfg = TYPE_CONFIG[insight.type] || TYPE_CONFIG.spending_pattern;
            const Icon = cfg.icon;

            return (
              <div
                key={i}
                className={`rounded-2xl border p-5 transition-all hover:shadow-sm ${cfg.bgColor} ${cfg.borderColor}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon circle */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bgColor}`}>
                    <Icon className={`h-5 w-5 ${cfg.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="font-bold text-sm">{insight.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${SEVERITY_PILL[insight.severity] || SEVERITY_PILL.info}`}>
                        {insight.severity}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.borderColor} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>

                    {/* Extra data */}
                    {insight.data && insight.data.category && (
                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                        {insight.data.amount !== undefined && (
                          <span className="px-2.5 py-1 rounded-lg bg-background border">
                            💰 {formatCurrency(insight.data.amount)}
                          </span>
                        )}
                        {insight.data.percentage !== undefined && (
                          <span className="px-2.5 py-1 rounded-lg bg-background border">
                            📊 {insight.data.percentage.toFixed(1)}% of spending
                          </span>
                        )}
                        {insight.data.changePercent !== undefined && (
                          <span className={`px-2.5 py-1 rounded-lg bg-background border flex items-center gap-1 ${insight.data.changePercent > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {insight.data.changePercent > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {Math.abs(insight.data.changePercent).toFixed(1)}% vs last month
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
