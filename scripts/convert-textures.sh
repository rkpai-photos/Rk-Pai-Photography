#!/usr/bin/env bash
# Build the /album 3D book textures from the *actual* Feather Fables bird photos
# (the images referenced by Feather_Fables_Life_Essays.tex), not the old
# bird2..bird15 subset.
#
# The book's 55 plates are a mix of landscape and portrait at wildly varying
# aspect ratios, but the 3D page is a fixed 3:2 landscape. So every photo is
# "blur-extended": the source is centered, undistorted, over a blurred
# cover-fill of itself — fills the page with no stretch and no crop (portrait
# birds get soft side-bars). The titled covers are stretched instead (their
# title/credits sit at the very edges, so a crop or bars would clip them).
#
# Source names are messy (spaces, double dots, mixed extensions), so they map to
# clean sequential b01..b55 outputs in the book's reading order — keep this list
# in sync with the `pictures` array in src/components/Book.jsx.
#
#   ./scripts/convert-textures.sh            # 1080px q85 -> public/textures/album
#   ./scripts/convert-textures.sh 1280 88    # custom width / quality
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
command -v ffmpeg >/dev/null || { echo "ffmpeg required" >&2; exit 1; }
command -v magick >/dev/null || { echo "imagemagick (magick) required" >&2; exit 1; }

SRC="${FEATHER_FABLES_DIR:-$HOME/feather-fables}"
IMG="$SRC/images"
OUT="public/textures/album"
W="${1:-1080}"
Q="${2:-85}"
H=$(( W * 2 / 3 ))   # 3:2 landscape
mkdir -p "$OUT"

# Birds in the book's reading order (deduped first-occurrence, from the .tex).
birds=(
  "national_1.jpg" "state_2.jpeg" "Yellow-browed Bulbul.jpg" "grey.jpeg"
  "grace_3.jpg" "common_green_4.jpg" "flame_bul_5.jpg" "redbill_7.jpg"
  "hills_6.jpg" "call_8.jpg" "rain_9.jpeg" "wispering_6.2.jpeg"
  "watchfull_11.jpg" "scarlet_12.jpg" "37.jpg" "ultra_14.jpg"
  "paradise_15.jpg" "rain_16.jpeg" "mon_17.jpg" "niliri_18.jpg"
  "wings_19.jpg" "morning_20.jpg" "bunting_21.jpg" "forest_22.jpg"
  "Rhythm_23.jpg" "long_24.jpg" "frogmouth_26.jpeg" "spottedowlet_25.jpg"
  "black_king_27.jpg" "cheer_28.jpg" "pintail_29.jpeg" "quail_30.jpeg"
  "crested_king.jpg" "spotedfamily_32.jpg" "blue_faced_33.jpg" "naped_34.jpg"
  "black_king_35.jpg" "pitta_36.jpg" "fathercare_39.jpg" "flame_38.jpg"
  "flam_40.jpg" "booted_42.jpg" "yellow_41.jpg" "plum_57.jpeg"
  "narayana_46.jpg" "chest_45.jpg" "puff_47.jpg" "wisper_thattekkad_48.jpeg"
  "blue_49.jpg" "voice_50.jpg" "echoes_51.jpg" "pied_52.jpg"
  "lepoard.jpeg" "cheetha.jpeg" "the_king_lion.jpg"
)

# Blur-extend: undistorted photo over a blurred cover-fill of itself.
extend() { # in out
  ffmpeg -y -loglevel error -i "$1" -filter_complex \
"[0:v]scale=$W:$H:force_original_aspect_ratio=increase,crop=$W:$H,boxblur=40:2[bg];\
[0:v]scale=$W:$H:force_original_aspect_ratio=decrease:flags=lanczos[fg];\
[bg][fg]overlay=(W-w)/2:(H-h)/2" \
    -c:v libwebp -quality "$Q" -preset photo "$2"
}

# Covers — stretched to fill (title + credits sit at the very edges).
cover() { # in out
  ffmpeg -y -loglevel error -i "$1" \
    -vf "scale=$W:$H:flags=lanczos" -c:v libwebp -quality 90 "$2"
}

cover "$SRC/frontpage.png"  "$OUT/cover.webp"
cover "$SRC/backcover.png"  "$OUT/back.webp"

# Cream endpaper — pads the leaf count to even (book-back must stay outermost).
magick -size "${W}x${H}" canvas:"#FAF7EF" -quality 92 "$OUT/blank.webp"

i=0
for f in "${birds[@]}"; do
  i=$((i + 1))
  nn="$(printf 'b%02d' "$i")"
  [ -f "$IMG/$f" ] || { echo "MISSING: $IMG/$f" >&2; continue; }
  extend "$IMG/$f" "$OUT/$nn.webp"
done

echo "Done. ${i} birds + 2 covers + blank -> $OUT"
echo "Total: $(du -ch "$OUT"/*.webp | tail -1 | cut -f1)"
