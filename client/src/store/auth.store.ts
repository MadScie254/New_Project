import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: string;
  phone: string;
  name: string;
  photo_url?: string | null;
  national_id?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === 'true';
const bypassUser: User = {
  id: 'dev-user',
  phone: '254700000000',
  name: 'Dev User',
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: bypassAuth ? bypassUser : null,
  token: bypassAuth ? 'dev-bypass' : localStorage.getItem('chama_auth_token'),
  isAuthenticated: bypassAuth ? true : !!localStorage.getItem('chama_auth_token'),
  isLoading: !bypassAuth,

  login: (user, token) => {
    localStorage.setItem('chama_auth_token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('chama_auth_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    if (bypassAuth) {
      set({ user: bypassUser, token: 'dev-bypass', isAuthenticated: true, isLoading: false });
      return;
    }

    const token = get().token;
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const response = await api.get('/auth/me');
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('chama_auth_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (updates) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    }));
  },
}));
