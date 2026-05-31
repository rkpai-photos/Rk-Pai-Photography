#!/usr/bin/env bash
# Build the /album 3D book textures from the Feather Fables book pages.
#
# The album shows the real book: a front cover (page 1), content pages 37–101,
# a blank paper endpaper (page 106) and the back cover (page 108), all sourced
# from public/books/feather-fables and downscaled to ~900px WebP. The
# 3D book renders each page small, so 900px is plenty (the
# full-res reader lives at /feather-fables/read); keeping the textures lean
# matters because the album uploads ALL of them to the GPU at once.
#
# Pages are A4 landscape (2200×1556 ≈ 1.414), which matches the album page
# geometry in src/components/Book.jsx — so they map with no stretch or padding.
#
#   ./scripts/convert-textures.sh            # 900px q88 -> public/textures/album
#   ./scripts/convert-textures.sh 1100 90    # custom width / quality
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
command -v ffmpeg >/dev/null || { echo "ffmpeg required" >&2; exit 1; }

SRC="public/books/feather-fables"
OUT="public/textures/album"
WIDTH="${1:-900}"
QUALITY="${2:-88}"
mkdir -p "$OUT"

shot() { # in.webp out.webp
  ffmpeg -y -loglevel error -i "$1" -vf "scale=$WIDTH:-1:flags=lanczos" \
    -c:v libwebp -quality "$QUALITY" -preset photo "$2"
}

shot "$SRC/page-001.webp" "$OUT/cover.webp" # front cover
for n in $(seq 37 101) 106 108; do            # content + blank endpaper(106) + back(108)
  nn="$(printf '%03d' "$n")"
  shot "$SRC/page-$nn.webp" "$OUT/page-$nn.webp"
done

# bookrough.webp (cover roughness map) is kept from the prior texture set in
# public/textures/ and is aspect-independent micro detail.
[ -f public/textures/bookrough.webp ] || echo "warn: public/textures/bookrough.webp missing"

echo "Done. Album textures: $(ls "$OUT"/*.webp | wc -l) files, $(du -ch "$OUT"/*.webp | tail -1 | cut -f1)"
