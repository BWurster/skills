#!/usr/bin/env python3
"""Build the study-guide PDF from <pack-dir>/guide/*.html partials.

usage: build_guide.py <pack-dir>

Partials hold <section> markup only; this script adds the <head> and stylesheet, resolves
placeholders from deck/slide-map.json, prints with headless Chrome, and checks the result:
  {{slides:4}}      -> "Deck slides 30–55"   (section 4's range)
  {{slides:4-6}}    -> "Deck slides 30–98"   (first of 4 to last of 6)
  {{deck:total}}    -> total slide count
Keep slide ranges as placeholders: hand-typed ranges go stale every time the deck changes.
"""
import html, json, os, re, shutil, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def find_chrome():
    cands = [os.environ.get("CHROME", ""),
             "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
             "/Applications/Chromium.app/Contents/MacOS/Chromium",
             "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"]
    cands += [shutil.which(n) or "" for n in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "msedge")]
    return next((c for c in cands if c and os.path.exists(c)), None)


def main():
    pack = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    cfg = json.loads((pack / "pack.config.json").read_text())
    parts = sorted((pack / "guide").glob("*.html"))
    if not parts:
        sys.exit(f"no guide/*.html partials in {pack}")
    body = "\n".join(p.read_text() for p in parts)

    smap_path = pack / "deck" / "slide-map.json"
    smap = json.loads(smap_path.read_text()) if smap_path.exists() else {"total": 0, "sections": []}
    secs = {s["num"]: s for s in smap["sections"]}

    def slides(m):
        a, b = m.group(1), m.group(2) or m.group(1)
        if a not in secs or b not in secs:
            print(f"warning: {m.group(0)} names a section the deck does not have")
            return m.group(0)
        first, last = secs[a]["first"], secs[b]["last"]
        return f"Deck slide {first}" if first == last else f"Deck slides {first}–{last}"

    body = re.sub(r"\{\{slides:([\w.]+)(?:-([\w.]+))?\}\}", slides, body)
    body = body.replace("{{deck:total}}", str(smap["total"]))
    left = sorted(set(re.findall(r"\{\{[^}]*\}\}", body)))
    if left:
        print("unresolved placeholders:", ", ".join(left))

    c = cfg.get("theme", {}).get("colors", {})
    css_vars = ""
    if c:
        css_vars = (":root { "
                    + (f"--accent: #{c['accent1']}; " if "accent1" in c else "")
                    + (f"--accent2: #{c['dk2']}; " if "dk2" in c else "")
                    + (f"--source: #{c['accent5']}; " if "accent5" in c else "")
                    + "}\n")
    css = (HERE / "base.css").read_text() + "\n" + css_vars + cfg.get("guideCss", "")
    doc = (f'<!DOCTYPE html>\n<html lang="{cfg.get("lang", "en")}">\n<head>\n<meta charset="utf-8">\n'
           f'<title>{html.escape(cfg["title"])} — Study Guide</title>\n<style>\n{css}\n</style>\n</head>\n<body>\n{body}\n</body>\n</html>\n')
    out_dir, build_dir = pack / "out", pack / "build"
    out_dir.mkdir(exist_ok=True); build_dir.mkdir(exist_ok=True)
    html_path = build_dir / "study-guide.html"   # intermediate; the PDF is the deliverable
    html_path.write_text(doc)
    pdf = out_dir / f"{cfg['slug']}-Study-Guide.pdf"

    chrome = find_chrome()
    if not chrome:
        sys.exit(f"wrote {html_path}, but no Chrome/Chromium/Edge found to print it. Set CHROME=/path/to/browser.")
    subprocess.run([chrome, "--headless", "--disable-gpu", "--no-pdf-header-footer", "--no-sandbox",
                    f"--print-to-pdf={pdf}", html_path.as_uri()], check=True, capture_output=True)

    info = subprocess.run(["pdfinfo", str(pdf)], capture_output=True, text=True).stdout
    pages = int(re.search(r"Pages:\s+(\d+)", info).group(1))
    print(f"wrote {pdf} ({pages} pages from {len(parts)} partials)")
    # near-empty pages are almost always a box or writing area that spilled past a page break
    sparse = []
    for i in range(2, pages + 1):  # page 1 is the cover
        t = subprocess.run(["pdftotext", "-f", str(i), "-l", str(i), str(pdf), "-"], capture_output=True, text=True).stdout
        n = len(re.sub(r"\s+", "", t))
        if n < 120:
            sparse.append((i, n, " ".join(t.split())[:70]))
    if sparse:
        print("SPARSE PAGES (likely spills; tighten or trim the block before the break):")
        for i, n, t in sparse:
            print(f"  p{i}: {n} chars  {t!r}")
    else:
        print("no sparse pages")


if __name__ == "__main__":
    main()
