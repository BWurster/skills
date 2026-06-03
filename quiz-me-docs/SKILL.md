---
name: quiz-me-docs
description: >
  Interactively quizzes the user about their own code, block by block, and adds
  their answers as concise comments directly in the code. Use this skill whenever
  the user shares code and asks to be quizzed, tested, or walked through it — or
  says things like "quiz me on this", "help me understand this code", "annotate
  this with my explanations", "walk me through this", or "explain this to me block
  by block". Also trigger when the user points at a file path, line range, function
  name, or directory and asks to be quizzed — e.g. "quiz me on src/auth.py lines
  40-80", "walk me through the authenticate() function", "quiz me on the src/auth/
  folder". Also trigger if the user pastes code and asks Claude to help them learn
  or understand it interactively. Do NOT use for passive code explanation requests
  where the user just wants Claude to explain the code without any back-and-forth.
---

# Quiz Me Docs

Interactively walk the user through their code block by block, quizzing them on
what each block does, then annotating the code with a refined version of their
answer as a comment.

Supports three input modes — pasted code, targeted file/range/function, and
directory walk — described in Step 0 below.

---

## Step 0 — Determine Input Mode

Identify which mode the user is invoking:

### Mode A — Pasted code
The user pastes code directly into the chat. Skip to Step 1.

### Mode B — File targeting (file path + optional line range or block name)
The user points at a specific file, with an optional narrowing:
- `"quiz me on src/auth.py"` → read the whole file
- `"quiz me on src/auth.py lines 45–120"` → read only those lines
- `"quiz me on the authenticate() function in src/auth.py"` → read the file,
  isolate just that function/class/block by name

**How to handle:**
1. Read the file from disk using bash (`cat` or `sed -n '45,120p'` for a range).
2. If a block name was given, find it in the file and extract it (include the full
   function/class body, not just the signature).
3. Confirm what you loaded: "Got it — I've loaded `authenticate()` from
   `src/auth.py` (lines 62–89). Ready to start?"
4. Proceed to Step 1 with the extracted code.

### Mode C — Directory walk
The user points at a directory:
- `"quiz me on src/auth/"` or `"walk me through the auth module"`

**How to handle:**
1. List the files in the directory (non-recursively by default; go recursive only
   if the user asks or the directory is small). Show the user the file list and ask
   which ones to include — or confirm "all of them" if they said so.
2. Work through files one at a time, in a sensible order (entry points first if
   obvious, then dependencies, then utilities). Announce the file before starting
   it: "Starting `auth.py` (file 1 of 3)."
3. Between files, ask: "Ready for the next file, or want to skip ahead?" — respect
   skips.
4. After the last file, offer a combined annotated export of all files.

---

## Step 1 — Parse the Code into Blocks

Mentally segment the loaded code into logical blocks in top-to-bottom order.
Blocks are, in priority order:

1. **Classes** — the entire class as one block (do NOT sub-divide into methods at
   this level; methods are their own blocks when you reach them inside the class)
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
far along they are without being intrusive. In directory mode, also show the file
progress — e.g., "(block 2 of 5 · file 1 of 3)".

When all blocks in the current scope are done:

1. Show the **complete annotated file** in a single code fence.
2. Give a short encouraging closing — e.g., "Here's your fully annotated file!
   Nice work talking through all of it."
3. Offer to write the annotated version back to disk: "Want me to save the
   annotated version back to `src/auth.py`?" (In directory mode, offer to save
   all files at once at the very end.)

---

## Tone Guidelines

- Be a patient, encouraging tutor — not a grader.
- Keep non-code text short. The focus is on the code, not lengthy explanations.
- Match the user's energy: if they're breezy and casual, be casual back; if
  they're serious and focused, stay crisp.
- Never shame a wrong answer. Always treat "I don't know" as a normal, fine thing
  to say.
