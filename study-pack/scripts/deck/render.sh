#!/bin/zsh -f
# Render a deck to PDF and contact sheets (9 slides per sheet) for visual QA.
# usage: render.sh <deck.pptx> <out-dir> [first-slide] [last-slide]
# Uses PowerPoint on macOS when installed (true fonts), otherwise LibreOffice.
set -e; setopt null_glob
DECK=${1:A}; OUT=${2:A}; FIRST=${3:-1}; LAST=${4:-9999}
mkdir -p $OUT; rm -f $OUT/sheet*.png; rm -rf $OUT/pages; mkdir -p $OUT/pages
PDF=$OUT/deck.pdf; rm -f $PDF
if [[ -d "/Applications/Microsoft PowerPoint.app" ]]; then
  osascript -e "tell application \"Microsoft PowerPoint\"
open POSIX file \"$DECK\"
delay 2
save active presentation in POSIX file \"$PDF\" as save as PDF
close active presentation saving no
end tell" >/dev/null
elif command -v soffice >/dev/null || command -v libreoffice >/dev/null; then
  SO=$(command -v soffice || command -v libreoffice)
  $SO --headless --convert-to pdf --outdir $OUT $DECK >/dev/null
  mv $OUT/${DECK:t:r}.pdf $PDF
else
  echo "Neither PowerPoint nor LibreOffice is installed; skip visual QA and rely on fit warnings."; exit 2
fi
pdftoppm -png -r 50 -f $FIRST -l $LAST $PDF $OUT/pages/s
python3 - "$OUT" "$FIRST" <<'PY'
import sys, glob, math
from PIL import Image, ImageDraw
out, first = sys.argv[1], int(sys.argv[2])
fs = sorted(glob.glob(f'{out}/pages/s-*.png')); ims = [Image.open(f).convert('RGB') for f in fs]
w, h = ims[0].size; cols = 3
for part in range(math.ceil(len(ims) / 9)):
    sub = ims[part*9:(part+1)*9]; r = math.ceil(len(sub) / cols)
    sheet = Image.new('RGB', ((w+8)*cols, (h+8)*r), (90, 90, 90)); d = ImageDraw.Draw(sheet)
    for i, im in enumerate(sub):
        x, y = (i % cols)*(w+8), (i // cols)*(h+8); sheet.paste(im, (x, y))
        d.rectangle([x, y, x+34, y+16], fill=(200, 30, 30)); d.text((x+4, y+2), str(first + part*9 + i), fill=(255, 255, 255))
    sheet.save(f'{out}/sheet{part:02d}.png')
print(f'{len(fs)} slides -> {math.ceil(len(ims)/9)} contact sheets in {out}')
PY
