#!/usr/bin/env python3
"""Check every URL in a study pack (deck/*.js, guide/*.html, research/*.md).

usage: check_links.py <pack-dir>

Prints DEAD links (404/410, DNS failure) that must be replaced, and CHECK links
(401/403/429/5xx/timeouts) that are often bot-blocking but deserve a manual look.
"""
import re, sys, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
URL = re.compile(r"https?://[^\s\"'<>|\])}`]+")


def collect(pack):
    found = {}
    for pat in ("deck/*.js", "guide/*.html", "research/*.md"):
        for f in sorted(pack.glob(pat)):
            for u in URL.findall(f.read_text()):
                u = u.rstrip(".,;:")
                found.setdefault(u, set()).add(f"{f.parent.name}/{f.name}")
    return found


def probe(u):
    for method in ("HEAD", "GET"):
        try:
            req = urllib.request.Request(u, method=method, headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml,*/*;q=0.8"})
            with urllib.request.urlopen(req, timeout=15) as r:
                return u, r.status, r.geturl()
        except urllib.error.HTTPError as e:
            if method == "HEAD" and e.code in (403, 405, 400, 404, 429, 500, 501):
                continue  # many servers reject HEAD; retry with GET
            return u, e.code, None
        except Exception as e:
            if method == "HEAD":
                continue
            return u, f"error: {type(e).__name__}", None
    return u, "error", None


def main():
    pack = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    found = collect(pack)
    with ThreadPoolExecutor(16) as ex:
        results = list(ex.map(probe, found))
    dead, check = [], []
    for u, st, final in results:
        where = ", ".join(sorted(found[u]))
        if isinstance(st, int) and st < 400:
            continue
        if st in (404, 410) or (isinstance(st, str) and ("URLError" in st or "gaierror" in st)):
            dead.append((u, st, where))
        else:
            check.append((u, st, where))
    print(f"{len(found)} unique links checked: {len(found) - len(dead) - len(check)} ok, {len(dead)} dead, {len(check)} to check by hand")
    for title, rows in (("DEAD", dead), ("CHECK", check)):
        for u, st, where in rows:
            print(f"{title} [{st}] {u}  ({where})")


if __name__ == "__main__":
    main()
