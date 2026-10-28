'use client';

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1
          }
        }
      })
  );

  const { setAuth, user, clearAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (user) {
        try {
          // Attempt silently refreshing on load to populate the in-memory access token
          const res = await api.post('/auth/refresh');
          const { accessToken } = res.data.data;
          
          // Re-fetch profile to confirm validity
          const profileRes = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          setAuth(profileRes.data.data.user, accessToken);
        } catch (e) {
          console.error('Session restore failed, logging out', e);
          clearAuth();
        }
      }
      setIsInitializing(false);
    };

    initializeAuth();
  }, []);

  if (isInitializing) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500"></div>
          <span className="text-sm font-medium tracking-wide text-zinc-400">Initializing Stockpilot ERP...</span>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
