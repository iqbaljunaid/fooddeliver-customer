import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../services/api';
import type { CreateOrderDto } from '../types';

export function useMyOrders(userId?: string) {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: () => ordersApi.getMyOrders(userId),
    enabled: !!userId,
    staleTime: 10000,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
    refetchInterval: 10000, // Polling fallback
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderDto) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
