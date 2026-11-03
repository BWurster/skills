// Write the pack's theme name and 12 colors into a .pptx built by pptxgenjs.
// pptxgenjs sets the theme fonts but always writes Office's default color scheme, so
// scheme colors would otherwise render in Office blue/orange.
//   applyTheme("deck.pptx", { name, colors: { dk1, lt1, dk2, lt2, accent1..accent6, hlink, folHlink } })
const fs = require("fs");
const JSZip = require(require.resolve("jszip", { paths: [require.resolve("pptxgenjs")] }));

const SLOTS = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function applyTheme(file, theme) {
  const colors = theme.colors || {};
  for (const k of SLOTS)
    if (!/^[0-9A-Fa-f]{6}$/.test(colors[k] || "")) throw new Error(`theme color ${k} must be 6 hex digits without "#", got ${JSON.stringify(colors[k])}`);
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const parts = Object.keys(zip.files).filter((p) => /^ppt\/theme\/theme\d+\.xml$/.test(p));
  const name = esc(theme.name || "Study Pack");
  const scheme = `<a:clrScheme name="${name}">` + SLOTS.map((k) => `<a:${k}><a:srgbClr val="${colors[k].toUpperCase()}"/></a:${k}>`).join("") + "</a:clrScheme>";
  for (const p of parts) {
    let xml = await zip.file(p).async("string");
    xml = xml.replace(/<a:clrScheme\b[\s\S]*?<\/a:clrScheme>/, scheme).replace(/(<a:theme\b[^>]*\bname=")[^"]*"/, `$1${name}"`);
    zip.file(p, xml);
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

module.exports = { applyTheme };
