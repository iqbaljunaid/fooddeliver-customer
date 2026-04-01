import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import type { Address } from '../types';

interface Props {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (address: Address) => void;
  onAddNew: () => void;
}

export default function AddressSelector({ addresses, selectedId, onSelect, onAddNew }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Address</Text>
      {addresses.map((addr) => (
        <TouchableOpacity
          key={addr.id}
          style={[
            styles.addressCard,
            selectedId === addr.id && styles.addressSelected,
          ]}
          onPress={() => onSelect(addr)}
        >
          <View style={styles.labelRow}>
            <Text style={styles.labelBadge}>{addr.label}</Text>
            {addr.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
          </View>
          <Text style={styles.street} numberOfLines={1}>
            {addr.street}
            {addr.apartment ? `, ${addr.apartment}` : ''}
          </Text>
          <Text style={styles.city} numberOfLines={1}>
            {addr.city}, {addr.state} {addr.postalCode}
          </Text>
          {addr.instructions ? (
            <Text style={styles.instructions} numberOfLines={1}>
              📝 {addr.instructions}
            </Text>
          ) : null}
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.addBtn} onPress={onAddNew}>
        <Text style={styles.addBtnText}>+ Add New Address</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  addressCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  addressSelected: {
    borderColor: '#009DE0',
    backgroundColor: '#F0F9FF',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  labelBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#009DE0',
    textTransform: 'capitalize',
  },
  defaultBadge: {
    fontSize: 11,
    color: '#fff',
    backgroundColor: '#009DE0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    overflow: 'hidden',
  },
  street: {
    fontSize: 15,
    color: '#333',
  },
  city: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  instructions: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  addBtn: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#009DE0',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#009DE0',
  },
});
