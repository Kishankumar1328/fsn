'use client';

import Link from 'next/link';
import {
  Plus, Mic, TrendingUp, TrendingDown, Wallet, Target, Sparkles,
  ArrowUpRight, ArrowDownRight, Zap, Heart, Loader2, BarChart3,
  Activity, ShieldCheck, ChevronRight, Receipt, Users
} from 'lucide-react';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { ExpenseChart } from '@/components/dashboard/expense-chart';
import { BudgetStatus } from '@/components/dashboard/budget-status';
import { UpcomingGoals } from '@/components/dashboard/upcoming-goals';
import { HealthScore } from '@/components/dashboard/health-score';
import { AIInsightBanner } from '@/components/dashboard/ai-insight-banner';
import { AchievementTracker } from '@/components/dashboard/achievement-tracker';
import { useDashboard } from '@/hooks/use-dashboard';

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-ping" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold">Loading your dashboard</p>
            <p className="text-sm text-muted-foreground">Analyzing your financial data…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <Activity className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Failed to load dashboard</h2>
          <p className="text-muted-foreground max-w-md text-sm">
            Something went wrong fetching your data. Please refresh.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, topExpenseCategories, budgetStatus, upcomingGoals } = data;
  const savingsRate = summary.totalIncome > 0
    ? Math.round((summary.balance / summary.totalIncome) * 100)
    : 0;

  return (
    <div className="space-y-5 md:space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            Financial Overview
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {summary.period.replace(/_/g, ' ')} · Updated just now
          </p>
        </div>
        {/* Action buttons — scroll horizontally on tiny screens */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 flex-nowrap sm:flex-wrap">
          <Link href="/dashboard/expenses" className="flex-shrink-0">
            <button className="flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:bg-primary/90 transition shadow-md shadow-primary/20 whitespace-nowrap">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Add Expense
            </button>
          </Link>
          <Link href="/dashboard/voice-entry" className="flex-shrink-0">
            <button className="flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-muted text-foreground font-semibold text-xs sm:text-sm hover:bg-muted/80 transition border border-border whitespace-nowrap">
              <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Voice Entry
            </button>
          </Link>
          <Link href="/dashboard/social-impact" className="flex-shrink-0">
            <button className="flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-pink-500/10 text-pink-600 font-semibold text-xs sm:text-sm hover:bg-pink-500/20 transition border border-pink-500/20 whitespace-nowrap">
              <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Social Impact
            </button>
          </Link>
        </div>
      </div>

      {/* ── Hero KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Income */}
        <div className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-green-500/5 p-4 md:p-5 group hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-green-600 bg-green-500/10 px-1.5 md:px-2 py-0.5 rounded-full flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> <span className="hidden sm:inline">Income</span>
            </span>
          </div>
          <p className="text-lg sm:text-xl md:text-2xl font-extrabold text-green-600 truncate">
            ${summary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Last 30 days</p>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-green-500/5 group-hover:scale-150 transition-transform duration-500" />
        </div>

        {/* Expenses */}
        <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-500/5 p-4 md:p-5 group hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-red-600 bg-red-500/10 px-1.5 md:px-2 py-0.5 rounded-full flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3" /> <span className="hidden sm:inline">Spent</span>
            </span>
          </div>
          <p className="text-lg sm:text-xl md:text-2xl font-extrabold text-red-600 truncate">
            ${summary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Last 30 days</p>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-red-500/5 group-hover:scale-150 transition-transform duration-500" />
        </div>

        {/* Net Balance */}
        <div className={`relative overflow-hidden rounded-2xl border p-4 md:p-5 group transition-all duration-300
          ${summary.balance >= 0
            ? 'border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10'
            : 'border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-500/5 hover:border-red-500/40'
          }`}>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${summary.balance >= 0 ? 'bg-primary/20' : 'bg-red-500/20'}`}>
              <Wallet className={`h-4 w-4 md:h-5 md:w-5 ${summary.balance >= 0 ? 'text-primary' : 'text-red-500'}`} />
            </div>
            <span className={`text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded-full ${summary.balance >= 0 ? 'text-primary bg-primary/10' : 'text-red-600 bg-red-500/10'}`}>
              <span className="hidden sm:inline">Net </span>Balance
            </span>
          </div>
          <p className={`text-lg sm:text-xl md:text-2xl font-extrabold truncate ${summary.balance >= 0 ? 'text-primary' : 'text-red-600'}`}>
            ${Math.abs(summary.balance).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">{summary.balance >= 0 ? 'Surplus' : 'Deficit'} this period</p>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-primary/5 group-hover:scale-150 transition-transform duration-500" />
        </div>

        {/* Savings Rate */}
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-violet-500/5 p-4 md:p-5 group hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-violet-500" />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-violet-600 bg-violet-500/10 px-1.5 md:px-2 py-0.5 rounded-full">
              Savings
            </span>
          </div>
          <p className="text-lg sm:text-xl md:text-2xl font-extrabold text-violet-600">{savingsRate}%</p>
          <div className="mt-2 h-1.5 w-full bg-violet-500/20 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full transition-all duration-1000" style={{ width: `${Math.max(0, Math.min(savingsRate, 100))}%` }} />
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Of income saved</p>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-violet-500/5 group-hover:scale-150 transition-transform duration-500" />
        </div>
      </div>

      {/* ── AI Insight Banner (full width) ── */}
      {data.primaryInsight && (
        <AIInsightBanner insights={[data.primaryInsight]} />
      )}

      {/* ── Mid Row: Health + Achievements + Quick Actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="sm:col-span-1">
          <HealthScore score={data.healthScore || 0} />
        </div>
        <div className="sm:col-span-1">
          <AchievementTracker />
        </div>
        {/* Quick Actions — full width on mobile, stacked 2 cols */}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="rounded-2xl border bg-card h-full p-4 md:p-5 space-y-2 md:space-y-3">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Quick Actions</h3>
                <p className="text-xs text-muted-foreground">Jump to key features</p>
              </div>
            </div>
            {/* 2-col grid on mobile, 1-col on lg */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
              {[
                { href: '/dashboard/income', label: 'Add Income', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-500/10 hover:bg-green-500/20' },
                { href: '/dashboard/budgets', label: 'Manage Budgets', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-500/10 hover:bg-blue-500/20' },
                { href: '/dashboard/goals', label: 'Track Goals', icon: Target, color: 'text-violet-600', bg: 'bg-violet-500/10 hover:bg-violet-500/20' },
                { href: '/dashboard/investments', label: 'Investments', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-500/10 hover:bg-indigo-500/20' },
                { href: '/dashboard/tax', label: 'Tax Optimizer', icon: Receipt, color: 'text-emerald-600', bg: 'bg-emerald-500/10 hover:bg-emerald-500/20' },
                { href: '/dashboard/family', label: 'Family Sharing', icon: Users, color: 'text-pink-600', bg: 'bg-pink-500/10 hover:bg-pink-500/20' },
                { href: '/dashboard/insights', label: 'AI Insights', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-500/10 hover:bg-amber-500/20' },
                { href: '/dashboard/reports', label: 'View Reports', icon: Activity, color: 'text-cyan-600', bg: 'bg-cyan-500/10 hover:bg-cyan-500/20' },
              ].map(({ href, label, icon: Icon, color, bg }) => (
                <Link key={href} href={href}>
                  <div className={`flex items-center justify-between px-2.5 py-2 rounded-xl ${bg} transition-all cursor-pointer group`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${color}`} />
                      <span className="text-xs font-medium truncate">{label}</span>
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <ExpenseChart data={topExpenseCategories} />
        <BudgetStatus data={budgetStatus} />
      </div>

      {/* ── Goals Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <UpcomingGoals data={upcomingGoals} />
        </div>
        {/* Financial tip card */}
        <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-violet-500/5 p-5 md:p-6 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">FinSentinel Tip</p>
              <h3 className="font-bold text-base mt-1 leading-snug">
                The 50/30/20 Rule
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Allocate <strong>50%</strong> of income to needs, <strong>30%</strong> to wants, and <strong>20%</strong> to savings &amp; debt. This simple framework is a proven foundation for financial health.
              </p>
            </div>
          </div>
          <Link href="/dashboard/insights">
            <button className="w-full h-9 rounded-xl border border-primary/30 text-primary font-semibold text-sm hover:bg-primary/10 transition flex items-center justify-center gap-2">
              <Sparkles className="h-3.5 w-3.5" /> See My AI Insights
            </button>
          </Link>
        </div>
      </div>

    </div>
  );
}
