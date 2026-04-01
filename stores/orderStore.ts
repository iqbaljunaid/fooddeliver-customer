import { create } from 'zustand';
import type { OrderStatus } from '../types';

interface OrderState {
  activeOrderId: string | null;
  activeOrderStatus: OrderStatus | null;

  setActiveOrder: (id: string, status: OrderStatus) => void;
  updateStatus: (status: OrderStatus) => void;
  clearActiveOrder: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  activeOrderId: null,
  activeOrderStatus: null,

  setActiveOrder: (id, status) => set({ activeOrderId: id, activeOrderStatus: status }),
  updateStatus: (status) => set({ activeOrderStatus: status }),
  clearActiveOrder: () => set({ activeOrderId: null, activeOrderStatus: null }),
}));
