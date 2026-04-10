import * as SecureStore from 'expo-secure-store';
import {
  loadServerConfig,
  getApiUrl,
  getSocketUrl,
  setServerUrls,
  clearServerConfig,
  getDefaults,
} from './serverConfig';

describe('serverConfig', () => {
  beforeEach(async () => {
    // Reset SecureStore mocks to return null
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    // Reset module-level cache to defaults
    await clearServerConfig();
  });

  describe('getDefaults', () => {
    it('should return default apiUrl and socketUrl from Constants', () => {
      const defaults = getDefaults();

      expect(defaults).toHaveProperty('apiUrl');
      expect(defaults).toHaveProperty('socketUrl');
      expect(defaults.apiUrl).toBe('http://localhost:3000');
      expect(defaults.socketUrl).toBe('http://localhost:3000');
    });
  });

  describe('loadServerConfig', () => {
    it('should use stored URLs from SecureStore when available', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'server_url') return Promise.resolve('http://custom-api.com');
        if (key === 'socket_url') return Promise.resolve('http://custom-socket.com');
        return Promise.resolve(null);
      });

      await loadServerConfig();

      expect(getApiUrl()).toBe('http://custom-api.com/api');
      expect(getSocketUrl()).toBe('http://custom-socket.com');
    });

    it('should fall back to defaults when SecureStore returns null', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      await loadServerConfig();

      const defaults = getDefaults();
      expect(getApiUrl()).toBe(`${defaults.apiUrl}/api`);
      expect(getSocketUrl()).toBe(defaults.socketUrl);
    });

    it('should fall back to defaults when SecureStore throws an error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
        new Error('SecureStore unavailable'),
      );

      await expect(loadServerConfig()).resolves.toBeUndefined();

      const defaults = getDefaults();
      expect(getApiUrl()).toBe(`${defaults.apiUrl}/api`);
    });
  });

  describe('getApiUrl', () => {
    it('should append /api to the base URL', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'server_url') return Promise.resolve('http://myserver.com');
        return Promise.resolve(null);
      });
      await loadServerConfig();

      expect(getApiUrl()).toBe('http://myserver.com/api');
    });

    it('should not double-append /api if URL already ends with /api', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'server_url') return Promise.resolve('http://myserver.com/api');
        return Promise.resolve(null);
      });
      await loadServerConfig();

      expect(getApiUrl()).toBe('http://myserver.com/api');
    });

    it('should use updated URL after setServerUrls', async () => {
      await setServerUrls('http://new-server.com', 'http://new-socket.com');

      expect(getApiUrl()).toBe('http://new-server.com/api');
    });
  });

  describe('getSocketUrl', () => {
    it('should return cached socket URL', async () => {
      await setServerUrls('http://api.com', 'http://socket.com');

      expect(getSocketUrl()).toBe('http://socket.com');
    });

    it('should return default socket URL after clearing config', async () => {
      await setServerUrls('http://custom.com', 'http://custom-socket.com');
      await clearServerConfig();

      expect(getSocketUrl()).toBe(getDefaults().socketUrl);
    });
  });

  describe('setServerUrls', () => {
    it('should save URLs to SecureStore with trailing slashes stripped', async () => {
      await setServerUrls('http://api.example.com/', 'http://socket.example.com/');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'server_url',
        'http://api.example.com',
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'socket_url',
        'http://socket.example.com',
      );
    });

    it('should strip multiple trailing slashes', async () => {
      await setServerUrls('http://api.com///', 'http://socket.com///');

      expect(getApiUrl()).toBe('http://api.com/api');
      expect(getSocketUrl()).toBe('http://socket.com');
    });

    it('should update cached URLs immediately', async () => {
      await setServerUrls('http://newapi.com', 'http://newsocket.com');

      expect(getApiUrl()).toBe('http://newapi.com/api');
      expect(getSocketUrl()).toBe('http://newsocket.com');
    });
  });

  describe('clearServerConfig', () => {
    it('should delete SecureStore entries', async () => {
      await setServerUrls('http://custom.com', 'http://custom-socket.com');
      jest.clearAllMocks();

      await clearServerConfig();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('server_url');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('socket_url');
    });

    it('should reset URLs to defaults after clearing', async () => {
      await setServerUrls('http://custom.com', 'http://custom-socket.com');
      await clearServerConfig();

      const defaults = getDefaults();
      expect(getSocketUrl()).toBe(defaults.socketUrl);
      expect(getApiUrl()).toBe(`${defaults.apiUrl}/api`);
    });
  });
});
