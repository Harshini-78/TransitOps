import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4 dark:bg-background">
      <div className="w-full max-w-md space-y-6">
        {/* Branding header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
            T
          </div>
          <h1 className="text-2xl font-bold tracking-tight">TransitOps ERP</h1>
          <p className="text-sm text-muted-foreground">
            Odoo Fleet & Transport Operations Management
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
