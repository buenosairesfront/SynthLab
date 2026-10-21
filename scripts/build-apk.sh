#!/usr/bin/env bash
# Builds dist/SynthLab.apk without the Android SDK.
# Needs: Java 17+, Node/npm, Python 3, curl, zip.
# Toolchain (downloaded once into .tools/): aapt2 (npm: aaptjs3), android.jar (Robolectric
# android-all, Maven Central), dx (Maven Central), apksig (Maven Central).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
T="$ROOT/.tools"; B="$ROOT/build"; OUT="$ROOT/dist"
mkdir -p "$T" "$OUT"

fetch() { [ -f "$T/$1" ] && return; echo "↓ $1"; for base in https://repo1.maven.org/maven2 https://repo.maven.apache.org/maven2; do curl -sSLf --retry 3 -o "$T/$1" "$base/$2" && return; done; echo "download failed: $1" >&2; exit 1; }
fetch android-all.jar "org/robolectric/android-all/14-robolectric-10818077/android-all-14-robolectric-10818077.jar"
fetch dx.jar "com/google/android/tools/dx/1.7/dx-1.7.jar"
fetch apksig.jar "com/android/tools/build/apksig/2.3.0/apksig-2.3.0.jar"
if [ ! -x "$T/aapt2" ]; then
  echo "↓ aapt2"
  (cd "$T" && npm pack aaptjs3@2.0.2 --silent >/dev/null && tar xzf aaptjs3-2.0.2.tgz && cp package/bin/x64/linux/aapt2 aapt2 && chmod +x aapt2 && rm -rf package aaptjs3-2.0.2.tgz)
fi

AJAR="$T/android-all.jar"
rm -rf "$B"; mkdir -p "$B/res" "$B/classes" "$B/gen" "$B/assets"
cp -r "$ROOT/web/." "$B/assets/"

"$T/aapt2" compile --dir "$ROOT/android/res" -o "$B/res/"
"$T/aapt2" link -o "$B/base.apk" -I "$AJAR" --manifest "$ROOT/android/AndroidManifest.xml" \
  -A "$B/assets" --java "$B/gen" --min-sdk-version 24 --target-sdk-version 34 "$B"/res/*.flat
javac -nowarn --release 8 -cp "$AJAR" -d "$B/classes" $(find "$ROOT/android/src" "$B/gen" -name '*.java') 2>&1 | grep -v -e warning -e '^Note' || true
# dx 1.7 only reads class version 50; the activity uses no newer bytecode features
find "$B/classes" -name '*.class' -exec python3 -c 'import sys
for f in sys.argv[1:]:
  b=bytearray(open(f,"rb").read()); b[6]=0; b[7]=50; open(f,"wb").write(b)' {} +
java -cp "$T/dx.jar" com.android.dx.command.Main --dex --output="$B/classes.dex" "$B/classes"
cp "$B/base.apk" "$B/unsigned.apk"
(cd "$B" && zip -q -j unsigned.apk classes.dex)
python3 "$ROOT/scripts/zipalign.py" "$B/unsigned.apk" "$B/aligned.apk"

KS="${SYNTHLAB_KEYSTORE:-$ROOT/keys/release.p12}"; PASS="${SYNTHLAB_KS_PASS:-synthlab}"
if [ ! -f "$KS" ]; then
  echo "⚠ No keystore found: creating $KS (back it up! updates must be signed with the same key)"
  mkdir -p "$(dirname "$KS")"
  keytool -genkeypair -keystore "$KS" -storetype PKCS12 -storepass "$PASS" -keypass "$PASS" \
    -alias synthlab -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=SynthLab" >/dev/null 2>&1
fi
javac -cp "$T/apksig.jar" -d "$B" "$ROOT/scripts/Sign.java"
java --add-exports java.base/sun.security.x509=ALL-UNNAMED -cp "$B:$T/apksig.jar" Sign "$B/aligned.apk" "$OUT/SynthLab.apk" "$KS" "$PASS"
ls -la "$OUT/SynthLab.apk"
