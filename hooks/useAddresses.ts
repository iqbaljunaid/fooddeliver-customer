import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressesApi } from '../services/api';
import type { CreateAddressDto } from '../types';

export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.getAll(),
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAddressDto) => addressesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => addressesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}
