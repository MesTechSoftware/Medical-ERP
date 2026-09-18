# ADR-004 — Giriş denemesi sınırı: bellek içi sayaç

- **Durum:** ✅ Kabul edildi
- **Tarih:** 15.09.2026
- **Kaynak soru:** `FAZ1_UYGULAMA_KAPSAMI.md` §C-p (§D.7-2)
- **Bağlı KARARLAR maddeleri:** **X-9** (§5.12) · E-2 §(5) (deneme sınırı, geçici kilit) · E-2 §(8) (denemeler log'a, tablo yok) · E-1 (zaman tek modülden) · X-3 (log'a kişisel veri yazılmaz) · K-9 kapsam dışı listesi (replika / otomatik ölçekleme yok)
- **Uygulandığı commit:** kod → **C7b** (Faz 1A) · tablo silme → **`CM`** · E-2 kimlik katmanıyla birlikte sınama → Faz 1B madde 4

## Bağlam

Bugün başarısız giriş sınırı `LoginAttempt` tablosuyla uygulanıyor. KARARLAR X-9 bu tabloyu
kaldırdı (E-2 §(8): giriş denemesi tutan tablo açılmaz), ama E-2 §(5)'in *"deneme sınırlanır,
eşik aşılınca hesap geçici olarak kilitlenir"* kuralı yürürlükte. Sayacın **nerede ve nasıl**
tutulacağı bu ADR'nin konusudur.

## Karar

1. **Sayaç uygulama sürecinin belleğindedir.** Modül düzeyinde **tek örnek**; okuma ve yazma
   **tek modülden** yapılır. Başka hiçbir kod sayaca doğrudan dokunmaz.
2. **Anahtar ve eşikler bugünkü davranışla aynıdır.** C7b'de bugünkü `LoginAttempt` kodundan
   okunur. Eşikler `policy.ts`'e taşınır: `auth.girisDenemeSiniri` · `auth.girisKilitDakika`.
   Kodda sabit sayı kalmaz.
3. **Sayaç giriş server action'ının çalıştığı süreçte tutulur.** Ayrı bir çalışma ortamında
   koşabilen ara katmana (middleware/proxy) **konmaz**. Aksi hâlde iki ayrı bellek oluşur ve
   sayaç bölünür.
4. **Bellek sınırsız büyümez.** Kilit süresi ve deneme penceresi geçmiş anahtarlar **silinir**.
   Temizlik okuma anında yapılır; zamanlayıcı gerekmez (D-1 kademe 2 Faz 3'tedir).
5. **Zaman E-1 modülünden okunur.** `new Date()` doğrudan çağrılmaz. Bu, sayacın **sahte saatle**
   birim testine girmesini de mümkün kılar.
6. **Her deneme container log'una yazılır** (E-2 §(8)): zaman, kullanıcı **kimliği**, sonuç.
   Kişisel veri yazılmaz (X-3).

## Sonuçlar

- `LoginAttempt` okuma/yazma çağrıları **C7b**'de kalkar; tablo **`CM`'e kadar şemada durur**,
  okunmaz. `CM` tabloyu siler.
- **Kabul edilen sınırlar** (KARARLAR X-9 §(3)):
  - Süreç yeniden başlarsa sayaçlar ve geçici kilitler **sıfırlanır**.
  - Mekanizma **tek süreç** varsayar.
- **Test:** sayaç mantığı saf fonksiyon olarak ayrılır ve **birim testiyle** sınanır. Eşik aşımı,
  kilit süresi dolumu ve temizlik sahte saatle doğrulanır. Test sayısı `FAZ1_UYGULAMA_KAPSAMI.md`
  §D.2 beyanına C7b'de eklenir. Uçtan uca giriş davranışı 1B madde 4'te E-2 ile birlikte sınanır.
- **Veritabanına ek yük yoktur.** Başarısız deneme bir DB yazımı üretmez.

## Değerlendirilen alternatifler

- **Veritabanı tablosu (bugünkü `LoginAttempt`).** Reddedildi — KARARLAR X-9 / E-2 §(8).
- **Harici paylaşılan önbellek** (ör. Redis). Reddedildi.
  - Tek süreçte ek altyapı ve işletim yükü getirir; K-9 kapsam dışı listesinin ruhuna aykırıdır.
  - X-9 §(4) tetikleyicisi oluştuğunda **yeni ADR** ile yeniden değerlendirilir.

## Açık uygulama kalemleri (atıf)

Karar değildir; C7b'de çözülür:
1. Bugünkü anahtarın (hesap mı, hesap + IP mi) ve eşik değerlerinin koddan okunup `policy.ts`'e yazılması.
2. **Var olmayan hesaba deneme** nasıl loglanır? Kullanıcı kimliği yoktur ve girilen e-posta
   kişisel veridir (X-3). Log satırı kimliksiz yazılır; sayaç anahtarı buna göre seçilir.
3. Bugün `LoginAttempt`'e dokunan testlerin ölçülmesi ve §D.2 beyanının güncellenmesi.

## Geçerlilik sınırı

🔴 **Tek süreç.** Aynı kurulumda birden fazla uygulama süreci çalıştırılacağı gün bu ADR
geçersizleşir (KARARLAR X-9 §(4)). O gün **önce KARARLAR** yeniden açılır, sonra yeni ADR yazılır.
E-2 §(8) değişmedikçe çözüm yine tablo olamaz.
