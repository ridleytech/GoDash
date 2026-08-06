# Unit Tests

This project uses **Jest** with the **`jest-expo`** preset for unit tests.

## Running tests

- Run all unit tests:

```bash
npm test
```

## What we test

Unit tests live alongside the code they test, under `src/`.

Current tests:

- `src/api/backend.test.ts`
  - Tests `getBackendBaseUrl()` behavior.
  - Verifies it throws if `EXPO_PUBLIC_BACKEND_URL` is missing.
  - Verifies it returns the env var value when set.

- `src/state/group-order.test.ts`
  - Tests `formatMoney()` formatting.
  - Uses Jest mocks so the file can import `group-order.tsx` without requiring native Firebase modules.

- `src/state/group-order.provider.test.tsx`
  - Tests `GroupOrderProvider` + `useGroupOrder` behavior.
  - Mocks backend API calls and push registration.
  - Uses `react-test-renderer` to mount the provider and call actions.

## Jest config

The Jest configuration is in `jest.config.js`.

Key points:

- Preset:
  - `preset: "jest-expo"`
- Test file patterns:
  - `src/**/*.test.(ts|tsx|js)`
  - `src/**/__tests__/**/*.(test|spec).(ts|tsx|js)`
- Path alias:
  - Maps `@/…` to `<rootDir>/src/…`

## Notes about native modules

Some project files import native modules (e.g. `@react-native-firebase/messaging`).

In unit tests, you must **mock native modules** to prevent errors like:

- `Native module RNFBAppModule not found`

Example pattern (used in `src/state/group-order.test.ts`):

- `jest.mock("@react-native-firebase/messaging", () => ...)`

## Notes about React 19 and `act(...)`

React 19 is strict about wrapping state updates in `act(...)` during tests.

In provider tests (`group-order.provider.test.tsx`), we:

- Wrap mounting/unmounting in `act(...)`
- Use Jest fake timers to control intervals and to avoid post-test updates

## Adding new unit tests

Recommended approach:

- Prefer testing **pure functions** (formatters, validators, reducers/selectors) where possible.
- If you test providers/components:
  - Mock network/API modules (e.g. `@/api/backend`).
  - Mock native modules.
  - Wrap renders and updates in `act(...)`.

## Environment

Some unit tests rely on Expo public env vars.

- `EXPO_PUBLIC_BACKEND_URL` is read by `src/api/backend.ts`.
- For the app runtime, set it in `.env`.
- For unit tests, tests can set/unset it via `process.env`.
