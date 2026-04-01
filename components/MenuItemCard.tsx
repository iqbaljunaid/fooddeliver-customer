import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import type { MenuItem } from '../types';

interface Props {
  item: MenuItem;
  onPress: () => void;
}

export default function MenuItemCard({ item, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, !item.isAvailable && styles.unavailable]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!item.isAvailable}
    >
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        {!item.isAvailable && (
          <Text style={styles.unavailableText}>Unavailable</Text>
        )}
      </View>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  unavailable: {
    opacity: 0.5,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
  price: {
    fontSize: 15,
    fontWeight: '500',
    color: '#009DE0',
    marginTop: 8,
  },
  unavailableText: {
    fontSize: 12,
    color: '#E74C3C',
    marginTop: 4,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
});
