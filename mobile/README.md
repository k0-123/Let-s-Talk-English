# Let's Talk English app (Android and iOS)

The phone app for **students and educators**, built with [Expo](https://expo.dev) (React Native). It uses the
website as its server: the same accounts, data and rules. Admins keep using the website.

## What's in it

**Students** (tabs: Home, Practice, History, Me)

- **Home:** weekly goal ring, day streak, practice calendar, sets assigned by the educator, progress by part, and a
  "continue practising" button.
- **Practice:** pick a part, get the next new sets, open one. On a set: tap to reveal sample answers, vocabulary and
  tips; the Part 2 timer (1 minute to prepare with a notes box, 2 minutes to speak, with vibration and the screen
  kept on); record an answer and play it back; type or dictate the answer and get **AI feedback**; then
  **Mark as practised** with a confidence rating.
- **History:** practised sets by part, and past AI feedback.
- **Me:** name, join or change educator with an invite code, weekly goal, light/dark theme, start a new cycle,
  log out.

**Educators** (tabs: Students, Assignments, Me)

- **Students:** who practised this week and who needs a nudge, search and sort, activity status and 8-week trend
  for each student, and the invite code with Share and Copy.
- **Student page:** overview with calendar and progress, history, **Not done yet** (tick sets to assign with a due
  date and a note, or mark one as covered after a lesson), assignments, private notes and AI feedback.
- **Assignments:** to do, overdue and done across all students.
- **Me:** name, invite code (share, copy, get a new one), theme, log out.

Recordings stay on the phone. Only the typed or dictated text is sent, and only when the student asks for AI
feedback.

## Try it on your phone (Expo Go)

You need the website running on your computer, and your phone on the **same Wi-Fi network**.

1. Start the website from the repository root (see the main [README](../README.md)):

   ```bash
   npm run dev
   ```

2. Find your computer's address on the network: macOS `ipconfig getifaddr en0`, Windows `ipconfig` (the IPv4
   address), Linux `hostname -I`.

3. Point the app at it and start the app:

   ```bash
   cd mobile
   cp .env.example .env        # then set EXPO_PUBLIC_API_URL=http://<your address>:3000
   npm install
   npm start
   ```

4. Install **Expo Go** from the App Store or Google Play, then scan the QR code shown in the terminal (iPhone: use
   the Camera app). Log in with a demo account, for example `student@example.com` or `educator@example.com`, password
   `Password123!`.

Good to know:

- Expo Go must support SDK 57. If it says the project is incompatible, update Expo Go.
- The **Android emulator** reaches your computer at `10.0.2.2` and the **iOS simulator** at `localhost`; both are used
  automatically when `EXPO_PUBLIC_API_URL` is not set. Start them with `npm run android` or `npm run ios`.
- **Web preview:** `npm run web` opens the app in a browser at http://localhost:8081. The website must allow that
  address: start it with `CORS_ORIGINS=http://localhost:8081 npm run dev`.
- **Dictation:** students tap the microphone on their phone's keyboard to dictate an answer. In-app speech
  recognition needs a custom build (it isn't in Expo Go), so it is left for a later version.
- Changing `.env` needs a restart of `npm start` (values are read when the app is bundled).

## Install it without Expo Go (EAS Build)

Installable builds are made in the cloud by **EAS Build** (free Expo account; no Android Studio or Xcode needed).
The website must be online at an **https://** address first: release builds don't allow plain `http://`.

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure        # creates eas.json
```

Set `EXPO_PUBLIC_API_URL=https://[DOMAIN]` for the build, either in `eas.json` (`"env"` of each build profile) or as
an EAS environment variable, then:

| Goal | Command | Needs |
|---|---|---|
| Android test build (an APK to share) | `npx eas-cli@latest build -p android --profile preview` | Expo account |
| Google Play | `npx eas-cli@latest build -p android` then `npx eas-cli@latest submit -p android` | Google Play developer account (one-off fee) |
| App Store / TestFlight | `npx eas-cli@latest build -p ios` then `npx eas-cli@latest submit -p ios` | Apple Developer Program (yearly fee) |

The app ID is `com.letstalkenglish.app` on both stores (`app.json`); change it before the first upload if the client
wants a different one. The version is in `app.json`.

## Develop

| Command | What it does |
|---|---|
| `npm start` | Development server (Expo Go, emulators, web) |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Jest unit and screen tests (`__tests__/`) |
| `npm run export:web` | Web build in `dist/` |

From the repository root, `npm run test:e2e:app` builds the app for the web and runs its end-to-end tests at phone
size against a test copy of the website (`tests/e2e/mobile-app.e2e.spec.ts`). CI runs all of these.

```
src/app/           screens (Expo Router: every file is a screen; (auth), (student), (educator) are groups)
src/components/    shared UI: buttons, cards, charts, speaking tools, feedback card
src/api/hooks.ts   data from the server (React Query)
src/auth/          sign-in, token storage, the signed-in user
src/lib/           API client, types, formatting, the Part 2 timer logic
src/theme/         light and dark colours (the website's)
```

## How it talks to the server

- **Signing in** uses the website's account API (`/api/users/login`, sign-up, forgot password). The login token is
  kept in the phone's secure storage (Keychain / Keystore), sent as `Authorization: JWT …`, refreshed when the app
  starts, and deleted on log out or when the server rejects it.
- **Everything else** goes through the app API (`/api/app/...`, defined in `src/endpoints/app.ts` in the website).
  Each request checks the user's role and calls the same code as the website, so every rule (never repeat a set,
  educators see only their own students, AI daily limit, rate limits) is decided by the server.

More background: [docs/mobile-app-plan.md](../docs/mobile-app-plan.md).
