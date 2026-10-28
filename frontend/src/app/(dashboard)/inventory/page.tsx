'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Boxes,
  Search,
  Filter,
  Plus,
  Trash2,
  AlertTriangle,
  FolderOpen,
  PlusCircle,
  X
} from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  sku: z.string().min(3, 'SKU must be at least 3 characters.'),
  barcode: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive.'),
  cost: z.coerce.number().min(0, 'Cost must be positive.'),
  reorderLevel: z.coerce.number().min(0, 'Reorder level must be positive.'),
  categoryId: z.string().min(1, 'Please select a category.')
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isStaff = user?.role === 'ADMIN' || user?.role === 'INVENTORY_STAFF';

  // 1. Fetch Products
  const { data: productsResult, isLoading } = useQuery({
    queryKey: ['products', searchTerm, selectedCategory],
    queryFn: async () => {
      const categoryFilter = selectedCategory ? `&categoryId=${selectedCategory}` : '';
      const searchFilter = searchTerm ? `&search=${searchTerm}` : '';
      const res = await api.get(`/products?limit=100${categoryFilter}${searchFilter}`);
      return res.data.data;
    }
  });

  // 2. Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/products/categories');
      return res.data.data;
    }
  });

  // 3. Create Product Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any
  });

  // 4. Create Product Mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const res = await api.post('/products', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Product creation failed.');
    }
  });

  // 5. Create Category Mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await api.post('/products/categories', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCatModalOpen(false);
      setNewCatName('');
      setNewCatDesc('');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Category creation failed.');
    }
  });

  // 6. Delete Product Mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  const onSubmitProduct = (data: ProductFormValues) => {
    setErrorMsg(null);
    createProductMutation.mutate(data);
  };

  const onSubmitCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    createCategoryMutation.mutate({ name: newCatName, description: newCatDesc });
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50">Inventory Directory</h1>
          <p className="text-sm text-zinc-400 mt-1">Configure products, categories, reorder warnings, and catalog details.</p>
        </div>
        {isStaff && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsCatModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-xs font-semibold tracking-wide transition cursor-pointer"
            >
              <FolderOpen className="h-4 w-4 text-purple-400" />
              Add Category
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition cursor-pointer shadow-lg shadow-blue-500/20"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        )}
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-950/20 p-4 rounded-xl border border-zinc-900">
        {/* Search */}
        <div className="relative glow-effect">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by SKU, product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none text-zinc-200 placeholder-zinc-500 text-xs"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-3 pr-8 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none text-zinc-200 text-xs appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories?.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      {isLoading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-800 border-t-blue-500"></div>
            <span className="text-xs text-zinc-500">Loading catalog...</span>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-900/50 border-b border-zinc-850 text-zinc-400 font-semibold">
                  <th className="p-4 uppercase tracking-wider">Product Info</th>
                  <th className="p-4 uppercase tracking-wider">SKU</th>
                  <th className="p-4 uppercase tracking-wider">Category</th>
                  <th className="p-4 uppercase tracking-wider text-right">Cost Price</th>
                  <th className="p-4 uppercase tracking-wider text-right">Sell Price</th>
                  <th className="p-4 uppercase tracking-wider text-center">Global Stock</th>
                  <th className="p-4 uppercase tracking-wider text-center">Status</th>
                  {isStaff && <th className="p-4 uppercase tracking-wider text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/80">
                {productsResult?.products.map((p: any) => {
                  const isLowStock = p.quantity <= p.reorderLevel;
                  return (
                    <tr key={p.id} className="hover:bg-zinc-900/40 transition">
                      <td className="p-4">
                        <div className="font-semibold text-zinc-100">{p.name}</div>
                        {p.barcode && <div className="text-[10px] text-zinc-500 mt-0.5">Barcode: {p.barcode}</div>}
                      </td>
                      <td className="p-4 font-mono text-zinc-300">{p.sku}</td>
                      <td className="p-4 text-zinc-400">{p.category.name}</td>
                      <td className="p-4 text-right text-zinc-300">${Number(p.cost).toFixed(2)}</td>
                      <td className="p-4 text-right font-semibold text-blue-400">${Number(p.price).toFixed(2)}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-bold text-zinc-200">
                          {isLowStock && (
                            <span title="Low stock warning">
                              <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
                            </span>
                          )}
                          <span className={isLowStock ? 'text-yellow-400' : 'text-zinc-200'}>{p.quantity}</span>
                          <span className="text-[10px] text-zinc-500 font-normal">/ min {p.reorderLevel}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/30">
                          {p.status}
                        </span>
                      </td>
                      {isStaff && (
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            disabled={deleteProductMutation.isPending}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {productsResult?.products.length === 0 && (
                  <tr>
                    <td colSpan={isStaff ? 8 : 7} className="p-8 text-center text-zinc-500 text-xs">
                      No products found. Add a new product to populate the catalogue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel p-6 rounded-xl animate-fade-in relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Boxes className="h-5 w-5 text-blue-400" />
              Add Product
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Insert a new item metadata parameters into global system catalogue.</p>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-200 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmitProduct)} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Server Console Cable"
                  {...register('name')}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                />
                {errors.name && <p className="text-[10px] text-red-400 font-semibold">{errors.name.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">SKU</label>
                <input
                  type="text"
                  placeholder="e.g. IT-CBL-09"
                  {...register('sku')}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200 font-mono"
                />
                {errors.sku && <p className="text-[10px] text-red-400 font-semibold">{errors.sku.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Barcode</label>
                <input
                  type="text"
                  placeholder="UPC/EAN string"
                  {...register('barcode')}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Cost Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('cost')}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                />
                {errors.cost && <p className="text-[10px] text-red-400 font-semibold">{errors.cost.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Sell Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('price')}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                />
                {errors.price && <p className="text-[10px] text-red-400 font-semibold">{errors.price.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Category</label>
                <select
                  {...register('categoryId')}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                >
                  <option value="">Select category...</option>
                  {categories?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-[10px] text-red-400 font-semibold">{errors.categoryId.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Reorder Threshold Alert</label>
                <input
                  type="number"
                  placeholder="10"
                  {...register('reorderLevel')}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                />
                {errors.reorderLevel && <p className="text-[10px] text-red-400 font-semibold">{errors.reorderLevel.message}</p>}
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProductMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition shadow-lg shadow-blue-500/10"
                >
                  {createProductMutation.isPending ? 'Saving...' : 'Add Catalog Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel p-6 rounded-xl animate-fade-in relative">
            <button
              onClick={() => setIsCatModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-purple-400" />
              Add Category
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Configure custom categorization groupings for inventory items.</p>

            <form onSubmit={onSubmitCategory} className="space-y-4 mt-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Raw Materials"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Raw metallic components and parts"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition"
                >
                  {createCategoryMutation.isPending ? 'Saving...' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
