#!/usr/bin/env bash
# Downsample the 562MB master PDF into a ~50-80MB web edition for the reader's
# "Download PDF" button. Output is NOT placed in /public — upload it to R2 and
# set NEXT_PUBLIC_FEATHER_FABLES_PDF_URL to its public URL.
#
#   ./scripts/make-web-pdf.sh [master.pdf] [out.pdf] [imageResolutionDPI]
#
# Tune the DPI (3rd arg, default 150; try 120-200) to land in the 50-80MB band.
set -euo pipefail

PDF="${1:-public/Feather_Fables_Life_Essays.pdf}"
OUT="${2:-feather-fables-web.pdf}"
RES="${3:-150}"

[ -f "$PDF" ] || { echo "PDF not found: $PDF" >&2; exit 1; }
command -v gs >/dev/null || { echo "Ghostscript (gs) required" >&2; exit 1; }

echo "Downsampling $PDF -> $OUT at ${RES} DPI…"
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.5 -dPDFSETTINGS=/ebook \
  -dDownsampleColorImages=true -dColorImageResolution="$RES" \
  -dDownsampleGrayImages=true  -dGrayImageResolution="$RES" \
  -dColorImageDownsampleType=/Bicubic -dGrayImageDownsampleType=/Bicubic \
  -dNOPAUSE -dBATCH -dQUIET -sOutputFile="$OUT" "$PDF"

echo "Done:"
du -h "$OUT"
echo "Upload this to R2 and set NEXT_PUBLIC_FEATHER_FABLES_PDF_URL to its public URL."
