import { useQuery } from '@tanstack/react-query';
import { restaurantsApi } from '../services/api';

export function useRestaurants(params?: {
  cuisine?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}) {
  return useQuery({
    queryKey: ['restaurants', params],
    queryFn: () => restaurantsApi.getAll(params),
    staleTime: 60000,
  });
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => restaurantsApi.getById(id),
    enabled: !!id,
  });
}

export function useMenu(restaurantId: string) {
  return useQuery({
    queryKey: ['menu', restaurantId],
    queryFn: () => restaurantsApi.getMenu(restaurantId),
    enabled: !!restaurantId,
  });
}
