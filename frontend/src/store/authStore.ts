import { create } from 'zustand';
import type { User } from '@/types/auth';
import * as authApi from '@/api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: async (email, password) => {
    const user = await authApi.login(email, password);
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    authApi.logout();
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: true });
  },
}));
