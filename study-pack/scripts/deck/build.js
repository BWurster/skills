// node build.js <pack-dir>
// Assembles <pack-dir>/deck/c*.js into out/<slug>-Deck.pptx, applies the theme from
// pack.config.json, and writes deck/slide-map.json (section number -> slide range) for the guide.
const fs = require("fs");
const path = require("path");
const { build, warnings } = require("./lib");
const { applyTheme } = require("./apply_theme");

const dir = path.resolve(process.argv[2] || ".");
const cfgPath = path.join(dir, "pack.config.json");
if (!fs.existsSync(cfgPath)) { console.error(`no pack.config.json in ${dir} (run init_pack.py first)`); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const deckDir = path.join(dir, "deck");
const files = fs.readdirSync(deckDir).filter((f) => /^c\d+.*\.js$/.test(f)).sort();
const slides = files.flatMap((f) => {
  const p = path.join(deckDir, f);
  delete require.cache[p];
  const mod = require(p);
  if (!Array.isArray(mod)) throw new Error(`${f} must export an array of slide objects`);
  return mod;
});
fs.mkdirSync(path.join(dir, "out"), { recursive: true });
const out = path.join(dir, "out", `${cfg.slug}-Deck.pptx`);

build(slides, out, cfg)
  .then((theme) => applyTheme(out, theme))
  .then(() => {
    const map = []; let cur = null;
    slides.forEach((s, i) => {
      if (s.t === "section") { cur = { num: String(s.num), title: s.title, first: i + 1 }; map.push(cur); }
      if (cur) cur.last = i + 1;
    });
    fs.writeFileSync(path.join(deckDir, "slide-map.json"), JSON.stringify({ total: slides.length, sections: map }, null, 1));
    const counts = {};
    slides.forEach((s) => (counts[s.t] = (counts[s.t] || 0) + 1));
    console.log(`wrote ${out}\n${slides.length} slides from ${files.length} files · ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(", ")}`);
    const noNotes = slides.filter((s) => !["title", "section"].includes(s.t) && !s.notes).length;
    if (noNotes) console.log(`${noNotes} content slides have no speaker notes`);
    if (warnings.length) console.log(`FIT WARNINGS (${warnings.length}):\n` + warnings.join("\n"));
    else console.log("no fit warnings");
  })
  .catch((e) => { console.error(e.message || e); process.exit(1); });
