# Changelog

## 4.0.0

A redesign and a big step up for students, educators and the admin.

### Students
- **Home dashboard:** weekly goal ring, day streak, practice calendar (last 16 weeks), progress by part,
  sets assigned by the educator, recent practice and a getting-started checklist.
- **Speaking tools on every set:**
  - Part 2 timer: 1 minute to prepare (with a notes box), then 2 minutes to speak, with beeps and vibration.
  - Record your answer and play it back. Recordings stay on the device.
  - Live transcript while you speak (in supporting browsers), or type your answer.
- **AI feedback (Claude):** an estimated band, scores and comments for fluency, vocabulary and grammar, what
  went well, what to improve, a stronger version of your own answer, and phrases to learn. A daily limit per
  student; off until an API key is configured.
- **Confidence rating** and speaking time are saved with each practised set and shown in history.
- AI feedback history, account page (name, weekly goal, theme, password, log out everywhere).

### Educators
- Class overview: students practising this week, sets this week, students who need a nudge.
- Student list with search, sorting, activity status (active / slipping / inactive) and 8-week sparklines.
- Student page with tabs: overview, history, not done yet, assignments, private notes and AI feedback.
- **Assignments:** tick sets to assign with an optional due date and note; done is detected automatically.
- **Private notes** per student, visible only to their author.
- **CSV export** of the class and of each student's history; invite code Copy and Share buttons.

### Admin
- Usage overview on the admin dashboard: pending educators, sign-ups, active students, sets practised, AI
  usage, most practised parts, and an all-practice-logs CSV export.

### Everyone
- New design system with dark mode, a bottom tab bar on phones, toasts, loading skeletons and error pages.
- New landing page, privacy and terms drafts.

### Under the hood
- New collections: assignments, student notes, AI feedback (with access rules and tests); migration `v4`.
- 33 new integration tests and 10 new end-to-end tests.

## 1.0.0

First version: practice with the never-repeat rule, history and cycles, educator linking and dashboard, admin
panel with bulk import, and automated tests.
