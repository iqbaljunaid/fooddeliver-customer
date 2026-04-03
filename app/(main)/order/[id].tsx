import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useOrder } from '../../../hooks/useOrders';
import { useOrderSocket } from '../../../hooks/useOrderSocket';
import OrderStatusBar from '../../../components/OrderStatusBar';
import OSMMapView, { MapMarker, MapPolyline } from '../../../components/OSMMapView';
import type { OrderStatus } from '../../../types';

const SHOW_MAP_STATUSES = ['ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP'];

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id);
  const {
    orderStatus: socketStatus,
    driverInfo,
    driverLocation,
    estimatedDeliveryTime,
  } = useOrderSocket(id);

  const currentStatus = (socketStatus || order?.status || 'PLACED').toUpperCase();
  const eta = estimatedDeliveryTime || order?.estimatedDeliveryTime;

  const etaText = useMemo(() => {
    if (!eta) return null;
    const diff = new Date(eta).getTime() - Date.now();
    if (diff <= 0) return 'Arriving soon';
    const mins = Math.ceil(diff / 60000);
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `~${h}h ${m}m`;
    }
    return `~${mins} min`;
  }, [eta]);

  // Build map markers
  const markers = useMemo<MapMarker[]>(() => {
    const m: MapMarker[] = [];

    // Restaurant marker
    if (order?.restaurant?.location?.coordinates) {
      const [lng, lat] = order.restaurant.location.coordinates;
      m.push({
        id: 'restaurant',
        latitude: lat,
        longitude: lng,
        title: order.restaurant.name,
        color: '#E74C3C',
      });
    }

    // Delivery address marker
    if (order?.deliveryAddress?.location?.coordinates) {
      const [lng, lat] = order.deliveryAddress.location.coordinates;
      m.push({
        id: 'delivery',
        latitude: lat,
        longitude: lng,
        title: 'Delivery Address',
        color: '#2196F3',
      });
    }

    // Driver marker
    if (driverLocation) {
      m.push({
        id: 'driver',
        latitude: driverLocation.lat,
        longitude: driverLocation.lng,
        title: driverInfo?.driverName || 'Driver',
        color: '#4CAF50',
      });
    }

    return m;
  }, [order, driverLocation, driverInfo]);

  // Map region
  const mapRegion = useMemo(() => {
    if (markers.length === 0) return undefined;
    const lats = markers.map((m) => m.latitude);
    const lngs = markers.map((m) => m.longitude);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const latDelta = Math.max(Math.max(...lats) - Math.min(...lats), 0.01) * 1.5;
    const lngDelta = Math.max(Math.max(...lngs) - Math.min(...lngs), 0.01) * 1.5;
    return { latitude: centerLat, longitude: centerLng, latitudeDelta: latDelta, longitudeDelta: lngDelta };
  }, [markers]);

  // Route polyline
  const polylines = useMemo<MapPolyline[]>(() => {
    if (markers.length < 2) return [];
    return [{
      coordinates: markers.map((m) => ({ latitude: m.latitude, longitude: m.longitude })),
      color: '#009DE0',
      width: 3,
      dashed: currentStatus !== 'PICKED_UP',
    }];
  }, [markers, currentStatus]);

  if (isLoading && !order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#009DE0" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text>Order not found</Text>
      </View>
    );
  }

  const showMap = SHOW_MAP_STATUSES.includes(currentStatus);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.orderNumber}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll}>
        {/* Map */}
        {showMap && mapRegion && (
          <View style={styles.mapContainer}>
            <OSMMapView
              style={styles.map}
              region={mapRegion}
              markers={markers}
              polylines={polylines}
            />
          </View>
        )}

        {/* Status Bar */}
        <View style={styles.section}>
          <OrderStatusBar currentStatus={currentStatus} />
          {etaText && (
            <Text style={styles.etaText}>Estimated delivery: {etaText}</Text>
          )}
        </View>

        {/* Driver Info */}
        {driverInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Driver</Text>
            <View style={styles.driverCard}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverAvatarText}>
                  {driverInfo.driverName?.[0] || '?'}
                </Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{driverInfo.driverName}</Text>
                <Text style={styles.driverVehicle}>
                  {[driverInfo.vehicleColor, driverInfo.vehicleMake, driverInfo.vehicleType]
                    .filter(Boolean)
                    .join(' ')}
                </Text>
                {driverInfo.licensePlate && (
                  <Text style={styles.driverPlate}>{driverInfo.licensePlate}</Text>
                )}
              </View>
            </View>
            <View style={styles.contactRow}>
              {driverInfo.driverPhone && (
                <>
                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => Linking.openURL(`tel:${driverInfo.driverPhone}`)}
                  >
                    <Text style={styles.contactBtnText}>📞 Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.contactBtn, styles.contactBtnSecondary]}
                    onPress={() => Linking.openURL(`sms:${driverInfo.driverPhone}`)}
                  >
                    <Text style={styles.contactBtnTextSecondary}>💬 Message</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <Text style={styles.restaurantLabel}>
            {order.restaurant?.name || 'Restaurant'}
          </Text>
          {order.items?.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>${parseFloat(String(item.subtotal ?? 0)).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${parseFloat(String(order.total ?? 0)).toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backBtn: { width: 40 },
  backText: { fontSize: 24, color: '#009DE0' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  scroll: { flex: 1 },
  mapContainer: { height: 250, backgroundColor: '#E0E0E0' },
  map: { flex: 1 },
  section: { backgroundColor: '#fff', marginTop: 8, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  etaText: { textAlign: 'center', fontSize: 15, color: '#009DE0', fontWeight: '600', marginTop: 4 },
  driverCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#009DE0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverAvatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  driverVehicle: { fontSize: 13, color: '#666', marginTop: 2 },
  driverPlate: {
    fontSize: 12,
    color: '#009DE0',
    fontWeight: '600',
    marginTop: 2,
  },
  contactRow: { flexDirection: 'row', gap: 12 },
  contactBtn: {
    flex: 1,
    backgroundColor: '#009DE0',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  contactBtnSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#009DE0',
  },
  contactBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  contactBtnTextSecondary: { color: '#009DE0', fontSize: 15, fontWeight: '500' },
  restaurantLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemQty: { width: 30, fontSize: 14, color: '#666' },
  itemName: { flex: 1, fontSize: 14, color: '#333' },
  itemPrice: { fontSize: 14, color: '#333' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#009DE0' },
});
