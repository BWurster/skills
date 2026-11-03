---
name: study-pack
description: Build a comprehensive learning pack on any topic. The pack is a deep, from-zero PowerPoint deck with speaker notes plus a companion printable study-guide PDF; both share section numbers. They are researched from the best resources and firsthand sources (official docs, original papers, practitioners' engineering blogs and talks, exam blueprints, candidate interview reports), with ranked links, worked examples, practice problems with model answers, drills and a time-boxed study plan. Use this whenever someone wants to learn or prep a subject in depth, including a deck plus study guide, a study pack, course materials, or prep for an interview, exam, certification, new job or new domain, even if they only say "help me learn X fast" or "make me slides and notes on Y". Don't use it for a one-off explanation in chat, a business/pitch presentation, or editing an existing deck.
---

# Study pack: deck + companion study guide on any topic

Produces, for any topic:

- **`out/<Slug>-Deck.pptx`**: a structured, themed deck that teaches from zero. Every content slide has speaker notes holding the full explanation. Slides have links, worked examples, traps, firsthand quotes, drills and "check yourself" quizzes.
- **`out/<Slug>-Study-Guide.pdf`**: a Letter-size workbook with the same section numbers. It has compressed summaries, self-checks with answer lines, practice problems with model answers, a cheat sheet, ranked resources and a time-boxed plan. Each chapter header shows its deck slide range.

The machinery is in `scripts/` (paths below are relative to this skill's directory). The writing standards are in `references/`. This workflow was distilled from a real 173-slide / 59-page interview-prep build. The learner's two biggest corrections then were:
- "this drifted into generic foundations; tailor it to what's actually tested"
- "remove the large notes sections"

Both are designed in below.

## Workflow

### 1. Intake: pin down the goal (one round of questions, max)

Tailoring is the whole game, so get these before researching. Take what the request already says and ask only for what's missing, in a single AskUserQuestion call:

- **Goal and context:** an interview (company, role, round), an exam or cert (which one), a new job/domain, or general mastery. Get the specifics the learner already has (e.g. "the recruiter said rate limiting, caching and storage"). Specifics like that outrank anything you find.
- **Starting level:** none / some / working knowledge.
- **Time budget and deadline:** this sizes the pack.
- **Must-cover focus areas or things to skip** (optional).

If the user wants you to just go, use defaults: general mastery, starting from zero, a 6-hour budget. State the assumptions you used.

### 2. Research: best resources and firsthand voices

Read `references/research.md` first. Use WebSearch/WebFetch directly; batch several searches per turn. Find:
- the authoritative sources;
- the firsthand ones: builders, maintainers, practitioners, assessors, candidates who sat the real thing;
- what is actually tested or used in the learner's context.

Fetch and read every page you will quote or link. Log sources in `research/sources.md` and quotes or reported questions in `research/notes.md`.

### 3. Outline, then confirm once

Read `references/pedagogy.md`. Write `research/outline.md`:
- the learner profile;
- numbered sections in the shape primer → framework → **focus sections (the depth)** → applied scenarios → practice → drill;
- a slide budget per section (≈15–18 slides per study hour);
- the practice problems with priorities;
- the time-boxed plan.

Show the user a compact version: the sections with slide counts, the focus areas and the problems. Ask one confirmation question. Rebuilding 150 slides because the emphasis was wrong is far more expensive than one question. If they said not to check in, proceed.

### 4. Scaffold

Run this from the user's current working directory; don't pass a path elsewhere. The pack is one self-contained folder, `./<topic-slug>/`, created there:

```bash
python3 scripts/init_pack.py --title "<Title>" --subtitle "<one-line promise>" \
  [--say-label "SAY THIS IN THE INTERVIEW"] [--eyebrow "Interview prep · 10-hour sprint"]
```

It prints the pack directory; call it `<pack>` below. Every artifact of the build goes inside `<pack>`, so the user can move, zip or delete the whole thing at once:

| Folder | Holds |
|---|---|
| `research/` | sources.md, notes.md, outline.md |
| `deck/`, `guide/` | slide content files and guide partials (the editable source) |
| `build/` | intermediate artifacts: `build/qa/` slide renders, `build/code-check/` scratch projects, page previews |
| `out/` | the deliverables: `<Slug>-Deck.pptx`, `<Slug>-Study-Guide.pdf` |

Don't use the session scratchpad or `/tmp` for pack artifacts. Then edit `pack.config.json`:
- **Theme:** pick colors that suit the topic (12 hex colors, no `#`). Keep `dk1` dark (used for title and section backgrounds and table headers) and `lt2` a pale tint.
- **Fonts:** Cambria/Calibri are safe defaults that render true in PowerPoint.
- **`sayLabel`:** set this to fit the goal ("SAY THIS IN THE INTERVIEW", "WRITE THIS ON THE EXAM", "EXPLAIN IT LIKE THIS").
- **Custom callout kinds:** add any the topic needs, e.g. a "CLASSIFIED TWIST" for a government role or "CLINICAL PEARL" for medicine.

First run only: if `scripts/deck/node_modules` is missing, run `npm install` in `scripts/deck`.

### 5. Write the deck, one file per section

Read `references/slide-schema.md` for the slide types and the inline markup. Write `deck/c01-<name>.js`, `c02-…`, and so on, following the per-section sequence in `references/pedagogy.md`. Standards that matter most:

- **Depth where it's tested.** Focus topics get deep-dive sub-sequences: the mechanism traced by hand with real numbers, the production version, failure modes, the context-specific twist. Don't spread depth evenly.
- **From zero.** Define each term on first use. Speaker notes on every content slide carry the explanation a tutor would give.
- **Firsthand input in every focus section.** At least one `quote` slide or `source` callout, attributed and linked. Plus a "Learn more" link set ranked best-first.
- **Every section ends in retrieval:** a follow-up drill table and/or a `quiz`.
- **Numbers stay consistent** across slides, practice problems and the guide. Decide key figures once in the outline.
- **Programming topics: compile and run every snippet** against the current library versions in a scratch project under `<pack>/build/code-check/` (add a `.gitignore` for `target/`), and compute the worked-example numbers in code. Extract snippets from the slide files themselves, so what you test is exactly what ships. API names drift between versions, so check them against docs.rs (or the language's equivalent), not memory.

Build after every few sections. That way fit problems surface early:

```bash
node scripts/deck/build.js <pack>
```

It prints:
- the slide count by type;
- slides missing notes;
- **FIT WARNINGS**: fix all of them by splitting slides or moving detail into notes, then rebuild.

It also writes `deck/slide-map.json`, which the guide uses for slide ranges.

### 6. Look at the deck

```bash
scripts/deck/render.sh <pack>/out/<Slug>-Deck.pptx <pack>/build/qa [first] [last]
```

This renders contact sheets of 9 slides each, numbered, through PowerPoint (or LibreOffice). Read every sheet image. Look for:
- overflowing or clipped text;
- cramped tables;
- empty-looking slides;
- literal markup like `*word*`.

Fix the problems in the content files and re-render those ranges. If neither renderer is installed, rely on the fit warnings and say that visual QA was skipped.

### 7. Write the guide

Read `references/guide-components.md`. Write partials in `guide/`:
- `00-front.html`: cover TOC, how-to-use with the learning loop, the plan table;
- chapter files whose section numbers match the deck;
- practice problems with model answers and a dot grid to attempt each first;
- back matter: a cross-cutting drill with an empty answer column, the cheat sheet, and the resource index.

Use `{{slides:N}}` placeholders, never typed slide numbers. Keep writing space small and purposeful: answer lines, drill cells, design grids. Notes blocks are 4 lines at most. Never pad pages.

```bash
python3 scripts/guide/build_guide.py <pack>
```

Fix every **SPARSE PAGE** it reports (a block spilling past a page break) and any unresolved placeholder. Render 3–4 pages to PNG into `<pack>/build/pages/` (`pdftoppm -png -r 60 -f N -l N`) and look at them.

### 8. Verify links and consistency

```bash
python3 scripts/check_links.py <pack>
```

- Replace every DEAD link.
- Spot-check CHECK links that matter.
- Skim deck and guide side by side for one focus section: same terms, same numbers, same section number.

### 9. Report

Tell the user:
- the pack folder, and the two files in `out/`;
- slide and page counts;
- what the focus sections cover, and the firsthand sources the pack leans on most;
- how to use the pack (the learning loop and the plan, including what to skip if short on time);
- anything you couldn't verify.

Keep it short. They will open the files.

## Iterating after delivery

Learners often come back with "more depth on X" or "less of Y". Edit the relevant `deck/cNN-*.js` and `guide/*.html`, then rerun both builders. Slide ranges in the guide update automatically. Section numbers are shared, so if you insert a section, renumber both the deck `section` slides and the guide chapters in the same pass.
