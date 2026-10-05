<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Let's Talk English: project rules

IELTS Speaking practice app: Next.js 16 + Payload 3 + PostgreSQL. Start with `README.md` and `docs/architecture.md`.

- **Access rules live only in `src/collections/*.ts`** (helpers in `src/access/index.ts`). Don't re-implement them in
  pages. App code calls the Local API with `overrideAccess: false, user`; use `overrideAccess: true` only after an
  explicit role check in the same function (see `joinEducatorWithCode`, `startNewCycle`).
- Every page and server action starts with `requireUser([...roles])` from `src/lib/auth.ts`.
- Domain logic goes in `src/lib/` and takes `payload` as an argument so integration tests can call it directly.
- **Schema change:** edit the collection → `npm run generate:types` → `npm run migrate:create -- <name>` → commit
  `src/migrations/`. E2E tests run on migrations only, so a missing migration fails CI.
- Don't edit `src/app/(payload)/`, `src/payload-types.ts` or `src/migrations/*` by hand (generated).
- Update `docs/access-control.md` when an access rule changes, and add a test in `tests/int/access.int.spec.ts`.
- Before pushing: `npm run lint && npm run typecheck && npm run test:int` (Postgres must be running), and
  `npm run test:e2e` for UI changes.
