import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const SERVER_URL_KEY = 'server_url';
const SOCKET_URL_KEY = 'socket_url';

const defaults = {
  apiUrl: Constants.expoConfig?.extra?.apiUrl || 'http://138.2.177.115',
  socketUrl: Constants.expoConfig?.extra?.socketUrl || 'http://138.2.177.115',
};

let cachedApiUrl: string | null = null;
let cachedSocketUrl: string | null = null;

export async function loadServerConfig(): Promise<void> {
  try {
    const storedApi = await SecureStore.getItemAsync(SERVER_URL_KEY);
    const storedSocket = await SecureStore.getItemAsync(SOCKET_URL_KEY);
    cachedApiUrl = storedApi || defaults.apiUrl;
    cachedSocketUrl = storedSocket || defaults.socketUrl;
  } catch {
    cachedApiUrl = defaults.apiUrl;
    cachedSocketUrl = defaults.socketUrl;
  }
}

export function getApiUrl(): string {
  const base = cachedApiUrl || defaults.apiUrl;
  return base.endsWith('/api') ? base : `${base}/api`;
}

export function getSocketUrl(): string {
  return cachedSocketUrl || defaults.socketUrl;
}

export async function setServerUrls(apiUrl: string, socketUrl: string): Promise<void> {
  const trimmedApi = apiUrl.replace(/\/+$/, '');
  const trimmedSocket = socketUrl.replace(/\/+$/, '');
  await SecureStore.setItemAsync(SERVER_URL_KEY, trimmedApi);
  await SecureStore.setItemAsync(SOCKET_URL_KEY, trimmedSocket);
  cachedApiUrl = trimmedApi;
  cachedSocketUrl = trimmedSocket;
}

export async function clearServerConfig(): Promise<void> {
  await SecureStore.deleteItemAsync(SERVER_URL_KEY);
  await SecureStore.deleteItemAsync(SOCKET_URL_KEY);
  cachedApiUrl = defaults.apiUrl;
  cachedSocketUrl = defaults.socketUrl;
}

export function getDefaults() {
  return { ...defaults };
}
