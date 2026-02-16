import { create } from 'zustand';
import { api } from '@/lib/api';
import type { User, LoginRequest, LoginResponse } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  refreshAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: async (email: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    } as LoginRequest);

    const { access_token, refresh_token, user } = response.data;

    // Store tokens
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);

    // Set axios default header
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

    set({
      user,
      token: access_token,
      isAuthenticated: true,
    });
  },

  logout: () => {
    // Clear tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // Clear axios header
    delete api.defaults.headers.common['Authorization'];

    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  setUser: (user: User) => {
    set({ user });
  },

  refreshAuth: async () => {
    try {
      const response = await api.get<{ user: User }>('/auth/me');
      set({ user: response.data.user });
    } catch (error) {
      // If refresh fails, logout
      useAuthStore.getState().logout();
      throw error;
    }
  },
}));
