#!/usr/bin/env bash
# Render a book PDF into web page images for the flipbook reader.
# One-off / offline build step — NOT run at request time.
#
#   ./scripts/render-book.sh <master.pdf> <slug> [width] [quality]
#
# Output: public/books/<slug>/page-001.webp … page-NNN.webp  (~<width>px wide)
#         public/books/<slug>/thumbs/thumb-001.webp …          (~200px wide)
# Prints a manifest (page count, dimensions, total size) and the /public-vs-R2 gate.
set -euo pipefail

PDF="${1:?usage: render-book.sh <master.pdf> <slug> [width] [quality]}"
SLUG="${2:?usage: render-book.sh <master.pdf> <slug> [width] [quality]}"
WIDTH="${3:-2200}"   # full-page target width (px); higher = crisper on big/retina
QUALITY="${4:-90}"   # WebP quality for full pages
THUMB_WIDTH=200
GATE_MB=60

OUT="public/books/$SLUG"
THUMBS="$OUT/thumbs"

[ -f "$PDF" ] || { echo "PDF not found: $PDF" >&2; exit 1; }
command -v pdftoppm >/dev/null || { echo "pdftoppm (poppler) required" >&2; exit 1; }
command -v ffmpeg   >/dev/null || { echo "ffmpeg required" >&2; exit 1; }
command -v magick   >/dev/null || { echo "ImageMagick (magick) required" >&2; exit 1; }

mkdir -p "$OUT" "$THUMBS"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

PAGES="$(pdfinfo "$PDF" | awk '/^Pages:/{print $2}')"
echo "Source: $PDF  ($PAGES pages) -> $OUT @ ${WIDTH}px q${QUALITY}"
echo "Rasterizing to PNG (a few minutes)…"
pdftoppm -png -scale-to-x "$WIDTH" -scale-to-y -1 "$PDF" "$TMP/page"

i=0
for png in $(ls "$TMP"/page-*.png | sort -V); do
  i=$((i + 1))
  n="$(printf '%03d' "$i")"
  ffmpeg -y -loglevel error -i "$png" -c:v libwebp -quality "$QUALITY" \
    -preset photo "$OUT/page-$n.webp"
  magick "$png" -resize "${THUMB_WIDTH}x" -quality 80 "$THUMBS/thumb-$n.webp"
  printf '\r  converted %s/%s' "$i" "$PAGES"
done
echo

echo
echo "=== Manifest ($SLUG) ==="
echo "Pages rendered : $i"
identify -format 'Full page dims : %wx%h\n' "$OUT/page-001.webp"
TOTAL_MB="$(du -sm "$OUT" | awk '{print $1}')"
echo "Total size     : ${TOTAL_MB} MB ($OUT)"
if [ "$TOTAL_MB" -le "$GATE_MB" ]; then
  echo "GATE: <= ${GATE_MB} MB  ->  commit to /public/books/$SLUG/"
else
  echo "GATE: >  ${GATE_MB} MB  ->  consider R2 (set NEXT_PUBLIC_*_PAGES_BASE)"
fi
