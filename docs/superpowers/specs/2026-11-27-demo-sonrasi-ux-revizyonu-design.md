# Demo sonrası UX revizyonu — tasarım spec'i (27.11.2026)

> **Belge sınıfı: plan (YOL_HARITASI §7.1-A) — karar üretmez.** Kararlar `KARARLAR.md` §5.23'tedir (S1–S9); kriterler
> `KABUL_KRITERLERI.md` A-3-8…10, A-5-10, A-8-14…18, A-13-4, D-2-5, D-3-3, K-4-5/6. İş kalemi: `YOL_HARITASI` Ü-42.
> Bu spec, siparişler spec'inin (`2026-11-03-siparisler-ekrani-design.md`) §9 madde 6'sını **tersine çevirir** (S2).

## 1. Onay görünürlüğü (M1)

- **Onay tablosu:** kararsız blokta satır eylemi "Karar Ver", kararlıda "İncele".
- **Onay paneli:** açık talepte karar formu `Panel` `altBilgi`'sinde (gövde kayar, form sabit). Kararlı blokta karar bilgisi
  gövdede. `ONAY` + `NEGATIF_STOK` → "Kargo ekranında aç" (`/shipping?kismi=<siparisId>`). Karar sonrası `/orders`,
  `/my-orders`, `/dashboard` da yenilenir.
- **Kargo bekleyenler:** satıra `acikBloklar` (kararsız blok id'leri) ve `redNotu` (son RED: not/tarih/kural). KPI
  `onayBekleyen` yalnız kararsız bloklu siparişleri sayar; `reddedilen` ayrı alan.
- **Rozet (`OnayEtiketi`):** isteğe bağlı `href`; bağlantı kuralı saf fonksiyonda (tek açık blok → `?detay=`, çok →
  `?q=`, RED → `?durum=RED&q=`). OPERASYON'da bağlantı yok, altında "Yönetici onayı bekleniyor".
- **S7:** RED + `BEDELSIZ_ONAYI`/`ISKONTO_TAVANI` → "Reddedildi — sipariş iptal edilmeli" + sipariş bağlantısı, seçilemez.
- **Red notu (S6):** Kargo `KismiPanel` ve `SiparisPaneli` son karar bloğunu gösterir; yönetimde karar veren adı dahil,
  satıcıda yalnız `openedById === oturum.id` bloğunun karar/tarih/notu (ad yok), başkasının bloğunda yalnız durum.
- **Menü sayısı:** YONETICI için `onayListesi` bekleyen koşuluyla (koşul kopyalanmaz, dışa açılan fonksiyon) sayı;
  `NavItem.sayi`, 0'da rozet yok; hata sayfayı düşürmez.

## 2. Kargo → fatura köprüsü (M2)

- Kart `id="fatura-<belgeNo>"` + `scroll-mt`. "Tümünü Kopyala" mevcut `KopyalaDugmesi` ile; metin saf `faturaKartiMetni`
  fonksiyonundan (muhatap `Etiket: değer`, boş satır, sekmeli kalemler, KDV kırılımı, toplam, "Bilgi amaçlıdır — mali
  belge değildir"). **Yazdır yok.**
- Köprü: Sevkiyatlar "Fatura bilgisi" bağlantısı; sipariş paneli sevkiyat satırı (yalnız yönetim); sevk başarı bildirimi
  (`sevkiyat=<id>` parametresi **DB'den doğrulanır**, href sunucuda kurulur — parametreden metin alınmaz).
- Kargo bekleyende "Fatura bilgisi eksik" (`StatusChip uyari`), `EKSIK_FATURA_BILGISI` koşulu tek sorguda; seçimi engellemez.
- Satıcı ekranlarında "Fatura Hazırlık" metni hiç geçmez.

## 3. Durum geçişleri (M3)

- `siparisiHazirla` `stage = ONAYLI` ister; detay sayfası düğmesi aynı koşulla.
- `prepareOrder`/`markDelivered` dönüş adresi alır; `donusAdresi(ham, id)` saf, kapalı liste (`/orders/<id>`, `/orders`,
  `/shipping` + query); `//evil.com`, `https://…`, `/\…`, boş → varsayılan.
- Sipariş paneli (yalnız yönetim) `altBilgi`: BEKLIYOR+ONAYLI → Hazırlığa Al; HAZIRLANIYOR → `/shipping?kismi=<id>`;
  KARGOLANDI → Teslim (`ConfirmSubmit`). İptal yok.
- Kargo Sevkiyatlar: Teslim, siparişin **en yeni** sevkiyat satırında, sipariş KARGOLANDI iken; metin "Siparişin bütün
  sevkiyatları teslim edildi olarak işaretlenecek."
- `topluHazirla`: `requireStaff`, `TOPLU_SINIR`=50, sipariş başına ayrı transaction, `TopluSonucSatiri` listesi.
  Siparişler "Bekliyor" sekmesinde satır seçim kutuları; `/my-orders`'ta yok.

## 4. Sevkiyat takip/irsaliye düzeltme (M4)

`sevkiyatTakipDuzelt(tx, …)`: mevcut değer oku → pasif firma reddi → irsaliye ≤ 32 → fark yoksa audit yok → yalnız üç alan
`update` + `createAuditLog` (yeni `AUDIT_ACTIONS` sabiti, before/after/changes, aynı transaction). Action
`updateShipmentTracking` `requireStaff`; `/shipping`, `/orders`, `/orders/<id>` yenilenir. UI: Sevkiyatlar satırında
"Düzenle" → `?duzenle=<id>` yan paneli; sipariş detayında (yönetim) bağlantı.

## 5. Satıcı tahsilatları ve durum çizelgesi (M5)

- `reports-service`: sahip atfı (CASE … DoctorAssignment) tek SQL parçası; toplam ve `saticiDonemTahsilatlari` aynı parçayı
  kullanır. `my-report`: üstte bilgi notu, tablo (Tarih · Doktor · Ödeme yöntemi · Referans no · **Tutar**, brüt), sayfalı,
  `kpiGetir` kapsülü, indirme yok.
- **OrderDetail durum çizelgesi** (`DurumCizelgesi.tsx`): Sipariş Alındı → Hazırlanıyor → Kargolandı → Teslim Edildi.

| Durum | Gösterim |
|---|---|
| `TEKLIF` | yalnız "Teklif" rozeti, çizelge yok |
| `IPTAL` | çizelge yerine iptal rozeti |
| `BEKLIYOR` | 1. adım etkin |
| `HAZIRLANIYOR` | 2. adım etkin; sevkiyat varsa "Kısmi sevk" alt notu |
| `KARGOLANDI` | 3. adım etkin; `closeReason` doluysa "Kalanı kapatıldı" |
| `TESLIM_EDILDI` | 4. adım etkin |

  Açık blok varsa sade şerit "Merkez onayı bekleniyor" (satıcıda gerekçe/kural yok); RED ise S6. Renkler mevcut
  `StatusBadge`/`StatusChip` tonlarından.

## 6. Menü grupları (M6)

`MENU_GRUPLARI`: **Operasyon** — Genel Bakış, Siparişler, Kargo, Onay Bekleyenler, Tahsilatlar · **Katalog & Cari** —
Doktorlar, Ürünler, Stok, Fiyat Listeleri · **Yönetim & Rapor** — Raporlar, Kullanıcılar, Dışa Aktarım, İçe Aktarım,
Denetim Kaydı. `ANA_MENU` grupların düz birleşimi olarak **türetilir** (dashboard özetleri, `SayfaSeridi`,
`sayfa-ozeti.test.ts` bozulmaz). `YALNIZ_YONETICI` grup içinde uygulanır; boş grup çizilmez. Masaüstü kenar menüde grup
başlığı; mobil şerit düz; satıcı layout'u düz (`navGruplari?` geriye uyumlu).

## 7. Test planı

- **Birim:** `faturaKartiMetni`, `donusAdresi`, çizelge eşlemesi, rozet bağlantı seçimi, menü grupları/`ANA_MENU` değişmezliği.
- **Entegrasyon:** `siparisiHazirla` TEKLIF reddi · `topluHazirla` karışık seçim · `sevkiyatTakipDuzelt` (alanlar, pasif firma,
  değişmeyen → audit yok, diff, stok/cari hareket sayısı sabit) · Kargo KPI'da RED ayrımı · menü sayısı = onay listesi
  bekleyen toplamı · `saticiDonemTahsilatlari` (devir öncesi/sonrası, sahipsiz doktor, BAYI, iptal, toplam = KPI) · S6 satıcı görünürlüğü.
- **E2E:** onay ekranı "Karar Ver"; Kargo'dan fatura çapası; panelden Hazırlığa Al (aynı ekranda kalır); Kargo'da Teslim;
  takip düzeltme; satıcı tahsilat tablosu; OPERASYON'da onay menüsü/sayısı yok. Korunur: `kabul-senaryosu`,
  `seller/fatura-karti`.
- **Yetki:** `yetki.test.ts` `ACTION_YETKISI` → `updateShipmentTracking`, `topluHazirla` = `requireStaff`.
