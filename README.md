# GoDash

GoDash is a lightweight DoorDash-style group ordering demo built with Expo + React Native.

## Features

- **Group order creation**
  - Start a group with a host email
- **Invite flow (max 3 total participants)**
  - Host + up to 2 invited participants
- **Per-participant carts**
  - Each participant has their own cart
  - Switch who you’re ordering as
- **Menu + product images**
  - Menu items render with thumbnail images
- **Host-only checkout**
  - Summary breakdown by participant
  - Checkout action restricted to host
- **Light/Dark theme support**
  - Themed UI components and brand color `#c92138`

## Screenshots

| Start order                                     | Invites                                 |
| ----------------------------------------------- | --------------------------------------- |
| ![Start order](./assets/github/start-order.png) | ![Invites](./assets/github/invites.png) |

| Menu + cart                       | Order summary                                       |
| --------------------------------- | --------------------------------------------------- |
| ![Cart](./assets/github/cart.png) | ![Order summary](./assets/github/order-summary.png) |

## Getting started

1. Install dependencies

```bash
npm install
```

2. Start the backend (required for invites/carts/checkout persistence)

```bash
npm run backend
```

3. Start the Expo app

```bash
npx expo start
```

## Backend URL

By default the app uses `http://localhost:3001`.

- **iOS Simulator**: works as-is
- **Real device**: set `EXPO_PUBLIC_BACKEND_URL` to your machine’s LAN IP, e.g.

```bash
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.23:3001 npx expo start --clear
```
