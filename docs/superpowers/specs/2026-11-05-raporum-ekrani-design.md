# Raporum ekranı — İadem kartı, doktorlarıma göre cirom (tasarım spec'i)

> **Tarih:** 05.11.2026 · **Kaynak:** kullanıcı talebi (sohbet, 05.11.2026: "satıcı sayfaları için de aynı
> işlemleri uygula, KPI kartları ve frontend efektif olsun, gereksiz yere tekrar yüklenme durumları
> olmasın") · **Yol haritası:** Ü-33 (§7-5 gereği yazılır) · **Durum:** satıcı sayfalarının üçüncüsü; tek PR,
> spec onayı beklenmez.
>
> Bu belge **plan**dır, karar üretmez (`YOL_HARITASI.md` §7.1-A). Dayandığı kararlar X-1 (dönem cirosu, hakediş,
> iade tarihinde düşer; §(8) satıcı yalnız kendi satırı — kısıt sorguda), X-13 (ciro ve hakediş siparişin
> satıcısına yazılır, sonra değişmez), D-2 §(1) / D-5 §(4) (satıcı primini ekranda görür, dosya indirmez),
> ADR-010 (en çok 4 kart). Yeni karar yok.

## 1. Amaç

Raporum satıcıya dönemde nereden ciro yaptığını da göstersin: Cirom, Hakedişim, Tahsilatım kartlarının yanında
İadem; altında satıcının kendi satırı ve **doktorlarına göre cirosu** — Raporlar'ın doktor ciro sıralamasının
(Ü-27) satıcı kapsamlı hâli.

**Başarı ölçütü:** satıcı dönemi seçer, hangi doktorun cirosunun en yüksek olduğunu sıra ve lidere göre
çubukla görür; adla arar, dönemi değiştirince araması korunur; gezinmede sayfa yeniden yüklenmez.

## 2. Kapsam

| # | Kalem | Dayanak |
|---|---|---|
| 1 | 4. kart **İadem** (dönemde iade edilen matrah, karşılaştırmalı) — Cirom'un okumasından (`ciroOzeti` `iade`), ek sorgu yok | X-1 · ADR-010 |
| 2 | **Doktorlarıma Göre Cirom**: dönemde satıcının cirosu olan bütün cariler, sıra, ciro (KDV hariç), lidere göre çubuk; sayfalı | X-1-3 · Ü-27 |
| 3 | Filtrele: doktor adı (Türkçe I/ı katlamalı); dönem seçici aramayı korur, arama dönemi korur | Ü-27 §3.3 |
| 4 | Ad, cari bugün de satıcının portföyündeyse Doktorlarım panelini açar | Ü-32 |
| 5 | İskelet 4 kartla | ADR-010 |

**Kapsam dışı:** satıcı süzgeci (ekranda yok; adreste kalmışsa düşer); sütun seçici (tek gizlenebilir sütun
olurdu); dosya indirme (D-5 §(4)).

## 3. Kapsam kuralı

- `getDoctorReports(donem, limit, kapsam)` ve `doktorSiralamasi(aralik, s, sayfa, kapsam)` **zorunlu** `KpiKapsami`
  alır (KPI'larla aynı tip). Satıcı kapsamında sevk ve iade satırları yalnız o satıcının siparişlerinindir; cari
  listesi o satıcının sipariş girdiği carilerdir. Devirle portföyden çıkmış carinin o satıcıyla cirosu satıcıda
  kalır (X-13); başka satıcının aynı cariye siparişi girmez.
- Sıra ve lidere oran kapsamın içindeki dönem sırasıdır.

## 4. Verimlilik

Sayfanın dört okuması (satıcı satırı, ciro özeti, tahsilat, sıralama) tek `Promise.all` turundadır; İadem
ek okuma yapmaz; satıcı kapsamında cari listesi bütün carileri değil yalnız satıcının carilerini okur. Arama,
sayfalama ve dönem `next/form` / `Link` ile istemci tarafında gezer.

## 5. Test

- Birim: adres ve etiket `/my-report` yazar, dönemi korur.
- Entegrasyon: satıcı kapsamında ciro yalnız kendi siparişlerinden; devredilmiş cari dahil; başka satıcının
  aynı cariye siparişi hariç; sıra/oran kendi içinde; şirket kapsamı toplamdır.
- E2e (`e2e/seller/report.spec.ts`): 4 kart, sıralama satırlı ve sıralı; arama yumuşak gezinme, dönemle
  korunur; adresteki satıcı düşer; iskelet eşleşir; mevcut kendi-satırı testleri ilk tabloya daraltıldı.
