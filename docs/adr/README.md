# ADR — Mimari Karar Kayıtları

<!-- Belge sınıfı: 4 · Kayıt (YOL_HARITASI.md §7.1-A) · Tetikleyici: mimari "nasıl" kararı verildiğinde -->

> Açılış: **15 Eylül 2026.** *(16.09.2026: ADR-005 eklendi.)* Konum: **`docs/adr/`** — bütün atıflar bu yola göre yazılıdır *(redaksiyon 18.09.2026: klasör kök dizinden `docs/` altına alındı, atıflar toplu güncellendi)*; Faz 1A **C0**'da git'e eklenir. Klasör `YOL_HARITASI.md` §1'de *"açılacak"* olarak duruyordu.
> Açılmasının sebebi, `FAZ1_UYGULAMA_KAPSAMI.md` §D.0'ın üç mimari karar üretmiş olmasıdır.
> Belge rejimi bunu iki yerde yasaklar:
> - §7.1-A: *plan bir karar üretemez.*
> - §7.1-B: *mimari seçim (nasıl) → `docs/adr/`, KARARLAR'a girmez.*
>
> Üç karar buraya taşındı; §D.0 artık yalnız atıf ve plan sonucu taşır.

---

## 1. Sınır kuralı — bir karar nereye yazılır?

KARARLAR §6'daki çıkış kalemi kuralı tek cümleyle koyar:

> *"Bir karar müşteriye, fiyata, sözleşmeye veya kapsama dokunuyorsa KARARLAR'a yazılır; yalnız
> 'nasıl' sorusuna cevap veriyorsa ADR'ye. ADR hiçbir koşulda KARARLAR'ı geçersiz kılmaz."*

Uygulamada soruları **sırayla** sor. İlk "evet" cevabı yeri belirler.

| # | Soru | Evet ise |
|---|---|---|
| 1 | Müşterinin gördüğü **davranışı**, **kapsamı**, **fiyatı** veya **sözleşmeyi** değiştiriyor mu? | `KARARLAR.md` |
| 2 | Şemaya bir **kavram** ekliyor ya da çıkarıyor mu? (KARARLAR §0.1 kolon testi) | `KARARLAR.md` |
| 3 | Bir **kabul kriteri** doğuruyor mu? (X-7 §(7)) | `KARARLAR.md` + `KABUL_KRITERLERI.md` |
| 4 | Yalnız *"aynı davranışı teknik olarak **nasıl** kuracağız?"* sorusuna mı cevap veriyor? | **`docs/adr/`** |
| 5 | Yalnız *"hangi sırayla?"* sorusuna mı cevap veriyor? | Plan dosyası (`FAZ1_UYGULAMA_KAPSAMI.md` §D) |

**Örnekler:**
- *"Oturum veritabanındadır, pasifleştirme anında etkilidir"* → **KARARLAR** E-2. Davranıştır; KVKK'ya bağlıdır.
- *"Oturum kimliği opak token, DB'de hash'i saklanır"* → **ADR-003**. Aynı davranışın mekanizmasıdır.
- *"Migration `CM`'den önce PRD taraması bitmeli"* → **§D**. Sıra kısıtıdır, mimari değil.
- *"Giriş denemesi tutan tablo açılmaz"* → **KARARLAR** X-9 (şema kavramı).
  *"Sayaç süreç belleğinde, süresi dolan anahtar temizlenir"* → **ADR-004**.
- *"Stok miktarı konum ve tarihle okunur"* → **KARARLAR** B-4 / A-4 / C-2.
  *"`Product.stock` kolonu kalkar, eşzamanlılık ürün satırı kilidiyle sıralanır"* → **ADR-005**.

---

## 2. Kurallar

1. **ADR, KARARLAR ile çelişemez.** Bir teknik seçim bir kararı değiştirmeyi gerektiriyorsa ADR
   yazılmaz. Soru `FAZ1_UYGULAMA_KAPSAMI.md` §C açık madde defterine yazılır ve KARARLAR'da
   kapatılır. Çelişki çözme sırası (`YOL_HARITASI.md` §7.1-D) ADR'yi **plan dosyalarıyla aynı
   seviyede, KARARLAR'ın altında** tutar.
2. **ADR değiştirilmez, yerine yenisi yazılır.**
   - Eski ADR'nin yalnız **Durum** satırı değişir: `Yerini aldı → ADR-NNN`.
   - Gövde dondurulur (Sınıf 4).
   - Yazım hatası düzeltmesi bu kuralın dışındadır.
3. **Plan dosyaları ADR'ye atıf yapar, metni kopyalamaz.** Aynı kararın iki yerde yaşaması
   `YOL_HARITASI.md` §7-6'nın uyardığı desendir.
4. **Uygulama ayrıntısı ADR'ye girmez.** Karar verildikten sonra açık kalan kalemler
   (`lastSeenAt` sıklığı, çerez bayrakları vb.) plan dosyasında yaşar. ADR onlara yalnız atıf
   yapar.
5. **Adlandırma:** `ADR-NNN-kisa-ad.md`, sıra numarası üç hanelidir ve **yeniden kullanılmaz**.
6. **Bakım:** karar başına ~15 dk (`YOL_HARITASI.md` §7.1-E).

---

## 3. Şablon

```markdown
# ADR-NNN — Başlık

- **Durum:** Kabul edildi | Yerini aldı → ADR-NNN | Geri çekildi
- **Tarih:** GG.AA.YYYY
- **Kaynak soru:** FAZ1_UYGULAMA_KAPSAMI.md §C-x
- **Bağlı KARARLAR maddeleri:** …

## Bağlam
## Karar
## Sonuçlar
## Değerlendirilen alternatifler
## Açık uygulama kalemleri (atıf)
## Geçerlilik sınırı
```

---

## 4. Dizin

| ADR | Başlık | Durum | Tarih | Kaynak |
|---|---|---|---|---|
| [ADR-001](./ADR-001-isimlendirme-rejimi.md) | İsimlendirme rejimi — karma | ✅ Kabul edildi | 15.09.2026 | §C-l |
| [ADR-002](./ADR-002-migration-fresh-init.md) | Migration stratejisi — fresh init | ✅ Kabul edildi | 15.09.2026 | §C-m |
| [ADR-003](./ADR-003-oturum-opak-token.md) | Oturum mekanizması — opak token, `next-auth` sökülür | ✅ Kabul edildi | 15.09.2026 | §C-g |
| [ADR-004](./ADR-004-giris-deneme-sayaci.md) | Giriş denemesi sınırı — bellek içi sayaç | ✅ Kabul edildi | 15.09.2026 | §C-p · KARARLAR X-9 |
| [ADR-005](./ADR-005-stok-miktari-turetilir.md) | Stok miktarı — saklanmaz, hareketlerden türetilir | ✅ Kabul edildi | 16.09.2026 | §C-x · KARARLAR B-4 |
