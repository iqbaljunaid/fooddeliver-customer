# Food Rush Customer App - Development Handoff

**Date:** April 6, 2026
**Status:** Functional, tested on Android emulator

---

## 1. Project Overview

React Native (Expo SDK 55) mobile app for customers to browse restaurants, place orders, and track deliveries in real time. Connects to the shared Food Rush backend at `http://138.2.177.115`.

---

## 2. Tech Stack

- **Framework:** Expo SDK 55 / React Native / React 19
- **Routing:** expo-router (file-based)
- **State:** Zustand (auth, cart, order stores)
- **Server State:** React Query (TanStack v5)
- **API Client:** Axios with JWT interceptor and auto token refresh
- **Real-time:** Socket.IO (`/orders` namespace) for live order tracking
- **Storage:** expo-secure-store (tokens), AsyncStorage (cart persistence)
- **Package Manager:** pnpm

---

## 3. Project Structure

```
app/
  _layout.tsx              # Root layout, QueryClient, loads auth + cart
  index.tsx                # Auth-based redirect
  (auth)/
    login.tsx              # Login screen
    register.tsx           # Registration screen
  (main)/
    index.tsx              # Home — restaurant list
    cart.tsx               # Cart screen
    orders.tsx             # Order history
    profile.tsx            # User profile
    restaurant/[id].tsx    # Restaurant menu + add-to-cart modal
    order/[id].tsx         # Live order tracking
components/
  AddressSelector.tsx      # Delivery address picker
  CartItem.tsx             # Cart item display
  ...
hooks/
  useRestaurants.ts        # Restaurant data queries
  useOrders.ts             # Order queries
  useAddresses.ts          # Address management
  useLocation.ts           # GPS location
  useOrderSocket.ts        # Socket.IO for live order tracking
services/
  api.ts                   # Axios instance with Bearer token + 401 refresh
  socket.ts                # Socket.IO connection manager
  serverConfig.ts          # Runtime API/Socket URL (SecureStore)
stores/
  authStore.ts             # JWT tokens, user object, login/register/logout
  cartStore.ts             # Cart items, persisted to AsyncStorage
  orderStore.ts            # Active order state
```

---

## 4. Key Design Notes

- **Prices are strings** — API returns prices as strings; always use `parseFloat()` before arithmetic
- **`MenuOptionGroup.isRequired`** — typed as `boolean | undefined`
- **Order statuses** — API uses mixed casing; normalize before comparison
- **Cart persistence** — saved to AsyncStorage, rehydrated in `_layout.tsx`
- **Token refresh** — Axios interceptor queues concurrent requests during refresh to avoid lost calls

---

## 5. Environment

```
EXPO_PUBLIC_API_URL=http://138.2.177.115
EXPO_PUBLIC_SOCKET_URL=http://138.2.177.115
```

Runtime override available via login screen settings modal. The API client appends `/api` automatically via `serverConfig.ts`.

---

## 6. Test Accounts

| Email | Password | Notes |
|-------|----------|-------|
| `alice@demo.com` | `password123` | Seed customer |
| `bob@demo.com` | `password123` | Seed customer |
| `carol@demo.com` | `password123` | Seed customer |

---

## 7. Development

```bash
pnpm install
npx expo start               # Expo Go dev server
npx expo start --android     # Android emulator
npx expo start --ios         # iOS simulator
```

```bash
pnpm test                    # Jest tests
pnpm typecheck               # TypeScript check
pnpm lint                    # ESLint
```

---

## 8. Recent Changes (April 6, 2026)

### Real-Time Chat
Added in-app chat for customer support conversations.

| File | Change |
|------|--------|
| `app/(main)/chat.tsx` | Chat screen with conversation list |
| `app/(main)/chat/[id].tsx` | Individual conversation thread with real-time messaging |
| `hooks/useChatSocket.ts` | Socket.IO hook for real-time chat events |
| `services/chatApi.ts` | Chat REST API client |
| `app/(main)/_layout.tsx` | Added chat tab to bottom navigation |
| `app/(main)/profile.tsx` | Added chat link on profile screen |

### Previous Changes (April 4, 2026)

#### HTTPS → HTTP Fix
All default API/Socket URLs were pointing to `https://138.2.177.115` but the backend only serves HTTP. This caused network errors on sign-in.

| File | Change |
|------|--------|
| `.env` | `https://` → `http://` for API and Socket URLs |
| `app/(auth)/login.tsx` | Default URL placeholders updated to `http://` |
| `services/serverConfig.ts` | Fallback defaults changed to `http://138.2.177.115` |

### Verified
- Login with `alice@demo.com` on Android emulator — shows Home with restaurants, Orders tab shows 3 delivered orders
- Socket connection established for real-time order tracking

---

## 9. Known Issues

- `app.config.js` still has `https://` in build-time env defaults (only affects EAS builds, not Expo Go)
- No push notifications — order updates are WebSocket-only
- No offline mode
