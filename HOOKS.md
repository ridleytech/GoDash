# Custom Hooks

## `useColorScheme`

### Purpose

Returns the active color scheme (`"light"` or `"dark"`) used to theme the app.

### Implementations

- **Native (`use-color-scheme.ts`)**
  - Re-exports React Native’s `useColorScheme`.
- **Web (`use-color-scheme.web.ts`)**
  - Wraps React Native’s `useColorScheme` with a hydration guard.

### Logic

- **Native**
  - `useColorScheme` comes directly from `react-native`.
  - The returned value is controlled by the OS/browser preference.

- **Web**
  - Maintains a local `hasHydrated` state.
  - Before hydration completes, it returns `"light"`.
  - After hydration completes, it returns the value from React Native’s `useColorScheme`.

### Why the web hydration guard exists

When statically rendering for web, the server-rendered HTML can’t reliably know the client’s preferred color scheme. Returning a deterministic default (`"light"`) until hydration prevents theme mismatch/flicker between server and client render.

### Returns

- `"light" | "dark" | null` (React Native may return `null` depending on platform/version; your `useTheme` hook normalizes this).

---

## `useTheme`

### Purpose

Returns the app’s theme color palette based on the current color scheme.

### Logic

- Calls `useColorScheme()`.
- Normalizes to a `theme` key:
  - If scheme is exactly `"dark"`, uses `"dark"`.
  - Otherwise defaults to `"light"`.
- Returns `Colors[theme]` from `src/constants/theme.ts`.

### Returns

An object containing the theme colors used throughout the app:

- `text`
- `background`
- `backgroundElement`
- `backgroundSelected`
- `textSecondary`

These values are defined in `src/constants/theme.ts` under `Colors.light` and `Colors.dark`.

---

## `useGroupOrder`

### Purpose

Provides the app’s group ordering state machine (host + invited participants), including:

- Group state (`groupId`, `hostEmail`, invites, carts)
- Menu products
- Actions to mutate state via the backend
- Derived selectors for UI rendering

This hook is implemented in `src/state/group-order.tsx` and is backed by a React context.

### Provider requirement

`useGroupOrder()` must be called under `GroupOrderProvider`. If it’s used outside the provider, it throws:

- `"useGroupOrder must be used within GroupOrderProvider"`

### Returns

An object with the following shape (high-level):

- `state`
  - `groupId`
  - `hostEmail`
  - `invitedEmails`
  - `joinedEmails`
  - `activeUserEmail`
  - `cartsByEmail`
- `products`
  - Menu products (fetched from backend; falls back to local defaults)
- `actions`
  - `startGroup(hostEmail)`
  - `loadGroup(groupId, email)`
  - `refreshGroup()`
  - `resetGroup()`
  - `addInvite(email)`
  - `removeInvite(email)`
  - `setActiveUserEmail(email)`
  - `addToCart(productId)`
  - `decrementFromCart(productId)`
  - `removeFromCart(productId)`
  - `clearCartForEmail(email)`
  - `checkout()`
- `selectors`
  - `participants` (host + invited)
  - `isHostActive`
  - `cartForActiveUser`
  - `getSubtotalCentsForEmail(email)`
  - `getTotalCents()`

### Core logic

- **Backend is the source of truth**
  - Most actions call the backend (`backendCreateGroup`, `backendInvite`, `backendCartDelta`, etc.) and then reconcile local state via `applyBackendGroup()`.

- **`applyBackendGroup()` normalizes server data**
  - Caps invites to 2 (max 3 total participants).
  - Ensures `joinedEmails` is always an array.
  - Keeps `activeUserEmail` valid; falls back to the host if needed.

- **Polling refresh**
  - When `state.groupId` is set, the provider polls `backendGetGroup()` every ~3s and applies updates.

- **Product list loading**
  - Attempts to load menu products from the backend via `backendMenu()`.
  - If it fails, it keeps a local fallback list.

- **Push token registration side-effect**
  - When `setActiveUserEmail()` is called, it also attempts to:
    - Request notification permission + fetch an FCM token (`registerForPushNotificationsAsync()`)
    - Register that token to the backend via `backendRegisterPushToken(email, token)`

---

## Usage pattern

Hooks in this folder are designed to be:

- Imported via the `@/hooks/...` alias.
- Called at the top level of React function components.
- Used as the source of truth for theming-related values.

Examples:

- `const theme = useTheme()`
- `const scheme = useColorScheme()`
