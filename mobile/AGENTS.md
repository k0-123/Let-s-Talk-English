# Let's Talk English app: project rules

The Android/iOS app for students and educators (Expo SDK 57, Expo Router). It is a client of the website: start
with `README.md` here and `../docs/mobile-app-plan.md`.

- **No rules live in the app.** Everything goes through the website's API: Payload's REST API for accounts, and the
  app API in `../src/endpoints/app.ts` for the rest. If a screen needs new data, add or extend an endpoint there
  (with a test in `../tests/int/app-api.int.spec.ts`), then mirror its shape in `src/lib/types.ts`.
- Requests go through `useAuth().api` (adds the token, signs out on a 401) and the React Query hooks in
  `src/api/hooks.ts`. Screens live in `src/app/`; shared UI in `src/components/`.
- Colours come from `src/theme/colors.ts` (the website's tokens); never hard-code a colour in a screen.
- Everything must also work in the web preview: guard phone-only features (see `src/lib/device.ts`).
- Before pushing: `npm run typecheck && npm run lint && npm test`. The app's end-to-end test runs from the repo root
  (`npm run test:e2e:app`).
- `npx expo install <package>` needs `EXPO_OFFLINE=1` behind a proxy that blocks api.expo.dev.

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
