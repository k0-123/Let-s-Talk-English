# Mobile app (Android + iOS)

A native app for **students and educators**, built with **Expo** (React Native) in its own `mobile/` folder. It uses
the same accounts, data and rules as the website. The admin keeps using the website.

**Status:** built in version 4.0.0. How to run it on a phone, build it and publish it: [mobile/README.md](../mobile/README.md).
Publishing to the stores waits on hosting (the app needs the website at an https:// address) and on the client's
store accounts.

## Decisions

| | Choice |
|---|---|
| Framework | Expo SDK 57 (React Native 0.86), TypeScript, Expo Router (file-based screens) |
| Where | `mobile/`: a separate project with its own `package.json`, never part of the website build |
| Backend | The existing Next.js + Payload server. No second backend, no copy of the rules |
| Users | Students and educators. Pending educators see "waiting for approval". Admins are pointed to the website |
| Data fetching | TanStack Query: caching, pull-to-refresh, retries |
| Sign-in | Payload login returns a token, stored in the phone's secure storage (Keychain / Keystore) and sent as `Authorization: JWT …` |
| Speaking | `expo-audio` to record and play back (audio stays on the phone); answers are typed or dictated with the phone keyboard's microphone; `expo-haptics` and `expo-keep-awake` for the Part 2 timer. In-app live transcripts (`expo-speech-recognition`) need a custom build instead of Expo Go, so they are left for a later version |
| Charts | `react-native-svg`: streak, goal ring, activity calendar, sparklines |
| Look | Same brand colours as the website, light and dark mode, large touch targets, bottom tabs |

## How the app talks to the server

1. **Payload's REST API** for plain reads and writes the collection rules already govern: log in, sign up, forgot
   password, refresh token, read categories and question sets, read assignments and notes.
2. **A small app API** (`/api/app/...`, Payload custom endpoints in `src/endpoints/app.ts`) for anything that needs
   server logic. Every endpoint checks the logged-in role, then calls the same functions the website uses in
   `src/lib/`, with `overrideAccess: false`:

| Endpoint | Uses |
|---|---|
| `GET /api/app/me` | user, educator name, whether AI feedback is on, today's AI usage |
| `GET /api/app/student/dashboard` | `getStudentProgress`, `countUnpractisedByCategory`, `listAssignments` |
| `GET /api/app/practice/:category/next` | `getNextSetsForStudent` |
| `GET /api/app/sets/:id` | `getQuestionSet`, the student's log for the set (or the educator's view of a student) |
| `POST /api/app/practice` | `recordPractice` (with confidence and speaking time) |
| `GET /api/app/history` | `getHistory` (category filter, pages) |
| `POST /api/app/join` · `POST /api/app/cycle` | `joinEducatorWithCode` · `startNewCycle` |
| `GET/POST /api/app/feedback` | `listFeedback` · `getAnswerFeedback` |
| `PATCH /api/app/me` | name, weekly goal, theme |
| `GET /api/app/educator/students` | `listStudentSummaries` |
| `GET /api/app/educator/students/:id` | student, progress, history, not-done sets, notes, feedback |
| `POST/DELETE /api/app/educator/assignments` | `assignSets` · `removeAssignment` |
| `POST/DELETE /api/app/educator/notes` | `addNote` · `deleteNote` |
| `POST /api/app/educator/invite-code` | `regenerateInviteCode` |

The token travels in a header, not a cookie, so the website's CSRF protection is unaffected. All existing limits
(small pages of sets, read rate limit, login lockout, AI daily limit) apply to the app too.

## Screens

**Signed out:** Welcome · Log in · Sign up (student or educator) · Check your email · Forgot password.

**Student (bottom tabs):**
- **Home**: streak, weekly goal ring, activity calendar, "assigned by your educator", continue practising.
- **Practice**: categories with new-set counts → the next 5 sets → **set screen**: questions, tap to reveal
  answers, vocabulary and tips; speaking tools (Part 2 prep + 2-minute timer, record and play back, live
  transcript or typed answer); **Get AI feedback**; **Mark as practised** with a confidence rating.
- **History**: practised sets by date and category, plus past AI feedback.
- **Me**: name, my educator (join or switch with a code), weekly goal, theme, start a new cycle, log out.

**Educator (bottom tabs):**
- **Students**: list with status (active / slipping / inactive), sets this cycle, last active and an 8-week
  sparkline; search.
- **Student**: progress, history, not done yet (assign, or mark as covered), private notes, AI feedback.
- **Assignments**: open, overdue and done across students.
- **Me**: invite code with Share and Copy, new code, theme, log out.

## Security

- Token only in secure storage; cleared on log out or on a 401.
- No rule is decided in the app: the server checks everything again.
- Production builds talk HTTPS only. Plain `http://` is allowed only for local development.
- Recordings are written to the app's private cache and never uploaded. Only the text answer is sent when the
  student asks for AI feedback.

## Testing

- **Server:** Vitest integration tests for every `/api/app/*` endpoint (`tests/int/app-api.int.spec.ts`): logged
  out → 401, wrong role → 403, another educator's student → 404, happy paths.
- **App:** TypeScript strict, ESLint, and Jest (`jest-expo`) tests in `mobile/__tests__/`: the API client, error
  messages, the Part 2 timer, date formatting, and screen tests with React Native Testing Library (log in, a
  question with AI feedback and its daily limit, confidence rating, feedback card).
- **End to end:** the app's web build (Expo exports React Native to the web) runs in Playwright at Pixel 7 size
  against the real server (`tests/e2e/mobile-app.e2e.spec.ts`): a student practises a set, gets AI feedback and
  finds it in their history, and the set is not offered again; an educator assigns a set and marks it covered;
  an admin is sent to the website.
- **CI:** a `mobile` job (install, typecheck, lint, Jest), and the app's end-to-end tests in the main job.
- **Not possible in this sandbox:** building the Android/iOS binaries. That needs EAS Build (Expo account) or
  Android Studio / Xcode; the steps are in `mobile/README.md`. You can try the app on a real phone at once with
  the free **Expo Go** app.

## Not in this version of the app

Push notifications, offline practice, in-app purchases, admin features (use the website).

## Build order (all done)

1. App API endpoints in the server, with tests.
2. Expo project, theme, API client, sign-in flow.
3. Student screens.
4. Speaking tools and AI feedback.
5. Educator screens.
6. Tests, CI job, `mobile/README.md`, screenshots.
