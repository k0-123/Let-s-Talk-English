# AI feedback

Students can ask Claude for feedback on their answer to any question: an **estimated band** with scores and
comments for fluency and coherence, vocabulary and grammar, what went well, what to improve, a stronger version of
their own answer, and phrases to learn. The app always says it is an estimate, not an official IELTS score.

## How it works

1. On a set, the student records their answer (the browser transcribes it where it can) or types it.
2. They tap **Get AI feedback**. Only the **text** is sent, never audio.
3. The server checks the student, the set (must be published), the answer length (20–2,000 characters) and the
   daily limit, then calls Claude (`claude-opus-5-5`) with a fixed examiner prompt and asks for a strict JSON
   structure (structured outputs), so every response has the same shape.
4. The result is saved (`ai-feedback` collection) and shown to the student. Their educator can read it too, on
   the student's "AI feedback" tab.

Code: `src/lib/ai-feedback.ts` (request, checks, storage), `src/lib/ai-feedback-schema.ts` (the shape),
`src/components/speaking/` (the UI).

## Switching it on

Set these in `.env` and restart:

| Variable | Default | Meaning |
|---|---|---|
| `ANTHROPIC_API_KEY` | (none) | Turns AI feedback on. Without it, the button is hidden everywhere. |
| `AI_DAILY_LIMIT` | `10` | Feedback requests per student per day (resets at midnight, app time zone). |
| `AI_EFFORT` | `medium` | How hard Claude thinks: `low`, `medium` or `high`. Higher is slower and costs more. |

`AI_FAKE=true` returns a built-in, made-up response without calling the API. It is used by the automated tests
and the demo seed. Never set it in production.

## Cost

Claude Opus 5.5 costs $4 per million input tokens and $20 per million output tokens (October 2026 prices; check
Anthropic's pricing page). One feedback request reads roughly 700–1,000 tokens and writes roughly 1,000–2,500
(the feedback plus Claude's thinking), so expect **about $0.03–0.06 per request** (₹2.5–5). The system prompt is
cached, which trims the input cost of repeat requests.

Each saved feedback row records `inputTokens` and `outputTokens`, so real costs can be measured after launch
(admin panel → People → AI feedback). With the default limit of 10 per day, one very active student costs at most
around $0.60 per day; typical use is far lower.

## Safety and privacy

- If Claude declines a request, the app automatically retries on a fallback model (server-side fallback); if that
  also declines, the student sees "Feedback could not be given for this answer".
- Answers are sent to Anthropic's API only when the student asks for feedback. Mention this in the privacy policy
  (the draft at `/privacy` already does).
- Students cannot create or edit feedback rows through the API: only the server writes them, after its checks.
