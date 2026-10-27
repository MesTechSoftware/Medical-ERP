# ADR-011 — Denetim kaydı: değişmez tablo, commit anında SHA-256 zinciri, istek bağlamı

- **Durum:** ✅ Kabul edildi
- **Tarih:** 27.10.2026
- **Kaynak soru:** Kullanıcı talebi (27.10.2026) · KARARLAR **X-18** (§5.21)
- **Bağlı KARARLAR maddeleri:** **X-18** · C-3 §(1)/(4) · A-13 §(7) · X-3 §(4) (denetim kaydı işle aynı transaction'da) · E-1 (zaman) · E-2 (oturum) · D-2 · X-5 eki (türev istisnası X-18 §(4)'te)
- **İlgili ADR:** `ADR-012` (kilit sırası — zincir kilidinin yeri) · `ADR-003` (oturum, route handler yok) · `ADR-001` (adlar) · `ADR-009` (rozet renkleri)
- **Uygulandığı commit:** tasarım 3 D1 (şema, yazım yolu, zincir) · D2 (ekran)

## Bağlam

X-18 kaydın yazıldığı anda donmasını, zincirle mühürlenmesini ve bağlam taşımasını istiyor. Üç teknik
soru doğuyor:

1. **Değişmezlik nerede zorlanır?** Uygulama katmanı tek başına yetmez: bugün bir seed
   (`prisma/demo-gecmis.ts`) denetim kaydına `UPDATE` atıyor; test kurulumu ve demo seed tabloyu
   `TRUNCATE` ediyor.
2. **Zincir nasıl kurulur?** Zincir sıralıdır: her mühür bir öncekini okur ve bu bir kilit ister.
   Denetim kaydı ise iş transaction'ının **ortasında** yazılır (X-3 §(4)); içe aktarım tek
   transaction'da yüzlerce kaydı doktor, ürün ve sayaç kilitleriyle iç içe yazar. Kilit yazım anında
   alınırsa ADR-008'in "en çok paylaşılan kaynak en son alınır" kuralı çiğnenir ve döngü doğar.
3. **Bağlam nereden okunur?** Uygulamada route handler yok (ADR-003); her yazma bir server action'dır
   ve yazıcı (`createAuditLog`) otuzdan fazla noktadan, istek nesnesi olmadan çağrılır.

## Karar

1. **İki tablo.** `AuditLog` kaydın kendisidir; `AuditLogSeal` onun mührüdür (`logId` PK ve FK,
   `chainIndex` benzersiz, `prevHash`, `hash`). Mühür ayrı tablodadır: kayıt satırı **hiçbir
   koşulda** `UPDATE` görmez, mühür bir kez yazılır.
2. **Değişmezlik veritabanındadır.** İki tabloda da `BEFORE UPDATE OR DELETE` (satır) ve
   `BEFORE TRUNCATE` (cümle) tetikleyicisi `denetim_degismez()` hata atar: *"Denetim kaydı
   değiştirilemez ve silinemez"*. `AuditLog.actor` ilişkisi `onDelete: Restrict`'tir; kullanıcıyı
   silmek kaydı boşa düşürmek, yani bir `UPDATE` olurdu (kullanıcı zaten silinmez, E-2).
3. **Zincir commit anında, veritabanında kurulur.** `denetim_muhurle()` bir
   `CONSTRAINT TRIGGER … AFTER INSERT … DEFERRABLE INITIALLY DEFERRED`'dır. Commit anında:
   - `pg_advisory_xact_lock` ile zincir kilidini alır; kilit commit'le bırakılır;
   - son mührü okur, `hash = sha256(prevHash ‖ kanonik(kayıt))` hesaplar;
   - `chainIndex = son + 1` ile mührü yazar.

   Kilit iş kilitlerinin hepsinden sonra alınır (sıra ADR-012'dedir). Geri alınan transaction'ın
   ertelenmiş tetikleyicisi hiç çalışmaz: ne kayıt ne mühür kalır.
4. **Kanonik biçim** — `denetim_kanonik(r)`; TS ikizi `src/lib/denetim/zincir.ts`:
   - Alanlar sabit sırayla dizilir: `id, seq, createdAt, actorId, actorRole, action, actionType,
     module, entityType, entityId, beforeData, afterData, changes, reason, ipAddress, sessionId,
     requestMethod, endpoint`.
   - Her alan `<UTF-8 bayt uzunluğu>:<değer>` biçimindedir; boş alan `~`'dir. Ayraç ve kaçış yoktur:
     uzunluk öneki belirsizliği kaldırır.
   - Zaman `YYYY-MM-DDTHH:MI:SS.mmmZ` (UTC), JS `toISOString()` ile aynı biçimdedir.
   - İki uygulamanın eşitliği entegrasyon testindedir.
5. **Doğrulama uygulamadadır** (`zincir.ts`): kayıt başına (özet + önceki mühürle bağ) ve zincir
   boyunca. `npm run denetim:dogrula` (`scripts/denetim-dogrula.ts`) zinciri 1000'lik partilerle
   okur; bozulmada çıkış kodu 1 verir ve son özeti yazdırır (dış çapa için, X-18 §(2)).
6. **Sıra ve sayfalama.** `seq` (`autoincrement`, benzersiz) yazım sırasıdır; liste `seq` ile keyset
   sayfalanır. `createdAt` varsayılanı `clock_timestamp()`'tır: transaction başlangıcı değil, yazım
   anı. Böylece `seq` ile aynı yönde ilerler. Zincir sırası (`chainIndex`) commit sırasıdır; ikisi
   aynı olmak zorunda değildir.
7. **Kimlik** Prisma tarafında `uuid(7)`'dir (zaman sıralı UUID). Eski kayıtların kimliği yeniden
   yazılmaz.
8. **Bağlam** (`src/lib/denetim/baglam.ts`):
   - `headers()` istekte okunur. İstek dışında (seed, test, betik) Next hata atar; bağlam boş kalır.
   - **IP:** `x-forwarded-for`'un en sağdaki girdisi, yani en yakın atlamanın eklediği adres. Next,
     başlık yoksa soket adresini yazar (`base-server`: `??=`).
   - **Yöntem:** `next-action` başlığı varsa `POST` (server action). **Uç:** `Referer`'ın yolu; sorgu
     dizesi atılır.
   - **Oturum:** `getSession()`'ın oturum numarası (istek başına önbellekli). Girişte oturum denetim
     kaydıyla aynı transaction'da açıldığı için numara çağıran tarafından verilir.
9. **Maskeleme ve fark yazım anındadır** (`maske.ts`, `fark.ts`). Fark ham değerden kurulur, sonra
   maskelenir; önceki ve sonraki hâl maskelenmiş yazılır.
10. **Sınıflandırma** `src/lib/denetim/olaylar.ts`'teki tek tablodandır. Eski satırlar migration'daki
    `CASE` ile doldurulur; iki tablonun eşitliği kaynak taraması testindedir.
11. **Bakım yolu: `SET LOCAL session_replication_role = replica`.** Süper kullanıcı ister ve
    tetikleyicileri kapatır. Yalnız şu üç yer kullanır:
    - `test/integration/setup.ts` — test başına `TRUNCATE`;
    - `prisma/seed-demo.ts` — demo öncesi `TRUNCATE`;
    - `prisma/demo-gecmis.ts` — geçmişe kaydırma ve ardından `denetim_zinciri_kur()` ile zincirin
      yeniden kurulması.

    Kaynak taraması bu ayarın `src/`'de geçmediğini doğrular.

## Sonuçlar

- ✅ Uygulama hatası ya da yanlış bir seed kaydı değiştiremez; deneme işi geri alır.
- ✅ Zincir kilidi iş kilitleriyle döngü kuramaz (ADR-012). Ek maliyet commit başına bir kilit, bir
  okuma ve bir yazmadır.
- ✅ Kanonik biçim iki dilde de birkaç satırdır; ayrıştırıcı gerekmez.
- ⚠️ **Zincir anahtarsızdır.** Süper kullanıcı tetikleyicileri kapatıp zinciri yeniden hesaplayabilir;
  bunu yalnız dışarıda saklanan son özet yakalar (X-18 §(2)).
- ⚠️ **Faz 3 kurulum şartları:**
  - uygulamanın veritabanı kullanıcısı süper kullanıcı değildir; aksi hâlde bakım yolu uygulamaya açıktır;
  - uygulama ters vekil arkasında çalışır ve vekil `x-forwarded-for`'a adres ekler; aksi hâlde IP
    taklit edilebilir.
- ⚠️ Denetimli her commit aynı kilitte sıraya girer. Faz 1 hacminde (~10 eşzamanlı kullanıcı)
  önemsizdir; ölçüm D2 PR'ındadır.
- ⚠️ `prisma migrate reset` ve elle `DROP` şemayı düşürür, tetikleyiciye takılmaz: değişmezlik satır
  işlemlerine karşıdır, şema yönetimine değil.

## Değerlendirilen alternatifler

- **Mühür kolonları kaydın kendi satırında, commit'te `UPDATE` ile.** Reddedildi: değişmezlik
  tetikleyicisine bir istisna yolu açar.
- **Zincir uygulamada (HMAC dahil), kayıt yazılırken.** Reddedildi: kilit transaction ortasında
  alınır (ADR-008 döngüsü); önlemek için denetim yazımını her işlemin sonuna taşımak gerekir
  (X-18, seçenek (c)).
- **Kayıt başına özet, zincirsiz.** Reddedildi (X-18, seçenek (b)): silinen kaydı yakalamaz.
- **`OFFSET` ya da `(createdAt, id)` ile sayfalama.** Reddedildi: `OFFSET` derinlikte doğrusaldır; iki
  kolonlu imleç Prisma'da `OR` ile yazılır ve indekse sınır olarak inmez.
- **IP için soldaki girdi.** Reddedildi: istemcinin kendi gönderdiği başlık da soldadır.

## Açık uygulama kalemleri (atıf)

- Ekran (liste, detay paneli, fark) — tasarım 3 D2.
- 1 milyon satırla sayfalama ve doğrulama ölçümü — D2 PR'ı.

## Geçerlilik sınırı

Zincire anahtar eklenirse ya da mühür veritabanı dışına (dış çapa, WORM depo) yazılırsa bu ADR
değiştirilmez; `README` §2.2 gereği yerine yenisi yazılır.
