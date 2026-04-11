import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { CartItem as CartItemType } from '../types';

interface Props {
  item: CartItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: Props) {
  const optionsTotal = item.options.reduce((sum, o) => sum + o.price, 0);
  const itemTotal = (item.price + optionsTotal) * item.quantity;

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {item.options.length > 0 && (
          <Text style={styles.options}>
            {item.options.map((o) => o.value || o.name).join(', ')}
          </Text>
        )}
        {item.specialInstructions ? (
          <Text style={styles.instructions}>{item.specialInstructions}</Text>
        ) : null}
      </View>
      <View style={styles.right}>
        <Text style={styles.price}>€{itemTotal.toFixed(2)}</Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() =>
              item.quantity === 1
                ? onRemove(item.id)
                : onUpdateQuantity(item.id, item.quantity - 1)
            }
          >
            <Text style={styles.qtyBtnText}>{item.quantity === 1 ? '🗑' : '−'}</Text>
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  options: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  instructions: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
    color: '#1A1A1A',
  },
});
