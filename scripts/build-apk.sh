#!/usr/bin/env bash
# Yerel release APK üretir (EAS yok, kota yok). Çıktı: builds/barber-<sürüm>-<commit>.apk
# Kullanım: scripts/build-apk.sh [--clean]
source "$(dirname "$0")/env.sh"
cd "$ROOT"

if [[ "${1:-}" == "--clean" || ! -d android ]]; then
  npx expo prebuild --platform android --clean --no-install
fi

(cd android && ./gradlew assembleRelease --no-daemon -PreactNativeArchitectures=x86_64,arm64-v8a)

VERSION="$(node -p "require('./app.json').expo.version")"
SHA="$(git rev-parse --short HEAD 2>/dev/null || echo local)"
mkdir -p builds
OUT="builds/barber-$VERSION-$SHA.apk"
cp android/app/build/outputs/apk/release/app-release.apk "$OUT"
echo "APK: $ROOT/$OUT ($(du -h "$OUT" | cut -f1))"
