# Yol Haritası — Medikal Satış Operasyon

> **Bu dosya ana plandır.** Yeni bir sohbete başlarken önce bunu ver.
> Sıra bağlayıcıdır — bir faz bitmeden sonrakine geçilmez, faz atlanmaz.
>
> Son güncelleme: 16 Eylül 2026 · **Faz 0 KAPANDI · Faz 1A commit dizisi yazıldı (`FAZ1_UYGULAMA_KAPSAMI.md` §D) → Şerit A (PRD taraması) ve C0…C7b başlayabilir · Şerit A ✅ kapandı · X-8…X-15 ✅ · ADR-001…005 ✅ · **açık karar yok** — C0…C7b başlayabilir, `CM` onların ardından
>
> **🔧 16.09.2026 — sayı uyumu (karar üretmedi).** X-10 sonrası kalan bayat ifadeler düzeltildi:
> **§3.2** ve **§3 çıkış kriteri**nde tablo sayısı **11 → 13** · **§8 takvim uyarısı**nda geri çekme
> listesi *"15.09'da 14"* → **15**, tablo sayısına aynı not ve *"iki engel kaldı"* → **tek engel
> (Şerit A)**.
> **✅ 16.09.2026, 4. kısım — X-13 · X-14 · X-15 kapandı; ADR-005 yazıldı. Açık karar yok.**
> - **X-13:** satıcı yalnız kendi doktorlarını görür; D-2 §(3) redakte edildi.
> - **X-14:** prim oranı `policy.ts`'te durur (**23 anahtar**); satıcıya özel oran tanımlanabilir; oran sevkiyata donar.
> - **X-15:** vade değişikliği izli yapılır; telefon zorunlu ve benzersizdir.
> - **ADR-005:** `Product.stock` kalkar.
> - Şerit A **59/59** kapandı; `PRD_V2.md` C10'da arşive gider.
> - **1A tarihinin önünde karar engeli kalmadı** (§8). Bu dosyada §1, §3.2, §3 çıkış kriteri ve §8 güncellendi.
>
> **✅ 16.09.2026, 3. kısım — X-11 · X-12 kapandı; PRD taraması yapıldı.**
> - `CariHareket` ve `ImportParti` yeni tablo oldu (**15 tablo**).
> - Şerit A: 59 madde → 38 ✅ · 8 ⛔ · 3 🔵 · **10 ❌**. ❌'ler üç karar maddesinde toplandı:
>   ⬜ **X-13** (satıcı–doktor sahipliği) · ⬜ **X-14** (prim oranı) · ⬜ **X-15** (vade değişikliği, mükerrer cari).
> - Geri çekme listesi **GÇ-16…GÇ-20** ile **20 kalem** oldu.
> - ADR sorusu açıldı: `Product.stock` → **ADR-005**.
> - **`CM`'in önünde yalnız bu dört madde var.** Bu dosyada §3.2, §3 çıkış kriteri ve §8 güncellendi.
>
> **Aynı gün, 2. kısım:**
> - `FAZ1_UYGULAMA_KAPSAMI.md` kayıptı; **yeniden kuruldu** (§A–§E). `_D` dosyası ve yama
>   kullanılmaz; §E Şerit A defteridir.
> - Kurulum sırasında **iki şema boşluğu** çıktı: ⬜ **X-11** (`CariHareket`) ve ⬜ **X-12**
>   (`ImportParti`). İkisi `CM`'i bloklar.
> - Bu dosyada güncellenenler: §3.2 · §3 çıkış kriteri · §8.
>
> **🔄 15.09.2026 — §D commit dizisi senkronizasyonu (karar üretmedi).** `FAZ1_UYGULAMA_KAPSAMI.md`
> §D, `MEVCUT_SISTEM_DURUMU.md` ölçümleri üzerine **commit bazlı** yazıldı; §C-l · §C-m · §C-g
> kapandı ve **`ADR/`'ye** yazıldı, §C-f · §C-j sıra kısıtı oldu. Bu dosyada düzeltilenler:
> **§1** doküman haritasına `MEVCUT_SISTEM_DURUMU.md` ve açılan `ADR/` eklendi · **§3** çıkış
> kriterindeki kırık atıf (*"§D-1A madde 8"* → **C8**) ve kapanmış §C kutusu düzeltildi, 1A
> çıkışının §D.2'de olduğu yazıldı, §3.1'de düşen görevlerin satırları işaretlendi · **§5.1 G-4**
> `AUTH_SECRET` düşüşüne göre daraltıldı · **§7.1** sınıf tablosuna `MEVCUT_SISTEM_DURUMU.md`
> (Sınıf 4) eklendi · **§8** 1A satırı §D.2'ye bağlandı, takvim uyarısı güncellendi.
> ⚠️ **15.09'un ilk yarısında §7.1-C'nin 3. sorusu atlanmıştı** — bu senkronizasyon onun
> telafisidir. Aynı tarama **iki yeni karar boşluğu** buldu (`FAZ1_UYGULAMA_KAPSAMI.md` §D.7:
> bayi yönetim ekranları · `LoginAttempt`); ikisi de **`CM`'i bloklar**.
>
> **✅ 15.09.2026 (2. oturum) — KARARLAR X-8 · X-9 karara bağlandı, X-10 açıldı.**
> **X-8:** bayi `Doktor` satırıdır (`hesap_sinifi = BAYI`); beş `Dealer*` tablosu ve bayi yönetim
> ekranları sökülür (C5 tam, tablolar `CM`'de); bayiye prim doğmaz; X-2 bütün tahsilatların kabul
> testine dönüştü. **X-9:** `LoginAttempt` kalkar; deneme sınırı bellek içi (**ADR-004**, yeni
> commit **C7b**); geri çekme listesi **13 → 14 kalem** (GÇ-14). **C4 testleri silinir** → 1A
> sonu birim hedefi **~52**. **Bu dosyada:** §1 ADR satırı · §3 kapsam uyarısı, çıkış kriterleri,
> §3.1 F-12, §3.2 X-2 ve geri çekme satırları + X-8/X-9/X-10 satırları · §5.1 G-2 · §8.
> ⬜ **Geliştirmeye geçişin önündeki tek karar: X-10** (fiyat listesinin cariye bağlanışı).
> `CM`'e kadar hiçbir commit'i bekletmez.
>
> **✅ 15.09.2026 (3. oturum) — KARARLAR X-10 kapandı: cariye atanan fiyat listesi.**
> `FiyatListesi` + `FiyatListesiSatir` (tablo sayısı **11 → 13**) · `Doktor.fiyat_listesi_id`
> nullable, boşsa varsayılan liste · atanmış listede satır yoksa varsayılana **düşülmez** (RULE-06
> yaşar) · `Product.netListPrice` kalkar (**GÇ-15** → geri çekme listesi **15 kalem**) · elle fiyat
> girişi **serbest kalır** (Ü-3 §(10)). **Faz 1A'nın önünde açık karar yok. Geliştirme C0 ile
> başlar; Şerit A paralel yürür.**
>
> **🔧 14.09.2026 — ikinci uyum taraması (karar üretmedi).** 13.09 denetiminin kendi artıkları
> tarandı. Bu dosyada düzeltilenler: **geri çekme kalemi sayısı on iki → on üç** (üç yerde;
> GÇ-13 sonradan eklenmişti) · **§3.2 A-10 satırındaki `iskonto_oran`** X-5'e göre düzeltildi ·
> **§7.1 belge rejimine `IS_AKISI_OZETI.md` eklendi** (canlı dosyaydı ama hiçbir sınıfta değildi —
> bayatlamasının yapısal sebebi buydu) · **§8 takvim tablosundaki taahhüt edilemez süreler**
> tablonun içinde işaretlendi · Faz 1 çıkış kriterine **anti-şema testi** bağlandı.
>
> **🔴 KARARLAR uyum denetimi — 13.09.2026.** Faz 1'in kapsamı bu dosyada **eksik yazılmıştı**:
> §3 yalnız denetim kaynaklı F-00…F-12 ile 09.09 turunda doğan dokuz maddeyi sayıyordu. KARARLAR §4
> ise Faz 1'e **on bir yeni tablo, dört yeni belge, kırktan fazla kolon, on bir tek çağrı noktası
> fonksiyonu** ve mevcut koddan **on üç kalemlik bir geri çekme listesi** yüklüyor. Bu tur:
> (1) yeni dosya **`FAZ1_UYGULAMA_KAPSAMI.md`** açıldı — KARARLAR §4'ün iş dökümü;
> (2) §2.3'teki yanlış işaretlenmiş checkbox düzeltildi; (3) §3.2 tablosu tamamlandı;
> (4) §4.2'de KARARLAR ile çelişen üç kalem düzeltildi (Ü-6, Ü-7, Ü-15);
> (5) §8 takvim tahminine kapsam uyarısı kondu.
>
> **✅ Aynı gün ikinci tur — üç açık madde karara bağlandı (`KARARLAR.md` X-5 · X-6 · X-7):**
> parasal tip **`Decimal`** ve **`iskonto_oran` şemadan çıktı** (X-5) · **`PaymentAllocation`
> kaldırıldı, runtime FIFO de yasak, yaşlandırma Faz 2+** (X-6) · **`PRD_V2.md` arşive,
> yerine `KABUL_KRITERLERI.md`, numaralandırma karar kimliğinden** (X-7).
> Sonuç: **Faz 1, 1A (söküm + şema) ve 1B (yeniden inşa) olarak ikiye bölündü.**
>
> **🔄 KARARLAR senkronizasyonu — 11.09.2026.** Faz 0'ın karar adımları tamamlandı; ticari/kapsam
> kararlarının tek kaynağı artık **`KARARLAR.md` (ana kitap)**. Bu dosya kararları **tekrarlamaz**, atıf
> yapar. K-1…K-10 karara bağlandı (bazıları ertelendi), yeni maddeler doğdu (X-1/X-3/X-4, A-15, Ü-3,
> E-1/E-2/E-3, D-2, B-7) ve iki şema eklemesi (E-2, D-5) teslim şartı oldu. Ayrıntı: `KARARLAR.md` §6 çıkış listesi.

---

## 0. Bağlam — proje nerede

Medikal ürün distribütörü için full-stack ERP. ~10 satıcı üzerinden doktorlara satış +
bayi kanalı. Next.js 16 · React 19 · TypeScript · PostgreSQL + Prisma 7 · Auth.js v5 beta ·
vitest + Playwright. 25 model, 41 sayfa, 3 rol paneli. CI yeşil. **Canlı veri yok.**

**Hedef:** Önce Anka West'e canlıya alınır. Sorunsuz çalışırsa aynı ürün başka firmalara
satılır. Ekip **2 geliştirici**.

**Doğrulanmış durum (8 Ağustos denetimi — kod anlık görüntüsü, Faz 0'da kod yazılmadı):**
- İş gereksinimleri karşılanma oranı: **%65 KANITLI · %34 TESTSIZ · %1 YOK** (71 FR)
- İş kuralları: 15 kuralın 10'u test edilmiş
- Saf fonksiyonlar (KDV, FIFO, prim, expiry) **doğru ve test edilmiş**
- **Tüm bulunan hatalar tek yerde:** veritabanına dokunan servis katmanı — bu katmanın **hiç testi yok**

**Faz 0 kararları (09.09.2026 kapandı — `KARARLAR.md`):** K-1…K-10 karara bağlandı (K-4 e-Fatura API'si
ve K-10 ÜTS **ertelendi**; K-4 §6 fatura hazırlık veri seti **MVP'ye alındı**). Faz 1 iki küçük **şema
eklemesi** getirdi ve bunlar **teslim şartıdır**: **E-2** (oturum tablosu + `Kullanici` alanları) ve
**D-5** (dışa aktarım kütüğü); ayrıca **E-1** zaman tipi disiplini (`timestamptz`/`date`). Bunlar canlı
veri üstünde migration'ı pahalı olduğundan Faz 1'de netleşmeli.

---

## 1. Doküman haritası — hangi dosya ne işe yarar

| Dosya | Ne | Durum |
|---|---|---|
| **`KARARLAR.md`** | **ANA KİTAP** — tüm ticari/kapsam kararlarının tek kaynağı | 🟢 **canlı · her karar buraya** |
| **`YOL_HARITASI.md`** (bu dosya) | Sıralı ana plan | 🟢 canlı |
| **`FAZ1_UYGULAMA_KAPSAMI.md`** | **KARARLAR §4'ün iş dökümü** — geri çekilecekler (**söküm takibi: `Durum`/`Commit` kolonları**) · yeni yazılacaklar · açık madde defteri · **§D: 1A commit dizisi ve 1B sırası** | 🟢 **canlı · Faz 1'in çalışma listesi** |
| **`KABUL_KRITERLERI.md`** | Doğrulanabilir davranış cümleleri — **karar içermez**; numaralandırma karar kimliğinden (`A-3-1`) | ⬜ **Faz 1A'da açılacak** (X-7) |
| **`SOZLESME_EKI.md`** | C-1 teyit metni — **on bir madde + zamanlama kolonu**; imzalanacak ek | ⬜ **açılacak · hukukçu kontrolü beklemede** (K-7 §5) |
| **`ADR/`** | Mimari karar kayıtları — yalnız *"nasıl"* sorusu | 🟢 **açıldı (15.09.2026)** · ADR-001 isimlendirme · ADR-002 fresh init · ADR-003 oturum · ADR-004 deneme sayacı · **ADR-005 stok miktarı türetilir** *(16.09)* · **sınır kuralı `ADR/README.md`'de** |
| **`IS_AKISI_OZETI.md`** | Sistem iş diliyle ne yapıyor + eksik gereksinim kontrol listesi | 🟢 canlı · **Sınıf 3 · Ayna** *(14.09.2026'da atandı — §7.1-A)* |
| **`PROJE_DURUMU.md`** | Teknik envanter — ne var, hangi sürüm | 🟢 canlı *(2 belge hatası düzeltildi 11.09)* |
| **`MEVCUT_SISTEM_DURUMU.md`** | Teknik envanter **ölçümü** — 14.09.2026, HEAD `3825241`; §D commit dizisinin sayı kaynağı | 📌 **kayıt · Sınıf 4** *(15.09.2026'da atandı — §7.1-A)*. Sürekli ayna `PROJE_DURUMU.md`'dir |
| **`docs/TRACEABILITY.md`** | FR/RULE × kod × test matrisi | 🟢 canlı, faz sonunda güncellenir *(§6 karar senkronizasyonu eklendi)* · ⚠️ `docs/` bugün git'te değil — C0 |
| **`docs/DENETIM_BULGULARI.md`** | 8 Ağustos denetim raporu | 📌 referans *(üstte güncel durum notu)* · ⚠️ `docs/` bugün git'te değil — C0 |
| **`DUZELTME_BRIFI.md`** | Faz 1 görev talimatı (F-00…F-12) | 📌 Faz 1'de kullanılır *(🟡 açıldı; K-1/2/3 ✅)* |
| **Görev Brifi (Faz 0-Demo)** | Ürünleştirme 8 görevi | 📌 Faz 2'de kullanılır, **genişletilecek** |
| `UYGULAMA_PLANI.md` | v2 inşa planı | 📦 arşiv — işi bitti |
| **Fleet Mimarisi** | Çok müşteri altyapısı | 🧊 **DONDURULDU** — ikinci ödeme yapan müşteri sözleşmesi imzalanana kadar açılmaz |
| `PRD_V2.md` | v2 gereksinim dokümanı (FR/RULE) | 📦 **ARŞİVE ALINACAK** (X-7) — **önce 71 FR + 15 RULE taranır** (§C-f); sonra atıf yapılmaz |

> **Dosya adı notu.** Ana kitap bir ara `KARARLARFinal.md` adıyla dolaşıma girmişti.
> **13.09.2026'da X-5/X-6/X-7 işlenerek `KARARLAR.md` adıyla birleştirildi** — tek ad kullanılır.

---

## 2. FAZ 0 — Karar ve gereksinim kesinleştirme ✅ **KAPANDI (09.09.2026)**

Kod yazılmadı. Çıktı: cevaplar → hepsi `KARARLAR.md`'de. **Açık (⬜) madde kalmadı.**
Karar metinleri burada tekrarlanmaz; aşağıda **sonuç + atıf** var.

### 2.1 Faz 1'i bloklayan ticari kararlar → ✅ (bkz. `KARARLAR.md` §1.1)

| # | Sonuç (özet) | Açtığı görev |
|---|---|---|
| **K-1** ✅ | İptal edilebilir; `CANCELLED`, kayıt silinmez; borç **ters kayıtla** düşer, bakiye avansa döner; türevler ters kaydedilir. Sevk edilmiş → iade (A-1). | F-03 açıldı |
| **K-2** ✅ | Ayrı avans yok; **tek işaretli bakiye** (KDV dahil), yön etiketli; tek bakiye fonksiyonu; otomatik mahsup. | F-02 açıldı |
| **K-3** ✅ | **Yumuşak kısıt**: aşım engellenmez, yönetici gerekçeyle onaylar, loglanır (`OnayBlogu`). | F-05 açıldı |

### 2.2 Kurumsal/regülasyon kararları → ✅/🟦 (bkz. `KARARLAR.md`)

| # | Sonuç (özet) | KARARLAR |
|---|---|---|
| **K-4** 🟦 | Muhasebe programı yok (Excel); e-Fatura GİB'den elle. **API modülü ertelendi**; **§(6) fatura hazırlık veri seti MVP'ye alındı** (6. dışa aktarım çıktısı, API/anahtar yok). | §1.5 |
| **K-5** ✅ | Lot/seri/SKT **kapsam dışı**; talep gelirse ayrı faz. K-10 ile teyit. | §1.1 |
| **K-6+C-4** ✅ | Hukuki görüş **zorunlu**; alımdan bütçe türetme geçersiz; modül **uyum kütüğü**, `PazarlamaButcesi` elle; **kapalı teslim**. | §1.7 |
| **K-7** ✅/🟦 | Asgari şablon (`VergiOrani` kodu + ÜTS sütunu + ayrı açılış stoğu); veri standardizasyonu ayrı kalem; **canlıdan önce yazılı teyit**; KDV teyidi 1 Ekim'den **canlıya çıkışa** taşındı. | §1.9 |
| **K-8** ✅/🟦 | Hibrit **üç kalem** (devreye alma peşin · abonelik · opsiyonel modül); kullanıcı/belge başına fiyatlama **yasak**; askıya alma ≠ imha; koda etki yok. 🟦 asgari süre: **yok, aylık döner**. | §1.8 |
| **K-9** ✅/🟦 | A ✅ (Türkiye zorunlu, izole DB, yedek politikası, çıkış maddesi); B 🟦 varsayılan **bizim yönettiğimiz Türkiye VPS**. | §1.6 |
| **K-10** 🟦 | ÜTS/izlenebilirlik **ertelendi** (kapsam dışı değil); Faz 1'e kolon/tablo/bayrak eklenmez; **1 Ekim artık blokleyici değil**. | §1.4 |

### 2.3 Kendi tarafında yapılanlar → ✅

- [x] `IS_AKISI_OZETI.md` §6 gözden geçirildi; eksikler karara bağlanıp KARARLAR'a taşındı (§6 durum haritası)
- [x] K-1…K-3 cevapları KARARLAR §1.1'e işlendi → `DUZELTME_BRIFI.md` "bkz. KARARLAR" der
- [ ] 🔴 çıkanlar Faz 1'e, 🟡 çıkanlar Faz 2'ye, ⚪ olanlar kapsam dışına işlendi
      **⚠️ 13.09.2026: bu madde yanlış işaretlenmişti.** 🔴 kovasındaki A-1…A-15, B-4…B-7, C-1/C-3/C-6,
      D-1/D-3/D-6 kalemlerinin **hiçbiri** §3.1 veya §3.2'de görev olarak yoktu; yalnız 09.09 turunda
      doğan maddeler yazılmıştı. KARARLAR §6 aynı satırı zaten **işaretsiz** tutuyor — doğru olan oydu.
      Bu tur `FAZ1_UYGULAMA_KAPSAMI.md` ile kapatıldı; madde o dosya Faz 1 görev listesine
      dönüştüğünde işaretlenir.

**Faz 0 çıkış kriteri — karşılandı.** ✅ K-1/K-2/K-3 cevaplandı, eksik gereksinim listesi üç kovaya ayrıldı,
K-4…K-10 karara bağlandı (bazıları ertelendi). **Kalan tek karar-dışı ön koşullar:** C-1 teyit metni (on bir
madde) yazılı alınır · **şirket kuruluşu** (Anka West'e ERP faturası kesilebilmesi için, mali müşavire sorulur).
Tam kapanış listesi: `KARARLAR.md` §6.

---

## 3. FAZ 1 — Düzeltme turu ← **ŞU AN BURADAYIZ**

**Talimat:** `FAZ1_UYGULAMA_KAPSAMI.md` + `DUZELTME_BRIFI.md` (+ `KARARLAR.md`) · **Sıra bağlayıcı**
**🟡 kalmadı — K-1/K-2/K-3 karara bağlandı (`KARARLAR.md` §1.1); F-03 ve F-05 seçilen yolla uygulanır.**

> 🔴 **KAPSAM UYARISI (13.09.2026).** Faz 1 bir **düzeltme turu değil, yeniden inşa turudur.**
> Aşağıdaki §3.1 (denetim düzeltmeleri) ve §3.2 (09.09 turu maddeleri) Faz 1'in **yarısıdır**.
> Diğer yarısı — KARARLAR §4'ün doğurduğu şema, fonksiyon ve belge akışları + **on beş kalemlik
> geri çekme listesi** *(15.09: on üçtü — GÇ-14 ve GÇ-15 eklendi)* — `FAZ1_UYGULAMA_KAPSAMI.md`'dedir ve önceden hiçbir dosyada yazılı değildi.
>
> ✅ **Üç blokeleyici madde 13.09.2026'da kapandı** (`KARARLAR.md` X-5 · X-6 · X-7).
> Sonuçları:
> - **X-5:** parasal alanlar **`Decimal`**; `OrderItem.iskonto_oran` **konmaz**, yerine
>   **`birim_fiyat`**; ham aritmetik iki fonksiyonda; **lint kuralı teslim şartı**
> - **X-6:** `PaymentAllocation` **kaldırıldı**; **runtime FIFO de yasak**; yaşlandırma
>   **Faz 2+**; Faz 1'de vadesi geçmiş **tutar gösterilmez** → **F-04 düşer, F-01 filtreye
>   devredilir, F-02 küçülür**
> - **X-7:** `PRD_V2.md` **arşive** (önce taranır); yerine **`KABUL_KRITERLERI.md`**;
>   numaralandırma **karar kimliğinden**; `TRACEABILITY.md` → **kod × test × karar**
>
> 🔵 **FAZ 1 İKİYE BÖLÜNDÜ: 1A (söküm + şema) · 1B (yeniden inşa).**
> Gerekçe: **1B bugün tahmin edilemez** — söküm sırasında ne çıkacağı bilinmiyor. 1A bittiğinde
> bilinmeyen kapanır ve **o noktada verilen tarih tutar**. Anka West'e bugün verilebilecek tek
> dürüst tarih **1A'nınkidir**. Ayrıntı: `FAZ1_UYGULAMA_KAPSAMI.md` §D.

### 3.1 Düzeltme görevleri (denetim kaynaklı)

| Görev | Ne | Öncelik |
|---|---|---|
| **F-00** | Servis katmanı entegrasyon test altyapısı | 🔴 **önce bu** — diğerlerinin kanıtı buna bağlı · **Faz 1A, commit C1** (`FAZ1_UYGULAMA_KAPSAMI.md` §D.1) |
| F-01 | İptal edilen sipariş prim matrahından çıkarılır *(tek satır, doğrudan nakit)* | ⛔ **görev olarak düştü** (X-6 §(9), 13.09) — işi **sayılan belgeler filtresine** devredildi (§D.3 madde 1) |
| F-02 | Bakiye tanımları kanonikleştirilir (9 yer → 2 fonksiyon); K-2 yön etiketi | 🔴 ⚠️ hedef **tek** fonksiyon: `hesaplaDoktorBakiye(doktor, tarih?)` (K-2, C-2 §3). ikinci fonksiyon (`getOpenReceivable()`) **yazılmaz** (X-6) |
| F-03 ✅açık | İptal mahsupları — **K-1: yol (b)** ters kayıt + avans (`KARARLAR.md` §1.1) | 🔴 ⚠️ ters kayıt listesinden **"tahsilat oranı" çıkar** (X-1 §(1)) ve **kongre türevi düşer** (K-6) |
| F-04 | Mahsup planı transaction içine + koşullu yazım | ⛔ **DÜŞTÜ** (X-6 §(1), 13.09) — `PaymentAllocation` kaldırıldı; açık mekanizmayla birlikte gidiyor |
| F-05 ✅açık | Kongre kontenjanı transaction içine — **K-3: yumuşak kısıt** (aşım izli, blok değil) | 🟠 ⚠️ asıl iş **K-6 geri çekmesidir** (GÇ-4/GÇ-5); modül kapalı teslim edileceği için eşzamanlılık düzeltmesinin aciliyeti düşük |
| F-06 | RULE-01 eşzamanlılık testi | 🟠 ⚠️ B-4: negatif stok artık **yumuşak kısıt**; test "tam olarak biri başarılı" yerine "aşım izli" doğrulamalı |
| F-07 | Para hareketlerinde audit transaction'ın parçası | 🟠 ✅ KARARLAR ile uyumlu (C-3 §4) |
| F-08 | Expiry job'ı gerçekten zamanlanır | ⛔ **KONUSUZ** — 12 ay expiry mekanizması K-6 §(2) ile siliniyor (GÇ-4). Zamanlayıcı altyapısı zaten **D-1 kademe 2, Faz 3** |
| F-09 | `refundReservation` sessiz bakiye kaybı | ⛔ **KONUSUZ** — kongre kredi lotu kaldırılıyor (GÇ-4) |
| F-10 | `createShipment` iki transaction birleştirilir | 🟡 ✅ kalır; A-3 kısmi sevkiyatla birlikte yeniden yazılır |
| F-11 | 15 adımlık kabul senaryosu e2e testi | 🟠 ⚠️ **senaryo yeniden yazılmalı** — rakamlar tahsilat bazlı prim ve kongre EARN varsayıyor (`FAZ1_UYGULAMA_KAPSAMI.md` §C-e) |
| F-12 | Kalan TESTSIZ kurallar (RULE-04, RULE-06) | 🟡 ⚠️ **RULE-03 listeden çıkar** (A-10: iskonto tavanı yok); RULE-04 kalır · ✅ **RULE-06 X-10 ile yaşar** (15.09 — atanmış listede satır yoksa *"fiyat çözümlenemedi"*; test 1B madde 8) |

> **⛔ / ⚠️ işaretleri 13.09.2026'da kondu.** Brif 8 Ağustos denetimine göre yazılmıştı; Faz 0
> kararları bazı görevleri **konusuz bıraktı**, bazılarının **kapsamını daralttı**.
> `DUZELTME_BRIFI.md` aynı işaretlerle güncellendi.

### 3.2 Faz 0'da doğan uygulama işleri (KARARLAR §6 "uygulama işi" + "şema kapanışı")

Bunlar karar değil, **uygulamadır**; Faz 1'de düzeltmelerle birlikte yapılır. Ayrıntı `KARARLAR.md`.

| Görev | Ne | Şema | Kaynak |
|---|---|---|---|
| **X-2** | Blocker (07.09 karara bağlandı) — uygula · sıra §D.3 madde 2 · ✅ *15.09 — X-8:* kod C5'te sökülür; görev **bütün tahsilat yollarının kabul testi** | — | §6, §5.11 |
| **X-1 + D-2** | Satıcı raporu (tahsilat oranı kaldırılır, zorunlu dönem aralığı, hakediş tanımı) + rol tasarımı — **tek commit** | — | §5.1 / §3.4.a |
| **X-3** | Hata yüzeyi politikası + `global-error.tsx` (sessiz hata yasağı) | — | §5.2 |
| **X-4** | İş hatası / uyarı gösterim sözleşmesi (tek dönüş, `throw` yok, uyarı yutma yasağı) | — | §5.4 |
| **A-15** | Nakit tahsilatta tevsik uyarısı (bilgi kademesi, `finance.nakitTevsikLimiti`) | — | §3.1.c |
| **Ü-3** | KDV tabanı + **taban etiketi zorunluluğu**; toggle kurulum düzeyi, Faz 1'de kapalı | — | §5.3 |
| **E-1** | Zaman dilimi tek dönüşüm modülü (UTC saklama, `Europe/Istanbul` yorum, `new Date()` yasak) | tip disiplini | §5.5 |
| **E-2** | Kimlik/oturum katmanı — kapalı hesap modeli, DB oturumu, 4/12 saat; `son_giris_at` **konmaz** · mekanizma **`ADR/ADR-003`** (opak token; `next-auth` sökülür) | ⚠️ **ekler** (`aktif`, `parola_hash`, `parola_degistirmeli` + oturum tablosu) | §5.6 |
| **E-3** | Dosya eki **kapsam dışı**; `ImportParti.dosya_adi` salt kayıt; K-9 §A-3 düzeltilir | — | §5.7 |
| **D-5 (Ü-5)** | Dışa aktarım kütüğü — altı veri seti, yalnız `YONETICI`, her aktarım loglanır | ⚠️ **ekler** | §3.4.b |
| **B-7** | `StokDuzeltme` + `StokDuzeltmeSatir` + `StokDuzeltmeSebep` + `DZL` öneki | ⚠️ **ekler (3 tablo)** — *karar 29.08'de kapandı, şema hâlâ yazılmadı* | §3.2.a |
| **Şema kapanışı** | ⚠️ **yalnız E-2+D-5 değil:** KARARLAR §4'ün **tamamı** tek migration'da — **15** tablo *(X-10 ile 13, X-11/X-12 ile 15)*, 4 belge, 40+ kolon, E-1 tip disiplini | migration | §4, `FAZ1_UYGULAMA_KAPSAMI.md` §B |

**⚠️ Yukarıdaki tablo Faz 1'in yalnız 09.09 turunda doğan maddelerini içeriyordu.** 13.09.2026'da
eklenen, daha önce karara bağlanmış ama görev olarak hiçbir yerde yazılı olmayan kalemler:

| Görev | Ne | Şema | Kaynak |
|---|---|---|---|
| **§A geri çekme** | **On beş kalem** *(15.09)* — kongre defteri, tahsilat bazlı prim, FIFO mahsup, bayi paneli **ve `Dealer*` tabloları (X-8)**, rol adları, taban fiyat, KDV toggle, `vatRate`, **`LoginAttempt` (X-9)**, **`Product.netListPrice` (X-10)** … | ⚠️ **çıkarır** | `FAZ1_UYGULAMA_KAPSAMI.md` §A |
| **A-1 / A-2 / A-3** | İade belgesi · bedelsiz satır bayrağı + zorunlu sebep · **kısmi sevkiyat** (borç ve prim sevkiyatta doğar) | ⚠️ ekler | §3.1 |
| **A-4 / B-4** | `StokKonum` + `konum_id` zorunlu · `KonsinyeCikis` · `StokTransfer` · `hesaplaStok()` | ⚠️ ekler | §3.1, §3.2 |
| **A-5 / A-6 / A-7** | `Siparis.asama` + teklif · `ACILIS` · `VADE_FARKI` + `vade_tarihi` | ⚠️ ekler | §3.1 |
| **A-8** | `OnayBlogu` + `acikBlokVarMi()` / `blokKontrolleriniCalistir()` + "Onay bekleyenler" ekranı | ⚠️ ekler | §3.1 |
| **A-10 / B-5 / B-6** | `liste_fiyat`+**`birim_fiyat`** *(X-5: `iskonto_oran` **konmaz**, gösterimde türetilir)* · fiyat listesi tarih aralığı (**DB düzeyinde çakışma yasağı**) · `min_adet` baremi · `cozumleBirimFiyat()` | ⚠️ ekler | §3.1, §3.2 |
| **A-11 / A-12** | `OdemeYontemi` tanım tablosu + tahsilatta zorunlu · `kredi_limiti` + `hesaplaDoktorRisk()` | ⚠️ ekler | §3.1 |
| **A-13 / A-14** | Vergi kimliği + `fatura_*` seti + `cari_tip` · **`BelgeSayac` + `uretBelgeNo()`** (satır kilidi, `MAX+1` yasak) | ⚠️ ekler | §3.1.a / §3.1.b |
| **C-6** | `VergiOrani` tanım tablosu · `Urun.vergi_orani_id` NOT NULL · **`hesaplaSatirTutarlari()`** · inline `fiyat*miktar` yasağı | ⚠️ ekler | §3.3.b |
| **C-1 / C-3** | `Sevkiyat.harici_irsaliye_no` · `DELETE` yasağı + KVKK teknik tedbir asgarisi | ⚠️ ekler | §3.3.c / §3.3.a |
| **D-1 / D-3 / D-6** | Boş olay noktaları · `KargoFirma` + takip alanları · **üç aşamalı import + parti no** | ⚠️ ekler | §3.4 |
| **K-4 §2 / §(6)** | `calistirDisaAktarim()` + **altı veri seti** + **fatura hazırlık çıktısı** (7 gün uyarısı) | — | §1.5 |
| **K-9 / §1.3** | `modulAcikMi()` tek okuma noktası · modül klasörü sınırı (tek yönlü bağımlılık) | — | §1.6 / §1.3 |
| **Sayılan belgeler filtresi** | **Faz 1'in tek en kritik ortak fonksiyonu** — altı dışlama, inline `where` yasağı | — | §4, A-5 |
| **X-8** *(15.09)* | Bayi = `Doktor` satırı (`hesap_sinifi = BAYI`) · bayi işlemleri genel belge akışları · tek cari ekranı · bayiye satıcı atanmaz, prim doğmaz | ⚠️ **ekler + çıkarır** (enum + kolon · 5 `Dealer*` tablosu) | §5.11 |
| **X-9** *(15.09)* | `LoginAttempt` kalkar · deneme sınırı bellek içi (`ADR/ADR-004`) · eşikler `policy.ts`'te | ⚠️ **çıkarır** | §5.12 |
| **X-10** *(15.09)* | Cariye atanan fiyat listesi · boş atama = varsayılan liste · varsayılana düşülmez · atama yalnız `YONETICI` · elle fiyat serbest | ⚠️ **ekler + çıkarır** (2 tablo + FK · `Product.netListPrice`) | §5.13 |
| **X-11** *(16.09)* | `CariHareket` yeni çekirdek tablo · `ACL`/`VDF` bu tabloda · tutar pozitif, yön ayrı · belge ile aynı transaction | ⚠️ **ekler** | §5.14 |
| **X-12** *(16.09)* | `ImportParti` yeni çekirdek tablo · içe aktarılan kayıtlar parti FK taşır · açılış stoğu geri alınmaz | ⚠️ **ekler** | §5.15 |
| **X-13** *(16.09)* | Satıcı yalnız kendi doktorlarını görür (D-2 §(3) redakte) · siparişin satıcısı sipariş anındaki sahip · devir izli · pasif satıcının doktorları sahipsiz | ⚠️ **değiştirir** (siparişte satıcı nullable) | §5.16 |
| **X-14** *(16.09)* | `finance.primOraniVarsayilan` + satıcıya özel oran · oran sevkiyat satırına donar | ⚠️ **ekler** | §5.17 |
| **X-15** *(16.09)* | Vade değişikliği izli (yalnız `YONETICI`) · telefon zorunlu ve benzersiz · `BAYI`'de klinik/bölge boş olabilir | ⚠️ **değiştirir** | §5.18 |
| **ADR-005** *(16.09)* | `Product.stock` kalkar; stok hareketlerden türer, eşzamanlılık satır kilidiyle | ⚠️ **çıkarır** | `ADR/ADR-005` |

**Çalışma kuralı:** Her bug için **önce testi yaz, kırmızı olduğunu gör**, sonra düzelt.
Bu turdaki hatalar tam olarak "test yokken sessizce yanlış çalışan" sınıfı. Yeni maddelerde de aynı disiplin.

**Faz 1 çıkış kriteri** *(= 1B sonu. **Faz 1A'nın çıkış kriteri ayrıdır ve sayıya bağlıdır:
`FAZ1_UYGULAMA_KAPSAMI.md` §D.2** — burada kopyalanmaz)*:
- [x] **`FAZ1_UYGULAMA_KAPSAMI.md` §C açık maddeleri kapatıldı** — C-a parasal tip · C-b `PaymentAllocation` · C-c PRD **13.09.2026** (KARARLAR X-5 · X-6 · X-7); §C-l · §C-m · §C-g **15.09.2026** (`ADR/`); §C-f · §C-j sıra kısıtı olarak §D'de
- [x] **§D.7-1 ve §D.7-2 kapatıldı** — KARARLAR **X-8** (bayi = `Doktor` satırı) · **X-9** (`LoginAttempt` kalkar) — **15.09.2026**
- [x] **§D.7-3 kapatıldı** — KARARLAR **X-10** (cariye atanan fiyat listesi) — **15.09.2026**
- [x] **§C-r · §C-s kapatıldı** — KARARLAR **X-11** (`CariHareket`) · **X-12** (`ImportParti`) — **16.09.2026**
- [x] **Şerit A (§E) tarandı** — 59/59 sonuç kodlu — **16.09.2026**
- [x] **Şerit A'nın ❌'leri kapatıldı** — KARARLAR **X-13 · X-14 · X-15** · **ADR-005** — **16.09.2026**
- [ ] **Satıcı sahipliği uygulanıyor** (X-13) · **prim oranı hakedişe donuyor** (X-14) · **vade değişikliği izli** (X-15)
- [ ] F-00…F-12'nin **ayakta kalanları** tamam, CI yeşil *(F-08/F-09 konusuz; **F-01/F-04 düştü** — X-6)*
- [ ] §3.2 uygulama işleri tamam (X-1+D-2 **tek commit**; E-1/E-2/E-3; D-5; X-3/X-4; Ü-3; A-15; X-2 blocker)
- [ ] **§A geri çekme listesi uygulandı** — kongre defteri, tahsilat bazlı prim, FIFO mahsup, bayi paneli, `DEALER` rolü, **`Dealer*` tabloları ve bayi yönetim ekranları (X-8)**, taban fiyat reddi, KDV toggle çerezi, **`LoginAttempt` (X-9)** kodda ve şemada **kalmadı**
- [ ] **Şema kapanışı** yapıldı: KARARLAR §4'ün **tamamı tek migration'da** — **15** tablo *(X-10, X-11, X-12)*, 4 belge,
      40+ kolon, yeni tipler, kısıtlar + E-1 tip disiplini (`timestamptz`/`date`).
      Yazılı yasak listesi ihlal edilmedi (`tenant_id`, `son_giris_at`, `kurum_id`, `iskonto_oran`,
      `PaymentAllocation`, izlenebilirlik alanları, dosya alanları …) — ✅ **14.09.2026: bu satır
      artık dikkate değil `anti-şema testine` bağlıdır** (`FAZ1_UYGULAMA_KAPSAMI.md` §D.1 commit **C8**; yasak listesi §D.2'de, **15.09'da KARARLAR §4 ile tamamlandı**):
      `information_schema` sorgulayan tek test, yasak kolon eklenirse CI'ı kırar.
- [ ] **11 tek çağrı noktası fonksiyonu** yazıldı ve inline tekrarları kaldırıldı; **sayılan belgeler filtresi** altı dışlamayı taşıyor
- [ ] **Config noktaları `policy.ts`'te** tanımlı; doldurulması gerekenler dolduruldu (`zaman.saatDilimi`, `auth.oturum*`, **`auth.girisDenemeSiniri`, `auth.girisKilitDakika`** *(X-9)*, **`pricing.varsayilanFiyatListesiKodu`** *(X-10)*, `import.azamiDosyaBoyutMb` *(D-6'dan önce; kesin değer devreye almada — KARARLAR §6)*)
- [ ] **Bayiler tek cari ekranından yönetiliyor** (X-8 §(5)); `SATICI` `BAYI` göremiyor ve açamıyor; `BAYI` sevkiyatı prim matrahına girmiyor (X-8 §(3))
- [ ] **Fiyat tek yoldan çözülüyor** (X-10): atanmış listede satırı olmayan ürün satıra girmiyor; cariye liste atamayı yalnız `YONETICI` yapabiliyor
- [ ] `docs/TRACEABILITY.md` **yeniden kurulmuş** (kod × test × karar — X-7 §(5), §D.3 madde 10); TESTSIZ oranı **%15 altında** *(8 Ağustos başlangıcı %34, FR bazlı)*
- [ ] Kabul senaryosu (F-11) **`KABUL_KRITERLERI.md`'ye göre yeniden yazılmış** hâliyle her commit'te koşuyor *(§C-e — "15 adım" sayısı eski senaryonundur)*
- [x] `PROJE_DURUMU.md`'deki **iki belge hatası** düzeltilmiş (RULE-12 + rapor sayısı) — *11.09.2026'da yapıldı*

---

## 4. FAZ 2 — Ürünleştirme

**Talimat:** Görev Brifi (Faz 0-Demo) + aşağıdaki eklemeler · **Süre:** ~3–4 hafta

### 4.1 Mevcut brifin 8 görevi

| # | Görev |
|---|---|
| 1 | Runtime instance config + tipli `InstanceSettings` |
| 2 | Marka dışsallaştırma (kodda sabit "Anka West" kalmaz) |
| 3 | `ModulePolicy` — modül aç/kapa, üç durum |
| 4 | Production admin bootstrap (`admin123` kaldırılır) |
| 5 | Güvenlik başlıkları (ortam-koşullu) |
| 6 | Bağlantı havuzu sınırı |
| 7 | `NEXT_PUBLIC` guard + NextAuth exact pin |
| 8 | Yedek doğrulama (`restore-test.ts`) |

### 4.2 Brifte olmayan, eklenecek işler

> ⚠️ **KARARLAR ile numara çakışması notu:** Bu tablodaki `Ü-*` **yol haritası kimlikleridir**;
> `KARARLAR.md`'deki `Ü-3`/`Ü-5` **KARARLAR kimlikleridir** ve bir kısmı Faz 1'e alındı (bkz. §3.2).
> Karşılıklar aşağıda işaretli.

| # | İş | Neden |
|---|---|---|
| **Ü-1** | **Tanım tablosu yönetim ekranları** — `VergiOrani` (C-6), `OdemeYontemi` (A-11), `KargoFirma` (D-3), `StokKonum` (A-4), `StokDuzeltmeSebep` (B-7), fiyat listeleri | ⚠️ **13.09 düzeltmesi:** bu bir "admin ayar ekranı" **değildir**. KARARLAR'da config noktaları `policy.ts`'te **belirlenir, kullanıcıya açılmaz** (A-15 §(3), E-2 §(4)); ekranı olan tek şey **tanım tablolarıdır** (§0.1.1). Vade varsayılanı ve nakit tevsik limiti **config'tir**, ekran almaz. **Görev 1 ile birleşsin** |
| **Ü-2** | **Satıcı bazlı prim oranı form alanı** | Şemada var, yazacak arayüz yok (FR-31) |
| **Ü-3** | KDV toggle **fiyat giriş ekranlarında** (kalan ekranlar) | KARARLAR **Ü-3 §5.3**: taban etiketi zorunluluğu + toggle **kurulum düzeyi (Faz 1'de kapalı)** Faz 1'e alındı; B/C sınıfı ekranlarda **kalıcı yok**. Faz 2'de kalan liste ekranlarına yayım |
| **Ü-4** | **Veri import aracı** | Excel şablonu + validasyon + import raporu. Açılış bakiyesi **K-7 ✅** (`ACILIS` + ayrı şablon); import şablonu KARARLAR §1.9 |
| **Ü-5** | **Excel dışa aktarım** — `DisaAktarimSablonu` motoru | KARARLAR **D-5/Ü-5 §5**: altı veri seti + **dışa aktarım kütüğü Faz 1'de** kuruldu; şablon motoru (konfigüre edilebilir sütun eşlemesi, K-4 §6) Faz 2 |
| **Ü-6** | **İzleme asgarisi** — uygulama erişilebilirlik kontrolü · container yeniden başlatma politikası · disk doluluk uyarısı · yedek başarısızlık uyarısı · **log rotasyonu** | ⚠️ **13.09 düzeltmesi:** başlıktaki *"Sentry vb."* KARARLAR ile çelişiyordu. **X-3 §(7): harici hata izleme servisi kalıcı kapsam dışı** (KVKK md.9, K-9 §A-1) — Türkiye'de kendimiz barındırdığımız toplayıcı da **K-9 kapsam dışı** (merkezi log, APM, dağıtık izleme). Kalan liste **K-9 §A-7 izleme asgarisidir** ve **teslim şartıdır, Faz 2 özelliği değil** — ayrı fiyatlanmaz. Log rotasyonu X-4 §(8) ile buraya eklendi. Faz 1'de log hedefi **container çıktısıdır** |
| **Ü-7** | **Gecelik invariant kontrolcüsü** | Uygulama kodundan **bağımsız**, ham SQL ile finansal eşitlikleri doğrulayan job. Aşağıda ayrıntı |
| **Ü-8** | **Rol granülerliği** (muhasebe / depo / satış müdürü) | KARARLAR **D-2 §3.4.a**: Faz 1'de **üç rol kapalı katalog** (`YONETICI`/`OPERASYON`/`SATICI`; MUSAVIR yok, bayi cari tipi). Genişleme ikinci firmada; **kapalı katalog → yeni değer = geliştirme** (§0.1.1) |
| **Ü-9** | Route group başına `error.tsx` / `loading.tsx` | UX. *(Uygulama-içi hata yüzeyi sözleşmesi X-3/X-4 ile Faz 1'de.)* |
| **Ü-10** | FR-28 uyarı, FR-58/FR-60 eksik kartlar, FR-09 yumuşak uyarı, FR-24 manuel mahsup | Küçük tamamlamalar |
| **Ü-11** | Faz 0'da 🟡 işaretlenen eksik gereksinimler | `IS_AKISI_OZETI.md` §6 durum haritasından gelecek |
| **Ü-12** | **KVKK veri imha paketi** (opsiyonel modül) | KARARLAR K-8 opsiyonel modül; C-3 periyodik imha Faz 3. Saklama/silme politikası C-7 |
| **Ü-13** | **B-5 fiyat listesi tarih/dönem ekranı** | "1 Ocak'tan geçerli yeni liste" — KARARLAR §3.2 |
| **Ü-14** | **C-2 tarihli rapor ekranları** | Bakiye fonksiyonu `tarih?` parametreli (K-2/C-2); geçmiş tarihli mutabakat ekranları §0.8 |
| **Ü-16** | **Alacak yaşlandırma / DSO raporu** *(13.09'da eklendi)* | **X-6 §(5)** ile Faz 1'den çıkarıldı. **X-1:** *"ayrı rapordur, oran değildir"*. ⚠️ Veri kaynağı yeniden tanımlanmalı — **eşleştirme yasak** (X-6 §(1)/(2)); rapor açıldığında yöntemi KARARLAR'a yazılır |
| ~~**Ü-15**~~ | ~~Bayi paneli (opsiyonel modül olarak paketleme)~~ → **Faz 3+'a taşındı** | ⚠️ **13.09 düzeltmesi:** D-2 §(6) ve §1.3 §D-14 bayi panelini **Faz 3+ opsiyonel modül, yalnız Sınıf 1** olarak konumluyor — dış kullanıcı, internete açık hesap, parola sıfırlama ve destek yükü getirdiği için. Faz 2'de değil. Bkz. §5.3 |

**Ü-7 — invariant kontrolcüsü ne doğrular** *(13.09'da KARARLAR'a göre güncellendi)*:
- `Σ doktor bakiyesi == Σ cari borç − Σ cari alacak` — **tek işaretli bakiye** (K-2); taban **brüt** (C-6 §6)
- Her belge için `Σ satır == belge toplamı` — **belge toplamı satır toplamlarının toplamıdır**, matrahtan yeniden hesaplanmaz (C-6 §5)
- `Σ prim tabanı == Σ sevk edilen matrah (sayılan belgeler filtresinden geçmiş)` — **sevkiyat bazlı** (A-3, X-1 §7)
- `hesaplaStok()` çıktısı == `Σ StockMovement` (konum bazında, `DZL` dâhil) — **inline `SUM` yok** (B-4, B-7)
- `belge_no` **global UNIQUE** ve **boşlukları kalıcı** — iptal edilen numara yeniden kullanılmamış (A-14 §6/§7)
- Sayılan belgeler filtresinin **altı dışlaması** hiçbir mali toplamda görünmüyor
- ~~`Σ CongressLedger…`~~ ⛔ kaldırıldı (GÇ-4) · ~~`Σ PaymentAllocation…`~~ ⛔ kaldırıldı (GÇ-3)
- Negatif stok **bloklanmaz ama izlidir** — her negatife düşüşün bir `OnayBlogu` kaydı var (B-4)

Uygulamanın TypeScript fonksiyonlarını **kullanmadan** yazılır — yoksa aynı hatayı iki kez yapar.

**Faz 2 çıkış kriteri:** Aynı build farklı config ile farklı markayla ayağa kalkıyor;
`admin123` yok; izleme ve invariant kontrolcüsü çalışıyor; veri import aracı hazır.

---

## 5. FAZ 3 — Canlıya alma

**Süre:** ~3–4 hafta (çoğu müşteri tarafında)

> ⚠️ **Numara çakışması notu:** Buradaki `C-*` **canlıya-alma görev kimlikleridir**; `KARARLAR.md`'deki
> `C-1…C-7` **karar kimlikleridir** (C-1 teyit metni · C-2 muhasebe sorumluluk sınırı · C-3 KVKK ·
> C-4 kongre hukuki · C-5 çoklu para · C-6 KDV tanım tablosu · C-7 yedek). Karıştırma.

### 5.1 Canlıya alma görevleri

| # | İş |
|---|---|
| G-1 | **UAT** — Anka West'in kendi personeliyle, gerçek bir haftanın verisiyle. Roller ayrı: satıcı, depo, muhasebe, yönetici. Çıktı: `docs/UAT.md` |
| G-2 | **Veri devri** — ürün, doktor, bayi *(X-8: doktor şablonunda `hesap_sinifi = BAYI` satırı)*, stok sayımı, açılış bakiyeleri. **Şablon KARARLAR K-7** (`VergiOrani` kodu + ÜTS sütunu + ayrı `ACILIS` stoğu şablonu); veri standardizasyonu **ayrı kalem** |
| G-3 | **TLS/HTTPS** kurulumu (HSTS bunu varsayıyor) |
| G-4 | **Secret yönetimi** — DB credential güvenli üretim/saklama. ⚠️ *15.09.2026:* `AUTH_SECRET` **1B madde 4'te düşer** (`ADR/ADR-003`) ve Faz 3'e ulaşmaz. Oturum token'ları DB'de yalnız **hash** olarak durur — secret değildir |
| G-5 | **Gerçek yedekle restore tatbikatı** — en az bir kez, veri yerinde doğrulanarak (K-9 §A-4) |
| G-6 | **`docs/RUNBOOK.md`** gerçek ortamda dry-run |
| G-7 | **KVKK paketi** — saklama/silme politikası + veri işleyen sözleşmesi (**KARARLAR K-9 §A / C-7**'ye bağlı) |
| G-8 | **Paralel çalışma** — 4–8 hafta müşteri mevcut yöntemini (Excel) bırakmaz, rakamlar karşılaştırılır |

### 5.2 Canlıya çıkış ön koşulları — **karar değil, iş** (KARARLAR §6)

Sırayı beklemeyen, canlıdan **önce** tamamlanması gereken kalemler:

- [ ] 🔴 **C-1 teyit metni (on bir madde)** yazılı alınır. *(Hiçbir sırayı beklemez.)* KDV sütunu K-7 §(7)'ye,
      ÜTS sütunu K-10 §I-4'e taşındı; **1 Ekim 2026 artık blokleyici tarih değil**, ama ÜTS sütunu **hâlâ istenir** (veri geriye dönük üretilemez).
- [ ] **Şirket kuruluşu** — Anka West'e ERP faturası kesilebilmesi için (K-8 ön koşul); sırası/yapısı **mali müşavire** sorulur.
- [ ] **Müşavire giden tek yazı** — KDV oranı sütunu + ÜTS sütunu + örnek dosya.
- [ ] **Anka West'in entegratörü tespit edildi** ve **onun Excel şablonu** elde edildi (K-4 §6-b); ilk çıktı öncesi K-7 §(4) yazılı teyidi alındı.
- [ ] **Üç kalemli teklif şablonu** hazır (K-8: devreye alma · abonelik · opsiyonel modül) + veri standardizasyonu **görünen satır** (K-7).
- [ ] **Sözleşmeye eklendi:** askıya alma + giderme süresi · askıya alma ≠ imha · hesap paylaşımı yasağı (D-2 §8) · beyan dili (K-7 §5).
- [ ] **Devreye alma notuna eklendi:** ilk `YONETICI` hesabının açılması · **10 dakikalık OS ekran kilidi önerisi** (E-2 §4-a) · `finance.nakitTevsikLimiti` ve `import.azamiDosyaBoyutMb` değerlerinin doldurulması.
- [ ] **Canlı sonrası ilk dönem sonunda** üç veri seti çıktısı müşavire gönderildi, geri bildirim alındı (C-2 numune yöntemi).

### 5.3 Faz 3+ opsiyonel paketler — **ertelenmiş modüller** (ayrı kalem, tekrar satılabilir)

KARARLAR'da ertelenen ve opsiyonel modül olarak fiyatlanacaklar (K-8: iki parçalı — devreye alma + bakım):

- **e-Fatura entegrasyonu + kontör** (K-4 §(4)-EK2; BYOI adapter, `IEBelgeSaglayici` — Faz 1'de **yazılmadı**)
- **İzlenebilirlik / ÜTS + geçiş sayım kalemi** (K-10; fiziksel sayım operasyonel maliyet, yazılımla azalmaz)
- **C-3 periyodik KVKK imha** (uygulama-içi otomatik imha)
- **K-6 kongre ve teşvik modülünün yeniden yazımı** (uyum kütüğü olarak)
- **D-1 bildirim kademe 2** (e-posta/SMS) · **D-3 kargo API** entegrasyonu
- **Bayi paneli** (D-2 §(6), §1.3 §D-14) — Faz 2'den buraya taşındı; dış kullanıcı ve destek yükü getirir
- **`MUSAVIR` rolü** — panel değil, **bir enum satırı** (D-2 §(5)); açılma şartı **veri işleyen protokolüdür** (K-9 §A-6). Bayi panelinden farklı sınıftadır: rol **çekirdek migration'ı**, panel **modül**

**Faz 3 çıkış kriteri:** Paralel çalışma penceresinde iki taraf rakamları tutuyor; restore tatbikatı başarılı;
runbook doğrulanmış; **§5.2 ön koşullarının tamamı işaretli** (özellikle C-1 teyit metni ve şirket kuruluşu).

---

## 6. FAZ 4 — İkinci müşteri 🧊

**Fleet Mimarisi dokümanı bu fazın planıdır ve şu an DONDURULMUŞTUR.**

Açılma koşulu: **ikinci ödeme yapan müşteri sözleşmesi imzalandığında.** O ana kadar
registry DB, provisioning CLI, fleet migration runner, owner/migrator/app rol matrisi,
PgBouncer, KMS envelope encryption, image-parity CI — **hiçbirine dokunulmaz.**

Bunları erken kurmak 2 kişilik ekipte boşa efor ve canlıya almayı geciktirir.

---

## 7. Sapma disiplini

Bu bölüm bilerek var — plandan sapma bu projede en büyük risk.

1. **Faz atlanmaz.** Faz 1 bitmeden Faz 2'ye geçilmez. Ürünleştirme cazip görünür
   (görünür sonuç üretir) ama bugu üstüne inşa eder.
2. **Faz 4 açılmaz.** İkinci imzalı sözleşme yoksa fleet altyapısına dokunulmaz.
3. **"Bu arada şunu da yapalım" yasak.** Yeni fikir çıkarsa bu dosyada ilgili fazın
   listesine **yazılır**, o an yapılmaz.
4. **Her tur sonunda belge rejimi işletilir** — hangi dosyanın ne zaman ve neye göre
   güncelleneceği **§7.1'de** yazılıdır. Denetim gösterdi ki belge kodun gerisinde kalıyor;
   13.09 uyum denetimi ikinci bir şey gösterdi: **belge kararın da gerisinde kalabiliyor.**
5. **Kapsam genişlemesi müşteri talebiyle gelirse** yine bu dosyaya yazılır ve hangi fazda
   yapılacağı kararlaştırılır; sıraya kaynaşmaz.
6. **Her ticari/kapsam kararı `KARARLAR.md`'ye (ana kitap) yazılır — tek kaynak.** Cevap başka
   dosyaya kopyalanmaz; bu dosya ve diğerleri yalnız **atıf** yapar. Bir karar iki yerde yazılırsa
   biri bayatlar; KARARLAR kazanır. Yeni gereksinim çıkınca önce KARARLAR §0 (karar çerçevesi:
   üçlü triyaj + kolon testi) uygulanır.

---

## 7.1 Belge rejimi — hangi dosya, ne zaman, neye göre *(13.09.2026)*

> **Neden bu bölüm var.** 11.09 turunda altı dosya "KARARLAR'a göre güncellendi" ama iki gün
> sonraki uyum denetimi otuzdan fazla çelişki buldu. Sebep ihmal değildi: **güncellemenin ne
> demek olduğu yazılı değildi.** Herkes "atıf ekleyeyim" anladı; gereken "çelişkiyi ara"ydı.

### A · Dosyaların dört sınıfı

Her dosya bir **soruya** cevap verir. Sınıfı, güncelleme tetikleyicisini belirler.

| Sınıf | Soru | Dosyalar | Tetikleyici |
|---|---|---|---|
| **1 · Karar** | *Ne yapmaya karar verdik?* | `KARARLAR.md` | **Karar verildiğinde** — kod değişince değil |
| **2 · Plan** | *Ne zaman, hangi sırayla?* | `YOL_HARITASI.md` · `FAZ1_UYGULAMA_KAPSAMI.md` · `DUZELTME_BRIFI.md` · `KABUL_KRITERLERI.md` | **Karar değişince** ve **faz geçişinde** |
| **3 · Ayna** | *Bugün fiilen ne var?* | `PROJE_DURUMU.md` · `TRACEABILITY.md` · **`IS_AKISI_OZETI.md`** | **Kod değişince** — karar değişince değil |
| **4 · Kayıt** | *O gün ne olmuştu?* | `DENETIM_BULGULARI.md` · **`MEVCUT_SISTEM_DURUMU.md`** · `arsiv/` · `ADR/` | **Yalnız üst notu**; gövde **dondurulur** |

> ⚠️ **14.09.2026 eklemesi — `IS_AKISI_OZETI.md`.** Bu dosya §1'de 🟢 canlı işaretliydi ve
> kendi başlığı *"Bölüm 1–5 bugünün fotoğrafıdır"* diyordu, ama bu tabloda, §B tetikleyici
> tablosunda ve §E bakım tablosunda **hiç yoktu**. Sınıfı olmayan dosyanın güncelleme
> tetikleyicisi de bakım bütçesi de olmaz. **Sınıf 3'tür** — sistemin bugün iş diliyle ne
> yaptığını anlatır; hedef durumu değil. *11.09'da bayatlamasının sebebi ihmal değil, bu
> boşluktu.*

> ⚠️ **15.09.2026 eklemesi — `MEVCUT_SISTEM_DURUMU.md`.** 14.09'da HEAD `3825241` üzerinde alınmış
> teknik ölçümdür; `FAZ1_UYGULAMA_KAPSAMI.md` §D'nin sayıları ondan gelir. Hiçbir tabloda yoktu —
> yukarıdaki açığın aynısı. **Sınıf 4'tür:** bir commit'e bağlı fotoğraf olduğu için gövdesi
> dondurulur. *"Bugün ne var?"* sorusunun sürekli cevabı `PROJE_DURUMU.md`'dir; iki dosya aynı
> sınıfta olursa iki ayrı "teknik envanter" yaşar ve biri bayatlar. Yeni ölçüm gerekirse
> **tarihli yeni bir kayıt** açılır.

> ⚠️ **15.09.2026 eklemesi — `ADR/`.** Plan dosyası mimari karar üretirse (§D.0'da oldu) karar
> **ADR'ye taşınır**, plan yalnız atıf ve sıra taşır. Sınır kuralı `ADR/README.md`'dedir.

**Sınıflar arası tek yön vardır:** Karar → Plan → Ayna. Ters yön yasaktır.
*Ayna bir kararı değiştiremez; plan bir karar üretemez.* (§7-6'nın mekanik hâli.)

⚠️ **En sık yapılan hata — 11.09'da yapılan hata:** sınıf 3'ü sınıf 1'e göre güncellemek.
`PROJE_DURUMU.md` *"KARARLAR'a göre güncellendi"* dendiğinde aslında yapılması gereken,
**kararı yazmak değil, aynadaki hangi şeyin artık hedefte olmadığını işaretlemekti.**

### B · Güncelleme tetikleyicileri — olaydan dosyaya

| Olay | Kim güncellenir | Ne yapılır |
|---|---|---|
| **Yeni karar verildi** | `KARARLAR.md` → §5/§1/§3 · §4 etki tablosu · §6 çıkış listesi | Karar metni + etki satırları + çıkış kalemi. **Aynı turda** `KABUL_KRITERLERI.md`'ye kriter türetilir (X-7 §(7)) |
| **Karar bir mevcut yeteneği geçersizleştirdi** | `FAZ1_UYGULAMA_KAPSAMI.md` §A | **GÇ-n satırı açılır.** Bu adım atlanırsa geri çekme unutulur — 13.09'un asıl bulgusu buydu |
| **Karar diğer dosyalarla çelişti** | Çelişen dosyalar | ⛔/⚠️ işareti + karar atfı. **Karar kopyalanmaz** |
| **Kod değişti (özellik)** | `PROJE_DURUMU.md` · `TRACEABILITY.md` · **`IS_AKISI_OZETI.md`** | Envanter + matris + iş dili anlatımı. Karar dosyalarına dokunulmaz |
| **Kod değişti (söküm)** | §A `Durum`/`Commit` + `PROJE_DURUMU.md` | ⛔ satırı **silinir**, GÇ satırı ✅ olur |
| **Faz geçişi** | `YOL_HARITASI.md` §8 + çıkış kriterleri · **tüm 🟦 listesi** | §0.6: *"her faz geçişinde 🟦 listesi tek tek gözden geçirilir"* |
| **Mimari seçim (nasıl)** | `ADR/` | KARARLAR'a **girmez** — sınır kuralı `ADR/README.md`'de. Plan dosyası ADR'ye **atıf yapar**, metni kopyalamaz |
| **Müşteri cevabı geldi** | `KARARLAR.md` 🟦 → ✅ | Varsayılan teyit edilir **veya değişir**; değişirse plan sınıfı da güncellenir |
| **Kilitlenme anı geçti** | `KARARLAR.md` | §0.6: **kilitlenme anı geçmiş 🟦 otomatik ✅ sayılır** |

### C · Tur sonu ritüeli — dört soru

Her iş turunun (commit grubu / haftalık kapanış) sonunda sırayla sorulur.
**Sıra bağlayıcıdır** — 2'yi atlayıp 3'e geçmek 11.09 hatasıdır.

1. **Yeni karar verdim mi?** → `KARARLAR.md` + kabul kriteri.
2. **Bu karar bugün kodda olan bir şeyi geçersizleştirdi mi?** → §A'ya GÇ satırı.
   *Bu soru sorulmazsa çelişki sessizce birikir.*
3. **Hangi dosya artık yanlış bir şey söylüyor?** → sınıf 2 ve 3'te ⛔/⚠️.
4. **Kod değişti mi?** → `PROJE_DURUMU.md` + `TRACEABILITY.md` + `IS_AKISI_OZETI.md`.

### D · Çelişki çözme kuralı

İki dosya farklı şey söylüyorsa **sıra sabittir**:
`KARARLAR.md` > `KABUL_KRITERLERI.md` > plan dosyaları > ayna dosyaları > arşiv.

- Ayna bir kararla çelişiyorsa → **aynadaki şey geri çekilir** (§A'ya satır).
- Plan bir kararla çelişiyorsa → **plan düzeltilir**.
- **KARARLAR kendi içinde çelişiyorsa** → yeni madde açılır ve redaksiyon yazılır.
  *Bu gerçekten oluyor:* K-1'in "tahsilat oranı" kalıntısı X-1 tarafından kaldırılmıştı ve
  iki tur boyunca fark edilmedi (X-6 §(10) ile düzeltildi).

### E · Dosya başına bakım maliyeti — dürüstçe

| Dosya | Tur başına | Not |
|---|---|---|
| `KARARLAR.md` | Karar varsa 30–60 dk | En pahalı, en değerli. Kısaltma girişimi **yapılmamalı** |
| `FAZ1_UYGULAMA_KAPSAMI.md` | 5–10 dk | Çoğu tur yalnız `Durum`/`Commit` işaretleme |
| `YOL_HARITASI.md` | Faz geçişinde 20 dk | Tur içinde nadiren |
| `PROJE_DURUMU.md` | Kod değiştiyse 10 dk | Envanter; yorum yok |
| `IS_AKISI_OZETI.md` | Kod değiştiyse 10 dk | **Sınıf 3** — davranış iş diliyle; yalnız Bölüm 1–5 |
| `TRACEABILITY.md` | Faz sonunda toplu | Tur başına tek tek güncellenmez |
| `KABUL_KRITERLERI.md` | Kriter başına 5 dk | Testten **önce** yazılır |
| `ADR/` | Karar başına ~15 dk | Gövde dondurulur; değişiklik = **yeni ADR** |
| `DENETIM_BULGULARI.md` · `MEVCUT_SISTEM_DURUMU.md` · `arsiv/` | Dokunulmaz | Yalnız üst durum notu |

**Toplam ~1 saat/hafta.** İki kişilik ekipte bu sürdürülebilir; bundan fazlası
sürdürülemez ve belge yine kodun gerisine düşer.

### F · Üç aylık uyum denetimi — takvime alınır

13.09 denetimi elle yapıldı ve otuzdan fazla çelişki buldu. **Bu bir olay değil, bir bakım
işi olmalı.** Her faz sonunda tek soru sorulur:

> *"Sınıf 3 dosyalarda, KARARLAR'da karşılığı olmayan **veya** KARARLAR'ın geçersiz kıldığı
> bir cümle kaldı mı?"*

Bulgular `FAZ1_UYGULAMA_KAPSAMI.md` §C'ye (açık madde defteri) yazılır, KARARLAR'da kapatılır.
*K-9 §A-3'ün "üç ayda bir geri dönüş testi" kuralının belge tarafındaki karşılığıdır:
**test edilmemiş yedek yedek değildir; denetlenmemiş belge belge değildir.***

---

## 8. Takvim özeti

| Faz | Süre | Bitiş | Durum |
|---|---|---|---|
| Faz 0 — Karar | ~1 hafta | Kararlar `KARARLAR.md`'de | ✅ **kapandı (09.09.2026)** |
| **Faz 1A — Söküm + şema** | tahmin edilebilir — **tarih artık verilebilir** — karar engeli kalmadı *(16.09: Şerit A, X-8…X-15, ADR-005 ✅)* *(X-10 15.09'da kapandı)* | **`FAZ1_UYGULAMA_KAPSAMI.md` §D.2** — sayıya bağlı çıkış kriteri *(burada kopyalanmaz)* · §C-g ✅ 15.09.2026 (`ADR/ADR-003`) | ← **şu an** |
| **Faz 1B — Yeniden inşa** | 🔵 **1A bitince tahmin edilir** | 11 fonksiyon · belge akışları · X-1/D-2/X-3/X-4/Ü-3/E-1/E-2/D-5 · `TRACEABILITY` yeniden kuruldu | ⏳ |
| Faz 2 — Ürünleştirme | 🔵 **1B bitince tahmin edilir** *(eski tahmin ~3–4 hafta)* | Çoğaltılabilir, izlenebilir ürün | ⏳ |
| Faz 3 — Canlıya alma | 🔵 **1B bitince tahmin edilir** *(eski tahmin ~3–4 hafta)* | Anka West canlıda | ⏳ |
| **Toplam** | 🔴 **Taahhüt edilemez** — gerekçe aşağıda | | |

**Anka West'e taahhüt ederken demo tarihi ile canlı tarihini ayrı ayrı yaz.**

> 🔴 **13.09.2026 — takvim uyarısı.** "~2–2,5 hafta" tahmini yalnız F-00…F-12'yi kapsıyordu.
> KARARLAR §4'ün doğurduğu iş (11 tablo — *15.09'da 13*, 4 belge, 40+ kolon, 11 fonksiyon) ve §A geri çekme
> listesi (**13 kalem** — *15.09'da 15: GÇ-14, GÇ-15*) bu tahminin **dışındaydı**. Toplam "~2,5–3 ay" rakamı bu yüzden
> **taahhüt edilebilir değildir**; `FAZ1_UYGULAMA_KAPSAMI.md` §C kapandıktan sonra yeniden
> yapılmalıdır. *(15.09.2026: §C'nin karar maddeleri kapandı — 13.09 ve 15.09 turları. 1A
> tahmininin önünde **Şerit A taraması** kaldı *(X-8 · X-9 · X-10 aynı gün kapandı)*; *16.09: X-11…X-15 ve ADR-005 aynı gün kapandı — **1A tahmininin önünde karar engeli yok**; tahmin C0…C10 iş yükünden yapılır*.
> 1B ve sonrası yine 1A bitince tahmin edilir.)* *Demo bugün gösterilebilir — ama demoda görünen kongre defteri, bayi paneli
> ve tahsilat bazlı prim **geri çekilecek** özelliklerdir; K-10 §H-C kuralı burada da geçerli:
> **gösterilen özellik dâhil sayılır.***

> ⚠️ **Kritik ön koşul — takvime paralel yürür:** **Şirket kuruluşu** (K-8) ve **C-1 teyit metni**
> canlıya çıkışın önündedir; bunlar mühendislik fazlarını beklemez, en erken başlatılmalıdır (bkz. §5.2).
