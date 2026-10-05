# Let's Talk English

An IELTS Speaking practice and student-tracking web app. Students practise question sets, the app records each
one, their educator can see it, and **a practised set is never offered to that student again**.

- **Students** get a home dashboard (weekly goal, streak, practice calendar, progress by part), practise sets with
  a Part 2 timer, record and play back their answers, get **AI feedback** from Claude on what they said, mark sets
  as practised with a confidence rating, and follow their history.
- **Educators** (approved by the admin) share an invite code, see who is active or slipping, assign sets with due
  dates, keep private notes, mark sets covered in live sessions, and export progress as CSV.
- **The admin** manages question sets and categories, bulk-imports sets from CSV/JSON, approves educators, and sees
  usage at a glance on the admin dashboard.
- Light and dark themes, built for phones first.
- A native **Android/iOS app** for students and educators in `mobile/` (Expo), using this website as its server.
  Try it on your phone with Expo Go: see [mobile/README.md](mobile/README.md).

Built with Next.js 16, Payload 3 (auth, access rules and the admin panel), PostgreSQL and Tailwind CSS. See
[docs/architecture.md](docs/architecture.md).

> **Status:** version 4 ([CHANGELOG.md](CHANGELOG.md)). Runs locally; hosting isn't decided yet. See
> [docs/status.md](docs/status.md).

## Run it locally

You need **Node.js 20.9+** (22 recommended) and **PostgreSQL 16**.

1. **Start Postgres.** The easiest way is Docker:

   ```bash
   docker compose up -d
   ```

   This creates the `lte_dev` database (plus `lte_test` and `lte_e2e` for the tests) with user and password
   `postgres`. If you use your own Postgres, create those databases yourself.

2. **Configure and install.**

   ```bash
   cp .env.example .env      # set PAYLOAD_SECRET to any long random string
   npm install
   ```

3. **Add demo data** (categories, the 20 sample sets, and one account per role):

   ```bash
   npm run seed
   ```

4. **Start the app.**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 and log in with one of the demo accounts (password `Password123!`):

   | Email | Role | Goes to |
   |---|---|---|
   | `admin@example.com` | Admin | `/admin` (admin panel) and `/import` |
   | `educator@example.com` | Approved educator with 4 demo students | `/educator` |
   | `student@example.com` | Student with some practice history | `/dashboard` |

   `priya@`, `arjun@` and `meera@example.com` are more demo students with different activity levels.

**Emails:** without SMTP settings, account confirmation and password-reset emails are **printed in the terminal**
running `npm run dev`. Copy the link from there. To send real emails, fill in the `SMTP_*` settings in `.env`.

**AI feedback:** add `ANTHROPIC_API_KEY=...` to `.env` to switch it on (see [docs/ai-feedback.md](docs/ai-feedback.md)
for costs and limits). To try the screens without a key, start the app with `AI_FAKE=true npm run dev`, which returns
made-up feedback.

**Starting from an empty database instead:** skip `npm run seed`, open http://localhost:3000/admin and create the
first account (it becomes the admin), then add categories and import sets.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run build` / `npm run start` | Production build and server (the build doesn't need a database) |
| `npm run seed` | Demo categories, sample sets and accounts (safe to run again) |
| `npm run import:sets -- file.csv [--dry-run] [--publish] [--create-categories]` | Bulk import from the command line |
| `npm run db:fresh` | **Wipe** the database and rebuild it from migrations |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run test:int` | Unit and integration tests (uses the `lte_test` database) |
| `npm run test:e2e` | Playwright end-to-end tests (uses `lte_e2e` and port 3100) |
| `npm run test:e2e:app` | Builds the mobile app for the web and runs its end-to-end tests at phone size |
| `npm run generate:types` | Regenerate `src/payload-types.ts` after changing a collection |
| `npm run migrate:create -- <name>` | Create a database migration after changing a collection |

## Tests

- **Integration tests** (`tests/int`) run against a real Postgres database: every access rule, the never-repeat rule,
  cycles, invite codes, assignments, notes, AI feedback (with a fake reviewer) and the importer. **Unit tests** (`tests/unit`) cover import parsing.
- **End-to-end tests** (`tests/e2e`) drive a real browser through the student, educator and admin journeys, the
  speaking tools (with a fake microphone), AI feedback, assignments, notes, CSV export, dark mode and the access
  rules, at desktop and phone sizes. They build their database from the committed migrations.
- **The mobile app** has its own type-check, lint and Jest tests (`cd mobile && npm test`), and end-to-end tests
  that drive its web build against the server (`npm run test:e2e:app`).
- First time only: `npx playwright install chromium`.
- **CI** (`.github/workflows/ci.yml`) runs lint, type-check, all tests (website and app) and a production build on
  pushes to `main` and on pull requests.

## Project structure

```
src/collections/     data model and access rules (Payload collections)
src/lib/             practice, educator, import and auth logic
src/app/(frontend)/  the app's pages and server actions
src/app/(payload)/   Payload admin panel and REST API (generated)
src/migrations/      database migrations
scripts/             seed and import scripts
data/                20 sample question sets (CSV and JSON)
tests/               unit, integration and end-to-end tests
mobile/              the Android/iOS app (Expo), with its own package.json
docs/                plan, scope, guides and design notes
```

## Documents

| Document | For |
|---|---|
| [docs/execution-plan.md](docs/execution-plan.md) | The V1 execution plan |
| [docs/status.md](docs/status.md) | What's done, what's waiting on the client or on hosting |
| [CHANGELOG.md](CHANGELOG.md) | What changed in each version |
| [docs/ai-feedback.md](docs/ai-feedback.md) | How AI feedback works, what it costs, how to switch it on |
| [mobile/README.md](mobile/README.md) | Running the Android/iOS app on a phone, building and publishing it |
| [docs/mobile-app-plan.md](docs/mobile-app-plan.md) | How the app is designed and how it talks to the server |
| [docs/scope.md](docs/scope.md) | One-page scope for the client to confirm and sign |
| [docs/admin-guide.md](docs/admin-guide.md) | How the client runs the app day to day |
| [docs/import-format.md](docs/import-format.md) | The CSV/JSON format for question sets |
| [docs/uat-checklist.md](docs/uat-checklist.md) | Acceptance testing script |
| [docs/architecture.md](docs/architecture.md) | How it's built, and why |
| [docs/access-control.md](docs/access-control.md) | Who can see and change what, and the tests that prove it |
