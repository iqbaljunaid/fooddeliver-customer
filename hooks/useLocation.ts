import { useState, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import type { LocationUpdate } from '../types';

interface UseLocationReturn {
  location: LocationUpdate | null;
  error: string | null;
  isLoading: boolean;
  hasPermission: boolean | null;
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<LocationUpdate | null>;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setHasPermission(false);
        setError('Location permission denied.');
        return false;
      }

      setHasPermission(true);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request location permission';
      setError(message);
      setHasPermission(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<LocationUpdate | null> => {
    try {
      setIsLoading(true);
      setError(null);

      if (hasPermission !== true) {
        const granted = await requestPermission();
        if (!granted) return null;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationUpdate: LocationUpdate = {
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy ?? undefined,
        timestamp: new Date(currentLocation.timestamp),
      };

      setLocation(locationUpdate);
      return locationUpdate;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, requestPermission]);

  return {
    location,
    error,
    isLoading,
    hasPermission,
    requestPermission,
    getCurrentLocation,
  };
}
