# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start Expo dev server
npm run start

# Run on device/emulator
npm run android
npm run ios

# Type checking & linting
npm run typecheck
npm run lint

# Tests
npm run test
npm run test:watch
npm run test:coverage
```

## Environment Setup

Copy `.env` and set the backend URL:
```
EXPO_PUBLIC_API_URL=http://<server-ip>
EXPO_PUBLIC_SOCKET_URL=http://<server-ip>
```

The server URL can also be overridden at runtime via the settings modal on the login screen. The API client appends `/api` automatically via `services/serverConfig.ts`.

## Architecture

### Routing (Expo Router — file-based)

- `app/index.tsx` — root redirect based on auth state
- `app/_layout.tsx` — root layout; wraps the app in `QueryClientProvider`; loads auth and cart state on mount
- `app/(auth)/` — unauthenticated screens (login, register)
- `app/(main)/` — tab navigation for authenticated users (Home, Cart, Orders, Profile)
- `app/(main)/restaurant/[id].tsx` — restaurant menu + add-to-cart modal
- `app/(main)/order/[id].tsx` — live order tracking

### State Management (Zustand)

Three stores in `stores/`:

| Store | Responsibility |
|---|---|
| `authStore.ts` | JWT tokens, user object, login/register/logout |
| `cartStore.ts` | Cart items (persisted to AsyncStorage), restaurant context |
| `orderStore.ts` | Active order state |

Cart is persisted to AsyncStorage and rehydrated in `app/_layout.tsx`.

### Data Fetching (Axios + React Query)

- `services/api.ts` — Axios instance with request interceptor (injects Bearer token) and 401 interceptor (queues requests, refreshes token, replays)
- Tokens stored in `expo-secure-store` via `services/serverConfig.ts`
- Custom React Query hooks in `hooks/` (`useRestaurants`, `useOrders`, `useAddresses`, `useLocation`, `useOrderSocket`)

### Real-Time (Socket.io)

`services/socket.ts` connects to the `/orders` namespace with token auth. The `useOrderSocket` hook subscribes to `order:status`, `driver:assigned`, and `driver:location` events for live order tracking with auto-reconnect.

### Key Data Notes

- **Prices come from the API as strings** — always parse with `parseFloat()` before arithmetic
- `MenuOptionGroup.isRequired` is typed as `boolean | undefined`
- Order statuses from the API use mixed casing — normalize before comparison
