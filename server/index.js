import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import * as store from "./store.js";
import { SECTIONS, TIMELINE, EXPERIENCE_CARD_FIELDS } from "./workbook.js";
import { runTurn, appMessage, coverage } from "./interviewer.js";
import { generateBragSheet, toMarkdown } from "./bragsheet.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(here, "..", "public")));

// Optional shared passcode for the household (set APP_PASSCODE in .env).
const PASSCODE = process.env.APP_PASSCODE || "";
app.use("/api", (req, res, next) => {
  if (!PASSCODE || req.get("x-passcode") === PASSCODE) return next();
  res.status(401).json({ error: "passcode required" });
});

const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** What the browser gets: everything except the raw API conversation. */
function publicView(s) {
  const { messages, ...rest } = s;
  return { ...rest, coverage: coverage(s) };
}

app.get("/api/config", (req, res) => res.json({ passcodeRequired: !!PASSCODE }));
app.get("/api/workbook", (req, res) => res.json({ sections: SECTIONS, timeline: TIMELINE, cardFields: EXPERIENCE_CARD_FIELDS }));

app.get("/api/students", ah(async (req, res) => res.json(await store.list())));

app.post("/api/students", ah(async (req, res) => {
  const name = String(req.body?.name || "").trim().slice(0, 80);
  if (!name) return res.status(400).json({ error: "name required" });
  const s = store.emptyStudent(name);
  await store.save(s);
  res.json(publicView(s));
}));

app.get("/api/students/:id", ah(async (req, res) => res.json(publicView(await store.load(req.params.id)))));

app.delete("/api/students/:id", ah(async (req, res) => {
  await store.remove(req.params.id);
  res.json({ ok: true });
}));

app.patch("/api/students/:id/profile", ah(async (req, res) => {
  const out = await store.withStudent(req.params.id, (s) => {
    for (const k of ["name", "gradYear", "school", "email", "interests"]) {
      if (typeof req.body[k] === "string") s.profile[k] = req.body[k].slice(0, 300);
    }
    return publicView(s);
  });
  res.json(out);
}));

// ---- notebook edits (the student/parent can correct anything) -------------
app.patch("/api/students/:id/notes/:noteId", ah(async (req, res) => {
  res.json(await store.withStudent(req.params.id, (s) => {
    const n = s.notes.find((x) => x.id === req.params.noteId);
    if (!n) throw httpError(404, "note not found");
    if (typeof req.body.text === "string") n.text = req.body.text.slice(0, 4000);
    if (typeof req.body.private === "boolean") n.private = req.body.private;
    return publicView(s);
  }));
}));
app.delete("/api/students/:id/notes/:noteId", ah(async (req, res) => {
  res.json(await store.withStudent(req.params.id, (s) => {
    s.notes = s.notes.filter((x) => x.id !== req.params.noteId);
    return publicView(s);
  }));
}));
app.put("/api/students/:id/experiences/:cardId", ah(async (req, res) => {
  res.json(await store.withStudent(req.params.id, (s) => {
    const c = s.experiences.find((x) => x.id === req.params.cardId);
    if (!c) throw httpError(404, "card not found");
    for (const k of Object.keys(EXPERIENCE_CARD_FIELDS)) if (typeof req.body[k] === "string") c[k] = req.body[k].slice(0, 4000);
    return publicView(s);
  }));
}));
app.delete("/api/students/:id/experiences/:cardId", ah(async (req, res) => {
  res.json(await store.withStudent(req.params.id, (s) => {
    s.experiences = s.experiences.filter((x) => x.id !== req.params.cardId);
    return publicView(s);
  }));
}));
app.post("/api/students/:id/recommenders", ah(async (req, res) => {
  res.json(await store.withStudent(req.params.id, (s) => {
    const r = { id: store.newId(), name: "", role: "", course: "", notes: "" };
    for (const k of ["name", "role", "course", "notes"]) if (typeof req.body[k] === "string") r[k] = req.body[k].slice(0, 4000);
    if (!r.name.trim()) throw httpError(400, "name required");
    s.recommenders.push(r);
    return publicView(s);
  }));
}));
app.put("/api/students/:id/recommenders/:rid", ah(async (req, res) => {
  res.json(await store.withStudent(req.params.id, (s) => {
    const r = s.recommenders.find((x) => x.id === req.params.rid);
    if (!r) throw httpError(404, "recommender not found");
    for (const k of ["name", "role", "course", "notes"]) if (typeof req.body[k] === "string") r[k] = req.body[k].slice(0, 4000);
    return publicView(s);
  }));
}));
app.delete("/api/students/:id/recommenders/:rid", ah(async (req, res) => {
  res.json(await store.withStudent(req.params.id, (s) => {
    s.recommenders = s.recommenders.filter((x) => x.id !== req.params.rid);
    return publicView(s);
  }));
}));

// ---- the interview: Server-Sent Events stream ------------------------------
app.post("/api/students/:id/chat", ah(async (req, res) => {
  const { kind = "message", text = "", focus } = req.body || {};
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  const abort = new AbortController();
  res.on("close", () => abort.abort());

  try {
    await store.withStudent(req.params.id, async (s) => {
      let userText;
      if (kind === "message") {
        userText = String(text).trim().slice(0, 8000);
        if (!userText) throw httpError(400, "empty message");
        s.transcript.push({ role: "student", text: userText, at: new Date().toISOString() });
      } else {
        userText = appMessage(s, kind, focus);
      }
      const result = await runTurn(s, userText, {
        signal: abort.signal,
        onText: (delta) => send("text", { delta }),
        onNotebookChange: () => send("notebook", { coverage: coverage(s), notes: s.notes.length, experiences: s.experiences.length }),
      });
      if (result.text) s.transcript.push({ role: "interviewer", text: result.text, at: new Date().toISOString() });
      send("done", { student: publicView(s) });
    });
  } catch (err) {
    console.error(err);
    send("error", { message: friendlyError(err) });
  }
  res.end();
}));

// ---- brag sheets -------------------------------------------------------------
app.post("/api/students/:id/bragsheets", ah(async (req, res) => {
  const { recommenderId = "", includePrivate = false } = req.body || {};
  const s = await store.load(req.params.id);
  const recommender = recommenderId ? s.recommenders.find((r) => r.id === recommenderId) : null;
  if (recommenderId && !recommender) throw httpError(404, "recommender not found");
  if (s.notes.length + s.experiences.length < 3) throw httpError(400, "The notebook is still nearly empty. Do some interviewing first!");
  const sheet = await generateBragSheet(s, { recommender, includePrivate: !!includePrivate });
  res.json(await store.withStudent(req.params.id, (st) => {
    const entry = { id: store.newId(), recommenderId: recommender?.id || "", includePrivate: !!includePrivate, createdAt: new Date().toISOString(), sheet };
    st.bragSheets.unshift(entry);
    return { entry, student: publicView(st) };
  }));
}));
app.put("/api/students/:id/bragsheets/:bid", ah(async (req, res) => {
  res.json(await store.withStudent(req.params.id, (s) => {
    const b = s.bragSheets.find((x) => x.id === req.params.bid);
    if (!b) throw httpError(404, "brag sheet not found");
    if (req.body?.sheet && typeof req.body.sheet === "object") b.sheet = req.body.sheet;
    b.editedAt = new Date().toISOString();
    return publicView(s);
  }));
}));
app.delete("/api/students/:id/bragsheets/:bid", ah(async (req, res) => {
  res.json(await store.withStudent(req.params.id, (s) => {
    s.bragSheets = s.bragSheets.filter((x) => x.id !== req.params.bid);
    return publicView(s);
  }));
}));
app.get("/api/students/:id/bragsheets/:bid/markdown", ah(async (req, res) => {
  const s = await store.load(req.params.id);
  const b = s.bragSheets.find((x) => x.id === req.params.bid);
  if (!b) throw httpError(404, "brag sheet not found");
  const r = s.recommenders.find((x) => x.id === b.recommenderId);
  res.type("text/markdown").send(toMarkdown(s, b, r));
}));

// ---- errors --------------------------------------------------------------------
function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}
function friendlyError(err) {
  if (err.status && !(err instanceof Anthropic.APIError)) return err.message;
  if (err instanceof Anthropic.AuthenticationError) return "The Anthropic API key is missing or invalid. Check your .env file.";
  if (err instanceof Anthropic.RateLimitError) return "Too many requests right now. Wait a moment and try again.";
  if (err instanceof Anthropic.APIConnectionError) return "Couldn't reach the AI service. Check the internet connection.";
  if (err instanceof Anthropic.APIError) return `AI service error (${err.status}). Try again.`;
  if (err.name === "AbortError") return "Cancelled.";
  return err.message || "Something went wrong.";
}
app.use((err, req, res, _next) => {
  if (err.code === "ENOENT") return res.status(404).json({ error: "not found" });
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: friendlyError(err) });
});

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, HOST, () => {
  console.log(`Brag Sheet Interviewer running at http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) console.warn("Warning: ANTHROPIC_API_KEY is not set (add it to .env).");
});
