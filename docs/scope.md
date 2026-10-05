# Let's Talk English V1: scope

**Draft for client review and signature.** Placeholders in **[BRACKETS]** are still to be agreed.

| | |
|---|---|
| Client | **[CLIENT_NAME]** |
| Budget | **[CLIENT_BUDGET]** |
| Payment milestones | **[PAYMENT_MILESTONES]** |
| Launch date | **[LAUNCH_DATE]** |
| Hosting | Not decided yet (**[HOSTING_ACCOUNT]**, **[DOMAIN]**) |

## The one thing V1 must do

A student practises a question set, the system records it, the educator can see it, and that set is not shown to
the student again.

## What V1 includes

**Students** sign up with email and password and confirm their email. They join their educator with an invite code,
pick a category, and get up to 5 question sets they haven't practised. A set shows its questions first; sample
answers, vocabulary and tips open on tap. **Mark as practised** saves the set to the student's history with the
date, and it is never offered again in that cycle. Students can see their history, and start a new practice cycle
when preparing for another test.

**Educators** sign up and wait for the admin's approval. Once approved, they get an invite code to share. They see
only their own students: how many sets each has done, when they were last active, their full history, and the sets
they haven't done yet. They can mark a set as covered after a live session.

**The admin (client)** manages question sets and categories in an admin panel, imports sets in bulk from a
spreadsheet (CSV) or JSON file with a per-row error report, approves educators, and manages users.

The app is a responsive website that works on phones and computers. It is free to use.

## Assumptions (please confirm)

1. "Practise" means the student reads the set and taps **Mark as practised**. No audio recording.
2. A student joins an educator with an **invite code**. One educator per student.
3. Educators can also mark a set as covered for a student (for live sessions).
4. The client is the only **admin** and manages all question sets.
5. Educator accounts need **admin approval** before they can log in or see content.
6. A student can **reset** their history to start a new preparation cycle.
7. The app is free for everyone. No payments.

## Details we chose during the build (please confirm or change)

- **Answers:** each question can have its own sample answer. Vocabulary is a list of "word – meaning" pairs. Tips are
  free text. One optional image per set.
- **Categories:** IELTS Speaking Part 1, Part 2 and Part 3 by default (**[CATEGORY_LIST]** to confirm). The admin can
  add more at any time.
- **Batch size:** 5 new sets at a time per category.
- **Revision:** students can reopen sets from their history. Practised sets still never appear in "new sets" again.
- **Changing educator:** a student can enter a new educator's code to switch; their history moves with them.
- **New cycle:** resetting applies to every category at once. Earlier practice stays visible in the history.
- **Emails:** account confirmation, password reset, "new educator waiting for approval" (to the admin) and "your
  account is approved" (to the educator). No other notifications.
- **Protecting the question bank:** everything requires a login; educators need approval; the app hands out content in
  small batches and limits how fast one account can read it; repeated failed logins lock the account for 10 minutes.

## Content the client provides

- 20 sample question sets in their real format (**[QUESTION_DATA_FORMAT]**) during Phase 0.
- The full question bank (500+ sets) before Phase 4 ends, using the agreed template
  (see [import-format.md](import-format.md)).
- Privacy policy and terms text.

## Out of scope for V1

IELTS Writing, human evaluation of answers, uploading or storing audio on the server, payments and subscriptions,
more than one educator per student, and notifications beyond the emails listed above.

**Added after V1 (version 4):** AI feedback on answers (text only; the client pays Anthropic per request, see
[ai-feedback.md](ai-feedback.md)), in-browser recording that stays on the device, progress dashboards,
assignments, private educator notes and CSV exports, and a native Android/iOS app for students and educators
([mobile-app-plan.md](mobile-app-plan.md)). Publishing the app needs the client's own Google Play and Apple
developer accounts.

Any new request goes through a written change request with its own price and timeline.

## Testing and acceptance

- Automated tests cover the student, educator and admin journeys and the access rules.
- UAT: the client tests with 3–5 real students and 1–2 educators over a fixed **3 working day** window, using
  [uat-checklist.md](uat-checklist.md). Feedback after the window is treated as post-launch support or a change request.
- V1 is accepted when every item in the V1 Definition works on the production domain and there are no open critical
  or high bugs.
- After launch: 2 weeks of bug-fix support.

## Sign-off

| | Name | Signature | Date |
|---|---|---|---|
| Client | | | |
| Delivery lead | | | |
