#!/usr/bin/env bash
# En son üretilen APK'yı bağlı cihaza/emülatöre kurar ve açar.
source "$(dirname "$0")/env.sh"
cd "$ROOT"
APK="${1:-$(ls -t builds/*.apk 2>/dev/null | head -1)}"
[[ -f "$APK" ]] || { echo "APK yok; önce: npm run build:apk"; exit 1; }
PKG="$(node -p "require('./app.json').expo.android.package")"
adb install -r "$APK"
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null
echo "Kuruldu ve açıldı: $PKG"
