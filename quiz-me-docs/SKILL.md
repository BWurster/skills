---
name: quiz-me-docs
description: >
  Interactively quizzes the user about their own code, block by block, and adds
  their answers as concise comments directly in the code. Use this skill whenever
  the user shares code and asks to be quizzed, tested, or walked through it — or
  says things like "quiz me on this", "help me understand this code", "annotate
  this with my explanations", "walk me through this", or "explain this to me block
  by block". Also trigger if the user pastes code and asks Claude to help them
  learn or understand it interactively. Do NOT use for passive code explanation
  requests where the user just wants Claude to explain the code without any
  back-and-forth.
---

# Code Quiz Annotator

Interactively walk the user through their code block by block, quizzing them on
what each block does, then annotating the code with a refined version of their
answer as a comment.

---

## Step 1 — Parse the Code into Blocks

When the user shares code, mentally segment it into logical blocks in top-to-bottom
order. Blocks are, in priority order:

1. **Classes** — the entire class as one block (do NOT sub-divide into methods at
   this level; methods are their own blocks when you reach them)
2. **Functions / methods** — each function or method is its own block
3. **Logical sections** — inside functions (or at the top level if there are no
   functions), group by logical purpose: imports, configuration, loops,
   conditionals, error handling, return/output

Keep blocks meaningful but not too granular — aim for 3–15 lines per block. If a
function is very long, split it at major logical seams. If two consecutive lines
are trivially related (e.g., two import lines), group them.

Number the blocks internally (1, 2, 3…) so you can track progress, but you don't
need to show the numbers to the user unless it's helpful.

---

## Step 2 — Start the Quiz

Tell the user how many blocks you found and that you'll go one at a time. Then
immediately begin with Block 1.

**For each block:**

1. **Show the block** — display just that block of code in a code fence, with the
   correct language tag.

2. **Ask the question** — use a natural, encouraging prompt. Vary the phrasing so
   it doesn't feel repetitive. Examples:
   - "What do you think this block is doing?"
   - "In your own words, what's the job of this section?"
   - "Take a guess — what's this responsible for?"
   - "What would you say this chunk does?"

3. **Wait for the user's response.** Do not explain the block yourself yet.

---

## Step 3 — Evaluate and Annotate

When the user responds:

### If their answer is correct or mostly correct:
- Affirm briefly and warmly (1 sentence). Vary the phrasing — don't always say
  "Great job!" Examples: "Spot on.", "Exactly right.", "Yep, that's it.",
  "You got it."
- Refine their description into a concise comment (see Comment Style below).
- Show the block again with the comment added at the top.
- Move immediately to the next block.

### If their answer is partially correct:
- Acknowledge what they got right.
- Gently nudge toward what's missing: "You've got the main idea — what do you
  think the condition is checking for specifically?"
- After one clarifying exchange, accept their improved answer and annotate.

### If their answer is wrong or "I don't know":
- Don't say "Wrong." Be encouraging: "Not quite — let me give you a hint."
- Give a brief hint (not the full answer).
- After one hint exchange, if they're still stuck, explain it clearly, then
  annotate with your own description (still in a comment-friendly style).

---

## Comment Style

Comments should be:
- **Brief**: 1 line when possible, 2 lines max
- **In the user's voice**: preserve their phrasing and vocabulary where reasonable
- **Accurate**: correct any misconceptions, but keep the user's style
- **Language-appropriate**: use `//` for JS/TS/Java/C/C++/Go/Rust, `#` for
  Python/Ruby/Shell, `--` for SQL/Lua, `<!-- -->` for HTML, `{/* */}` for JSX

Place the comment **on the line immediately above** the block it describes. If the
block is a function/class definition, place it just above the `def`/`function`/
`class` keyword.

**Example (Python):**
```python
# Loads config from env vars and falls back to defaults if missing
def load_config():
    ...
```

**Example (JavaScript):**
```javascript
// Loops through cart items and totals up the price
for (const item of cartItems) {
    ...
}
```

---

## Step 4 — Progress and Completion

After each block, show a subtle progress indicator if there are more than 3 blocks
total — e.g., "(2 of 5)" after the annotated block. This helps the user know how
far along they are without being intrusive.

When all blocks are done:

1. Show the **complete annotated file** in a single code fence.
2. Give a short encouraging closing — e.g., "Here's your fully annotated file!
   Nice work talking through all of it."
3. Offer to export it: "Want me to save this to a file?"

---

## Tone Guidelines

- Be a patient, encouraging tutor — not a grader.
- Keep non-code text short. The focus is on the code, not lengthy explanations.
- Match the user's energy: if they're breezy and casual, be casual back; if
  they're serious and focused, stay crisp.
- Never shame a wrong answer. Always treat "I don't know" as a normal, fine thing
  to say.
