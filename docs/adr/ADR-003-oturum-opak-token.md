# ADR-003 — Oturum mekanizması: opak token, `next-auth` sökülür

- **Durum:** ✅ Kabul edildi
- **Tarih:** 15.09.2026
- **Kaynak soru:** `FAZ1_UYGULAMA_KAPSAMI.md` §C-g — **yol (b)**
- **Bağlı KARARLAR maddeleri:** **E-2** (özellikle §(4) *oturum veritabanındadır*, §(5) parola politikası, §(6) pasifleştirme anında etkili, §(7) son yönetici, §(8) giriş denemeleri log'a) · D-2 §3 · C-3 §4 · `policy.ts`: `auth.oturumHareketsizlikSaat` (`4`), `auth.oturumMutlakSaat` (`12`)
- **Uygulandığı commit:** şema → `CM` (Faz 1A) · mekanizma → Faz 1B madde 4a (19.10.2026 — `src/lib/oturum.ts`, `src/lib/session.ts`; `next-auth` ve `AUTH_SECRET` kalktı)
- **Aynı gün düzeltmesi (15.09.2026):** ADR henüz repoya girmeden (C0 öncesi) *"Değerlendirilen
  alternatifler"* bölümündeki teknik not **doğrulandı** ve gerekçeye alındı; *"Bağlı açık karar"*
  X-9 ile kapandı. Karar değişmedi.

## Bağlam

KARARLAR E-2 §(4) oturumun **veritabanında** olmasını şart koşar. Gerekçe: rol ve aktiflik
her istekte kaynaktan okunmalı, pasifleştirme **anında** etkili olmalıdır (KVKK rehberi:
*"zaman kaybetmeksizin kapatma"*).

Bugünkü kod Auth.js / NextAuth v5 beta + Credentials + **JWT** kullanıyor.
- `requireSession()` her istekte DB'ye bakarak iptali bugün de sağlıyor (`session.ts:20-23`).
- Ama oturumun kendisi imzalı bir token; `AUTH_SECRET`'a bağlı.

KARARLAR §4'teki ilk ifade *"oturum tablosu (Auth.js veritabanı oturumu)"* idi. 15.09.2026'da
bu ifade redakte edildi.

## Karar

**Yol (b): `next-auth` tamamen sökülür; oturum uygulamanın kendi tablosunda, opak token ile tutulur.**

1. **Oturum kimliği:** 256-bit kriptografik rastgele token.
2. **Saklama:** DB'de token'ın kendisi değil **SHA-256 hash'i** tutulur.
3. **Çerez opaktır.** İçinde rol, kullanıcı kimliği veya imza yoktur; yalnız token taşır.
4. **Doğrulama bir lookup'tır:** çerezdeki token hash'lenir, oturum tablosunda aranır, bağlı
   kullanıcının **rolü ve aktifliği o anda okunur** (E-2 §(4)).
5. **Süreler `policy.ts`'ten okunur:** hareketsizlik **4 saat, kayar**; mutlak **12 saat, kaymaz**
   (E-2 §(4)).

## Sonuçlar

- **Çerez imzalama ve `AUTH_SECRET` düşer.**
  - Etkilenen yerler: `.env.example:10`, `ci.yml:17`.
  - Anahtar rotasyonu sorunu doğmaz.
  - `YOL_HARITASI.md` G-4 (secret yönetimi) buna göre daraltıldı.
- **Hash için SHA-256 yeterlidir.** Token 256-bit rastgele olduğu için kaba kuvvete açık
  değildir; parola hash'lemenin yavaş algoritmalarına gerek yoktur. DB sızıntısında ele geçen
  hash'ler **kullanılabilir oturum vermez**.
- **`/api/auth/[...nextauth]` silinir.** Uygulamada **hiç route handler kalmaz**; her yazma
  server action'dır. CSRF yüzeyi bu yüzden değişir (§D.4 madde 2).
- **Performans regresyonu yoktur.** `requireSession()` bugün de istek başına 1 sorgu atıyor;
  oturum tablosuna geçişte de 1 sorgu (§D.4 madde 1).
- **Parola saklama bu ADR'nin konusu değildir.** E-2 §(5) geçerlidir (`bcrypt`/`argon2`;
  bugün `bcryptjs`).
- **1A/1B arası borç (R-4):**
  - Oturum tablosu ve `Kullanici.aktif` / `parola_hash` / `parola_degistirmeli` kolonları `CM`'e girer.
  - 1B madde 4'e kadar tablo **boş ve kullanılmaz** durur.
  - Uygulama o süre boyunca **Auth.js JWT ile** çalışır ve `AUTH_SECRET` hâlâ gereklidir.
- **Test:** `session-revocation.spec.ts` bugün JWT + `status` kontrolünü sınıyor; 1B madde 4'te
  yeniden yazılır (§D.4 madde 5).

## Değerlendirilen alternatifler

- **Yol (a) — Auth.js korunur.** Tam tarifi `FAZ1_UYGULAMA_KAPSAMI.md` §C-g'dedir. Bu yolda
  çerez imzalama ve `AUTH_SECRET` bağımlılığı sürer; (b)'nin *"düşer"* dediği her şey kalır.
  - **Teknik dayanak — doğrulandı (15.09.2026):** Auth.js'in Credentials sağlayıcısı veritabanı
    oturum stratejisiyle **kutudan çıktığı hâliyle çalışmaz**. `next-auth` v4 belgesi bunu açıkça
    kısıt olarak yazar: Credentials ile giriş yapan kullanıcılar veritabanında tutulmaz, bu yüzden
    sağlayıcı yalnız JWT oturumuyla kullanılabilir. Veritabanı stratejisiyle denendiğinde kütüphane
    `UnsupportedStrategy` hatası verir. v5 tartışmalarında da bu kombinasyon için oturumun **elle**
    oluşturulması gerektiği belirtiliyor.
    **Sonuç:** KARARLAR'ın ilk ifadesi (*"Auth.js veritabanı oturumu"*) mevcut Credentials
    kurulumuyla **doğrudan uygulanabilir değildi**. Yol (a) seçilseydi oturum tablosu yine elle
    yönetilecek, üstüne beta bir kütüphanenin iç sözleşmesine bağımlılık eklenecekti. Yol (b)
    aynı işi bağımlılıksız yapar.
    *Ek bağlam:* authjs.dev sitesi, Auth.js projesinin artık Better Auth'un parçası olduğunu
    duyuruyor — v5'in beta'dan çıkış yolu belirsiz bir bağımlılıktır.
  - Kaynaklar (15.09.2026'da okundu):
    - https://next-auth.js.org/providers/credentials
    - https://github.com/nextauthjs/next-auth/issues/10966
    - https://github.com/nextauthjs/next-auth/discussions/12848
    - https://authjs.dev/concepts/session-strategies

## Açık uygulama kalemleri (atıf)

Karar değildir. 1B madde 4'te çözülür → `FAZ1_UYGULAMA_KAPSAMI.md` §D.4:

1. `lastSeenAt` yazma sıklığı (eşikli güncelleme).
2. CSRF yüzeyi — Next 16.2.10'da doğrulanıp regresyon testiyle sabitlenir.
3. `parola_degistirmeli` akışının ekran ve guard davranışı.
4. *"En az bir aktif `YONETICI`"* kısıtı.
5. `session-revocation.spec.ts` yeniden yazımı.
6. Oturum sonlandırma yöntemi (silme mi, iptal işareti mi) — C-3 `DELETE` yasağının kapsamına bağlı.
7. Çerez bayrakları (`HttpOnly` · `Secure` · `SameSite`).

**Bağlı karar:** Başarısız giriş sınırının (E-2 §(5)) sayacı → ✅ **KARARLAR X-9** (15.09.2026):
`LoginAttempt` kalkar; sayaç bellek içidir → **`docs/adr/ADR-004`**. Bu ADR oturumu, ADR-004 deneme
sayacını anlatır; ikisi 1B madde 4'te birlikte sınanır.

## Geçerlilik sınırı

Rol bazlı oturum süresi, eşzamanlı oturum sınırı, SSO ve MFA bu ADR'nin kapsamı dışındadır
(E-2 kapsam dışı listesi; MFA E-2 §(10) ile ertelendi). MFA gelirse bu mekanizmanın üzerine
eklenir; gerekiyorsa yeni ADR yazılır.
