import { create } from 'zustand';
import { AuthUser } from '../services/auth';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    isLoading: false,
  }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => set({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));