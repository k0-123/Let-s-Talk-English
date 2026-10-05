# Admin guide

For the person who runs Let's Talk English day to day. You manage everything from the **admin panel** at
`/admin`, plus the **Bulk import** page at `/import`.

## Logging in

- Open `/admin` (or log in on the normal login page; admins are taken to the admin panel automatically).
- **Very first time only:** on a brand-new installation, `/admin` asks you to create the first account. That account
  is the admin.
- The admin panel's left menu has two groups: **Content** (question sets, categories, media) and **People** (users,
  practice logs). At the bottom are links to **Bulk import** and **Open the app**.

## Overview

The admin dashboard opens with an **Overview**: educators waiting for approval (click to review them), students,
new accounts, students active in the last 7 days, sets practised this week, published sets and AI feedback used
today. Below it is a link to download **all practice logs as a CSV** file.

## Categories

**Content → Categories.** Students pick a category before they get new sets (by default IELTS Part 1, 2 and 3).

- **Name:** what students see. **Description:** optional one line under the name.
- **Order:** lower numbers are listed first.
- **Slug:** used in web addresses; filled in automatically.
- A category can only be deleted when it has no question sets.
- Categories with no published sets are hidden from students.

## Question sets

**Content → Question sets → Create new.**

| Field | Notes |
|---|---|
| Topic | The title students see. |
| Category | Required. |
| Status | **Draft** sets are invisible to students and educators. Set to **Published** when ready. |
| Questions | Add one row per question. Each can have a sample answer, which students reveal by tapping. |
| Vocabulary | Word and meaning pairs. |
| Tips | Free text. |
| Image | Optional. |
| Reference code | Optional unique code (e.g. `P1-HOME-01`). Bulk import uses it to update a set instead of duplicating it. |

**Unpublish rather than delete.** Setting a set back to Draft hides it but keeps every student's history. Deleting a
set also deletes all practice records for it.

To preview a set as students see it, open `/sets/<id>` in the app (the id is in the admin panel's address bar).

## Bulk import

Open **Bulk import** from the menu (`/import`).

1. Fill in the spreadsheet template (download it from the import page) and save it as CSV.
2. Choose the file and click **Check file**. Nothing is saved; you see what would happen and any problems row by row.
3. Fix problems in the spreadsheet if needed, then choose the file again and click **Import**.

Choose **Status for new sets** = Published if the sets should be visible straight away. Rows with errors are
skipped and listed; the rest are imported. Importing the same file again updates sets that have a reference code.
Full details are in [import-format.md](import-format.md).

## Educators

When an educator signs up, you get an email. They cannot log in until you approve them.

1. **People → Users.** Open the educator (filter or search by name or email).
2. Tick **Approved educator** and **Save**. The educator gets an email that they're approved.

Each educator has an **invite code** (shown on the user page, and on the educator's dashboard). Students enter it to
join that educator. To stop an educator, untick **Approved educator**: they can no longer log in.

## Students and other users

**People → Users** lists everyone. You can search by name, email or invite code.

| Task | How |
|---|---|
| A student never got the confirmation email | Ask them to use "Didn't get the email?" on the sign-up page or the login page. Or open the user, tick **Verified** and save. |
| Someone is locked out after too many wrong passwords | Wait 10 minutes, or open the user and click **Unlock**. |
| Someone forgot their password | They use "Forgot your password?" on the login page. |
| Move a student to a different educator | Open the student and change **Educator** (or the student enters the new educator's code). |
| Reset a student's practice cycle | The student does this from their History page. You can also change **Practice cycle** on the user. |
| Remove a user | Open the user → **Delete**. A student's practice history is deleted with them; an educator's students are unlinked. |

Only give the **Admin** role to people who should manage all content and users.

## Practice logs

**People → Practice logs** lists every practised or covered set: student, set, date, who marked it and the cycle.
It's mostly for checking. Deleting a log makes that set "new" again for the student in that cycle.

## AI feedback

Students can ask Claude for feedback on their answers once an Anthropic API key is set (see
[ai-feedback.md](ai-feedback.md) for setup and costs). **People → AI feedback** lists every request with its token
counts, which is how you can check what it costs.

## The phone app

Students and educators can also use the Android/iOS app. It uses the same accounts, so there is nothing to set up
per user, and everything they do in the app shows up here as usual. Admin accounts can't log in to the app: you
keep using the website. Installing and publishing the app is described in `mobile/README.md`.

## Emails

The app sends account confirmation, password reset, "educator waiting for approval" (to you) and "you're approved"
(to the educator). Until an email provider is configured, these are printed in the terminal running the app instead
of being sent; copy the link from there when testing locally.
