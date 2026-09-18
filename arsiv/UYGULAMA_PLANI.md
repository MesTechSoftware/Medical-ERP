> ⛔ ARŞİV (KARARLAR X-7 §(1)). Yerine: YOL_HARITASI.md + FAZ1_UYGULAMA_KAPSAMI.md

# Uygulama Planı — Medikal Satış Operasyon v2.2

**Kaynak spec:** [PRD_V2.md](./PRD_V2.md) (v2.2) · **Tarih:** 23 Temmuz 2026
**Kapsam:** Sprint 0 → Faz F (tamamı)

---

## Context — Bu plan neden var?

`PRD_V2.md` v2.2 *ne* yapılacağını tanımlıyor ama *nasıl* yapılacağını tanımlamıyor. v2, ek modül işi
değil **çekirdek veri modeli değişikliği**: satıcı cari modeli tamamen kalkıyor, doktor bir varlığa
dönüşüyor, KDV yatay olarak tüm parasal alanlara giriyor, prim tahsilat bazlı hesaplanıyor, kongre
hak ediş defteri ve bayi paneli ekleniyor.

Bu doküman, mevcut kod tabanının gerçek durumunu ölçüp (aşağıdaki §1) her fazı dosya seviyesinde
uygulanabilir adımlara indirger.

**İki kapsam kararı (23 Temmuz 2026, müşteri):**
- **Canlı veri yok → temiz sayfa.** Şema Postgres'te sıfırdan kurulur, migration'lar yeniden üretilir,
  seed v2 modeline göre yeniden yazılır. **PRD BRK-02'nin veri taşıma scripti kapsam dışı** — Faz A kısalır.
- **Rate-limit Redis'e değil Postgres'e taşınır.** Yeni servis/bağımlılık yok; PRD Sprint 0 madde 1'in
  Redis kısmı düşer.

---

## 1. Mevcut Durum (kod tabanından doğrulandı)

| Alan | Durum |
|---|---|
| **Stack** | Next.js `16.2.10`, React `19.2.4`, Prisma `^7.8.0`, next-auth `^5.0.0-beta.31` (JWT), zod `^4`, Tailwind v4 (CSS-first, `tailwind.config` yok), TS `strict`, Node `24.17.0` (.nvmrc), npm |
| **DB** | **SQLite**, driver-adapter modunda (`@prisma/adapter-better-sqlite3`). Şemada **`url` yok**; `prisma.config.ts` `datasource.url`'i env'den enjekte ediyor. Adapter **iki yerde** kuruluyor: `src/lib/db.ts:10-18`, `prisma/seed.ts:6-9`. `migration_lock.toml` = sqlite, 2 migration |
| **Prisma client** | `src/generated/prisma` altına üretiliyor ve **gitignored** → CI'da `prisma generate` zorunlu |
| **Modeller** | `User`, `Product`, `StockMovement`, `Order`, `OrderItem`, `Shipment`, `Payment`, `AuditLog` |
| **Enum'lar** | `Role(ADMIN,SELLER)`, `EntityStatus`, `OrderStatus`, `StockMovementType`, `PaymentMethod` |
| **Para** | Tümü **`Int` kuruş**: `Product.salePrice`, `Order.totalAmount`, `OrderItem.unitPrice`, `OrderItem.lineTotal`, `Payment.amount`. `BigInt`/`Decimal` yok |
| **Para yardımcıları** | `src/lib/money.ts` (`formatTRY`, `tlToKurus`, `kurusToTl`), `src/lib/validation.ts` (`MAX_TL`, `isWholeKurus`, `amountTLSchema`, `priceTLSchema`, `quantitySchema`) |
| **Cari** | `src/lib/cari.ts` — satıcı-borçlu modeli (`getSellerCari`, `getAllSellersCari`). Dashboard ayrıca `dashboard/page.tsx:47-49`'da **inline yeniden hesaplıyor** |
| **Auth/RBAC** | `src/lib/auth.ts` (Credentials + JWT, `jwt`/`session` callback'leri role taşıyor), `src/lib/session.ts` (`requireSession`/`requireAdmin`/`requireSeller`). **`middleware.ts` yok** — tüm gating layout + action seviyesinde |
| **Panel yapısı** | `(admin)` 8 bölüm, `(seller)` 2 bölüm. Her layout kendi `NavItem[]`'ını `AppShell`'e veriyor |
| **Paylaşılan UI** | `ui.tsx`: `PageHeader`, `LinkButton`, `Card`, `StatusBadge`, `StatCard`, `EmptyRow`, `PAYMENT_METHOD_LABELS` · `form.tsx`: `Field`, `SelectField`, `TextArea`, `SubmitButton`, `FormError` · ayrıca `AppShell`, `SidebarLink`, `ConfirmSubmit`, `OrderDetail`, `LogoutButton` |
| **Audit** | `src/lib/audit.ts` — `createAuditLog` (best-effort, **asla throw etmez**), `sanitizeAuditData`, `AUDIT_ACTIONS`. `deleteProduct`/`deleteSeller` audit **yazmıyor** |
| **Rate-limit** | `src/lib/rate-limit.ts` — `globalThis` üzerinde bellek içi `Map`; 5 hata → 10 dk kilit. Exports: `checkLock`, `recordFailure`, `reset` |
| **Testler** | Yalnız Playwright e2e (~248 satır, port 3100, ayrı `test.db`). **Birim test yok**, vitest/jest lockfile'da bile yok |
| **CI** | **Yok** (`.github/` dizini yok). Playwright `process.env.CI` okuyor ama bağlı değil |
| **Eksik altyapı** | `error.tsx`, `loading.tsx`, `not-found.tsx`, `middleware.ts`, **sayfalama** (hiçbir listede `skip`/`cursor` yok; `products`/`sellers`/`orders`/`my-orders` **sınırsız** `findMany`) |
| **Stok yarışı** | `my-orders/actions.ts:54-91` — `$transaction` içinde ama **check-then-act**: `findUnique` → JS'te `if (stock < qty)` → ayrı `update({ decrement })`. Koşullu `WHERE stock >= qty` **yok** |

---

## 2. Mimari Kararlar

| # | Karar | Gerekçe |
|---|---|---|
| **AD-01** | **Para tipi `BigInt` kuruş.** `Decimal` değil. | PRD **RULE-10** zaten "tam sayı kuruş" diyor. Postgres'te `Int` = 4 bayt = **±21,5 M ₺** gerçek bir tavan (BRK-03); `BigInt` = `BIGINT`. Kuruş konvansiyonu korunur, sadece tavan kalkar. |
| **AD-02** | ~~Driver adapter kaldırılır~~ → **Driver adapter `better-sqlite3`'ten `@prisma/adapter-pg`'ye SWAP edilir.** | ⚠️ **Düzeltildi (uygulamada bulundu):** Prisma 7 şemadan `url`'i tamamen kaldırmış; bağlantı `prisma.config.ts`'te tanımlanır ve **driver adapter zorunludur**. Adapter'ı "kaldırma" seçeneği yok. |
| **AD-03** | **Rate-limit Postgres tablosunda** (`LoginAttempt`). Aynı 3 export korunur, ancak **async olurlar**. | Redis servisi gerekmez; çoklu instance'ta doğru, restart'ta sıfırlanmaz. ⚠️ **Düzeltildi:** sync→async geçişi `auth.ts` ve `auth-actions.ts`'e `await` eklemeyi gerektirdi ("auth.ts değişmez" iddiası yanlıştı). |
| **AD-04** | **Stok atomik koşullu update.** `updateMany({ where: { id, stock: { gte: qty } }, data: { stock: { decrement: qty } } })` → `count === 0` ise hata. | RULE-01'i veritabanı seviyesinde zorlar. İki kanal (satıcı siparişi + bayi sevkiyat onayı) aynı stoğa yazacak (BRK-05). |
| **AD-05** | **`requireSession()` her istekte DB'den kullanıcıyı doğrular**, React `cache()` ile istek başına tekilleştirilir. | JWT snapshot'ı pasifleştirmeyi görmüyor (BRK-04). FR-08 ve FR-46g bunsuz çalışmaz. |
| **AD-06** | **searchParams tabanlı ortak sayfalama** (`?page=&per=`). | Sınırsız `findMany`'ler ve sabit `take:` cap'leri tek bir helper'a bağlanır (BRK-06). |
| **AD-07** | **Birim test için vitest**, e2e'de mevcut Playwright kalır. | Native ESM/TS, minimum config. Prim, mahsup, KDV yuvarlama ve kongre FIFO/expiry **saf fonksiyon** olarak yazılıp test edilecek (BRK-09). |
| **AD-08** | **Sevkiyat talebi ayrı model değil**, `DealerShipment.status` (`TALEP/ONAYLANDI/IPTAL/REDDEDILDI`). | PRD §7.1 ile aynı; `CongressRegistration` TALEP→ONAY desenine paralel. Stok/cari etkisi onaya ertelenir. |
| **AD-09** | **Hesaplanan bakiye, saklanan kolon yok** (RULE-08). Yeni saf-fonksiyon kütüphaneleri: `doctor-cari.ts`, `dealer-cari.ts`, `commission.ts`, `congress-ledger.ts`, `vat.ts`, `allocation.ts`. | Test edilebilirlik + PRD RULE-08/11. `src/lib/cari.ts` silinir. |

### AD-01'in yayılım etkisi (atlanırsa sessizce bozulur)
- `src/lib/audit.ts` → `serialize()` **`JSON.stringify`** kullanıyor; `BigInt` serileştirilemez → **replacer eklenmeli**
  (`(_k, v) => typeof v === "bigint" ? v.toString() : v`). Audit best-effort olduğu için hata sessizce yutulur — bu yüzden riskli.
- Prisma `_sum` aggregate'leri artık `bigint | null` döner → `cari.ts` ve `dashboard/page.tsx:47-49` birlikte güncellenmeli.
- Server Component → Client Component prop'ları: para **sunucuda string'e formatlanıp** geçirilmeli.
- `src/lib/validation.ts:16` `MAX_TL = 1_000_000_000` ama yorum "10 milyar" diyor — **düzeltilecek** (BRK-03'ün ikinci yarısı).
- Form girdileri TL `number` olarak gelir; **sınırda** (`tlToKurus`) `bigint`'e çevrilir. Zod şemaları TL tarafında kalır.

---

## 3. Sprint 0 — Teknik Ön Koşullar

> Bu maddeler atlanırsa prim, cari ve kongre hesapları **sessizce yanlış** sonuç üretir (PRD §9).

| # | İş | Dosyalar |
|---|---|---|
| 0.1 | **Postgres geçişi** | `prisma/schema.prisma` (`provider = "postgresql"`, `url = env("DATABASE_URL")`), `prisma/migrations/` **silinip** `migrate dev --name init_v2`, `migration_lock.toml`, `src/lib/db.ts` (adapter kaldır), `prisma/seed.ts` (adapter kaldır), `prisma.config.ts`, `.env.example`, `package.json` (`better-sqlite3` + `@prisma/adapter-better-sqlite3` kaldır) |
| 0.2 | **BigInt para** | `schema.prisma` (5 para alanı `Int`→`BigInt`), `src/lib/money.ts` (bigint imzalar), `src/lib/validation.ts` (`MAX_TL` düzelt), `src/lib/audit.ts` (**BigInt JSON replacer**), `src/lib/cari.ts` + `dashboard/page.tsx` (aggregate tipleri) |
| 0.3 | **Canlı oturum doğrulama** | `src/lib/session.ts` — `requireSession()` içinde `prisma.user.findUnique` + `status === ACTIVE` kontrolü, React `cache()` ile sarmalanır |
| 0.4 | **Rate-limit → Postgres** | `schema.prisma` (+`LoginAttempt` modeli), `src/lib/rate-limit.ts` (aynı 3 export). `src/lib/auth.ts` **değişmez** |
| 0.5 | **Stok atomikliği** | `src/app/(seller)/my-orders/actions.ts` — check-then-act → koşullu `updateMany` (AD-04) |
| 0.6 | **CI** | `.github/workflows/ci.yml`: Postgres service container → `npm ci` → **`prisma generate`** (gitignored!) → `tsc --noEmit` → `eslint` → `vitest run` → `playwright test` |
| 0.7 | **Hata/yükleme sınırları** | Kök + her route group için `error.tsx`, `loading.tsx`, `not-found.tsx` |
| 0.8 | **Sayfalama altyapısı** | `src/lib/pagination.ts` (searchParams → `{page, per, skip, take}`), `src/components/Pagination.tsx`; sınırsız listelere uygulanır |
| 0.9 | **Birim test altyapısı** | `vitest` + `vitest.config.ts`, `package.json` scripts (`test`, `test:unit`) |
| 0.10 | **env fail-fast** | `src/lib/db.ts` — `DATABASE_URL` yoksa açık hata (bugün sessizce `file:./dev.db`'ye düşüyor) |

**Playwright'ı da güncelle:** `playwright.config.ts:25-35` `webServer` komutu `rm -f test.db` + sqlite varsayıyor →
test Postgres DB'sine + `prisma migrate deploy` + `db:seed` akışına çevrilir.

### ✅ Sprint 0 — TAMAMLANDI (23 Temmuz 2026)

Doğrulama sonuçları: `tsc --noEmit` **0 hata** · `npm run lint` **temiz** · `npm test` **18/18** ·
`npm run build` **başarılı** · `npm run test:e2e` **19/19** ·
yarış testi: stok=1'e 10 eşzamanlı istek → **1 başarılı / 9 reddedildi / stok 0** (RULE-01 korundu) ·
oturum testi: satıcı `PASSIVE` yapılınca **bir sonraki istekte** `/login`'e düşüyor (e2e ile korunuyor).

### Uygulamada karşılaşılan sürprizler (plan yazılırken bilinmiyordu)

1. **Prisma 7 şemada `url` desteklemiyor** → driver adapter zorunlu (AD-02 düzeltildi).
2. **Prisma 7'de `migrate reset` seed'i artık çalıştırmıyor** (`--skip-seed` bu yüzden kaldırılmış) →
   Playwright `webServer` komutunda seed **açıkça** çağrılmalı. Bu atlanınca test DB'si boş kalıyor
   ve tüm login testleri sessizce düşüyor.
3. **`tsconfig` `target: ES2017`** BigInt literal'lerini (`0n`) desteklemiyor → **ES2020**'ye çekildi.
   Ayrıca bayat `tsconfig.tsbuildinfo` düzeltmeden sonra bile hatayı göstermeye devam etti (silmek gerekti).
4. **`scripts/backup.ts` SQLite'a bağımlıydı** (`better-sqlite3` `db.backup()`) → `pg_dump -Fc` +
   `pg_restore --list` doğrulamasıyla yeniden yazıldı. ⚠️ **Bu parça yerelde test edilmedi** —
   `pg_dump` geliştirme makinesinde PATH'te yok.
5. **Prisma'nın AI-agent koruması** `migrate reset`i engelliyor; `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`
   ile açık kullanıcı onayı gerekiyor. CI'da (Claude Code yokken) tetiklenmiyor.
6. **Pre-existing 2 lint hatası** (`scripts/screenshots.ts`, `any` kullanımı) CI'ı ilk günden kırmızı
   yapacaktı → düzeltildi; altından gizlenmiş bir tip hatası da çıktı.

---

## 4. Faz A — Doktor Varlığı (FR-01…FR-10)

**Bağımlılık:** Sprint 0 (0.3). **Not:** Temiz sayfa olduğu için veri taşıma scripti **yok**.

- **Şema:** `Doctor` (fullName, title, specialty, clinic, region, city, `phoneNormalized @unique`, email, `ownerSellerId?`, status), `DoctorAssignment` (devir geçmişi). `Order.doctorName/hospital` → `doctorId` FK.
- **Saf fonksiyon:** `src/lib/phone.ts` — `normalizePhone()` → `+90XXXXXXXXXX`. **Birim test** (FR-09 kritik: normalize edilmezse RULE-02 sessizce delinir).
- **Ekranlar:** `(admin)/doctors` (liste + devir), `(seller)/doctors` (kendi portföyü + yeni kayıt). Mevcut `ui.tsx`/`form.tsx` primitifleri ve `Pagination` yeniden kullanılır.
- **Yetki:** Satıcı yalnız kendi doktorlarını görür/sipariş açar — **layout + her action'da** ayrı ayrı zorlanır (mevcut desen).
- **Audit:** Doktor devri `createAuditLog` ile (RULE-13). `AUDIT_ACTIONS`'a yeni sabitler.

**Doğrulama:** Aynı telefonla ikinci kayıt reddediliyor · Satıcı B, Satıcı A'nın doktoruna doğrudan sunucu isteğiyle sipariş açamıyor · Devir sonrası eski siparişler eski satıcıda kalıyor.

### ✅ Faz A — TAMAMLANDI (23 Temmuz 2026)

`tsc` **0 hata** · `lint` **temiz** · `npm test` **52/52** · `build` **başarılı** · `test:e2e` **29/29**.

Kanıtlanan kurallar: FR-03 sahiplik otomatik · **FR-09 farklı yazımla bile mükerrer kayıt yok**
(15 varyant birim testi + e2e) · FR-05 portföy görünürlüğü · **FR-04/RULE-02 sahibi olmayan
doktora sipariş, arayüze seçenek enjekte edilerek atlansa bile sunucuda reddediliyor** ·
FR-06 devir + atama geçmişi · **FR-07 devirden sonra geçmiş siparişler eski satıcıda kalıyor** ·
FR-08 sahipsiz havuz · RULE-13 devir audit'te.

**Uygulamada karşılaşılan sürprizler:**
1. **Route group çakışması:** `(admin)/doctors` ve `(seller)/doctors` ikisi de `/doctors`'a
   çözülüyordu — route group URL segmenti eklemiyor. Mevcut `/orders` vs `/my-orders`
   konvansiyonuna uyularak satıcı tarafı **`/my-doctors`** yapıldı. **Faz D'de `(dealer)` için aynı risk.**
2. **Test bağımlılığı:** testler tek tek geçip suite'te düştü. İki sebep — (a) sipariş formuna
   doktor `<select>`'i eklenince eski `getByRole("combobox").first()` artık ürünü değil doktoru
   seçiyordu; (b) admin devir testleri seed sahipliğini değiştirip sonraki satıcı testlerini
   bozuyordu. Çözüm: label tabanlı kesin seçiciler + devir testlerinin durumu geri alması +
   sabit seed adları yerine **çalışma anında DB'den okuma**.
3. `<>` fragment'ine `key` verilemiyor; `<Fragment key>` gerekti (iki satırlı tablo düzeni).

---

## 5. Faz B — KDV + Taban Fiyat (FR-11…FR-19)

**Bağımlılık:** Sprint 0 (0.2). Faz A ile **paralel** yürüyebilir.

- **Şema:** `Product` `+ netListPrice`, `+ netMinPrice`, `+ vatRate` (varsayılan 20); `salePrice` → `netListPrice`.
  `OrderItem` `+ netUnitPrice`, `+ listPriceAtSale`, `+ discountRate`, `+ vatRate`, `+ vatAmount`, `+ lineNetTotal`, `+ lineGrossTotal`.
  `Order` `+ netTotal`, `+ vatTotal`, `+ grossTotal`.
- **Saf fonksiyon:** `src/lib/vat.ts` — net↔brüt dönüşümü, KDV hesabı. **Kural: kalem bazında yuvarla, sipariş toplamında değil** (PRD §5.2). **Birim testle korunur** — aksi halde "kalemler toplamı ≠ sipariş toplamı".
- **Sunucu tarafı zorlama:** birim fiyat `netMinPrice` altındaysa **reddedilir** (RULE-03).
- **UI:** Tüm fiyat girişi ve listelerde "KDV Dahil / KDV Hariç" seçeneği; tercih hatırlanır (çerez).

**Doğrulama (birim test):** KDV dahil girilen fiyat net'e doğru çevriliyor ve **Σ kalem = sipariş toplamı** · taban fiyat altı sipariş sunucuda reddediliyor.

### ✅ Faz B — TAMAMLANDI (23 Temmuz 2026)

`tsc` **0 hata** · `lint` **temiz** · `npm test` **33/33** · `build` **başarılı** · `test:e2e` **23/23**.

Kilitlenen kurallar: yuvarlama kalem bazında (toplam bazından farkı gösteren birim testle) ·
taban fiyat **arayüz atlansa bile sunucuda** reddediliyor (e2e ile kanıtlandı) ·
KDV Dahil/Hariç tercihi çerezde kalıcı.

**Uygulamada karşılaşılan sürpriz (yüksek değerli):**
`"use client"` modülünden **sabit** import eden bir sunucu bileşeni, Next.js'in o export'u
client referansına çevirmesi yüzünden gerçek string değeri göremiyor →
`cookies().get(VAT_MODE_COOKIE)` **sessizce undefined** dönüyordu. Tip hatası vermiyor,
build kırılmıyor, sadece özellik çalışmıyor. Çözüm: paylaşılan sabitler `"use client"`
içermeyen ayrı bir modülde (`src/lib/vat-mode.ts`). **Faz D'de bayi paneli için aynı tuzak var.**

Ayrıca: React Compiler lint kuralları (`set-state-in-effect`, `immutability`) localStorage+useEffect
yaklaşımını reddetti — çerez tabanlı çözüm hem lint'i hem hydration'ı hem SSR'ı doğru yaptı.

---

## 6. Faz C1 — Doktor Cari, Vade, Tahsilat, Mahsup (FR-20…FR-29)

**Bağımlılık:** Faz A + B. **Kritik yol üzerinde** (D-16 prim matrahını tahsilata bağladı).

- **Şema:** `DoctorPayment`, `PaymentAllocation` (mahsuplaşma), `DueDateChange`. `Order + dueDate`.
- **Saf fonksiyon:** `src/lib/allocation.ts` — **FIFO mahsup** (vadesi en eski önce, D-18) + manuel düzeltme. **Birim test.**
- **`src/lib/doctor-cari.ts`** — `Bakiye = Σ sipariş (iptal hariç, brüt) − Σ tahsilat`, hesaplanır (RULE-08).
- **🔴 Tek transaction (RULE-12):** bir tahsilat kaydı → (a) mahsuplaşma, (b) doktor bakiyesi, (c) prim matrahı, (d) kongre `EARN`. Herhangi biri hata verirse **hepsi geri alınır**.
- **Vade:** varsayılan gün + **üst sınır admin parametresi** (D-20); değişiklik `DueDateChange` + audit.
- **Yaşlandırma raporu:** 0 / 1-30 / 31-60 / 61-90 / 90+ kovaları, doktor ve satıcı kırılımında.
- **Yıkım:** `src/lib/cari.ts` **silinir**; `(seller)/account` ve `(admin)/payments` ekranları yeniden yazılır; `Payment` modeli `DoctorPayment` + `DealerPayment`'a bölünür; `e2e/admin/cari.spec.ts` yeniden yazılır.

**Doğrulama:** Kısmi tahsilat doktor bakiyesini + prim matrahını + kongre bakiyesini **orantılı** güncelliyor · transaction'ın ara adımı bilerek patlatıldığında **hiçbiri** yazılmıyor · yaşlandırma doğru kovalıyor.

### ✅ Faz C1 — TAMAMLANDI (23 Temmuz 2026)

`tsc` **0 hata** · `lint` **temiz** · `npm test` **75/75** · `build` **başarılı** · `test:e2e` **34/34**.

Kanıtlanan kurallar: **D-18 FIFO** (mahsup en eski VADEYE gitti — SQL ile doğrulandı) ·
FR-20/RULE-08 bakiye hareketlerden hesaplanıyor · FR-25 kısmi tahsilat ·
**FR-29 iptal ters kayıt** (bakiye tam olarak eski değerine döndü) · FR-26 yaşlandırma ·
FR-21/FR-22/D-20 vade + üst sınır + değişiklik geçmişi · RULE-13 audit.

**Yıkım tamamlandı (BRK-01):** `src/lib/cari.ts` **silindi**, `Payment` modeli kaldırıldı,
`(admin)/payments` → **`(admin)/collections`**, satıcı "Hesabım" ekranı borç göstermekten
çıkıp **tahsilat sorumluluğu** göstermeye döndü, dashboard/satıcı ekranları yeniden yazıldı.

**Uygulamada karşılaşılan sürprizler:**
1. **`.next` önbelleği silinen rotayı hatırlıyor** — `(admin)/payments` kaldırıldıktan sonra
   `tsc` üretilmiş `validator.ts` üzerinden hayalet hata verdi; `rm -rf .next` gerekti.
2. **Zayıf assertion testi yalancı yeşil yapıyordu:** `getByText("İptal")` aynı zamanda
   "İptal Et" **butonuyla** eşleşiyordu; test iptal gerçekleşmese de geçiyordu. Ayrıca liste
   `paidAt DESC` sıralı olduğu için eşit zaman damgalarında `.first()` **yanlış kaydı** hedefliyordu.
   Çözüm: forma `data-payment-id` çapası + durumu **veritabanından** doğrulama.

---

## 7. Faz C2 — Satıcı Primi (FR-30…FR-38)

**Bağımlılık:** Faz C1.

- **Şema:** `CommissionPeriod` (`@@unique([sellerId, year, month])`), `CommissionAdjustment`. `User + commissionRate?`.
- **Saf fonksiyon:** `src/lib/commission.ts` — matrah = dönem içinde **tahsil edilen**, **KDV hariç** (D-16, D-17). **Birim test.**
- **Dönem kapanışı:** matrah/oran/tutar **dondurulur**; kapanmış dönem asla değişmez (RULE-05) — sonraki iptaller **sonraki döneme negatif kayıt**.
- **Satıcı ekranı:** ay içi anlık tahsilat + tahmini prim + "açıldı ama tahsil edilmedi" tutarı ayrı.

**Doğrulama:** Ay kapanınca prim donuyor; kapanmış döneme ait tahsilat iptali geçmiş dönemi **değiştirmiyor**, sonraki döneme negatif düşüyor.

### ✅ Faz C2 — TAMAMLANDI (23 Temmuz 2026)

`tsc` **0 hata** · `lint` **temiz** · `npm test` **96/96** · `build` **başarılı** · `test:e2e` **38/38**.

Kanıtlanan kurallar: **D-16/D-17 matrah = tahsil edilen, KDV hariç** (e2e matrahın brüt
tahsilattan küçük olduğunu doğruluyor) · D-19 kısmi tahsilatta orantılı net ·
**RULE-05/FR-35: kapanmış dönem dondurulur; iptal onu DEĞİŞTİRMEZ, güncel döneme
negatif düzeltme yazılır** (geçmişe tarihli tahsilat kurup uçtan uca kanıtlandı) ·
FR-34 açık dönem kapatılamaz · FR-36 durum akışı · FR-31 satıcı bazlı oran override.

**Tasarım notu:** Prim, **siparişi açan satıcıya** aittir (`Order.sellerId`), doktorun
güncel sahibine değil — devirde geçmiş primler eski satıcıda kalır (FR-07 ile tutarlı).
`divRound` `money.ts`'e taşındı: KDV ve prim matrahı **aynı yuvarlama kuralını** paylaşıyor.

**Test tuzağı:** Kapatma butonunun başarı mesajı formun İÇİNDE; dönem kapanınca form
unmount olduğu için mesaj da kayboluyor — mesaja bakan assertion yanlış negatif veriyordu.
Gerçek kanıt kaydın kendisi (DB'den `expect.poll`).

---

## 8. Faz D — Bayi Kanalı + Bayi Paneli (FR-39…FR-46g)

**Bağımlılık:** Sprint 0 (özellikle 0.3 — bayi login'i canlı oturum doğrulaması ister).
**Kritik yola değmez** (D-06/D-19: bayi prim/kongreye hiç dokunmaz) → ikinci geliştirici için ideal paralel iş.

- **Şema:** `Dealer` (+`userId?`), `DealerPrice`, `DealerShipment` (status `TALEP/ONAYLANDI/IPTAL/REDDEDILDI`, `requestedByUserId?`, `approvedBy?`), `DealerShipmentItem`, `DealerPayment`. `Role` enum'una **`DEALER`**.
- **Rol altyapısı (BRK-10 — üç ayrı dokunuş):**
  1. `src/lib/session.ts` → `requireDealer()`
  2. `src/app/page.tsx:7` → ikili `ADMIN ? /dashboard : /my-orders` **üç yollu** hale gelir (bugün DEALER yanlışlıkla satıcı paneline düşer)
  3. `(admin)/sellers/actions.ts` rolü sabit `"SELLER"` yazıyor → bayi kullanıcısı için ayrı oluşturma yolu
- **Panel:** yeni `src/app/(dealer)/layout.tsx` — `(seller)/layout.tsx` deseninin birebir kopyası (`requireDealer()` + kendi `NavItem[]` + `AppShell`). **URL çakışmasına dikkat:** route group'lar URL segmenti eklemez; `(admin)` zaten `/shipping`, `/payments` sahibi.
- **Ekranlar:** bayi dashboard (kendi cari/sevkiyat/ödeme/yaşlandırma, **read-only**), kendi fiyat listesi, sevkiyat talebi oluştur/geri çek.
- **Talep→onay:** `TALEP`'te stok/cari **değişmez**; admin onayında FR-42 transaction'ı (fiyat listeden, KDV, stok `OUT` **atomik** — AD-04, cari borç).
- **`src/lib/dealer-cari.ts`** — `Bakiye = Σ sevkiyat (iptal hariç) − Σ ödeme`.

**Doğrulama:** Bayi başka bayinin verisine **sunucu isteğiyle** erişemiyor · talep onaylanana kadar stok/cari değişmiyor · onayda tek transaction'da stok düşüp cariye yazılıyor · **pasif bayi login olamıyor** (0.3'e bağlı) · bayi doğrudan sipariş veremiyor/fiyat değiştiremiyor.

### ✅ Faz D — TAMAMLANDI (23 Temmuz 2026)

`tsc` **0 hata** · `lint` **temiz** · `npm test` **123/123** · `build` **başarılı** · `test:e2e` **57/57**.

Kanıtlanan kurallar: **FR-46d TALEP stok/cariyi ETKİLEMİYOR** (SQL ile doğrulandı) ·
**FR-42 onayda atomik stok düşümü + cari** (AD-04 koşullu `updateMany`) · **FR-43 stok yetersizse
onay geri alınıyor**, sevkiyat TALEP kalıyor · **FR-44 iptalde stok geri (IN) + cari geri** ·
**FR-46a bayi yalnız kendi fiyat listesini görüyor** · **FR-46f bayi admin/satıcı sayfalarına
erişemiyor** (üç yollu yönlendirme) · **FR-46g pasif bayi login olamıyor** ·
**🔴 RULE-15: bayi sevkiyatı onaylanınca CongressLedger ve PaymentAllocation sayısı DEĞİŞMİYOR**
(bayi prim/kongreye hiç dokunmuyor — ayrı modeller sayesinde doğal).

**BRK-10 kapatıldı:** `Role` enum'una `DEALER`, `requireDealer()`, üç yollu kök yönlendirme
(`src/lib/roles.ts` `ROLE_HOME` tek kaynak), `(dealer)` route-group. Dealer-user oluşturma
`createDealer` içinde ayrı yol (sellers/actions.ts'e dokunulmadı).

**Not ettiğim iki tuzağın ikisi de doğrulandı:**
1. **Route-group çakışması** — bayi rotaları `/bayi/*` altında toplandı; admin'in `/shipping`,
   `/collections` gibi rotalarıyla çakışmıyor.
2. **`"use client"`'tan sabit import** — bu kez tuzağa düşmedim: `ROLE_HOME` ve
   `requireDealerAccount` gibi paylaşılan şeyler baştan sunucu modüllerinde tutuldu.

**Küçük tsc sürprizi:** `requireDealerAccount` içinde `redirect`'i dinamik `import()` ile
çağırınca TS `never` çıkarımını kaybedip `dealer`'ı 14 yerde `possibly null` gördü; statik
import'a çevirince daralttı.

---

## 9. Faz E — Kongre (FR-47…FR-59)

**Bağımlılık:** Faz C1 · **§11 hukuk teyidi** (geliştirmeye başlamadan önce).

- **Şema:** `Congress`, `CongressPackage`, `CongressRegistration`, `CongressLedger` (`type EARN/SPEND/ADJUST/EXPIRE`, `expiresAt?`, `remainingAmount`).
- **Saf fonksiyon:** `src/lib/congress-ledger.ts` — **FIFO tüketim** (RULE-11) + **rolling 12 ay expiry** (D-22). **Birim test** (en çok hata üreten alan).
- **Rezervasyon kilidi:** `TALEP` bakiyeyi rezerve eder, onay kesinleştirir. **RULE-09:** aynı bakiye iki pakete aynı anda harcanamaz → Postgres satır kilidi / koşullu update.
- **Expiry:** gecelik job + okuma anında tembel (lazy) doğrulama.
- **İptal:** bakiye iade edilir ama **son kullanma tarihi uzamaz** (orijinal kazanım tarihine göre).
- **Yetersiz bakiye:** sert red + eksik tutar gösterimi (D-12); sistem üzerinden fark ödemesi yok.

**Doğrulama (birim + e2e):** Harcama en eski kazanımdan düşüyor · 12 ayı dolan kazanım `EXPIRE` ile düşüyor · **eşzamanlı iki kayıt yarıştırıldığında** aynı bakiye iki pakete harcanamıyor · iptal bakiyeyi iade ediyor ama süreyi uzatmıyor.

### ✅ Faz E — TAMAMLANDI (23 Temmuz 2026, hukuk teyidi alındı)

`tsc` **0 hata** · `lint` **temiz** · `npm test` **123/123** · `build` **başarılı** · `test:e2e` **43/43**.

Kanıtlanan kurallar: FR-49/D-11 tahsilat → EARN (%100, **NET** matrahtan — 120 ₺ brüt → 100 ₺ kazanım) ·
FR-50 son kullanma tam +12 ay · **FR-51/RULE-11 FIFO** (eski lot tükendi, yeni lot dokunulmadı) ·
**FR-54/D-12 yetersiz bakiyede sert red** (kısmi harcama yok, kayıt hiç oluşmuyor) ·
**🔴 RULE-09 yarış testi**: tam bir pakete yetecek bakiyeye iki eşzamanlı talep → en fazla bir kayıt,
bakiye asla negatife düşmüyor · **FR-56 iptalde iade ama son kullanma UZAMIYOR** (orijinal lot'a iade) ·
FR-59 yakında dolacak bakiye uyarısı.

**Tasarım kararı — rezervasyon = gerçek tüketim:** TALEP anında lotlardan **koşullu
`updateMany`** ile düşülür (stok yarışıyla aynı AD-04 deseni). Böylece RULE-09 uygulama
katmanında değil **veritabanında** garanti edilir. İade, tüketilen lot'un kendisine geri
yazıldığı için FR-56'nın "süre uzamaz" şartı kendiliğinden sağlanır.

**Birim testte yakalanan gerçek uç durum:** 29 Şubat + 12 ay → JS varsayılanı 1 Mart'a taşıyor
ve doktora bir gün fazla süre veriyordu; `expiryFor` 28 Şubat'a kırpacak şekilde yazıldı.

**Tekrarlayan test tuzağı (3. kez):** başarı mesajı formun içinde olduğu için, işlem sonrası
form unmount olunca mesaj kayboluyor ve mesaja bakan assertion **yanlış negatif** veriyor.
Kural: sonucu **veritabanından** doğrula.

#### ⚠️ Faz E ilk "tamamlandı" ilanı ERKENDİ — sonradan kapatılan boşluklar

İlk turda şunlar atlanmıştı ve faz yanlışlıkla bitmiş sayılmıştı:
- **FR-57** (doktor kongre hareket defteri + admin gerekçeli manuel `ADJUST`) — hiç yapılmamıştı;
  yalnızca audit sabiti eklenmişti.
- **FR-10** (doktor detay ekranı) — Faz A'dan beri eksikti.
- **FR-52** — `expireLots()` yazılıp test edilmiş ama **hiçbir yerden çağrılmıyordu**. Tembel
  doğrulama çalıştığı için bakiye doğruydu, ama defterde `EXPIRE` satırı oluşmuyordu →
  "bakiye nereye gitti?" sorusu cevaplanamıyordu (§11 denetim izi açısından kritik).
- Congress e2e testleri durumu geri almıyordu (doctor-transfer'da düzeltilen hata tekrarlanmış).

Kapatıldı: `(admin)/doctors/[id]` detay + defter + `AdjustForm`, `scripts/expire-congress-balances.ts`
(`npm run job:expire`, gecelik cron için), e2e `afterEach` ile sahiplik geri alma.
Sonuç: **123 birim + 47 e2e** yeşil. Expiry job'ı gerçek veriyle doğrulandı (`EXPIRE -50000` yazıldı).

---

## 10. Faz F — Dashboard ve Raporlar (FR-60…FR-64)

**Bağımlılık:** Tümü.

- Admin dashboard yeniden yazılır: kanal bazlı ciro, açık alacak + yaşlandırma özeti, ay içi prim yükü, bayi alacağı, **açık kongre bakiyesi toplamı (potansiyel yükümlülük)**.
- Satıcı dashboard: tahsilat/prim ilerlemesi, gecikmeler, portföy, ortalama iskonto.
- 4 rapor: satıcı performans (tahsilat oranı dahil), doktor ciro + kongre + gecikmiş borç, yaşlandırma, kanal karşılaştırma.
- Tüm raporlarda **KDV dahil/hariç** toggle (Faz B'deki `vat.ts` yeniden kullanılır).
- **D-25:** satıcı tahsilat performansı primi etkilemez, yalnız **raporlanır**.

### ✅ Faz F — TAMAMLANDI (23 Temmuz 2026)

`tsc` **0 hata** · `lint` **temiz** · `npm test` **134/134** · `build` **başarılı** · `test:e2e` **60/60**.

Eklenenler: `/reports` (FR-62 satıcı performansı: ciro/tahsilat oranı/ortalama iskonto/doktor sayısı ·
FR-63 doktor ciro sıralaması + kongre bakiye + gecikmiş borç · FR-60 kanal karşılaştırma +
açık kongre bakiyesi yükümlülüğü) · admin dashboard'a bayi kanalı cirosu/alacağı + kongre
yükümlülüğü · satıcı "Hesabım"a ortalama iskonto (FR-61) · `VatToggle` (FR-64).

**Kanıtlanan kural — FR-64:** KDV toggle'ın ciroyu net↔brüt arasında GERÇEKTEN değiştirdiğini
DB'den hesaplanan net ve brüt değerlerle e2e'de doğruladım; tercih çerezde kalıcı.

**Yardımcı fonksiyonlar test edildi (11 yeni birim):** `ratePercent` (sıfıra bölme), `collectionRate`,
**`weightedDiscount`** (tutar ağırlıklı — büyük siparişin ortalamayı daha çok çektiğini gösteren test).

**Test tuzağı (Faz F'e özel):** `router.refresh()` asenkron; toggle'a tıklayıp değeri HEMEN
okumak yanlış negatif verdi. `toContainText` (otomatik bekleyen) + DB'den hesaplanan beklenen
değerle düzeldi.

---

## 🏁 TÜM FAZLAR TAMAMLANDI (Sprint 0 → F)

| Faz | Durum | Öne çıkan kanıt |
|---|---|---|
| Sprint 0 | ✅ | Stok yarışı, oturum iptali |
| A | ✅ | Telefon benzersizliği, devir sonrası FR-07 |
| B | ✅ | Kalem bazında KDV yuvarlama, taban fiyat sunucuda |
| C1 | ✅ | FIFO mahsup, iptal ters kayıt |
| C2 | ✅ | RULE-05 kapanmış dönem değişmez |
| E | ✅ | RULE-09 rezervasyon yarışı, FIFO, expiry |
| D | ✅ | RULE-15 bayi prim/kongreye dokunmaz, talep→onay |
| F | ✅ | FR-64 KDV toggle |

**Toplam: 134 birim testi + 60 e2e testi.** Tümü her fazın sonunda tam turla (`tsc`+`lint`+`test`+`build`+`e2e`) doğrulandı.

---

## 11. Test Stratejisi

**Birim (vitest) — saf fonksiyonlar, en yüksek getiri:**
`vat.ts` (KDV yuvarlama: kalem bazında) · `allocation.ts` (FIFO mahsup) · `commission.ts` (matrah/oran/dönem) ·
`congress-ledger.ts` (FIFO + expiry) · `phone.ts` (normalizasyon) · `money.ts` (bigint dönüşümleri).

**E2E (Playwright) — mevcut yapı korunur** (`setup`/`guest`/`admin`/`seller` projeleri + storageState).
Eklenecek: `dealer` projesi ve auth setup'ı. Yeniden yazılacak: `e2e/admin/cari.spec.ts` (satıcı-borçlu modeli kalktı).

**Yarış testleri (kritik):** eşzamanlı stok düşümü (RULE-01) ve eşzamanlı kongre bakiyesi harcaması (RULE-09).
Bunlar birim testle yakalanmaz — Postgres üzerinde paralel istekle test edilmeli.

**Uçtan uca kabul:** PRD'nin sonundaki 15 adımlık örnek senaryo **tek bir E2E testi** olarak yazılır.

---

## 12. Uygulama Sırası ve Paralellik

```
Sprint 0 ──┬── Faz A ──┐
           ├── Faz B ──┴── Faz C1 ── Faz C2 ──┐
           │                    └── Faz E ────┴── Faz F
           └── Faz D  (paralel, kritik yola değmez)
```

- **Kritik yol:** Sprint 0 → A/B → C1 → C2/E → F
- **Faz D** Sprint 0 biter bitmez paralel başlayabilir (ikinci geliştirici).
- **Faz E**, §11 hukuk teyidi gelmeden başlamamalı.

---

## 13. Riskler

| Risk | Önlem |
|---|---|
| **BigInt sessiz bozulması** — `audit.ts` best-effort olduğu için `JSON.stringify(bigint)` hatası yutulur, audit kaydı sessizce düşer | 0.2'de replacer + audit yazımı için birim test |
| **KDV yuvarlama farkı** — "Σ kalem ≠ sipariş toplamı" | Kural birim testle kilitlenir (Faz B) |
| **Kongre FIFO/expiry** — en çok hata üreten alan, para karşılığı var | Saf fonksiyon + kapsamlı birim test + yarış testi |
| **Postgres geçişinin yarım kalması** — adapter iki yerde kurulu, `migration_lock.toml` sqlite'a pinli | 0.1 tek seferde bitirilir; CI ilk günden Postgres service container ile koşar |
| **Uyumluluk (§11)** — kongre modülü TİTCK açısından risk taşıyabilir | Faz E başlamadan hukuk/uyum teyidi; RULE-13 denetim izi zaten zorunlu |

---

## 14. Efor

PRD §13'teki tahmin geçerli (**≈106–153 A/G**), iki düzeltmeyle:
- **Faz A** kısalır (veri taşıma scripti kapsam dışı): ~10–14 → **~7–10 A/G**
- **Sprint 0** Redis kalktığı için hafifler ama BigInt yayılımı + rate-limit tablosu eklenir: **~12–18 A/G** (değişmez)

**Güncel toplam: ≈103–149 A/G.** Takvim: 1 geliştirici ~5–7 ay · 2 geliştirici (Faz D paralel) ~3–4 ay.
