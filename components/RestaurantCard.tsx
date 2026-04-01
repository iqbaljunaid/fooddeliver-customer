import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import type { Restaurant } from '../types';

interface Props {
  restaurant: Restaurant;
  onPress: () => void;
}

export default function RestaurantCard({ restaurant, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {restaurant.imageUrl ? (
        <Image source={{ uri: restaurant.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>{restaurant.name[0]}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {restaurant.name}
        </Text>
        <Text style={styles.cuisine} numberOfLines={1}>
          {restaurant.cuisineType?.join(' · ') || 'Restaurant'}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.rating}>⭐ {restaurant.rating != null ? Number(restaurant.rating).toFixed(1) : '—'}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.time}>{restaurant.estimatedDeliveryTime || 30} min</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.fee}>
            {Number(restaurant.deliveryFee) === 0 ? 'Free delivery' : `$${Number(restaurant.deliveryFee).toFixed(2)} delivery`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 160,
  },
  placeholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#9E9E9E',
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  cuisine: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  rating: {
    fontSize: 13,
    color: '#333',
  },
  dot: {
    marginHorizontal: 6,
    color: '#CCC',
  },
  time: {
    fontSize: 13,
    color: '#333',
  },
  fee: {
    fontSize: 13,
    color: '#333',
  },
});
