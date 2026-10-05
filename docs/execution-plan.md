# Let's Talk English: V1 Execution Plan

| | |
|---|---|
| **Project** | Let's Talk English, an IELTS Speaking practice and student-tracking web app |
| **Project type** | Role-based CRUD web app (student, educator, admin) |
| **Target platform** | Responsive web app, mobile-first. No native apps in V1 |
| **Primary language** | TypeScript |
| **Duration** | 5 weeks build, plus 2 weeks post-launch bug support |
| **Team** | 1 full-stack developer, 1 PM/QA (part-time), client as content owner |
| **Budget** | **[CLIENT_BUDGET]** (not yet shared by client) |
| **Launch date** | **[LAUNCH_DATE]** |

**The one thing V1 must do:** a student practises a question set, the system records it, the educator can see it, and that set is not shown to the student again.

## Assumptions to confirm with the client

These are not in the brief. Each one changes scope, so lock them in Phase 0.

1. "Practise" means the student reads the set and taps **Mark as practised**. No audio recording.
2. A student joins an educator with an **invite code**. One educator per student in V1.
3. Educators can also mark a set as covered for a student (for live sessions).
4. The client is the only **admin** and manages all question sets.
5. Educator accounts need **admin approval** before they can see content.
6. A student can **reset** their history to start a new preparation cycle.
7. The app is free for everyone. No payments in V1.

---

## 1. Phase Breakdown

| # | Phase | When | Goal | Exit gate |
|---|---|---|---|---|
| 0 | Requirements and scope lock | Week 1, days 1–3 | Close every open question above | Signed scope document |
| 1 | Tech stack and architecture | Week 1, days 4–5 | Data model, access rules and environments ready | Empty app deployed to staging |
| 2 | Sprint 1: Foundation | Week 2 | Auth, roles, admin panel, content import | Client can log in as admin and see imported sets |
| 3 | Sprint 2: Student flow | Week 3 | Practice, tracking and non-repeat logic | A student can complete the full practice loop |
| 4 | Sprint 3: Educator flow and polish | Week 4 | Educator dashboard, linking, UI polish | All 10 requested features work on staging |
| 5 | Testing and UAT | Week 5, days 1–3 | Find and fix defects, client sign-off | Zero open critical or high bugs |
| 6 | Deployment and handover | Week 5, days 4–5 | Live on production domain | Client accepts V1 |
| 7 | Post-launch support | Weeks 6–7 | Fix bugs found by real users | Support window closed |

---

## 2. Milestone Checklist

### Phase 0: Requirements and scope lock
- [ ] Kickoff call with client; walk through the 7 assumptions above
- [ ] Receive 20 sample question sets in their real format: **[QUESTION_DATA_FORMAT]**
- [ ] Agree the category structure: **[CATEGORY_LIST]** (for example IELTS Part 1 / 2 / 3, or by topic)
- [ ] Agree one fixed template for a question set (topic, questions, answers, vocabulary, tips, optional image)
- [ ] Write a one-page scope document with an explicit out-of-scope list
- [ ] Agree payment milestones and get scope signed

### Phase 1: Tech stack and architecture
- [ ] Repository, branching rules and CI set up
- [ ] Staging and production environments created on **[HOSTING_ACCOUNT]**
- [ ] Data model finalised (see below)
- [ ] Access-control matrix written (who can read and write what)
- [ ] Low-fidelity wireframes for the 9 screens approved by client
- [ ] Skeleton app deployed to staging

**Data model**

| Collection | Key fields |
|---|---|
| `users` | name, email, password, role (admin / educator / student), educator (for students), inviteCode and approved (for educators) |
| `categories` | name, slug, order |
| `questionSets` | topic, category, questions[], answers, vocabulary, tips, image (optional), status (draft / published) |
| `practiceLogs` | student, questionSet, practisedAt, markedBy (student / educator), cycle |

**Core rule:** a unique constraint on (student, questionSet, cycle). The "next sets" query returns published sets in the chosen category that have no log for the student's current cycle, limited to 3–5.

### Phase 2: Sprint 1, Foundation
- [ ] Registration, login, logout, email verification, password reset
- [ ] Three roles with access rules enforced on the server
- [ ] Admin panel: create, edit, publish and unpublish question sets and categories
- [ ] Bulk import tool for question sets with validation and an error report
- [ ] All 20 sample sets imported cleanly
- [ ] **Demo 1 to client**

### Phase 3: Sprint 2, Student flow
- [ ] Student home: pick a category, see 3–5 new sets
- [ ] Question set page: questions first, answers / vocabulary / tips revealed on tap
- [ ] **Mark as practised** button writes a practice log with the date
- [ ] Practised sets never reappear in the "new sets" list
- [ ] Student history page: topic, category, date
- [ ] "All sets completed" state and the reset-cycle action
- [ ] **Demo 2 to client**

### Phase 4: Sprint 3, Educator flow and polish
- [ ] Educator signup, admin approval, and invite code generation
- [ ] Student joins an educator by entering the code
- [ ] Educator dashboard: list of their students with sets completed and last active date
- [ ] Per-student history view, filterable by category
- [ ] Educator can mark a set as covered for a student
- [ ] Educator can browse sets a given student has not yet done
- [ ] Mobile layout pass on every screen
- [ ] Full question bank (500+ sets) imported
- [ ] **Demo 3 to client: feature complete**

### Phase 5: Testing and UAT
- [ ] End-to-end tests for the three core journeys (student, educator, admin)
- [ ] Access-control tests: an educator cannot see another educator's students; a logged-out user cannot see any set
- [ ] Manual testing on Android Chrome, iPhone Safari and desktop Chrome
- [ ] Client UAT with 3–5 real students and 1–2 educators
- [ ] All critical and high bugs fixed and retested
- [ ] Written UAT sign-off from client

### Phase 6: Deployment and handover
- [ ] Production deploy on **[DOMAIN]** with SSL
- [ ] Email sending domain verified (SPF, DKIM)
- [ ] Daily automated database backups, with one restore tested
- [ ] Error monitoring and uptime alerts live
- [ ] Admin guide (short written guide or screen recording) delivered
- [ ] Credentials and repository access handed over
- [ ] Privacy policy and terms pages published (text supplied by client)

### Phase 7: Post-launch support
- [ ] Bug fixes for 2 weeks
- [ ] Review usage after 2 weeks: signups, sets practised per student, active educators
- [ ] Backlog of V2 requests prioritised with client

---

## 3. Tech Stack Recommendations

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router), TypeScript | One codebase for front end and API; fast to build |
| Back end and admin | Payload CMS | Auth, role-based access and a ready admin panel for question sets, which removes roughly a third of the build |
| Database | PostgreSQL | Relational data with a uniqueness rule; handles this scale easily |
| UI | Tailwind CSS with shadcn/ui | Clean, consistent interface without custom design work |
| Email | Transactional email service (for example Resend or Brevo) | Verification and password reset emails |
| Hosting | Single VPS, or Vercel with managed Postgres, on **[HOSTING_ACCOUNT]** | Roughly ₹1,500–3,000 per month at this scale |
| Media | Local disk or S3-compatible storage | Only needed for optional images |
| Testing | Playwright (end-to-end), Vitest (unit) | Covers the core journeys and the non-repeat rule |
| Monitoring | Sentry plus an uptime monitor | Catch errors before the client reports them |

**Why this fits the future roadmap:** a `type` field on `questionSets` later supports Writing; Payload's API can serve a mobile app; a `plan` field on `users` later supports subscriptions. None of this needs to be built now.

---

## 4. Risk Mitigation

| Risk | Impact | Resolution |
|---|---|---|
| Question sets arrive as inconsistent plain text | Import takes days of manual cleanup | Agree one template in Phase 0; test with 20 real samples before Sprint 1; importer reports bad rows instead of failing |
| Client delivers content late | Launch slips | Make the full question bank a dependency of Phase 4; build and test with the 20 samples |
| Scope creep (AI evaluation, audio, payments) | Budget and timeline overrun | Signed out-of-scope list; every new request goes through a priced change request |
| Access rules misconfigured | One educator sees another's students, or content is public | Server-side access rules only; automated access tests in Phase 5 |
| Question bank copied or scraped | Client loses his main asset | Content behind login, educator approval, small batches per request, rate limiting |
| Student uses up all sets in a category | Empty screen, student stops using the app | Clear "all done" state, suggest another category, offer reset |
| Students practise but forget to mark sets | History is incomplete, educator repeats questions | Prominent button at the end of each set; educator can mark sets too |
| Verification emails land in spam | Students cannot activate accounts | Verified sending domain; resend option; admin can verify a user manually |
| Slow UAT feedback from client | Launch slips | Fixed 3-day UAT window written into the scope document |
| Free product with no revenue | Client cannot fund hosting or V2 | Keep running costs low; track usage from day one to support the monetisation decision |

---

## 5. V1 Definition

V1 is complete when all of the following work on the production domain.

**Student**
- [ ] Can register, verify email, log in and reset a password
- [ ] Can join an educator with an invite code
- [ ] Can pick a category and get 3–5 sets they have not practised
- [ ] Can open a set and see questions, answers, vocabulary and tips
- [ ] Can mark a set as practised; it is recorded with the date and never shown again in the current cycle
- [ ] Can see their own practice history

**Educator**
- [ ] Can register and, once approved, log in
- [ ] Can see only their own students
- [ ] Can view each student's history: which sets, which dates
- [ ] Can see which sets a student has not done, and mark a set as covered

**Admin (client)**
- [ ] Can add, edit, publish and bulk-import question sets
- [ ] Can manage categories
- [ ] Can approve educators and manage users
- [ ] Has all 500+ question sets live

**Quality**
- [ ] Usable on a phone browser and on desktop
- [ ] No open critical or high bugs
- [ ] Backups, monitoring and SSL in place
- [ ] Client has signed off UAT

**Out of scope for V1**

IELTS Writing, AI or human evaluation, audio recording, Android / iOS apps, payments and subscriptions, multiple educators per student, notifications, analytics dashboards.
