import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { getApiUrl } from './serverConfig';
import type {
  LoginResponse,
  Restaurant,
  MenuCategory,
  Order,
  CreateOrderDto,
  Address,
  CreateAddressDto,
  User,
} from '../types';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Auth failure callback
let onAuthFailure: (() => void) | null = null;
export function setOnAuthFailure(callback: () => void) {
  onAuthFailure = callback;
}

// Create axios instance
const api: AxiosInstance = axios.create({
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject dynamic base URL
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL = getApiUrl();
  return config;
});

// Token management
export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

// Request interceptor - add auth token (skip for auth endpoints)
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const requestUrl = config.url || '';
    const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => requestUrl.includes(ep));
    if (!isAuthEndpoint) {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest?.url || '';
    const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => requestUrl.includes(ep));

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          await clearTokens();
          onAuthFailure?.();
          processQueue(new Error('Session expired'));
          return Promise.reject(error);
        }

        const response = await axios.post(`${getApiUrl()}/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        await setTokens(accessToken, newRefreshToken);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);
        await clearTokens();
        onAuthFailure?.();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ---- Auth API ----
export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  registerCustomer: async (data: {
    email: string;
    password: string;
    name: string;
    phone: string;
    street?: string;
    apartment?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  }): Promise<LoginResponse> => {
    const response = await api.post('/auth/register/customer', data);
    return response.data;
  },

  refreshTokens: async () => {
    const refreshToken = await getRefreshToken();
    const response = await axios.post(`${getApiUrl()}/auth/refresh`, null, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// ---- Restaurants API ----
export const restaurantsApi = {
  getAll: async (params?: {
    cuisine?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }): Promise<Restaurant[]> => {
    const response = await api.get('/restaurants', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Restaurant> => {
    const response = await api.get(`/restaurants/${id}`);
    return response.data;
  },

  getMenu: async (restaurantId: string): Promise<MenuCategory[]> => {
    const response = await api.get(`/restaurants/${restaurantId}/menu`);
    return response.data;
  },
};

// ---- Orders API ----
export const ordersApi = {
  create: async (data: CreateOrderDto & {
    pickupLat: number; pickupLon: number;
    dropoffLat: number; dropoffLon: number;
  }): Promise<Order> => {
    const response = await api.post('/orders', {
      restaurant_id: data.restaurantId,
      customer_id: data.customerId,
      delivery_address_id: data.deliveryAddressId,
      pickup_lat: data.pickupLat,
      pickup_lon: data.pickupLon,
      dropoff_lat: data.dropoffLat,
      dropoff_lon: data.dropoffLon,
      items: data.items.map((item) => ({
        menu_item_id: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        options: item.options ? [item.options] : undefined,
        special_instructions: item.specialInstructions,
      })),
      tip: data.tip,
      delivery_fee: data.deliveryFee,
      discount: data.discount,
      special_instructions: data.specialInstructions,
      payment_method: data.paymentMethod.toLowerCase(),
    });
    return response.data;
  },

  getMyOrders: async (userId?: string): Promise<Order[]> => {
    const params = userId ? { customer_id: userId } : {};
    const response = await api.get('/orders', { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
};

// ---- Addresses API ----
export const addressesApi = {
  getAll: async (): Promise<Address[]> => {
    const response = await api.get('/addresses');
    return response.data;
  },

  create: async (data: CreateAddressDto): Promise<Address> => {
    const response = await api.post('/addresses', {
      label: data.label,
      street: data.street,
      apartment: data.apartment,
      city: data.city,
      state: data.state,
      postal_code: data.postalCode,
      latitude: data.lat,
      longitude: data.lng,
      instructions: data.instructions,
      is_default: data.isDefault,
    });
    return response.data;
  },

  update: async (id: string, data: Partial<CreateAddressDto>): Promise<Address> => {
    const response = await api.patch(`/addresses/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/addresses/${id}`);
  },
};

// ---- Payments API ----
export const paymentsApi = {
  process: async (data: {
    orderId: string;
    amount: number;
    paymentMethod: string;
  }) => {
    const response = await api.post('/payments/process', data);
    return response.data;
  },
};

// ---- Profile API ----
export const profileApi = {
  get: async (): Promise<User> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  update: async (data: { name?: string; phone?: string }): Promise<User> => {
    const response = await api.patch('/users/me', data);
    return response.data;
  },
};

export default api;
