import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { loadServerConfig } from '../services/serverConfig';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    },
  },
});

function RootLayoutNav() {
  const { isLoading, loadStoredAuth } = useAuthStore();
  const { loadCart } = useCartStore();
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    loadServerConfig().then(() => {
      setConfigLoaded(true);
      loadStoredAuth();
      loadCart();
    });
  }, [loadStoredAuth, loadCart]);

  useEffect(() => {
    if (!__DEV__) {
      Updates.checkForUpdateAsync()
        .then(({ isAvailable }) => {
          if (isAvailable) {
            return Updates.fetchUpdateAsync().then(() => {
              Alert.alert(
                'Update Available',
                'A new version has been downloaded. Restart to apply.',
                [
                  { text: 'Later', style: 'cancel' },
                  { text: 'Restart', onPress: () => Updates.reloadAsync() },
                ]
              );
            });
          }
        })
        .catch(() => {
          // silently ignore update check failures
        });
    }
  }, []);

  if (!configLoaded || isLoading) {
    return null;
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
