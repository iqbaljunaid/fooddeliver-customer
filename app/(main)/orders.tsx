import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMyOrders } from '../../hooks/useOrders';
import { useAuthStore } from '../../stores/authStore';

const STATUS_COLORS: Record<string, string> = {
  placed:    '#2196F3',
  accepted:  '#4CAF50',
  preparing: '#FF9800',
  ready:     '#9C27B0',
  picked_up: '#00BCD4',
  delivered: '#4CAF50',
  cancelled: '#F44336',
  rejected:  '#F44336',
  // uppercase aliases for forward-compat
  PLACED:    '#2196F3',
  ACCEPTED:  '#4CAF50',
  PREPARING: '#FF9800',
  READY:     '#9C27B0',
  PICKED_UP: '#00BCD4',
  DELIVERED: '#4CAF50',
  CANCELLED: '#F44336',
  REJECTED:  '#F44336',
};

function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? STATUS_COLORS[status.toUpperCase()] ?? '#999';
}

export default function OrdersScreen() {
  const { user } = useAuthStore();
  const { data: orders, isLoading, refetch, isRefetching } = useMyOrders(user?.id);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#009DE0" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <FlatList
        data={orders || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() => router.push(`/(main)/order/${item.id}`)}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColor(item.status) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: statusColor(item.status) },
                  ]}
                >
                  {item.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <Text style={styles.restaurantName}>
              {item.restaurant?.name || 'Restaurant'}
            </Text>
            <View style={styles.orderFooter}>
              <Text style={styles.date}>
                {new Date(item.placedAt).toLocaleDateString()}
              </Text>
              <Text style={styles.total}>€{parseFloat(String(item.total ?? 0)).toFixed(2)}</Text>
            </View>
            <Text style={styles.itemCount}>
              {item.items?.length || 0} item{(item.items?.length || 0) !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>Your order history will appear here</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  header: { padding: 16, backgroundColor: '#fff' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  list: { paddingTop: 8, paddingBottom: 20 },
  orderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  restaurantName: { fontSize: 14, color: '#666', marginTop: 6 },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  date: { fontSize: 13, color: '#999' },
  total: { fontSize: 16, fontWeight: '600', color: '#009DE0' },
  itemCount: { fontSize: 13, color: '#999', marginTop: 4 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptySubtitle: { fontSize: 14, color: '#999', marginTop: 4 },
});
