// Turns the notebook into the two-page "My College Brag Sheet" summary.
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getClient, MODEL } from "./interviewer.js";
import { SECTIONS, EXPERIENCE_CARD_FIELDS } from "./workbook.js";

export const BragSheet = z.object({
  three_things: z
    .array(z.object({ quality: z.string(), example: z.string().describe("Specific moment or action that demonstrates it") }))
    .describe("Exactly three qualities, each anchored in a brief, real example"),
  experiences: z
    .array(
      z.object({
        activity: z.string().describe("Activity / role / grades"),
        actions: z.string().describe("My actions and contribution"),
        result: z.string().describe("Result / why it matters"),
      }),
    )
    .describe("The 4-6 most meaningful experiences"),
  academic: z.object({
    favorite_areas: z.string().describe("Subject(s) and motivation"),
    class_moment: z.string().describe("A course project, paper, lab, or class moment worth remembering: what I did; what I learned"),
    recognition_or_growth: z.string().describe("Exact honor, improvement, advanced work, or example"),
  }),
  story: z.object({
    situation: z.string(),
    action: z.string(),
    outcome: z.string(),
    learned: z.string(),
  }),
  transcript_misses: z.string().describe("What my transcript or activities list might miss"),
  next: z.object({
    fields: z.string().describe("Possible academic fields / future interests and why"),
    contribution: z.string().describe("What I hope to contribute to a college community, with prior evidence"),
  }),
  for_recommender: z
    .object({
      why_asking: z.string(),
      moment: z.string().describe("One specific moment this recommender may remember"),
      deadlines: z.string().describe("Applications / deadlines / submission process, or empty if unknown"),
    })
    .nullable()
    .describe("Only when a specific recommender was given; otherwise null"),
  gaps: z
    .array(z.string())
    .describe("For the student only (not printed): concrete things that are missing or vague and would make this sheet stronger"),
});

function notebookText(student, includePrivate) {
  const out = [];
  const p = student.profile;
  out.push(`PROFILE: name=${p.name}; graduation year=${p.gradYear}; school=${p.school}; interests=${p.interests}`);
  const notes = student.notes.filter((n) => includePrivate || !n.private);
  const bySection = [{ id: "timeline", num: "00", title: "Warm-up timeline" }, ...SECTIONS];
  for (const s of bySection) {
    const ns = notes.filter((n) => n.sectionId === s.id);
    if (!ns.length) continue;
    out.push(`\n## ${s.num} ${s.title}`);
    for (const n of ns) out.push(`- ${n.questions.length ? `(Q${n.questions.join(",Q")}) ` : ""}${n.private ? "[private, shared with permission] " : ""}${n.text}`);
  }
  if (student.experiences.length) {
    out.push("\n## Experience Evidence Cards");
    for (const c of student.experiences) {
      out.push(`\n### ${c.name || "(untitled)"}`);
      for (const [k, label] of Object.entries(EXPERIENCE_CARD_FIELDS)) if (k !== "name" && c[k]) out.push(`${label}: ${c[k]}`);
    }
  }
  return out.join("\n");
}

const SYSTEM = `You turn a high-school student's interview notebook into their shareable college brag sheet, following the "My College Brag Sheet" template. Teachers and counselors will read it to write recommendation letters.

Rules:
- Use ONLY facts in the notebook. Never invent or inflate achievements, titles, numbers, or dates. Keep estimates labeled as estimates. Distinguish team results from the student's personal contribution.
- Write in the student's first-person voice ("I"), plain and specific, the way a thoughtful 17-year-old would write. No clichés, no hype words like "passionate", "spearheaded", "visionary".
- Be concise: the whole sheet should fit on 1-2 printed pages. Prefer concrete details (names of classes, projects, numbers, a short scene) over adjectives.
- Choose by meaning, sustained commitment, initiative, impact, and what is distinctive, not just prestige. Include out-of-school responsibilities (family, jobs, self-directed projects) when present.
- Do not include anything marked private unless it appears in the notebook (private items only appear when the student allowed it); even then, state it factually and briefly.
- If the notebook lacks material for a field, write a short honest placeholder in square brackets, like "[Need: a specific class moment]", and add the gap to "gaps".
- When a recommender is given, tailor the sheet for them: emphasize what they observed firsthand, and fill for_recommender with a moment from THEIR class or activity, using only notebook facts. Otherwise set for_recommender to null.`;

export async function generateBragSheet(student, { recommender, includePrivate = false } = {}) {
  const recText = recommender
    ? `\n\nTHIS VERSION IS FOR: ${recommender.name} (${recommender.role}${recommender.course ? `; course: ${recommender.course}` : ""}).\nNotes about this recommender:\n${recommender.notes || "(none)"}`
    : "\n\nThis is a general version (no specific recommender).";

  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "high", format: zodOutputFormat(BragSheet) },
    system: SYSTEM,
    messages: [{ role: "user", content: `STUDENT NOTEBOOK\n\n${notebookText(student, includePrivate)}${recText}` }],
  });

  if (response.stop_reason === "refusal") throw new Error("The model declined to generate this brag sheet.");
  if (response.stop_reason === "max_tokens") throw new Error("The brag sheet was cut off; try again.");
  if (!response.parsed_output) throw new Error("Could not read the generated brag sheet.");
  return response.parsed_output;
}

/** Markdown rendering, for copy/paste into email or a doc. */
export function toMarkdown(student, entry, recommender) {
  const s = entry.sheet;
  const p = student.profile;
  const L = [];
  L.push(`# My College Brag Sheet`);
  L.push(`**Student:** ${p.name || ""}  |  **Graduation year:** ${p.gradYear || ""}  |  **School:** ${p.school || ""}${p.email ? `  |  **Email:** ${p.email}` : ""}`);
  if (recommender) L.push(`**For:** ${recommender.name}${recommender.course ? `  |  **Course:** ${recommender.course}` : ""}`);
  L.push(`\n## 1. Three things to know about me`);
  s.three_things.forEach((t, i) => L.push(`${i + 1}. **${t.quality}** — ${t.example}`));
  L.push(`\n## 2. My most meaningful experiences`);
  L.push(`| Activity / role / grades | My actions and contribution | Result / why it matters |`);
  L.push(`|---|---|---|`);
  const cell = (x) => String(x).replace(/\|/g, "/").replace(/\n/g, " ");
  for (const e of s.experiences) L.push(`| ${cell(e.activity)} | ${cell(e.actions)} | ${cell(e.result)} |`);
  L.push(`\n## 3. Academic highlights`);
  L.push(`- **Favorite academic area(s):** ${s.academic.favorite_areas}`);
  L.push(`- **A class moment worth remembering:** ${s.academic.class_moment}`);
  L.push(`- **Academic recognition or growth:** ${s.academic.recognition_or_growth}`);
  L.push(`\n## 4. My story in action`);
  L.push(`**Situation:** ${s.story.situation}  \n**What I did:** ${s.story.action}  \n**What happened:** ${s.story.outcome}  \n**What I learned:** ${s.story.learned}`);
  L.push(`\n## 5. What my transcript or activities list might miss`);
  L.push(s.transcript_misses);
  L.push(`\n## 6. What comes next`);
  L.push(`- **Possible fields / interests:** ${s.next.fields}`);
  L.push(`- **What I hope to contribute to a college community:** ${s.next.contribution}`);
  if (s.for_recommender) {
    L.push(`\n## 7. For this recommender`);
    L.push(`- **Why I am asking you:** ${s.for_recommender.why_asking}`);
    L.push(`- **One specific moment you may remember:** ${s.for_recommender.moment}`);
    if (s.for_recommender.deadlines) L.push(`- **Deadlines and submission process:** ${s.for_recommender.deadlines}`);
  }
  L.push(`\nThank you for taking the time to support my applications.`);
  return L.join("\n");
}
