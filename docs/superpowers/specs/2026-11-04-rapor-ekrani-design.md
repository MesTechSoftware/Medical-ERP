# Raporlar ekranı — doktor sıralaması listesi, süzgeç, sütun seçici (tasarım spec'i)

> **Tarih:** 04.11.2026 · **Kaynak:** kullanıcı talebi (sohbet, 04.11.2026: "kalan sayfaları tek promptta bitir aynı
> işlemler hepsi" — menüde Tahsilatlar'dan sonraki sayfa) · **Yol haritası:** Ü-27 (§7-5 gereği yazılır) ·
> **Durum:** kullanıcı spec onayını beklemeden ilerlemeyi istedi; her seçim önerilen seçenektir (§9); tek PR.
>
> Bu belge **plan**dır, karar üretmez (`YOL_HARITASI.md` §7.1-A). Dayandığı kararlar: X-1 (satıcı raporu: üç mutlak
> sayı, oran yok, dönem zorunlu, varsayılan bu ay, "tüm zamanlar" bilinçli seçim), K-4/ADR-010 (dönem KPI'ları ve
> karşılaştırma), Ü-3-1 (ciro *KDV hariç*, tahsilat *KDV dahil*), X-5 (Decimal toplama uygulamada yapılmaz),
> D-2 (Raporlar yalnız `YONETICI`). Yeni karar ya da ADR açılmaz.

## 1. Amaç

Raporlar'ın üst yarısı (dönem seçici, dört dönem KPI'sı, satıcı performansı) 2. turda modernleşti; alt yarısı
"ilk 25 doktor" sabit tablosu olarak kaldı. Doktor ciro sıralaması dönemdeki **bütün** cirolu carileri sayfalı,
süzülebilir bir listede göstersin; bir satıcıya tıklanınca o satıcının carileri süzülsün. Sıra numarası ve "lidere
göre" çubuğu süzgeçten bağımsız dönem sıralaması olsun — süzülmüş listede de carinin şirket içindeki yeri okunsun.

**Başarı ölçütü:** yönetici Satıcı Performansı'nda "Ahmet Yılmaz"a tıklar; doktor listesi Ahmet'in carileriyle
süzülür, ilk satır "#3" der (şirkette üçüncü). Ekim'e geçer; süzgeç korunur.

## 2. Kapsam

### Kapsamda

| # | Kalem | Dayanak |
|---|---|---|
| 1 | Doktor sıralaması: dönemde cirosu sıfır olmayan bütün cariler, sayfalı; sıra no, cari (→ `/doctors/<id>`), satıcı (carinin bugünkü sahibi), ciro (*KDV hariç*), lidere göre çubuğu | X-1 · Ü-3-1 |
| 2 | Süzgeç: satıcı (sahibi; "Sahipsiz" seçeneği), metin (cari adı, Türkçe I/ı); etkin süzgeç etiketleri | ortak bileşenler |
| 3 | Satıcı Performansı'nda satıcı adı doktor listesini o satıcıyla süzer | — |
| 4 | Dönem değişince doktor süzgeci korunur (dönem seçicide gizli alanlar) | X-1 §(2) |
| 5 | Sütun seçici (Satıcı, Lidere göre), boş durum, iskelet | ortak bileşenler |

### Kapsam dışı

- KPI'lar, satıcı performansı tablosu ve servis hesapları (`getSellerReports`, `ciroOzeti`) — değişmez.
- Yan panel: doktor ayrıntısı Doktorlar ekranındadır (bağlantı yeter).
- Toplam satırı (süzülmüş listenin ciro toplamı uygulamada Decimal toplamı ister, X-5).
- Satıcı/rapor dışa aktarımı (Dışa Aktarım ekranının işi).

## 3. Ekran

### 3.1 Görünürlük

`requireAdmin` (bugünkü gibi).

### 3.2 Doktor sıralaması

Başlık "Doktor ciro sıralaması". Kaynak `getDoctorReports(aralik)` — bütün cariler, ciroya göre azalan
(`comparedTo`), eşitlikte ada göre; **cirosu sıfır olan satır listelenmez** (iade ciroyu eksiye çevirebilir;
eksi ciro listelenir). Sıra (`sira`, 1'den) ve lidere oran (`cubukOranlari`) bu tam dönem listesinden hesaplanır;
süzgeç sonra uygulanır. Sayfalama ortak (`getPagination`, varsayılan sayfa boyu).

| Sütun | İçerik | Gizlenebilir |
|---|---|---|
| # | dönem sırası | hayır |
| Cari | ad → `/doctors/<id>` | hayır |
| Satıcı | carinin bugünkü sahibi ya da "—" | evet |
| Ciro (KDV hariç) | `Tutar taban={MATRAH}` | hayır |
| Lidere göre | `OranCubugu` | evet |

Çerez `rapor-sutunlar`, `path=/reports`. Boş durum: süzgeçsiz "Bu dönemde ciro yok."; süzgeçli "Bu süzgeçlere uyan
cari yok." + Temizle (dönemi korur).

### 3.3 Süzgeç

| Parametre | Değerler | Anlamı |
|---|---|---|
| `donem` | bugünkü (`YYYY-AA` · `tum`) | değişmez |
| `satici` | kullanıcı kimliği · `sahipsiz` | carinin bugünkü sahibi |
| `q` | metin (≤ 100) | cari adı; karşılaştırma `tr` yereliyle küçük harfe çevrilerek (I/ı doğru) |
| `page`, `per` | | ortak |

Filtrele paneli (doktor tablosunun başlığında): satıcı (SATICI rolündekiler ada göre, pasif "· pasif", "Sahipsiz"),
ara; `donem` ve `per` gizli alanla korunur. Etiketler: "Satıcı: Ad" / "Sahipsiz", "Ara: …". Bilinmeyen satıcı
kimliği adresten düşer. Dönem seçici `satici` ve `q`'yu gizli alanla taşır; "Tüm zamanlar" bağlantısı da.
Satıcı Performansı'nda ad, `?donem=<aynı>&satici=<id>` adresine bağlantıdır.

## 4. Veri katmanı

- **`src/lib/rapor-listesi/suzgec.ts`** (saf): `RaporSuzgeci = { donem: string | null; satici: string | null;
  q: string | null }` (`donem` ham parametre, çözümü `donemCoz`'da), `SAHIPSIZ = "sahipsiz"`, `suzgecCoz(p)`,
  `raporAdresi(s, { page, per })`, `etkinSuzgecler(s, saticiAdi)`, `bosDurum(s)`.
- **`src/lib/rapor-listesi/sutunlar.ts`** (saf): `SUTUNLAR` (satici, oran), `SUTUN_CEREZI = "rapor-sutunlar"`,
  `SUTUN_YOLU = "/reports"`.
- **`src/lib/rapor-listesi/sorgu.ts`:** `doktorSiralamasi(aralik, s, sayfa) → { satirlar: (DoctorReport & { sira,
  oran, saticiId })[]; toplam }` — `getDoctorReports(aralik, Infinity)` (sahip kimliği de döner), sıfır ciro
  düşer, sıra ve oran, sonra süzgeç ve sayfa; `saticiSecenekleri()`.
- **`getDoctorReports`:** `ownerSellerId` döner; eşit ciroda ada göre sıralar; `limit` varsayılanı korunur.
- **`DonemSecici`:** isteğe bağlı `korunan?: Record<string, string>` — gizli alan ve "Tüm zamanlar" bağlantısına
  eklenir (`/my-report` vermez, davranışı değişmez).

## 5. Hata davranışı

Geçersiz/bilinmeyen satıcı kimliği adresten düşer; sayfa dışı `page` son sayfaya. Doktor listesi sorgusu hata verirse
sayfa hata sınırına düşer (bugünkü gibi); KPI'lar `kpiGetir` ile ayrı düşer (değişmez).

## 6. Testler

**Kabul kriteri (testten önce):**

- **X-1-2:** Raporlar'ın doktor ciro sıralaması dönemde cirosu sıfır olmayan bütün carileri ciroya göre azalan
  (eşitlikte ada göre) sayfalı listeler. Sıra numarası ve lidere göre oran süzgeçten bağımsız dönem sırasıdır;
  satıcı süzgeci carinin bugünkü sahibine, metin süzgeci cari adına (Türkçe I/ı) bakar. Dönem değişince süzgeç
  korunur.

| Katman | Dosya | Neyi doğrular |
|---|---|---|
| Birim | `rapor-listesi/suzgec.test.ts` | çözme/adres gidiş-dönüş (donem korunur), geçersiz değer, etiketler, boş durum |
| Entegrasyon | `rapor-listesi/sorgu.itest.ts` | sıfır ciro düşer, eksi ciro kalır; eşit ciro ada göre; süzgeçli listede sıra/oran dönem sırası; satıcı ve sahipsiz süzgeci; Türkçe I/ı; sayfalama ve toplam |
| E2E | `e2e/admin/rapor-ekrani.spec.ts` | satıcı adına tıkla → süzgeç ve "#n"; dönem değiştir → süzgeç korunur; sütun gizle; sayfa dışı; iskelet |

## 7. Belgeler

YOL_HARITASI Ü-27 · KABUL_KRITERLERI (X-1-2) · TRACEABILITY · PROJE_DURUMU · DEVAM_PROMPTU.

## 8. Teslim

Tek PR `revize/rapor-ekrani`.

## 9. Önerilen seçimler

| # | Soru | Seçilen | Diğer |
|---|---|---|---|
| 1 | Doktor tablosu kapsamı | dönemde cirolu bütün cariler, sayfalı | ilk 25 (bugünkü) |
| 2 | Sıra ve oran | süzgeçten bağımsız dönem sırası | süzülmüş listede yeniden sıralama |
| 3 | Satıcı süzgeci | carinin bugünkü sahibi | siparişin satıcısı (cironun sahibi; cari başına birden çok satıcı çıkar) |
| 4 | Satıcıdan doktora geçiş | satıcı adı süzgeç bağlantısı | satıcı yan paneli |
| 5 | Sıfır cirolu cariler | listelenmez | "sıfırları göster" seçeneği |
