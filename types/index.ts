// User & Auth types
export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: 'customer' | 'driver' | 'restaurant_owner' | 'admin';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Restaurant types
export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisineType: string[];
  address: string;
  location: GeoJSON;
  rating: number;
  totalReviews: number;
  deliveryFee: number;
  minimumOrder: number;
  estimatedDeliveryTime: number;
  priceRange: number;
  imageUrl: string | null;
  isOpen: boolean;
  openingHours: Record<string, { open: string; close: string }>;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryId: string;
  options?: MenuOptionGroup[];
}

export interface MenuOptionGroup {
  id: string;
  name: string;
  required: boolean;
  maxSelections: number;
  options: MenuOption[];
}

export interface MenuOption {
  id: string;
  name: string;
  price: number;
}

// Cart types
export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  options: { name: string; value: string; price: number }[];
  specialInstructions?: string;
}

// Address types
export interface Address {
  id: string;
  label: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  location: GeoJSON;
  instructions?: string;
  isDefault: boolean;
}

export interface CreateAddressDto {
  label: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  lat: number;
  lng: number;
  instructions?: string;
  isDefault?: boolean;
}

// Order types
export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PREPARING'
  | 'READY'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  options: Record<string, unknown> | null;
  specialInstructions?: string;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  tip: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  specialInstructions?: string;
  estimatedDeliveryTime?: string;
  placedAt: string;
  acceptedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  items: OrderItem[];
  restaurant?: Restaurant;
  deliveryAddress?: Address;
}

export interface CreateOrderDto {
  restaurantId: string;
  deliveryAddressId: string;
  items: {
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    options?: Record<string, unknown>;
    specialInstructions?: string;
  }[];
  tip: number;
  deliveryFee: number;
  discount: number;
  promoCodeId?: string;
  specialInstructions?: string;
  paymentMethod: PaymentMethod;
}

// Payment types
export type PaymentMethod =
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD';

// Driver types (for tracking)
export interface DriverInfo {
  driverId: string;
  driverName: string;
  driverPhone?: string;
  vehicleType: string;
  vehicleMake?: string;
  vehicleColor?: string;
  licensePlate?: string;
}

// Location types
export interface GeoJSON {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface LocationUpdate {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp?: Date;
}
