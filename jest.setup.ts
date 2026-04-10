// Jest setup for React Native customer app

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('SafeAreaView', props, children);
  },
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock expo-secure-store with in-memory store
const secureStoreData: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string) => Promise.resolve(secureStoreData[key] ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    secureStoreData[key] = value;
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    delete secureStoreData[key];
    return Promise.resolve();
  }),
}));

// Mock @react-native-async-storage/async-storage
const asyncStorageData: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(asyncStorageData[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    asyncStorageData[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete asyncStorageData[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(asyncStorageData).forEach((key) => delete asyncStorageData[key]);
    return Promise.resolve();
  }),
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        apiUrl: 'http://localhost:3000',
        socketUrl: 'http://localhost:3000',
      },
    },
  },
  expoConfig: {
    extra: {
      apiUrl: 'http://localhost:3000',
      socketUrl: 'http://localhost:3000',
    },
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
  Link: ({ children }: any) => children,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
}));

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
    removeAllListeners: jest.fn(),
    connected: false,
  })),
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' }),
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: { latitude: 37.7749, longitude: -122.4194, accuracy: 5 },
    }),
  ),
  Accuracy: { High: 4 },
}));
