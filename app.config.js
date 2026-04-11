export default ({ config }) => ({
  ...config,
  name: process.env.APP_NAME || 'Food Rush Customer',
  slug: 'food-rush-customer',
  version: '1.0.1',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'foodrush-customer',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0069BE',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.foodrush.customer',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'We need your location to find nearby restaurants and set your delivery address.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#009DE0',
    },
    package: 'com.foodrush.customer',
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
    ],
  },
  plugins: [
    'expo-router',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Allow Food Rush to use your location to find nearby restaurants.',
      },
    ],
    [
      'expo-secure-store',
      {
        faceIDPermission: 'Allow Food Rush to access your Face ID for secure authentication.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: 'fa00f28a-8b8b-4326-be9e-7e212d9704ab',
    },
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://138.2.177.115',
    socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL || 'http://138.2.177.115',
  },
});
