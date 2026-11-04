# Denetim Kaydı ekranı — KPI, tarih sekmeleri, açılır süzgeç, sütun seçici (tasarım spec'i)

> **Tarih:** 04.11.2026 · **Kaynak:** kullanıcı talebi (sohbet, 04.11.2026: "kalan sayfaları tek promptta bitir aynı
> işlemler hepsi" — menüde Raporlar'dan sonraki sayfa) · **Yol haritası:** Ü-28 (§7-5 gereği yazılır) · **Durum:**
> kullanıcı spec onayını beklemeden ilerlemeyi istedi; her seçim önerilen seçenektir (§9); tek PR.
>
> Bu belge **plan**dır, karar üretmez (`YOL_HARITASI.md` §7.1-A). Dayandığı kararlar: X-18 (denetim kaydı: salt
> okunur, zincirli, süzgeç ve imleçli sayfalama §(9), detay paneli, alan bazlı fark), D-2 (yalnız `YONETICI`),
> E-1 (İstanbul günü), ADR-010 (KPI). Yeni karar ya da ADR açılmaz.

## 1. Amaç

Denetim kaydı Ü-17'de (27.10) süzgeçli liste, detay paneli ve imleçli sayfalamayla kuruldu; ortak liste
bileşenleri o tarihten sonra çıktı. Ekran öbür ekranlarla aynı dili konuşsun: üstte "bugün ne oldu" kartları
(başarısız giriş ve silme göze çarpsın), tarih kısayolları, açılır Filtrele paneli ve etkin süzgeç etiketleri,
sütun seçici, iskelet. Liste, imleç, detay paneli ve zincir değişmez.

**Başarı ölçütü:** yönetici "Bugün başarısız giriş: 3" kartına tıklar; liste bugünün üç başarısız giriş kaydını
gösterir; "Olay: Başarısız giriş" etiketini kaldırınca bugünün bütün kayıtları gelir.

## 2. Kapsam

### Kapsamda

| # | Kalem | Dayanak |
|---|---|---|
| 1 | KPI: Bugün işlem · Son 7 gün işlem · Bugün başarısız giriş · Bugün silme (kart = süzgecin satırı) | ADR-010 · X-18 |
| 2 | Tarih hızlı sekmeleri (Tümü · Bugün · Son 7 gün · Bu ay), öbür süzgeçleri korur | ortak bileşenler |
| 3 | Filtrele açılır paneli (tarih, kullanıcı, modül, işlem türü, olay) + etkin süzgeç etiketleri | ortak bileşenler |
| 4 | Sütun seçici (Modül / varlık, Özet), boş durum (`BosDurum`), iskelet (`loading.tsx`) | ortak bileşenler |

### Kapsam dışı

- Kayıt yazımı, zincir, maske, fark ve detay paneli (değişmez).
- İmleçli sayfalama (sayfa numarası ve toplam yoktur; X-18 §(9) — değişmez).
- Zincir doğrulama göstergesi (ayrı iş; doğrulama yükü sayfa açılışına konmaz).

## 3. Ekran

### 3.1 KPI kartları

`requireAdmin`. Süzgeçten bağımsız, anlık (`karsilastirma: { anlik }`), `bosDavranisi: "sifir"`, trend yok;
`kpiGetir` kapsülü. Her kart, listenin süzgeç koşuluyla (`kosul`) sayar ve o süzgeci açar.

| Kart | Süzgeç | Not |
|---|---|---|
| Bugün işlem (birincil) | `baslangic=bitis=<bugün>` | "bugün" |
| Son 7 gün işlem | `baslangic=<bugün−6>&bitis=<bugün>` | "son 7 gün" |
| Bugün başarısız giriş | bugün + `olay=AUTH_LOGIN_FAILURE`; > 0 uyarı tonu | "bugün" |
| Bugün silme | bugün + `tur=SILME`; > 0 uyarı tonu | "bugün" |

### 3.2 Süzgeç

Parametreler bugünküdür (`baslangic`, `bitis`, `kullanici`, `modul`, `tur`, `olay`, imleç `once`/`sonra`, `kayit`).
Hızlı sekmeler tarih kısayollarıdır (ortak `tarihSekmeleri`), öbür süzgeçleri korur, imleci düşürür. Filtrele
paneli bugünkü alanları taşır (açılır, `aria-label="Denetim kaydı süzgeci"` korunur). Etiketler: "Tarih: …",
"Kullanıcı: Ad" / "Sistem / anonim", "Modül: …", "Tür: …", "Olay: …"; adı bilinmeyen kullanıcı etiketsiz.

### 3.3 Tablo

Sütunlar bugünküdür; "Modül / varlık" ve "Özet" gizlenebilir (çerez `denetim-sutunlar`, `path=/audit-logs`).
Boş durum: süzgeçsiz "Henüz kayıt yok.", süzgeçli "Bu süzgeçlere uyan kayıt yok." + Temizle.

## 4. Veri katmanı

- **`denetim/suzgec.ts`:** `tarihSekmesiAdresi(s, tarih)`, `kartAdresleri(bugun) → { bugun, yediGun, basarisiz, silme }`,
  `etkinSuzgecler(s, kullaniciAdi)`, `bosDurum(s)`; `denetimSuzgeci`'nin kendisi değişmez.
- **`denetim/sutunlar.ts`** (saf): `SUTUNLAR` (modul, ozet), `SUTUN_CEREZI = "denetim-sutunlar"`, `SUTUN_YOLU = "/audit-logs"`.
- **`denetim/sorgu.ts`:** `kosul` dışa açılır (`denetimKosulu`); `denetimKpileri(bugun) → { bugun, yediGun, basarisiz, silme }`
  (dört `count`, her biri kartın süzgecinin `denetimKosulu`'ndan).

## 5. Hata davranışı

Bugünkü gibi (geçersiz değer yok sayılır; bulunmayan kayıt "kayıt yok" paneli). KPI sorgusu hata verirse yalnız
kartlar düşer.

## 6. Testler

**Kabul kriteri:**

- **X-18-8:** Denetim kaydı ekranının kartları (bugün işlem, son 7 gün işlem, bugün başarısız giriş, bugün silme)
  listenin süzgeç koşuluyla İstanbul gününden sayar; her kart açtığı süzgecin satır sayısına eşittir.

| Katman | Dosya | Neyi doğrular |
|---|---|---|
| Birim | `denetim/suzgec.test.ts` (eklenir) | kart adresleri; tarih sekmesi öbür süzgeçleri korur, imleci düşürür; etiketler; boş durum |
| Entegrasyon | `denetim/sorgu.itest.ts` (eklenir) | X-18-8: her kart = `denetimListesi` (büyük boyutla) satır sayısı; İstanbul gece yarısı |
| E2E | `e2e/admin/denetim-ekrani.spec.ts` | başarısız giriş kartı → süzgeç ve etiket; tarih sekmesi; sütun gizle; KPI iskeleti |

## 7. Belgeler

YOL_HARITASI Ü-28 · KABUL_KRITERLERI (X-18-8) · TRACEABILITY · PROJE_DURUMU · DEVAM_PROMPTU.

## 8. Teslim

Tek PR `revize/denetim-ekrani`.

## 9. Önerilen seçimler

| # | Soru | Seçilen | Diğer |
|---|---|---|---|
| 1 | KPI'lar | bugün işlem, son 7 gün, bugün başarısız giriş, bugün silme | modül dağılımı (grafik; Raporlar'ın işi değil, gürültü) |
| 2 | Sayfalama | imleç (bugünkü) | sayfa numarası (milyonlarca satırda `OFFSET` pahalı, X-18 §(9)) |
| 3 | Zincir göstergesi | yok (ayrı iş) | kart olarak "zincir bütün" |
