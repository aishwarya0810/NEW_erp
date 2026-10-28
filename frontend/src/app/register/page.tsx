'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, User, ShieldAlert, AlertTriangle } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  roleName: z.enum(['ADMIN', 'MANAGER', 'INVENTORY_STAFF', 'SALES_STAFF', 'WAREHOUSE_MANAGER'])
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      roleName: 'INVENTORY_STAFF'
    }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      await api.post('/auth/register', data);
      setSuccessMsg('Account registered successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-950 p-6 relative overflow-hidden">
      {/* Background Accent Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl animate-fade-in relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
            <span className="text-xl font-bold tracking-tight text-white">SP</span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Create Account</h2>
          <p className="text-sm text-zinc-400 mt-1">Get started with Stockpilot ERP</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-200 text-sm flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Registration Failed</p>
              <p className="text-red-300/90 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-200 text-sm">
            <p className="font-semibold">Success</p>
            <p className="text-emerald-300/90 mt-0.5">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Full Name</label>
            <div className="relative glow-effect rounded-lg">
              <User className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="John Doe"
                {...register('name')}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none text-zinc-100 placeholder-zinc-500 text-sm transition"
              />
            </div>
            {errors.name && (
              <p className="text-xs font-medium text-red-400 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Email Address</label>
            <div className="relative glow-effect rounded-lg">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="email"
                placeholder="john.doe@company.com"
                {...register('email')}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none text-zinc-100 placeholder-zinc-500 text-sm transition"
              />
            </div>
            {errors.email && (
              <p className="text-xs font-medium text-red-400 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Password</label>
            <div className="relative glow-effect rounded-lg">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none text-zinc-100 placeholder-zinc-500 text-sm transition"
              />
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-red-400 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Role selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Select ERP Role</label>
            <div className="relative glow-effect rounded-lg">
              <ShieldAlert className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
              <select
                {...register('roleName')}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none text-zinc-100 text-sm transition appearance-none"
              >
                <option value="ADMIN">System Administrator</option>
                <option value="MANAGER">General Manager</option>
                <option value="INVENTORY_STAFF">Inventory Staff</option>
                <option value="SALES_STAFF">Sales Staff</option>
                <option value="WAREHOUSE_MANAGER">Warehouse Manager</option>
              </select>
            </div>
            {errors.roleName && (
              <p className="text-xs font-medium text-red-400 mt-1">{errors.roleName.message}</p>
            )}
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-sm font-semibold text-white tracking-wide shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              'Create ERP Account'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-zinc-300 hover:text-blue-400 transition">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
