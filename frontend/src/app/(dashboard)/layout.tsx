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
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Sun,
  Moon,
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
  { label: 'Vehicles', href: '/vehicles', icon: Truck },
  { label: 'Drivers', href: '/drivers', icon: Users },
  { label: 'Trips', href: '/trips', icon: Route },
  { label: 'Maintenance', href: '/maintenance', icon: Wrench },
  { label: 'Fuel Logs', href: '/fuel-logs', icon: Fuel },
  { label: 'Expenses', href: '/expenses', icon: DollarSign },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
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

  const getBreadcrumb = () => {
    const segment = pathname.split('/').filter(Boolean)[0];
    if (!segment) return 'Dashboard';
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen w-screen overflow-hidden bg-muted/10 dark:bg-background">
        {/* Desktop Sidebar (Permanent) */}
        <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-card text-card-foreground">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 border-b">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground font-bold">
                T
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground">TransitOps ERP</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User & Logout Footer */}
          <div className="p-4 border-t space-y-2">
            <div className="flex items-center space-x-3 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-semibold truncate leading-none text-foreground">{user?.name}</p>
                <span className="text-[10px] text-muted-foreground font-medium uppercase">{user?.role}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
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
            <aside className="relative z-50 flex w-64 flex-col bg-card border-r text-card-foreground p-4">
              <div className="flex h-12 items-center justify-between border-b pb-4 mb-4">
                <Link href="/dashboard" className="flex items-center space-x-2" onClick={() => setSidebarOpen(false)}>
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground font-bold">
                    T
                  </div>
                  <span className="font-bold text-md">TransitOps ERP</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const active = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t mt-4 space-y-2">
                <div className="flex items-center space-x-3 px-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-semibold truncate leading-none">{user?.name}</p>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase">{user?.role}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Window */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b bg-card px-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-md font-semibold text-muted-foreground">
                {getBreadcrumb()}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* User Dropdown Profile Summary */}
              <div className="hidden md:flex items-center space-x-2 border-l pl-4">
                <span className="text-sm font-medium text-foreground">{user?.name}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                  {user?.role}
                </span>
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
