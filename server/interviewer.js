// The AI interviewer: a counselor-style conversation that saves what the
// student remembers into a structured notebook through tool calls.
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { SECTIONS, SECTION_IDS, EXPERIENCE_CARD_FIELDS, workbookAsText } from "./workbook.js";
import { newId } from "./store.js";

export const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const EFFORT = process.env.INTERVIEW_EFFORT || "medium";
const BETAS = ["server-side-fallback-2026-07-01"];

let client;
export function getClient() {
  client ??= new Anthropic();
  return client;
}
export function setClient(c) {
  client = c; // used by tests
}

// ---------------------------------------------------------------------------
// System prompt. Kept byte-stable so it is cached across turns.
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a warm, curious, experienced high-school college counselor conducting a spoken interview with a high-school student. Your job is to help the student REMEMBER and ARTICULATE real facts from their high-school years so they can build a brag sheet for counselors and teachers who will write their recommendation letters, and later use the material for essays and application forms.

You are an interviewer, not a writer. You collect facts and the student's own words; you do not write essays for them.

## How the conversation works
- The student is usually talking out loud and hearing your replies read aloud by text-to-speech. So write the way a person speaks: plain sentences, no markdown, no bullet lists, no headings, no emoji. Keep most replies to one to three short sentences.
- Ask ONE question at a time. Never stack several questions in one turn.
- Messages that start with "[app]" come from the app, not the student (for example, a session starting or the student choosing a topic). Follow them, but don't mention the app.
- Speech-to-text makes mistakes. If a word looks garbled, make a sensible guess or ask briefly.

## How to dig
Your main value is the follow-up question. A vague answer ("I was in robotics club") is a starting point. Dig for:
- Specifics: what exactly did THEY do, week to week? Which part was theirs versus the team's?
- A scene: "Take me to one moment. Where were you, what happened?"
- The before and after: what was the situation, what did they decide or try, what changed?
- Scope and numbers: hours per week, weeks per year, how many people, how long, what grade. If they're not sure, ask for an honest estimate and note that it's an estimate.
- Evidence: where could they find proof (emails, photos, certificates, links, a teacher who saw it)?
- Meaning: why did it matter to them, what did they learn?
Usually two to four follow-ups on a good thread are worth it before moving on. When a thread is exhausted, or the student seems tired of it, move on.

Use memory triggers when they get stuck: grade by grade, summers, a specific class, a specific person, photos on their phone, old texts, the school portal, yearbooks.

Notice what students overlook and ask about it: family responsibilities, caring for siblings, translating for parents, part-time jobs, self-taught skills, games or videos they made, online communities, quiet leadership, setbacks they recovered from. These count.

## Honesty and accuracy
- Never inflate. Don't suggest achievements, titles, or numbers the student didn't state. Distinguish team accomplishments from personal contribution.
- When you summarize back, use their facts. If a number is an estimate, keep it labeled as one.
- It's fine to tell a student that an ordinary-sounding responsibility is valuable, but don't flatter.

## Privacy and care
- Questions marked OPTIONAL/PRIVATE (and any personal circumstance, health, family hardship, identity, or money topic) are always optional. Offer them gently, accept "skip" immediately, and when you save such information set private=true. Private notes are not put on a shared brag sheet unless the student decides later.
- The student is a minor. If they mention that they or someone else is in danger, being hurt, or thinking about self-harm, pause the interview, respond with care, encourage them to talk to a parent or another trusted adult right away, and mention that in the US they can call or text 988. Don't press for details.
- Don't ask for passwords, ID numbers, or home addresses.

## Saving to the notebook (important)
You have tools that write to the student's notebook. The notebook, not this conversation, is what the brag sheet will be built from.
- After every answer that contains a real fact, call save_note. Write the note as concise, factual bullet-style text in the third person or the student's own phrasing, keeping concrete details: names, dates, grades, numbers, quotes. One note per distinct fact cluster. Link it to the workbook section and question numbers it answers (a note can answer several).
- When an experience clearly matters (sustained commitment, initiative, impact, or a strong story), build or update an Experience Evidence Card with save_experience_card. Fill fields you actually know and leave the others as empty strings; call it again with the same card_id to add details later. Aim for the student's top three to six experiences.
- When you learn profile facts (name, graduation year, school, interests), call update_profile.
- When the student names a teacher or counselor who will write a recommendation, call save_recommender, and later collect the class moments that person would remember.
- If you lose track of what's already covered, call review_notebook.
- Do the tool calls silently. Don't say "I'm saving that" every time; just continue the conversation naturally.

## Flow
- First session: introduce yourself in a sentence, explain that this is about remembering, not sounding impressive, that short imperfect answers are fine and anything can be skipped. Then start with the warm-up timeline: go grade by grade, including summers, asking what was going on.
- Then move through the workbook sections, but follow the student's energy: if they light up about something, go deeper there first. Cover all nine sections over time; it's fine for this to take several sessions.
- Every so often, briefly reflect back something you heard that seems like a real strength, with the evidence, and check that you got it right.
- Near the end of a session, or when asked, mention which areas still have gaps.

## The workbook you are working from
${workbookAsText()}`;

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------
const cardProps = Object.fromEntries(
  Object.entries(EXPERIENCE_CARD_FIELDS).map(([k, desc]) => [k, { type: "string", description: desc + ". Empty string if unknown." }]),
);

const TOOLS = [
  {
    name: "save_note",
    description:
      "Save one fact or cluster of facts the student shared into their notebook, linked to the workbook section and question numbers it answers.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["section_id", "questions", "text", "private"],
      properties: {
        section_id: { type: "string", enum: SECTION_IDS, description: "Workbook section this belongs to. Use 'timeline' for the grade-by-grade warm-up." },
        questions: { type: "array", items: { type: "integer" }, description: "Workbook question numbers (1-63) this note answers. Empty array for timeline notes." },
        text: { type: "string", description: "Concise factual note with concrete details (who, what, when, how much). For timeline notes, start with the period, e.g. '10th grade: ...'." },
        private: { type: "boolean", description: "True for sensitive personal information that should not appear on a shared brag sheet by default." },
      },
    },
  },
  {
    name: "save_experience_card",
    description:
      "Create or update an Experience Evidence Card for an important experience. Pass card_id as an empty string to create a new card; pass an existing card_id to update it (only non-empty fields overwrite).",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["card_id", ...Object.keys(EXPERIENCE_CARD_FIELDS)],
      properties: { card_id: { type: "string", description: "Existing card id, or empty string to create." }, ...cardProps },
    },
  },
  {
    name: "update_profile",
    description: "Update the student's profile. Only non-empty fields overwrite.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["name", "gradYear", "school", "interests"],
      properties: {
        name: { type: "string" },
        gradYear: { type: "string" },
        school: { type: "string" },
        interests: { type: "string", description: "Academic fields or careers they're exploring, briefly." },
      },
    },
  },
  {
    name: "save_recommender",
    description:
      "Create or update a teacher/counselor who will receive a brag sheet. Pass recommender_id as an empty string to create. Notes should hold shared class moments, what they've observed firsthand, and deadlines/process.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["recommender_id", "name", "role", "course", "notes"],
      properties: {
        recommender_id: { type: "string" },
        name: { type: "string" },
        role: { type: "string", description: "e.g. 'AP Chemistry teacher', 'school counselor'" },
        course: { type: "string", description: "Course(s) and year, if relevant." },
        notes: { type: "string", description: "Text to APPEND to this recommender's notes." },
      },
    },
  },
  {
    name: "review_notebook",
    description: "See what is already in the notebook: coverage by section and question, experience cards, and recommenders.",
    strict: true,
    input_schema: { type: "object", additionalProperties: false, properties: {}, required: [] },
  },
];

// Validation schemas (inputs are also validated server-side by strict mode,
// but we never trust tool input blindly).
const SaveNote = z.object({
  section_id: z.enum(SECTION_IDS),
  questions: z.array(z.number().int().min(1).max(63)),
  text: z.string().min(1).max(4000),
  private: z.boolean(),
});
const SaveCard = z.object({ card_id: z.string(), ...Object.fromEntries(Object.keys(EXPERIENCE_CARD_FIELDS).map((k) => [k, z.string().max(4000)])) });
const UpdateProfile = z.object({ name: z.string(), gradYear: z.string(), school: z.string(), interests: z.string() });
const SaveRecommender = z.object({ recommender_id: z.string(), name: z.string(), role: z.string(), course: z.string(), notes: z.string() });

export function coverage(student) {
  const answered = new Map();
  for (const n of student.notes) for (const q of n.questions) answered.set(q, (answered.get(q) || 0) + 1);
  const timelineNotes = student.notes.filter((n) => n.sectionId === "timeline").length;
  return {
    timeline: timelineNotes,
    sections: SECTIONS.map((s) => ({
      id: s.id,
      num: s.num,
      title: s.title,
      answered: s.questions.filter((q) => answered.has(q.n)).length,
      total: s.questions.length,
      notes: student.notes.filter((n) => n.sectionId === s.id).length,
      open: s.questions.filter((q) => !answered.has(q.n)).map((q) => q.n),
    })),
  };
}

function runTool(student, name, input) {
  switch (name) {
    case "save_note": {
      const p = SaveNote.parse(input);
      const note = { id: newId(), sectionId: p.section_id, questions: [...new Set(p.questions)], text: p.text.trim(), private: p.private, createdAt: new Date().toISOString() };
      student.notes.push(note);
      return `Saved note ${note.id}.`;
    }
    case "save_experience_card": {
      const p = SaveCard.parse(input);
      const { card_id, ...fields } = p;
      let card = card_id ? student.experiences.find((c) => c.id === card_id) : null;
      if (card_id && !card) return `No card with id ${card_id}. Pass an empty card_id to create a new one.`;
      if (!card) {
        card = { id: newId(), ...Object.fromEntries(Object.keys(EXPERIENCE_CARD_FIELDS).map((k) => [k, ""])) };
        student.experiences.push(card);
      }
      for (const [k, v] of Object.entries(fields)) if (v.trim()) card[k] = v.trim();
      const missing = Object.keys(EXPERIENCE_CARD_FIELDS).filter((k) => !card[k]);
      return `Card ${card.id} ("${card.name}") saved. Still empty: ${missing.join(", ") || "none"}.`;
    }
    case "update_profile": {
      const p = UpdateProfile.parse(input);
      for (const [k, v] of Object.entries(p)) if (v.trim()) student.profile[k] = v.trim();
      return "Profile updated.";
    }
    case "save_recommender": {
      const p = SaveRecommender.parse(input);
      let r = p.recommender_id ? student.recommenders.find((x) => x.id === p.recommender_id) : null;
      if (!r) {
        r = student.recommenders.find((x) => x.name.toLowerCase() === p.name.trim().toLowerCase());
      }
      if (!r) {
        r = { id: newId(), name: "", role: "", course: "", notes: "" };
        student.recommenders.push(r);
      }
      for (const k of ["name", "role", "course"]) if (p[k].trim()) r[k] = p[k].trim();
      if (p.notes.trim()) r.notes = [r.notes, p.notes.trim()].filter(Boolean).join("\n");
      return `Recommender ${r.id} (${r.name}) saved.`;
    }
    case "review_notebook":
      return JSON.stringify(notebookSummary(student));
    default:
      throw new Error(`Unknown tool ${name}`);
  }
}

function notebookSummary(student) {
  const cov = coverage(student);
  return {
    profile: student.profile,
    timeline_notes: cov.timeline,
    sections: cov.sections.map((s) => ({ id: s.id, answered: `${s.answered}/${s.total}`, open_questions: s.open })),
    experience_cards: student.experiences.map((c) => ({
      id: c.id,
      name: c.name,
      empty_fields: Object.keys(EXPERIENCE_CARD_FIELDS).filter((k) => !c[k]),
    })),
    recommenders: student.recommenders.map((r) => ({ id: r.id, name: r.name, role: r.role })),
  };
}

// ---------------------------------------------------------------------------
// Kick-off messages from the app (the student never sees these).
// ---------------------------------------------------------------------------
export function appMessage(student, kind, focusSectionId) {
  const name = student.profile.name || "the student";
  if (kind === "start") {
    if (student.messages.length === 0) {
      return `[app] ${name} just opened the interview for the first time. Greet them and begin.`;
    }
    const last = student.transcript.at(-1)?.at;
    return `[app] ${name} is back for a new session${last ? ` (last activity ${last.slice(0, 10)})` : ""}. Today is ${new Date().toISOString().slice(0, 10)}. Notebook status: ${JSON.stringify(notebookSummary(student))}. Welcome them back in a sentence, briefly mention where you left off, and continue with the most useful open area.`;
  }
  if (kind === "focus") {
    const s = SECTIONS.find((x) => x.id === focusSectionId);
    const title = focusSectionId === "timeline" ? "the grade-by-grade warm-up timeline" : s ? `section ${s.num}, ${s.title}` : focusSectionId;
    return `[app] ${name} chose to talk about ${title} now. Move there smoothly and ask your first question about it.`;
  }
  if (kind === "wrapup") {
    return `[app] ${name} wants to wrap up for now. Reflect back two or three strengths you heard today with their evidence, mention which areas are still open, and say goodbye warmly. Keep it short.`;
  }
  throw new Error("unknown app message kind");
}

// ---------------------------------------------------------------------------
// One conversational turn: student text in, streamed interviewer text out.
// `student` is mutated (notes, cards, messages); the caller persists it.
// ---------------------------------------------------------------------------
export async function runTurn(student, userText, { onText, onNotebookChange, signal } = {}) {
  const messages = student.messages;
  messages.push({ role: "user", content: userText });
  let replyText = "";

  for (let iteration = 0; iteration < 8; iteration++) {
    const stream = getClient().beta.messages.stream(
      {
        model: MODEL,
        max_tokens: 16000,
        betas: BETAS,
        fallbacks: "default",
        output_config: { effort: EFFORT },
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        tools: TOOLS,
        cache_control: { type: "ephemeral" },
        messages,
      },
      { signal },
    );
    stream.on("text", (delta) => {
      replyText += delta;
      onText?.(delta);
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      // Drop the whole turn so the history stays clean, and say something kind.
      rollbackTo(messages, userText);
      const fallback = "Sorry, I can't help with that one. Let's pick up somewhere else — what would you like to talk about?";
      onText?.(fallback);
      return { text: fallback, refused: true };
    }

    // Keep the assistant content exactly as returned (thinking blocks included).
    messages.push({ role: "assistant", content: message.content });

    const toolUses = message.content.filter((b) => b.type === "tool_use");
    if (message.stop_reason === "pause_turn") continue;
    if (toolUses.length === 0) break;
    if (message.stop_reason === "max_tokens") throw new Error("Reply was cut off (max_tokens).");

    const results = toolUses.map((t) => {
      try {
        return { type: "tool_result", tool_use_id: t.id, content: runTool(student, t.name, t.input) };
      } catch (err) {
        return { type: "tool_result", tool_use_id: t.id, is_error: true, content: `Error: ${err.message}` };
      }
    });
    messages.push({ role: "user", content: results });
    onNotebookChange?.();
    if (replyText && !replyText.endsWith(" ") && !replyText.endsWith("\n")) {
      replyText += " ";
      onText?.(" ");
    }
  }
  return { text: replyText.trim() };
}

function rollbackTo(messages, userText) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === "user" && m.content === userText) {
      messages.splice(i);
      return;
    }
  }
}
