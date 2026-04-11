# Food Rush Customer App - Development Handoff

**Date:** April 11, 2026
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

## 8. Recent Changes

### OTA Updates via expo-updates (April 11)
Enabled over-the-air updates so app can receive JS bundle updates without a new APK build.

| File | Change |
|------|--------|
| `app.config.js` | Added `updates` config with EAS project URL, `runtimeVersion` policy, `expo-updates` plugin |
| `app/_layout.tsx` | Added update check on mount — prompts user to restart when update is available |
| `eas.json` | Added `channel` per build profile (development/preview/production) |
| `package.json` | Added `expo-updates` dependency |

### Default Address on Registration (April 11)
Customer registration now includes default delivery address fields (street, city, postal code, country).

| File | Change |
|------|--------|
| `app/(auth)/register.tsx` | Added address fields (street, city, postalCode, country) to registration form |
| `services/api.ts` | Updated register API call to include address data |
| `stores/authStore.ts` | Updated register action to pass address fields |

### Cart Coordinate Fix (April 11)
Fixed checkout crash when GPS coordinates are unavailable.

| File | Change |
|------|--------|
| `app/(main)/cart.tsx` | Send `undefined` instead of `null` for missing coordinates — backend rejects null |

### EAS Build Workflow (April 10)
Added GitHub Actions CI for automatic EAS Android builds on push to main.

| File | Change |
|------|--------|
| `.github/workflows/eas-build.yml` | EAS build workflow (preview profile, Android) |
| `app.config.js` | Hardcoded EAS project ID, set slug |
| `eas.json` | Build profile configuration |

### Password Visibility & Stale Token Fix (April 8)
PR #1 merged: added password show/hide toggle on login and fixed stale token issue.

| File | Change |
|------|--------|
| `app/(auth)/login.tsx` | Password visibility toggle button |
| `services/api.ts` | Clear stale token before login attempt |

### Real-Time Chat (April 6)
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
All default API/Socket URLs changed from `https://` to `http://` — backend serves HTTP only.

---

## 9. Known Issues

- No push notifications — order updates are WebSocket-only
- No offline mode
