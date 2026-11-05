# Hesabım ekranı — özet kartları ve profil (tasarım spec'i)

> **Tarih:** 05.11.2026 · **Kaynak:** kullanıcı talebi (sohbet, 05.11.2026: "satıcı sayfaları için de aynı
> işlemleri uygula, KPI kartları ve frontend efektif olsun, gereksiz yere tekrar yüklenme durumları
> olmasın") · **Yol haritası:** Ü-34 (§7-5 gereği yazılır) · **Durum:** satıcı sayfalarının dördüncüsü ve sonuncusu;
> tek PR, spec onayı beklenmez.
>
> Bu belge **plan**dır, karar üretmez (`YOL_HARITASI.md` §7.1-A). Dayandığı kararlar X-13 (satıcı kapsamı), D-2 §(1)
> (satıcı kendi prim/hakedişini ekranda görür), X-14 §(2) (satıcıya özel prim oranı, yoksa varsayılan), FR-61
> (ortalama iskonto, tutar ağırlıklı), ADR-010 (KPI kartı, kart düzeyinde hata). Yeni karar yok.

## 1. Amaç

Hesabım, eski iki düz kutunun (doktor sayısı, ortalama iskonto) yerine satıcının portföy ve bu ay özetini öbür
ekranlarla **aynı sayılarla** göstersin; profilini ve uygulanan prim oranını yazsın.

**Başarı ölçütü:** Hesabım'daki her kart, tıklayınca açtığı ekrandaki kartla aynı sayıyı gösterir (e2e üç ekranla
karşılaştırır). Sayfanın okumaları tek turdadır.

## 2. Kapsam

| # | Kalem | Kaynak (ikinci hesap yolu yok) |
|---|---|---|
| 1 | **Doktorlarım** (birincil, anlık) → `/my-doctors` | `kapsamliDoktorlariGetir` sayımı = Doktorlarım'ın toplam kartı |
| 2 | **Bu ay siparişim** (teklif hariç) → `/my-orders` | `siparisKpileri(bu ay, satıcı kapsamı).toplam` = Siparişlerim'in Toplam kartı |
| 3 | **Bu ay cirom** (KDV hariç, geçen ayın aynı günleriyle, son 6 ay çizgisi) → `/my-report` | `ciroOzeti(satıcı kapsamı)` = Raporum'un Cirom'u |
| 4 | Profil: ad, e-posta, rol, prim oranım (özel ya da "varsayılan"), ortalama iskontom (bütün siparişler, iptal hariç) | `User.commissionRate` / `finance.primOraniVarsayilan`; `siparisToplami` |
| 5 | İskelet (KPI satırı kart kart eşleşir) | ADR-010 |

**Kapsam dışı:** parola değiştirme (yalnız geçici parola akışında, E-2 §(2)); profil düzenleme; vadesi geçmiş tutar
(X-6 §(7)).

## 3. Verimlilik

Eskiden iki okuma sırayla gidiyordu; şimdi beş okuma (kullanıcı, doktor sayısı, sipariş dağılımı, ciro özeti,
iskonto) tek `Promise.all` turundadır. Her kart `kpiGetir` ile kapsüllüdür; biri düşerse yalnız o kart "Yüklenemedi"
der. Ortalama iskonto tanımı (bütün siparişler) değişmedi; hesabı tek yoldan (`siparisToplami`) yapılır.

## 4. Test

- E2e (`e2e/seller/hesabim.spec.ts`): üç kart sırasıyla Doktorlarım, Siparişlerim, Raporum'daki kartla aynı;
  profilde e-posta, rol, prim oranı, ortalama iskonto; kart bağlantısı; kartlar taşmaz, iskelet eşleşir.
