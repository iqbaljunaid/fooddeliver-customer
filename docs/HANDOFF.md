# Handoff Notes — April 2, 2026

## Session 2 — Menu Items Display, Close Button & Crash Fixes

### Summary
Fixed restaurant menu page crash (price returned as string from DB, old option type shape), added a close ✕ button to the add-to-cart modal, and added Unsplash food images to all menu items in the DB.

### What Was Done

#### 1. Restaurant Page Crash Fix — `app/(main)/restaurant/[id].tsx`
- `price` returned from API as a string (`"8.99"`) — calling `.toFixed()` directly on it crashed
- Wrapped all price usages in `Number(...)` before `.toFixed(2)` or arithmetic
- `MenuOptionGroup.required` renamed to `isRequired` to match the new API shape
- `opt.id` removed (inner options array `{name, price}` has no `id`) — keyed by `opt.name` instead
- `opt.price.toFixed(2)` wrapped in `Number(opt.price).toFixed(2)`
- Both `addItem()` calls now pass `Number(selectedItem.price)` to the cart store

#### 2. Close Button Added to Cart Modal — `app/(main)/restaurant/[id].tsx`
- Added an ✕ button in the top-right of the bottom sheet header row (alongside the item title)
- Style: circular `#F0F0F0` background, 32×32, dismisses modal on press

#### 3. `MenuItemCard` Price Fix — `components/MenuItemCard.tsx`
- `item.price.toFixed(2)` → `Number(item.price).toFixed(2)` (same string price crash)

#### 4. Type Updates — `types/index.ts`
- `MenuItem.price`: `number` → `number | string`
- `MenuOptionGroup.required` → `isRequired: boolean`
- Added `minSelections: number` to `MenuOptionGroup`
- `MenuOption.id` removed; `MenuOption.price`: `number` → `number | string`

---

## Session 1 — Android Release Build, Network Fixes & Orders Crash

### Summary
Set up the customer app from scratch: fixed HTTP cleartext traffic on Android 9+ release builds, configured local backend URL via `.env` and a server settings modal, added missing build dependency, and fixed a crash on the Orders tab caused by status casing mismatches and missing user-scoped filtering.

---

### What Was Done

#### 1. Cleartext Traffic Fix
- **`android/app/src/main/AndroidManifest.xml`**: Added `android:usesCleartextTraffic="true"` to the `<application>` tag
- Android 9+ blocks HTTP by default on release builds. This restores it for the non-HTTPS local backend.

#### 2. Environment Configuration
- **`.env`** (created): Points the app at the local backend instead of the hardcoded remote VM
  ```
  EXPO_PUBLIC_API_URL=http://192.168.1.107
  EXPO_PUBLIC_SOCKET_URL=http://192.168.1.107
  ```

#### 3. Server Settings Modal (Login Screen)
- **`app/(auth)/login.tsx`**: Added a "⚙ Server Settings" button and modal (matching the restaurant app pattern)
  - Reads current URLs from `services/api.ts` helpers (`getApiUrl`, `getSocketUrl`)
  - Allows runtime URL override without rebuilding the APK via `setServerUrls`
  - State: `showServerConfig` boolean, two text inputs for API and socket URLs

#### 4. Missing Build Dependency
- **`package.json`**: Added `babel-preset-expo` as a devDependency — was missing, caused Gradle release build to fail

#### 5. Orders Tab Crash Fixes
- **`app/(main)/orders.tsx`**:
  - `STATUS_COLORS` map now covers both lowercase (`placed`) and uppercase (`PLACED`) keys — the API returns lowercase while sockets send uppercase
  - Added `statusColor()` helper with `'#999'` fallback to prevent `undefined + '20'` crash
  - Imported `useAuthStore` and passes `user?.id` to `useMyOrders()` so orders are filtered to the logged-in user
- **`hooks/useOrders.ts`**: `useMyOrders(userId?)` — react-query is disabled until `userId` is available (`enabled: !!userId`)
- **`services/api.ts`**: `getMyOrders(userId?)` passes `customer_id` as a query param to the orders endpoint; returns `[]` as a safe fallback instead of propagating a raw error response
- **`components/OrderStatusBar.tsx`**: Normalises status to uppercase via `.toUpperCase()` before comparing against `STATUS_STEPS` — handles both `placed` (REST API) and `PLACED` (socket events). Removed the `OrderStatus` type import to decouple from the outdated type definition.
- **`app/(main)/order/[id].tsx`**: `currentStatus` normalised with `.toUpperCase()`; `SHOW_MAP_STATUSES` changed from typed `OrderStatus[]` to plain `string[]`

---

### Running Release Build

```bash
cd android
./gradlew :app:installRelease
```

### Known Issues / Deferred
- `customer@demo.com` has no order history — seed data not added yet
- Corrupt row in `users` table: `email = 'password123'` — needs `DELETE FROM users WHERE email = 'password123'`
