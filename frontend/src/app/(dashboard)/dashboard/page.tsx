'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import {
  Boxes,
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  PlusCircle,
  FileText,
  User,
  RefreshCw,
  Clock
} from 'lucide-react';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { activeWarehouseId } = useAuthStore();
  const [adjustProductId, setAdjustProductId] = useState('');
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustSuccess, setAdjustSuccess] = useState(false);

  // Fetch Dashboard Summary Data
  const { data: summary, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary');
      return res.data.data;
    }
  });

  // Fetch Active Products (for stock adjustment dropdown)
  const { data: productsData } = useQuery({
    queryKey: ['activeProducts'],
    queryFn: async () => {
      const res = await api.get('/products?limit=100');
      return res.data.data.products;
    }
  });

  // Stock Adjustment Mutation
  const adjustMutation = useMutation({
    mutationFn: async (data: {
      productId: string;
      warehouseId: string;
      type: string;
      quantity: number;
      reason: string;
    }) => {
      const res = await api.post('/products/adjust', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['activeProducts'] });
      setAdjustSuccess(true);
      setAdjustReason('');
      setAdjustProductId('');
      setAdjustQty(1);
      setTimeout(() => setAdjustSuccess(false), 3000);
    },
    onError: (err: any) => {
      setAdjustError(err.response?.data?.message || 'Failed to adjust stock.');
      setTimeout(() => setAdjustError(null), 5000);
    }
  });

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProductId) {
      setAdjustError('Please select a product.');
      return;
    }
    if (!activeWarehouseId) {
      setAdjustError('Please select a warehouse from the top dropdown.');
      return;
    }
    adjustMutation.mutate({
      productId: adjustProductId,
      warehouseId: activeWarehouseId,
      type: adjustType,
      quantity: adjustQty,
      reason: adjustReason || 'Manual Inventory Adjustment'
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-blue-500"></div>
          <span className="text-sm font-medium text-zinc-400">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-red-950/40 border border-red-800/40 text-red-200">
        <h3 className="font-bold text-lg">Error loading dashboard</h3>
        <p className="text-sm text-red-300 mt-1">{(error as any).message || 'An unexpected error occurred.'}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-red-800 hover:bg-red-700 text-xs font-semibold rounded-lg transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upper header action area */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
            System Overview
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Real-time status updates and operation health.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-xs font-semibold tracking-wide transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          {isRefetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition duration-300"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Stock Value</p>
              <h3 className="text-2xl font-black text-zinc-50 mt-2">
                ${summary.totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-4">Calculated cross-warehouse costs</p>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition duration-300"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Active Products</p>
              <h3 className="text-2xl font-black text-zinc-50 mt-2">{summary.totalProducts}</h3>
            </div>
            <div className="p-3 rounded-lg bg-purple-600/10 border border-purple-500/20 text-purple-400">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-4">Unique items in active catalog</p>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition duration-300"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Low Stock Warnings</p>
              <h3 className="text-2xl font-black text-zinc-50 mt-2">{summary.lowStockCount}</h3>
            </div>
            <div className="p-3 rounded-lg bg-yellow-600/10 border border-yellow-500/20 text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-4">Needs immediate reorder</p>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition duration-300"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Pending Purchases</p>
              <h3 className="text-2xl font-black text-zinc-50 mt-2">{summary.pendingPurchases}</h3>
            </div>
            <div className="p-3 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-4">Purchase orders in pipeline</p>
        </div>
      </div>

      {/* DASHBOARD DETAILS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column (2/3 width) - Stock adjustment & Movements */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Adjustment Form */}
          <div className="glass-panel p-6 rounded-xl">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2.5">
              <PlusCircle className="h-5 w-5 text-blue-400" />
              Quick Stock Adjustment
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Record manual inventory stock inbound/outbound adjustments.</p>

            {adjustSuccess && (
              <div className="mt-4 p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-200 text-xs font-semibold">
                Stock adjustment recorded successfully!
              </div>
            )}
            {adjustError && (
              <div className="mt-4 p-3.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-200 text-xs font-semibold">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Product</label>
                <select
                  value={adjustProductId}
                  onChange={(e) => setAdjustProductId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200 text-zinc-200"
                >
                  <option value="">Select a Product...</option>
                  {productsData?.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Stock: {p.quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Type</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200 text-zinc-200"
                  >
                    <option value="INBOUND">Inbound (+)</option>
                    <option value="OUTBOUND">Outbound (-)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200 text-zinc-200"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Adjustment Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Broken packaging audit correction, standard cycle count"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200 text-zinc-200 placeholder-zinc-600"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={adjustMutation.isPending}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition active:scale-95 disabled:opacity-50"
                >
                  {adjustMutation.isPending ? 'Saving...' : 'Post Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>

          {/* Recent Stock Movements */}
          <div className="glass-panel p-6 rounded-xl">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2.5">
              <Clock className="h-5 w-5 text-purple-400" />
              Recent Stock Movements
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Logs of warehouse arrivals, transfers, and shipments.</p>

            <div className="mt-5 space-y-3.5">
              {summary.recentMovements.map((m: any) => {
                const isInbound = m.type === 'INBOUND' || m.type === 'ADJUSTMENT';
                return (
                  <div key={m.id} className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-850 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-zinc-200">{m.product.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        SKU: {m.product.sku} | Warehouse: {m.warehouse.name}
                      </p>
                      {m.reason && <p className="text-[10px] text-zinc-400 italic mt-0.5">"{m.reason}"</p>}
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          isInbound
                            ? 'bg-emerald-950/45 text-emerald-400 border border-emerald-800/30'
                            : 'bg-red-950/45 text-red-400 border border-red-800/30'
                        }`}
                      >
                        {isInbound ? '+' : '-'}
                        {m.quantity}
                      </span>
                      <p className="text-[9px] text-zinc-500 mt-1.5">{new Date(m.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                );
              })}
              {summary.recentMovements.length === 0 && (
                <div className="text-center py-6 text-xs text-zinc-600">No stock movements found.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right column (1/3 width) - Audit & Low Stock Alerts */}
        <div className="space-y-8">
          {/* Recent Security/Activity Logs */}
          <div className="glass-panel p-6 rounded-xl">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2.5">
              <FileText className="h-5 w-5 text-purple-400" />
              Operation Audit Feed
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Real-time administrator & staff actions log.</p>

            <div className="mt-5 space-y-4">
              {summary.recentAuditLogs.map((log: any) => (
                <div key={log.id} className="flex gap-3 text-xs">
                  <div className="h-7 w-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-zinc-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-zinc-200">
                      <span className="font-semibold">{log.user?.name || 'System'}</span>{' '}
                      {log.action.replace(/_/g, ' ').toLowerCase()}
                    </p>
                    <p className="text-[9px] text-zinc-500 mt-1">
                      {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {summary.recentAuditLogs.length === 0 && (
                <div className="text-center py-6 text-xs text-zinc-600">No logs generated.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
