'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ShieldAlert, Check } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiResponse, AuthSuccessPayload } from '@/types';

// Login Validation Schema
const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long'),
  role: z.string(),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'FLEET_MANAGER',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // POST /auth/login expects email and password
      const response = await api.post<ApiResponse<AuthSuccessPayload>>('/auth/login', {
        email: data.email.trim(),
        password: data.password,
      });

      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data;
        
        // Log user in and redirect to dashboard
        login(token, user);
      } else {
        setErrorMessage('Failed to sign in. Please verify your credentials.');
      }
    } catch (error) {
      console.error('Login error', error);
      let apiErrorMsg = 'Invalid email or password credential combination.';
      if (axios.isAxiosError(error)) {
        apiErrorMsg = error.response?.data?.message || apiErrorMsg;
      }
      setErrorMessage(apiErrorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex h-screen w-screen overflow-hidden bg-background">
      {/* Left Panel: Smarter Fleet Operations Info (Odoo Grid Style) */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-slate-900 p-12 text-white md:flex">
        {/* Background Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
        
        {/* Logo */}
        <div className="relative z-10 flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 font-bold text-xl text-slate-950">
            T
          </div>
          <span className="text-xl font-bold tracking-tight">TransitOps</span>
        </div>

        {/* Isometric graphic placeholder and text */}
        <div className="relative z-10 my-auto space-y-6 max-w-lg">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Smarter Fleet Operations.
          </h1>
          <p className="text-lg text-slate-300">
            The intelligence layer for modern logistics. Streamline dispatches, manage safety, and optimize expenses in one unified workspace.
          </p>

          {/* Access roles descriptions matching mockup */}
          <div className="space-y-3 border-t border-slate-800 pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-500">
              One login, four roles:
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-amber-500" />
                <span><strong className="text-white">Fleet Manager</strong>: Access Vehicles Registry & Maintenance</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-amber-500" />
                <span><strong className="text-white">Dispatcher (Admin)</strong>: Monitor Dashboard Analytics & Trip Dispatches</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-amber-500" />
                <span><strong className="text-white">Safety Officer</strong>: Manage Driver registry & Compliance logs</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-amber-500" />
                <span><strong className="text-white">Financial Analyst</strong>: Track Fuel logs, Expenses, & exports</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-500">
          TRANSITOPS © 2026 · RBAC ENTERPRISE SYSTEM
        </div>
      </div>

      {/* Right Panel: Sign In Form */}
      <div className="flex w-full flex-col justify-center bg-card px-8 md:w-1/2 md:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Sign in to your account
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to continue to TransitOps ERP.
            </p>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="flex items-start space-x-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive animate-in fade-in-50 duration-200">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold">Sign-in Failed</h5>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="e.g., raven.k@transitops.in"
              error={errors.email?.message}
              {...register('email')}
              disabled={isSubmitting}
            />

            {/* Password Field */}
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Mockup RBAC Role Picker */}
            <div className="space-y-1.5">
              <label htmlFor="role" className="text-sm font-medium text-foreground">
                Role (RBAC Session Scope)
              </label>
              <select
                id="role"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('role')}
                disabled={isSubmitting}
              >
                <option value="FLEET_MANAGER">Fleet Manager (FLEET_MANAGER)</option>
                <option value="ADMIN">Dispatcher / Admin (ADMIN)</option>
                <option value="DRIVER">Driver (DRIVER)</option>
                <option value="ANALYST">Financial Analyst (ANALYST)</option>
              </select>
              <p className="text-[11px] text-muted-foreground">
                *Note: Users are authenticated against the database. Choosing a role helps route testing.
              </p>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-sm font-medium text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  {...register('rememberMe')}
                  disabled={isSubmitting}
                />
                <span>Remember me</span>
              </label>
              <a href="#" className="text-sm font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400">
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 transition-all shadow mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Scopes footnote from mockup */}
          <div className="border-t border-muted pt-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">Access scope by role after login:</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 list-disc list-inside">
              <li>Fleet Manager → Fleet, Maintenance</li>
              <li>Dispatcher → Dashboard, Trips</li>
              <li>Safety Officer → Drivers, Settings</li>
              <li>Analyst → Fuel, Expenses, Reports</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
