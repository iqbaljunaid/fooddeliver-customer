import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useRestaurant, useMenu } from '../../../hooks/useRestaurants';
import { useCartStore } from '../../../stores/cartStore';
import MenuItemCard from '../../../components/MenuItemCard';
import type { MenuItem, MenuOptionGroup } from '../../../types';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: restaurant, isLoading: loadingRestaurant } = useRestaurant(id);
  const { data: categories, isLoading: loadingMenu } = useMenu(id);
  const { addItem, itemCount, subtotal, restaurantId: cartRestaurantId } = useCartStore();

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    { name: string; value: string; price: number }[]
  >([]);

  const handleAddToCart = useCallback(() => {
    if (!selectedItem || !restaurant) return;

    // Warn if different restaurant
    if (cartRestaurantId && cartRestaurantId !== id) {
      Alert.alert(
        'Replace cart?',
        'Your cart has items from another restaurant. Adding this will clear your current cart.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: () => {
              addItem(
                {
                  menuItemId: selectedItem.id,
                  name: selectedItem.name,
                  price: Number(selectedItem.price),
                  quantity,
                  options: selectedOptions,
                },
                id,
                restaurant.name,
              );
              setSelectedItem(null);
              setQuantity(1);
              setSelectedOptions([]);
            },
          },
        ],
      );
      return;
    }

    addItem(
      {
        menuItemId: selectedItem.id,
        name: selectedItem.name,
        price: Number(selectedItem.price),
        quantity,
        options: selectedOptions,
      },
      id,
      restaurant.name,
    );
    setSelectedItem(null);
    setQuantity(1);
    setSelectedOptions([]);
  }, [selectedItem, restaurant, id, quantity, selectedOptions, addItem, cartRestaurantId]);

  const toggleOption = (group: MenuOptionGroup, optionName: string, optionPrice: number) => {
    setSelectedOptions((prev) => {
      const existing = prev.find((o) => o.name === group.name);
      if (existing) {
        // Replace selection for this group
        return prev.map((o) =>
          o.name === group.name ? { name: group.name, value: optionName, price: optionPrice } : o,
        );
      }
      return [...prev, { name: group.name, value: optionName, price: optionPrice }];
    });
  };

  if (loadingRestaurant || loadingMenu) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#009DE0" />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.centered}>
        <Text>Restaurant not found</Text>
      </View>
    );
  }

  const sections = (categories || []).map((cat) => ({
    title: cat.name,
    data: cat.items || [],
  }));

  const count = itemCount();
  const total = subtotal();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {restaurant.name}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        {restaurant.imageUrl ? (
          <Image source={{ uri: restaurant.imageUrl }} style={styles.bannerImage} />
        ) : (
          <View style={[styles.bannerImage, styles.bannerPlaceholder]}>
            <Text style={styles.bannerPlaceholderText}>{restaurant.name[0]}</Text>
          </View>
        )}
        <View style={styles.bannerInfo}>
          <Text style={styles.name}>{restaurant.name}</Text>
          <Text style={styles.cuisine}>
            {restaurant.cuisineType?.join(' · ') || 'Restaurant'}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>⭐ {restaurant.rating != null ? Number(restaurant.rating).toFixed(1) : '—'}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{restaurant.estimatedDeliveryTime || 30} min</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>
              {Number(restaurant.deliveryFee) === 0 ? 'Free' : `$${Number(restaurant.deliveryFee).toFixed(2)}`} delivery
            </Text>
          </View>
        </View>
      </View>

      {/* Menu */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <MenuItemCard
            item={item}
            onPress={() => {
              setSelectedItem(item);
              setQuantity(1);
              setSelectedOptions([]);
            }}
          />
        )}
        contentContainerStyle={styles.menuList}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No menu items available</Text>
          </View>
        }
      />

      {/* Cart FAB */}
      {count > 0 && (
        <TouchableOpacity
          style={styles.cartFab}
          onPress={() => router.push('/(main)/cart')}
        >
          <Text style={styles.cartFabText}>
            View Cart ({count}) · ${total.toFixed(2)}
          </Text>
        </TouchableOpacity>
      )}

      {/* Item Modal */}
      <Modal
        visible={!!selectedItem}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header row with title and close button */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedItem?.name}</Text>
              <TouchableOpacity
                onPress={() => setSelectedItem(null)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedItem?.description ? (
              <Text style={styles.modalDesc}>{selectedItem.description}</Text>
            ) : null}
            <Text style={styles.modalPrice}>${Number(selectedItem?.price).toFixed(2)}</Text>

            {/* Options */}
            {selectedItem?.options?.map((group) => (
              <View key={group.id} style={styles.optionGroup}>
                <Text style={styles.optionGroupName}>
                  {group.name} {group.isRequired ? '(required)' : ''}
                </Text>
                {group.options.map((opt) => {
                  const isSelected = selectedOptions.some(
                    (s) => s.name === group.name && s.value === opt.name,
                  );
                  return (
                    <TouchableOpacity
                      key={opt.name}
                      style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                      onPress={() => toggleOption(group, opt.name, Number(opt.price))}
                    >
                      <Text style={styles.optionName}>{opt.name}</Text>
                      {Number(opt.price) > 0 && (
                        <Text style={styles.optionPrice}>+${Number(opt.price).toFixed(2)}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {/* Quantity */}
            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => q + 1)}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
              <Text style={styles.addButtonText}>
                Add to Cart · $
                {(
                  Number(selectedItem?.price || 0) +
                  selectedOptions.reduce((s, o) => s + o.price, 0)
                ).toFixed(2)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setSelectedItem(null)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  backBtn: { width: 40 },
  backText: { fontSize: 24, color: '#009DE0' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  banner: { backgroundColor: '#fff', paddingBottom: 16 },
  bannerImage: { width: '100%', height: 180 },
  bannerPlaceholder: { backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  bannerPlaceholderText: { fontSize: 64, color: '#9E9E9E', fontWeight: 'bold' },
  bannerInfo: { paddingHorizontal: 16, paddingTop: 12 },
  name: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  cuisine: { fontSize: 14, color: '#666', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaText: { fontSize: 13, color: '#333' },
  metaDot: { marginHorizontal: 6, color: '#CCC' },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  menuList: { paddingBottom: 100 },
  emptyText: { fontSize: 16, color: '#999' },
  cartFab: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: '#009DE0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cartFabText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', flex: 1, marginRight: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  modalCloseBtnText: { fontSize: 14, color: '#555', fontWeight: '600' },
  modalDesc: { fontSize: 14, color: '#666', marginTop: 4 },
  modalPrice: { fontSize: 18, fontWeight: '600', color: '#009DE0', marginTop: 8 },
  optionGroup: { marginTop: 16 },
  optionGroupName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 4,
  },
  optionRowSelected: { borderColor: '#009DE0', backgroundColor: '#F0F9FF' },
  optionName: { fontSize: 14, color: '#333' },
  optionPrice: { fontSize: 14, color: '#009DE0' },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  qtyText: { fontSize: 20, fontWeight: '600', marginHorizontal: 24 },
  addButton: {
    backgroundColor: '#009DE0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', marginTop: 12 },
  cancelText: { fontSize: 15, color: '#666' },
});
