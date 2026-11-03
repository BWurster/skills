#!/usr/bin/env python3
"""Scaffold a study pack.

usage: init_pack.py [pack-dir] --title "Kubernetes for Backend Engineers" [--subtitle "..."]
                    [--say-label "SAY THIS IN THE INTERVIEW"]

pack-dir defaults to ./<title-slug> in the current working directory. Everything the build
produces lives inside it:
  pack.config.json   theme, title, callout labels
  research/          sources.md, notes.md, outline.md
  deck/              cNN-*.js slide content, slide-map.json
  guide/             NN-*.html guide partials
  build/             intermediate artifacts: qa/ renders, code-check/ projects, etc.
  out/               the deliverables: <Slug>-Deck.pptx, <Slug>-Study-Guide.pdf
Never overwrites existing files.
"""
import argparse, json, re
from pathlib import Path

INTRO = '''module.exports = [
  { t: "title", title: TITLE, sectionName: "Introduction", sub: SUBTITLE },

  { t: "concept", title: "How this deck is built for fast learning",
    lede: "Each topic goes: what it is → how it works → worked example → tradeoffs → traps → check yourself.",
    bullets: [
      "**Sections 1–N:** fill in from the outline",
    ],
    callouts: [
      { kind: "key", label: "LEARNING LOOP", text: "1) Work through a section. 2) Cover the slides and answer its “Check yourself” table out loud. 3) Do the matching study-guide page by hand. Retrieval beats rereading." },
      { kind: "why", label: "SPEAKER NOTES", text: "Every slide has notes with extra explanation. Open the notes pane (View → Notes) when a slide feels terse." },
    ],
    notes: "" },
];
'''

FRONT = '''<!-- cover -->
<section class="cover">
  <div>
    <div class="eyebrow">{eyebrow}</div>
    <h1>{title}</h1>
    <p class="sub">{subtitle} <b>Companion to the {{{{deck:total}}}}-slide deck:</b> section numbers match, and every chapter header lists its deck slides.</p>
  </div>
  <div>
    <div class="toc">
      <div><b>★</b>Start here: how to use this guide</div>
      <!-- one <div><b>N</b>Section title</div> per deck section -->
    </div>
    <p class="meta" style="margin-top:14pt">Name ______________________ &nbsp;&nbsp; Target date ____________</p>
  </div>
</section>

<section class="chapter">
  <div class="eyebrow">Start here</div>
  <h1>How to use this guide with the deck</h1>
  <p class="lede"><b>The deck teaches</b> (slides plus speaker notes, built to take you from zero); <b>the guide is where you practice</b>: summaries to review, traps, drills to answer by hand, and space to draw. Section numbers match.</p>
  <div class="box key"><div class="label">The learning loop (repeat for every section)</div>
    <p><b>1.</b> Work through the deck section. <b>2.</b> Close it and answer the guide’s self-check <i>in writing, from memory</i>. <b>3.</b> Check against the deck’s “Check yourself” slide and note what you missed. <b>4.</b> Explain the key idea out loud once.</p>
  </div>
  <h2>The plan</h2>
  <!-- time-boxed table: block | deck slides → guide pages (slides:N placeholder) | what to do | done checkbox -->
</section>
'''


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dir", nargs="?"); ap.add_argument("--title", required=True)
    ap.add_argument("--subtitle", default=""); ap.add_argument("--say-label", default=None)
    ap.add_argument("--eyebrow", default="Study pack")
    a = ap.parse_args()
    slug = re.sub(r"[^A-Za-z0-9]+", "-", a.title).strip("-")
    d = Path(a.dir or slug.lower()).resolve()
    for sub in ("research", "deck", "guide", "build", "out"):
        (d / sub).mkdir(parents=True, exist_ok=True)
    cfg = {
        "title": a.title, "slug": slug, "subtitle": a.subtitle,
        "footer": f"{a.title} · study deck",
        "sayLabel": a.say_label or "SAY IT LIKE THIS",
        "callouts": {},
        "theme": {"name": a.title[:40], "headFontFace": "Cambria", "bodyFontFace": "Calibri",
                  "colors": {"dk1": "14213D", "lt1": "FFFFFF", "dk2": "0F5F73", "lt2": "F3F5F8",
                             "accent1": "B5410F", "accent2": "0F5F73", "accent3": "D9922E", "accent4": "5B6676",
                             "accent5": "2E7D5B", "accent6": "7A2E0B", "hlink": "0F5F73", "folHlink": "5B6676"}},
    }
    files = {
        d / "pack.config.json": json.dumps(cfg, indent=2) + "\n",
        d / "deck" / "c00-intro.js": INTRO.replace("TITLE", json.dumps(a.title)).replace("SUBTITLE", json.dumps(a.subtitle)),
        d / "guide" / "00-front.html": FRONT.format(eyebrow=a.eyebrow, title=a.title, subtitle=a.subtitle),
        d / "research" / "sources.md": "# Source log\n\n| Tier | Source | Who / why credible | Used in sections | Link |\n|---|---|---|---|---|\n",
        d / "research" / "outline.md": f"# {a.title}: outline\n\nLearner: \nGoal and deadline: \nTime budget: \n\n## Sections\n",
    }
    for p, text in files.items():
        if p.exists():
            print(f"kept existing {p.relative_to(d)}")
        else:
            p.write_text(text); print(f"created {p.relative_to(d)}")
    print(f"pack directory: {d}")


if __name__ == "__main__":
    main()
