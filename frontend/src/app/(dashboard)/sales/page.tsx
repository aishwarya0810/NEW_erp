'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import {
  TrendingUp,
  Plus,
  Users,
  FileText,
  UserPlus,
  Warehouse,
  Truck,
  CheckCircle,
  Clock,
  ChevronDown,
  Trash2,
  X
} from 'lucide-react';

export default function SalesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders');

  // Customer modal state
  const [isCustModalOpen, setIsCustModalOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // SO Creation modal state
  const [isSoModalOpen, setIsSoModalOpen] = useState(false);
  const [soCustomerId, setSoCustomerId] = useState('');
  const [soItems, setSoItems] = useState<Array<{ productId: string; quantity: number; unitPrice: number }>>([]);
  const [selectedProdId, setSelectedProdId] = useState('');
  const [selectedProdQty, setSelectedProdQty] = useState(1);
  const [selectedProdPrice, setSelectedProdPrice] = useState(0);

  // SO Shipping modal state
  const [shippingSoId, setShippingSoId] = useState<string | null>(null);
  const [shippingWarehouseId, setShippingWarehouseId] = useState('');

  const isSalesStaff = user?.role === 'ADMIN' || user?.role === 'SALES_STAFF' || user?.role === 'MANAGER';
  const isWarehouseStaff = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE_MANAGER' || user?.role === 'MANAGER' || user?.role === 'SALES_STAFF';

  // 1. Queries
  const { data: salesOrders, isLoading: isSoLoading } = useQuery({
    queryKey: ['salesOrders'],
    queryFn: async () => {
      const res = await api.get('/sales/orders');
      return res.data.data;
    }
  });

  const { data: customers, isLoading: isCustLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/sales/customers');
      return res.data.data;
    }
  });

  const { data: products } = useQuery({
    queryKey: ['allProductsSales'],
    queryFn: async () => {
      const res = await api.get('/products?limit=100');
      return res.data.data.products;
    }
  });

  const { data: warehouses } = useQuery({
    queryKey: ['allWarehousesSales'],
    queryFn: async () => {
      const res = await api.get('/warehouses');
      return res.data.data;
    }
  });

  // 2. Mutations
  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/sales/customers', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsCustModalOpen(false);
      setCustName('');
      setCustEmail('');
      setCustPhone('');
      setCustAddress('');
    }
  });

  const createSoMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/sales/orders', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      setIsSoModalOpen(false);
      setSoCustomerId('');
      setSoItems([]);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to create Sales Order.');
    }
  });

  const updateSoStatusMutation = useMutation({
    mutationFn: async (payload: { id: string; status: string }) => {
      const res = await api.patch(`/sales/orders/${payload.id}/status`, { status: payload.status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    }
  });

  const shipSoMutation = useMutation({
    mutationFn: async (payload: { id: string; warehouseId: string }) => {
      const res = await api.post(`/sales/orders/${payload.id}/ship`, { warehouseId: payload.warehouseId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      setShippingSoId(null);
      setShippingWarehouseId('');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to ship order. Check stock availability.');
    }
  });

  // 3. Actions
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    createCustomerMutation.mutate({
      name: custName,
      email: custEmail,
      phone: custPhone,
      address: custAddress
    });
  };

  const handleAddSoItem = () => {
    if (!selectedProdId) return;
    const exists = soItems.find(item => item.productId === selectedProdId);
    if (exists) {
      alert('Product already added to list.');
      return;
    }
    setSoItems([
      ...soItems,
      { productId: selectedProdId, quantity: selectedProdQty, unitPrice: selectedProdPrice }
    ]);
    setSelectedProdId('');
    setSelectedProdQty(1);
    setSelectedProdPrice(0);
  };

  const handleRemoveSoItem = (prodId: string) => {
    setSoItems(soItems.filter(item => item.productId !== prodId));
  };

  const handleCreateSoSubmit = () => {
    if (!soCustomerId) {
      alert('Please select a customer.');
      return;
    }
    if (soItems.length === 0) {
      alert('Please add at least one item.');
      return;
    }
    createSoMutation.mutate({
      customerId: soCustomerId,
      items: soItems
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    updateSoStatusMutation.mutate({ id, status });
  };

  const handleShipOrderSubmit = () => {
    if (!shippingSoId || !shippingWarehouseId) return;
    shipSoMutation.mutate({ id: shippingSoId, warehouseId: shippingWarehouseId });
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50">Sales & Customer Orders</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage client profiles, dispatch shipments, and issue sales orders.</p>
        </div>

        {isSalesStaff && (
          <div>
            {activeTab === 'orders' ? (
              <button
                onClick={() => setIsSoModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition cursor-pointer shadow-lg shadow-blue-500/20"
              >
                <Plus className="h-4 w-4" />
                New Sales Order
              </button>
            ) : (
              <button
                onClick={() => setIsCustModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                Add Customer
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
          Sales Orders
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'customers'
              ? 'border-blue-500 text-blue-400 font-bold'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Customer Directory
        </button>
      </div>

      {/* TAB CONTENT: SALES ORDERS */}
      {activeTab === 'orders' && (
        <>
          {isSoLoading ? (
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
                      <th className="p-4 uppercase tracking-wider">Customer</th>
                      <th className="p-4 uppercase tracking-wider text-right">Items Count</th>
                      <th className="p-4 uppercase tracking-wider text-right">Total Price</th>
                      <th className="p-4 uppercase tracking-wider text-center">Status</th>
                      <th className="p-4 uppercase tracking-wider text-right">Date Created</th>
                      <th className="p-4 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/80">
                    {salesOrders?.map((so: any) => (
                      <tr key={so.id} className="hover:bg-zinc-900/40 transition">
                        <td className="p-4 font-mono font-bold text-zinc-100">{so.soNumber}</td>
                        <td className="p-4 text-zinc-300">{so.customer.name}</td>
                        <td className="p-4 text-right font-medium text-zinc-400">{so.items.length} items</td>
                        <td className="p-4 text-right font-bold text-blue-400">${Number(so.totalAmount).toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                              so.status === 'SHIPPED'
                                ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-850/30'
                                : so.status === 'DELIVERED'
                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30'
                                : so.status === 'CANCELLED'
                                ? 'bg-red-950/40 text-red-400 border border-red-800/30'
                                : 'bg-yellow-950/40 text-yellow-400 border border-yellow-800/30'
                            }`}
                          >
                            {so.status}
                          </span>
                        </td>
                        <td className="p-4 text-right text-zinc-500">{new Date(so.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right space-x-2">
                          {/* Ship Action */}
                          {isWarehouseStaff && (so.status === 'PENDING' || so.status === 'PROCESSING') && (
                            <button
                              onClick={() => setShippingSoId(so.id)}
                              className="px-2.5 py-1 rounded bg-indigo-600/10 border border-indigo-500/25 hover:bg-indigo-600 text-indigo-400 hover:text-white text-[10px] font-bold transition flex items-center gap-1 inline-flex cursor-pointer"
                            >
                              <Truck className="h-3 w-3" />
                              Ship Goods
                            </button>
                          )}

                          {isSalesStaff && so.status === 'PENDING' && (
                            <button
                              onClick={() => handleStatusChange(so.id, 'PROCESSING')}
                              className="px-2 py-1 rounded bg-blue-600/10 border border-blue-500/25 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-bold transition cursor-pointer"
                            >
                              Process
                            </button>
                          )}

                          {isSalesStaff && so.status === 'SHIPPED' && (
                            <button
                              onClick={() => handleStatusChange(so.id, 'DELIVERED')}
                              className="px-2 py-1 rounded bg-emerald-600/10 border border-emerald-500/25 hover:bg-emerald-650 text-emerald-400 hover:text-white text-[10px] font-bold transition cursor-pointer"
                            >
                              Complete
                            </button>
                          )}

                          {so.status !== 'SHIPPED' && so.status !== 'DELIVERED' && so.status !== 'CANCELLED' && isSalesStaff && (
                            <button
                              onClick={() => handleStatusChange(so.id, 'CANCELLED')}
                              className="px-2 py-1 rounded bg-red-950/20 hover:bg-red-600 border border-red-800/20 text-red-400 hover:text-white text-[10px] font-bold transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {salesOrders?.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-zinc-500 text-xs">
                          No Sales Orders recorded. Fulfill client needs by clicking "New Sales Order".
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

      {/* TAB CONTENT: CUSTOMERS */}
      {activeTab === 'customers' && (
        <>
          {isCustLoading ? (
            <div className="flex h-[20vh] items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-800 border-t-blue-500"></div>
            </div>
          ) : (
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900/50 border-b border-zinc-850 text-zinc-400 font-semibold">
                      <th className="p-4 uppercase tracking-wider">Client Name</th>
                      <th className="p-4 uppercase tracking-wider">Email</th>
                      <th className="p-4 uppercase tracking-wider">Phone</th>
                      <th className="p-4 uppercase tracking-wider">Delivery Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/80">
                    {customers?.map((cust: any) => (
                      <tr key={cust.id} className="hover:bg-zinc-900/40 transition">
                        <td className="p-4 font-semibold text-zinc-100">{cust.name}</td>
                        <td className="p-4 text-zinc-300">{cust.email || 'N/A'}</td>
                        <td className="p-4 text-zinc-400">{cust.phone || 'N/A'}</td>
                        <td className="p-4 text-zinc-500 truncate max-w-[250px]" title={cust.address}>{cust.address || 'N/A'}</td>
                      </tr>
                    ))}
                    {customers?.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-zinc-500 text-xs">
                          No Customers configured. Setup customer directories first.
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

      {/* CREATE CUSTOMER MODAL */}
      {isCustModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel p-6 rounded-xl animate-fade-in relative">
            <button
              onClick={() => setIsCustModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Configure Customer
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Insert a new customer profile parameters into directory database.</p>

            <form onSubmit={handleCreateCustomer} className="space-y-4 mt-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corporate Solutions"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Email</label>
                  <input
                    type="email"
                    placeholder="sales@acme.com"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Phone</label>
                  <input
                    type="text"
                    placeholder="555-9000"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Delivery Address</label>
                <input
                  type="text"
                  placeholder="Street address, City, Country"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCustModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCustomerMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition"
                >
                  {createCustomerMutation.isPending ? 'Saving...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SALES ORDER MODAL */}
      {isSoModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl glass-panel p-6 rounded-xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsSoModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Create Sales Order
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Specify items, quantity and prices to issue draft SO to customers.</p>

            <div className="space-y-4 mt-5">
              {/* Select Customer */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Customer Client</label>
                <select
                  value={soCustomerId}
                  onChange={(e) => setSoCustomerId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                >
                  <option value="">Select a client...</option>
                  {customers?.map((cust: any) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name}
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
                      if (prod) setSelectedProdPrice(Number(prod.price));
                    }}
                    className="bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2 text-xs text-zinc-200"
                  >
                    <option value="">Select Product...</option>
                    {products?.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) - Stock: {p.quantity}
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
                    placeholder="Unit Price"
                    value={selectedProdPrice}
                    onChange={(e) => setSelectedProdPrice(parseFloat(e.target.value) || 0)}
                    className="bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2 text-xs text-zinc-200"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddSoItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-blue-400" /> Add to Order
                  </button>
                </div>
              </div>

              {/* Items List Table */}
              {soItems.length > 0 && (
                <div className="border border-zinc-900 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-900/40 border-b border-zinc-850 text-zinc-400">
                        <th className="p-3">Product Name</th>
                        <th className="p-3 text-right">Quantity</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Total Price</th>
                        <th className="p-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/60">
                      {soItems.map((item) => {
                        const prod = products?.find((p: any) => p.id === item.productId);
                        return (
                          <tr key={item.productId} className="text-zinc-300">
                            <td className="p-3">{prod?.name || 'Unknown'}</td>
                            <td className="p-3 text-right">{item.quantity}</td>
                            <td className="p-3 text-right">${item.unitPrice.toFixed(2)}</td>
                            <td className="p-3 text-right font-semibold text-zinc-200">
                              ${(item.quantity * item.unitPrice).toFixed(2)}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleRemoveSoItem(item.productId)}
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

              {/* Grand Total */}
              <div className="flex justify-between items-center py-2.5 border-t border-zinc-900">
                <span className="text-xs font-bold text-zinc-400">Grand Total Invoice:</span>
                <span className="text-lg font-black text-blue-400">
                  ${soItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSoModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateSoSubmit}
                  disabled={createSoMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition shadow-lg shadow-blue-500/10"
                >
                  {createSoMutation.isPending ? 'Submitting...' : 'Save & Issue SO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH/SHIP INVENTORY GOODS MODAL */}
      {shippingSoId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel p-6 rounded-xl animate-fade-in relative">
            <button
              onClick={() => setShippingSoId(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-indigo-400" />
              Ship Sales Order
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Select the physical warehouse location to fulfill items stock from.</p>

            <div className="space-y-4 mt-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Fulfillment Warehouse</label>
                <select
                  value={shippingWarehouseId}
                  onChange={(e) => setShippingWarehouseId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                >
                  <option value="">Select dispatch warehouse...</option>
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
                  onClick={() => setShippingSoId(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleShipOrderSubmit}
                  disabled={shipSoMutation.isPending || !shippingWarehouseId}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition disabled:opacity-50"
                >
                  {shipSoMutation.isPending ? 'Updating...' : 'Dispatch & Fulfill Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
