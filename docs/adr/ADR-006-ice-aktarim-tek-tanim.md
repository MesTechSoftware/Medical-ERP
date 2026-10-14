# ADR-006 — İçe aktarım: tek tanım, şablon şemadan üretilir

- **Durum:** ✅ Kabul edildi
- **Tarih:** 13.10.2026 *(taslak 19.09.2026 — `docs/arsiv/KARAR_ONERISI_2026-09-19.md` §4)*
- **Kaynak soru:** `FAZ1_UYGULAMA_KAPSAMI.md` §C-y
- **Bağlı KARARLAR maddeleri:** **X-16** · D-6 · K-7 · X-12 · X-8 §(6) · X-15 §(3)/(5) · X-17 §(1)/(7)/(10) · A-13 · E-3
- **Uygulandığı commit:** 1B madde 7 *(henüz yok)*

## Bağlam

X-16, import'u elle girişin toplu hâli yaptı ve şablonu belgeden çıkardı. Bu ADR bunun nasıl
kurulacağını anlatır.

Aşağıdaki tablo 19.09 itibarıyla cari şablonunda belge ile kararlar arasındaki farkı gösterir.
**Tarihçedir, normatif değildir.**

| Alan | Kural | Kaynak | K-7 / D-6'da |
|---|---|---|---|
| `hesap_sinifi` | zorunlu, varsayılansız | X-8 §(1)/(6) | ❌ |
| klinik · bölge | `DOKTOR`'da zorunlu | X-15 §(3) | ❌ |
| telefon | zorunlu, benzersiz | X-15 §(2) | ⚠️ A-13 §(4) "nullable" diyordu |
| sorumlu satıcı | `DOKTOR`'da opsiyonel, `BAYI`'de yasak | X-17 §(7) · X-16 §(5) | ❌ (kararsızdı) |
| fiyat listesi kodu | opsiyonel | X-16 §(5) | ❌ (kararsızdı) |
| `cari_tip` · `vkn_tckn` · `fatura_*` · `eposta` · `muhasebe_kodu` | A-13'teki gibi | A-13 | ✅ |
| `kredi_limiti` | opsiyonel | A-12 | ✅ (D-6 eki) |

## Karar

1. **Her veri türü için tek bir tanım nesnesi.** İçeriği:
   - **Satır şeması:** elle giriş akışının girdi şemasıdır. Import için yeniden yazılmaz, olduğu
     gibi kullanılır. `CARI` için bu, `YONETICI` cari açma şemasıdır.
   - **Kolonlar:** şemadaki her alan için başlık metni, açıklama, örnek, izinli değerler ve kaynak
     karar.
   - **Çözümleyiciler:** yalnız import'ta olan dönüşümler (e-posta → kullanıcı, liste kodu → liste).
     Kural taşımazlar; kuralı şema taşır.
   - **Özet:** önizleme sayımları (X-16 §(7)).
   - **Yazıcı:** tek transaction içinde çalışır; `ImportParti` satırını yazar (X-12), sahipliği
     `degistirDoktorSahibi()` ile yazar (X-17 §(1)/(7)).
   - **Küme kuralları:** her tür, satır şemasının tek başına doğrulayamadığı kuralları **açıkça
     bildirir**: anahtar ifadesi · kapsam (*veritabanı + parti*) · kural kodu (X-4 §(3)). Kural
     metni burada yazılmaz; yalnız **anahtarı ve kapsamı** yazılır — kuralın kendisi onu koyan
     karardadır (X-15 §(2), X-10 §(1), B-5). `CARI` için normalize telefon; `URUN` için `kod`;
     `FIYAT_LISTESI` için liste `kod`'u ve (liste, ürün, `min_adet`) + tarih aralığı. *Faz 1'de
     tarih alanları şablonda yoktur (X-16 §(12)), dolayısıyla çakışma kuralı
     `(liste, ürün, min_adet)` tekilliğine iner; tarih boyutu Faz 2'de ekranla birlikte açılır.*
   - **Geri alıcı:** partiyi geri alan yol da tanımın parçasıdır; tek transaction'da çalışır,
     koşulu C-3 §(6)'dır (X-16 §(10)). Doktorla birlikte sahiplik iz satırları da gider
     (X-17 §(10), iz FK `CASCADE`); sahip alanına yazma X-17 §(1)'in CI kontrolünün kapsamındadır.
2. **Tek koşturucu:** `calistirIceAktarim(tur, dosya, asama)`. Aşamalar: doğrula · önizle · yaz.
   **Tek çağrı noktası listesine girmez**, çünkü tek çağıranı import ekranıdır. Listeye yalnız
   birden çok çağıranı olan ve iş kuralı taşıyan fonksiyon girer (KARARLAR §1.3 (9), X-17 §(1);
   liste 12'de kapalıdır).
3. **Şablon aynı tanımdan üretilir.** İçeriği:
   - başlık satırı
   - "Açıklama" sayfası: kolon, zorunluluk, izinli değerler, kaynak karar
   - kapalı katalog kolonlarında (`hesap_sinifi`, `cari_tip`) Excel açılır listesi

   İki çıkışı vardır: ekranda **"Şablonu indir"** düğmesi ve bir geliştirici komutu. Komut, import
   ekranı yazılmadan önce devreye alma hazırlığında şablon gönderebilmeyi sağlar.
4. **Başlık eşlemesi, başlık metniyle yapılır.** Yalnız büyük/küçük harf farkı (`tr-TR`) ve
   baştaki/sondaki boşluk tolere edilir.
5. **Üç koruma testi (CI):**
   - **Şema kapsama testi:** hedef tablonun NOT NULL ve varsayılansız her kolonu, ya tanımda ya da
     açık bir "sistem doldurur" listesinde bulunur. Kolon bilgisi Prisma şemasından okunur.
     *`hesap_sinifi` boşluğu bu testle yakalanırdı.*
   - **Varsayılan yasağı testi:** `hesap_sinifi` alanı olmayan bir `CARI` satırı reddedilir;
     şemada bu alana varsayılan tanımlanamaz.
   - **Küme kuralı kapsama testi:** hedef tablo üzerindeki her `UNIQUE`, `EXCLUDE` ve çok kolonlu
     `CHECK` kısıtı, ya bir küme kuralına bağlıdır ya da açık bir **"import'tan erişilemez"**
     listesindedir. Kısıtlar **`information_schema`'dan** okunur — Prisma şemasından değil; tarih
     aralığı çakışma kısıtı ham SQL'dir ve şemadan türetilse kaçardı. C8 anti-şema testinin
     (`src/lib/anti-sema.itest.ts`) `information_schema` desenini kullanır, ikinci bir mekanizma
     doğurmaz.

## Sonuçlar

- ✅ Yeni bir zorunlu alan eklendiğinde şablon, doğrulama ve önizleme kendiliğinden değişir.
- ✅ Form ile import kuralları birbirinden ayrışamaz.
- ⚠️ Şablon, kod sürümüne bağlıdır. Devreye almadan haftalar önce gönderilen bir şablon sonradan
  eskiyebilir. Eski dosya X-16 §(3) kolon kontrolünde reddedilir; sessizce yanlış yazılmaz.
- ⚠️ Elle giriş şeması import'un ihtiyacına göre bükülemez. Import'ta farklı bir davranış
  gerekiyorsa bu bir **karardır** (X-16 değişir), şemanın bir dalı değildir.

## Değerlendirilen alternatifler

- **K-7'de elle kolon tablosu.** Reddedildi: iki kaynak kalır (X-16 (b)).
- **Import için ayrı doğrulama şeması.** Reddedildi: her kural iki kez yazılır.
- **Kolon eşleme ekranı.** Reddedildi: müşterinin dosya hatasını sisteme taşır; kapsam dışıdır
  (X-16).

## Açık uygulama kalemleri (atıf)

- `import.azamiDosyaBoyutMb` değeri (E-3, KARARLAR §6)
- Başlık metinlerinin nihai hâli (1B madde 7)
- Aynı kapsama testinin K-4 dışa aktarım veri setlerine uygulanıp uygulanmayacağı (1B madde 6)

## Geçerlilik sınırı

X-16 §(1) ya da §(4) değişirse bu ADR'nin yerini yenisi alır.
