# Question set import format

Question sets can be imported in bulk from a **CSV file** (save a spreadsheet as CSV from Excel or Google Sheets) or
a **JSON file**. Use the **Bulk import** page (`/import`, admin only) or the command line
(`npm run import:sets -- file.csv`).

A ready-to-fill template is at [`public/question-sets-template.csv`](../public/question-sets-template.csv) (also on the
import page). The 20 sample sets in [`data/sample-question-sets.csv`](../data/sample-question-sets.csv) and
[`.json`](../data/sample-question-sets.json) show every field in use.

## CSV: one row per question set

The first row must contain the column names. Column names are not case-sensitive, and spaces or dashes are fine
("Question 1" = `question_1`).

| Column | Required | What to put in it |
|---|---|---|
| `category` | ✓ | The category name or slug, e.g. `Part 1` or `part-1`. It must already exist, unless "Create missing categories" is ticked. |
| `topic` | ✓ | The set's title, e.g. `Hometown` (max 200 characters). |
| `question_1` | ✓ | The first question. |
| `question_2`, `question_3`, … | | More questions, as many as needed. |
| `answer_1`, `answer_2`, … | | The sample answer for the question with the same number. Can span several lines. |
| `vocabulary` | | One entry per line: `word - meaning` (`:` or `=` also work). Entries can also be separated with `;`. A word on its own is fine too. |
| `tips` | | Free text. |
| `status` | | `draft` or `published`. Empty = the default chosen on the import page (draft unless you choose otherwise). |
| `code` | | A unique reference such as `P1-HOME-01`. Recommended: see "Importing again" below. |

Short forms are accepted: `q1`/`a1`, `title` for topic, `vocab`, `tip`, `reference` for code. A single `questions`
cell with one question per line also works when there are no numbered columns.

## JSON: a list of sets

```json
[
  {
    "code": "P1-HOME-01",
    "category": "Part 1",
    "topic": "Hometown",
    "questions": [
      { "question": "Where is your hometown?", "answer": "I'm from a mid-sized city…" },
      "A question without a sample answer?"
    ],
    "vocabulary": [
      { "term": "bustling", "meaning": "full of people and activity" },
      "laid-back - relaxed and calm"
    ],
    "tips": "Give a direct answer first, then add one reason.",
    "status": "published"
  }
]
```

The file can also be an object with a `sets` list: `{ "sets": [ … ] }`.

## What happens on import

1. **Check file** (recommended first): every row is validated and you see exactly what would happen. Nothing is saved.
2. **Import**: valid rows are saved. **Rows with problems are skipped and listed**; they never stop the other rows.

The report shows, per row: created, updated, skipped or error, with the reason.

| Message | Meaning |
|---|---|
| Topic is missing. / Category is missing. | Required column empty. |
| At least one question is needed. | No `question_N` (or `questions`) value. |
| Answer 3 has no matching question 3. | An answer without its question. |
| Category "X" does not exist… | Create it in the admin panel first, or tick "Create missing categories". |
| Status must be "draft" or "published" | Typo in the status column. |
| Code "X" is also used on row N. | Codes must be unique within the file. |
| A set called "X" already exists in Y. | Skipped to avoid a duplicate. Add a `code` to update it instead. |

## Importing again (updates)

If a row has a `code` that already exists, that set is **updated** (questions, vocabulary, tips, category, topic) instead
of a copy being created. Its status is kept unless the row has a `status` value. This means you can fix mistakes in
the spreadsheet and import the whole file again safely.

Rows without a code are created as new sets. If a set with the same topic already exists in the same category, the row
is skipped.

## Images

Images aren't part of the import. Add them to a set in the admin panel after importing.
