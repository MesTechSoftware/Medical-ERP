> ⛔ ARŞİV. Bulgular: docs/DENETIM_BULGULARI.md

# Denetim Brifi — Adım 1 (KOD YAZMA)

> **Bu dosya Claude Code için talimattır.** Amaç: `medikal_satis_operasyon` kod tabanının,
> `PRD_V2.md`'de tanımlanan iş gereksinimlerini gerçekte ne kadar karşıladığını **ölçmek**.
>
> ## KESİN SINIR
> **Bu turda hiçbir üretim kodu yazma, değiştirme veya silme.** Test ekleme. Refactor yapma.
> Bulduğun hataları düzeltme — sadece **raporla**. Düzeltmeler ayrı bir turda, bu raporun
> çıktısına göre planlanacak.
>
> Yalnız iki dosya oluştur: `docs/DENETIM_BULGULARI.md` ve `docs/TRACEABILITY.md`.

---

## 0. Neden bu denetim var

`UYGULAMA_PLANI.md` (23 Temmuz) her fazın sonuna bir **doğrulama kapısı** koymuştu
(ör. "iki eşzamanlı sipariş yarıştırıldığında biri reddediliyor"). Kod tabanı tek migration
(`20260723175607_init_v2`) ile bir seferde üretildiği için bu kapıların ardışık olarak
koşturulmuş olması mümkün değil.

Ürün canlıya alınacak ve birden çok firmaya satılacak. Bu yüzden "çalışıyor görünüyor"
yetmez; **hangi iş kuralının hangi testle kanıtlandığı** belgelenmeli.

---

## 1. Çıktı 1 — `docs/TRACEABILITY.md` (izlenebilirlik matrisi)

`PRD_V2.md` içindeki **her FR maddesi** için bir satır üret:

| FR | Özet | Uygulandığı yer (dosya:satır) | Kanıtlayan test | Durum |
|----|------|-------------------------------|-----------------|-------|
| FR-01 | … | `src/app/(admin)/doctors/actions.ts:42` | `src/lib/doctor.test.ts:18` | KANITLI |

**Durum yalnız üç değerden biri olabilir:**

- `KANITLI` — kodda var **ve** davranışını doğrulayan bir birim/e2e testi var
- `TESTSIZ` — kodda var, ama davranışını doğrulayan test yok
- `YOK` — kodda karşılığı bulunamadı

**Kurallar:**
- Test "kod çalışıyor mu"yu değil, **FR'nin tarif ettiği davranışı** doğruluyorsa `KANITLI` yaz.
  Örn. "sipariş oluşturuluyor" testi FR-03'ü kanıtlamaz; "taban fiyat altındaki sipariş
  reddediliyor" kanıtlar.
- Emin olamadığın satırı `TESTSIZ` yaz, `KANITLI` yazma. Bu matrisin değeri kötümser olmasından gelir.
- Sonuna özet sayaç ekle: kaç KANITLI / kaç TESTSIZ / kaç YOK.
- Aynı matrisi PRD'deki **RULE-01…RULE-15** için de ayrı bir tabloda üret.

---

## 2. Çıktı 2 — `docs/DENETIM_BULGULARI.md`

Aşağıdaki 9 soruyu **sırayla** cevapla. Her cevap şu formatta olsun:

```
### D-0X — [soru başlığı]
**Bulgu:** [ne buldun — dosya:satır referanslı]
**Değerlendirme:** UYGUN | EKSİK | RİSKLİ
**Etki:** [canlıya alınırsa ne olur — somut, tek cümle]
**Öneri:** [ne yapılmalı — kod yazma, sadece tarif et]
```

---

### D-01 — RULE-12 anlam kaymış mı? (EN ÖNCELİKLİ)

`UYGULAMA_PLANI.md` §6:
> "**Tek transaction (RULE-12):** bir tahsilat kaydı → (a) mahsuplaşma, (b) doktor bakiyesi,
> (c) prim matrahı, (d) kongre EARN. Herhangi biri hata verirse hepsi geri alınır."

`PROJE_DURUMU.md`:
> "RULE-12 Sipariş + kalemler + stok düşümü + hareket tek transaction."

Diğer bütün kural numaraları iki dokümanda birebir aynı; yalnız 12 farklı.

**Cevapla:**
1. `PRD_V2.md`'de RULE-12 bugün ne diyor?
2. `src/app/(admin)/collections/actions.ts` → `recordCollection` içinde
   mahsuplaşma + doktor carisi etkisi + prim matrahı + `earnFromPayment` **tek bir
   `$transaction` içinde mi**? Sınırı dosya:satır ile göster.
3. Herhangi biri transaction dışındaysa: hangisi, ve orta noktada hata olursa ne yazılmış kalır?
4. Bu atomikliği doğrulayan bir test var mı? (transaction'ın ara adımını bilerek patlatan)

---

### D-02 — Yarış koşulları kanıtlı mı?

`UYGULAMA_PLANI.md` §11: *"Yarış testleri (kritik): eşzamanlı stok düşümü (RULE-01) ve
eşzamanlı kongre bakiyesi harcaması (RULE-09). Bunlar birim testle yakalanmaz."*

**Cevapla:**
1. Koşullu `updateMany` deseni gerçekten kullanılmış mı — RULE-01 ve RULE-09 için ayrı ayrı
   dosya:satır göster.
2. `count === 0` durumu her iki yerde de **hata olarak** ele alınmış mı, yoksa sessizce
   geçilen bir yol var mı?
3. Eşzamanlılığı test eden **herhangi** bir test var mı? (18 e2e spec + 10 birim test dosyasını tara)
4. Yoksa: nasıl bir test yazılmalı — tarif et, yazma.

---

### D-03 — Uçtan uca kabul senaryosu var mı?

`UYGULAMA_PLANI.md` §11 son satırı: *"PRD'nin sonundaki 15 adımlık örnek senaryo tek bir
E2E testi olarak yazılır."*

**Cevapla:**
1. `PRD_V2.md` sonundaki 15 adımlık senaryoyu listele.
2. 18 e2e spec dosyası içinde bu zinciri **tek akışta** koşan bir test var mı?
3. Yoksa: 15 adımın hangileri parça parça başka testlerde kapsanıyor, hangileri **hiç** kapsanmıyor?

---

### D-04 — Bakiye hesabı tek kaynaktan mı?

`UYGULAMA_PLANI.md` §6 "Yıkım" maddesi: `src/lib/cari.ts` **silinecekti**; dashboard'daki
inline yeniden hesaplama kaldırılacaktı (RULE-08: bakiye saklanmaz, hesaplanır — tek kaynak).

**Cevapla:**
1. `src/lib/cari.ts` silinmiş mi?
2. Doktor bakiyesi / bayi bakiyesi **kaç ayrı yerde** hesaplanıyor? Hepsini dosya:satır listele.
3. Birden fazla yerde hesaplanıyorsa formüller birebir aynı mı? (iptal edilen sipariş,
   KDV, mahsup edilmemiş tahsilat gibi kenar durumlarda ayrışıyor mu?)

---

### D-05 — Kongre expiry gerçekten çalışıyor mu?

`UYGULAMA_PLANI.md` §9: *"Expiry: gecelik job **+ okuma anında tembel (lazy) doğrulama**."*

**Cevapla:**
1. `scripts/expire-congress-balances.ts` ne yapıyor — `EXPIRE` kaydı üretiyor mu, idempotent mi
   (iki kez koşarsa çift kayıt yazar mı)?
2. Bu job'ı **zamanlayan** bir şey var mı? (cron, systemd timer, GitHub Actions schedule,
   docker-compose) — yoksa açıkça yaz.
3. Okuma anında lazy expiry doğrulaması var mı? Yani job hiç koşmazsa, süresi dolmuş bir bakiye
   bugün harcanabilir mi?
4. Rolling 12 ay + 29 Şubat → 28 kuralı hangi testle kanıtlanıyor?

---

### D-06 — Hata sınırları route group başına var mı?

`UYGULAMA_PLANI.md` 0.7: *"Kök **+ her route group için** `error.tsx`, `loading.tsx`, `not-found.tsx`"*
`PROJE_DURUMU.md`: *"kök seviyede mevcut"*

**Cevapla:**
1. Hangi route group'larda var, hangilerinde yok? Tam liste.
2. `(dealer)` içinde bir server action hata fırlatırsa kullanıcı ne görüyor — bayi bağlamını
   koruyan bir sayfa mı, jenerik kök hata sayfası mı?

---

### D-07 — Faz F tamamlanmış mı?

`UYGULAMA_PLANI.md` §10 dört rapor ve dashboard'da **"açık kongre bakiyesi toplamı
(potansiyel yükümlülük)"** istiyordu. `PROJE_DURUMU.md` üç rapor sayıyor.

**Cevapla:**
1. Hangi raporlar var, hangileri yok? Özellikle **kanal karşılaştırma** (satıcı vs bayi) raporu var mı?
2. Admin dashboard'da açık kongre bakiyesi toplamı gösteriliyor mu? (Bu bir **yükümlülük**
   kalemi — firma sahibinin görmek isteyeceği ilk sayılardan biri.)
3. Satıcı dashboard'ında planda geçen kalemler (tahsilat/prim ilerlemesi, gecikmeler,
   ortalama iskonto) var mı?

---

### D-08 — KDV dahil/hariç toggle kapsamı

`UYGULAMA_PLANI.md` §5: *"**Tüm** fiyat girişi ve listelerde 'KDV Dahil / KDV Hariç' seçeneği;
tercih hatırlanır (çerez)."*

**Cevapla:**
1. Toggle hangi ekranlarda var, hangilerinde yok?
2. Tercih çerezle hatırlanıyor mu, yoksa her sayfada sıfırlanıyor mu?
3. Σ kalem = sipariş toplamı kuralını kanıtlayan birim test hangisi? (dosya:satır)

---

### D-09 — Faz A kenar durumları

**Cevapla:**
1. `Doctor.phoneNormalized` şemada gerçekten `@unique` mi? `normalizePhone()` hangi girdilerde
   ne döndürüyor — boş/null telefon unique kısıtını deler mi?
2. Doktor devri (`DoctorAssignment`) `createAuditLog` yazıyor mu?
3. Devir sonrası **eski siparişler eski satıcıda kalıyor mu**, yoksa prim/rapor hesabında
   yeni satıcıya mı geçiyor? Bu davranışı kanıtlayan test var mı?

---

## 3. Rapor sonu — özet

`docs/DENETIM_BULGULARI.md` sonuna şunları ekle:

1. **Canlıya alma blokörleri** — hangi bulgular gerçek veri girmeden önce mutlaka çözülmeli
   (öncelik sırasıyla, her biri tek satır gerekçeyle)
2. **Sessiz finansal risk taşıyanlar** — yanlış çalışsa bile hata vermeyip yanlış rakam
   üretecek olanlar (bunlar en tehlikelileri)
3. **Sonraya bırakılabilirler**
4. **Denetim sırasında fark ettiğin, bu brifte sorulmayan bulgular** — özellikle para,
   yetki (IDOR), transaction sınırı ve audit kapsamı ile ilgili olanlar

---

## 4. Çalışma disiplini

- **Kod yazma, değiştirme, silme. Test ekleme.** Sadece oku ve raporla.
- Her iddiayı `dosya:satır` ile destekle. Referanssız cümle yazma.
- Emin olamadığın yerde tahmin etme — "doğrulanamadı, şu dosya elle incelenmeli" yaz.
- Bir soru sorduğun şey kod tabanında **yoksa**, "yok" demek geçerli ve değerli bir cevaptır;
  kibarlaştırma.
- Rapor Türkçe, kod referansları orijinal haliyle.
