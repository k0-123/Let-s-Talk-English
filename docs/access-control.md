# Access-control matrix

Who can read and write what. Every rule is enforced on the server, in the collection configs under
`src/collections/`. The API at `/api/*`, the admin panel and the app's pages all use the same rules.

"Pending educator" = an educator the admin hasn't approved yet. They cannot log in at all; the column shows what
the rules would allow even if they had a valid session.

## Collections

| Collection · action | Logged out | Student | Pending educator | Approved educator | Admin |
|---|---|---|---|---|---|
| **Question sets** · read | ✗ | Published only | ✗ | Published only | All |
| Question sets · create / update / delete | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Categories** · read | ✗ | ✓ | ✗ | ✓ | ✓ |
| Categories · create / update / delete | ✗ | ✗ | ✗ | ✗ | ✓ (delete only when empty) |
| **Media** (images) · read | ✗ | ✓ | ✗ | ✓ | ✓ |
| Media · upload / edit / delete | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Users** · read | ✗ | Self | Self + own students | Self + own students | All |
| Users · create | Sign-up as student or educator | — | — | — | ✓ any role |
| Users · update | ✗ | Self (name, email, password, weekly goal, theme) | Self (same) | Self (same) | ✓ |
| Users · role, approved, educator link, cycle, invite code | ✗ | ✗ ¹ | ✗ | ✗ ¹ | ✓ |
| Users · delete / unlock | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Practice logs** · read | ✗ | Own | ✗ | Own students' | All |
| Practice logs · create | ✗ | For self, published sets only | ✗ | For own students, published sets only | ✓ |
| Practice logs · update / delete | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Assignments** · read | ✗ | Own | ✗ | Ones they created | All |
| Assignments · create | ✗ | ✗ | ✗ | For own students, published sets only (one per set per student) | ✓ |
| Assignments · update (note, due date) / delete | ✗ | ✗ | ✗ | Ones they created | ✓ |
| **Student notes** · read / update / delete | ✗ | ✗ | ✗ | Ones they wrote | All |
| Student notes · create | ✗ | ✗ | ✗ | About own students | ✓ |
| **AI feedback** · read | ✗ | Own | ✗ | Own students' | All |
| AI feedback · create | ✗ | Via "Get feedback" only ² | ✗ | ✗ | ✓ |
| AI feedback · update / delete | ✗ | ✗ | ✗ | ✗ | Delete only |
| **Admin panel** (`/admin`) | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Bulk import** (`/import`) | ✗ | ✗ | ✗ | ✗ | ✓ |

² Rows are written by the server after checking the student, the set, the answer and the daily limit
(`getAnswerFeedback` in `src/lib/ai-feedback.ts`); the API refuses direct creation.

¹ Changed only through specific server-side actions that check the role first: a student joins an educator with a
valid invite code, or starts a new practice cycle; an educator replaces their own invite code.

Notes:

- Sign-up can't create an admin or a pre-approved educator: those fields are dropped for anyone but an admin. The
  very first account ever created (from `/admin`) is made the admin.
- An invite code is visible only to its educator and the admin, and can't be searched for by others.
- The date, cycle and "marked by" of a practice log are set by the server.
- Logs can only point at published sets for non-admins, so a student can't record (or discover) drafts.

## Login rules

| Situation | Result |
|---|---|
| Email not confirmed | Refused, with an option to resend the confirmation email |
| Educator not approved | Refused: "waiting for approval" |
| 5 wrong passwords | Account locked for 10 minutes (admin can unlock) |
| Cookie sent by a non-browser client or another site | Ignored (CSRF protection) |
| Admin account in the mobile app | Refused: told to use the website |

## The mobile app's API (`/api/app/*`)

The app sends its login token in the `Authorization` header. Each endpoint in `src/endpoints/app.ts` checks, in order:

| Check | Result |
|---|---|
| Not logged in | 401 |
| Role not allowed for the endpoint (students: student endpoints; educators: educator endpoints; admins: none) | 403 |
| Educator not approved | 403 |
| A student id that isn't one of the educator's own students | 404, the same as a student that doesn't exist |

After these checks the endpoint calls the same `src/lib/` functions as the website with the user's own access, so
every collection rule above still applies. Cross-origin browser calls are refused unless the origin is listed in
`CORS_ORIGINS` (only the app's web preview needs this).

## Where each rule is tested

| Rule | Test |
|---|---|
| Logged-out users can't read sets, categories, logs, users or media | `tests/int/access.int.spec.ts` · `tests/e2e/access.e2e.spec.ts` |
| Students see published sets only | `access.int.spec.ts` (question sets) · `access.e2e.spec.ts` (drafts via API) |
| Pending educators see no content and can't log in | `access.int.spec.ts` · `tests/e2e/educator.e2e.spec.ts` |
| Only the admin writes sets and categories | `access.int.spec.ts` |
| Non-admins get small pages from the API | `access.int.spec.ts` · `access.e2e.spec.ts` |
| An educator sees only their own students and their logs | `access.int.spec.ts` · `educator.e2e.spec.ts` (other educator's student → not found) |
| A student sees only themselves and their own logs | `access.int.spec.ts` · `access.e2e.spec.ts` |
| Sign-up can't create admins or approve itself; students can't change role/educator/cycle | `access.int.spec.ts` |
| A student can't record practice for someone else, or on a draft | `access.int.spec.ts` |
| An educator can't mark sets for another educator's student | `access.int.spec.ts` · `tests/int/practice.int.spec.ts` |
| One log per student, set and cycle (database) | `access.int.spec.ts` |
| Invite codes: unknown or unapproved codes rejected; old code stops working | `practice.int.spec.ts` |
| Assignments, notes and AI feedback: who can create, read, change and delete | `tests/int/access-v4.int.spec.ts` |
| Student can't open educator or admin pages | `access.e2e.spec.ts` |
| CSRF: cookie from a non-browser client is ignored | `access.e2e.spec.ts` |
| App API: logged out → 401, wrong role or pending educator → 403, another educator's student → 404 | `tests/int/app-api.int.spec.ts` |
| App: an educator sees only their own students; an admin can't sign in | `tests/e2e/mobile-app.e2e.spec.ts` |
