'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import {
  LayoutDashboard, TrendingUp, Wallet, Target, Settings, LogOut, Menu,
  LineChart, Sparkles, Zap, Heart, Mic, BarChart3, Users, Receipt, X,
  ChevronLeft, ChevronRight, Bell, Search,
} from 'lucide-react';
import { VoiceAssistant } from '@/components/voice-assistant';
import { ThemeToggle } from '@/components/theme-toggle';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Money',
    items: [
      { href: '/dashboard/expenses', label: 'Expenses', icon: TrendingUp },
      { href: '/dashboard/income', label: 'Income', icon: Wallet },
      { href: '/dashboard/budgets', label: 'Budgets', icon: Zap },
      { href: '/dashboard/goals', label: 'Goals', icon: Target },
    ],
  },
  {
    label: 'Wealth',
    items: [
      { href: '/dashboard/investments', label: 'Investments', icon: BarChart3 },
      { href: '/dashboard/tax', label: 'Tax Optimizer', icon: Receipt },
      { href: '/dashboard/family', label: 'Family Sharing', icon: Users },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/dashboard/insights', label: 'AI Insights', icon: Sparkles },
      { href: '/dashboard/future-impact', label: 'Future Impact', icon: LineChart },
      { href: '/dashboard/social-impact', label: 'Social Impact', icon: Heart },
      { href: '/dashboard/voice-entry', label: 'Voice Entry', icon: Mic },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items);

function SidebarContent({
  collapsed, pathname, user, handleLogout, onClose,
}: {
  collapsed: boolean; pathname: string; user: any; handleLogout: () => void; onClose?: () => void;
}) {
  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white font-black text-sm">FS</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-extrabold text-sidebar-foreground text-sm truncate">FinSentinel</p>
              <p className="text-[10px] text-muted-foreground font-medium">Finance Intelligence</p>
            </div>
          )}
        </Link>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2.5 mb-1.5">{group.label}</p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={onClose}>
                    <div className={`
                      sidebar-glow-item relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                      ${active ? 'active' : ''}
                      ${active
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'}
                      ${collapsed ? 'justify-center px-2' : ''}
                    `}>
                      <Icon className={`h-4 w-4 flex-shrink-0 transition-colors ${active ? 'text-primary' : ''}`} />
                      {!collapsed && (
                        <span className={`text-sm font-medium truncate ${active ? 'font-semibold' : ''}`}>
                          {item.label}
                        </span>
                      )}
                      {active && !collapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary beacon" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-border">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-xl bg-sidebar-accent">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center font-bold text-xs text-white flex-shrink-0">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-sm font-medium ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/signin');
  }, [user, authLoading, router]);

  useEffect(() => {
    setFormattedDate(
      new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    );
  }, []);

  const currentPage = ALL_ITEMS.find(i =>
    i.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(i.href)
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="aurora-bg"><div className="aurora-orb aurora-orb-1" /><div className="aurora-orb aurora-orb-2" /></div>
        <div className="flex flex-col items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
            <span className="text-white font-black text-xl">FS</span>
          </div>
          <div className="space-y-1 text-center">
            <p className="font-extrabold text-white text-lg">FinSentinel</p>
            <p className="text-sm text-white/40">Loading your dashboard…</p>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-indigo-500/60"
                style={{ animation: `beacon 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Aurora bg */}
      <div className="aurora-bg"><div className="aurora-orb aurora-orb-1" /><div className="aurora-orb aurora-orb-2" /></div>

      {/* ── Desktop Sidebar ─────────────────────── */}
      <aside className={`
        relative hidden md:flex flex-col flex-shrink-0 h-full z-40
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-64'}
        border-r border-border
        bg-sidebar
      `}>
        <SidebarContent collapsed={collapsed} pathname={pathname} user={user} handleLogout={logout} />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-indigo-500 border-2 border-background flex items-center justify-center shadow-lg shadow-indigo-500/40 hover:bg-indigo-400 transition-colors z-50"
        >
          {collapsed
            ? <ChevronRight className="h-3 w-3 text-white" />
            : <ChevronLeft className="h-3 w-3 text-white" />}
        </button>
      </aside>

      {/* ── Mobile Drawer ─────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/60 light:bg-black/20" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-sidebar border-r border-border overflow-y-auto">
            <SidebarContent collapsed={false} pathname={pathname} user={user} handleLogout={logout} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main Area ─────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top Header */}
        <header className="flex-shrink-0 px-5 md:px-8 py-4 border-b border-border bg-background/90 flex items-center justify-between gap-4 z-30">
          {/* Left */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-bold text-foreground text-lg leading-tight truncate">
                {currentPage?.label || 'Dashboard'}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {formattedDate}
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Search */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/50 border border-border text-xs text-muted-foreground w-52 cursor-pointer hover:bg-accent transition-colors">
              <Search className="h-3.5 w-3.5" />
              <span>Search anything…</span>
              <span className="ml-auto font-mono bg-border px-1.5 py-0.5 rounded text-[10px]">⌘K</span>
            </div>

            {/* Notifications */}
            <button className="relative p-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary border-2 border-background" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Avatar */}
            <button className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-violet-500/30 hover:shadow-lg hover:shadow-violet-500/40 transition-shadow">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-5 md:p-8 max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <VoiceAssistant />
    </div>
  );
}
