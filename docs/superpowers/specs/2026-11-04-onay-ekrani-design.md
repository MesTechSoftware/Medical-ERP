# Onay Bekleyenler ekranı — KPI, süzgeç, geçmiş, karar paneli (tasarım spec'i)

> **Tarih:** 04.11.2026 · **Kaynak:** kullanıcı talebi (sohbet, 03.11.2026: "sonraki sayfaya geç aynı işlemler"
> — menüde Kargo'dan sonraki sayfa; 28.10 isterinin altı modülü bitti, aynı standart sürdürülür) ·
> **Yol haritası:** Ü-25 (§7-5 gereği yazılır) · **Durum:** kullanıcı 02.11.2026'da "önerilenlerinle ilerle"
> dedi — her seçim önerilen seçenektir (§9); tek PR.
>
> Bu belge **plan**dır, karar üretmez (`YOL_HARITASI.md` §7.1-A). Dayandığı kararlar A-8 (onay bloğu: karar
> yalnız `YONETICI`'nin, not zorunlu, `RED` adımı durdurur, eski blok iz olarak kalır), A-2 eki (bedelsiz satır
> onayı), B-4 / A-8 eki (negatif stok yumuşak kısıt, blok siparişe bağlı), D-1 brief (dashboard istisnası
> "24 saatten eski onay"), E-1 (gün sınırı İstanbul günü). Yeni karar ya da ADR açılmaz.

## 1. Amaç

`/approvals` yöneticinin karar masası olsun: kaç talep bekliyor, kaçı 24 saati geçti, bugün kaç karar verildi.
Bekleyen talepler tabloda en eskisi önce dursun; yönetici bir talebi açınca kararı için gereken bağlamı —
negatif stokta ürün başına sevk edilecek miktar ve depo stoğu, bedelsiz onayda bedelsiz satırlar, aynı
belgenin önceki kararları — görüp notla onaylasın ya da reddetsin. Verilmiş kararlar süzülebilir bir
geçmişte bulunsun.

**Başarı ölçütü:** yönetici "24 saatten eski" kartına tıklar, dashboard'daki istisna sayısı kadar satır görür;
birini açar, panelde "Stent: sevk edilecek 5 · depo stoğu 2" görür, notla reddeder; talep bekleyenlerden
düşer, "Reddedilen" sekmesinde notuyla görünür.

## 2. Kapsam

### Kapsamda

| # | Kalem | Dayanak |
|---|---|---|
| 1 | KPI: Onay bekleyen · 24 saatten eski · Bugün onaylanan · Bugün reddedilen | ADR-010 · D-1 istisnası |
| 2 | Durum sekmeleri: Bekleyen (varsayılan) · Onaylanan · Reddedilen · Tümü + Filtrele (tarih, kural, açan, metin) + etkin süzgeç etiketleri | ortak bileşenler |
| 3 | Tablo: açılış, kural, belge, cari, açan, gerekçe, durum, karar veren, karar zamanı; sütun seçici, sayfalama, boş durum, iskelet | ortak bileşenler |
| 4 | Yan panel (`?detay=<blokId>`): talep, karar bağlamı, aynı belgenin önceki kararları; açıksa karar formu | A-8 |
| 5 | Dashboard "onay 24 saatten uzun süredir bekliyor" istisnası `?eski=1` adresini açar (sayı = satır) | D-1 |

### Kapsam dışı

- Karar kuralları ve `blokKarariVer` (değişmez); toplu karar (her karar kendi notuyla verilir, A-8).
- Kararın geri alınması (A-8: karar kesindir; yeni gerekçe yeni blok açar).
- Satıcı/operasyon görünümü (ekran yalnız `YONETICI`'nin, `requireAdmin`).

## 3. Ekran

### 3.1 Görünürlük

`requireAdmin` (bugünkü gibi). Bugün açık kalabilen blok yalnız siparişe (`SIP`) bağlıdır: sevkiyatta negatif
stok (`NEGATIF_STOK`) ve sipariş girişinde bedelsiz satır (`BEDELSIZ_ONAYI`). Konsinye (`KNS`), transfer
(`TRF`) ve düzeltme (`DZL`) blokları yönetici gerekçesiyle aynı işlemde `ONAY` alır; yalnız geçmişte görünür.

### 3.2 KPI kartları

`bosDavranisi: "sifir"`, trend yok; süzgeçten bağımsız.

| Kart | Tanım | Tıklayınca |
|---|---|---|
| Onay bekleyen (birincil) | `decision` boş blok sayısı; ikincil metrik "en eskisi <göreli süre>" (`goreliZaman`); > 0 ise uyarı tonu | bağlantı değil (varsayılan sekme) |
| 24 saatten eski | açık ve `openedAt < şimdi − ESKI_ONAY_SAATI` (dashboard istisnasıyla aynı sabit ve koşul); > 0 uyarı | `?eski=1` (kart = satır) |
| Bugün onaylanan | `decision ONAY`, `decidedAt` bugünün İstanbul gününde | `?durum=ONAY&baslangic=<bugün>&bitis=<bugün>` |
| Bugün reddedilen | `decision RED`, `decidedAt` bugün | `?durum=RED&baslangic=<bugün>&bitis=<bugün>` |

### 3.3 Süzgeç

| Parametre | Değerler | Anlamı |
|---|---|---|
| `durum` | yok (= bekleyen) · `ONAY` · `RED` · `tumu` | `decision` boş / ONAY / RED / hepsi |
| `baslangic`, `bitis` | `YYYY-AA-GG` | **olay günü**, İstanbul günü, iki uç dahil: kararlı blokta `decidedAt`, açık blokta `openedAt` |
| `eski` | `1` | açık ve 24 saatten eski (`durum`'u ezer: bekleyen) |
| `kural` | `NEGATIF_STOK` · `BEDELSIZ_ONAYI` | `ruleCode` |
| `acan` | kullanıcı kimliği | `openedById` |
| `q` | metin (≤ 100, Türkçe varyantlı) | belgenin numarası (SIP/KNS/TRF/DZL) ya da siparişin/konsinyenin cari adı |
| `page`, `per`, `detay` | | ortak |

Sekmeler yalnız `durum`'u yazar, öbür süzgeçleri korur (`eski` düşer). Filtrele paneli: tarih, kural, açan
(yönetici/operasyon/satıcı rolündekiler ada göre; pasif "· pasif"), ara; `durum` ve `per` gizli alanla korunur.
Etiketler: "Durum: Onaylanan", "Tarih: …", "24 saatten eski", "Kural: Negatif stok", "Açan: Ad", "Ara: …".
Bilinmeyen açan kimliği adresten düşer.

### 3.4 Tablo

| Sütun | İçerik | Gizlenebilir |
|---|---|---|
| Açılış | `formatDateTime(openedAt)` | hayır |
| Kural | `BLOK_KURAL_ADI` | hayır |
| Belge | belge no; SIP → `/orders?detay=<id>`; diğerleri düz metin | hayır |
| Cari | siparişin ya da konsinyenin carisi, yoksa "—" | evet |
| Açan | kullanıcı adı | evet |
| Gerekçe | `openReason`, tek satır kısaltılmış (tam metin `title` ve panelde) | evet |
| Durum | Bekliyor (uyarı) · Onaylandı (olumlu) · Reddedildi (hata) | hayır |
| Karar veren | ad ya da "—" | evet |
| Karar zamanı | `formatDateTime(decidedAt)` ya da "—" | evet |
| İşlem | "İncele" → panel (`?detay=`) | hayır |

Sıralama: bekleyen sekmesinde `openedAt asc, id asc` (en eski önce, bugünkü gibi); Onaylanan/Reddedilen'de
`decidedAt desc`; Tümü'de `openedAt desc` (Prisma olay anı coalesce sıralaması yapmaz); sonra `id desc`. Çerez `onay-sutunlar`, `path=/approvals`.

### 3.5 Yan panel

1. **Talep:** kural, belge (bağlantı), cari, sipariş durumu (SIP), açan · açılış zamanı, gerekçe (tam).
2. **Karar bağlamı (yalnız SIP):**
   - `NEGATIF_STOK`: ürün başına — sevk edilecek (kalemlerin kalanı toplanır, `kalemMiktarlari`; sevkiyatın
     denetimi gibi), varsayılan depodaki stok (`hesaplaStoklar`), "yetmiyor" çipi stok < kalan ise.
   - `BEDELSIZ_ONAYI`: bedelsiz satırlar — ürün, adet, sebep (`BEDELSIZ_SEBEP_ADI`), açıklama.
3. **Önceki kararlar:** aynı belgenin bu bloktan önceki blokları (kural, karar, karar veren, not).
4. **Karar** (yalnız açık blokta): karar notu (zorunlu) + Onayla / Reddet (`blokKarari`, bugünkü eylem);
   kart `data-blok-id` taşır. Kararlı blokta karar, veren, zaman ve not okunur.

Kapsam dışı ya da bulunmayan `detay` paneli açmaz.

## 4. Veri katmanı

- **`src/lib/onay-listesi/suzgec.ts`** (saf): `OnaySuzgeci = { durum, baslangic, bitis, eski, kural, acan, q }`,
  `BOS_SUZGEC`, `suzgecCoz(p) → { suzgec, detay }`, `onayAdresi(s, { page, per, detay })`, `durumSekmeleri(s)`,
  `etkinSuzgecler(s, acanAdi)`, `bosDurum(s)`, `kartAdresleri(bugun)`.
- **`src/lib/onay-listesi/sutunlar.ts`** (saf): `SUTUNLAR`, `SUTUN_CEREZI = "onay-sutunlar"`, `SUTUN_YOLU = "/approvals"`.
- **`src/lib/onay-listesi/sorgu.ts`:** `onayKosulu(s, an) → Prisma.ApprovalBlockWhereInput` (tek `where`;
  `q` → belge kimlikleri dört belge tablosundan, `metinVaryantlari`), `onayListesi(s, sayfa, an)` (satır: blok +
  belge no/bağlantı türü + cari + açan/karar veren adı), `onayKpileri(bugun, an)`, `onayPaneli(id)`,
  `acanSecenekleri()`.
- **`ESKI_ONAY_SAATI`** `istisnalar.ts`'te kalır; liste ve dashboard istisnası aynı sabitle sayar. Dashboard
  istisnasının `href`'i `onayAdresi({ ...BOS_SUZGEC, eski: true })` olur.

## 5. Hata davranışı

Geçersiz süzgeç değeri yok sayılır; bilinmeyen açan kimliği adresten düşer. Bulunmayan `detay` paneli açmaz.
Sayfa dışı `page` son sayfaya. Kararı verilmiş bloğa ikinci karar `ONAY_KARARI_VERILMIS` (bugünkü gibi).
KPI sorgusu hata verirse yalnız kartlar düşer (`kpiGetir`).

## 6. Testler

**Kabul kriterleri (testten önce):**

- **A-8-11:** Onay ekranı bekleyen talepleri en eskisi önce listeler; "24 saatten eski" kartı, dashboard'un
  "onay 24 saatten uzun süredir bekliyor" istisnası ve `eski=1` süzgecinin satır sayısı aynı koşuldan
  (`ESKI_ONAY_SAATI`) sayılır. Verilmiş kararlar geçmişte notu, vereni ve zamanıyla görünür; "Bugün onaylanan /
  reddedilen" kartları karar anının İstanbul gününden sayar ve açtıkları süzgecin satır sayısına eşittir.
- **A-8-12:** Onay panelinde negatif stok talebinin bağlamı ürün başına toplanmış sevk edilecek miktar
  (`kalemMiktarlari` kalanı; sevkiyatın denetimi gibi) ve sevkiyatın denetlediği depodaki stoktur; bedelsiz onay talebinde bedelsiz satırlar sebebiyle
  gösterilir. Karar formu yalnız açık blokta vardır; kararlı blokta karar, veren, zaman ve not okunur.

| Katman | Dosya | Neyi doğrular |
|---|---|---|
| Birim | `onay-listesi/suzgec.test.ts` | çözme/adres; varsayılan bekleyen; `eski` durumu ezer; sekmeler `eski`'yi düşürür; kart adresleri; etiketler |
| Entegrasyon | `onay-listesi/sorgu.itest.ts` | A-8-11: eski kart = süzgeç = `istisnalar()` eskiOnay; bugün onaylanan/reddedilen = süzgeç (İstanbul gece yarısı); sıralama; olay günü (açıkta açılış, kararlıda karar); kural/açan/metin (SIP belge no, cari, KNS belge no); A-8-12 panel: negatif stok bağlamı (kalan, depo stoğu, yetmiyor), bedelsiz satırlar, önceki kararlar, bulunmayan → `null` |
| E2E | `e2e/admin/onay-ekrani.spec.ts` | 24 saatten eski kartı → satır; panel bağlam + red → Reddedilen sekmesinde not; sütun gizle; sayfa dışı adres; KPI iskeleti |
| E2E | `e2e/admin/onay.spec.ts` güncellenir | karar paneli `?detay=` ile açılır |

## 7. Belgeler

YOL_HARITASI Ü-25 · KABUL_KRITERLERI (A-8-11, A-8-12) · TRACEABILITY · PROJE_DURUMU · DEVAM_PROMPTU.

## 8. Teslim

Tek PR `revize/onay-ekrani`.

## 9. Önerilen seçimler

| # | Soru | Seçilen | Diğer |
|---|---|---|---|
| 1 | Karar nerede verilir? | yan panelde, bağlamın altında | listede satır içi (bağlam görünmez; bugünkü kartlar) |
| 2 | Varsayılan sekme | Bekleyen | Tümü |
| 3 | Tarih süzgeci neye bakar? | olay günü (kararlıda karar, açıkta açılış) — "Bugün onaylanan" kartı = satır | yalnız açılış günü (bugün kararı verilen eski talep bugünün süzgecine girmez) |
| 4 | KPI 3–4 | bugün onaylanan / reddedilen | son 30 gün red oranı (karar başına değil, eğilim — Raporlar'ın işi) |
| 5 | Negatif stok bağlamı | kalem başına kalan ve varsayılan depo stoğu | yalnız gerekçe (bugünkü) |
| 6 | Toplu karar | yok (her karar kendi notuyla) | seçilenleri tek notla onayla |
| 7 | Metin araması | dört belge türünün numarası + sipariş/konsinye carisi | yalnız sipariş |
