import { useOrderStore } from './orderStore';
import type { OrderStatus } from '../types';

describe('useOrderStore', () => {
  beforeEach(() => {
    useOrderStore.setState({
      activeOrderId: null,
      activeOrderStatus: null,
    });
  });

  describe('setActiveOrder', () => {
    it('should set activeOrderId and activeOrderStatus', () => {
      useOrderStore.getState().setActiveOrder('order-123', 'PLACED');

      const state = useOrderStore.getState();
      expect(state.activeOrderId).toBe('order-123');
      expect(state.activeOrderStatus).toBe('PLACED');
    });

    it('should override previously set order', () => {
      useOrderStore.getState().setActiveOrder('order-001', 'PLACED');
      useOrderStore.getState().setActiveOrder('order-002', 'ACCEPTED');

      const state = useOrderStore.getState();
      expect(state.activeOrderId).toBe('order-002');
      expect(state.activeOrderStatus).toBe('ACCEPTED');
    });
  });

  describe('updateStatus', () => {
    it('should update the order status', () => {
      useOrderStore.setState({ activeOrderId: 'order-123', activeOrderStatus: 'PLACED' });

      useOrderStore.getState().updateStatus('ACCEPTED');

      expect(useOrderStore.getState().activeOrderStatus).toBe('ACCEPTED');
    });

    it('should update through all status values', () => {
      const statuses: OrderStatus[] = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED'];

      for (const status of statuses) {
        useOrderStore.getState().updateStatus(status);
        expect(useOrderStore.getState().activeOrderStatus).toBe(status);
      }
    });
  });

  describe('clearActiveOrder', () => {
    it('should reset activeOrderId and activeOrderStatus to null', () => {
      useOrderStore.setState({ activeOrderId: 'order-123', activeOrderStatus: 'PREPARING' });

      useOrderStore.getState().clearActiveOrder();

      const state = useOrderStore.getState();
      expect(state.activeOrderId).toBeNull();
      expect(state.activeOrderStatus).toBeNull();
    });

    it('should be a no-op when already cleared', () => {
      useOrderStore.getState().clearActiveOrder();

      expect(useOrderStore.getState().activeOrderId).toBeNull();
      expect(useOrderStore.getState().activeOrderStatus).toBeNull();
    });
  });
});
