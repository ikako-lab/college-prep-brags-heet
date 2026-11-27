# Brag Sheet Interviewer — project handoff

## What this is
A web app where a middle- or high-school student **talks** to an AI college counselor. The counselor interviews them, a note-taker saves the facts into a notebook ("My story"), and the app produces a 1–2 page **brag sheet** for counselors and teachers who write recommendation letters. It's for home use: the owner's own kids are the testers.

The interview structure comes from two templates in the owner's Dropbox: `/_CLAUDE/Code Projects/brag-sheet/sources/` (Discovery Workbook with 63 questions + Experience Evidence Card, and the 2-page Summary Template). The app has since gone beyond the template (Activities & honors list, "at a glance" section).

## Where the app lives
- **Lovable project** "BragStoryMaker", id `3b840d5b-e3ba-4338-8c2c-5a2158a6a032`, workspace KOAGO (`VWdYCsAfArYQBeXhcPJw`).
  - Editor: https://lovable.dev/projects/3b840d5b-e3ba-4338-8c2c-5a2158a6a032
  - Published site: https://bragstorymaker.lovable.app (sign-in at `/auth`).
  - Stack: TanStack Start (React, TypeScript, Tailwind, shadcn), Lovable Cloud (Supabase) for auth, database and server routes.
- All changes are made by **sending instructions to Lovable** (`mcp__Lovable__send_message`), then checking with `get_message`, `get_diff`, `read_file`, `grep_files` and `query_database`. Code in this GitHub repo is NOT the app.
- Changes reach the kids only after the owner **re-publishes** in the Lovable editor (Publish → Update). Always remind them.
- This repo's `server/` and `public/` folders hold an early local prototype that was never finished and isn't used. Keep it only for reference.
- `.claude/settings.json` allows all Lovable tools (`"mcp__Lovable"`) without prompting.

## How to work with Lovable (learned)
- Send with `wait: false`, then poll `get_message` (≤55 s waits) or schedule a check-in with `send_later` (~8–12 min for big changes). Don't send a second message while one is running; it can interrupt.
- `get_message` / `get_diff` results are often too big: they get saved to a file; extract with `jq` + strip `<lov-tool-use>` blocks with Python.
- Always tell Lovable: "Don't publish", "use only fake data in tests", which prompts must stay byte-identical, and to reply briefly with test results.
- Verify yourself afterwards (diff, DB queries). Lovable's self-reports have been accurate so far but check data changes (e.g. hash `notes.text` before/after backfills).
- Typical cost: 2–10 Lovable credits per change.
- Real billed costs can't be pulled from here: Anthropic Admin keys can't be saved as a network secret for this environment, and Gemini has no usage API. `ai_usage` holds real token counts per call; costs are tokens × `model_prices`.

## Key files in the Lovable project
- `src/lib/server/llm.ts`: provider layer (anthropic, openai, google, perplexity), `streamChat`, `generateJson`, `geminiTts`, `listModels`.
- `src/lib/server/prompts.ts`: `COUNSELOR_PROMPT`, `NOTE_TAKER_PROMPT`, `BRAG_SHEET_PROMPT`, `JUDGE_PROMPT` + JSON schemas. Keep prompts byte-stable unless intentionally changed (prompt-cached).
- `src/lib/server/status.ts`: notebook status sent to the counselor (current grade line, notes per section, Activities & honors coverage with EMPTY categories).
- `src/lib/student-grade.ts`: current grade from grad year (US school year, July rollover).
- `src/lib/listening.ts`: pause options, `turnWait` (doubles wait after "and/um/…" or <4 words), `micAction`, `hasUnsent`.
- `src/lib/voice-player.ts`: `SentenceChunker` (first chunk early, later chunks ≥20 words), `VoiceQueue` (2-clip prefetch, 1.2×), circuit breaker to browser voice.
- `src/lib/pcm-clean.ts`: strips Gemini's WAV header/C2PA metadata, removes DC, trims, fades (fixed the "buzz" between sentences). `src/lib/tts-body.ts`: TTS request = text only (no style prefix; it was being read aloud).
- `src/lib/brag-sheet.ts` + `sheetIssues()` checker (placeholders, provenance tags, word limits, repeated facts).
- `src/hooks/use-interview-scroll.ts`: keeps streaming replies above the sticky mic panel; "↓ New" pill.
- `src/routes/api/*`: `interview` (SSE), `take-notes`, `generate-brag-sheet`, `tts`, `voice-config`, `admin/*` (models, compare, interviewer-test).
- `src/routes/_authenticated/interview.tsx`: voice conversation (Web Speech API in, Gemini TTS out). Round amber "I'm not done" / blue "Send now" buttons beside the mic during the send countdown; "Tap when done" mode.
- `src/routes/_authenticated/notebook.tsx`: "My story so far" with tabs Profile · Activities · Cards · Notes (`?tab=`), add dialogs, notes accordion + search, "Check this" flags.
- `src/routes/_authenticated/brag-sheet.tsx`: generate/edit/print; "Name on this sheet", current grade, prepared date; empty fields and `[Need…]` hidden in print.
- `src/routes/_authenticated/settings.tsx`: admin Models / Prices / Usage / Compare / Testers tabs.
- `src/lib/interviewer-tests.ts`: interviewer test cases (incl. middle-school, inventory-before-depth) and rule checks.

## Database (Supabase, every table has RLS)
`profiles` (first_name, grade, grad_year, school…), `chat_messages`, `notes` (text = tagged original for the writer; display_text = first-person shown to student; needs_check), `experience_cards`, `activity_items` (category club/sport/arts/service/work/family/summer/independent/honor, name, role, grades, hours/weeks, details, is_private; owner-only RLS), `recommenders`, `brag_sheets`, `ai_settings` (one row per role: interviewer, note_taker, brag_sheet, voice), `model_prices`, `ai_usage`, `ai_presets`, `compare_runs`, `user_roles` (admin), `allowed_emails` (invite-only sign-up), `app_limits` (daily $1/student, monthly $30/app), `feedback`, `message_feedback` (thumbs).

## Current model choices (based on tests)
- Interviewer: `claude-sonnet-5-5`, effort low (~91 avg in tests; Haiku stacked questions).
- Note-taker: `claude-haiku-5-5`, effort medium (also writes display_text, needs_check, activity_upserts).
- Brag sheet writer: `claude-sonnet-5-5`, effort medium, max_tokens 16000 (owner's choice on 2026-11-27 "for now"; was Opus high. 8000 tokens ran out at Opus high: thinking counts against the limit).
- Voice: `gemini-3.8-flash-tts`, voice "Kore", 1.2×. It returns WAV (not raw PCM) — `pcm-clean` handles it.
- Measured cost (owner test 2026-11-25, 55 answers): $0.48 total ≈ $0.009/answer (counselor 67%, voice 25%, notes 8%); ~$0.26 per 30-answer session. Counselor first token ~0.8 s, first audio ~4.6 s.

## Gotchas learned
- Current Claude models reject `temperature`/`top_p`. Never send sampling params to Anthropic.
- Gemini TTS: don't put instructions in the text (it speaks them); output is WAV with trailing metadata (must strip).
- Gemini free tier hit 429s; billing is on (paid tier = no training on data). Gemini Flash/TTS prices roughly double on 2027-01-01: update `model_prices` then.
- The interviewer-test judge must see the fake notebook status, otherwise it flags known facts as "invented".
- Kids pause to think: send delay default 3 s, doubled after continuation words; "I'm not done" keeps unsent speech (never discard it).
- The counselor tends to go deep on one activity; the prompt now does a quick inventory first (clubs, service, jobs/family, arts, summer, honors) and moves on after ~4 follow-ups.
- Brag sheet must not show provenance tags, `[Need:]` placeholders, other students' names, guessed quotes, or repeat facts; `sheetIssues()` checks this.

## Status (as of 2026-11-26)
- Latest Lovable commit: `0bff1739` (failed calls that hit the output limit or refuse now log real tokens and cost via `LlmStopError`; Compare tab allows 16000 tokens for brag sheets; `test-output/brag-effort-compare.json` holds a fake 36-note notebook and 4 Opus outputs). **Not yet published** at time of writing: scrolling fix, notebook tabs + add dialogs, "My story" first-person notes, usage-logging fix. Remind the owner to Publish → Update.
- Existing brag sheets were made with old instructions: students must click Generate again (and add last name).
- Brag sheet effort test (2026-11-26, fake 36-note notebook, 2 runs each): Opus high ≈ 52 s / $0.15, Opus medium ≈ 28 s / $0.087, quality equivalent on reading. Switch to medium was recommended; check `ai_settings` for what the owner chose. Same notebook at medium effort (`test-output/brag-model-compare.json`): Sonnet ≈ 30 s / $0.05–0.06, close to Opus but more defensive disclaimers; Haiku ≈ 38 s / $0.005, within word limits but thin, fragment-style and with small factual distortions (not recommended). Gemini on the same notebook, default thinking (`test-output/brag-gemini-compare.json`): Carbon 2–3 min / $0.18–0.27, polished but slow; Neon ran out of 16000 output tokens twice ($0.25 each, no sheet); Argon 24 s / $0.05, good but only one run completed (second lost to a 600 s script timeout); Hydrogen ≈ 60 s / $0.09, within word limits but compressed, with small invented details. Gemini sheets read more adult/résumé-like and add small unsupported details; none beat Opus medium. Keep Lovable test scripts under 600 s total (run slow models in separate batches). The Haiku price in `model_prices` ($0.10/$0.50 per M) looks too low and is unverified.
- Known open issues: on large notebooks the brag sheet runs 810–890 narrative words against the 600/750 limits at both efforts (`sheetIssues()` flags it); interviewer still occasionally joins two asks in one sentence (~3/10 test replies); one test reply exceeded the length limit.
- Optional ideas not done: safety check-in question ("are you safe right now?") in crisis replies; Gemini Live (audio-to-audio) interviewer; Common App export (activities list maps to 10 activities / 5 honors).

## Working style with the owner
- The owner tests on phones with their kids and reports issues; read the real transcripts/notes in the DB to diagnose before proposing fixes.
- Explain changes in plain language with costs; recommend one option. Small fixes: just send them. Bigger design changes: propose and ask first.
- Privacy: the users are minors. Don't put the kids' names or conversation content in external requests, in Lovable messages, or in this repo. Lovable tests use fake data only.
