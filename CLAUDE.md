# Brag Sheet Interviewer — project handoff

## What this is
A web app where a middle- or high-school student **talks** to an AI college counselor. The counselor interviews them, a note-taker saves the facts into a notebook, and the app produces a 1–2 page **brag sheet** for counselors and teachers who write recommendation letters. It's for home use: the owner's own kids are the testers.

The app's interview structure comes from two templates in the owner's Dropbox: `/_CLAUDE/Code Projects/brag-sheet/sources/` (Discovery Workbook with 63 questions + Experience Evidence Card, and the 2-page Summary Template).

## Where the app lives
- **Lovable project** "BragStoryMaker", id `3b840d5b-e3ba-4338-8c2c-5a2158a6a032`, workspace KOAGO (`VWdYCsAfArYQBeXhcPJw`).
  - Editor: https://lovable.dev/projects/3b840d5b-e3ba-4338-8c2c-5a2158a6a032
  - Stack: TanStack Start (React, TypeScript, Tailwind, shadcn), Lovable Cloud (Supabase) for auth, database and server routes.
- All changes are made by **sending instructions to Lovable** (`mcp__Lovable__send_message`), then checking with `get_message`, `read_file` and `query_database`. Code in this GitHub repo is NOT the app.
- Changes reach the kids only after the owner **re-publishes** in the Lovable editor (Publish → Update). Always remind them.
- This repo's `server/` and `public/` folders hold an early local prototype that was never finished and isn't used. Keep it only for reference.

## Key files in the Lovable project
- `src/lib/server/llm.ts`: provider layer (anthropic, openai, google, perplexity), `streamChat`, `generateJson`, Gemini TTS, `listModels`.
- `src/lib/server/prompts.ts`: `COUNSELOR_PROMPT`, `NOTE_TAKER_PROMPT`, `BRAG_SHEET_PROMPT`, `JUDGE_PROMPT` and their JSON schemas. Keep prompts byte-stable (they're prompt-cached).
- `src/routes/api/*`: `interview` (SSE), `take-notes`, `generate-brag-sheet`, `tts`, `voice-config`, `admin/*` (models, compare, interviewer-test).
- `src/routes/_authenticated/interview.tsx`: voice conversation mode (Web Speech API in, Gemini TTS out, VoiceQueue).
- `src/routes/_authenticated/settings.tsx`: admin Models / Prices / Usage / Compare / Testers tabs.
- `src/lib/interviewer-tests.ts`: interviewer test cases and rule checks.

## Database (Supabase, every table has RLS)
`profiles`, `chat_messages`, `notes`, `experience_cards`, `recommenders`, `brag_sheets`, `ai_settings` (one row per role: interviewer, note_taker, brag_sheet, voice), `model_prices`, `ai_usage`, `ai_presets`, `compare_runs`, `user_roles` (admin), `allowed_emails` (invite-only sign-up), `app_limits` (daily/monthly caps), `feedback`, `message_feedback` (thumbs).

## Current model choices (based on tests)
- Interviewer: `claude-sonnet-5-5`, effort low. Scored 91.8 vs Haiku 87.9. Haiku stacked two questions in one reply and framed 988 badly.
- Note-taker: `claude-haiku-5-5`, effort medium. 100% facts captured at ~$0.0014/call. Sonnet costs ~10× more.
- Brag sheet writer: `claude-opus-5-5`, effort high.
- Voice: Gemini TTS, voice "Kore", speed 1.2×. `gemini-3.8-flash-tts` ($9/1M audio) and `gemini-3.8-flash-lite-tts` ($6/1M) were being compared; older `gemini-2.5-flash-preview-tts` is $10/1M.
- Estimated cost: ~$0.12–0.25 per 30-answer session.

## Gotchas learned
- Current Claude models reject `temperature`/`top_p`. Never send sampling params to Anthropic (this caused the first outage).
- Gemini free tier hit 429 limits; billing is now enabled on the Gemini key (paid tier also means Google doesn't train on the data).
- Gemini prices: Flash models and TTS go up on 2027-01-01 (roughly double). Update `model_prices` then.
- The judge in interviewer tests must see the fake notebook status, otherwise it flags known facts as "invented".
- Kids get cut off by silence detection when they pause to think. Keep the send delay generous.

## Open items (as of 2026-11-23)
- Lovable was asked (not yet verified) to:
  1. lengthen the voice send delay (default 3 s, smart extension, "I'm not done" / "Send now", "Tap when done" mode);
  2. make the counselor grade-aware (a 7th grader was treated as high school; onboarding now asks current grade);
  3. make the thumbs up/down and Feedback button visible.
  After it's done: verify, then remind the owner to re-publish.
- Optional ideas not done: a safety check-in question ("are you safe right now?") in crisis replies; Gemini Live (audio-to-audio) as an alternative interviewer.

## Working style with the owner
- The owner tests on phones with their kids and reports issues; read the real transcripts in `chat_messages` to diagnose before proposing fixes.
- Explain changes in plain language with costs where relevant; recommend one option.
- Privacy: the users are minors. Don't put the kids' names or conversation content in external requests or in this repo.
