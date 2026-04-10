import { useCartStore } from './cartStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('useCartStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCartStore.setState({
      items: [],
      restaurantId: null,
      restaurantName: null,
    });
  });

  describe('addItem', () => {
    it('should add a new item to an empty cart', () => {
      useCartStore.getState().addItem(
        {
          menuItemId: 'm1',
          name: 'Burger',
          price: 10,
          quantity: 1,
          options: [],
        },
        'r1',
        'Test Restaurant',
      );

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].name).toBe('Burger');
      expect(state.restaurantId).toBe('r1');
      expect(state.restaurantName).toBe('Test Restaurant');
    });

    it('should increment quantity when same item with same options is added', () => {
      const item = {
        menuItemId: 'm1',
        name: 'Burger',
        price: 10,
        quantity: 1,
        options: [{ name: 'Size', value: 'Large', price: 2 }],
      };

      useCartStore.getState().addItem(item, 'r1', 'Test Restaurant');
      useCartStore.getState().addItem(item, 'r1', 'Test Restaurant');

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(2);
    });

    it('should add as separate item when options differ', () => {
      useCartStore.getState().addItem(
        {
          menuItemId: 'm1',
          name: 'Burger',
          price: 10,
          quantity: 1,
          options: [{ name: 'Size', value: 'Small', price: 0 }],
        },
        'r1',
        'Test Restaurant',
      );

      useCartStore.getState().addItem(
        {
          menuItemId: 'm1',
          name: 'Burger',
          price: 10,
          quantity: 1,
          options: [{ name: 'Size', value: 'Large', price: 2 }],
        },
        'r1',
        'Test Restaurant',
      );

      expect(useCartStore.getState().items).toHaveLength(2);
    });

    it('should clear cart when adding item from different restaurant', () => {
      useCartStore.getState().addItem(
        {
          menuItemId: 'm1',
          name: 'Burger',
          price: 10,
          quantity: 1,
          options: [],
        },
        'r1',
        'Restaurant One',
      );

      // Add item from different restaurant
      useCartStore.getState().addItem(
        {
          menuItemId: 'm2',
          name: 'Pizza',
          price: 15,
          quantity: 1,
          options: [],
        },
        'r2',
        'Restaurant Two',
      );

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].name).toBe('Pizza');
      expect(state.restaurantId).toBe('r2');
      expect(state.restaurantName).toBe('Restaurant Two');
    });

    it('should persist cart to AsyncStorage when adding item', () => {
      useCartStore.getState().addItem(
        {
          menuItemId: 'm1',
          name: 'Burger',
          price: 10,
          quantity: 1,
          options: [],
        },
        'r1',
        'Test Restaurant',
      );

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'customer_cart',
        expect.stringContaining('Burger'),
      );
    });

    it('should generate a unique id for each cart item', () => {
      useCartStore.getState().addItem(
        { menuItemId: 'm1', name: 'Burger', price: 10, quantity: 1, options: [] },
        'r1',
        'Test Restaurant',
      );
      useCartStore.getState().addItem(
        { menuItemId: 'm2', name: 'Fries', price: 5, quantity: 1, options: [] },
        'r1',
        'Test Restaurant',
      );

      const [item1, item2] = useCartStore.getState().items;
      expect(item1.id).toBeDefined();
      expect(item2.id).toBeDefined();
      expect(item1.id).not.toBe(item2.id);
    });
  });

  describe('removeItem', () => {
    it('should remove an item by id', () => {
      useCartStore.getState().addItem(
        { menuItemId: 'm1', name: 'Burger', price: 10, quantity: 1, options: [] },
        'r1',
        'Test Restaurant',
      );
      useCartStore.getState().addItem(
        { menuItemId: 'm2', name: 'Fries', price: 5, quantity: 1, options: [] },
        'r1',
        'Test Restaurant',
      );

      const [item1] = useCartStore.getState().items;
      useCartStore.getState().removeItem(item1.id);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].name).toBe('Fries');
    });

    it('should clear restaurantId and restaurantName when last item is removed', () => {
      useCartStore.getState().addItem(
        { menuItemId: 'm1', name: 'Burger', price: 10, quantity: 1, options: [] },
        'r1',
        'Test Restaurant',
      );

      const [item] = useCartStore.getState().items;
      useCartStore.getState().removeItem(item.id);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.restaurantId).toBeNull();
      expect(state.restaurantName).toBeNull();
    });

    it('should persist updated cart to AsyncStorage', () => {
      useCartStore.getState().addItem(
        { menuItemId: 'm1', name: 'Burger', price: 10, quantity: 1, options: [] },
        'r1',
        'Test Restaurant',
      );

      const [item] = useCartStore.getState().items;
      jest.clearAllMocks();
      useCartStore.getState().removeItem(item.id);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('updateQuantity', () => {
    it('should update the quantity of an item', () => {
      useCartStore.getState().addItem(
        { menuItemId: 'm1', name: 'Burger', price: 10, quantity: 1, options: [] },
        'r1',
        'Test Restaurant',
      );

      const [item] = useCartStore.getState().items;
      useCartStore.getState().updateQuantity(item.id, 3);

      expect(useCartStore.getState().items[0].quantity).toBe(3);
    });

    it('should remove item when quantity is set to 0', () => {
      useCartStore.getState().addItem(
        { menuItemId: 'm1', name: 'Burger', price: 10, quantity: 1, options: [] },
        'r1',
        'Test Restaurant',
      );

      const [item] = useCartStore.getState().items;
      useCartStore.getState().updateQuantity(item.id, 0);

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should remove item when quantity is negative', () => {
      useCartStore.getState().addItem(
        { menuItemId: 'm1', name: 'Burger', price: 10, quantity: 2, options: [] },
        'r1',
        'Test Restaurant',
      );

      const [item] = useCartStore.getState().items;
      useCartStore.getState().updateQuantity(item.id, -1);

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should persist updated cart to AsyncStorage', () => {
      useCartStore.getState().addItem(
        { menuItemId: 'm1', name: 'Burger', price: 10, quantity: 1, options: [] },
        'r1',
        'Test Restaurant',
      );

      const [item] = useCartStore.getState().items;
      jest.clearAllMocks();
      useCartStore.getState().updateQuantity(item.id, 2);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('clearCart', () => {
    it('should clear all items and restaurant info', () => {
      useCartStore.getState().addItem(
        { menuItemId: 'm1', name: 'Burger', price: 10, quantity: 1, options: [] },
        'r1',
        'Test Restaurant',
      );

      useCartStore.getState().clearCart();

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.restaurantId).toBeNull();
      expect(state.restaurantName).toBeNull();
    });

    it('should persist the cleared state to AsyncStorage', () => {
      useCartStore.getState().clearCart();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'customer_cart',
        expect.stringContaining('[]'),
      );
    });
  });

  describe('loadCart', () => {
    it('should load cart from AsyncStorage on initialization', async () => {
      const storedCart = {
        items: [
          {
            id: 'cart_123',
            menuItemId: 'm1',
            name: 'Burger',
            price: 10,
            quantity: 2,
            options: [],
          },
        ],
        restaurantId: 'r1',
        restaurantName: 'Stored Restaurant',
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedCart));

      await useCartStore.getState().loadCart();

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].name).toBe('Burger');
      expect(state.restaurantId).toBe('r1');
    });

    it('should handle empty AsyncStorage gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await useCartStore.getState().loadCart();

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.restaurantId).toBeNull();
    });

    it('should handle corrupted AsyncStorage data gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json {{{}');

      await expect(useCartStore.getState().loadCart()).resolves.toBeUndefined();

      // State should remain at defaults
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should handle partial stored cart data', async () => {
      const partialCart = { items: null, restaurantId: null, restaurantName: null };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(partialCart));

      await useCartStore.getState().loadCart();

      expect(useCartStore.getState().items).toEqual([]);
    });
  });

  describe('subtotal', () => {
    it('should calculate subtotal correctly with no options', () => {
      useCartStore.getState().addItem(
        { menuItemId: 'm1', name: 'Burger', price: 10, quantity: 2, options: [] },
        'r1',
        'Test Restaurant',
      );

      expect(useCartStore.getState().subtotal()).toBe(20);
    });

    it('should include option prices in subtotal', () => {
      useCartStore.getState().addItem(
        {
          menuItemId: 'm1',
          name: 'Burger',
          price: 10,
          quantity: 1,
          options: [
            { name: 'Extra Cheese', value: 'Yes', price: 2 },
            { name: 'Bacon', value: 'Yes', price: 1.5 },
          ],
        },
        'r1',
        'Test Restaurant',
      );

      // (10 + 2 + 1.5) * 1 = 13.5
      expect(useCartStore.getState().subtotal()).toBe(13.5);
    });

    it('should return 0 for an empty cart', () => {
      expect(useCartStore.getState().subtotal()).toBe(0);
    });

    it('should sum multiple items correctly', () => {
      useCartStore.getState().addItem(
        { menuItemId: 'm1', name: 'Burger', price: 10, quantity: 2, options: [] },
        'r1',
        'Test Restaurant',
      );
      useCartStore.getState().addItem(
        { menuItemId: 'm2', name: 'Fries', price: 5, quantity: 3, options: [] },
        'r1',
        'Test Restaurant',
      );

      // (10 * 2) + (5 * 3) = 20 + 15 = 35
      expect(useCartStore.getState().subtotal()).toBe(35);
    });
  });

  describe('itemCount', () => {
    it('should return total quantity across all items', () => {
      useCartStore.getState().addItem(
        { menuItemId: 'm1', name: 'Burger', price: 10, quantity: 2, options: [] },
        'r1',
        'Test Restaurant',
      );
      useCartStore.getState().addItem(
        { menuItemId: 'm2', name: 'Fries', price: 5, quantity: 3, options: [] },
        'r1',
        'Test Restaurant',
      );

      expect(useCartStore.getState().itemCount()).toBe(5);
    });

    it('should return 0 for empty cart', () => {
      expect(useCartStore.getState().itemCount()).toBe(0);
    });
  });
});
