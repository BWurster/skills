# Research: best resources and firsthand sources

The pack is only as good as its sources. The aim is to teach what the people who actually built,
use, examine or hire for this thing say, not what a content farm paraphrased from them.

## Source tiers

Log every source you rely on in `research/sources.md` with its tier.

| Tier | What | Examples |
|---|---|---|
| **1. Primary / firsthand** | Written by the people who created, maintain, operate, decide or assess the topic | official docs and specs; RFCs and standards; the original paper; the maintainers' design docs; engineering blogs by the team that built the system; postmortems; official exam guides, syllabi, mark schemes; the job posting; talks by practitioners; regulators' own guidance; primary historical documents |
| **2. Expert synthesis** | Recognized experts who cite primary sources | well-known textbooks; university course notes; respected practitioner blogs and newsletters; review articles; conference tutorials |
| **3. Experience reports** | People reporting what happened to them | interview/exam experience posts (Glassdoor, Blind, Reddit, forums), "what I wish I knew" posts, case studies, Q&A answers with evidence |
| **4. Aggregators** | Summaries of the above | listicles, generic tutorials, AI-written explainers |

Build each section's core claims on tier 1–2. Use tier 3 to learn **what actually gets asked or goes
wrong**, the thing official sources never say. Use tier 4 only to find tier 1–3 sources.

## What "firsthand input" means in the pack

- **Quotes and findings with attribution.** Where a practitioner said something that sharpens
  understanding (why they made a choice, what broke, what they look for), use a `quote` slide or a
  `source` callout, and a `.box.source` in the guide. Name the person or team, their role and the
  link. Quote verbatim only from text you fetched and read; keep quotes short (≤ 40 words). Otherwise paraphrase
  and attribute ("Stripe's engineering team reports that…").
- **Reported questions / real scenarios.** For interviews, exams and certifications, collect what
  candidates report being asked and how it was graded, and map each to a section and practice
  problem. Say how many independent reports you found and how recent they are.
- **The assessor's own words.** Exam blueprints, rubrics, job postings and team/company engineering
  posts tell you what is weighted. Quote the relevant line and design the time budget around it.
- **Disagreements.** When credible sources disagree, show both and say when each is right. This is
  valuable teaching material, not something to smooth over.

## How to research

Use WebSearch and WebFetch directly (run several searches in the same turn). Spend roughly 10–20% of
the effort here before writing slides, and come back for targeted lookups while writing.

1. **Map the territory.** Search for the official docs, the canonical paper/book/course, and 2–3
   "learning roadmap" or syllabus sources. List the subtopics they agree on.
2. **Find the firsthand voices.** For each major subtopic, search for: `"<topic>" engineering blog`,
   `"<topic>" postmortem`, `"<topic>" design doc`, `<maintainer name> talk`, `site:<official domain>`,
   `"<topic>" paper pdf`. For interviews/exams: `"<company/exam>" interview experience <role>`,
   `site:reddit.com <exam> passed tips`, `"<company>" engineering blog`, and the official posting or blueprint.
3. **Read before you cite.** Fetch every page you plan to quote, cite as evidence for a fact, or put
   in a "Go deeper" box. Don't link from search snippets alone; snippets misattribute and pages move.
4. **Check freshness.** Note the publication date. For fast-moving topics, prefer the last 2 years and
   check facts (versions, limits, prices, APIs) against current official docs. Flag anything that
   changes often as "check current value".
5. **Rank the resources.** For each section, pick the 1–4 best links: the one to read if you read
   only one goes first. Prefer free, durable URLs (official docs, arXiv, the author's own site) over
   paywalled or link-rotted mirrors.
6. **Record as you go** in `research/sources.md`: tier, source, why credible, sections used in, link.
   Put reported questions and quotes you plan to use in `research/notes.md` with their URLs.

## Before shipping

Run `python3 scripts/check_links.py <pack>`. Replace every DEAD link (search for the moved URL;
blogs often move to Medium or a new domain, papers have arXiv copies). Open CHECK links by hand if
they matter. Never ship a link you have not seen resolve at least once.
