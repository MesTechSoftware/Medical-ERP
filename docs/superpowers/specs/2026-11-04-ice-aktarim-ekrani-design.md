# İçe Aktarım ekranı — KPI, parti listesi, parti paneli, yeni içe aktarım sayfası (tasarım spec'i)

> **Tarih:** 04.11.2026 · **Kaynak:** kullanıcı talebi (sohbet, 04.11.2026: "kalan sayfaları tek promptta bitir aynı
> işlemler hepsi" — menünün son sayfası) · **Yol haritası:** Ü-30 (§7-5 gereği yazılır) · **Durum:** kullanıcı spec
> onayını beklemeden ilerlemeyi istedi; her seçim önerilen seçenektir (§9); tek PR.
>
> Bu belge **plan**dır, karar üretmez (`YOL_HARITASI.md` §7.1-A). Dayandığı kararlar: D-6 (içe aktarım: doğrula →
> önizle → tek transaction'da yaz; açılış türleri geri alınmaz), X-12 (parti ve geri alma: yalnız `YONETICI`,
> gerekçe zorunlu, koşul partinin tamamına bakar), X-16 (devreye alma aracı), E-1 (İstanbul günü), ADR-010 (KPI).
> Yeni karar ya da ADR açılmaz.

## 1. Amaç

İçe aktarım devreye almanın aracıdır; ekran bugün formun altında son 50 partiyi düz tabloda gösteriyor, geri alma
satır içi açılır bir kutuda. Ekran öbür liste ekranlarıyla aynı dili konuşsun: kaç parti yazıldı, kaçı geri
alındı; partiler süzülsün ve sayfalansın; bir partiyi açınca türü, dosyası, yazdığı kayıtların dağılımı ve geri
alma durumu panelde görünsün, geri alma oradan gerekçeyle yapılsın. Yeni içe aktarım formu kendi sayfasına taşınsın.

**Başarı ölçütü:** yönetici "Geri alınabilir" kartına tıklar; liste geri alınabilir partileri gösterir; birini açar,
panelde "Cari: 120 kayıt" görür, gerekçe yazıp geri alır; parti "Geri alındı" sekmesinde gerekçesiyle görünür.

## 2. Kapsam

### Kapsamda

| # | Kalem | Dayanak |
|---|---|---|
| 1 | KPI: Parti (tümü) · Bu ay · Geri alınabilir · Geri alındı (kart = satır) | ADR-010 · X-12 |
| 2 | Durum sekmeleri: Tümü · Yazıldı · Geri alındı + Filtrele (tür, tarih, metin) + etkin etiketler | ortak bileşenler |
| 3 | Tablo: parti, tür, dosya, yapan, zaman, kayıt, durum; sütun seçici, sayfalama, boş durum, iskelet | ortak bileşenler |
| 4 | Yan panel (`?detay=<partiId>`): parti, kayıt dağılımı, geri alma bilgisi; geri alınabilirse gerekçeli form | X-12 |
| 5 | Yeni içe aktarım `/imports/new` (bugünkü form aynen) | D-6 |

### Kapsam dışı

- İçe aktarım akışı (`iceAktar`, şablonlar, doğrulama, yazma) ve `partiGeriAl` (değişmez).
- Parti satırlarının tek tek listesi (kayıtlar kendi ekranlarındadır).

## 3. Ekran

### 3.1 KPI kartları

`requireAdmin`. Süzgeçten bağımsız, anlık, `bosDavranisi: "sifir"`; `kpiGetir`.

| Kart | Tanım | Tıklayınca |
|---|---|---|
| Parti (birincil) | bütün partiler | `/imports` |
| Bu ay | `createdAt` bu ayın İstanbul günlerinde | `?baslangic=<ay başı>&bitis=<bugün>` |
| Geri alınabilir | geri alınmamış ve türü geri alınabilen (Cari, Ürün, Fiyat listesi; açılış türleri değil — D-6-2) | `?durum=geri-alinabilir` |
| Geri alındı | `revertedAt` dolu | `?durum=geri-alindi` |

### 3.2 Süzgeç

| Parametre | Değerler | Anlamı |
|---|---|---|
| `durum` | yok (tümü) · `yazildi` · `geri-alinabilir` · `geri-alindi` | `revertedAt` boş / boş ve türü geri alınabilir / dolu |
| `tur` | `ImportDataType` | `dataType` |
| `baslangic`, `bitis` | `YYYY-AA-GG` | `createdAt`'in İstanbul günü, iki uç dahil |
| `q` | metin (≤ 100) | parti no ya da dosya adı (`contains`, büyük/küçük harf duyarsız) |
| `page`, `per`, `detay` | | ortak |

Sekmeler: Tümü · Yazıldı · Geri alındı (yalnız `durum`'u yazar; "Geri alınabilir" yalnız kart süzgecidir, etiketi
"Durum: Geri alınabilir"). Filtrele paneli: tür, tarih, ara; `durum`, `per` gizli alanla korunur.

### 3.3 Tablo

| Sütun | İçerik | Gizlenebilir |
|---|---|---|
| Parti | `batchNo` | hayır |
| Tür | `VERI_TIPI_ADI` | hayır |
| Dosya | `fileName` ya da "—" | evet |
| Yapan | kullanıcı adı | evet |
| Zaman | `formatDateTime(createdAt)` | hayır |
| Kayıt | bağlı kayıt sayısı (beş ilişki `_count` toplamı) | hayır |
| Durum | Yazıldı (nötr) · Geri alındı (uyarı) | hayır |
| İşlem | "İncele" → panel (`data-kayit`) | hayır |

Satır `data-parti` taşır (mevcut e2e). Sıralama `createdAt desc, id desc`. Çerez `ice-aktarim-sutunlar`.

### 3.4 Yan panel

1. **Parti:** parti no, tür, dosya, yapan · zaman.
2. **Kayıtlar:** ilişki başına sayı (Cari, Ürün, Fiyat satırı, Cari hareket, Stok hareketi; sıfırlar gösterilmez).
3. **Geri alma:** geri alındıysa geri alan, zaman, gerekçe; türü geri alınamıyorsa "Bu tür geri alınmaz (açılış)";
   aksi halde gerekçe (zorunlu) + "Partiyi geri al" (`partiyiGeriAl`, bugünkü eylem; `IslemFormu`).

### 3.5 Yeni içe aktarım sayfası

`/imports/new` (`requireAdmin`): bugünkü `IceAktarimFormu` aynen; başlıkta "İçe Aktarım" listesine dönüş bağlantısı;
genel iskelet (`new/loading.tsx`). Liste başlığında "Yeni İçe Aktarım" düğmesi.

## 4. Veri katmanı

- **`src/lib/ice-aktarim-listesi/suzgec.ts`** (saf): `PartiSuzgeci = { durum, tur, baslangic, bitis, q }`, `BOS_SUZGEC`,
  `suzgecCoz`, `partiAdresi`, `durumSekmeleri`, `kartAdresleri(bugun)`, `etkinSuzgecler`, `bosDurum`.
- **`src/lib/ice-aktarim-listesi/sutunlar.ts`** (saf): `dosya`, `yapan`; çerez `ice-aktarim-sutunlar`, yol `/imports`.
- **`src/lib/ice-aktarim-listesi/sorgu.ts`:** `partiKosulu(s)`, `partiListesi(s, sayfa)`, `partiKpileri(bugun)`,
  `partiPaneli(id)`. Geri alınabilir türler `TANIMLAR`'ın `geriAl` taşıyanlarından türetilir (tek kaynak).

## 5. Hata davranışı

Geçersiz süzgeç değeri yok sayılır; bulunmayan `detay` paneli açmaz; sayfa dışı `page` son sayfaya. Geri alma
hataları bugünkü kural kodlarıyla (`PARTI_GERI_ALINAMAZ`, `PARTI_ZATEN_GERI_ALINDI`, `GEREKCE_ZORUNLU`).

## 6. Testler

**Kabul kriteri:**

- **X-12-2:** İçe aktarım ekranının kartları (parti, bu ay, geri alınabilir, geri alındı) açtıkları süzgecin satır
  sayısına eşittir; "geri alınabilir" geri alınmamış ve türü geri alınabilen partilerdir (açılış türleri değil).
  Parti panelinde kayıt dağılımı ve geri alma durumu görünür; geri alma panelden gerekçeyle yapılır.

| Katman | Dosya | Neyi doğrular |
|---|---|---|
| Birim | `ice-aktarim-listesi/suzgec.test.ts` | çözme/adres; sekmeler; kart adresleri; etiketler |
| Entegrasyon | `ice-aktarim-listesi/sorgu.itest.ts` | X-12-2: kart = süzgeç; geri alınabilir açılışı dışlar; tarih İstanbul günü; metin; panel dağılımı ve geri alma bilgisi |
| E2E | `e2e/admin/ice-aktarim.spec.ts` güncellenir + `ice-aktarim-ekrani.spec.ts` | form `/imports/new`'de; geri alma panelden; kart → süzgeç; sütun gizle; iskelet |

## 7. Belgeler

YOL_HARITASI Ü-30 · KABUL_KRITERLERI (X-12-2) · TRACEABILITY · PROJE_DURUMU · DEVAM_PROMPTU.

## 8. Teslim

Tek PR `revize/ice-aktarim-ekrani`.

## 9. Önerilen seçimler

| # | Soru | Seçilen | Diğer |
|---|---|---|---|
| 1 | KPI | parti, bu ay, geri alınabilir, geri alındı | tür başına parti (beş kart, dağınık) |
| 2 | Yeni içe aktarım | ayrı sayfa (Tahsilatlar gibi) | listenin üstünde (bugünkü) |
| 3 | Geri alma | panelde, gerekçeli | satır içi açılır kutu (bugünkü) |
