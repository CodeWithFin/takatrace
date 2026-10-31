import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  phone_number: string;
  balance: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User, token: string) => void;
  updateBalance: (balance: number) => void;
  logout: () => void;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setUser: (user, token) => {
    SecureStore.setItemAsync('auth_token', token);
    SecureStore.setItemAsync('auth_user', JSON.stringify(user));
    set({ user, token });
  },

  updateBalance: (balance) =>
    set((state) => ({
      user: state.user ? { ...state.user, balance } : null,
    })),

  logout: () => {
    SecureStore.deleteItemAsync('auth_token');
    SecureStore.deleteItemAsync('auth_user');
    set({ user: null, token: null });
  },

  loadSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userStr = await SecureStore.getItemAsync('auth_user');
      if (token && userStr) {
        set({ user: JSON.parse(userStr), token });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
