# Teknik borç turu — ortak yardımcılar, sorgu performansı, küçük düzeltmeler, istemci paneli (tasarım spec'i)

> **Tarih:** 05.11.2026 · **Kaynak:** kullanıcı talebi (sohbet, 05.11.2026: "ertelenen küçük işleri ve performans
> iyileştirmelerini yap temiz, esnek, ölçeklenebilir kod istiyorum") · **Yol haritası:** Ü-35 (§7-5 gereği yazılır) ·
> **Durum:** dört PR, sırayla; spec onayı beklenmez (kullanıcı üç kapsam sorusunu sohbette cevapladı).
>
> Bu belge **plan**dır, karar üretmez (`YOL_HARITASI.md` §7.1-A). Girdisi `MD_files/DEVAM_PROMPTU.md`'nin Ü-23…Ü-34
> "ertelenen küçük işler" satırlarıdır.

## 1. Amaç

Sayfa modernizasyonu (Ü-18…Ü-34) boyunca ekran ekran kopyalanan kodu tek yere toplamak, ertelenen sorgu
verimsizliklerini kapatmak, küçük tutarsızlıkları düzeltmek ve yan panelin açılıp kapanmasında liste ile KPI
sorgularının yeniden koşmasını kaldırmak.

**Başarı ölçütü:** davranış değişikliği yalnız §3 ve §4'te yazılanlardır; birim, entegrasyon ve e2e testleri her PR'da
yeşildir. Yeni sütunlu liste ekranı bir kayıt satırı ve bir yetki satırı ekleyerek sütun seçici kazanır. Yan panel
aç/kapa liste ya da KPI sorgusu koşturmaz (e2e ölçer).

## 2. PR 1 — ortak yardımcılar (davranış değişmez)

| Kopya | Tek yer |
|---|---|
| 14 `sutunEylemi.ts` | `lib/liste/sutun-eylemi.ts` (tek server action, ekranın yoluyla anahtarlı yetki tablosu) + `lib/liste/sutun-listeleri.ts` (saf kayıt: yol → sütunlar, çerez) + `lib/liste/sutun-tercihi.ts` (`gizliSutunlar(yol)`) |
| 14 sayfada sayfalama/`yer`/sayfa dışı yönlendirme/`sayfaParametreleri` | `lib/liste/sayfa.ts` (`sayfaCoz`, `sayfaDisi`, `sayfalamaParametreleri`) + `components/liste/ListeSayfalama.tsx` |
| 12 yan panelin kabuğu ve `Satir`/`Bolum`/`Yok` | `components/panel/Panel.tsx` (`Panel`, `PanelBolumu`, `PanelSatiri`, `Yok`) |
| 9 süzgeç çubuğunda `Alan` + `ETIKET` | `components/liste/SuzgecAlani.tsx` |
| 13 KPI kartı bağlantı sınıfı, 10 metin bağlantısı sınıfı | `components/stil.ts` (`KPI_BAGLANTISI`, `BAGLANTI`) |
| `SESSIZ_SECENEKLERI` (2) | `lib/doktor-listesi/suzgec.ts` (adres doğrulaması da bu listeden) |
| `gunleriAraliga` sipariş sorgusundan 6 modüle | `lib/liste/parametreler.ts` |
| `donemParametresi` ↔ `donemCoz` | `donem.ts` `donemAnahtari` |
| `OnayKurali` ↔ `BlokKuralKodu`/`BLOK_KURAL_ADI` | `BlokKuralKodu`; süzgecin seçenekleri `BLOK_KURAL_ADI`'dan |
| `kpiGetir` toplu kargoda | nötr `lib/hata-kapsulu.ts` `hataKapsulu`; `kpiGetir` KPI çağrılarında takma ad |

Görünür etkiler: geçersiz `page`/`per` (harf, sıfır, ondalık, taşan sayı) yok sayılır — sayfa 1'e, boy varsayılana
düşer ve bağlantılara yazılmaz (önceden `parseInt` baştaki sayıyı alıyor, `per` bağlantılara yazılıyordu; ertelenen iş
Ü-27). Panellerin rozet ve alt bilgi satırı tek sınıf kümesini kullanır, panellerdeki sipariş bağlantıları ortak bağlantı
stilindedir, eylemsiz panelde alt bilgi şeridi çizilmez.

## 3. PR 2 — sorgu performansı

Ertelenen işlerden sorgu sayısını, belleğe okunan satırı ya da sıralı bekleyişi azaltanlar: aynı veriyi iki kez
okuyan yollar (Raporum ciro özeti ve sıralaması; satıcı doktor panelinde bakiye), bellekte toplanan geçmiş (Hesabım
ortalama iskontosu, Raporlar dönem cirosu) SQL toplamına iner; liste sayımının çift koşusu (Tahsilatlar), KPI
sayımlarının birleştirilmesi (Onay, İçe Aktarım), boş `IN` listelerinin atlanması, onay metin aramasının alt sorguya
inmesi, sipariş listesinin iade adetlerini okumaması, bozuk adreste yönlendirmenin sorgulardan önce yapılması, sayfa
dışı yönlendirmede panel sorgusunun koşmaması, kargo KPI'larının bekleyenlerle aynı turda başlaması, denetim
KPI'larının imleç gezintisinde koşmaması. Her kalem için önce sonuç eşitliği testi (eski ve yeni yol aynı sayıyı
verir), sonra değişiklik.

**Bu turda yapılmayanlar (YOL_HARITASI Ü-38):** İçe Aktarım'ın dört KPI sayımı (tek sorguya inmesi "kart = satır" tek
koşulunu bozar; tablo küçük) · Denetim KPI'larının imleç gezintisinde koşması (önbellek ister) · sayfa dışı
yönlendirmede panel sorgusu (paralel okumanın nadir yoldaki bedeli) · Raporlar dönem cirosunun bellekte hesaplanması
(okuma tekleşti; SQL toplamı ikinci hesap yolu olur — KARARLAR §0.4, ancak karar değişikliğiyle).

## 4. PR 3 — küçük düzeltmeler (davranış)

- Doktorlar ve Doktorlarım "Sipariş" sütunu **sayılan siparişleri** sayar (teklif ve iptal hariç, A-5) — kullanıcı
  kararı 05.11.2026.
- Sekme ve süzgeç etiketi bağlantıları adresteki geçerli `per`'i taşır (ortak bileşenler `perEkle` ile; KPI kartı
  bağlantıları süzgeci baştan kurduğu için taşımaz); Raporlar'da dönem değişince `per` korunur.
- Sipariş durum sekmesi ile rozet aynı metni kullanır; dashboard şeridi teklifi saymaz ve onay sayımını `onayKosulu`
  ile yapar; KPI notu "Bu ay" aralığını adıyla yazar.
- Gerekçe uzunluğu: bütün gerekçe isteyen akışlarda tek sınır (`GEREKCE_AZAMI` = 500, `gerekceHatasi` →
  `GEREKCE_UZUN`; formlarda `maxLength`) — yalnız tahsilat iptaline koymak akışlar arasında tutarsızlık olurdu.
- Tahsilat: yalnız iptal edilmiş tahsilat varken boş durum bunu söyler ve iptal edilenlere götürür; iptal onay metni
  gerçek etkiyi (ters kayıt) yazar.
- Kargo: kısmi sevk sonrası sevkiyat listesinin süzgeçleri korunur; toplu kargo üst sonucu satır sonuçlarından
  türer (`topluUstSonuc`); bilinmeyen/pasif firma sevkiyatta (`KARGO_FIRMASI_GECERSIZ`) ve toplu işlemde bir kez reddedilir.
- Denetim boş satırı görünür sütun sayısına yayılır; Dışa Aktarım kısayolları günü istek anında hesaplar; Hesabım
  profil iskeleti tanım listesi biçimindedir.

## 5. PR 4 — istemci paneli

Satırdaki Detay bağlantısı adresi `history.pushState` ile günceller (Next yönlendiricisi `useSearchParams` ile eşler,
sunucuya gidilmez); panel verisi ekranın tek sunucu eyleminden (`panelGetir`) gelir ve sunucu bileşeni olarak çizilir.
Kapat/Esc/arka plan `replaceState` ile kapatır. Doğrudan `?detay=` adresi, JS'siz kullanım ve paneldeki işlemlerin
sonrası (yönlendirme ya da yenileme) bugünkü gibi sunucuda çizilir. Ortak parçalar: `ListePaneli` (istemci yuvası,
bayat yanıtı yok sayar, yüklenirken panel iskeleti), `PanelBaglantisi`.

## 6. Kapsam dışı (YOL_HARITASI'na kayıt)

Kullanıcı bu turda istemedi (05.11.2026): Türkçe aramanın veritabanında çözümü (pg_trgm + normalize kolon), kargo
firması tanım ekranı (13-A — Ü-1'in parçası), `ApprovalBlock` karar/zaman indeksleri.

## 7. Test

Her PR: birim + entegrasyon + e2e yerelde, sonra CI. PR 1 için yeni birim testleri: sütun kaydı (yollar gerçek sayfa,
çerez adları tekil), yetki tablosu sayfa guard'ıyla aynı, `sayfaCoz`/`sayfaDisi`/`sayfalamaParametreleri`,
`gunleriAraliga`, `donemAnahtari`. PR 2: eski/yeni sonuç eşitliği entegrasyon testleri. PR 4: e2e panel aç/kapa
sırasında liste RSC isteği yok, geri tuşu paneli kapatır, doğrudan adres paneli açar.
