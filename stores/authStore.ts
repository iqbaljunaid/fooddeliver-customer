import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi, setTokens, clearTokens, getAccessToken, setOnAuthFailure } from '../services/api';
import type { User, LoginResponse } from '../types';

const USER_KEY = 'user_data';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone: string;
    street?: string;
    apartment?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const response: LoginResponse = await authApi.login(email, password);

      if (response.user.role !== 'customer') {
        throw new Error('This app is for customers only.');
      }

      await setTokens(response.accessToken, response.refreshToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const response: LoginResponse = await authApi.registerCustomer(data);

      await setTokens(response.accessToken, response.refreshToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });

    try {
      await clearTokens();
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  loadStoredAuth: async () => {
    set({ isLoading: true });

    try {
      const token = await getAccessToken();

      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const userJson = await SecureStore.getItemAsync(USER_KEY);

      if (userJson) {
        const user = JSON.parse(userJson);

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });

        try {
          const freshData = await authApi.getMe();
          set({ user: freshData.user || freshData });
        } catch {
          console.warn('Failed to refresh user data');
        }
      } else {
        await clearTokens();
        set({ isLoading: false, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),

  updateUser: (userUpdate: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userUpdate };
      set({ user: updatedUser });
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
    }
  },
}));

// Register auth failure callback
setOnAuthFailure(() => {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
});
