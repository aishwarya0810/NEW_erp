'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import {
  ShoppingCart,
  Plus,
  Truck,
  FileText,
  UserPlus,
  Warehouse,
  CheckCircle,
  Clock,
  ChevronDown,
  Trash2,
  X,
  TrendingDown
} from 'lucide-react';

export default function PurchasingPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');

  // Supplier modal state
  const [isSupModalOpen, setIsSupModalOpen] = useState(false);
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // PO Creation modal state
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<Array<{ productId: string; quantity: number; unitCost: number }>>([]);
  const [selectedProdId, setSelectedProdId] = useState('');
  const [selectedProdQty, setSelectedProdQty] = useState(10);
  const [selectedProdCost, setSelectedProdCost] = useState(0);

  // PO Receiving modal state
  const [receivingPoId, setReceivingPoId] = useState<string | null>(null);
  const [receivingWarehouseId, setReceivingWarehouseId] = useState('');

  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const isWarehouseStaff = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE_MANAGER' || user?.role === 'MANAGER';

  // 1. Queries
  const { data: purchaseOrders, isLoading: isPoLoading } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: async () => {
      const res = await api.get('/purchasing/orders');
      return res.data.data;
    }
  });

  const { data: suppliers, isLoading: isSupLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await api.get('/purchasing/suppliers');
      return res.data.data;
    }
  });

  const { data: products } = useQuery({
    queryKey: ['allProducts'],
    queryFn: async () => {
      const res = await api.get('/products?limit=100');
      return res.data.data.products;
    }
  });

  const { data: warehouses } = useQuery({
    queryKey: ['allWarehouses'],
    queryFn: async () => {
      const res = await api.get('/warehouses');
      return res.data.data;
    }
  });

  // 2. Mutations
  const createSupplierMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/purchasing/suppliers', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsSupModalOpen(false);
      setSupName('');
      setSupContact('');
      setSupEmail('');
      setSupPhone('');
      setSupAddress('');
    }
  });

  const createPoMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/purchasing/orders', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      setIsPoModalOpen(false);
      setPoSupplierId('');
      setPoNotes('');
      setPoItems([]);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to create Purchase Order.');
    }
  });

  const updatePoStatusMutation = useMutation({
    mutationFn: async (payload: { id: string; status: string }) => {
      const res = await api.patch(`/purchasing/orders/${payload.id}/status`, { status: payload.status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });

  const receivePoMutation = useMutation({
    mutationFn: async (payload: { id: string; warehouseId: string }) => {
      const res = await api.post(`/purchasing/orders/${payload.id}/receive`, { warehouseId: payload.warehouseId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      setReceivingPoId(null);
      setReceivingWarehouseId('');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to receive stock.');
    }
  });

  // 3. Actions
  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    createSupplierMutation.mutate({
      name: supName,
      contactName: supContact,
      email: supEmail,
      phone: supPhone,
      address: supAddress
    });
  };

  const handleAddPoItem = () => {
    if (!selectedProdId) return;
    const exists = poItems.find(item => item.productId === selectedProdId);
    if (exists) {
      alert('Product already added to list.');
      return;
    }
    setPoItems([
      ...poItems,
      { productId: selectedProdId, quantity: selectedProdQty, unitCost: selectedProdCost }
    ]);
    setSelectedProdId('');
    setSelectedProdQty(10);
    setSelectedProdCost(0);
  };

  const handleRemovePoItem = (prodId: string) => {
    setPoItems(poItems.filter(item => item.productId !== prodId));
  };

  const handleCreatePoSubmit = () => {
    if (!poSupplierId) {
      alert('Please select a supplier.');
      return;
    }
    if (poItems.length === 0) {
      alert('Please add at least one item.');
      return;
    }
    createPoMutation.mutate({
      supplierId: poSupplierId,
      notes: poNotes,
      items: poItems
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    updatePoStatusMutation.mutate({ id, status });
  };

  const handleReceiveStockSubmit = () => {
    if (!receivingPoId || !receivingWarehouseId) return;
    receivePoMutation.mutate({ id: receivingPoId, warehouseId: receivingWarehouseId });
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50">Purchasing & Suppliers</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage vendor relations, generate purchase orders, and record incoming stock.</p>
        </div>

        {isManager && (
          <div>
            {activeTab === 'orders' ? (
              <button
                onClick={() => setIsPoModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                New Purchase Order
              </button>
            ) : (
              <button
                onClick={() => setIsSupModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                Add Supplier
              </button>
            )}
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-zinc-900 pb-px">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'orders'
              ? 'border-blue-500 text-blue-400 font-bold'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Purchase Orders
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'suppliers'
              ? 'border-blue-500 text-blue-400 font-bold'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Suppliers Directory
        </button>
      </div>

      {/* TAB CONTENT: ORDERS */}
      {activeTab === 'orders' && (
        <>
          {isPoLoading ? (
            <div className="flex h-[20vh] items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-800 border-t-blue-500"></div>
            </div>
          ) : (
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900/50 border-b border-zinc-850 text-zinc-400 font-semibold">
                      <th className="p-4 uppercase tracking-wider">Order No</th>
                      <th className="p-4 uppercase tracking-wider">Supplier</th>
                      <th className="p-4 uppercase tracking-wider text-right">Items Count</th>
                      <th className="p-4 uppercase tracking-wider text-right">Total Cost</th>
                      <th className="p-4 uppercase tracking-wider text-center">Status</th>
                      <th className="p-4 uppercase tracking-wider text-right">Date Created</th>
                      <th className="p-4 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/80">
                    {purchaseOrders?.map((po: any) => (
                      <tr key={po.id} className="hover:bg-zinc-900/40 transition">
                        <td className="p-4 font-mono font-bold text-zinc-100">{po.poNumber}</td>
                        <td className="p-4 text-zinc-300">{po.supplier.name}</td>
                        <td className="p-4 text-right font-medium text-zinc-400">{po.items.length} unique items</td>
                        <td className="p-4 text-right font-bold text-zinc-100">${Number(po.totalAmount).toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                              po.status === 'RECEIVED'
                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30'
                                : po.status === 'CANCELLED'
                                ? 'bg-red-950/40 text-red-400 border border-red-800/30'
                                : 'bg-blue-950/40 text-blue-400 border border-blue-800/30'
                            }`}
                          >
                            {po.status}
                          </span>
                        </td>
                        <td className="p-4 text-right text-zinc-500">{new Date(po.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right space-x-2">
                          {/* Manager Approval Actions */}
                          {isManager && po.status === 'DRAFT' && (
                            <button
                              onClick={() => handleStatusChange(po.id, 'APPROVED')}
                              className="px-2 py-1 rounded bg-blue-600/10 border border-blue-500/25 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-bold transition cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          {isManager && po.status === 'APPROVED' && (
                            <button
                              onClick={() => handleStatusChange(po.id, 'SHIPPED')}
                              className="px-2 py-1 rounded bg-indigo-600/10 border border-indigo-500/25 hover:bg-indigo-600 text-indigo-400 hover:text-white text-[10px] font-bold transition cursor-pointer"
                            >
                              Mark Shipped
                            </button>
                          )}

                          {/* Warehouse Staff: Receive Inbound Stock */}
                          {isWarehouseStaff && po.status === 'SHIPPED' && (
                            <button
                              onClick={() => setReceivingPoId(po.id)}
                              className="px-2 py-1 rounded bg-emerald-600/10 border border-emerald-500/25 hover:bg-emerald-650 text-emerald-400 hover:text-white text-[10px] font-bold transition flex items-center gap-1 inline-flex cursor-pointer"
                            >
                              <Warehouse className="h-3 w-3" />
                              Receive Inventory
                            </button>
                          )}

                          {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && isManager && (
                            <button
                              onClick={() => handleStatusChange(po.id, 'CANCELLED')}
                              className="px-2 py-1 rounded bg-red-950/20 hover:bg-red-600 border border-red-800/20 text-red-400 hover:text-white text-[10px] font-bold transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {purchaseOrders?.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-zinc-500 text-xs">
                          No Purchase Orders found. Click "New Purchase Order" to generate a draft.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB CONTENT: SUPPLIERS */}
      {activeTab === 'suppliers' && (
        <>
          {isSupLoading ? (
            <div className="flex h-[20vh] items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-800 border-t-blue-500"></div>
            </div>
          ) : (
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900/50 border-b border-zinc-850 text-zinc-400 font-semibold">
                      <th className="p-4 uppercase tracking-wider">Company Name</th>
                      <th className="p-4 uppercase tracking-wider">Contact Person</th>
                      <th className="p-4 uppercase tracking-wider">Email</th>
                      <th className="p-4 uppercase tracking-wider">Phone</th>
                      <th className="p-4 uppercase tracking-wider">Location / Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/80">
                    {suppliers?.map((sup: any) => (
                      <tr key={sup.id} className="hover:bg-zinc-900/40 transition">
                        <td className="p-4 font-semibold text-zinc-100">{sup.name}</td>
                        <td className="p-4 text-zinc-300">{sup.contactName || 'N/A'}</td>
                        <td className="p-4 text-zinc-400">{sup.email || 'N/A'}</td>
                        <td className="p-4 text-zinc-400">{sup.phone || 'N/A'}</td>
                        <td className="p-4 text-zinc-500 truncate max-w-[200px]" title={sup.address}>{sup.address || 'N/A'}</td>
                      </tr>
                    ))}
                    {suppliers?.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-zinc-500 text-xs">
                          No Suppliers configured. Click "Add Supplier" to setup vendor directories.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* CREATE SUPPLIER MODAL */}
      {isSupModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel p-6 rounded-xl animate-fade-in relative">
            <button
              onClick={() => setIsSupModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-400" />
              Configure Supplier
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Insert a new supplier contact configuration into registry.</p>

            <form onSubmit={handleCreateSupplier} className="space-y-4 mt-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Logistical Supplies"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Contact Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={supContact}
                  onChange={(e) => setSupContact(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Email</label>
                  <input
                    type="email"
                    placeholder="sales@apex.com"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Phone</label>
                  <input
                    type="text"
                    placeholder="555-0199"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Address Location</label>
                <input
                  type="text"
                  placeholder="Street address, City, Country"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsSupModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSupplierMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition"
                >
                  {createSupplierMutation.isPending ? 'Saving...' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PURCHASE ORDER MODAL */}
      {isPoModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl glass-panel p-6 rounded-xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsPoModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-400" />
              Create Purchase Order
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Specify items, quantity and costs to issue draft PO to suppliers.</p>

            <div className="space-y-4 mt-5">
              {/* Select Supplier */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Supplier Vendor</label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                >
                  <option value="">Select a vendor supplier...</option>
                  {suppliers?.map((sup: any) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Item Block */}
              <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-850 space-y-3">
                <p className="text-xs font-bold text-zinc-300">Add Order Line Item</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={selectedProdId}
                    onChange={(e) => {
                      setSelectedProdId(e.target.value);
                      const prod = products?.find((p: any) => p.id === e.target.value);
                      if (prod) setSelectedProdCost(Number(prod.cost));
                    }}
                    className="bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2 text-xs text-zinc-200"
                  >
                    <option value="">Select Product...</option>
                    {products?.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    placeholder="Quantity"
                    value={selectedProdQty}
                    onChange={(e) => setSelectedProdQty(parseInt(e.target.value) || 1)}
                    className="bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2 text-xs text-zinc-200"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Unit Cost"
                    value={selectedProdCost}
                    onChange={(e) => setSelectedProdCost(parseFloat(e.target.value) || 0)}
                    className="bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2 text-xs text-zinc-200"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddPoItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-blue-400" /> Add to Order
                  </button>
                </div>
              </div>

              {/* Items List Table */}
              {poItems.length > 0 && (
                <div className="border border-zinc-900 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-900/40 border-b border-zinc-850 text-zinc-400">
                        <th className="p-3">Product Name</th>
                        <th className="p-3 text-right">Quantity</th>
                        <th className="p-3 text-right">Unit Cost</th>
                        <th className="p-3 text-right">Total Cost</th>
                        <th className="p-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/60">
                      {poItems.map((item) => {
                        const prod = products?.find((p: any) => p.id === item.productId);
                        return (
                          <tr key={item.productId} className="text-zinc-300">
                            <td className="p-3">{prod?.name || 'Unknown'}</td>
                            <td className="p-3 text-right">{item.quantity}</td>
                            <td className="p-3 text-right">${item.unitCost.toFixed(2)}</td>
                            <td className="p-3 text-right font-semibold text-zinc-200">
                              ${(item.quantity * item.unitCost).toFixed(2)}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleRemovePoItem(item.productId)}
                                className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PO Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Order Notes (Optional)</label>
                <textarea
                  placeholder="Specific delivery instructions, deadline contracts, shipping details"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200 h-16 resize-none placeholder-zinc-600"
                />
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center py-2.5 border-t border-zinc-900">
                <span className="text-xs font-bold text-zinc-400">Total Purchase Cost:</span>
                <span className="text-lg font-black text-blue-400">
                  ${poItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0).toFixed(2)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPoModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreatePoSubmit}
                  disabled={createPoMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition shadow-lg shadow-blue-500/10"
                >
                  {createPoMutation.isPending ? 'Submitting...' : 'Save & Issue PO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECEIVE INBOUND INVENTORY MODAL */}
      {receivingPoId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel p-6 rounded-xl animate-fade-in relative">
            <button
              onClick={() => setReceivingPoId(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-emerald-400" />
              Receive Purchase Order
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Select the physical warehouse where stock items are arriving.</p>

            <div className="space-y-4 mt-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Warehouse Location</label>
                <select
                  value={receivingWarehouseId}
                  onChange={(e) => setReceivingWarehouseId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                >
                  <option value="">Select receiving warehouse...</option>
                  {warehouses?.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setReceivingPoId(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReceiveStockSubmit}
                  disabled={receivePoMutation.isPending || !receivingWarehouseId}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition disabled:opacity-50"
                >
                  {receivePoMutation.isPending ? 'Updating...' : 'Record Goods Arrival'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
