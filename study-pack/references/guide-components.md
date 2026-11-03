# Study-guide components

The guide is HTML partials in `guide/NN-name.html`, concatenated in filename order and printed to a
Letter PDF by `scripts/guide/build_guide.py`. Partials contain `<section>` blocks only: no
`<html>`, `<head>` or `<style>` (the builder adds those and the stylesheet). Extra CSS for one pack
goes in `pack.config.json` → `"guideCss"`.

Suggested split: `00-front.html` (cover, how to use, plan), one file per 2–4 deck sections,
`80-practice.html`, `90-back.html` (cross-cutting drill, cheat sheet, resource index).

## The guide's job

The deck teaches; the guide is the **workbook and the review copy**. A chapter compresses its deck
section into what's worth rereading, plus things to *do*. It should not re-teach everything in prose,
and it must not contradict the deck. Same section numbers, same terms, same numbers.

## Chapter skeleton

```html
<section class="chapter">
  <div class="eyebrow">Section 4 · {{slides:4}}</div>
  <h1>Scheduling and resources</h1>
  <p class="lede">One or two sentences: what this is and why it matters for the goal.</p>

  <h2>Core idea</h2>
  <!-- compressed summary: a table or two-column bullets beats paragraphs -->

  <div class="box say"><div class="label">Say it like this</div><p>…</p></div>
  <div class="box trap"><div class="label">Trap</div><p>…</p></div>
  <div class="box source"><div class="label">From the source</div>
    <blockquote>“Short verbatim quote.”</blockquote>
    <div class="who">— Name, role · <a href="…">where it was said</a></div></div>

  <h3>Self-check (answer from memory, then check the deck’s slide {{slides:4}})</h3>
  <ol class="selfcheck">
    <li>Question?<span class="ans"></span></li>
  </ol>

  <div class="res"><div class="label">Go deeper</div>
    <ul class="tight"><li><a href="…">Best resource</a>: one line on why it’s worth the time</li></ul></div>

  <div class="notes"><div class="nl">My notes</div><div class="lines" style="--n:4"></div></div>
</section>
```

Placeholders: `{{slides:4}}` → "Deck slides 30–55", `{{slides:4-6}}` → the range from section 4 to
section 6, `{{deck:total}}` → the slide count. **Always use placeholders for slide numbers**, never
typed ranges.

## Components

| Class | What |
|---|---|
| `.chapter` | starts a new page |
| `.eyebrow`, `.lede` | small caps kicker line; intro paragraph |
| `.two` | two-column grid (`<div class="two"><div>…</div><div>…</div></div>`) |
| `.box.key` / `.box.say` / `.box.trap` / `.box.source` | callout boxes, each with `<div class="label">` |
| `.res` | "Go deeper" link box: 2–5 links ranked best first, each with a reason |
| `table` | `<th style="width:20%">` to set column widths. An empty `<td></td>` becomes a 0.4in answer cell |
| `ol.selfcheck` + `<span class="ans"></span>` | question with one ruled answer line |
| `.notes > .nl + .lines` | ruled notes. `style="--n:4"` lines. **Keep ≤ 4 lines** |
| `.grid` | dot grid for drawing, `style="--h:4in"`. Only where the learner is asked to draw/derive something |
| `.q-tag` | pill label for practice problems ("P3") |
| `.check` | empty checkbox for plans and checklists |
| `.small`, `.tight` | smaller text; tighter list |
| `.cover`, `.toc`, `.meta` | cover page |

## Writing space: small and purposeful

Learners prefer a dense, reviewable guide over one padded with blank ruled pages. Writing space
should exist only where the guide asks for an action: answer lines under self-check questions, empty
answer cells in drill tables, a dot grid for a practice problem's diagram or derivation, a short
worksheet (e.g. behavioral stories). Never pad a chapter to fill its last page, and cap notes blocks
at 4 lines. If the learner asks for more writing room, add it then.

## Page hygiene

`build_guide.py` lists **SPARSE PAGES**: pages with almost no text. These are nearly always a box,
grid or notes block pushed past a page break. Fix by trimming that block, shrinking a grid's `--h`,
or deleting a notes block, and rebuild until only intentional sparse pages remain (e.g. a full-page
practice grid). Also look at 3–4 rendered pages (`pdftoppm -png -r 60 -f N -l N`) to confirm the
layout, not just the text.
