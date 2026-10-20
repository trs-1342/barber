#!/usr/bin/env bash
# Geliştirme derlemesi: yerel Gradle ile derler, emülatöre kurar, Metro'yu başlatır.
# Kullanım: scripts/android.sh [ek expo run:android argümanları]
source "$(dirname "$0")/env.sh"
cd "$ROOT"
"$ROOT/scripts/emu.sh"
exec npx expo run:android "$@"
