# Demo öncesi revizyon — tasarım spec'i

> **Tarih:** 24.11.2026 · **Kaynak:** ürün sahibi kararı (sohbet, 24.11.2026) · **Yol haritası:** Ü-39 ·
> **Dal:** `revize/demo-oncesi-is-akisi` · **Durum:** kapsam donduruldu; ürün sahibi Paket 1'de ayrıca onay
> beklenmeden otonom ilerlemeyi istedi.
>
> Bu belge **plan**dır, karar üretmez (`YOL_HARITASI.md` §7.1-A). **Tek yetkili kaynak:**
> `2026-11-24-demo-oncesi-revizyon-karar-ozeti.md` — kararlar oradan birebir alınır, burada yeniden türetilmez.
> Resmî kayıt Paket 1'de `KARARLAR.md` eklerine, `KABUL_KRITERLERI.md` satırlarına ve ADR-013'e girer.

## 1. Amaç

Canlı demo öncesi iş akışı boşluklarını (fiyat/iskonto, kalanı kapatma, risk/vade bilgisi, öksüz onay,
pasif doktor, denetim kapsamı, ürün silme, tahsilat doğrulaması), marka/parola yapılandırmasını, demo
verisini ve görsel cilayı tek revizyonda kapatmak.

**Başarı ölçütü:** karar özetindeki on altı paket ayrı commit'lerle biter; birim, entegrasyon, e2e ve
production build yeşildir; `npm run izlenebilirlik` temiz çalışır.

## 2. Kapsam

Kapsam, karar özeti §2–§5'tir (A-10, A-3, A-12, A-8, A-4, X-18, D-2, C-3, tahsilat, E-2, K-4 §(6)-(k),
sekme sayıları, görsel cila). Özetin **§0 düzeltmeleri (D1–D4)** ve iki ek netleştirme bağlayıcıdır:

- **A-3:** "Kalanı kapatma, X-6'daki kalem kapatma (tahsilat-borç eşleştirmesi) değildir; yalnız açık sipariş
  miktarını düşürür." (Paket 1 KARARLAR ekine girer.)
- **Paket 16 stok ekranı:** Stok Girişi, Stok Düzeltme, Konsinye Çıkış **ve Depoya Transfer** — dördü de aksiyon
  butonu + `YanPanel` ile açılır; sayfada tek başına sıkışmış form kalmaz.

Kapsam dışı: karar özeti §7 (Aşama 2, Aşama 3, reddedilen, gündem, yazılmayacaklar).

## 3. Değişmezler

- **ADR-012 kilit sırası:** doktor → ürün → `BelgeSayac` → (commit) denetim zinciri. `Order` satırına
  `FOR UPDATE` alınmaz; `pg_advisory` yalnız migration tetikleyicisindedir; yeni kilit kaynağı yok.
- Para `Decimal`, tek çağrı noktası; `yetki.test.ts`, `anti-sema.itest.ts`, `tasarim.test.ts`, `kpi.test.ts`
  kurallarına uyulur.
- D1: pasif doktora yeni konsinye çıkışı SERT `DOKTOR_PASIF`; pasif doktordan depoya transfer **açık** (regresyon testi).
- D2: `ISKONTO_TAVANI` mekanizması kurulur ve testlenir; `policy.pricing.iskontoTavani` varsayılanı `null`.
- `docker-compose.yml` commit'e girmez; commit mesajlarında imza yok; `TRACEABILITY.md` elle düzenlenmez;
  demo verisinde toksin ve gerçek marka adı yok; uzak demo sunucusuna dokunulmaz.

## 4. Paket sırası ve doğrulama

`0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 15 → 16 → 13 → 14`. Her paket: kabul kriteri → test →
kod → ilgili testler → ayrı commit. Ayrıntı: `../plans/2026-11-24-demo-oncesi-revizyon.md`.

## 5. Riskler

1. Migration'lar (`closedQuantity`, `CHECK`) mevcut veriyle çakışabilir → varsayılanlar güvenli (`0`), `CHECK` demo/seed verisinde sınanır.
2. Sekme sayısı kararı `KpiSatiri` 6 kart dalını ve `kpi.test.ts` istisnasını siler; Genel Bakış eşitliği korunur.
3. Windows'ta yol ayracı (Paket 0) izlenebilirlik üretiminin ön koşuludur.
