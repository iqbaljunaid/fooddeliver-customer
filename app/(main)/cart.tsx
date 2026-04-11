import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { useAddresses, useCreateAddress } from '../../hooks/useAddresses';
import { useCreateOrder } from '../../hooks/useOrders';
import { useRestaurant } from '../../hooks/useRestaurants';
import { useLocation } from '../../hooks/useLocation';
import { useOrderStore } from '../../stores/orderStore';
import CartItemComponent from '../../components/CartItem';
import AddressSelector from '../../components/AddressSelector';
import PaymentSelector from '../../components/PaymentSelector';
import type { PaymentMethod, Address, CreateAddressDto } from '../../types';

const TIPS = [0, 2, 3, 5];
const DELIVERY_FEE = 2.99;
const SERVICE_FEE_RATE = 0.05;
const TAX_RATE = 0.08;

export default function CartScreen() {
  const { items, restaurantName, restaurantId, updateQuantity, removeItem, clearCart, subtotal } =
    useCartStore();
  const { user } = useAuthStore();
  const { data: addresses, isLoading: loadingAddresses } = useAddresses();
  const { data: restaurant } = useRestaurant(restaurantId || '');
  const createAddress = useCreateAddress();
  const createOrder = useCreateOrder();
  const { setActiveOrder } = useOrderStore();
  const { getCurrentLocation } = useLocation();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [tip, setTip] = useState(0);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);

  // New address form
  const [newLabel, setNewLabel] = useState('home');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPostalCode, setNewPostalCode] = useState('');

  // Auto-select default address
  const defaultAddr = addresses?.find((a) => a.isDefault);
  const activeAddressId = selectedAddressId || defaultAddr?.id || null;

  const sub = subtotal();
  const serviceFee = sub * SERVICE_FEE_RATE;
  const tax = sub * TAX_RATE;
  const total = sub + DELIVERY_FEE + serviceFee + tax + tip;

  const handlePlaceOrder = async () => {
    if (!restaurantId || !activeAddressId || items.length === 0) {
      Alert.alert('Missing info', 'Please select a delivery address.');
      return;
    }

    const selectedAddress = addresses?.find((a) => a.id === activeAddressId);
    if (!selectedAddress) {
      Alert.alert('Missing info', 'Please select a delivery address.');
      return;
    }

    setIsPlacing(true);
    try {
      const pickupLat = restaurant?.latitude ?? 0;
      const pickupLon = restaurant?.longitude ?? 0;

      const order = await createOrder.mutateAsync({
        restaurantId,
        customerId: user!.id,
        deliveryAddressId: activeAddressId,
        pickupLat: pickupLat || undefined,
        pickupLon: pickupLon || undefined,
        dropoffLat: selectedAddress.latitude || undefined,
        dropoffLon: selectedAddress.longitude || undefined,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: parseFloat(String(item.price)),
          options: item.options.length > 0
            ? Object.fromEntries(item.options.map((o) => [o.name, o.value]))
            : undefined,
          specialInstructions: item.specialInstructions,
        })),
        tip,
        deliveryFee: DELIVERY_FEE,
        discount: 0,
        specialInstructions: specialInstructions || undefined,
        paymentMethod,
      } as any);

      setActiveOrder(order.id, 'PLACED');
      clearCart();
      router.push(`/(main)/order/${order.id}`);
    } catch (error: any) {
      const data = error.response?.data;
      const message = data?.message || data?.error || error.message || 'Failed to place order';
      const details = data?.details ? '\n' + JSON.stringify(data.details, null, 2) : '';
      Alert.alert('Order Failed', message + details);
    } finally {
      setIsPlacing(false);
    }
  };

  const handleAddNewAddress = async () => {
    if (!newStreet.trim() || !newCity.trim()) {
      Alert.alert('Error', 'Street and city are required.');
      return;
    }

    try {
      const loc = await getCurrentLocation();
      if (!loc) {
        Alert.alert('Location Required', 'Please enable location permissions to save a delivery address.');
        return;
      }

      const data: CreateAddressDto = {
        label: newLabel,
        street: newStreet.trim(),
        city: newCity.trim(),
        state: newState.trim() || 'N/A',
        postalCode: newPostalCode.trim() || '00000',
        lat: loc.lat,
        lng: loc.lng,
        isDefault: (addresses?.length || 0) === 0,
      };

      const addr = await createAddress.mutateAsync(data);
      setSelectedAddressId(addr.id);
      setShowAddAddress(false);
      setNewStreet('');
      setNewCity('');
      setNewState('');
      setNewPostalCode('');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to add address';
      Alert.alert('Error', message);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Browse restaurants and add items</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/(main)')}
          >
            <Text style={styles.browseButtonText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <Text style={styles.restaurantName}>{restaurantName}</Text>
        </View>

        {/* Cart Items */}
        <View style={styles.section}>
          {items.map((item) => (
            <CartItemComponent
              key={item.id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}
        </View>

        {/* Address */}
        <View style={styles.section}>
          {loadingAddresses ? (
            <ActivityIndicator size="small" color="#009DE0" />
          ) : (
            <AddressSelector
              addresses={addresses || []}
              selectedId={activeAddressId}
              onSelect={(addr) => setSelectedAddressId(addr.id)}
              onAddNew={() => setShowAddAddress(true)}
            />
          )}
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <PaymentSelector selected={paymentMethod} onSelect={setPaymentMethod} />
        </View>

        {/* Tip */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tip</Text>
          <View style={styles.tipRow}>
            {TIPS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tipBtn, tip === t && styles.tipBtnActive]}
                onPress={() => setTip(t)}
              >
                <Text style={[styles.tipText, tip === t && styles.tipTextActive]}>
                  {t === 0 ? 'No tip' : `$${t}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <TextInput
            style={styles.instructionsInput}
            placeholder="Any special requests for the restaurant?"
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>${sub.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Fee</Text>
            <Text style={styles.priceValue}>${DELIVERY_FEE.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service Fee (5%)</Text>
            <Text style={styles.priceValue}>${serviceFee.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tax (8%)</Text>
            <Text style={styles.priceValue}>${tax.toFixed(2)}</Text>
          </View>
          {tip > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tip</Text>
              <Text style={styles.priceValue}>${tip.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, isPlacing && styles.placeOrderBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={isPlacing}
        >
          {isPlacing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderText}>
              Place Order · ${total.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Add Address Modal */}
      <Modal
        visible={showAddAddress}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddAddress(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Address</Text>

            <Text style={styles.inputLabel}>Label</Text>
            <View style={styles.labelBtns}>
              {['home', 'work', 'other'].map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.labelBtn, newLabel === l && styles.labelBtnActive]}
                  onPress={() => setNewLabel(l)}
                >
                  <Text style={[styles.labelBtnText, newLabel === l && styles.labelBtnTextActive]}>
                    {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Street</Text>
            <TextInput
              style={styles.modalInput}
              value={newStreet}
              onChangeText={setNewStreet}
              placeholder="123 Main St"
            />

            <Text style={styles.inputLabel}>City</Text>
            <TextInput
              style={styles.modalInput}
              value={newCity}
              onChangeText={setNewCity}
              placeholder="City"
            />

            <Text style={styles.inputLabel}>State</Text>
            <TextInput
              style={styles.modalInput}
              value={newState}
              onChangeText={setNewState}
              placeholder="State"
            />

            <Text style={styles.inputLabel}>Postal Code</Text>
            <TextInput
              style={styles.modalInput}
              value={newPostalCode}
              onChangeText={setNewPostalCode}
              placeholder="00000"
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.saveAddrBtn} onPress={handleAddNewAddress}>
              <Text style={styles.saveAddrText}>
                {createAddress.isPending ? 'Saving...' : 'Save Address'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelAddrBtn}
              onPress={() => setShowAddAddress(false)}
            >
              <Text style={styles.cancelAddrText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  scroll: { flex: 1 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  emptySubtitle: { fontSize: 15, color: '#666', marginTop: 4 },
  browseButton: {
    backgroundColor: '#009DE0',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  browseButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  header: { padding: 16, backgroundColor: '#fff' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  restaurantName: { fontSize: 15, color: '#009DE0', marginTop: 2 },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  tipRow: { flexDirection: 'row', gap: 8 },
  tipBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  tipBtnActive: { borderColor: '#009DE0', backgroundColor: '#F0F9FF' },
  tipText: { fontSize: 14, color: '#666' },
  tipTextActive: { fontWeight: '600', color: '#009DE0' },
  instructionsInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 60,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  priceLabel: { fontSize: 14, color: '#666' },
  priceValue: { fontSize: 14, color: '#333' },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  totalValue: { fontSize: 17, fontWeight: '700', color: '#009DE0' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  placeOrderBtn: {
    backgroundColor: '#009DE0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderBtnDisabled: { backgroundColor: '#B0D9EF' },
  placeOrderText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 4, marginTop: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  labelBtns: { flexDirection: 'row', gap: 8 },
  labelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  labelBtnActive: { borderColor: '#009DE0', backgroundColor: '#F0F9FF' },
  labelBtnText: { fontSize: 14, color: '#666', textTransform: 'capitalize' },
  labelBtnTextActive: { color: '#009DE0', fontWeight: '600' },
  saveAddrBtn: {
    backgroundColor: '#009DE0',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveAddrText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelAddrBtn: { alignItems: 'center', marginTop: 12 },
  cancelAddrText: { color: '#666', fontSize: 15 },
});
