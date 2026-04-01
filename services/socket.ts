import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';
import { getSocketUrl } from './serverConfig';
import type { OrderStatus, DriverInfo } from '../types';

export type OrderSocketHandlers = {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onOrderStatus?: (data: { status: OrderStatus; estimatedDeliveryTime?: string }) => void;
  onDriverAssigned?: (driver: DriverInfo) => void;
  onDriverLocation?: (location: { lat: number; lng: number }) => void;
  onSyncResponse?: (data: {
    order: { status: OrderStatus; estimatedDeliveryTime?: string };
    driverLocation?: { lat: number; lng: number };
    driverInfo?: DriverInfo;
  }) => void;
};

class OrderSocketService {
  private socket: Socket | null = null;
  private handlers: OrderSocketHandlers = {};
  private subscribedOrderId: string | null = null;

  async connect(handlers: OrderSocketHandlers = {}): Promise<void> {
    this.handlers = handlers;
    const token = await getAccessToken();

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(`${getSocketUrl()}/orders`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[OrderSocket] Connected');
      this.handlers.onConnect?.();
      // Re-subscribe after reconnect
      if (this.subscribedOrderId) {
        this.subscribeToOrder(this.subscribedOrderId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[OrderSocket] Disconnected:', reason);
      this.handlers.onDisconnect?.(reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[OrderSocket] Connection error:', error.message);
    });

    this.socket.on('order:status', (data) => {
      console.log('[OrderSocket] Status update:', data);
      this.handlers.onOrderStatus?.(data);
    });

    this.socket.on('driver:assigned', (data) => {
      console.log('[OrderSocket] Driver assigned:', data);
      this.handlers.onDriverAssigned?.(data);
    });

    this.socket.on('driver:location', (data) => {
      this.handlers.onDriverLocation?.(data);
    });

    this.socket.on('sync:response', (data) => {
      console.log('[OrderSocket] Sync response:', data);
      this.handlers.onSyncResponse?.(data);
    });
  }

  subscribeToOrder(orderId: string): void {
    this.subscribedOrderId = orderId;
    if (!this.socket?.connected) return;
    this.socket.emit('subscribe:order', { orderId });
    this.socket.emit('sync:request', { orderId });
  }

  unsubscribeFromOrder(orderId: string): void {
    if (this.subscribedOrderId === orderId) {
      this.subscribedOrderId = null;
    }
    if (!this.socket?.connected) return;
    this.socket.emit('unsubscribe:order', { orderId });
  }

  disconnect(): void {
    this.subscribedOrderId = null;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.handlers = {};
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const orderSocketService = new OrderSocketService();
