// Tiny file-based store: one JSON file per student in ./data (git-ignored).
// Everything stays on the computer running the server.
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const DATA_DIR = path.resolve(process.env.DATA_DIR || "data");

const ID_RE = /^[a-z0-9-]{1,64}$/;

function fileFor(id) {
  if (!ID_RE.test(id)) throw new Error("bad student id");
  return path.join(DATA_DIR, `${id}.json`);
}

export function newId() {
  return crypto.randomUUID().slice(0, 8);
}

export function emptyStudent(name) {
  return {
    id: newId(),
    createdAt: new Date().toISOString(),
    profile: { name, gradYear: "", school: "", email: "", interests: "" },
    notes: [], // { id, sectionId, questions: [n], text, private, createdAt }
    experiences: [], // Experience Evidence Cards
    recommenders: [], // { id, name, role, course, notes }
    messages: [], // raw Claude API conversation (kept as-is; see interviewer.js)
    transcript: [], // { role: "student"|"interviewer", text, at } for display
    bragSheets: [], // { id, recommenderId, createdAt, sheet }
  };
}

// Serialize writes per student so concurrent requests can't clobber each other.
const locks = new Map();
export async function withStudent(id, fn) {
  const prev = locks.get(id) || Promise.resolve();
  let release;
  const next = new Promise((r) => (release = r));
  locks.set(id, prev.then(() => next));
  await prev;
  try {
    const student = await load(id);
    const result = await fn(student);
    await save(student);
    return result;
  } finally {
    release();
    if (locks.get(id) === next) locks.delete(id);
  }
}

export async function load(id) {
  const raw = await fs.readFile(fileFor(id), "utf8");
  return JSON.parse(raw);
}

export async function save(student) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const file = fileFor(student.id);
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(student, null, 2));
  await fs.rename(tmp, file);
}

export async function list() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith(".json"));
  const out = [];
  for (const f of files) {
    try {
      const s = JSON.parse(await fs.readFile(path.join(DATA_DIR, f), "utf8"));
      out.push({ id: s.id, name: s.profile.name, notes: s.notes.length, experiences: s.experiences.length });
    } catch {
      /* skip unreadable files */
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function remove(id) {
  await fs.rm(fileFor(id), { force: true });
}
