# College Prep Brag Sheet

The live app is built in Lovable (project "BragStoryMaker", with a Lovable Cloud / Supabase backend) and published at https://bragstorymaker.lovable.app. See `CLAUDE.md` for the current design, models, costs, status and how changes are made.

This repo has a reference copy of the interview design, taken from the
"High School Brag Sheet Discovery Workbook" and "Summary Template":

- `server/workbook.js` holds all 63 workbook questions, memory cues and Experience Evidence Card fields as data.
- `server/interviewer.js` holds the counselor interviewer prompt and the note-saving tools.
- `server/bragsheet.js` holds the brag sheet schema and the generation prompt.

These files come from an earlier version that ran on your own computer. It was never finished: the front end in `public/` is incomplete and none of it has been run or tested.
