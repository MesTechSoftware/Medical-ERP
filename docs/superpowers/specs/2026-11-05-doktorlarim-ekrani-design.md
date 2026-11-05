# Doktorlarım ekranı — KPI, süzgeç, sütun seçici, yan panel (tasarım spec'i)

> **Tarih:** 05.11.2026 · **Kaynak:** kullanıcı talebi (sohbet, 05.11.2026: "satıcı sayfaları için de aynı
> işlemleri uygula, KPI kartları ve frontend efektif olsun, gereksiz yere tekrar yüklenme durumları
> olmasın") · **Yol haritası:** Ü-32 (§7-5 gereği yazılır) · **Durum:** satıcı sayfalarının ikincisi; tek PR,
> spec onayı beklenmez.
>
> Bu belge **plan**dır, karar üretmez (`YOL_HARITASI.md` §7.1-A). Dayandığı kararlar X-13 (satıcı yalnız kendi
> `DOKTOR` carileri; tek kapsam fonksiyonu `kapsamliDoktorlariGetir` — D-2 §(3)), X-6 §(6)/(7) (doktor kartında
> bakiye ve "vadesi geçmiş hareket var" uyarısı; tutar gösterilmez), K-2 (bakiye yön etiketiyle), A-12 (risk
> bilgi kademesi), A-5-7 (son sipariş = sayılan sipariş), ADR-010 madde 2 (en çok 4 kart). Yeni karar yok.

## 1. Amaç

`/my-doctors` satıcıya portföyünü tek bakışta göstersin: kaç doktoru var, kaçı aktif, kaçına 90 gündür
sipariş girilmedi, kaçına hiç girilmedi. Liste durum, bölge ve son siparişle süzülsün; doktorun bakiyesi,
riski ve satıcının ona girdiği son siparişler listeden ayrılmadan görülsün. Ekran yönetici Doktorlar
ekranının (Ü-18) satıcı kapsamlı hâlidir — aynı süzgeç ve sorgu modülü (`doktor-listesi`), ikinci hesap yolu yok.

**Başarı ölçütü:** satıcı "Hiç siparişi yok" kartına tıklar, kartın sayısı kadar doktor görür; birini açar,
bakiyesini yön etiketiyle ve son siparişlerini görür; siparişe tıklayınca Siparişlerim paneli açılır. Panel
aç/kapa sayfayı yeniden yüklemez, KPI satırı yerinde kalır.

## 2. Kapsam

| # | Kalem | Dayanak |
|---|---|---|
| 1 | KPI (anlık): Doktorlarım (birincil) · Aktif · 90+ gündür siparişsiz · Hiç siparişi yok — her kart kendi süzgecini açar, kart = satır | ADR-010 · X-13-4 |
| 2 | Sekmeler: Tümü · Aktif · Pasif + etkin süzgeç etiketleri | ortak `HizliSekmeler` |
| 3 | Filtrele: bölge (yalnız kendi carilerinin bölgeleri), durum, son sipariş (hazır seçim ya da gün aralığı) — sınıf, satıcı, fatura yok | X-13 · A-5-7 |
| 4 | Tablo: ad (paneli açar), klinik / bölge, telefon, sipariş, son sipariş, bakiye (KDV dahil, yön etiketi), durum rozetleri, Düzenle | Ü-18 §3.3 · K-2 |
| 5 | Sütun seçici (çerez `doktorlarim-sutunlar`, yol `/my-doctors`), sayfalama, boş durum, iskelet | ortak bileşenler |
| 6 | Yan panel: kimlik ve iletişim, cari özeti (bakiye, açık sipariş, risk / limit), vade uyarısı, son siparişlerim (Siparişlerim panelini açar), Düzenle | X-6 §(6) · A-12 |
| 7 | Siparişlerim panelinde cari adı Doktorlarım panelini açar | Ü-31 §2 (bu ekrana bırakılmıştı) |

**Kapsam dışı:** doktor ekleme/düzenleme formları değişmez. Cari hareket listesi ve devir geçmişi yönetici
panelindedir. Panelden sipariş açma (doktoru seçili form) ayrı iştir.

## 3. Kapsam kuralı (X-13)

- `doktorListesi(s, sayfa, kapsam, an)` — `kapsam` **zorunludur** ve `kapsamliDoktorlariGetir(kullanici)`'nın
  çıktısıdır (yöneticide `{}`); süzgeçle `AND` içinde birleşir. Varsayılanı yoktur: unutulan kapsam
  "herkes"e düşmesin (Ü-31 incelemesinin dersi).
- Kartlar (`saticiDoktorKpileri`) her kartın süzgecini aynı koşul ve kapsamla sayar — kart = satır.
- Bölge seçenekleri (`doktorBolgeleri`) yalnız kapsamdaki carilerdendir.
- Panel (`saticiDoktorPaneli`) önce kimliği kapsamla okur; kapsam dışıysa `null` döner ve öbür okumalar hiç
  koşmaz. "Son siparişlerim" yalnız bu satıcının o doktora girdiği siparişlerdir (devir öncesi başka satıcının
  siparişi görünmez).
- Adresteki sınıf, satıcı, fatura (ve eski `sahip`) süzgeci sorgulardan önce yönlendirmeyle adresten düşer.

## 4. Verimlilik

Siparişlerim (Ü-31 §4) ile aynı desen: bütün gezinmeler istemci tarafında (`Link`, `next/form`, panel
`scroll={false}`), sayfanın dört okuması (liste, KPI, bölgeler, panel) tek `Promise.all` turunda; panel
kapsam dışı kimlikte ek sorgu koşturmaz; alt sayfalar (`new`, `[id]/edit`) genel iskeleti gösterir. E2e,
panel aç/kapada KPI düğümünün korunduğunu ve tam yükleme olmadığını ölçer.

## 5. Test

- Birim: adres ve etiketler `/my-doctors` yazar; satıcı süzgeci sınıf/satıcı/faturayı düşürür; dört kartın adresi.
- Entegrasyon: liste, kartlar, bölgeler, panel yalnız satıcının `DOKTOR` carileri; satıcı süzgeci kapsamı
  genişletemez; kart = süzgecin satırı; panelde yalnız satıcının kendi siparişleri; başka carinin paneli `null`.
- E2e (`e2e/seller/doktorlarim.spec.ts`): 4 kart, satırlar kimlikle denetlenir, kart = satır; Filtrele'de
  yönetici alanları yok; adresteki satıcı düşer; başka carinin paneli açılmaz; panel aç/kapa yumuşak ve DOM
  korunur; panel ↔ Siparişlerim paneli geçişi; sütun seçici; kartlar taşmaz, iskelet eşleşir.
