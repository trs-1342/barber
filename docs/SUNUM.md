# Sunum Metni: Tedarikçi Uygulaması — Reklam ve Öne Çıkarma

Toplam süre yaklaşık **6 dakika** artı soru-cevap. Üç konuşmacı için bölündü; isimleri kendinize göre dağıtın.

| Bölüm | Süre | Konuşmacı |
| --- | --- | --- |
| 1. Problem ve neden bu ekran | 40 sn | 1 |
| 2. Canlı demo | 90 sn | 2 (telefonda gösterir), 1 anlatır |
| 3. İş kuralları: tek yerde, üç katmanda | 60 sn | 3 |
| 4. Doğru metrik | 40 sn | 3 |
| 5. Mimari: Demo / Gerçek veri | 40 sn | 2 |
| 6. Güvenlik: Firestore kuralları | 40 sn | 2 |
| 7. Tasarım kararları | 30 sn | 1 |
| 8. Performans ve kalite | 20 sn | 3 |
| 9. Sınırlar ve kapanış | 20 sn | 1 |

> Not: Köşeli parantez içindekiler sahne yönergesidir, okunmaz.

---

## 1. Problem ve neden bu ekran (40 sn)

"Tedarikçi, ürününü salonlara satmak isteyen bir firma. Reklam ekranında kafasındaki tek soru şu: **Bu reklama para harcamaya değer mi?**

Bu yüzden listedeki ekranlardan bilerek en zorunu, Reklam ve Öne Çıkarma'yı seçtik. Çünkü burada para var. Para olan yerde hata pahalıdır: stoğu olmayan ürüne reklam vermek, bütçeyi aşmak ya da yanlış metrikle karar vermek doğrudan zarar demek.

Amacımız güzel bir ekran yapmak değildi. **Yanlış işlemi engelleyen ve bütçeyi kontrol eden, çalışan bir ticari sistem** yapmaktı."

---

## 2. Canlı demo (90 sn)

[Telefonda uygulama açık, Reklam sekmesinde.]

1. **Özet.** "Açılışta tedarikçi dört şeyi görüyor: kaç kampanyası yayında, toplam ne harcadı, kaç gösterim aldı ve tıklama oranı ne. Kampanyalar Yayında / Duraklatılan / Biten olarak ayrılıyor."
2. **Bitmiş kampanya.** [Biten sekmesine dokun.] "Burada 'Bütçe tükendi' yazan bir kampanya var. Süresi dolmadı ama parası bitti; sistem bunu kendisi anlıyor."
3. **Yeni kampanya, 4 adım.** [Yeni'ye dokun.]
   - "Ürün seçiyoruz: Wax."
   - "Nerede görünecek: Vitrin. Her yerleşimin asgari günlük bütçesi farklı."
   - "7 gün, günde 100 lira."
   - "Altta toplam tavanı görüyoruz: en fazla 700 lira. Yanında **tahmini gösterim** aralığı var."
   - "Önizlemede ürün, salon uygulamasında 'Sponsorlu' etiketiyle tam bu şekilde görünecek."
4. **Onay.** [Yayına al'a dokun.] "Para harcatan bir işlem olduğu için önce onay özeti çıkıyor. Onaylıyoruz, kampanya listeye düşüyor."
5. **Kontrol.** [Kampanyayı aç.] "Duraklatabiliriz, devam ettirebiliriz ya da erken bitirebiliriz. Bitirmek geri alınamaz, bu yüzden onay istiyor."
6. **Engelleme.** [Yeni kampanya → Ense Fırçası.] "Bu ürünün stoğu yok. Sistem kampanyayı açtırmıyor ve nedenini söylüyor. Stoğu olmayan ürüne reklam vermek, tedarikçinin parasını boşa harcamak olurdu."

---

## 3. İş kuralları: tek yerde, üç katmanda (60 sn)

"Bu ekranın kalbi `src/lib/promotions.ts` dosyası. Bütün iş kuralları burada, **saf fonksiyonlar** olarak duruyor; ekrandan, veritabanından ve ağdan bağımsızlar. İki faydası var: her kuralı tek başına test edebiliyoruz ve aynı kuralı her yerde aynı şekilde uyguluyoruz.

Kurallardan bazıları:
- **Ürün uygunluğu:** Pasif ya da stoğu sıfır olan ürüne kampanya açılamaz.
- **Çakışma:** Aynı ürün aynı yerleşimde ikinci kez yayına alınamaz.
- **Bütçe:** Asgari bütçe yerleşime göre değişir (Vitrin 50, Banner 150, Arama 50 lira/gün), azami günlük bütçe 10.000 lira.
- **Bitiş:** Süre dolunca ya da toplam bütçe tükenince kampanya biter. Biten kampanya bir daha değiştirilemez.

Kritik olan şu: Bu kurallar **üç katmanda birden** uygulanıyor.
1. **Arayüz:** Kullanıcıya hatayı anında gösterir.
2. **Veri katmanı:** Kaydetmeden önce aynı fonksiyonla tekrar kontrol eder; arayüz atlansa bile kural geçerli.
3. **Firebase kuralları:** Sunucu tarafında son kontrol yapılır. Biri uygulamayı değiştirip doğrudan veritabanına yazmaya çalışsa bile reddedilir.

Buna derinlemesine savunma deniyor: tek bir katmana güvenmiyoruz."

---

## 4. Doğru metrik (40 sn)

"Reklam ekranlarında en sık yapılan hata yanlış metrik göstermek. Üç noktaya dikkat ettik.

1. **Gösterim, erişim değildir.** Erişim, kaç farklı kişinin gördüğüdür. Bütçe ve 1000 gösterim başı maliyetle (CPM) yalnızca **tahmini gösterim** hesaplanabilir. Ekranda bu yüzden 'erişim' değil, 'tahmini gösterim' yazıyor ve aralık olarak veriyoruz, çünkü bu bir tahmin.
2. **Hesaplanamayan metrik sıfır gösterilmez.** Hiç gösterim yoksa tıklama oranı '%0' değil, '—' olarak görünür. Sıfır yanıltıcıdır: 'kötü performans' gibi okunur, oysa ortada henüz veri yok. Tıklama başı maliyet için de aynısı geçerli.
3. **Durum türetilir, saklanmaz.** Kampanyanın 'bitti' olup olmadığını veritabanındaki etikete değil, o anki gerçeğe bakarak hesaplıyoruz: süre dolmuş mu, bütçe tükenmiş mi? Böylece arka planda zamanlanmış bir iş çalıştırmaya gerek kalmadan ekran her zaman doğruyu gösteriyor."

---

## 5. Mimari: Demo / Gerçek veri (40 sn)

"Uygulamada ekranlar veritabanını hiç bilmiyor. Hepsi tek bir arayüzle, `Repository` ile konuşuyor. Bu arayüzün üç uygulaması var: **demo veri**, **Firebase** ve yedek olarak **Supabase**.

Bunun iki faydası var:
- Kullanıcı giriş ekranında **Demo veri / Gerçek veri** arasında seçim yapabiliyor. Demo internetsiz çalışır; bugün bu sunumu ağa bağımlı olmadan yapabilmemizi sağlayan da bu.
- Firebase'de sorun çıkarsa ekran koduna dokunmadan Supabase'e geçebiliriz. Supabase'de sahiplik satır düzeyi güvenlikle (RLS), sayaç koruması ve biten kampanya kilidi veritabanı tetikleyicileriyle yazıldı.

Gerçek veri seçilince kayıt, giriş, şifre sıfırlama, e-posta doğrulama ve misafir olarak devam etme Firebase Auth ile çalışıyor. Misafir sonradan e-posta eklerse hesabı kalıcı oluyor ve misafirken girdiği veriler kaybolmuyor."

---

## 6. Güvenlik: Firestore kuralları (40 sn)

"Firebase'de istemci anahtarı gizli değildir; veriyi koruyan şey kurallardır. `firebase/firestore.rules` dosyasında şunları sunucu tarafında zorunlu kıldık:

- **Sahiplik:** Her tedarikçi yalnızca kendi ürünlerini ve kampanyalarını görür ve değiştirir. Veriler `suppliers/{kullanıcı}` altında duruyor.
- **Ürün kontrolü:** Kampanya oluşturulurken kural ürün belgesini okuyor; ürün pasifse ya da stoğu yoksa yazmayı reddediyor.
- **Sayaç koruması:** Yeni kampanyanın gösterim ve tıklama sayısı sıfır olmak zorunda; sonradan da istemci bu sayıları değiştiremiyor. Yoksa tedarikçi kendi metriğini şişirebilirdi.
- **Kısıtlı güncelleme:** Kampanyada yalnızca durum değişebilir; biten kampanyaya hiç dokunulamaz.

Kısacası: uygulamayı değiştiren biri bile sistemi kandıramaz."

---

## 7. Tasarım kararları (30 sn)

"Tasarımda üç ilkeye bağlı kaldık:

- **Karar verdiren ekran:** Para harcatan her adımda kullanıcı ne ödeyeceğini görüyor: toplam tavan, harcanan / kalan bütçe, onay özeti. Sürpriz yok.
- **Adım adım akış:** Kampanya oluşturmak dört adım: ürün, yerleşim, süre/bütçe, önizleme. Her adımda tek bir karar var, hata o adımda gösteriliyor.
- **Premium ve sade kimlik:** Pirinç sarısı ve gece siyahı; berber kültürünün zanaat hissi. Logo yazısız: bir ürün kutusu ve yanında parıltı, yani 'ürünü öne çıkar'. Açık, koyu ve sistem teması var; tüm renkler tek bir tema dosyasından geliyor, ekranlarda sabit renk yok.

Para ve sayılar sabit genişlikli rakamlarla, Türkçe biçimde (1.250 ₺) gösteriliyor ki tablolar kaymasın."

---

## 8. Performans ve kalite (20 sn)

"Listelerde sanal liste (FlashList) kullanıyoruz: yalnızca ekranda görünen satırlar çiziliyor. Durum yönetimi için ek kütüphane eklemedik; React'in kendi `useSyncExternalStore` yapısıyla yalnızca ilgili bileşenler yeniden çiziliyor. Grafikler için ağır bir kütüphane yerine düz bileşenler kullandık.

Kalite tarafında: TypeScript katı modda, kod denetimi (lint) temiz ve 28 otomatik test var. Testler para ve durumla ilgili kuralları kapsıyor: bütçe tükenmesi, çakışma, uygunluk, metrik hesapları."

---

## 9. Sınırlar ve kapanış (20 sn)

"Dürüst olmak gerekirse: gerçek gösterim ve tıklama sayılarını bir reklam sunucusu üretir; o sunucu bu yarışmanın kapsamı dışındaydı. Ödeme entegrasyonu da kapsam dışı. Sonraki adımlar bunlar.

Ama bugün gösterdiğimiz şey çalışıyor: **parayı koruyan kurallar, doğru metrikler ve sunucu tarafında güvenlik.** Teşekkürler, sorularınızı alalım."

---

## 10. Olası jüri soruları ve kısa cevaplar

**Neden bu ekranı seçtiniz?**
İçinde para olduğu için en çok iş kuralı bu ekranda. Diğer takımlardan ayrışmak istedik.

**Kural hem istemcide hem sunucuda; bu tekrar değil mi?**
İstemcideki kontrol kullanıcı deneyimi için: hatayı anında gösterir. Sunucudaki kontrol güvenlik için: istemciye asla güvenilmez. İkisi aynı fonksiyondan beslendiği için tutarsızlık riski yok.

**Tahmini gösterimi nasıl hesaplıyorsunuz?**
Toplam bütçe / tahmini CPM × 1000, ±%20 aralıkla. CPM yerleşime göre değişiyor; banner en pahalısı.

**Bütçe tükenince reklam gerçekten duruyor mu?**
Ekranda kampanya 'Bütçe tükendi' olarak görünüyor ve değiştirilemiyor. Gösterimi fiilen durdurmak reklam sunucusunun işi; o sunucu da aynı `isBudgetExhausted` kuralını kullanabilir.

**Neden Firebase? Neden Supabase de var?**
Firebase hızlı kurulum ve hazır kimlik doğrulama sağlıyor. Supabase'i yedek olarak hazırladık; veri katmanı soyut olduğu için geçiş ekran koduna dokunmadan yapılıyor.

**Google ile giriş neden telefonda çalışmıyor?**
Google, girişi yapan uygulamanın kimliğini doğrular. Test ettiğimiz Expo Go'da bu kimlik bizim değil, Expo'nun. Derlenmiş Android uygulamasında ve web'de çalışıyor.

**Kaç kişi, ne kadar sürede?**
Üç kişi, bir saatlik yarışma süresinde; altyapıyı önceden hazır tuttuk.

**Kod açık kaynak mı?**
Evet, GitHub'da: github.com/trs-1342/barber
