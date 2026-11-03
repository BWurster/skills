# Learning design

The pack is optimized for **learning fast toward a specific goal**, starting from little or no
knowledge. Three ideas drive every decision:

1. **Tailor ruthlessly to the goal.** Depth goes where the goal is tested. A generic "foundations"
   deck is the most common failure: it reads well and doesn't prepare anyone for the real thing.
2. **Teach from zero, but only the zero that's needed.** Primer material exists to support the focus
   topics, nothing more.
3. **Retrieval beats rereading.** Every section ends in something the learner has to produce from
   memory: a quiz, a drill, a derivation, a design.

## Shape of the pack

| Part | Purpose | Typical share |
|---|---|---|
| Intro | What's tested / what the goal requires, how to use the pack, the plan | 3–6 slides |
| Primer sections | Only the prerequisites the focus topics depend on; "skim if familiar" | 10–15% |
| Framework section | The repeatable method for the task (answer structure, problem-solving steps, exam technique) | 3–8 slides |
| **Focus sections** | The topics the goal actually tests, each in real depth | 50–65% |
| Applied / scenario sections | How focus topics combine in the real contexts (question types, case types, real systems) | 10–20% |
| Practice problems | Worked end-to-end with model answers | 10–15% |
| Drill + cheat sheet | Rapid-fire follow-ups with model answers; one-page summary; ranked resources | 4–8 slides |

**Size from the time budget.** Rough guide: 15–18 slides and 5–6 guide pages per study hour. A 10-hour
interview sprint is roughly 170 slides and a 55–60-page guide. Don't cap length artificially; size to the
material the goal needs, and say up front how long it is and what to skip if short on time.

## Inside one focus section

Order the slides so each builds on the last:

1. **Section divider:** what it is and why it matters for the goal.
2. **The problem / motivation** (`why` or `analogy` callout).
3. **How it works:** mechanism first, from zero. One idea per slide. Use `flow` for processes,
   `code` for formal detail, `table` for alternatives.
4. **Worked example with real numbers** (`example` callout or a `stats`/`table` slide). Trace it step by
   step; this is where understanding clicks.
5. **Tradeoffs / when to use which:** comparison `table` with "use when" column.
6. **Firsthand input:** how practitioners actually do it, what went wrong for them (`quote` or `source`).
7. **The context-specific twist:** how this topic shows up in the learner's actual goal (the company's
   systems, the exam's question style, the job's daily work).
8. **Traps:** the misconceptions and weak answers (`trap` callouts).
9. **What to say / write:** language that signals mastery (`say` callouts), if the goal involves
   performing (interview, oral exam, presentation).
10. **Follow-up drill:** table of likely probing questions with strong answers.
11. **Check yourself:** `quiz` slide, 4–6 questions.

Deep focus topics deserve a **deep-dive sub-sequence**: the algorithm traced by hand, edge cases, the
production version, the failure modes. In the reference build, rate limiting alone was 26 slides.

## Speaker notes carry the depth

Slides stay scannable; notes hold the full explanation a tutor would give: the intuition, the "why",
the edge case, the common question. Write notes for every content slide. A learner reading only the
notes should still follow the section.

## Practice problems

For each problem: the prompt as it would really be posed → clarifying questions/requirements →
the method applied step by step (estimates, design, derivation, analysis) → key decisions with the
reasoning and the alternative → failure modes / pitfalls → follow-up variants. The deck walks the
first 2–4 problems in full and condenses the rest; the guide gives each a model answer and a space
(dot grid) to attempt it first.

Pick problems that **exercise several focus topics at once**, prioritize reported/real ones, and tag
each with priority (Must / High / Medium) so a time-short learner knows which to do.

## The guide mirrors the deck

- Same section numbers; each chapter's eyebrow shows its deck slides via `{{slides:N}}`.
- Cover TOC + "How to use this guide with the deck" page with the learning loop.
- A time-boxed plan table: block → deck slides → guide pages → task → checkbox, plus a "only have half
  the time?" line naming the must-do sections and problems.
- Each chapter: compressed summary, say/trap/source boxes, self-check with answer lines, go-deeper links.
- Back matter: cross-cutting drill table with an empty answer column, cheat sheet, full resource index
  grouped by section.

## Tone

Plain, direct, concrete. Short sentences. Define every term the first time it appears. Numbers over
adjectives. No filler, no hype.
