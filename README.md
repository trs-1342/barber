# barber

Berber randevu uygulaması için mobil ekranlar. React Native + Expo ile tek kod tabanından Android ve iOS.

- **Expo SDK 58**, React Native 0.88, React 19.3, TypeScript (strict)
- **Expo Router** (dosya tabanlı gezinme, yerel sekmeler)
- **FlashList** ile performanslı listeler
- Veri katmanı tek arayüz üzerinden: **mock**, **Firebase (Firestore)** veya **Supabase**
- Derleme tamamen **yerelde** (Gradle). EAS veya başka bulut derleme servisi gerekmez.

## Hızlı başlangıç

```bash
npm install
cp .env.example .env          # veri kaynağını seç (varsayılan: mock)
npm run android               # emülatörü açar, yerelde derler, kurar ve Metro'yu başlatır
```

Değişiklikler kaydedince uygulamaya anında yansır (Fast Refresh). Derlemeyi yalnızca yerel bir paket eklenince tekrarlamak gerekir.

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run android` | Emülatörü açar, debug derler, kurar ve Metro'yu başlatır |
| `npm start` | Yalnızca Metro (uygulama zaten kuruluysa) |
| `npm run emu` | Pixel 9a emülatörünü açar (`AVD=Pixel_8 npm run emu` ile başka AVD) |
| `npm run build:apk` | Yerel **release APK** → `builds/barber-<sürüm>-<commit>.apk` |
| `npm run build:apk:clean` | `android/` klasörünü sıfırdan üretip release APK derler |
| `npm run install:apk` | Son APK'yı bağlı cihaza kurar ve açar |
| `npm run check` | Tip kontrolü + lint + testler (teslimden önce) |
| `npm test` / `npm run test:watch` | Jest testleri |
| `npm run seed:sql` | `supabase/seed.sql` dosyasını örnek veriden yeniden üretir |
| `npm run seed:firestore` | Örnek işletmeleri Firestore'a yazar |

Gereksinimler: Node 22+, JDK 17+, Android SDK (`~/Android/Sdk`). `scripts/env.sh` dosyası Android Studio Flatpak'in AVD dizinini kendiliğinden bulur.

## Proje yapısı

```
src/
  app/                  Ekranlar (Expo Router; her dosya bir rota)
    (tabs)/             Alt sekmeler: Keşfet, Randevularım, Profil
    shop/[id].tsx       İşletme detayı + hizmet seçimi
    booking/[shopId].tsx  Personel, tarih ve saat seçimi + onay
  components/ui/        Ortak bileşenler: Button, Card, Input, Chip, Badge, Avatar, Screen, Skeleton…
  theme/                Renkler (açık/koyu), boşluk, köşe yarıçapı, yazı ölçekleri
  data/
    repository.ts       Veri sözleşmesi (Repository arayüzü)
    sources/            mock | firebase | supabase adaptörleri
    seed.ts             Örnek veri
  store/                Global durum (useSyncExternalStore, bağımlılıksız)
  hooks/use-query.ts    İptal edilebilir veri çekme kancası
  lib/                  Biçimlendirme (tr-TR), randevu saati hesabı, ortam değişkenleri
supabase/               Şema (RLS + çift rezervasyon kısıtı) ve seed
firebase/               Firestore kuralları
scripts/                Yerel derleme, emülatör ve kontrol betikleri
```

## Veri kaynağı

`.env` dosyasındaki `EXPO_PUBLIC_DATA_SOURCE` değeri kaynağı seçer: `mock`, `firebase` veya `supabase`. Ekranlar yalnızca `repo` nesnesini bilir; kaynak değişince ekran kodu değişmez.

**Supabase:** SQL Editor'de önce `supabase/schema.sql`, sonra `supabase/seed.sql` çalıştırılır. Aynı personele çakışan iki randevuyu veritabanı reddeder (`EXCLUDE` kısıtı).

**Firebase:** `firebase/firestore.rules` kuralları yüklenir, ardından `npm run seed:firestore` çalıştırılır. Çift rezervasyonu transaction ve kilit belgeleri (`slotLocks`) engeller.

> `EXPO_PUBLIC_*` değerleri uygulamanın içine gömülür ve herkes tarafından okunabilir. Buraya yalnızca istemci anahtarları konur; Supabase `service_role` anahtarı **asla** konmaz.

## Yeni ekran eklemek

1. `src/app/` altına dosya ekle; rota otomatik oluşur.
2. Ekranı `Screen` ile sar, `components/ui` bileşenlerini ve `theme` belirteçlerini kullan.
3. Veri gerekiyorsa `Repository` arayüzüne metot ekle ve üç adaptörde de uygula.
4. `npm run check` komutunu çalıştır.

## Lisans

Açık kaynak; lisans henüz belirlenmedi.
