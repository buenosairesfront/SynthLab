#!/usr/bin/env bash
# Assembles the GitHub Pages site into docs/: landing page at /, the web app at /app/,
# plus the offline service worker with the full file list.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
D="$ROOT/docs"
rm -rf "$D"; mkdir -p "$D/app"
cp -r "$ROOT/site/." "$D/"
cp -r "$ROOT/web/." "$D/app/"
touch "$D/.nojekyll"
cd "$D"
FILES=$(find . -type f ! -name sw.js ! -name .nojekyll | sed 's|^\./||' | sort)
VERSION=$(cat $FILES | sha1sum | cut -c1-10)
LIST=$( (echo "./"; echo "app/"; echo "$FILES") | python3 -c 'import sys,json; print(json.dumps([l.strip() for l in sys.stdin if l.strip()]))')
python3 - "$D/sw.js" "$VERSION" "$LIST" <<'PY'
import sys
p, v, files = sys.argv[1:4]
s = open(p).read().replace("'__VERSION__'", repr(v)).replace("__FILES__", files)
open(p, 'w').write(s)
PY
echo "Site ready in docs/ (version $VERSION, $(echo "$FILES" | wc -l) files)"
