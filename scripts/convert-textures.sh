#!/usr/bin/env bash
# Convert the 3D album (/album) page textures to WebP at the book's 3:2 page
# aspect (PAGE_WIDTH 1.71 / PAGE_HEIGHT 1.14 in src/components/Book.jsx).
#
# Uses "blur-extend": the source photo is centered, undistorted, over a blurred
# cover-fill of itself — so every texture fills the 3:2 page perfectly with no
# stretching and no cropping of the subject (many bird photos are portrait).
#
#   ./scripts/convert-textures.sh        # operates on public/textures
set -euo pipefail

DIR="public/textures"
cd "$(git rev-parse --show-toplevel)"
command -v ffmpeg >/dev/null || { echo "ffmpeg required" >&2; exit 1; }

# in out W H quality
extend() {
  ffmpeg -y -loglevel error -i "$DIR/$1" -filter_complex \
"[0:v]scale=$3:$4:force_original_aspect_ratio=increase,crop=$3:$4,boxblur=40:2[bg];\
[0:v]scale=$3:$4:force_original_aspect_ratio=decrease:flags=lanczos[fg];\
[bg][fg]overlay=(W-w)/2:(H-h)/2" \
    -c:v libwebp -quality "$5" -preset photo "$DIR/$2"
}

# Covers — stretched to fully cover the 3:2 page (title + author credits sit at
# the very top and bottom, so a crop would clip them; a stretch keeps everything
# visible). Source art lives in the book project.
SRC="${FEATHER_FABLES_DIR:-$HOME/feather-fables}"
ffmpeg -y -loglevel error -i "$SRC/feather_frontcover.png" \
  -vf "scale=2048:1365:flags=lanczos" -c:v libwebp -quality 90 "$DIR/book-cover.webp"
ffmpeg -y -loglevel error -i "$SRC/backcover.png" \
  -vf "scale=2048:1365:flags=lanczos" -c:v libwebp -quality 90 "$DIR/book-back.webp"

# Interior pages (bird2..bird15 — the set referenced by Book.jsx `pictures`).
for n in 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  extend "bird$n.jpg" "bird$n.webp" 1600 1067 85
done

# Cover roughness map — aspect irrelevant (micro-detail); lossless, small.
ffmpeg -y -loglevel error -i "$DIR/bookrough.png" \
  -vf "scale=1024:683:flags=lanczos" -c:v libwebp -lossless 1 "$DIR/bookrough.webp"

echo "Done. WebP textures: $(du -ch "$DIR"/*.webp | tail -1 | cut -f1)"
