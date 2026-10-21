#!/usr/bin/env bash
# Assembles the GitHub Pages site into docs/: landing page at /, playable web app at /app/,
# and the latest APK at /SynthLab.apk (run build-apk.sh first).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
D="$ROOT/docs"
rm -rf "$D"; mkdir -p "$D/app"
cp -r "$ROOT/site/." "$D/"
cp -r "$ROOT/web/." "$D/app/"
[ -f "$ROOT/dist/SynthLab.apk" ] && cp "$ROOT/dist/SynthLab.apk" "$D/SynthLab.apk" || echo "⚠ dist/SynthLab.apk not found; run scripts/build-apk.sh"
touch "$D/.nojekyll"
echo "Site ready in docs/"
