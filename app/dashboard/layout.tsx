'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Target,
  Settings,
  LogOut,
  Menu,
  LineChart,
  Sparkles,
  Zap,
  Heart,
  Mic,
} from 'lucide-react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/expenses', label: 'Expenses', icon: TrendingUp },
  { href: '/dashboard/income', label: 'Income', icon: Wallet },
  { href: '/dashboard/budgets', label: 'Budgets', icon: Zap },
  { href: '/dashboard/goals', label: 'Goals', icon: Target },
  { href: '/dashboard/future-impact', label: 'Future Impact', icon: LineChart },
  { href: '/dashboard/social-impact', label: 'Social Impact', icon: Heart },
  { href: '/dashboard/insights', label: 'AI Insights', icon: Sparkles },
  { href: '/dashboard/voice-entry', label: 'Voice Entry', icon: Mic },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

import { VoiceAssistant } from '@/components/voice-assistant';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    await logout();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">FinSentinel</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={`${desktopSidebarOpen ? 'w-64' : 'w-20'
          } bg-sidebar border-r border-sidebar-border transition-all duration-300 hidden md:flex flex-col z-40`}
      >
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-sidebar-foreground">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              FS
            </div>
            {desktopSidebarOpen && <span>FinSentinel</span>}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${active
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    } ${!desktopSidebarOpen ? 'justify-center' : ''}`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {desktopSidebarOpen && <span className="text-sm">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-2">
          <div className={`text-sm text-sidebar-foreground ${desktopSidebarOpen ? '' : 'hidden'}`}>
            <p className="font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            className={`w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 ${!desktopSidebarOpen ? 'px-0 justify-center' : ''}`}
            onClick={handleLogout}
            size={desktopSidebarOpen ? 'default' : 'icon'}
          >
            <LogOut className="h-4 w-4" />
            {desktopSidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-sidebar-foreground">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                  FS
                </div>
                <span>FinSentinel</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-sidebar-foreground"
                onClick={() => setSidebarOpen(false)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="ml-2">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-sidebar-border space-y-2">
              <div className="text-sm text-sidebar-foreground">
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="ml-2">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-sidebar border-b border-sidebar-border p-4 flex items-center justify-between z-30">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-sidebar-foreground">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              FS
            </div>
            <span>FinSentinel</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
        <VoiceAssistant />
      </div>
    </div>
  );
}
