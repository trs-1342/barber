#!/usr/bin/env bash
# Teslimden önce tek komut: tip kontrolü + lint + testler.
source "$(dirname "$0")/env.sh"
cd "$ROOT"
echo "▶ tsc";  npx tsc --noEmit
echo "▶ lint"; npx expo lint
echo "▶ test"; npx jest --ci
echo "✔ hepsi geçti"
