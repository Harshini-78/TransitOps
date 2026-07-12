'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LoadingScreen } from './ui/spinner';
import { Role } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated()) {
        router.push('/login');
      } else if (allowedRoles && role && !allowedRoles.includes(role)) {
        // Redirect to dashboard if they don't have access to this page
        router.push('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, role, allowedRoles, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated()) {
    return <LoadingScreen />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
