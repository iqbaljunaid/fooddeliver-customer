import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem } from '../types';

const CART_STORAGE_KEY = 'customer_cart';

let nextId = 1;
function generateId(): string {
  return `cart_${Date.now()}_${nextId++}`;
}

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;

  addItem: (item: Omit<CartItem, 'id'>, restaurantId: string, restaurantName: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  loadCart: () => Promise<void>;

  subtotal: () => number;
  itemCount: () => number;
}

function persistCart(state: { items: CartItem[]; restaurantId: string | null; restaurantName: string | null }) {
  AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state)).catch(() => {});
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  restaurantId: null,
  restaurantName: null,

  addItem: (item, restaurantId, restaurantName) => {
    const state = get();

    // Different restaurant — clear cart
    if (state.restaurantId && state.restaurantId !== restaurantId) {
      const newState = {
        items: [{ ...item, id: generateId() }],
        restaurantId,
        restaurantName,
      };
      set(newState);
      persistCart(newState);
      return;
    }

    // Check for existing same item + options combo
    const existingIndex = state.items.findIndex(
      (i) =>
        i.menuItemId === item.menuItemId &&
        JSON.stringify(i.options) === JSON.stringify(item.options),
    );

    let newItems: CartItem[];
    if (existingIndex > -1) {
      newItems = [...state.items];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + item.quantity,
      };
    } else {
      newItems = [...state.items, { ...item, id: generateId() }];
    }

    const newState = { items: newItems, restaurantId, restaurantName };
    set(newState);
    persistCart(newState);
  },

  removeItem: (id) => {
    const newItems = get().items.filter((i) => i.id !== id);
    const newState =
      newItems.length === 0
        ? { items: [], restaurantId: null, restaurantName: null }
        : { items: newItems, restaurantId: get().restaurantId, restaurantName: get().restaurantName };
    set(newState);
    persistCart(newState);
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    const newItems = get().items.map((i) => (i.id === id ? { ...i, quantity } : i));
    const newState = { items: newItems, restaurantId: get().restaurantId, restaurantName: get().restaurantName };
    set(newState);
    persistCart(newState);
  },

  clearCart: () => {
    const newState = { items: [], restaurantId: null, restaurantName: null };
    set(newState);
    persistCart(newState);
  },

  loadCart: async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({
          items: parsed.items || [],
          restaurantId: parsed.restaurantId || null,
          restaurantName: parsed.restaurantName || null,
        });
      }
    } catch {
      // Ignore parse errors
    }
  },

  subtotal: () => {
    return get().items.reduce((sum, item) => {
      const optionsTotal = item.options.reduce((s, o) => s + o.price, 0);
      return sum + (item.price + optionsTotal) * item.quantity;
    }, 0);
  },

  itemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
