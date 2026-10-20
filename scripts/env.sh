#!/usr/bin/env bash
# Ortak ortam: Android SDK, AVD dizini ve JDK. Diğer betikler bunu `source` eder.
set -euo pipefail

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
# Android Studio Flatpak ise AVD'ler sandbox içinde durur.
if [[ -z "${ANDROID_AVD_HOME:-}" ]]; then
  for d in "$HOME/.var/app/com.google.AndroidStudio/config/.android/avd" "$HOME/.android/avd"; do
    [[ -d "$d" ]] && { export ANDROID_AVD_HOME="$d"; break; }
  done
fi
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

# React Native Gradle JDK 17+ ister.
if [[ -z "${JAVA_HOME:-}" ]] && command -v java >/dev/null; then
  export JAVA_HOME="$(dirname "$(dirname "$(readlink -f "$(command -v java)")")")"
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export ROOT
