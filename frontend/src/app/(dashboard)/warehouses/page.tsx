'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import {
  Warehouse as WarehouseIcon,
  MapPin,
  Layers,
  Plus,
  Edit,
  Trash2,
  ArrowLeftRight,
  X,
  AlertTriangle,
  Boxes,
  CheckCircle,
  TrendingDown
} from 'lucide-react';

export default function WarehousesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Role permissions
  const isAdmin = user?.role === 'ADMIN';
  const canTransfer = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'WAREHOUSE_MANAGER';

  // Selection state
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);

  // Modal states
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any | null>(null);

  // Form states - Warehouse CRUD
  const [whName, setWhName] = useState('');
  const [whAddress, setWhAddress] = useState('');
  const [whCapacity, setWhCapacity] = useState<number | ''>('');

  // Form states - Stock Transfer
  const [transferProductId, setTransferProductId] = useState('');
  const [transferQty, setTransferQty] = useState<number>(1);
  const [transferSourceId, setTransferSourceId] = useState('');
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);

  // 1. Fetch Warehouses
  const { data: warehouses, isLoading: isWhLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/warehouses');
      return res.data.data;
    }
  });

  // Automatically select the first warehouse on load
  useEffect(() => {
    if (warehouses && warehouses.length > 0 && !selectedWarehouseId) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

  // 2. Fetch Selected Warehouse Stock Levels
  const { data: stockLevels, isLoading: isStockLoading } = useQuery({
    queryKey: ['warehouseStock', selectedWarehouseId],
    queryFn: async () => {
      const res = await api.get(`/warehouses/${selectedWarehouseId}/stock`);
      return res.data.data;
    },
    enabled: !!selectedWarehouseId
  });

  // 3. Fetch Products (for transfer dropdown)
  const { data: products } = useQuery({
    queryKey: ['allProductsForTransfer'],
    queryFn: async () => {
      const res = await api.get('/products?limit=100');
      return res.data.data.products;
    }
  });

  // 4. Warehouse CRUD Mutations
  const createWarehouseMutation = useMutation({
    mutationFn: async (data: { name: string; address?: string; capacity?: number }) => {
      const res = await api.post('/warehouses', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsWarehouseModalOpen(false);
      resetWarehouseForm();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to create warehouse.');
    }
  });

  const updateWarehouseMutation = useMutation({
    mutationFn: async (payload: { id: string; data: { name: string; address?: string; capacity?: number } }) => {
      const res = await api.put(`/warehouses/${payload.id}`, payload.data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsWarehouseModalOpen(false);
      resetWarehouseForm();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update warehouse.');
    }
  });

  const deleteWarehouseMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/warehouses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      if (selectedWarehouseId) {
        setSelectedWarehouseId(null);
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete warehouse.');
    }
  });

  // 5. Stock Transfer Mutation
  const transferStockMutation = useMutation({
    mutationFn: async (data: {
      productId: string;
      sourceWarehouseId: string;
      targetWarehouseId: string;
      quantity: number;
    }) => {
      const res = await api.post('/warehouses/transfer', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouseStock'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setTransferSuccess(true);
      setTransferProductId('');
      setTransferQty(1);
      setTimeout(() => {
        setTransferSuccess(false);
        setIsTransferModalOpen(false);
      }, 2000);
    },
    onError: (err: any) => {
      setTransferError(err.response?.data?.message || 'Transfer failed.');
    }
  });

  // Helpers
  const resetWarehouseForm = () => {
    setWhName('');
    setWhAddress('');
    setWhCapacity('');
    setEditingWarehouse(null);
  };

  const handleWarehouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName) return;

    const data = {
      name: whName,
      address: whAddress || undefined,
      capacity: whCapacity ? Number(whCapacity) : undefined
    };

    if (editingWarehouse) {
      updateWarehouseMutation.mutate({ id: editingWarehouse.id, data });
    } else {
      createWarehouseMutation.mutate(data);
    }
  };

  const handleEditClick = (wh: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingWarehouse(wh);
    setWhName(wh.name);
    setWhAddress(wh.address || '');
    setWhCapacity(wh.capacity || '');
    setIsWarehouseModalOpen(true);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this warehouse? All stock history logs will remain but the site config is removed.')) {
      deleteWarehouseMutation.mutate(id);
    }
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);

    if (!transferProductId || !transferSourceId || !transferTargetId) {
      setTransferError('Please fill in all fields.');
      return;
    }

    if (transferSourceId === transferTargetId) {
      setTransferError('Source and Target warehouses must be different.');
      return;
    }

    if (transferQty <= 0) {
      setTransferError('Quantity must be greater than 0.');
      return;
    }

    transferStockMutation.mutate({
      productId: transferProductId,
      sourceWarehouseId: transferSourceId,
      targetWarehouseId: transferTargetId,
      quantity: transferQty
    });
  };

  const openTransferModal = () => {
    setTransferError(null);
    setTransferSuccess(false);
    if (selectedWarehouseId) {
      setTransferSourceId(selectedWarehouseId);
    } else if (warehouses && warehouses.length > 0) {
      setTransferSourceId(warehouses[0].id);
    }
    if (warehouses && warehouses.length > 1) {
      const other = warehouses.find((w: any) => w.id !== selectedWarehouseId);
      if (other) setTransferTargetId(other.id);
    }
    setIsTransferModalOpen(true);
  };

  const selectedWarehouse = warehouses?.find((w: any) => w.id === selectedWarehouseId);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50">Warehouse Locations</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Monitor stock levels across logistics facilities and dispatch intra-warehouse transfers.
          </p>
        </div>
        <div className="flex gap-2">
          {canTransfer && (
            <button
              onClick={openTransferModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-xs font-semibold tracking-wide transition cursor-pointer"
            >
              <ArrowLeftRight className="h-4 w-4 text-blue-400" />
              Transfer Stock
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => {
                resetWarehouseForm();
                setIsWarehouseModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition cursor-pointer shadow-lg shadow-blue-500/20"
            >
              <Plus className="h-4 w-4" />
              Add Warehouse
            </button>
          )}
        </div>
      </div>

      {/* CORE LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: WAREHOUSES DIRECTORY */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Locations Registry</h3>
            <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded-full text-zinc-500 font-semibold">
              {warehouses?.length || 0} sites
            </span>
          </div>

          {isWhLoading ? (
            <div className="flex py-10 justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-800 border-t-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {warehouses?.map((wh: any) => {
                const isSelected = wh.id === selectedWarehouseId;
                return (
                  <div
                    key={wh.id}
                    onClick={() => setSelectedWarehouseId(wh.id)}
                    className={`p-4 rounded-xl cursor-pointer border transition-all ${
                      isSelected
                        ? 'bg-blue-600/10 border-blue-500/40 shadow-md shadow-blue-500/5'
                        : 'bg-zinc-900/40 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <WarehouseIcon className={`h-5 w-5 ${isSelected ? 'text-blue-400' : 'text-zinc-400'}`} />
                        <div>
                          <h4 className="font-bold text-sm text-zinc-200">{wh.name}</h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {wh.address || 'No address specified'}
                          </p>
                        </div>
                      </div>
                      
                      {isAdmin && (
                        <div className="flex gap-1 shrink-0 ml-2">
                          <button
                            onClick={(e) => handleEditClick(wh, e)}
                            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
                            title="Edit Warehouse"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(wh.id, e)}
                            className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition"
                            title="Delete Warehouse"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-850/60 flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-zinc-500" />
                        Storage Capacity:
                      </span>
                      <span className="font-mono text-zinc-200 font-bold">
                        {wh.capacity ? wh.capacity.toLocaleString() : 'Unlimited'} units
                      </span>
                    </div>
                  </div>
                );
              })}
              {warehouses?.length === 0 && (
                <div className="text-center py-8 bg-zinc-900/20 rounded-xl border border-zinc-900 text-xs text-zinc-500">
                  No warehouse configurations. Add one above.
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: STOCK LEVELS IN SELECTED WAREHOUSE */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Site Inventory: {selectedWarehouse ? selectedWarehouse.name : 'Select a Warehouse'}
            </h3>
            {selectedWarehouse && (
              <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded-full text-zinc-500 font-semibold">
                {stockLevels?.length || 0} item lines
              </span>
            )}
          </div>

          {isStockLoading ? (
            <div className="flex py-20 justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-800 border-t-blue-500"></div>
            </div>
          ) : selectedWarehouseId ? (
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900/50 border-b border-zinc-850 text-zinc-400 font-semibold">
                      <th className="p-4 uppercase tracking-wider">Product</th>
                      <th className="p-4 uppercase tracking-wider">SKU</th>
                      <th className="p-4 uppercase tracking-wider">Category</th>
                      <th className="p-4 uppercase tracking-wider text-center">Warehouse Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/80">
                    {stockLevels?.map((s: any) => {
                      const isLowStock = s.quantity <= s.product.reorderLevel;
                      return (
                        <tr key={s.product.id} className="hover:bg-zinc-900/40 transition">
                          <td className="p-4">
                            <div className="font-semibold text-zinc-100">{s.product.name}</div>
                            {s.product.barcode && (
                              <div className="text-[10px] text-zinc-500 mt-0.5">Barcode: {s.product.barcode}</div>
                            )}
                          </td>
                          <td className="p-4 font-mono text-zinc-300">{s.product.sku}</td>
                          <td className="p-4 text-zinc-400">{s.product.category?.name || 'Unassigned'}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 font-bold text-zinc-200">
                              {isLowStock && (
                                <span title="Low stock alert based on global threshold">
                                  <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
                                </span>
                              )}
                              <span className={isLowStock ? 'text-yellow-400' : 'text-zinc-200'}>{s.quantity}</span>
                              <span className="text-[10px] text-zinc-500 font-normal">/ min {s.product.reorderLevel}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {stockLevels?.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-zinc-500 text-xs">
                          No stock is currently allocated in this warehouse. Inbound or transfer stock to populate.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-zinc-900/20 rounded-xl border border-zinc-900 text-xs text-zinc-500">
              Please select a warehouse from the registry on the left to load stock inventory.
            </div>
          )}
        </div>
      </div>

      {/* CREATE/EDIT WAREHOUSE MODAL */}
      {isWarehouseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel p-6 rounded-xl animate-fade-in relative">
            <button
              onClick={() => setIsWarehouseModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <WarehouseIcon className="h-5 w-5 text-blue-400" />
              {editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Configure a physical facility location details for warehouse inventory routing.
            </p>

            <form onSubmit={handleWarehouseSubmit} className="space-y-4 mt-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Warehouse Name</label>
                <input
                  type="text"
                  placeholder="e.g. West Coast Distribution"
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Physical Address</label>
                <input
                  type="text"
                  placeholder="e.g. 500 Airport Rd, San Jose, CA"
                  value={whAddress}
                  onChange={(e) => setWhAddress(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Capacity limit (units)</label>
                <input
                  type="number"
                  placeholder="e.g. 10000"
                  value={whCapacity}
                  onChange={(e) => setWhCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsWarehouseModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createWarehouseMutation.isPending || updateWarehouseMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition disabled:opacity-50"
                >
                  {createWarehouseMutation.isPending || updateWarehouseMutation.isPending ? 'Saving...' : 'Save Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK TRANSFER MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-xl animate-fade-in relative">
            <button
              onClick={() => setIsTransferModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-blue-400" />
              Transfer Stock
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Dispatch inventory product units between physical warehouse storage sites.
            </p>

            {transferSuccess && (
              <div className="mt-4 p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Stock transfer registered and audited successfully!
              </div>
            )}

            {transferError && (
              <div className="mt-4 p-3.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-200 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-4 mt-5">
              
              {/* Product Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Inventory Product</label>
                <select
                  value={transferProductId}
                  onChange={(e) => setTransferProductId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                  required
                >
                  <option value="">Select a product...</option>
                  {products?.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Global Catalog Qty: {p.quantity}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source & Target warehouses */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Source Location</label>
                  <select
                    value={transferSourceId}
                    onChange={(e) => setTransferSourceId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                    required
                  >
                    <option value="">Select source...</option>
                    {warehouses?.map((w: any) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Target Location</label>
                  <select
                    value={transferTargetId}
                    onChange={(e) => setTransferTargetId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                    required
                  >
                    <option value="">Select target...</option>
                    {warehouses?.map((w: any) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Transfer Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={transferQty}
                  onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferStockMutation.isPending || transferSuccess}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition disabled:opacity-50"
                >
                  {transferStockMutation.isPending ? 'Processing...' : 'Register Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
