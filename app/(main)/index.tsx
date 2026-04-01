import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRestaurants } from '../../hooks/useRestaurants';
import RestaurantCard from '../../components/RestaurantCard';

const CUISINES = ['All', 'Pizza', 'Burger', 'Indian', 'Chinese', 'Thai', 'Sushi', 'Mexican'];

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');

  const params = selectedCuisine !== 'All' ? { cuisine: selectedCuisine } : undefined;
  const { data: restaurants, isLoading, refetch, isRefetching } = useRestaurants(params);

  const filtered = (restaurants || []).filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Food Rush</Text>
        <Text style={styles.subtitle}>What would you like to eat?</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants..."
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
      </View>

      <FlatList
        horizontal
        data={CUISINES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cuisineList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.cuisineChip,
              selectedCuisine === item && styles.cuisineChipActive,
            ]}
            onPress={() => setSelectedCuisine(item)}
          >
            <Text
              style={[
                styles.cuisineText,
                selectedCuisine === item && styles.cuisineTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#009DE0" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              onPress={() => router.push(`/(main)/restaurant/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No restaurants found</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cuisineList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  cuisineChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cuisineChipActive: {
    backgroundColor: '#009DE0',
    borderColor: '#009DE0',
  },
  cuisineText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  cuisineTextActive: {
    color: '#fff',
  },
  list: {
    paddingTop: 4,
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
