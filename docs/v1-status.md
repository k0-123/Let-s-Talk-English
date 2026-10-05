# V1 status

Where V1 stands against the [execution plan](execution-plan.md). Last updated: 5 Oct 2026.

**Summary:** every feature in the V1 Definition is built and covered by automated tests. It runs locally. What's left
needs the client (content, decisions, UAT) or a hosting decision (domain, SSL, email domain, backups, monitoring).

Legend: ✅ done · ⏳ waiting on the client · 🏠 waiting on the hosting decision

## V1 Definition

### Student
| Item | Status | Notes |
|---|---|---|
| Register, verify email, log in, reset password | ✅ | Emails print to the terminal until SMTP is set up 🏠 |
| Join an educator with an invite code | ✅ | Codes are 6 characters; case and spaces don't matter |
| Pick a category and get 3–5 new sets | ✅ | 5 at a time (`NEW_SETS_BATCH_SIZE` in `src/lib/constants.ts`) |
| Open a set: questions, answers, vocabulary, tips | ✅ | Answers, vocabulary and tips are revealed on tap |
| Mark as practised; dated; never shown again this cycle | ✅ | Enforced by a unique database index as well as the query |
| See own practice history | ✅ | Filterable by category; links back to each set |

### Educator
| Item | Status | Notes |
|---|---|---|
| Register and, once approved, log in | ✅ | Admin gets an email when an educator signs up; the educator gets one when approved |
| See only their own students | ✅ | Enforced in the database query layer; tested |
| View each student's history (sets and dates) | ✅ | Filterable by category |
| See sets a student has not done; mark as covered | ✅ | Paginated, filterable by category |

### Admin (client)
| Item | Status | Notes |
|---|---|---|
| Add, edit, publish and bulk-import sets | ✅ | Payload admin panel at `/admin`; bulk import at `/import` |
| Manage categories | ✅ | |
| Approve educators and manage users | ✅ | Includes manual email verification and unlocking accounts |
| All 500+ question sets live | ⏳ | Importer tested with the 20 samples; waiting for the full bank |

### Quality
| Item | Status | Notes |
|---|---|---|
| Usable on phone and desktop | ✅ / ⏳ | Automated tests run at desktop and Pixel 7 sizes; real-device checks are part of UAT |
| No open critical or high bugs | ⏳ | After UAT |
| Backups, monitoring and SSL | 🏠 | See "Waiting on hosting" below |
| Client UAT sign-off | ⏳ | Script in [uat-checklist.md](uat-checklist.md) |

## Milestones by phase

| Phase | Done | Open |
|---|---|---|
| 0. Scope lock | Draft scope document: [scope.md](scope.md) | Kickoff call, client's 20 real samples and format, category list, budget, signature |
| 1. Architecture | Repo, CI (`.github/workflows/ci.yml`), data model, access matrix ([access-control.md](access-control.md)) | Wireframe approval; staging environment 🏠 |
| 2. Foundation | Auth, roles, admin panel, bulk importer with error report, 20 sample sets import cleanly | Demo 1 |
| 3. Student flow | All items | Demo 2 |
| 4. Educator flow | All items, mobile layout | Full bank import ⏳, Demo 3 |
| 5. Testing | E2E for all three journeys; access-control tests (integration + E2E) | Real-device testing, UAT, sign-off |
| 6. Deployment | Admin guide ([admin-guide.md](admin-guide.md)) | Everything else 🏠 |
| 7. Support | — | After launch |

## Waiting on the hosting decision 🏠

Hosting is not decided, so V1 currently runs locally only. Once it is decided:

1. **Server and domain:** `[HOSTING_ACCOUNT]`, `[DOMAIN]`, HTTPS certificate.
2. **Build and run:** the app is a standard Next.js server (`npm run build` then `npm run start`). The build doesn't
   need a database. The database migrations in `src/migrations/` apply automatically when the server starts in
   production.
3. **Environment:** set `DATABASE_URL`, a strong `PAYLOAD_SECRET`, `SERVER_URL=https://[DOMAIN]` and `TZ`.
4. **Email:** SMTP settings from a provider (Resend, Brevo…) and SPF/DKIM records for the sending domain.
5. **Uploads:** images are stored in `./media`. On a VPS that is a folder to back up; on Vercel it needs the S3
   storage adapter instead.
6. **Backups:** daily `pg_dump` with retention, plus one tested restore.
7. **Monitoring:** Sentry (or similar) for errors and an uptime monitor.
8. **First admin:** open `/admin` on the new site and create the client's account (the first account is always admin),
   then create the categories.
9. **Legal pages:** privacy policy and terms (text from the client).

## Decisions made during the build

These fill gaps in the brief; they're listed in [scope.md](scope.md) for the client to confirm.

- Each question has its own optional sample answer (rather than one answer block per set).
- Students can reopen sets from their history to revise. Practised sets still never appear in "new sets" again.
- A student can switch educator by entering a new code; their history moves with them.
- A practice cycle reset applies to all categories at once, and earlier cycles stay in the history.
- New sets are offered in the order they were added (oldest first).
- Sets imported without a status are drafts unless "Published" is chosen on the import page.
