# Architecture

## Stack

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router, server components, server actions), TypeScript |
| Back end, auth and admin panel | Payload 3, running inside the same Next.js app |
| Database | PostgreSQL 16 (via `@payloadcms/db-postgres`), UUID primary keys |
| UI | Tailwind CSS 4 with small shadcn-style components in `src/components/ui` |
| Email | Any SMTP provider through `@payloadcms/email-nodemailer`; printed to the console when SMTP isn't set |
| Tests | Vitest (unit + integration against a real database), Playwright (end-to-end) |

### Why Payload

It isn't used as a website CMS. It's the back end, and it supplies three things we would otherwise build by hand:

1. **The client's admin panel** (`/admin`): question sets with their nested questions and vocabulary, publishing,
   categories, user management, educator approval, manual email verification, image uploads.
2. **Accounts:** password hashing, email verification, password reset, login cookies, lockout after failed logins.
3. **One place for access rules:** each collection declares who may read and write it. The REST API at `/api/*`,
   the admin panel and the app's own pages all go through those rules.

It runs in the same process as the app, so there's no extra service to host or pay for.

## Data model

Defined in `src/collections/`. Types are generated into `src/payload-types.ts` (`npm run generate:types`).

| Collection | Fields |
|---|---|
| `users` | name, email, password, role (`student` / `educator` / `admin`), `approved` (educators), `inviteCode` (educators, unique), `educator` (students → users), `cycle` (students, starts at 1) |
| `categories` | name (unique), slug (unique, from name), description, order |
| `question-sets` | topic, category, status (`draft` / `published`), questions[] {question, answer}, vocabulary[] {term, meaning}, tips, image (→ media), code (optional unique reference used by imports) |
| `practice-logs` | student, questionSet, practisedAt, markedBy (`student` / `educator` / `admin`), cycle |
| `media` | uploaded images (local `./media` folder), alt text |
| `assignments` | educator, student, questionSet, note, dueDate; unique (student, questionSet). "Done" is derived, not stored |
| `student-notes` | educator, student, body (private to the author) |
| `ai-feedback` | student, questionSet, questionIndex, question, answerText, result (JSON), model, token counts |

Users also have `weeklyGoal`, `theme` and `onboardingDismissed`; practice logs have `confidence` (1–5) and
`speakingSeconds`.

## The core rule: never repeat a set

- `practice-logs` has a **unique index on (student, questionSet, cycle)**, in the collection config and in the
  migration. The database itself refuses a second record of the same set in the same cycle.
- "New sets" = published sets in the category whose id is **not** among the student's logs for their current cycle,
  oldest first, 5 at a time (`findUnpractisedSets` in `src/lib/practice.ts`).
- Recording practice is idempotent: `recordPractice` returns the existing log if there is one, and handles the race
  where two requests arrive together.
- The log's `cycle` and date are always set on the server (a `beforeValidate` hook), never taken from the browser.
- **Cycles:** "Start a new practice cycle" increments `users.cycle`. Every set becomes new again, and old logs stay
  in the history with their cycle number.

## Version 4 features

| Feature | Where |
|---|---|
| Streaks, activity calendar, weekly goal, activity status | `src/lib/progress.ts`, days counted in `TZ` (`src/lib/dates.ts`) |
| Assignments (done = practised in the current cycle) | `src/lib/assignments.ts` |
| Private notes | `src/lib/notes.ts` |
| AI feedback | `src/lib/ai-feedback.ts`, see [ai-feedback.md](ai-feedback.md) |
| CSV exports | `src/lib/exports.ts`, route handlers under `src/app/(frontend)/educator/**/export` and `/exports/practice-logs.csv` |
| Admin usage overview | `src/lib/stats.ts`, `src/components/admin/Overview.tsx` (Payload `beforeDashboard`) |
| Speaking tools (timer, recorder, transcript) | `src/components/speaking/` (client-only browser APIs; audio never uploaded) |
| Charts | `src/components/charts/` (hand-built SVG; one sequential hue, text alternatives) |
| Theme | `src/lib/theme.ts`: a cookie read on the server plus a tiny pre-paint script, so there is no flash |

## Where access is enforced

Access rules live **only** in the collection configs (`src/collections/*.ts`), using the helpers in
`src/access/index.ts`. The full matrix is in [access-control.md](access-control.md).

App code (pages and server actions) calls Payload's Local API with `overrideAccess: false` and the logged-in user, so
the same rules apply as for the public API. The few writes a role can't make through its own access are done with
`overrideAccess: true`, and only after an explicit role check in the same function:

- a student joining an educator (`joinEducatorWithCode`, `src/lib/educator.ts`)
- a student starting a new cycle (`startNewCycle`, `src/lib/practice.ts`)
- an educator replacing their invite code (`regenerateInviteCode`)

Every page and server action begins with `requireUser([...roles])` (`src/lib/auth.ts`), which redirects to the
login page, or to the user's own home page if their role doesn't match.

## Protecting the question bank

| Measure | Where |
|---|---|
| Everything needs a login; unapproved educators see nothing and can't log in | collection `read` access, `beforeLogin` hook |
| Non-admins get at most 20 sets per API request, with no "fetch everything" | `beforeOperation` hook in `QuestionSets.ts` |
| Non-admins get at most 150 set reads per 15 minutes | same hook, `src/lib/rate-limit.ts` |
| Ids are random UUIDs, so sets can't be enumerated 1, 2, 3… | `idType: 'uuid'` in `payload.config.ts` |
| Login lockout after 5 failed attempts (10 minutes) | `auth` options in `Users.ts` |
| Login, sign-up, password-reset and invite-code attempts are rate-limited | server actions |
| Login cookie only accepted from same-site browser requests (CSRF) | `csrf: [serverURL]` in `payload.config.ts` |
| GraphQL API disabled | `payload.config.ts` |

The rate limiter keeps counts in memory, which suits one server process. If the app ever runs as several instances,
move it to Postgres or Redis.

## Code map

```
src/
  access/              role helpers shared by collections, hooks and pages
  collections/         Payload collections: fields, access rules, hooks
  email/templates.ts   all email HTML
  lib/
    practice.ts        next sets, record practice, history, cycles
    educator.ts        student summaries, invite codes, joining
    import/            CSV/JSON parsing, validation, import (also used by scripts/)
    auth.ts            current user, requireUser, redirects
  app/
    (frontend)/        the student, educator and import screens, and their server actions
    (payload)/         Payload admin panel and REST API (generated, don't edit)
  migrations/          database migrations (generated with npm run migrate:create)
scripts/               seed.ts, import-sets.ts
tests/
  unit/                importer parsing
  int/                 access rules, practice rules, importer against Postgres
  e2e/                 Playwright journeys
```

## Database schema changes

1. Change the collection in `src/collections/`.
2. `npm run generate:types` (and `npm run generate:importmap` if admin components changed).
3. `npm run migrate:create -- <short-name>` and commit the generated files in `src/migrations/`.
4. In development the schema is also pushed automatically. In production, migrations apply when the server starts.
   The end-to-end tests build their database from migrations only, so a forgotten migration fails CI.
