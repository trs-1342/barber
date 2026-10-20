# Devir raporu (başka bir ajan / geliştirici için)

Güncelleme: 2026-10-20, yarışma sırasında. Bu dosya, işi devralan kişi bağlamı sıfırdan çıkarmak zorunda kalmasın diye yazıldı.

## Görev

Yarışma: berber platformunun (barberapp.tech) **tedarikçi uygulaması** için mobil ekran. Tedarikçiler (bakım ürünü markaları, toptancılar) ürünlerini salonlara satar.
Takım **tek sayfa** seçti: **Reklam ve Öne Çıkarma** (`src/app/promotions.tsx`). Diğer ekranlar (giriş, panel, siparişler, ürünler, raporlar, hesap, ayarlar) bağlamı tamamlamak için var ve temel düzeyde.
Öncelikler: hız, performans, doğru kod. Backend de değerlendirmeye dahil.

## Teknoloji

- Expo SDK 57 (iPhone Expo Go 57 istiyor; SÜRÜM DEĞİŞTİRME), React Native 0.86.3, React 19.2.3, TypeScript 6 (strict). `@react-navigation/*` EKLEME: SDK 56+ expo-router ile uyumsuz, bundle kırılır; tema expo-router'dan import edilir, Expo Router (`src/app`)
- Expo Go ile test edilir (`npx expo start`, telefonla QR okutulur). Yerel derleme: `npm run android` / `npm run build:apk` (EAS YOK, kullanma).
- Kontrol: `npm run check` (tsc + lint + jest). Teslimden önce mutlaka çalıştır.

## Mimari (bozma)

- `src/data/repository.ts`: tek veri sözleşmesi. Ekranlar yalnızca `repo` (`@/data`) çağırır.
- `src/data/sources/{mock,firebase,supabase}.ts`: `.env` dosyasındaki `EXPO_PUBLIC_DATA_SOURCE` ile seçilir (varsayılan `mock`).
- `src/store/`: bağımlılıksız store (`useSyncExternalStore`). `orders`, `products`, `promotions` liste store'ları; `session` oturum.
- `src/lib/orders.ts`, `src/lib/promotions.ts`: saf iş kuralları. Test bunlar üzerinde yazılır.
- `src/theme`: tüm renk ve boşluklar. Ekranlarda sabit renk kullanma.
- `src/components/ui`: ortak bileşenler. `src/components/supplier.tsx`: StatCard, BarChart, OrderRow.

## Backend

- Firebase projesi: `barberapp-201026`. Değerler `.env` dosyasında (git dışında). `google-services.json` da git dışında.
  - Konsolda açılması gerekenler: Authentication → Email/Password, Firestore Database.
  - Kurallar: `firebase/firestore.rules`. Sahiplik `request.auth.uid` ile, sipariş durum makinesi ve kampanya sayaç koruması kurallarda.
  - Örnek veri: `npm run seed:firestore -- <email> <şifre>` (sipariş yazımı için dosyanın başındaki geçici kural notunu oku).
- Supabase (yedek): `supabase/schema.sql` (RLS, durum makinesi tetikleyicisi) → `npm run seed:sql` → `supabase/seed.sql`.

## Kurallar

- Commit'lere **hiçbir** atıf satırı (Co-Authored-By, Generated with…) eklenmez.
- Depo herkese açık; `.env`, anahtar ve kişisel bilgi commit'lenmez.
- Lisans henüz seçilmedi; LICENSE dosyası ekleme.
- Arayüz dili Türkçe.

## Durum ve sıradakiler

Son güncel durum için `git log` komutuna ve bu dosyanın sonundaki günlüğe bak.

### Günlük
- İskelet + tedarikçi ekranları + backend şemaları commit'lendi.
- Reklam ve Öne Çıkarma sayfası derinleştiriliyor: kampanya özeti, durum sekmeleri, oluşturma sihirbazı (ürün → yerleşim → süre/bütçe → önizleme), detay ve eylemler (duraklat, devam ettir, bitir), harcama ve tıklama oranı hesapları `lib/promotions.ts` içinde ve testli.
- Reklam ve Öne Çıkarma TAMAMLANDI: `src/app/(tabs)/promotions.tsx` (özet + sekmeler), `src/app/promotion/new.tsx` (4 adımlı oluşturma + önizleme + tahmini erişim), `src/app/promotion/[id].tsx` (performans, bütçe, duraklat/devam ettir/bitir). Kurallar `src/lib/promotions.ts` içinde, testler `src/__tests__/promotions.test.ts` içinde. Raporlar sekmeden çıkıp Panel'den açılıyor (`/reports`).
- Doğrulama: tsc, lint, 19 test ve `expo export` geçti. Henüz gerçek cihazda/Expo Go'da görülmedi.
- SDK 57'ye geçildi (iPhone Expo Go 57). Demo modunda uygulama doğrudan Reklam sekmesinde, demo tedarikçiyle açılır.
- GPT önceliklerinin hepsi yapıldı: ürün uygunluk (pasif/stok 0 engeli: istemci + mock sunucu + Firestore `get()`), bütçe tükenme (`isBudgetExhausted`, "Bütçe tükendi" rozeti), tahmini GÖSTERİM (erişim değil), onay özeti + çift tıklama koruması, CPC/CPM/TO hesaplanamıyorsa "—". 21 test.
- Jüri demosu: Reklam → Yeni → ürün (Wax) + Vitrin + 7 gün + 100 ₺ → toplam 700 ₺ ve tahmini gösterim → onay → listede görünür → detayda duraklat/devam → yeni kampanyada "Ense Fırçası" (stok 0) seç → engellenir.
- `firebase-baglanti` dalı (main'e birleştirilmedi): Firebase bağlantısı ve çalışma anında veri kaynağı seçimi.
  - Auth: `initializeAuth` + `getReactNativePersistence(AsyncStorage)` (oturum uygulama kapanınca korunur). Tipler için `tsconfig.json` içinde `@firebase/auth` → `dist/index.rn.d.ts` yolu var; Metro zaten `@firebase/auth/dist/rn` derlemesini seçiyor (`expo export` android + ios geçti).
  - `Repository.onAuthChange` eklendi (firebase: `onAuthStateChanged`, supabase: `onAuthStateChange`, mock: yerel dinleyici). `src/store` bunu `session`'a aktarır; açılış ekranı ilk oturum durumu gelene kadar kalır.
  - Veri kaynağı seçimi: giriş ekranında ve Ayarlar > "Veri kaynağı" bölümünde "Demo veri" / "Gerçek veri". Seçim AsyncStorage `barber.dataSource` anahtarında; ilk açılışta `.env` varsayılanı. `repo` artık seçili kaynağa yönlenen bir proxy (`src/data/index.ts`); değişince oturum ve listeler sıfırlanır.
  - `createPromotion` Firebase'de de `validateDraft` + ürün uygunluğunu istemcide denetler; `setPromotionStatus` biten kampanyayı reddeder; siparişler bileşik dizin gerekmesin diye istemcide sıralanır.
  - `eslint` + `eslint-config-expo` devDependencies'e eklendi (`npm run check` lint adımı eksik paket yüzünden çalışmıyordu).
  - Gerçek deneme (2026-10-20): `npm run seed:firestore -- demo@atlas.com demo1234` → `FirebaseError: Firebase: Error (auth/configuration-not-found)`. Authentication konsolda hiç başlatılmamış. Firestore veritabanı VAR (REST isteği 403 PERMISSION_DENIED döndü).
  - Konsolda yapılacaklar: Authentication → Get started → Sign-in method → Email/Password → Enable. Firestore → Rules → `firebase/firestore.rules` içeriğini yapıştır → Publish. Sonra seed betiğini tekrar çalıştır (betik her çalıştırmada ürün/kampanyaları yeniden ekler).
