import { useEffect, useRef, useState, useCallback } from 'react';
import { orderSocketService, OrderSocketHandlers } from '../services/socket';
import { useAuthStore } from '../stores/authStore';
import { useOrderStore } from '../stores/orderStore';
import type { OrderStatus, DriverInfo } from '../types';

interface UseOrderSocketReturn {
  orderStatus: OrderStatus | null;
  driverInfo: DriverInfo | null;
  driverLocation: { lat: number; lng: number } | null;
  estimatedDeliveryTime: string | null;
  isConnected: boolean;
}

export function useOrderSocket(orderId: string | null): UseOrderSocketReturn {
  const { isAuthenticated } = useAuthStore();
  const { updateStatus } = useOrderStore();

  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handlersRef = useRef<OrderSocketHandlers>({});

  useEffect(() => {
    handlersRef.current = {
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onOrderStatus: (data) => {
        setOrderStatus(data.status);
        if (data.estimatedDeliveryTime) {
          setEstimatedDeliveryTime(data.estimatedDeliveryTime);
        }
        updateStatus(data.status);
      },
      onDriverAssigned: (driver) => {
        setDriverInfo(driver);
      },
      onDriverLocation: (location) => {
        setDriverLocation(location);
      },
      onSyncResponse: (data) => {
        if (data.order) {
          setOrderStatus(data.order.status);
          if (data.order.estimatedDeliveryTime) {
            setEstimatedDeliveryTime(data.order.estimatedDeliveryTime);
          }
        }
        if (data.driverInfo) setDriverInfo(data.driverInfo);
        if (data.driverLocation) setDriverLocation(data.driverLocation);
      },
    };
  });

  useEffect(() => {
    if (!isAuthenticated || !orderId) return;

    orderSocketService.connect({
      onConnect: () => handlersRef.current.onConnect?.(),
      onDisconnect: (reason) => handlersRef.current.onDisconnect?.(reason),
      onOrderStatus: (data) => handlersRef.current.onOrderStatus?.(data),
      onDriverAssigned: (driver) => handlersRef.current.onDriverAssigned?.(driver),
      onDriverLocation: (loc) => handlersRef.current.onDriverLocation?.(loc),
      onSyncResponse: (data) => handlersRef.current.onSyncResponse?.(data),
    }).then(() => {
      orderSocketService.subscribeToOrder(orderId);
    });

    return () => {
      orderSocketService.unsubscribeFromOrder(orderId);
      orderSocketService.disconnect();
    };
  }, [isAuthenticated, orderId]);

  return {
    orderStatus,
    driverInfo,
    driverLocation,
    estimatedDeliveryTime,
    isConnected,
  };
}
