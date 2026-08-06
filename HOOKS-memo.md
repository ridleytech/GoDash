# useCallback / useMemo usage

This document lists current uses of `useCallback` and `useMemo` in this repo.

## src/state/group-order.tsx

### `useCallback`

- `applyGroup`
  - **Purpose**
    - Applies the backend `OrderGroup` shape to local `GroupOrderState`.
    - Keeps the function reference stable for effects and action callbacks.
  - **Dependencies**
    - `[]`

- `startGroup`
  - **Purpose**
    - Creates a group via `createOrderGroup`, then hydrates local state.
  - **Dependencies**
    - `[applyGroup]`

- `refreshGroup`
  - **Purpose**
    - Fetches the latest group state from the backend and applies it.
  - **Dependencies**
    - `[applyGroup, state.groupId]`

- `loadGroup`
  - **Purpose**
    - Validates inputs, fetches group details, joins the group, sets active user.
  - **Dependencies**
    - `[applyGroup]`

- `resetGroup`
  - **Purpose**
    - Clears all in-memory group state.
  - **Dependencies**
    - `[]`

- `addInvite`
  - **Purpose**
    - Validates invite constraints then calls `inviteUser` and applies group.
  - **Dependencies**
    - `[applyGroup, state.groupId, state.hostEmail, state.invitedEmails]`

- `removeInvite`
  - **Purpose**
    - Removes an invite via backend then applies group.
  - **Dependencies**
    - `[applyGroup, state.groupId]`

- `setActiveUserEmail`
  - **Purpose**
    - Sets active ordering user and ensures their cart exists.
    - Also kicks off push token registration.
  - **Dependencies**
    - `[]`

- `mutateCartQuantity`
  - **Purpose**
    - Applies cart deltas via backend and then applies updated group state.
  - **Dependencies**
    - `[applyGroup, state.groupId]`

- `addToCart`
  - **Purpose**
    - Convenience wrapper around `mutateCartQuantity(..., +1)` for active user.
  - **Dependencies**
    - `[mutateCartQuantity, state.activeUserEmail]`

- `decrementFromCart`
  - **Purpose**
    - Convenience wrapper around `mutateCartQuantity(..., -1)` for active user.
  - **Dependencies**
    - `[mutateCartQuantity, state.activeUserEmail]`

- `removeFromCart`
  - **Purpose**
    - Removes all quantity of a product from the active user’s cart.
  - **Dependencies**
    - `[mutateCartQuantity, state.activeUserEmail, state.cartsByEmail]`

- `clearCartForEmail`
  - **Purpose**
    - Iterates all product IDs in a cart and applies deltas to clear quantities.
  - **Dependencies**
    - `[mutateCartQuantity, state.cartsByEmail]`

- `checkout`
  - **Purpose**
    - Checks out via backend and then applies updated group state.
  - **Dependencies**
    - `[applyGroup, state.activeUserEmail, state.groupId]`

- `getSubtotalCentsForEmail`
  - **Purpose**
    - Computes subtotal for a participant by joining cart quantities with products.
  - **Dependencies**
    - `[products, state.cartsByEmail]`

- `getTotalCents`
  - **Purpose**
    - Computes total cents by summing all participant subtotals.
  - **Dependencies**
    - `[getSubtotalCentsForEmail, participants]`

### `useMemo`

- `participants`
  - **Purpose**
    - Derives participant ordering list from host + invited emails.
  - **Dependencies**
    - `[state.hostEmail, state.invitedEmails]`

- `isHostActive`
  - **Purpose**
    - Derives whether the currently active user is the host.
  - **Dependencies**
    - `[state.activeUserEmail, state.hostEmail]`

- `cartForActiveUser`
  - **Purpose**
    - Provides the cart object for the active user.
  - **Dependencies**
    - `[state.activeUserEmail, state.cartsByEmail]`

- `value` (context value)
  - **Purpose**
    - Memoizes the context object to reduce unnecessary re-renders of consumers.
  - **Dependencies**
    - A comprehensive list including `state`, `products`, all action callbacks, and selector values.
