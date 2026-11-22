// The "High School Brag Sheet Discovery Workbook", turned into data the
// interviewer and the UI can both use. Question numbers match the workbook.

export const TIMELINE = [
  "9th grade",
  "Summer after 9th",
  "10th grade",
  "Summer after 10th",
  "11th grade",
  "Summer after 11th",
  "12th grade (so far)",
];

export const SECTIONS = [
  {
    id: "academic",
    num: "01",
    title: "Academic life & intellectual curiosity",
    intro: "Think beyond grades: questions you asked, ideas you chased, and work you improved.",
    questions: [
      [1, "Which three classes, topics, or units stayed with you? What exactly caught your attention?", "Look at schedules, syllabi, old notebooks and assignments."],
      [2, "What paper, lab, presentation, performance, or project are you proud of? What was your individual contribution?", "Find the file, teacher comments, photos or rubric."],
      [3, "When did you voluntarily go beyond an assignment or teach yourself something related to school?", "Books, experiments, code, extra readings, practice, personal research."],
      [4, "Did you improve significantly in a subject or skill? What changed in your approach?", "Before/after grades, feedback, study routines, second attempts."],
      [5, "What was a difficult academic problem you solved? What did you try first, and what finally worked?", "Think of group assignments, tests, labs, and deadlines."],
      [6, "How have you helped classmates learn or succeed? Give one specific scene.", "Tutoring, notes, study groups, helping someone feel included."],
      [7, "What academic honors, advanced courses, competitions, certifications, or outside courses did you complete?", "Include exact names, dates and levels."],
      [8, "What part of your academic record needs context, if any? What would someone miss from the transcript alone?", "Optional. Describe facts and growth without excuses."],
    ],
  },
  {
    id: "activities",
    num: "02",
    title: "Clubs, sports, performing arts & school life",
    intro: "Any long-term commitment counts—not only activities with a title or trophy.",
    questions: [
      [9, "List every school club, team, ensemble, publication, committee, student organization, or event you joined. What years?", "Browse yearbooks, club rosters, social posts, calendars."],
      [10, "For each, what did you actually do during a typical week or event?", "Describe specific tasks, not just membership."],
      [11, "When did you take on greater responsibility, even without a formal position?", "Examples: training a newcomer, running setup, coordinating logistics."],
      [12, "Was there a competition, game, performance, production, exhibition, or event you prepared for? How did it go?", "Include preparation and behind-the-scenes work."],
      [13, "What was your contribution when a group succeeded? What would have been harder if you were absent?", "Avoid claiming the entire team result as your own."],
      [14, "What did you keep doing even when you were not winning, recognized, or chosen? Why?", "Think commitment, discipline, and perseverance."],
      [15, "What did a coach, advisor, teacher, or peer thank you for?", "Search messages, cards, feedback and speeches."],
      [16, "Which school activity mattered most to you, and what changed because you participated?", "Consider the impact on you AND on other people."],
    ],
  },
  {
    id: "projects",
    num: "03",
    title: "Projects, hobbies, creativity & self-directed learning",
    intro: "Often overlooked: activities not sponsored by the school.",
    questions: [
      [17, "What have you built, written, drawn, coded, filmed, designed, repaired, sold, performed, or published on your own?", "Games, videos, art, music, websites, community pages, crafts."],
      [18, "What have you taught yourself just because you were curious? How did you learn it?", "Tutorials, books, trial and error, online communities."],
      [19, "What personal project took multiple weeks or months? How did it evolve?", "Look through project folders, version history, posts and photos."],
      [20, "Did anyone use, watch, read, buy, share, or benefit from your work? How do you know?", "Real numbers are helpful but not required."],
      [21, "What is a specific example of creativity or original thinking?", "What did you do differently from the obvious solution?"],
      [22, "Have you participated in an online community in a constructive way? What did you contribute?", "Moderation, tutorials, open-source help, event planning, collaboration."],
      [23, "Which hobby or skill shows persistence outside the classroom?", "Frequency, years of practice, milestones."],
    ],
  },
  {
    id: "work",
    num: "04",
    title: "Work, service, home & community responsibilities",
    intro: "Paid jobs and unpaid responsibilities are legitimate parts of your story.",
    questions: [
      [24, "Have you worked, interned, babysat, pet-sat, tutored, freelanced, sold products, or helped with a family business?", "Include informal or seasonal work."],
      [25, "What did you do, how often, and what did someone rely on you to handle?", "Shifts, clients, tasks, decisions, reliability."],
      [26, "Have you volunteered or helped a community group, neighborhood, school, library, shelter, or faith community?", "What did you do personally rather than what the organization does?"],
      [27, "What responsibilities do you routinely carry at home or for family members?", "Meals, care, translating, transportation, sibling support, chores, paperwork."],
      [28, "When did someone trust you with more responsibility? What had you done to earn it?", "Supervisor, family member, customer, community leader."],
      [29, "Who benefited from your work or service? Is there a concrete result or moment you remember?", "A person helped, an event delivered, a problem prevented."],
      [30, "Did work or caregiving affect your available time for school activities? What context would help someone understand your choices?", "Optional; share only what you are comfortable disclosing.", true],
    ],
  },
  {
    id: "leadership",
    num: "05",
    title: "Leadership, teamwork & impact",
    intro: "Leadership is behavior, not necessarily a title.",
    questions: [
      [31, "When did you notice a problem and act before anyone asked you?", "What was the situation, your action, and what happened next?"],
      [32, "When did you organize people, resources, information, or a plan?", "Meetings, shared files, schedules, logistics, fundraisers."],
      [33, "When did you help someone newer, younger, or less confident?", "Specific example of teaching, mentoring or encouraging."],
      [34, "What is a team disagreement you helped resolve? What did you say or do?", "Avoid blaming other people; focus on your role."],
      [35, "When did you lead without being the loudest person in the room?", "Dependability, preparation, listening, thoughtful follow-through."],
      [36, "Did you improve a process, event, product, or team practice? What was different afterward?", "Before vs after; include credible measurements if available."],
      [37, "What responsibility did others consistently come to you for? Why?", "May reveal hidden strengths such as empathy, organization, calm under pressure."],
    ],
  },
  {
    id: "recognition",
    num: "06",
    title: "Recognition, milestones & evidence",
    intro: "Recognition can be formal or informal; accuracy matters.",
    questions: [
      [38, "What honors, awards, scholarships, competition placements, certificates, or selections have you earned?", "Exact title, issuing organization, date, scope."],
      [39, "Were you selected for a special role, advanced group, exhibition, opportunity, or responsibility?", "Why were you selected? Who selected you?"],
      [40, "What personal milestone mattered even though there was no certificate?", "First client, first 5K, first difficult speech, first published work."],
      [41, "What numbers could verify the scope of your work?", "Hours/week, weeks/year, people reached, items sold, funds raised, attendance."],
      [42, "Where is the proof of each achievement or milestone?", "Emails, certificates, public links, screenshots, logs."],
      [43, "If you had to pick three achievements with the most meaning, which would they be and why?", "Meaning is not always proportional to prestige."],
    ],
  },
  {
    id: "character",
    num: "07",
    title: "Character, growth & memorable stories",
    intro: "Specific moments help teachers and counselors describe the real you.",
    questions: [
      [44, "What three words might people who know you well use to describe you? For each, what is the evidence?", "Pick a story, not just a label."],
      [45, "Tell about a time something went wrong or you failed. What did you do next?", "Be factual; include your actions and learning."],
      [46, "When did you change your mind after listening to someone or learning new evidence?", "Shows intellectual humility and growth."],
      [47, "When did you do the right thing even though it was inconvenient or no one was watching?", "Focus on an ordinary, believable moment."],
      [48, "When did you make someone feel included, respected, safer, or more capable?", "What exactly did you do?"],
      [49, "What is a small moment that made you unexpectedly proud?", "A quiet victory, not necessarily an award."],
      [50, "What experience, person, or event changed your perspective during high school?", "Why does it matter now?"],
      [51, "Is there a personal obstacle or important circumstance that shaped your path? Do you want your counselor to know?", "Optional and private. Only share information you choose.", true],
    ],
  },
  {
    id: "future",
    num: "08",
    title: "Interests, motivation & future directions",
    intro: "It is fine if you do not know your major or career yet.",
    questions: [
      [52, "What questions or problems do you find yourself thinking about when nobody assigns them?", "Science, stories, culture, social issues, design, communities."],
      [53, "What subjects or activities would you choose to do again even without grades, awards or money?", "Why do they matter to you?"],
      [54, "What possible academic fields, college majors, or careers intrigue you? What experiences sparked each interest?", "A class, person, documentary, project or job."],
      [55, "What kind of college learning environment might help you grow?", "Research, close faculty contact, making things, service, teamwork."],
      [56, "What would you want to contribute to a college community? What previous experience suggests you could?", "Connect aspiration to actual behavior."],
      [57, "What do you hope to learn, explore, or become better at in the next few years?", "Curiosity is valid even without a fixed plan."],
    ],
  },
  {
    id: "recommenders",
    num: "09",
    title: "Recommendations & the things adults may not know",
    intro: "Use these when preparing a version for a particular teacher or counselor.",
    questions: [
      [58, "Which adults at school have directly observed your effort, ideas, character, or growth?", "Name, class/activity, year, and one shared memory."],
      [59, "For a specific teacher: what lesson, conversation, paper, lab or class moment would they likely remember?", "Use exact details from their class."],
      [60, "What did you contribute to that teacher’s classroom community?", "A discussion, question, kindness, collaboration or improvement."],
      [61, "What important side of you might that teacher or counselor not know?", "Home commitments, independent projects, part-time work, interests."],
      [62, "What is one fact or anecdote you especially hope a recommender can mention—if they have firsthand basis to do so?", "Give context; never dictate a fabricated claim."],
      [63, "What are each recommender’s requested forms, method, and deadlines?", "Follow your school’s official process."],
    ],
  },
].map((s) => ({
  ...s,
  questions: s.questions.map(([n, text, cue, sensitive]) => ({ n, text, cue, sensitive: !!sensitive })),
}));

export const SECTION_IDS = ["timeline", ...SECTIONS.map((s) => s.id)];

export const EXPERIENCE_CARD_FIELDS = {
  name: "Experience / activity / project",
  category: "Category & organization (type / school / community / independent)",
  when: "When (grades; months/years; summers)",
  time_commitment: "Time commitment (hours/week and weeks/year, or one-time hours; estimated honestly)",
  title: "Official title, if any (or participant, volunteer, creator, helper...)",
  actions: "What I personally did (action verbs; 3-5 specific tasks)",
  situation: "The situation / need / problem before I acted",
  initiative: "My initiative or difficult decision",
  result: "Result / change / benefit for me, others, team, school, community",
  evidence: "Evidence and numbers (links, emails, feedback, dates, counts; label approximations)",
  moment: "One vivid moment or anecdote",
  learned: "What I learned / how I changed (specific)",
  verifier: "Who could verify or describe it",
};

/** Renders the workbook as plain text for the interviewer's system prompt. */
export function workbookAsText() {
  const lines = [];
  lines.push("WARM-UP TIMELINE (section id: timeline)");
  lines.push("For each period recall a class, a person, a challenge, an activity, something they made, and one memorable moment:");
  lines.push("  " + TIMELINE.join(" | "));
  lines.push("");
  for (const s of SECTIONS) {
    lines.push(`SECTION ${s.num} — ${s.title} (section id: ${s.id})`);
    lines.push(`  ${s.intro}`);
    for (const q of s.questions) {
      lines.push(`  Q${q.n}${q.sensitive ? " [OPTIONAL/PRIVATE]" : ""}. ${q.text}  (cue: ${q.cue})`);
    }
    lines.push("");
  }
  lines.push("EXPERIENCE EVIDENCE CARD fields (one card per important experience; aim for the top 3-6):");
  for (const [k, v] of Object.entries(EXPERIENCE_CARD_FIELDS)) lines.push(`  ${k}: ${v}`);
  return lines.join("\n");
}
