#!/usr/bin/env bash
# Emülatörü başlatır (zaten açıksa dokunmaz) ve tamamen açılana kadar bekler.
# Kullanım: scripts/emu.sh [AVD_ADI]   (varsayılan: Pixel_9a)
source "$(dirname "$0")/env.sh"

AVD="${1:-${AVD:-Pixel_9a}}"

if adb devices | grep -q '^emulator-.*device$'; then
  echo "Emülatör zaten açık."
else
  emulator -list-avds | grep -qx "$AVD" || { echo "AVD bulunamadı: $AVD"; emulator -list-avds; exit 1; }
  echo "Başlatılıyor: $AVD"
  nohup emulator -avd "$AVD" -netdelay none -netspeed full >/dev/null 2>&1 &
fi

adb wait-for-device
printf 'Açılış bekleniyor'
until [[ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]]; do
  printf '.'; sleep 2
done
echo ' hazır.'
