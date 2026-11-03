// Slide templates for study decks. Content files describe slides as plain objects;
// these functions lay them out on a 13.33" x 7.5" canvas and warn when text may not fit.
// Colors, fonts, footer and callout kinds come from the pack config (see configure()).
const pptxgen = require("pptxgenjs");

const DEFAULT_THEME = {
  name: "Study Pack",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "14213D", lt1: "FFFFFF", dk2: "0F5F73", lt2: "F3F5F8",
    accent1: "B5410F", accent2: "0F5F73", accent3: "D9922E", accent4: "5B6676",
    accent5: "2E7D5B", accent6: "7A2E0B", hlink: "0F5F73", folHlink: "5B6676",
  },
};

// named roles, filled from the theme by configure()
let THEME = DEFAULT_THEME;
let NAVY, TEAL, ORANGE, BODY, MUTED, TINT, RULE, HEAD, NUM;
let CALLOUT = {};
const X0 = 0.6, W = 12.13, Y0 = 1.3, YMAX = 6.85;
const CW = 0.45, LH = 1.2; // avg char width (em) and line height, used for fit estimates

const mix = (hex, other, amt) => {
  const a = parseInt(hex, 16), b = parseInt(other, 16);
  const ch = (v, s) => (v >> s) & 255;
  const c = (s) => Math.round(ch(a, s) * (1 - amt) + ch(b, s) * amt);
  return [16, 8, 0].map((s) => c(s).toString(16).padStart(2, "0")).join("").toUpperCase();
};
const tint = (hex, amt) => mix(hex, "FFFFFF", amt);
const shade = (hex, amt) => mix(hex, "000000", amt);

function configure(cfg = {}) {
  THEME = { ...DEFAULT_THEME, ...(cfg.theme || {}), colors: { ...DEFAULT_THEME.colors, ...((cfg.theme || {}).colors || {}) } };
  const c = THEME.colors;
  NAVY = c.dk1; TEAL = c.dk2; ORANGE = c.accent1; MUTED = c.accent4; TINT = c.lt2;
  BODY = mix(c.dk1, "333333", 0.5); RULE = tint(c.accent4, 0.75); HEAD = THEME.headFontFace; NUM = tint(c.accent1, 0.3);
  const box = (label, color) => ({ label, fill: tint(color, 0.88), lc: color, tc: shade(color, 0.55) });
  CALLOUT = {
    key: box("KEY IDEA", TEAL),
    say: box(cfg.sayLabel || "SAY IT LIKE THIS", TEAL),
    trap: box("COMMON TRAP", ORANGE),
    analogy: { label: "ANALOGY", fill: TINT, lc: MUTED, tc: NAVY },
    why: { label: "WHY IT MATTERS", fill: TINT, lc: MUTED, tc: NAVY },
    example: box("WORKED EXAMPLE", c.accent3),
    source: box("FROM THE SOURCE", c.accent5),
  };
  for (const [k, v] of Object.entries(cfg.callouts || {})) CALLOUT[k] = box(v.label || k.toUpperCase(), v.color || c.accent2);
}
configure();

const warnings = [];
let current = "";
function warn(msg) { warnings.push(`[${current}] ${msg}`); }

// "**bold**", "[[label|url]]" and "`code`" markup -> pptxgenjs text runs
function runs(str, base = {}) {
  const out = [];
  const re = /\*\*(.+?)\*\*|\[\[(.+?)\|(.+?)\]\]|`(.+?)`/g;
  let last = 0, m;
  while ((m = re.exec(str))) {
    if (m.index > last) out.push({ text: str.slice(last, m.index), options: { ...base } });
    if (m[1]) m[1].split(/`([^`]+)`/).forEach((part, i) => {  // `code` may sit inside **bold**
      if (part) out.push({ text: part, options: { ...base, bold: true, ...(i % 2 ? { fontFace: "Courier New" } : {}) } });
    });
    else if (m[2]) out.push({ text: m[2], options: { ...base, color: TEAL, hyperlink: { url: m[3] } } });
    else out.push({ text: m[4], options: { ...base, fontFace: "Courier New" } });
    last = re.lastIndex;
  }
  if (last < str.length) out.push({ text: str.slice(last), options: { ...base } });
  if (!out.length) out.push({ text: "", options: { ...base } });
  // a lone "*" left over usually means *single-star* emphasis, which this markup does not support
  if (/(^|[^*])\*[^*\s][^*]*\*(?!\*)/.test(str.replace(/\*\*(.+?)\*\*/g, ""))) warn(`single-star emphasis is shown literally: ${str.slice(0, 50)}`);
  return out;
}
const plain = (s) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[\[(.+?)\|(.+?)\]\]/g, "$1").replace(/`(.+?)`/g, "$1");

function estLines(text, pt, w) {
  const cpl = Math.max(8, Math.floor(((w - 0.2) / ((pt / 72) * CW)) * 0.92));
  return text.split("\n").reduce((n, p) => n + Math.max(1, Math.ceil(p.length / cpl)), 0);
}
const lineH = (pt) => (pt / 72) * LH;

function bulletParas(items, pt, color = BODY) {
  const out = [];
  items.forEach((it, i) => {
    const sub = it.startsWith("- ");
    const txt = sub ? it.slice(2) : it;
    const fs = sub ? pt - 1 : pt;
    const rs = runs(txt, { fontSize: fs, color });
    // paragraph options go on the first run only: pptxgenjs starts a new paragraph at every run carrying a bullet
    Object.assign(rs[0].options, { bullet: sub ? { indent: 16 } : { indent: 18 }, indentLevel: sub ? 1 : 0, paraSpaceAfter: 6 });
    rs[rs.length - 1].options.breakLine = i < items.length - 1;
    out.push(...rs);
  });
  return out;
}
function estBullets(items, pt, w) {
  let h = 0.12;
  for (const it of items) {
    const sub = it.startsWith("- ");
    const t = plain(sub ? it.slice(2) : it);
    h += estLines(t, sub ? pt - 1 : pt, w - (sub ? 0.65 : 0.35)) * lineH(sub ? pt - 1 : pt) + 6 / 72;
  }
  return h;
}
function fitBullets(items, w, h, sizes = [20, 19, 18, 17, 16, 15, 14]) {
  for (const pt of sizes) if (estBullets(items, pt, w) <= h) return pt;
  warn(`bullets may overflow (${estBullets(items, 14, w).toFixed(2)}in needed, ${h.toFixed(2)}in available)`);
  return sizes[sizes.length - 1];
}
function drawBullets(s, items, x, y, w, h, sizes) {
  const pt = fitBullets(items, w, h, sizes);
  s.addText(bulletParas(items, pt), { x, y, w, h, valign: "top", margin: 4, isTextBox: true, objectName: "Bullets" });
}

function calloutH(c, w, pt = 14) { return 0.42 + estLines(plain(c.text), pt, w - 0.3) * lineH(pt) + 0.12; }
function drawCallout(s, c, x, y, w, h, pt = 14) {
  if (!CALLOUT[c.kind]) warn(`unknown callout kind "${c.kind}" (known: ${Object.keys(CALLOUT).join(", ")})`);
  const k = CALLOUT[c.kind] || CALLOUT.key;
  s.addShape("roundRect", { x, y, w, h, fill: { color: k.fill }, line: { color: k.fill }, rectRadius: 0.08, objectName: "Callout panel" });
  s.addText([{ text: c.label || k.label, options: { fontSize: 11, bold: true, color: k.lc, charSpacing: 1, breakLine: true, paraSpaceAfter: 4 } }, ...runs(c.text, { fontSize: pt, color: k.tc })],
    { x, y, w, h, valign: "top", margin: [8, 12, 8, 12], isTextBox: true, objectName: "Callout text" });
}
// stack callouts in a column; returns bottom y
function stackCallouts(s, cs, x, y, w, bottom) {
  const total = (p) => cs.reduce((a, c) => a + calloutH(c, w, p), 0) + 0.15 * (cs.length - 1);
  let pt = [16, 15, 14, 13].find((p) => total(p) <= bottom - y) || 13;
  if (total(pt) > bottom - y) warn(`callouts may overflow (${total(pt).toFixed(2)} > ${(bottom - y).toFixed(2)})`);
  for (const c of cs) { const h = calloutH(c, w, pt); drawCallout(s, c, x, y, w, h, pt); y += h + 0.15; }
  return y;
}

function drawLede(s, text, y, w = W) {
  const pt = 17;
  const h = estLines(plain(text), pt, w) * lineH(pt) + 0.12;
  s.addText(runs(text, { fontSize: pt, color: MUTED, italic: true }), { x: X0, y, w, h, valign: "top", margin: 2, isTextBox: true, objectName: "Lede" });
  return y + h + 0.12;
}
function drawLinks(s, links) {
  if (!links || !links.length) return YMAX;
  const parts = [{ text: "Learn more:  ", options: { fontSize: 12, bold: true, color: MUTED } }];
  links.forEach(([label, url], i) => {
    parts.push({ text: label, options: { fontSize: 12, color: TEAL, hyperlink: { url } } });
    if (i < links.length - 1) parts.push({ text: "   ·   ", options: { fontSize: 12, color: MUTED } });
  });
  const lines = estLines(plain(links.map((l) => l[0]).join("   ·   ")) + "Learn more:  ", 12, W);
  const h = lines * lineH(12) + 0.08;
  s.addText(parts, { x: X0, y: YMAX - h + 0.05, w: W, h, valign: "top", margin: 2, isTextBox: true, objectName: "Links" });
  return YMAX - h - 0.05;
}

// body area: bullets with optional callout column on the right
function bodyBlock(s, spec, y, bottom) {
  const cs = spec.callouts || [];
  if (spec.bullets && cs.length) {
    const lw = spec.wide ? 8.0 : 7.25, rx = X0 + lw + 0.3, rw = W - lw - 0.3;
    drawBullets(s, spec.bullets, X0, y, lw, bottom - y);
    stackCallouts(s, cs, rx, y, rw, bottom);
  } else if (spec.bullets) {
    drawBullets(s, spec.bullets, X0, y, W, bottom - y);
  } else if (cs.length) {
    // callouts side by side across the width
    const n = cs.length, gap = 0.2, w = (W - gap * (n - 1)) / n;
    const h = Math.max(...cs.map((c) => calloutH(c, w)));
    if (h > bottom - y) warn("callout row may overflow");
    cs.forEach((c, i) => drawCallout(s, c, X0 + i * (w + gap), y, w, Math.min(h, bottom - y)));
  }
}

// ---------- templates ----------
const T = {};

T.title = (pres, s, spec) => {
  s.addText(spec.title, { placeholder: "title" });
  s.addText(spec.sub || "", { placeholder: "body" });
};
T.section = (pres, s, spec) => {
  s.addText(spec.num ? `${spec.num}` : "", { x: 0.8, y: 1.3, w: 3, h: 1.2, fontSize: 60, bold: true, color: NUM, fontFace: HEAD, isTextBox: true, objectName: "Section number" });
  s.addText(spec.title, { placeholder: "title" });
  s.addText(spec.sub || "", { placeholder: "body" });
};

T.concept = (pres, s, spec) => {
  let y = Y0;
  if (spec.lede) y = drawLede(s, spec.lede, y);
  const bottom = drawLinks(s, spec.links);
  bodyBlock(s, spec, y, bottom);
};

T.two = (pres, s, spec) => {
  let y = Y0;
  if (spec.lede) y = drawLede(s, spec.lede, y);
  let bottom = drawLinks(s, spec.links);
  if (spec.callout) {
    const ch = calloutH(spec.callout, W, 14);
    drawCallout(s, spec.callout, X0, bottom - ch, W, ch);
    bottom -= ch + 0.2;
  }
  const cols = spec.cols || [spec.left, spec.right];
  const n = cols.length, gap = 0.25, w = (W - gap * (n - 1)) / n;
  cols.forEach((c, i) => {
    const x = X0 + i * (w + gap);
    s.addShape("roundRect", { x, y, w, h: bottom - y, fill: { color: TINT }, line: { color: TINT }, rectRadius: 0.1, objectName: "Card" });
    s.addText(c.h, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.45, fontSize: 19, bold: true, color: c.color || TEAL, fontFace: HEAD, margin: 0, isTextBox: true, objectName: "Card heading" });
    drawBullets(s, c.bullets, x + 0.15, y + 0.62, w - 0.3, bottom - y - 0.72, [19, 18, 17, 16, 15, 14]);
  });
};

T.table = (pres, s, spec) => {
  let y = Y0;
  if (spec.lede) y = drawLede(s, spec.lede, y);
  let bottom = drawLinks(s, spec.links);
  const cs = spec.callouts || (spec.callout ? [spec.callout] : []);
  if (cs.length) {
    const n = cs.length, gap = 0.2, w = (W - gap * (n - 1)) / n;
    const ch = Math.max(...cs.map((c) => calloutH(c, w, 14)));
    cs.forEach((c, i) => drawCallout(s, c, X0 + i * (w + gap), bottom - ch, w, ch));
    bottom -= ch + 0.2;
  }
  const fr = spec.colW || spec.head.map(() => 1 / spec.head.length);
  const sum = fr.reduce((a, b) => a + b, 0);
  const colW = fr.map((f) => (f / sum) * W);
  const est = (pt) => {
    const rowH = (cells, p) => Math.max(...cells.map((c, j) => estLines(plain(c), p, colW[j] - 0.1))) * lineH(p) + 0.12;
    return rowH(spec.head, pt) + spec.rows.reduce((a, r) => a + rowH(r, pt), 0);
  };
  let pt = [18, 17, 16, 15, 14, 13, 12].find((p) => est(p) <= bottom - y);
  if (!pt) { pt = 12; warn(`table may overflow (${est(12).toFixed(2)} > ${(bottom - y).toFixed(2)}): split it across two slides`); }
  const head = spec.head.map((h) => ({ text: h, options: { bold: true, color: "FFFFFF", fill: { color: NAVY }, fontSize: pt } }));
  const rows = spec.rows.map((r, ri) => r.map((c, j) => ({
    text: runs(c, { fontSize: pt, color: j === 0 ? NAVY : BODY, bold: j === 0 && spec.boldFirst !== false }),
    options: { fill: { color: ri % 2 ? "FFFFFF" : tint(TINT, 0.4) } },
  })));
  s.addTable([head, ...rows], { x: X0, y, w: W, colW, fontSize: pt, fontFace: THEME.bodyFontFace, border: { type: "solid", pt: 0.5, color: RULE }, margin: [3, 6, 3, 6], valign: "top", autoPage: false, objectName: "Table" });
};

function boxRow(pres, s, items, x, y, w, opts = {}) {
  const n = items.length, arrow = opts.arrows === false ? 0.15 : 0.42;
  const bw = (w - arrow * (n - 1)) / n;
  const lp = opts.labelPt || 15, cp = opts.capPt || 13;
  const h = opts.h || Math.max(0.9, ...items.map((it) => {
    const [l, c] = Array.isArray(it) ? it : [it, ""];
    return 0.2 + estLines(l, lp, bw - 0.1) * lineH(lp) + (c ? estLines(plain(c), cp, bw - 0.1) * lineH(cp) + 0.05 : 0);
  }));
  items.forEach((it, i) => {
    const [l, c] = Array.isArray(it) ? it : [it, ""];
    const bx = x + i * (bw + arrow);
    const dark = opts.dark !== false;
    s.addShape("roundRect", { x: bx, y, w: bw, h, fill: { color: dark ? NAVY : "FFFFFF" }, line: { color: dark ? NAVY : TEAL, width: 1 }, rectRadius: 0.08, objectName: "Step box" });
    const parts = [{ text: l, options: { fontSize: lp, bold: true, color: dark ? "FFFFFF" : NAVY, breakLine: !!c } }];
    if (c) parts.push(...runs(c, { fontSize: cp, color: dark ? tint(NAVY, 0.75) : BODY }));
    s.addText(parts, { x: bx, y, w: bw, h, align: "center", valign: "middle", margin: 4, isTextBox: true, objectName: "Step text" });
    if (i < n - 1 && opts.arrows !== false)
      s.addShape("rightArrow", { x: bx + bw + 0.08, y: y + h / 2 - 0.12, w: arrow - 0.16, h: 0.24, fill: { color: ORANGE }, line: { color: ORANGE }, objectName: "Arrow" });
  });
  return y + h;
}

T.flow = (pres, s, spec) => {
  let y = Y0;
  if (spec.lede) y = drawLede(s, spec.lede, y);
  const bottom = drawLinks(s, spec.links);
  y = boxRow(pres, s, spec.steps, X0, y + 0.05, W, { labelPt: spec.labelPt, capPt: spec.capPt }) + 0.3;
  if (spec.steps2) y = boxRow(pres, s, spec.steps2, X0, y - 0.1, W, { dark: false, labelPt: spec.labelPt, capPt: spec.capPt }) + 0.3;
  bodyBlock(s, spec, y, bottom);
};

T.arch = (pres, s, spec) => {
  let y = Y0;
  if (spec.lede) y = drawLede(s, spec.lede, y);
  const bottom = drawLinks(s, spec.links);
  const lw = 1.55;
  for (const lane of spec.lanes) {
    s.addText(lane.label.toUpperCase(), { x: X0, y, w: lw - 0.1, h: 0.8, fontSize: 11, bold: true, color: TEAL, valign: "middle", margin: 0, isTextBox: true, objectName: "Lane label" });
    y = boxRow(pres, s, lane.boxes, X0 + lw, y, W - lw, { dark: !!lane.dark, labelPt: 13, capPt: 11, arrows: lane.arrows }) + 0.18;
  }
  if (y > bottom) warn("lanes overflow the slide: fewer lanes or shorter captions");
  y += 0.1;
  bodyBlock(s, spec, y, bottom);
};

T.code = (pres, s, spec) => {
  let y = Y0;
  if (spec.lede) y = drawLede(s, spec.lede, y);
  const bottom = drawLinks(s, spec.links);
  const cw = spec.codeW || 6.4;
  const lines = spec.code.split("\n");
  const longest = Math.max(...lines.map((l) => l.length));
  let pt = [14, 13, 12, 11].find((p) => lines.length * (p / 72) * 1.18 + 0.3 <= bottom - y && longest * (p / 72) * 0.6 <= cw - 0.35);
  if (!pt) { pt = 11; warn("code may overflow"); }
  const ch = Math.min(bottom - y, lines.length * (pt / 72) * 1.18 + 0.3);
  s.addShape("roundRect", { x: X0, y, w: cw, h: ch, fill: { color: NAVY }, line: { color: NAVY }, rectRadius: 0.06, objectName: "Code panel" });
  s.addText(lines.map((l, i) => ({ text: l.replace(/ /g, " ") || " ", options: { breakLine: i < lines.length - 1 } })),
    { x: X0, y, w: cw, h: ch, fontFace: "Courier New", fontSize: pt, color: tint(NAVY, 0.88), valign: "top", margin: [10, 12, 10, 12], lineSpacingMultiple: 1.0, isTextBox: true, objectName: "Code" });
  const rx = X0 + cw + 0.3, rw = W - cw - 0.3;
  let ry = y;
  if (spec.callouts) {
    const hs = spec.callouts.reduce((a, c) => a + calloutH(c, rw) + 0.15, 0);
    if (spec.bullets) { drawBullets(s, spec.bullets, rx, ry, rw, bottom - ry - hs); ry = bottom - hs + 0.15; }
    stackCallouts(s, spec.callouts, rx, ry, rw, bottom);
  } else if (spec.bullets) drawBullets(s, spec.bullets, rx, ry, rw, bottom - ry);
};

T.stats = (pres, s, spec) => {
  let y = Y0;
  if (spec.lede) y = drawLede(s, spec.lede, y);
  let bottom = drawLinks(s, spec.links);
  if (spec.callout) { const ch = calloutH(spec.callout, W); drawCallout(s, spec.callout, X0, bottom - ch, W, ch); bottom -= ch + 0.2; }
  const cols = spec.cols || 4, gap = 0.22, n = spec.stats.length, rowsN = Math.ceil(n / cols);
  const w = (W - gap * (cols - 1)) / cols, h = Math.min(1.9, (bottom - y - gap * (rowsN - 1)) / rowsN);
  spec.stats.forEach(([v, l], i) => {
    const x = X0 + (i % cols) * (w + gap), yy = y + Math.floor(i / cols) * (h + gap);
    s.addShape("roundRect", { x, y: yy, w, h, fill: { color: TINT }, line: { color: TINT }, rectRadius: 0.1, objectName: "Stat tile" });
    s.addText([{ text: v, options: { fontSize: 30, bold: true, color: TEAL, fontFace: HEAD, breakLine: true } }, ...runs(l, { fontSize: 14, color: BODY })],
      { x, y: yy, w, h, valign: "top", margin: [10, 12, 8, 12], isTextBox: true, objectName: "Stat" });
    if (estLines(plain(l), 14, w - 0.2) * lineH(14) + 0.75 > h) warn(`stat tile "${v}" may overflow`);
  });
};

// firsthand voice: a short quote with attribution, plus what to take from it
T.quote = (pres, s, spec) => {
  let y = Y0 + 0.1;
  const bottom = drawLinks(s, spec.links || (spec.url ? [[spec.source || spec.who, spec.url]] : []));
  const qpt = [26, 24, 22, 20, 18].find((p) => estLines(spec.quote, p, W - 1.2) * lineH(p) <= 2.6) || 18;
  const qh = estLines(spec.quote, qpt, W - 1.2) * lineH(qpt) + 0.2;
  s.addShape("rect", { x: X0, y, w: 0.08, h: qh + 0.55, fill: { color: ORANGE }, line: { color: ORANGE }, objectName: "Quote rule" });
  s.addText(`“${spec.quote}”`, { x: X0 + 0.35, y, w: W - 0.6, h: qh, fontSize: qpt, italic: true, color: NAVY, fontFace: HEAD, valign: "top", margin: 0, isTextBox: true, objectName: "Quote" });
  s.addText(runs(`— **${spec.who}**${spec.role ? `, ${spec.role}` : ""}`, { fontSize: 15, color: MUTED }), { x: X0 + 0.35, y: y + qh + 0.05, w: W - 0.6, h: 0.45, valign: "top", margin: 0, isTextBox: true, objectName: "Attribution" });
  y += qh + 0.85;
  bodyBlock(s, spec, y, bottom);
};

T.quiz = (pres, s, spec) => T.table(pres, s, { ...spec, head: ["Question", "Strong answer (cover it before peeking)"], rows: spec.qs, colW: [0.42, 0.58], boldFirst: true });

// ---------- build ----------
function build(slides, file, cfg = {}) {
  configure(cfg);
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = cfg.title || "Study deck";
  pres.author = cfg.author || "Study pack";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const footText = cfg.footer || `${cfg.title || "Study deck"} · study deck`;
  const foot = { text: { text: footText, options: { x: X0, y: 7.02, w: 8, h: 0.3, fontSize: 10, color: tint(MUTED, 0.25) } } };
  const num = { x: 12.2, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: tint(MUTED, 0.25), align: "right" };
  const lightOnDark = tint(NAVY, 0.75);
  pres.defineSlideMaster({
    title: "Title", background: { color: NAVY },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 1.9, w: 11.7, h: 2.2, fontSize: 48, bold: true, color: "FFFFFF", fontFace: HEAD, valign: "bottom", align: "left" }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 4.3, w: 11.5, h: 1.6, fontSize: 20, color: lightOnDark, valign: "top", align: "left" }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "Section", background: { color: NAVY }, slideNumber: { ...num },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.5, w: 11.7, h: 1.4, fontSize: 44, bold: true, color: "FFFFFF", fontFace: HEAD, valign: "top", align: "left" }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 4.0, w: 11.2, h: 2.2, fontSize: 20, color: lightOnDark, valign: "top", align: "left" }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "Content", background: { color: "FFFFFF" }, slideNumber: { ...num },
    objects: [foot,
      { placeholder: { options: { name: "title", type: "title", x: X0, y: 0.32, w: W, h: 0.8, fontSize: 32, bold: true, color: NAVY, fontFace: HEAD, valign: "middle", align: "left", margin: 0 }, text: "" } }],
  });

  let section = "Start";
  for (const spec of slides) {
    current = spec.title || `(slide of type ${spec.t})`;
    if (!T[spec.t]) throw new Error(`[${current}] unknown slide type "${spec.t}" (known: ${Object.keys(T).join(", ")})`);
    if (spec.t === "section" || spec.t === "title") { section = spec.sectionName || spec.title; pres.addSection({ title: section }); }
    const master = spec.t === "title" ? "Title" : spec.t === "section" ? "Section" : "Content";
    const s = pres.addSlide({ masterName: master, sectionTitle: section });
    if (master === "Content") {
      if (spec.title.length > 58) warn("title is long and may wrap");
      s.addText(spec.title, { placeholder: "title" });
    }
    T[spec.t](pres, s, spec);
    if (spec.notes) s.addNotes(spec.notes);
  }
  return pres.writeFile({ fileName: file }).then(() => THEME);
}

module.exports = { build, warnings, slideTypes: () => Object.keys(T) };
