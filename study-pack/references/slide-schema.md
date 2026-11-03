# Slide schema

Deck content lives in `deck/cNN-name.js` files, each `module.exports = [ ...slides ]`. Files are
concatenated in filename order, so use one file per section (`c04-caching.js`) and two-digit numbers.
Content files are mostly data. Slides reused in two sections can live in a helper file without the `c` prefix (e.g. `shared.js`) and be `require`d.

## Inline markup (any text field)

| Markup | Renders as |
|---|---|
| `**bold**` | bold. Single `*stars*` are **not** supported; they show literally and the build warns |
| `[[label|https://url]]` | hyperlink |
| `` `code` `` | monospace |
| `- ` at the start of a bullet | sub-bullet |

## Fields shared by content slides

- `title` (required): ≤ 58 characters, or the build warns about wrapping. Make it the slide's message, not a label.
- `lede`: one italic sentence under the title that frames the slide.
- `notes`: speaker notes. **Every content slide gets notes.** This is where the "from zero" depth goes:
  the intuition, the longer explanation, the edge case, what to say if asked. 2–6 sentences.
- `links`: `[["label", "url"], ...]`, rendered as a "Learn more" line at the bottom. 1–4 links, best first.
- `callouts`: `[{ kind, text, label? }]`. Kinds:

| kind | default label | use for |
|---|---|---|
| `key` | KEY IDEA | the one thing to remember from the slide |
| `say` | from `sayLabel` in config | phrasing to use out loud (interview, exam essay, explaining to a team) |
| `trap` | COMMON TRAP | the misconception or weak answer |
| `example` | WORKED EXAMPLE | concrete numbers or a mini scenario |
| `analogy` | ANALOGY | an everyday mapping for an abstract idea |
| `why` | WHY IT MATTERS | the motivation |
| `source` | FROM THE SOURCE | a short firsthand quote or finding, with who said it |
| custom | from config | define in `pack.config.json` → `"callouts": { "air": { "label": "AIR-GAPPED TWIST", "color": "2E3A78" } }` |

`label` overrides the default label for one callout.

## Slide types

### `title`: opening slide (dark)
```js
{ t: "title", title: "Kubernetes:\nFrom Zero to Production", sectionName: "Introduction", sub: "One-line promise of the deck." }
```

### `section`: section divider (dark). Its `num` drives the guide's `{{slides:N}}` ranges
```js
{ t: "section", num: "4", title: "Scheduling and resources", sub: "What this section covers and why it matters for the goal." }
```

### `concept`: bullets, optional callout column on the right
```js
{ t: "concept", title: "Requests reserve; limits cap",
  lede: "The scheduler only looks at requests.",
  bullets: ["**Requests** are what the scheduler packs onto nodes", "- sub-point", "**Limits** are enforced at runtime"],
  callouts: [{ kind: "trap", text: "Setting limits without requests..." }],
  wide: false,   // true gives bullets 8.0in instead of 7.25in
  links: [["Kubernetes docs: resource management", "https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/"]],
  notes: "..." }
```
Budget: about 5–7 bullets with callouts, 8 without. More than that → split the slide.

### `two`: two (or more) cards side by side
```js
{ t: "two", title: "Deployment vs. StatefulSet",
  left: { h: "Deployment", bullets: ["...", "..."] },
  right: { h: "StatefulSet", bullets: ["...", "..."], color: "B5410F" },
  // or cols: [{h, bullets}, {h, bullets}, {h, bullets}] for 3 columns
  callout: { kind: "key", text: "..." },   // single full-width callout at the bottom
  notes: "..." }
```

### `table`: comparison grid. Also used for follow-up drills
```js
{ t: "table", title: "Choosing a Service type",
  head: ["Type", "Reachable from", "Use when"],
  colW: [0.2, 0.3, 0.5],          // fractions, any scale
  rows: [["ClusterIP", "inside the cluster", "..."], ...],
  boldFirst: true,                // default true
  callouts: [{ kind: "key", text: "..." }],   // shown under the table
  notes: "..." }
```
Budget: about 6 rows of 2–3 short lines. The build shrinks text to 12pt before warning; a table
that warns must be split across two slides ("(part 1)", "(part 2)").

### `flow`: a row of numbered steps with arrows, then bullets/callouts
```js
{ t: "flow", title: "What happens on kubectl apply",
  steps: [["1 · API server", "validates, stores in etcd"], ["2 · Scheduler", "picks a node"], ["3 · Kubelet", "starts containers"]],
  steps2: [...],                   // optional second row (outlined style)
  bullets: [...], callouts: [...], notes: "..." }
```
3–6 steps. Captions ≤ 5 words.

### `arch`: architecture in labeled lanes
```js
{ t: "arch", title: "Architecture: request path",
  lanes: [
    { label: "Edge", boxes: [["Load balancer", "L7, TLS"], ["Gateway", "auth, limits"]], dark: true },
    { label: "Data", boxes: [["Postgres", "source of truth"], ["Redis", "cache"]], arrows: false },
  ],
  callouts: [{ kind: "say", text: "..." }], notes: "..." }
```
At most 4 lanes of up to 4 boxes. Keep bullets off arch slides; put the detail in notes or a following slide.

### `code`: code panel left, explanation right
```js
{ t: "code", title: "Token bucket in Redis Lua",
  code: "local key = KEYS[1]\n...",   // ≤ 22 lines, ≤ 55 chars wide at default codeW
  codeW: 6.4,
  bullets: ["**Line 3:** ..."], callouts: [...], notes: "..." }
```
Works for any formal notation: code, SQL, equations, music notation in text, grammar tables.

### `stats`: big numbers
```js
{ t: "stats", title: "Numbers to know",
  stats: [["~100 ns", "main memory reference"], ["~150 ms", "round trip CA → Netherlands"]],
  cols: 4, callout: { kind: "example", text: "..." }, notes: "..." }
```

### `quote`: a firsthand voice
```js
{ t: "quote", title: "Why Stripe built four kinds of limiter",
  quote: "<a verbatim sentence or two you read at the URL>",   // short; ≤ 40 words
  who: "<author name from the page>", role: "Stripe engineering", source: "Stripe blog: Scaling your API with rate limiters",
  url: "https://stripe.com/blog/rate-limiters",
  bullets: ["What to take from this: ..."], callouts: [...], notes: "Context: ..." }
```
Quote only text you have actually read at the URL, verbatim and short. If you are summarizing,
drop the quotation marks: use a `concept` slide with a `source` callout instead.

### `quiz`: "Check yourself" at the end of every section
```js
{ t: "quiz", title: "Check yourself: scheduling",
  qs: [["Question?", "Short model answer."], ...] }   // 4–6 questions
```

## Fit warnings

`build.js` prints `FIT WARNINGS` with the slide title. Treat every warning as a bug: shorten, move
detail into `notes`, or split the slide. Rebuild until there are none (or only ones you checked
visually in the rendered sheets).
