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
| Users · update | ✗ | Self (name, email, password) | Self (same) | Self (same) | ✓ |
| Users · role, approved, educator link, cycle, invite code | ✗ | ✗ ¹ | ✗ | ✗ ¹ | ✓ |
| Users · delete / unlock | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Practice logs** · read | ✗ | Own | ✗ | Own students' | All |
| Practice logs · create | ✗ | For self, published sets only | ✗ | For own students, published sets only | ✓ |
| Practice logs · update / delete | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Admin panel** (`/admin`) | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Bulk import** (`/import`) | ✗ | ✗ | ✗ | ✗ | ✓ |

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
| Student can't open educator or admin pages | `access.e2e.spec.ts` |
| CSRF: cookie from a non-browser client is ignored | `access.e2e.spec.ts` |
