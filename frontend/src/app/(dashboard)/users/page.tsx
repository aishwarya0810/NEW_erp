'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import {
  Users,
  Shield,
  ShieldCheck,
  UserCheck,
  Mail,
  ChevronDown,
  X,
  Edit2
} from 'lucide-react';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');

  // 1. Fetch Users
  const { data: users, isLoading } = useQuery({
    queryKey: ['usersList'],
    queryFn: async () => {
      const res = await api.get('/auth/users');
      return res.data.data;
    },
    enabled: currentUser?.role === 'ADMIN'
  });

  // 2. Fetch Roles
  const { data: roles } = useQuery({
    queryKey: ['rolesList'],
    queryFn: async () => {
      const res = await api.get('/auth/roles');
      return res.data.data;
    },
    enabled: currentUser?.role === 'ADMIN'
  });

  // 3. Update Role Mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (payload: { id: string; roleId: string }) => {
      const res = await api.patch(`/auth/users/${payload.id}/role`, { roleId: payload.roleId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      setSelectedUser(null);
      setSelectedRoleId('');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update user role.');
    }
  });

  const handleEditClick = (u: any) => {
    setSelectedUser(u);
    setSelectedRoleId(u.role.id);
  };

  const handleRoleSave = () => {
    if (!selectedUser || !selectedRoleId) return;
    updateRoleMutation.mutate({ id: selectedUser.id, roleId: selectedRoleId });
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="p-6 rounded-xl bg-red-950/20 border border-red-800/30 text-red-200">
        <h3 className="font-bold text-lg">Access Denied</h3>
        <p className="text-sm text-red-300 mt-1">This directory is restricted to System Administrators only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50 font-sans">User Management</h1>
        <p className="text-sm text-zinc-400 mt-1">Audit active system users and assign operational roles/privileges.</p>
      </div>

      {isLoading ? (
        <div className="flex h-[20vh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-800 border-t-blue-500"></div>
        </div>
      ) : (
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-900/50 border-b border-zinc-850 text-zinc-400 font-semibold">
                  <th className="p-4 uppercase tracking-wider">Staff Member</th>
                  <th className="p-4 uppercase tracking-wider">Email Address</th>
                  <th className="p-4 uppercase tracking-wider">Assigned Role</th>
                  <th className="p-4 uppercase tracking-wider text-center">Status</th>
                  <th className="p-4 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/80">
                {users?.map((u: any) => (
                  <tr key={u.id} className="hover:bg-zinc-900/40 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                          <Users className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-zinc-100">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-zinc-400 font-medium">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-zinc-500" />
                        {u.email}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          u.role.name === 'ADMIN'
                            ? 'bg-red-950/45 text-red-400 border border-red-800/30'
                            : u.role.name === 'MANAGER'
                            ? 'bg-blue-950/45 text-blue-400 border border-blue-800/30'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        {u.role.name}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/30">
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleEditClick(u)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-950/20 transition cursor-pointer"
                        title="Update role"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel p-6 rounded-xl animate-fade-in relative">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
              Adjust Permissions
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Assign a new structural role to user <span className="font-semibold text-zinc-300">{selectedUser.name}</span>.</p>

            <div className="space-y-4 mt-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">System Role</label>
                <div className="relative">
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:outline-none rounded-lg p-2.5 text-xs text-zinc-200 cursor-pointer appearance-none"
                  >
                    {roles?.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.name} - {r.description}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-3 h-4.5 w-4.5 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRoleSave}
                  disabled={updateRoleMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition disabled:opacity-50"
                >
                  {updateRoleMutation.isPending ? 'Updating...' : 'Update Staff Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
