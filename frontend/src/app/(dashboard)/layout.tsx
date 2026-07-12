'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ProtectedRoute } from '@/components/protected-route';
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  History,
  Search,
  HelpCircle,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Fleet', href: '/vehicles', icon: Truck },
  { label: 'Drivers', href: '/drivers', icon: Users },
  { label: 'Trips', href: '/trips', icon: Route },
  { label: 'Maintenance', href: '/maintenance', icon: Wrench },
  { label: 'Fuel & Expenses', href: '/fuel-expenses', icon: Fuel },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen w-screen overflow-hidden bg-muted/10 dark:bg-background">
        {/* Desktop Sidebar (Permanent) */}
        <aside className="hidden md:flex md:w-64 md:flex-col border-r border-slate-100 dark:border-slate-800/40 bg-card text-card-foreground">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 border-b border-slate-100 dark:border-slate-800/40">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0052cc] text-white">
                <Truck className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight leading-none text-[#002b74] dark:text-[#60a5fa] font-sans">
                  TransitOps
                </span>
                <span className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase mt-0.5">
                  Fleet Management
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5 px-4 py-4 overflow-y-auto">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-secondary text-secondary-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${active ? 'text-primary' : ''}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Dispatch Button Section */}
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800/40">
            <Link href="/trips">
              <Button className="w-full bg-[#0052cc] hover:bg-[#004099] text-white py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 font-semibold">
                <span className="text-lg font-light leading-none">+</span>
                <span>New Dispatch</span>
              </Button>
            </Link>
          </div>

          {/* User & Logout Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800/40 space-y-1">
            <Link
              href="/support"
              className="flex items-center space-x-3 px-3.5 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <HelpCircle className="h-4.5 w-4.5" />
              <span>Support</span>
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center space-x-3 px-3.5 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all text-left"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar (Slide-out Drawer) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Drawer */}
            <aside className="relative z-50 flex w-64 flex-col bg-card border-r border-slate-100 dark:border-slate-800/40 text-card-foreground p-4">
              <div className="flex h-12 items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-4 mb-4">
                <Link href="/dashboard" className="flex items-center space-x-3" onClick={() => setSidebarOpen(false)}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0052cc] text-white">
                    <Truck className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-md leading-none text-[#002b74] dark:text-[#60a5fa]">TransitOps</span>
                    <span className="text-[8px] font-semibold text-muted-foreground uppercase mt-0.5">Fleet Management</span>
                  </div>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="flex-1 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => {
                  const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? 'bg-secondary text-secondary-foreground font-semibold shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className={`h-4.5 w-4.5 ${active ? 'text-primary' : ''}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/40 mt-4 space-y-2">
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center space-x-3 px-3.5 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all text-left"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  <span>Logout</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Window */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b border-slate-100 dark:border-slate-800/40 bg-card px-6">
            <div className="flex items-center space-x-4 flex-1 max-w-md">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="relative w-full hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search vehicles, drivers, or trips..."
                  className="w-full bg-[#f4f6fa] dark:bg-muted/40 border-0 rounded-xl pl-10 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Notification icon */}
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
              </Button>

              {/* History icon */}
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden sm:inline-flex">
                <History className="h-5 w-5" />
              </Button>

              {/* User Profile Summary */}
              <div className="flex items-center space-x-3 border-l border-slate-100 dark:border-slate-800/40 pl-4">
                <div className="flex flex-col text-right hidden sm:flex">
                  <span className="text-sm font-bold text-foreground leading-none">{user?.name || 'Alex Rivera'}</span>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase mt-1">
                    {user?.role === 'ADMIN' ? 'FLEET ADMIN' : user?.role || 'FLEET ADMIN'}
                  </span>
                </div>
                <div className="h-9 w-9 rounded-full overflow-hidden border border-[#0052cc]/20 bg-[#0052cc]/10 flex items-center justify-center text-[#0052cc] font-bold text-sm">
                  {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'AR'}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
