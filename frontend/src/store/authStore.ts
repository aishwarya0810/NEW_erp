import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  activeWarehouseId: string | null;
  setAuth: (user: User | null, accessToken: string | null) => void;
  setActiveWarehouse: (warehouseId: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      activeWarehouseId: null,
      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: !!accessToken }),
      setActiveWarehouse: (activeWarehouseId) => set({ activeWarehouseId }),
      clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false, activeWarehouseId: null })
    }),
    {
      name: 'stockpilot-auth',
      partialize: (state) => ({
        user: state.user,
        activeWarehouseId: state.activeWarehouseId
        // In-memory access token is NOT persisted to local storage for security,
        // it will be re-fetched on app load using the HttpOnly refresh token cookie.
      })
    }
  )
);
