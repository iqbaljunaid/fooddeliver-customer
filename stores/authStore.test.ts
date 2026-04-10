import { useAuthStore } from './authStore';
import * as SecureStore from 'expo-secure-store';

jest.mock('../services/api', () => ({
  authApi: {
    login: jest.fn(),
    registerCustomer: jest.fn(),
    getMe: jest.fn(),
  },
  setTokens: jest.fn(() => Promise.resolve()),
  clearTokens: jest.fn(() => Promise.resolve()),
  getAccessToken: jest.fn(() => Promise.resolve(null)),
  setOnAuthFailure: jest.fn(),
}));

const { authApi, setTokens, clearTokens, getAccessToken } = require('../services/api');

const mockCustomer = {
  id: 'u1',
  email: 'customer@test.com',
  name: 'Test Customer',
  phone: '555-0000',
  role: 'customer' as const,
  isEmailVerified: true,
  isPhoneVerified: false,
  createdAt: new Date().toISOString(),
};

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
    });
  });

  describe('login', () => {
    it('should login successfully as a customer', async () => {
      authApi.login.mockResolvedValue({
        user: mockCustomer,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      await useAuthStore.getState().login('customer@test.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockCustomer);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
    });

    it('should reject non-customer users', async () => {
      authApi.login.mockResolvedValue({
        user: { ...mockCustomer, role: 'driver' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await expect(
        useAuthStore.getState().login('driver@test.com', 'pass'),
      ).rejects.toThrow('This app is for customers only.');

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should set error on API failure', async () => {
      authApi.login.mockRejectedValue({ message: 'Invalid credentials' });

      await expect(
        useAuthStore.getState().login('bad@test.com', 'wrong'),
      ).rejects.toBeTruthy();

      const state = useAuthStore.getState();
      expect(state.error).toBeTruthy();
      expect(state.isLoading).toBe(false);
    });

    it('should use error from response data when available', async () => {
      authApi.login.mockRejectedValue({
        response: { data: { message: 'Account not found' } },
      });

      await expect(
        useAuthStore.getState().login('notfound@test.com', 'pass'),
      ).rejects.toBeTruthy();

      expect(useAuthStore.getState().error).toBe('Account not found');
    });

    it('should persist user data to SecureStore', async () => {
      authApi.login.mockResolvedValue({
        user: mockCustomer,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      await useAuthStore.getState().login('customer@test.com', 'password123');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'user_data',
        JSON.stringify(mockCustomer),
      );
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      authApi.registerCustomer.mockResolvedValue({
        user: mockCustomer,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      await useAuthStore.getState().register({
        email: 'new@test.com',
        password: 'password123',
        name: 'New User',
        phone: '555-1234',
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockCustomer);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
    });

    it('should set error on registration failure', async () => {
      authApi.registerCustomer.mockRejectedValue({ message: 'Email already exists' });

      await expect(
        useAuthStore.getState().register({
          email: 'existing@test.com',
          password: 'pass',
          name: 'User',
          phone: '555-0000',
        }),
      ).rejects.toBeTruthy();

      const state = useAuthStore.getState();
      expect(state.error).toBeTruthy();
      expect(state.isLoading).toBe(false);
    });

    it('should use error from response data on registration failure', async () => {
      authApi.registerCustomer.mockRejectedValue({
        response: { data: { message: 'Email already in use' } },
      });

      await expect(
        useAuthStore.getState().register({
          email: 'taken@test.com',
          password: 'pass',
          name: 'User',
          phone: '555-0000',
        }),
      ).rejects.toBeTruthy();

      expect(useAuthStore.getState().error).toBe('Email already in use');
    });
  });

  describe('logout', () => {
    it('should clear all state and tokens', async () => {
      useAuthStore.setState({
        user: mockCustomer,
        isAuthenticated: true,
      });

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(clearTokens).toHaveBeenCalled();
    });

    it('should delete user data from SecureStore', async () => {
      useAuthStore.setState({ user: mockCustomer, isAuthenticated: true });

      await useAuthStore.getState().logout();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user_data');
    });

    it('should still clear state even when clearTokens throws', async () => {
      clearTokens.mockRejectedValueOnce(new Error('SecureStore error'));
      useAuthStore.setState({ user: mockCustomer, isAuthenticated: true });

      await useAuthStore.getState().logout();

      // Should still clear state via finally block
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('loadStoredAuth', () => {
    it('should restore user from SecureStore when token exists', async () => {
      getAccessToken.mockResolvedValue('stored-access-token');
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'user_data') return Promise.resolve(JSON.stringify(mockCustomer));
        return Promise.resolve(null);
      });
      authApi.getMe.mockResolvedValue({ user: mockCustomer });

      await useAuthStore.getState().loadStoredAuth();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockCustomer);
      expect(state.isLoading).toBe(false);
    });

    it('should not authenticate when no token exists', async () => {
      getAccessToken.mockResolvedValue(null);

      await useAuthStore.getState().loadStoredAuth();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should clear tokens and set unauthenticated when token exists but no user data', async () => {
      getAccessToken.mockResolvedValue('stored-token');
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      await useAuthStore.getState().loadStoredAuth();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(clearTokens).toHaveBeenCalled();
    });

    it('should handle errors during loadStoredAuth gracefully', async () => {
      getAccessToken.mockRejectedValue(new Error('SecureStore read failed'));

      await useAuthStore.getState().loadStoredAuth();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should update user data in background after restore', async () => {
      const freshUser = { ...mockCustomer, name: 'Updated Name' };
      getAccessToken.mockResolvedValue('stored-token');
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'user_data') return Promise.resolve(JSON.stringify(mockCustomer));
        return Promise.resolve(null);
      });
      authApi.getMe.mockResolvedValue({ user: freshUser });

      await useAuthStore.getState().loadStoredAuth();

      // User should be updated with fresh data
      expect(useAuthStore.getState().user).toEqual(freshUser);
    });

    it('should still be authenticated when background refresh fails', async () => {
      getAccessToken.mockResolvedValue('stored-token');
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'user_data') return Promise.resolve(JSON.stringify(mockCustomer));
        return Promise.resolve(null);
      });
      authApi.getMe.mockRejectedValue(new Error('Network error'));

      await useAuthStore.getState().loadStoredAuth();

      // Should still be authenticated even if refresh fails
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
  });

  describe('clearError', () => {
    it('should clear the error field', () => {
      useAuthStore.setState({ error: 'Some error' });

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should merge partial user data into existing user', () => {
      useAuthStore.setState({ user: mockCustomer });

      useAuthStore.getState().updateUser({ name: 'New Name' });

      expect(useAuthStore.getState().user?.name).toBe('New Name');
      expect(useAuthStore.getState().user?.email).toBe(mockCustomer.email);
    });

    it('should do nothing when user is null', () => {
      useAuthStore.setState({ user: null });

      expect(() => useAuthStore.getState().updateUser({ name: 'New Name' })).not.toThrow();

      expect(useAuthStore.getState().user).toBeNull();
    });

    it('should persist updated user to SecureStore', async () => {
      useAuthStore.setState({ user: mockCustomer });

      useAuthStore.getState().updateUser({ name: 'Updated' });

      await new Promise((r) => setTimeout(r, 10));
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'user_data',
        expect.stringContaining('Updated'),
      );
    });
  });
});
