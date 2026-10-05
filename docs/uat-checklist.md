# UAT checklist (Phase 5)

For the client's acceptance testing with 3–5 real students and 1–2 educators, plus the PM/QA's device checks.
Until hosting is decided this runs on a local machine (see the README); emails then appear in the terminal running
the app instead of in an inbox.

For each step, tick **Pass**, or write what happened. Report anything unexpected with: the step number, device and
browser, what you expected, and what you saw (a screenshot helps).

**Bug severity:** **Critical**: data lost, someone sees data they shouldn't, or a core journey can't be completed.
**High**: a core journey works only with a workaround. **Medium**: wrong but not blocking. **Low**: cosmetic. V1 is
accepted with no open Critical or High bugs.

## Devices

Run the student journey on each:

| Device | Browser | Tester | Pass |
|---|---|---|---|
| Android phone | Chrome | | |
| iPhone | Safari | | |
| Laptop / desktop | Chrome | | |

## Student

| # | Step | Expected | Pass |
|---|---|---|---|
| S1 | Sign up as a student | "Check your email" page | |
| S2 | Try to log in before confirming | Told to confirm first, with a resend button | |
| S3 | Open the confirmation link | Taken to login with "Your email is confirmed" | |
| S4 | Log in | Practice page with the categories | |
| S5 | My educator → enter the educator's invite code | "You have joined …" | |
| S6 | Pick Part 1 | Up to 5 sets, and how many are left | |
| S7 | Open a set | Questions visible; answers, vocabulary and tips hidden until tapped | |
| S8 | Tap "Mark as practised" | Green "Practised on [today]" message and a "Next set" button | |
| S9 | Next set | The practised set is not in the list; the count went down by one | |
| S10 | History | The set, its category and today's date | |
| S11 | History → filter by category | Only that category's sets | |
| S12 | Practise every set in one category | "You have practised every set…" with other categories suggested | |
| S13 | Start a new practice cycle (confirm) | Every set is new again; the old history is still listed | |
| S14 | Log out, then "Forgot your password?" and follow the link | Can set a new password and log in with it | |
| S15 | Type /educator, then /admin, in the address bar | /educator sends you back to the practice page; /admin shows a "not allowed" page | |

### Version 4 (student)

| # | Step | Expected | Pass |
|---|---|---|---|
| S16 | Open Home after practising | Weekly goal ring, streak, calendar and "progress by part" show today's practice | |
| S17 | Open a Part 2 set, start the timer | 1-minute prep countdown, then 2-minute speaking timer; a beep at each change | |
| S18 | Record an answer and play it back | The browser asks for the microphone once; playback works; nothing is uploaded | |
| S19 | Speak or type an answer, tap "Get AI feedback" | A band estimate, comments, a stronger answer and phrases (needs an API key) | |
| S20 | Rate confidence 1–5 and mark as practised | History shows the confidence rating | |
| S21 | Me → Appearance → Dark | The whole app switches to dark and stays dark after reload | |

## Educator

| # | Step | Expected | Pass |
|---|---|---|---|
| E1 | Sign up as an educator and confirm the email | Confirmation works | |
| E2 | Try to log in | "Waiting for approval" | |
| E3 | (Admin approves, see A4) Log in | Dashboard with an invite code; approval email received | |
| E4 | Give the code to a student (S5) and reload | The student appears with sets done and last active date | |
| E5 | Open the student → History | The sets they practised, with dates; category filter works | |
| E6 | Not done yet → pick a category | Sets the student hasn't done | |
| E7 | Mark one as covered | It disappears from "Not done yet" and appears in History as "Covered with educator" | |
| E8 | As the student, open that category | The covered set is not offered | |
| E9 | Open a set from "Not done yet" and use it in a live session, then "Mark as covered" | Recorded for that student | |
| E10 | A second educator logs in | Sees only their own students | |

### Version 4 (educator)

| # | Step | Expected | Pass |
|---|---|---|---|
| E11 | Students list: search and sort by "needs attention" | Inactive and slipping students first, with status labels and 8-week lines | |
| E12 | Student → Not done yet → tick 2 sets, set a due date and note → Assign | "2 sets assigned"; the student sees them on Home | |
| E13 | Student practises an assigned set | It shows as Done under Assignments | |
| E14 | Student → Notes → add a note | Saved; the student cannot see it | |
| E15 | Export CSV on the Students page | A spreadsheet of your students and their progress | |

## Admin

| # | Step | Expected | Pass |
|---|---|---|---|
| A1 | Log in at /admin | Admin panel | |
| A2 | Create a category and a set (as Draft) | A student can't see the draft set | |
| A3 | Publish the set | Students can now get it | |
| A4 | Approve an educator (tick "Approved educator", save) | The educator can log in and gets an email | |
| A5 | Bulk import → download template → fill 3 rows (one with a wrong category) → Check file | 2 OK, 1 error explained; nothing saved yet | |
| A6 | Import | 2 sets created, the bad row listed | |
| A7 | Change a row (same code) and import again | That set is updated, not duplicated | |
| A8 | Import the real question bank | Every set imported or explained in the report | |
| A9 | Tick "Verified" for a user who didn't get their email | They can log in | |
| A10 | Lock an account (5 wrong passwords), then Unlock it | They can log in again | |

## Sign-off

| | Name | Signature | Date |
|---|---|---|---|
| Client | | | |
| PM / QA | | | |
