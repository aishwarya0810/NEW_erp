'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  TrendingUp,
  Users,
  LogOut,
  Warehouse,
  ChevronDown,
  User as UserIcon
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles?: string[];
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Boxes },
  { name: 'Warehouses', href: '/warehouses', icon: Warehouse },
  { name: 'Purchasing', href: '/purchasing', icon: ShoppingCart },
  { name: 'Sales & Orders', href: '/sales', icon: TrendingUp },
  { name: 'User Directory', href: '/users', icon: Users, roles: ['ADMIN'] }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, accessToken, clearAuth, activeWarehouseId, setActiveWarehouse } = useAuthStore();

  // 1. Auth Protection check
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, accessToken, router]);

  // 2. Fetch Warehouses for Context Switcher
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/warehouses');
      return res.data.data;
    },
    enabled: !!user
  });

  // Automatically select first warehouse on load if none selected
  useEffect(() => {
    if (warehouses && warehouses.length > 0 && !activeWarehouseId) {
      setActiveWarehouse(warehouses[0].id);
    }
  }, [warehouses, activeWarehouseId, setActiveWarehouse]);

  const activeWarehouse = warehouses?.find((w: any) => w.id === activeWarehouseId);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout request failed');
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col shrink-0">
        {/* Brand Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-zinc-900">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow shadow-blue-500/20">
            <span className="text-sm font-bold tracking-tight text-white">SP</span>
          </div>
          <span className="font-bold tracking-wide bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Stockpilot ERP</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {sidebarItems.map((item) => {
            // Check roles access list
            if (item.roles && !item.roles.includes(user.role)) return null;
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition duration-200 group ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <UserIcon className="h-4.5 w-4.5 text-zinc-400" />
            </div>
            <div className="max-w-[120px]">
              <p className="text-xs font-semibold truncate text-zinc-200">{user.name}</p>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate mt-0.5">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="h-16 border-b border-zinc-900 bg-zinc-950/20 backdrop-blur-md px-8 flex items-center justify-between shrink-0">
          {/* Breadcrumb Title */}
          <div>
            <span className="text-sm font-semibold tracking-wide text-zinc-300">
              {sidebarItems.find(item => pathname.startsWith(item.href))?.name || 'Stockpilot Suite'}
            </span>
          </div>

          {/* Controls: Warehouse Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Warehouse className="h-4.5 w-4.5 text-zinc-400" />
              <div className="relative">
                <select
                  value={activeWarehouseId || ''}
                  onChange={(e) => setActiveWarehouse(e.target.value)}
                  className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold text-zinc-200 transition cursor-pointer focus:outline-none appearance-none"
                >
                  {warehouses?.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                  {!warehouses?.length && <option value="">No Warehouses</option>}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-zinc-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </header>

        {/* PAGE SCREEN CONTENT */}
        <main className="flex-1 overflow-y-auto p-8 bg-zinc-950/40 relative">
          <div className="absolute top-10 right-10 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="max-w-7xl mx-auto animate-fade-in relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
