# Mevcut Sistem Durumu — Teknik Envanter

- **Üretim tarihi:** 2026-09-14 (21:33 +03:00, `date -Iseconds`)
- **HEAD:** `3825241` (`git rev-parse --short HEAD`)
- **Dal:** `main` (`git branch --show-current`)
- **Çalışma ağacı:** temiz değil. `git status --short` çıktısı:

```
 M docker-compose.yml
?? DENETIM_BRIFI_1.md
?? docs/
?? excalidraw.log
```

**Ölçüm notları**

- Ortam: Windows 11 Pro 10.0.26200 · Node `v24.18.0` · npm `11.16.0` (`node --version`, `npm --version`). `.nvmrc` içeriği `24.17.0`.
- Satır/dosya sayıları aksi belirtilmedikçe **git tarafından izlenen** dosyalar üzerinden alındı (`git ls-files`). İzlenen dosya sayısı: 185.
- Çalıştırılan komutlar: `npm test`, `npm run typecheck` (2 kez), `npm run lint`, `npx eslint -f json -o <geçici dosya> .`, `npx eslint --print-config src/lib/money.ts`, `npx playwright test --list`. `npm run typecheck` depo kökünde `tsconfig.tsbuildinfo` (gitignored, `.gitignore:41`), `npm test` ise `node_modules/.vite/` üretti; ikisi de ölçümden önce yoktu ve ölçümden sonra silindi. Veritabanına bağlanan hiçbir komut (seed, migrate, e2e koşusu) çalıştırılmadı.
- "Tip-farkında" sayımlar (§5) TypeScript derleyici API'si ile (`node_modules/typescript` 5.9.3, proje `tsconfig.json`'u) üretildi.

---

## 1. Depo şekli

### 1.1 Dizin ağacı (2 seviye)

Kaynak: `(git ls-files; git ls-files --others --exclude-standard)` → ilk iki yol parçası. `node_modules`, üretilen dosyalar ve gitignored içerik hariç. `[izlenmiyor]` = untracked.

```
.
├── .github/workflows/          (ci.yml)
├── docker/                     (init-test-db.sql)
├── docs/                       [izlenmiyor] (DENETIM_BULGULARI.md, TRACEABILITY.md)
├── e2e/
│   ├── admin/                  (11 spec)
│   ├── dealer/                 (1 spec)
│   ├── guest/                  (2 spec)
│   ├── seller/                 (4 spec)
│   ├── auth.setup.ts
│   └── helpers.ts
├── prisma/
│   ├── migrations/             (1 migration klasörü + migration_lock.toml)
│   ├── schema.prisma
│   └── seed.ts
├── public/                     (file.svg, globe.svg, logo.png, logo-mark.png, next.svg, vercel.svg, window.svg)
├── scripts/                    (backup.ts, expire-congress-balances.ts)
├── src/
│   ├── app/                    (84 dosya)
│   ├── components/             (9 dosya)
│   ├── lib/                    (37 dosya)
│   └── types/                  (1 dosya)
├── .env.example  .gitignore  .nvmrc  AGENTS.md  CLAUDE.md
├── PRD_V2.md  PROJE_DURUMU.md  README.md  UYGULAMA_PLANI.md
├── DENETIM_BRIFI_1.md  excalidraw.log            [izlenmiyor]
├── docker-compose.yml  eslint.config.mjs  next.config.ts  postcss.config.mjs
└── package.json  package-lock.json  playwright.config.ts  prisma.config.ts  tsconfig.json  vitest.config.ts
```

Diskte bulunan ama gitignored öğeler (`git status --short --ignored`): `.env`, `.next/`, `dev.db`, `next-env.d.ts`, `node_modules/`, `playwright-report/`, `src/generated/`.

### 1.2 Dizin başına dosya ve satır sayısı

Komut: `git ls-files <dizin> | wc -l` (dosya) · `git ls-files <dizin> | grep -vE '\.(ico|png|svg)$' | xargs cat | wc -l` (satır).

| Dizin | Dosya | Satır | Not |
|---|---|---|---|
| `src/app` | 84 | 9 064 | 83 metin dosyası + `favicon.ico` (satır sayımına dahil değil) |
| `src/lib` | 37 | 3 551 | 27 kaynak dosya (2 417 satır) + 10 `*.test.ts` (1 134 satır) |
| `src/components` | 9 | 732 | |
| `src/types` | 1 | 22 | |
| `prisma` | 4 | 1 578 | schema 612 + migration.sql 610 + seed 353 + lock 3 |
| `tests/` | — | — | BULUNAMADI (`ls tests` → "No such file or directory") |
| `e2e` | 20 | 2 184 | 18 `*.spec.ts` + `auth.setup.ts` + `helpers.ts` |
| `scripts` | 2 | 162 | |

### 1.3 En büyük 15 dosya

Komut: `git ls-files | grep -vE '\.(ico|png|svg)$' | grep -v package-lock.json | xargs wc -l | sort -rn | head -15`. `package-lock.json` (9 641 satır) listeden çıkarıldı.

| # | Satır | Dosya |
|---|---|---|
| 1 | 612 | `prisma/schema.prisma` |
| 2 | 610 | `prisma/migrations/20260723175607_init_v2/migration.sql` |
| 3 | 498 | `PRD_V2.md` |
| 4 | 450 | `UYGULAMA_PLANI.md` |
| 5 | 426 | `src/app/(admin)/dealers/actions.ts` |
| 6 | 381 | `src/app/(seller)/my-orders/OrderForm.tsx` |
| 7 | 371 | `e2e/admin/congress.spec.ts` |
| 8 | 364 | `src/app/(admin)/congresses/actions.ts` |
| 9 | 353 | `prisma/seed.ts` |
| 10 | 318 | `src/app/(admin)/doctors/[id]/page.tsx` |
| 11 | 281 | `src/lib/congress-service.ts` |
| 12 | 263 | `src/app/(admin)/collections/actions.ts` |
| 13 | 261 | `src/app/(admin)/congresses/CongressForms.tsx` |
| 14 | 254 | `e2e/admin/dealer.spec.ts` |
| 15 | 238 | `src/app/(admin)/commissions/page.tsx` |

### 1.4 `package.json`

`name` `medikal-satis-operasyon` · `version` `0.1.0` · `private` `true` (`package.json:2-4`).

**scripts** (`package.json:5-22`)

| Script | Komut | Satır |
|---|---|---|
| `dev` | `next dev` | 6 |
| `build` | `next build` | 7 |
| `start` | `next start` | 8 |
| `lint` | `eslint` | 9 |
| `typecheck` | `tsc --noEmit` | 10 |
| `db:seed` | `tsx prisma/seed.ts` | 11 |
| `db:reset` | `prisma migrate reset --force` | 12 |
| `db:up` | `docker compose up -d` | 13 |
| `db:down` | `docker compose down` | 14 |
| `test` | `vitest run` | 15 |
| `test:watch` | `vitest` | 16 |
| `test:e2e` | `playwright test` | 17 |
| `test:e2e:ui` | `playwright test --ui` | 18 |
| `test:e2e:report` | `playwright show-report` | 19 |
| `backup` | `tsx scripts/backup.ts` | 20 |
| `job:expire` | `tsx scripts/expire-congress-balances.ts` | 21 |

**Bağımlılıklar** — "Çözülen" sütunu `package-lock.json` → `packages["node_modules/<ad>"].version` (lockfileVersion 3).

| Paket | Tür | `package.json` aralığı | Çözülen |
|---|---|---|---|
| `@prisma/adapter-pg` | dep | `^7.9.0` | 7.9.0 |
| `@prisma/client` | dep | `^7.8.0` | 7.8.0 |
| `bcryptjs` | dep | `^3.0.3` | 3.0.3 |
| `lucide-react` | dep | `^1.25.0` | 1.25.0 |
| `next` | dep | `16.2.10` | 16.2.10 |
| `next-auth` | dep | `^5.0.0-beta.31` | 5.0.0-beta.31 |
| `pg` | dep | `^8.22.0` | 8.22.0 |
| `prisma` | dep | `^7.8.0` | 7.8.0 |
| `react` | dep | `19.2.4` | 19.2.4 |
| `react-dom` | dep | `19.2.4` | 19.2.4 |
| `zod` | dep | `^4.4.3` | 4.4.3 |
| `@playwright/test` | dev | `^1.61.1` | 1.61.1 |
| `@tailwindcss/postcss` | dev | `^4` | 4.3.2 |
| `@types/bcryptjs` | dev | `^2.4.6` | 2.4.6 |
| `@types/node` | dev | `^20` | 20.19.43 |
| `@types/pg` | dev | `^8.20.0` | 8.20.0 |
| `@types/react` | dev | `^19` | 19.2.17 |
| `@types/react-dom` | dev | `^19` | 19.2.3 |
| `dotenv` | dev | `^17.4.2` | 17.4.2 |
| `eslint` | dev | `^9` | 9.39.5 |
| `eslint-config-next` | dev | `16.2.10` | 16.2.10 |
| `playwright` | dev | `^1.61.1` | 1.61.1 |
| `tailwindcss` | dev | `^4` | 4.3.2 |
| `tsx` | dev | `^4.23.1` | 4.23.1 |
| `typescript` | dev | `^5` | 5.9.3 |
| `vitest` | dev | `^3.2.4` | 3.2.7 |

Dolaylı ama bu raporda atıf yapılan paketler (lock'tan): `@auth/core` 0.41.2 · `jose` 6.2.3 · `@prisma/engines` 7.8.0 · `@prisma/driver-adapter-utils` 7.9.0 · `typescript-eslint` / `@typescript-eslint/parser` / `@typescript-eslint/eslint-plugin` 8.64.0 · `@next/eslint-plugin-next` 16.2.10 · `eslint-plugin-react-hooks` 7.1.1.

---

## 2. Kimlik ve oturum katmanı

### 2.1 Sürüm

| Paket | Çözülen sürüm | Kaynak |
|---|---|---|
| `next-auth` | **5.0.0-beta.31** | `package-lock.json` → `node_modules/next-auth`; `node_modules/next-auth/package.json` aynı |
| `@auth/core` | 0.41.2 | `package-lock.json` → `node_modules/@auth/core` |
| `bcryptjs` | 3.0.3 | `package-lock.json` |

### 2.2 Auth yapılandırma dosyası — `src/lib/auth.ts` (80 satır)

Dosya 30 satırı aştığı için istenen bloklar ayrı verildi, `authorize` gövdesi tabloyla özetlendi.

**`NextAuth` çağrısı, `session` bloğu, `pages` bloğu, provider başlangıcı** (`src/lib/auth.ts:9-17`):

```ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
```

**`callbacks` bloğu** (`src/lib/auth.ts:64-79`):

```ts
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
```

**`authorize` gövdesi özeti** (`src/lib/auth.ts:18-61`):

| Adım | Satır |
|---|---|
| `email` veya `password` yoksa `null` | 19-21 |
| `checkLock(email)` kilitliyse `null` | 24 |
| `prisma.user.findUnique({ where: { email } })` | 26 |
| Kullanıcı yok veya `status !== "ACTIVE"` → `recordFailure` + `AUTH_LOGIN_FAILURE` audit + `null` | 27-35 |
| `bcrypt.compare(password, user.passwordHash)` false → `recordFailure` + audit + `null` | 37-46 |
| Başarı → `reset(email)` + `AUTH_LOGIN_SUCCESS` audit | 48-54 |
| Dönüş `{ id, name, email, role }` | 55-60 |

Yapılandırmada **olmayan** anahtarlar: `adapter`, `secret`, `trustHost`, `jwt`, `cookies`, `events` (`src/lib/auth.ts` tamamı okunarak; `git grep -n adapter -- src/lib/auth.ts` → 0). `AUTH_SECRET` değişkeni `.env.example:10`'da tanımlı.

Tip genişletmesi: `src/types/next-auth.d.ts:4-15` (`Session.user.id`, `Session.user.role`, `User.role`), `:17-22` (`JWT.id`, `JWT.role`).

Route handler: `src/app/api/auth/[...nextauth]/route.ts:1-3` → `export const { GET, POST } = handlers;`

### 2.3 `requireSession()` — tam gövde

`src/lib/session.ts:19-39`:

```ts
const loadActiveUser = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
});

/** Oturum yoksa veya kullanıcı artık geçerli değilse /login'e yönlendirir. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await loadActiveUser(session.user.id);
  if (!user || user.status !== "ACTIVE") redirect("/login");

  // Token'daki role değil, veritabanındaki güncel role güvenilir.
  session.user.role = user.role;
  session.user.name = user.name;
  session.user.email = user.email;
  return session;
}
```

| Soru | Bulgu | Adres |
|---|---|---|
| Hangi tablo / sorgu | `User` · `findUnique({ where: { id }, select: { id, name, email, role, status } })` | `src/lib/session.ts:20-23` |
| Memoization | `import { cache } from "react"`; yalnız `loadActiveUser` (userId anahtarlı) sarılı; `auth()` çağrısı sarılı değil | `src/lib/session.ts:1`, `:19`, `:28` |
| Yorumda belirtilen kapsam | "istek başına tekilleştirilir: aynı render'da layout + sayfa + action'lar defalarca çağırsa da tek sorgu atılır" | `src/lib/session.ts:16-17` |
| Kodda yazılı DB sorgusu (bir `requireSession` çağrısı) | 1 × `user.findUnique` (cache içinde). `auth()` yapılandırmasında adapter ve callback'lerde Prisma çağrısı yok | `src/lib/auth.ts:10`, `:64-79` |
| Bayi ek sorgusu | `requireDealerAccount` → `requireDealer` + 1 × `dealer.findUnique({ where: { userId } })`; **cache sarmalı yok** | `src/lib/dealer-session.ts:12-23` |
| Bayi sayfası render'ında `dealer.findUnique` | layout (`src/app/(dealer)/layout.tsx:24`) + sayfa (ör. `src/app/(dealer)/bayi/page.tsx:18`) → yazılı 2 çağrı | — |

Sarmalayıcılar: `requireAdmin` (`src/lib/session.ts:42-46`), `requireSeller` (`:49-53`), `requireDealer` (`:56-60`); rol uyuşmazsa `redirect(homeFor(role))`.

### 2.4 Çağrı noktaları

Komut: `git grep -nE '\b<fonksiyon>\('` (tanım satırları düşülerek; `e2e/seller/session-revocation.spec.ts:10`'daki yorum satırı düşüldü).

| Fonksiyon | Tanım | Çağrı sayısı | Dosya sayısı |
|---|---|---|---|
| `requireSession` | `src/lib/session.ts:27` | 3 (`session.ts:43,50,57` — yalnız sarmalayıcılardan) | 1 |
| `requireAdmin` | `src/lib/session.ts:42` | 48 | 24 |
| `requireSeller` | `src/lib/session.ts:49` | 13 | 12 |
| `requireDealer` | `src/lib/session.ts:56` | 1 (`src/lib/dealer-session.ts:13`) | 1 |
| `requireDealerAccount` | `src/lib/dealer-session.ts:12` | 8 | 7 |
| `auth()` (doğrudan) | `src/lib/auth.ts:9` | 3 (`src/app/page.tsx:6`, `src/lib/auth-actions.ts:45`, `src/lib/session.ts:28`) | 3 |

**Katmana göre rol-guard çağrıları** (`requireAdmin` + `requireSeller` + `requireDealerAccount` = 69):

| Katman | Sayı | Ayrıntı |
|---|---|---|
| middleware / proxy | 0 | dosya yok (§2.5) |
| layout | 3 | `src/app/(admin)/layout.tsx:42`, `src/app/(seller)/layout.tsx:24`, `src/app/(dealer)/layout.tsx:24` |
| page | 25 | admin 12 · seller 8 · dealer 5 |
| server action | 41 | admin 35 (11 dosya) · seller 4 (3 dosya) · dealer 2 (1 dosya) |

**`requireAdmin` çağıran dosyalar (24):** `(admin)/layout.tsx` (1); sayfalar — `audit-logs/page.tsx:14`, `collections/page.tsx:24`, `commissions/page.tsx:29`, `congresses/[id]/edit/page.tsx:19`, `congresses/page.tsx:22`, `dealer-shipments/page.tsx:17`, `dealers/[id]/page.tsx:31`, `dealers/new/page.tsx:6`, `dealers/page.tsx:9`, `doctors/[id]/page.tsx:42`, `doctors/page.tsx:16`, `reports/page.tsx:19`; action dosyaları — `collections/actions.ts` (3: 42,143,209), `commissions/actions.ts` (2: 41,115), `congresses/actions.ts` (9: 61,87,115,139,188,219,249,278,328), `dealers/actions.ts` (8: 27,90,181,208,264,302,361,395), `doctors/[id]/actions.ts` (1: 23), `doctors/actions.ts` (1: 19), `orders/actions.ts` (3: 18,39,70), `products/actions.ts` (3: 54,99,129), `sellers/actions.ts` (3: 17,66,119), `shipping/actions.ts` (1: 12), `stock/actions.ts` (1: 15). (Tümü `src/app/(admin)/` altında.)

**`requireSeller` çağıran dosyalar (12):** `(seller)/layout.tsx:24`; sayfalar — `account/page.tsx:18`, `my-commissions/page.tsx:14`, `my-congresses/page.tsx:24`, `my-doctors/[id]/edit/page.tsx:14`, `my-doctors/page.tsx:21`, `my-orders/[id]/page.tsx:14`, `my-orders/new/page.tsx:9`, `my-orders/page.tsx:21`; actions — `my-congresses/actions.ts:25`, `my-doctors/actions.ts:51,113`, `my-orders/actions.ts:35`. (Tümü `src/app/(seller)/` altında.)

**`requireDealerAccount` çağıran dosyalar (7):** `(dealer)/layout.tsx:24`, `bayi/fiyatlar/page.tsx:9`, `bayi/odemeler/page.tsx:20`, `bayi/page.tsx:18`, `bayi/sevkiyatlar/page.tsx:23`, `bayi/talep/page.tsx:10`, `bayi/talep/actions.ts:23,79`. (Tümü `src/app/(dealer)/` altında.)

**Kendi guard çağrısı olmayan sayfalar** (yalnız grup layout'u çalışıyor) — 13:
admin (12): `dashboard/page.tsx`, `orders/page.tsx`, `orders/[id]/page.tsx`, `products/page.tsx`, `products/new/page.tsx`, `products/[id]/edit/page.tsx`, `sellers/page.tsx`, `sellers/new/page.tsx`, `sellers/[id]/page.tsx`, `sellers/[id]/edit/page.tsx`, `shipping/page.tsx`, `stock/page.tsx`; seller (1): `my-doctors/new/page.tsx`.

**Guard'sız sayfalar** (grup dışı) — 3: `src/app/page.tsx` (`auth()` + `redirect`), `src/app/login/page.tsx`, `src/app/privacy/page.tsx`.

**Rol guard'ı çağırmayan export edilmiş server action** — 2: `loginAction` (`src/lib/auth-actions.ts:14`), `logoutAction` (`src/lib/auth-actions.ts:44`, `auth()` kullanır).

### 2.5 `middleware.ts`

BULUNAMADI. Bakılan: `git ls-files | grep -iE 'middleware|proxy'` → 0 sonuç; `ls src/middleware.ts src/proxy.ts middleware.ts proxy.ts` → dördü de yok. `matcher` deseni: BULUNAMADI.

### 2.6 `next-auth` / `@auth/*` import eden dosyalar

Komut: `git grep -nE 'from ["'"'"']next-auth[^"'"'"']*["'"'"']'` ve `'from ["'"'"']@auth/'`.

| Dosya:satır | Modül | Sembol |
|---|---|---|
| `src/lib/auth.ts:1` | `next-auth` | `NextAuth` (default) |
| `src/lib/auth.ts:2` | `next-auth/providers/credentials` | `Credentials` (default) |
| `src/lib/auth-actions.ts:3` | `next-auth` | `AuthError` |
| `src/types/next-auth.d.ts:2` | `next-auth` | `type DefaultSession` |

- Toplam: **3 dosya, 4 import ifadesi**. `@auth/*` import: 0.
- Sembol başına: `NextAuth` 1 · `Credentials` 1 · `AuthError` 1 · `DefaultSession` (tip) 1 · `getServerSession` 0 · `useSession` 0 · `SessionProvider` 0.
- Modül genişletme: `declare module "next-auth"` (`src/types/next-auth.d.ts:4`), `declare module "next-auth/jwt"` (`:17`).
- `src/lib/auth.ts:9`'un dışa verdiği sembolleri import edenler (`from "@/lib/auth"`): `auth` → `src/lib/session.ts:3`, `src/lib/auth-actions.ts:4`, `src/app/page.tsx:2` (3) · `signIn` → `src/lib/auth-actions.ts:4` (1) · `signOut` → `src/lib/auth-actions.ts:4` (1) · `handlers` → `src/app/api/auth/[...nextauth]/route.ts:1` (1).

### 2.7 JWT token alanları

| Alan | Kaynak | Adres |
|---|---|---|
| `name`, `email`, `picture`, `sub` | Credentials varsayılan token'ı (`picture: user.image`; `authorize` `image` döndürmüyor) | `node_modules/@auth/core/lib/actions/callback/index.js:247-252`; `src/lib/auth.ts:55-60` |
| `id` | `jwt` callback (`user` varken) | `src/lib/auth.ts:67` |
| `role` | `jwt` callback (`user` varken) | `src/lib/auth.ts:68` |
| `iat`, `exp`, `jti` | `encode` | `node_modules/@auth/core/jwt.js:57-59` |

`session` callback'i `token.id` ve `token.role`'ü `session.user`'a kopyalar (`src/lib/auth.ts:74-75`); `requireSession` `role`, `name`, `email`'i DB değeriyle üzerine yazar (`src/lib/session.ts:35-37`).

### 2.8 Oturum süresi

Projede ayar yok: `git grep -nE 'maxAge|updateAge' -- src` → 0 (`src/components/VatToggle.tsx:7` ve `OrderForm.tsx:22`'deki `max-age=31536000` KDV çerezi içindir). `src/lib/auth.ts:10` yalnız `strategy: "jwt"` içerir. Kütüphane varsayılanları (`@auth/core` 0.41.2):

| Ayar | Değer | Adres |
|---|---|---|
| `session.maxAge` | `30 * 24 * 60 * 60` (30 gün) | `node_modules/@auth/core/lib/init.js:38`, `:75` |
| `session.updateAge` | `24 * 60 * 60` (24 saat) | `node_modules/@auth/core/lib/init.js:76` |
| `jwt.maxAge` | `config.session?.maxAge ?? maxAge` | `node_modules/@auth/core/lib/init.js:83` |

### 2.9 Rol kontrolü

- **Ortak guard'lar var:** `requireAdmin` / `requireSeller` / `requireDealer` (`src/lib/session.ts:42-60`) ve bayi kaydı bağlayan `requireDealerAccount` (`src/lib/dealer-session.ts:12-23`). Rol → ana sayfa haritası tek yerde: `ROLE_HOME` (`src/lib/roles.ts:10-14`), `homeFor` (`:16-18`).
- **Kontrol noktası sayısı:** 69 guard çağrısı (§2.4). Satır içi rol karşılaştırması (`git grep -nE 'role\s*(===|!==)\s*"(ADMIN|SELLER|DEALER)"'`): 4 — `src/lib/session.ts:44,51,58` (guard içleri) ve `src/lib/doctor.ts:49` (`doctorScopeFor`, çağrı: `src/app/(seller)/my-doctors/page.tsx:25`).
- **Örnek üç adres:** `src/app/(admin)/layout.tsx:42` · `src/app/(admin)/collections/actions.ts:42` · `src/app/(dealer)/bayi/talep/actions.ts:23`.
- Nesne düzeyi kapsama örnekleri (rol dışı): `src/app/(seller)/my-orders/[id]/page.tsx:17` (`sellerId: session.user.id`), `src/app/(seller)/my-doctors/[id]/edit/page.tsx:18-19`, `src/app/(seller)/my-doctors/actions.ts:120`, `src/app/(dealer)/bayi/talep/actions.ts:87`.

### 2.10 Giriş akışı

| Parça | Bulgu | Adres |
|---|---|---|
| UI | istemci bileşeni; `useActionState(loginAction, initialState)` | `src/app/login/page.tsx:1`, `:11`, `:31` |
| Tür | **server action** `loginAction` → `checkLock` → `signIn("credentials", { email, password, redirectTo: "/" })`; `AuthError` yakalanır, diğer hatalar yeniden fırlatılır | `src/lib/auth-actions.ts:14-42` (`:21`, `:25-29`, `:32-38`, `:40`) |
| Route handler | `/api/auth/[...nextauth]` `GET`/`POST` (Auth.js handlers) | `src/app/api/auth/[...nextauth]/route.ts:3` |
| Parola doğrulama | `bcryptjs` 3.0.3 `bcrypt.compare` | `src/lib/auth.ts:3`, `:37` |
| Parola hash üretimi | `bcrypt.hash(<parola>, 10)` | `src/app/(admin)/sellers/actions.ts:42,91` · `src/app/(admin)/dealers/actions.ts:60` · `prisma/seed.ts:46,47,303` |
| Parola uzunluk kontrolü | satıcı `< 4` reddi; bayi login `< 6` reddi | `src/app/(admin)/sellers/actions.ts:25`, `:89` · `src/app/(admin)/dealers/actions.ts:36` |
| E-posta biçimi | `authorize` e-postayı olduğu gibi sorgular; rate-limit anahtarı `trim().toLowerCase()`; satıcı oluştur/güncelle `toLowerCase()`; bayi login e-postası yalnız `trim()` | `src/lib/auth.ts:26` · `src/lib/rate-limit.ts:20-22` · `src/app/(admin)/sellers/actions.ts:20,69` · `src/app/(admin)/dealers/actions.ts:34` |
| Çıkış | `logoutAction`: `AUTH_LOGOUT` audit + `signOut({ redirectTo: "/login" })` | `src/lib/auth-actions.ts:44-55`; tetikleyici `src/components/LogoutButton.tsx:7` |
| Giriş sonrası yönlendirme | `redirect(homeFor(session.user.role))` | `src/app/page.tsx:9` |

### 2.11 `LoginAttempt` tablosu

**Şema** (`prisma/schema.prisma:588-593`; DDL `prisma/migrations/20260723175607_init_v2/migration.sql:385-392`):

| Alan | Prisma tipi | Nullable | Nitelik | SQL |
|---|---|---|---|---|
| `key` | String | hayır | `@id` (yorum: normalize edilmiş e-posta) | `TEXT NOT NULL`, PK |
| `failures` | Int | hayır | `@default(0)` | `INTEGER NOT NULL DEFAULT 0` |
| `lockedUntil` | DateTime | evet | — | `TIMESTAMP(3)` |
| `updatedAt` | DateTime | hayır | `@updatedAt` | `TIMESTAMP(3) NOT NULL` |

FK yok (User'a bağlı değil).

**Kod noktaları** (`git grep -n 'loginAttempt'` → 5 geçiş, 2 dosya):

| Tür | Adres | İşlem |
|---|---|---|
| Okuyan | `src/lib/rate-limit.ts:37-39` | `findUnique` (`checkLock`) |
| Okuyan | `src/lib/rate-limit.ts:46` | `findUnique` (`recordFailure`) |
| Yazan | `src/lib/rate-limit.ts:55-59` | `upsert` (`recordFailure`) |
| Yazan (silen) | `src/lib/rate-limit.ts:66` | `deleteMany({ where: { key } })` (`reset`) |
| Yazan (silen) | `prisma/seed.ts:24` | `deleteMany()` |

Çağıranlar: `checkLock` → `src/lib/auth.ts:24`, `src/lib/auth-actions.ts:21`, `:34` · `recordFailure` → `src/lib/auth.ts:28`, `:39` · `reset` → `src/lib/auth.ts:48`.

| Parametre | Değer | Adres |
|---|---|---|
| Kilit eşiği | `MAX_FAILURES = 5` | `src/lib/rate-limit.ts:17` |
| Kilit süresi | `LOCK_MS = 10 * 60 * 1000` (10 dk) | `src/lib/rate-limit.ts:18` |
| Süresi dolmuş kilit sonrası | sayaç 0'dan başlar | `src/lib/rate-limit.ts:48-51` |

**Eski kayıt temizliği:** zamanlanmış/toplu temizlik mekanizması BULUNAMADI. Bakılan: `scripts/` (2 dosya), `package.json` scripts, `.github/workflows/ci.yml`, `git grep -n loginAttempt`. Satır silme yalnız başarılı girişte o anahtar için (`src/lib/rate-limit.ts:66`) ve seed'de (`prisma/seed.ts:24`).

### 2.12 Parola alanı

- Ad/tip: `User.passwordHash` · `String` · nullable değil (`prisma/schema.prisma:54`; SQL `"passwordHash" TEXT NOT NULL`, `migration.sql:40`).
- `parola_degistirmeli` benzeri alan: **yok**. `User` skaler alanları (`prisma/schema.prisma:50-60`): `id, name, email, phone, passwordHash, role, status, createdAt, commissionRate`. `git grep -niE 'mustChange|changePassword|password_?change|forcePassword|resetPassword' -- src prisma e2e` → 0.

---

## 3. Veritabanı ve migration

### 3.1 `prisma/schema.prisma` — modeller ve enum'lar

Sayım: `grep -cE '^model ' prisma/schema.prisma` → **25 model** · `grep -cE '^enum ' prisma/schema.prisma` → **11 enum** · `grep -c '@db\.' prisma/schema.prisma` → **0** (`@db.*` niteleyicisi hiçbir alanda yok). `datasource db { provider = "postgresql" }` (`prisma/schema.prisma:14-16`, `url` yok).

**Enum'lar**

| Enum | Değerler | Adres |
|---|---|---|
| `Role` | ADMIN, SELLER, DEALER | schema.prisma:18 |
| `EntityStatus` | ACTIVE, PASSIVE | schema.prisma:24 |
| `OrderStatus` | PENDING, PREPARING, SHIPPED, DELIVERED, CANCELLED | schema.prisma:29 |
| `StockMovementType` | IN, OUT | schema.prisma:37 |
| `PaymentMethod` | CASH, TRANSFER, CARD, OTHER | schema.prisma:42 |
| `PaymentStatus` | AKTIF, IPTAL | schema.prisma:230 |
| `CommissionStatus` | HESAPLANDI, ONAYLANDI, ODENDI | schema.prisma:294 |
| `CongressStatus` | TASLAK, YAYINDA, TAMAMLANDI, IPTAL | schema.prisma:356 |
| `CongressRegistrationStatus` | TALEP, ONAYLANDI, IPTAL, REDDEDILDI | schema.prisma:363 |
| `CongressLedgerType` | EARN, SPEND, ADJUST, EXPIRE | schema.prisma:370 |
| `DealerShipmentStatus` | TALEP, ONAYLANDI, IPTAL, REDDEDILDI | schema.prisma:480 |

**Modeller** (bildirim satırı): User :49 · Doctor :74 · DoctorAssignment :106 · Product :122 · StockMovement :142 · Order :158 · OrderItem :193 · Shipment :213 · DoctorPayment :237 · PaymentAllocation :263 · DueDateChange :278 · CommissionPeriod :303 · CommissionAdjustment :328 · Congress :377 · CongressPackage :394 · CongressRegistration :411 · CongressLedger :438 · SystemSetting :467 · Dealer :487 · DealerPrice :510 · DealerShipment :524 · DealerShipmentItem :553 · DealerPayment :570 · LoginAttempt :588 · AuditLog :599.

**Skaler alanlar** — tablo `prisma/schema.prisma` satır satır ayrıştırılarak üretildi (betik: alan satırı `ad Tip[?]`; FK = aynı modelde `@relation(fields: [x])` taşıyan ilişki alanı; "FK hedefi · ON DELETE" sütunu `migration.sql`'deki `ALTER TABLE … FOREIGN KEY` satırlarından eşlendi, 30/30 eşleşti). İlişki (sanal) alanları tablonun altında ayrıca listelendi.

| Model | Alan | Prisma tipi | `@db.*` | Nullable | FK hedefi · ON DELETE | Nitelikler | Satır |
|---|---|---|---|---|---|---|---|
| User | `id` | String | — | hayır | — | @id @default(cuid()) | 50 |
| User | `name` | String | — | hayır | — | — | 51 |
| User | `email` | String | — | hayır | — | @unique | 52 |
| User | `phone` | String | — | evet | — | — | 53 |
| User | `passwordHash` | String | — | hayır | — | — | 54 |
| User | `role` | Role (enum) | — | hayır | — | @default(SELLER) | 55 |
| User | `status` | EntityStatus (enum) | — | hayır | — | @default(ACTIVE) | 56 |
| User | `createdAt` | DateTime | — | hayır | — | @default(now()) | 57 |
| User | `commissionRate` | Float | — | evet | — | — | 60 |
| Doctor | `id` | String | — | hayır | — | @id @default(cuid()) | 75 |
| Doctor | `fullName` | String | — | hayır | — | — | 76 |
| Doctor | `title` | String | — | evet | — | — | 77 |
| Doctor | `specialty` | String | — | evet | — | — | 78 |
| Doctor | `clinic` | String | — | hayır | — | — | 79 |
| Doctor | `region` | String | — | hayır | — | — | 80 |
| Doctor | `city` | String | — | evet | — | — | 81 |
| Doctor | `email` | String | — | evet | — | — | 82 |
| Doctor | `phoneNormalized` | String | — | hayır | — | @unique | 85 |
| Doctor | `ownerSellerId` | String | — | evet | User.id · SET NULL | — | 90 |
| Doctor | `status` | EntityStatus (enum) | — | hayır | — | @default(ACTIVE) | 92 |
| Doctor | `createdAt` | DateTime | — | hayır | — | @default(now()) | 93 |
| Doctor | _model nitelikleri_ | | | | | @@index([ownerSellerId]) (:101); @@index([fullName]) (:102) | |
| DoctorAssignment | `id` | String | — | hayır | — | @id @default(cuid()) | 107 |
| DoctorAssignment | `doctorId` | String | — | hayır | Doctor.id · CASCADE | — | 109 |
| DoctorAssignment | `sellerId` | String | — | hayır | User.id · RESTRICT | — | 111 |
| DoctorAssignment | `fromDate` | DateTime | — | hayır | — | @default(now()) | 113 |
| DoctorAssignment | `toDate` | DateTime | — | evet | — | — | 114 |
| DoctorAssignment | `assignedBy` | String | — | hayır | — | — | 115 |
| DoctorAssignment | `reason` | String | — | evet | — | — | 116 |
| DoctorAssignment | _model nitelikleri_ | | | | | @@index([doctorId]) (:118); @@index([sellerId]) (:119) | |
| Product | `id` | String | — | hayır | — | @id @default(cuid()) | 123 |
| Product | `name` | String | — | hayır | — | — | 124 |
| Product | `code` | String | — | hayır | — | @unique | 125 |
| Product | `netListPrice` | BigInt | — | hayır | — | — | 128 |
| Product | `netMinPrice` | BigInt | — | hayır | — | @default(0) | 129 |
| Product | `vatRate` | Int | — | hayır | — | @default(20) | 130 |
| Product | `stock` | Int | — | hayır | — | @default(0) | 132 |
| Product | `status` | EntityStatus (enum) | — | hayır | — | @default(ACTIVE) | 133 |
| Product | `createdAt` | DateTime | — | hayır | — | @default(now()) | 134 |
| StockMovement | `id` | String | — | hayır | — | @id @default(cuid()) | 143 |
| StockMovement | `productId` | String | — | hayır | Product.id · RESTRICT | — | 145 |
| StockMovement | `type` | StockMovementType (enum) | — | hayır | — | — | 146 |
| StockMovement | `quantity` | Int | — | hayır | — | — | 147 |
| StockMovement | `note` | String | — | evet | — | — | 148 |
| StockMovement | `orderId` | String | — | evet | Order.id · SET NULL | — | 150 |
| StockMovement | `dealerShipmentId` | String | — | evet | — | — | 152 |
| StockMovement | `createdAt` | DateTime | — | hayır | — | @default(now()) | 153 |
| StockMovement | _model nitelikleri_ | | | | | @@index([productId]) (:155) | |
| Order | `id` | String | — | hayır | — | @id @default(cuid()) | 159 |
| Order | `sellerId` | String | — | hayır | User.id · RESTRICT | — | 161 |
| Order | `doctorId` | String | — | hayır | Doctor.id · RESTRICT | — | 167 |
| Order | `status` | OrderStatus (enum) | — | hayır | — | @default(PENDING) | 169 |
| Order | `netTotal` | BigInt | — | hayır | — | — | 172 |
| Order | `vatTotal` | BigInt | — | hayır | — | — | 173 |
| Order | `grossTotal` | BigInt | — | hayır | — | — | 174 |
| Order | `dueDate` | DateTime | — | hayır | — | — | 177 |
| Order | `orderDate` | DateTime | — | hayır | — | @default(now()) | 179 |
| Order | `createdAt` | DateTime | — | hayır | — | @default(now()) | 180 |
| Order | _model nitelikleri_ | | | | | @@index([sellerId]) (:188); @@index([doctorId]) (:189); @@index([status]) (:190) | |
| OrderItem | `id` | String | — | hayır | — | @id @default(cuid()) | 194 |
| OrderItem | `orderId` | String | — | hayır | Order.id · CASCADE | — | 196 |
| OrderItem | `productId` | String | — | hayır | Product.id · RESTRICT | — | 198 |
| OrderItem | `quantity` | Int | — | hayır | — | — | 199 |
| OrderItem | `netUnitPrice` | BigInt | — | hayır | — | — | 202 |
| OrderItem | `listPriceAtSale` | BigInt | — | hayır | — | — | 203 |
| OrderItem | `discountRate` | Float | — | hayır | — | @default(0) | 204 |
| OrderItem | `vatRate` | Int | — | hayır | — | — | 205 |
| OrderItem | `vatAmount` | BigInt | — | hayır | — | — | 206 |
| OrderItem | `lineNetTotal` | BigInt | — | hayır | — | — | 207 |
| OrderItem | `lineGrossTotal` | BigInt | — | hayır | — | — | 208 |
| OrderItem | _model nitelikleri_ | | | | | @@index([orderId]) (:210) | |
| Shipment | `id` | String | — | hayır | — | @id @default(cuid()) | 214 |
| Shipment | `orderId` | String | — | hayır | Order.id · CASCADE | @unique | 216 |
| Shipment | `carrier` | String | — | evet | — | — | 217 |
| Shipment | `trackingNumber` | String | — | evet | — | — | 218 |
| Shipment | `shippedAt` | DateTime | — | evet | — | — | 219 |
| Shipment | `status` | OrderStatus (enum) | — | hayır | — | @default(SHIPPED) | 220 |
| Shipment | `createdAt` | DateTime | — | hayır | — | @default(now()) | 221 |
| DoctorPayment | `id` | String | — | hayır | — | @id @default(cuid()) | 238 |
| DoctorPayment | `doctorId` | String | — | hayır | Doctor.id · RESTRICT | — | 240 |
| DoctorPayment | `amount` | BigInt | — | hayır | — | — | 242 |
| DoctorPayment | `method` | PaymentMethod (enum) | — | hayır | — | @default(TRANSFER) | 243 |
| DoctorPayment | `paidAt` | DateTime | — | hayır | — | @default(now()) | 244 |
| DoctorPayment | `referenceNo` | String | — | evet | — | — | 245 |
| DoctorPayment | `invoiceNo` | String | — | evet | — | — | 246 |
| DoctorPayment | `note` | String | — | evet | — | — | 247 |
| DoctorPayment | `status` | PaymentStatus (enum) | — | hayır | — | @default(AKTIF) | 248 |
| DoctorPayment | `recordedBy` | String | — | hayır | — | — | 249 |
| DoctorPayment | `cancelledAt` | DateTime | — | evet | — | — | 250 |
| DoctorPayment | `cancelledBy` | String | — | evet | — | — | 251 |
| DoctorPayment | `cancelReason` | String | — | evet | — | — | 252 |
| DoctorPayment | `createdAt` | DateTime | — | hayır | — | @default(now()) | 253 |
| DoctorPayment | _model nitelikleri_ | | | | | @@index([doctorId]) (:257); @@index([status]) (:258) | |
| PaymentAllocation | `id` | String | — | hayır | — | @id @default(cuid()) | 264 |
| PaymentAllocation | `paymentId` | String | — | hayır | DoctorPayment.id · CASCADE | — | 266 |
| PaymentAllocation | `orderId` | String | — | hayır | Order.id · RESTRICT | — | 268 |
| PaymentAllocation | `amount` | BigInt | — | hayır | — | — | 270 |
| PaymentAllocation | `createdAt` | DateTime | — | hayır | — | @default(now()) | 271 |
| PaymentAllocation | _model nitelikleri_ | | | | | @@index([paymentId]) (:273); @@index([orderId]) (:274) | |
| DueDateChange | `id` | String | — | hayır | — | @id @default(cuid()) | 279 |
| DueDateChange | `orderId` | String | — | hayır | Order.id · CASCADE | — | 281 |
| DueDateChange | `oldDueDate` | DateTime | — | hayır | — | — | 283 |
| DueDateChange | `newDueDate` | DateTime | — | hayır | — | — | 284 |
| DueDateChange | `changedBy` | String | — | hayır | — | — | 285 |
| DueDateChange | `reason` | String | — | evet | — | — | 286 |
| DueDateChange | `changedAt` | DateTime | — | hayır | — | @default(now()) | 287 |
| DueDateChange | _model nitelikleri_ | | | | | @@index([orderId]) (:289) | |
| CommissionPeriod | `id` | String | — | hayır | — | @id @default(cuid()) | 304 |
| CommissionPeriod | `sellerId` | String | — | hayır | User.id · RESTRICT | — | 306 |
| CommissionPeriod | `year` | Int | — | hayır | — | — | 308 |
| CommissionPeriod | `month` | Int | — | hayır | — | — | 309 |
| CommissionPeriod | `baseAmount` | BigInt | — | hayır | — | — | 311 |
| CommissionPeriod | `ratePercent` | Float | — | hayır | — | — | 312 |
| CommissionPeriod | `commissionAmount` | BigInt | — | hayır | — | — | 313 |
| CommissionPeriod | `status` | CommissionStatus (enum) | — | hayır | — | @default(HESAPLANDI) | 315 |
| CommissionPeriod | `closedAt` | DateTime | — | hayır | — | @default(now()) | 316 |
| CommissionPeriod | `closedBy` | String | — | hayır | — | — | 317 |
| CommissionPeriod | _model nitelikleri_ | | | | | @@unique([sellerId, year, month]) (:321); @@index([sellerId]) (:322) | |
| CommissionAdjustment | `id` | String | — | hayır | — | @id @default(cuid()) | 329 |
| CommissionAdjustment | `sellerId` | String | — | hayır | User.id · RESTRICT | — | 331 |
| CommissionAdjustment | `year` | Int | — | hayır | — | — | 333 |
| CommissionAdjustment | `month` | Int | — | hayır | — | — | 334 |
| CommissionAdjustment | `amount` | BigInt | — | hayır | — | — | 336 |
| CommissionAdjustment | `reason` | String | — | hayır | — | — | 337 |
| CommissionAdjustment | `sourcePaymentId` | String | — | evet | — | — | 339 |
| CommissionAdjustment | `createdBy` | String | — | hayır | — | — | 340 |
| CommissionAdjustment | `createdAt` | DateTime | — | hayır | — | @default(now()) | 341 |
| CommissionAdjustment | `appliedPeriodId` | String | — | evet | CommissionPeriod.id · SET NULL | — | 345 |
| CommissionAdjustment | _model nitelikleri_ | | | | | @@index([sellerId, year, month]) (:347) | |
| Congress | `id` | String | — | hayır | — | @id @default(cuid()) | 378 |
| Congress | `name` | String | — | hayır | — | — | 379 |
| Congress | `description` | String | — | evet | — | — | 380 |
| Congress | `startDate` | DateTime | — | hayır | — | — | 381 |
| Congress | `endDate` | DateTime | — | hayır | — | — | 382 |
| Congress | `location` | String | — | evet | — | — | 383 |
| Congress | `registrationDeadline` | DateTime | — | evet | — | — | 384 |
| Congress | `quota` | Int | — | evet | — | — | 385 |
| Congress | `status` | CongressStatus (enum) | — | hayır | — | @default(TASLAK) | 386 |
| Congress | `createdAt` | DateTime | — | hayır | — | @default(now()) | 387 |
| Congress | _model nitelikleri_ | | | | | @@index([status]) (:391) | |
| CongressPackage | `id` | String | — | hayır | — | @id @default(cuid()) | 395 |
| CongressPackage | `congressId` | String | — | hayır | Congress.id · CASCADE | — | 397 |
| CongressPackage | `name` | String | — | hayır | — | — | 399 |
| CongressPackage | `value` | BigInt | — | hayır | — | — | 400 |
| CongressPackage | `quota` | Int | — | evet | — | — | 401 |
| CongressPackage | _model nitelikleri_ | | | | | @@index([congressId]) (:405) | |
| CongressRegistration | `id` | String | — | hayır | — | @id @default(cuid()) | 412 |
| CongressRegistration | `packageId` | String | — | hayır | CongressPackage.id · RESTRICT | — | 414 |
| CongressRegistration | `doctorId` | String | — | hayır | Doctor.id · RESTRICT | — | 416 |
| CongressRegistration | `sellerId` | String | — | hayır | — | — | 417 |
| CongressRegistration | `status` | CongressRegistrationStatus (enum) | — | hayır | — | @default(TALEP) | 419 |
| CongressRegistration | `reservedAmount` | BigInt | — | hayır | — | — | 420 |
| CongressRegistration | `requestedAt` | DateTime | — | hayır | — | @default(now()) | 422 |
| CongressRegistration | `approvedAt` | DateTime | — | evet | — | — | 423 |
| CongressRegistration | `approvedBy` | String | — | evet | — | — | 424 |
| CongressRegistration | `cancelledAt` | DateTime | — | evet | — | — | 425 |
| CongressRegistration | `cancelledBy` | String | — | evet | — | — | 426 |
| CongressRegistration | `cancelReason` | String | — | evet | — | — | 427 |
| CongressRegistration | _model nitelikleri_ | | | | | @@index([packageId]) (:431); @@index([doctorId]) (:432); @@index([status]) (:433) | |
| CongressLedger | `id` | String | — | hayır | — | @id @default(cuid()) | 439 |
| CongressLedger | `doctorId` | String | — | hayır | Doctor.id · RESTRICT | — | 441 |
| CongressLedger | `type` | CongressLedgerType (enum) | — | hayır | — | — | 442 |
| CongressLedger | `amount` | BigInt | — | hayır | — | — | 444 |
| CongressLedger | `earnedAt` | DateTime | — | hayır | — | @default(now()) | 447 |
| CongressLedger | `expiresAt` | DateTime | — | evet | — | — | 448 |
| CongressLedger | `remainingAmount` | BigInt | — | hayır | — | @default(0) | 449 |
| CongressLedger | `registrationId` | String | — | evet | CongressRegistration.id · SET NULL | — | 452 |
| CongressLedger | `refType` | String | — | evet | — | — | 454 |
| CongressLedger | `refId` | String | — | evet | — | — | 455 |
| CongressLedger | `note` | String | — | evet | — | — | 456 |
| CongressLedger | `createdBy` | String | — | evet | — | — | 458 |
| CongressLedger | `createdAt` | DateTime | — | hayır | — | @default(now()) | 459 |
| CongressLedger | _model nitelikleri_ | | | | | @@index([doctorId, earnedAt]) (:461); @@index([registrationId]) (:462) | |
| SystemSetting | `key` | String | — | hayır | — | @id | 468 |
| SystemSetting | `value` | String | — | hayır | — | — | 469 |
| SystemSetting | `updatedAt` | DateTime | — | hayır | — | @updatedAt | 470 |
| SystemSetting | `updatedBy` | String | — | evet | — | — | 471 |
| Dealer | `id` | String | — | hayır | — | @id @default(cuid()) | 488 |
| Dealer | `code` | String | — | hayır | — | @unique | 489 |
| Dealer | `title` | String | — | hayır | — | — | 490 |
| Dealer | `taxOffice` | String | — | evet | — | — | 491 |
| Dealer | `taxNo` | String | — | evet | — | — | 492 |
| Dealer | `contactName` | String | — | evet | — | — | 493 |
| Dealer | `phone` | String | — | evet | — | — | 494 |
| Dealer | `email` | String | — | evet | — | — | 495 |
| Dealer | `address` | String | — | evet | — | — | 496 |
| Dealer | `status` | EntityStatus (enum) | — | hayır | — | @default(ACTIVE) | 497 |
| Dealer | `createdAt` | DateTime | — | hayır | — | @default(now()) | 498 |
| Dealer | `userId` | String | — | evet | User.id · SET NULL | @unique | 502 |
| DealerPrice | `id` | String | — | hayır | — | @id @default(cuid()) | 511 |
| DealerPrice | `dealerId` | String | — | hayır | Dealer.id · CASCADE | — | 513 |
| DealerPrice | `productId` | String | — | hayır | Product.id · RESTRICT | — | 515 |
| DealerPrice | `netPrice` | BigInt | — | hayır | — | — | 517 |
| DealerPrice | `vatRate` | Int | — | hayır | — | @default(20) | 518 |
| DealerPrice | _model nitelikleri_ | | | | | @@unique([dealerId, productId]) (:520); @@index([dealerId]) (:521) | |
| DealerShipment | `id` | String | — | hayır | — | @id @default(cuid()) | 525 |
| DealerShipment | `dealerId` | String | — | hayır | Dealer.id · RESTRICT | — | 527 |
| DealerShipment | `status` | DealerShipmentStatus (enum) | — | hayır | — | @default(TALEP) | 529 |
| DealerShipment | `netTotal` | BigInt | — | hayır | — | — | 533 |
| DealerShipment | `vatTotal` | BigInt | — | hayır | — | — | 534 |
| DealerShipment | `grossTotal` | BigInt | — | hayır | — | — | 535 |
| DealerShipment | `requestedByUserId` | String | — | evet | — | — | 537 |
| DealerShipment | `approvedBy` | String | — | evet | — | — | 538 |
| DealerShipment | `approvedAt` | DateTime | — | evet | — | — | 539 |
| DealerShipment | `cancelledBy` | String | — | evet | — | — | 540 |
| DealerShipment | `cancelledAt` | DateTime | — | evet | — | — | 541 |
| DealerShipment | `cancelReason` | String | — | evet | — | — | 542 |
| DealerShipment | `dueDate` | DateTime | — | evet | — | — | 543 |
| DealerShipment | `requestedAt` | DateTime | — | hayır | — | @default(now()) | 545 |
| DealerShipment | _model nitelikleri_ | | | | | @@index([dealerId]) (:549); @@index([status]) (:550) | |
| DealerShipmentItem | `id` | String | — | hayır | — | @id @default(cuid()) | 554 |
| DealerShipmentItem | `shipmentId` | String | — | hayır | DealerShipment.id · CASCADE | — | 556 |
| DealerShipmentItem | `productId` | String | — | hayır | Product.id · RESTRICT | — | 558 |
| DealerShipmentItem | `quantity` | Int | — | hayır | — | — | 560 |
| DealerShipmentItem | `netUnitPrice` | BigInt | — | hayır | — | — | 561 |
| DealerShipmentItem | `vatRate` | Int | — | hayır | — | — | 562 |
| DealerShipmentItem | `vatAmount` | BigInt | — | hayır | — | — | 563 |
| DealerShipmentItem | `lineNetTotal` | BigInt | — | hayır | — | — | 564 |
| DealerShipmentItem | `lineGrossTotal` | BigInt | — | hayır | — | — | 565 |
| DealerShipmentItem | _model nitelikleri_ | | | | | @@index([shipmentId]) (:567) | |
| DealerPayment | `id` | String | — | hayır | — | @id @default(cuid()) | 571 |
| DealerPayment | `dealerId` | String | — | hayır | Dealer.id · RESTRICT | — | 573 |
| DealerPayment | `amount` | BigInt | — | hayır | — | — | 575 |
| DealerPayment | `method` | PaymentMethod (enum) | — | hayır | — | @default(TRANSFER) | 576 |
| DealerPayment | `paidAt` | DateTime | — | hayır | — | @default(now()) | 577 |
| DealerPayment | `referenceNo` | String | — | evet | — | — | 578 |
| DealerPayment | `note` | String | — | evet | — | — | 579 |
| DealerPayment | `recordedBy` | String | — | hayır | — | — | 580 |
| DealerPayment | `createdAt` | DateTime | — | hayır | — | @default(now()) | 581 |
| DealerPayment | _model nitelikleri_ | | | | | @@index([dealerId]) (:583) | |
| LoginAttempt | `key` | String | — | hayır | — | @id | 589 |
| LoginAttempt | `failures` | Int | — | hayır | — | @default(0) | 590 |
| LoginAttempt | `lockedUntil` | DateTime | — | evet | — | — | 591 |
| LoginAttempt | `updatedAt` | DateTime | — | hayır | — | @updatedAt | 592 |
| AuditLog | `id` | String | — | hayır | — | @id @default(cuid()) | 600 |
| AuditLog | `actorId` | String | — | evet | User.id · SET NULL | — | 602 |
| AuditLog | `action` | String | — | hayır | — | — | 603 |
| AuditLog | `entityType` | String | — | hayır | — | — | 604 |
| AuditLog | `entityId` | String | — | evet | — | — | 605 |
| AuditLog | `beforeData` | String | — | evet | — | — | 606 |
| AuditLog | `afterData` | String | — | evet | — | — | 607 |
| AuditLog | `createdAt` | DateTime | — | hayır | — | @default(now()) | 608 |
| AuditLog | _model nitelikleri_ | | | | | @@index([entityType, createdAt]) (:610); @@index([actorId]) (:611) | |

**İlişki (sanal) alanları**

| Model | İlişki alanları |
|---|---|
| User | orders |
| Doctor | ownerSeller |
| DoctorAssignment | doctor |
| Product | orderItems |
| StockMovement | product |
| Order | seller |
| OrderItem | order |
| Shipment | order |
| DoctorPayment | doctor |
| PaymentAllocation | payment |
| DueDateChange | order |
| CommissionPeriod | seller |
| CommissionAdjustment | seller |
| Congress | packages |
| CongressPackage | congress |
| CongressRegistration | package |
| CongressLedger | doctor |
| SystemSetting | — |
| Dealer | user |
| DealerPrice | dealer |
| DealerShipment | dealer |
| DealerShipmentItem | shipment |
| DealerPayment | dealer |
| LoginAttempt | — |
| AuditLog | actor |

Tip dağılımı (yukarıdaki tablodan): `BigInt` 28 alan · `DateTime` 41 alan · `Float` 3 alan (`User.commissionRate`, `OrderItem.discountRate`, `CommissionPeriod.ratePercent`).

### 3.2 `prisma/migrations/`

| Sıra | Klasör | Dosya | SQL satırı |
|---|---|---|---|
| 1 | `20260723175607_init_v2` | `migration.sql` | 610 (`wc -l`) |

Toplam migration klasörü: 1 (`ls prisma/migrations`). İfade dağılımı (`grep -oE '^(CREATE|ALTER|DROP)( UNIQUE)? [A-Z]+' migration.sql | sort | uniq -c`): `CREATE TYPE` 11 · `CREATE TABLE` 25 · `CREATE INDEX` 30 · `CREATE UNIQUE INDEX` 8 · `ALTER TABLE` 30 (hepsi `FOREIGN KEY`) · `PRIMARY KEY` 25 (`grep -c`).

`prisma/migrations/migration_lock.toml` (3 satır):

```toml
# Please do not edit this file manually
# It should be added in your version-control system (e.g., Git)
provider = "postgresql"
```

### 3.3 `prisma.config.ts`, client yolu

`prisma.config.ts` (15 satır):

```ts
// This file was generated by Prisma, and assumes you have installed the following:
// npm install --save-dev prisma dotenv
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

| Soru | Bulgu | Adres |
|---|---|---|
| Generator | `provider = "prisma-client"` | `prisma/schema.prisma:8` |
| Üretim yolu | `output = "../src/generated/prisma"` → `src/generated/prisma/` | `prisma/schema.prisma:9` |
| `.gitignore`'da mı | evet: `/src/generated/prisma` | `.gitignore:44` |
| Diskte mevcut içerik | `browser.ts`, `client.ts`, `commonInputTypes.ts`, `enums.ts`, `internal/`, `models/`, `models.ts` (`ls src/generated/prisma`) | — |
| CI'da üretim | `npx prisma generate` | `.github/workflows/ci.yml:50-51` |

### 3.4 Prisma sürümü ve driver adapter

| Paket | Çözülen | Kullanım |
|---|---|---|
| `prisma` | 7.8.0 | CLI |
| `@prisma/client` | 7.8.0 | client (import yolu `@/generated/prisma/client`, `src/lib/db.ts:1`) |
| `@prisma/engines` | 7.8.0 | — |
| `@prisma/adapter-pg` | 7.9.0 | `PrismaPg` — `src/lib/db.ts:2`, `:21`; `prisma/seed.ts:4`, `:15` |
| `pg` | 8.22.0 | adapter altı sürücü; e2e'de doğrudan `Client` (§3.7) |

`src/lib/db.ts`: `DATABASE_URL` yoksa hata fırlatır (`:13-18`); `globalThis` singleton (`:6-8`, `:28-32`); log seviyesi `development` → `["error","warn"]`, diğer → `["error"]` (`:24`).

### 3.5 `prisma/seed.ts`

353 satır (`wc -l`). Sayılar kod okunarak çıkarıldı (seed çalıştırılmadı).

**Silinen tablolar** (`deleteMany`, `prisma/seed.ts:24-44`) — 21: LoginAttempt, DealerShipmentItem, DealerShipment, DealerPrice, DealerPayment, Dealer, StockMovement, OrderItem, Shipment, Order, DoctorAssignment, CongressLedger, CongressRegistration, CongressPackage, Congress, PaymentAllocation, DueDateChange, DoctorPayment, Doctor, Product, User.
**Silinmeyen tablolar** — 4: SystemSetting, AuditLog, CommissionPeriod, CommissionAdjustment.

**Doldurulan tablolar ve kayıt sayısı** — 14 tablo, **61 kayıt**:

| Tablo | Kayıt | Adres |
|---|---|---|
| User | 5 (1 ADMIN, 3 SELLER, 1 DEALER) | `:50-58`, `:61-71`, `:304-311` |
| Product | 8 | `:82-106` |
| StockMovement | 14 (8 `IN` başlangıç + 6 `OUT`: iptal edilmemiş 4 siparişin kalemleri) | `:97-104`, `:184-200` |
| Doctor | 5 | `:111-143` |
| DoctorAssignment | 5 | `:134-141` |
| Order | 5 (DELIVERED, SHIPPED, PREPARING, PENDING, CANCELLED) | `:218-257` |
| OrderItem | 7 | `:179` (nested create) |
| Shipment | 2 (SHIPPED/DELIVERED siparişler) | `:203-213` |
| DoctorPayment | 1 (tutar `grossTotal / 3n`) | `:267-277` |
| PaymentAllocation | 1 | `:278-280` |
| Congress | 1 | `:284-294` |
| CongressPackage | 2 | `:295-300` |
| Dealer | 2 (biri login'li) | `:312-326` |
| DealerPrice | 3 (`netListPrice * 9n / 10n`) | `:328-338` |

Demo parolaları: `admin123`, `satici123`, `bayi123` (`prisma/seed.ts:46-47`, `:303`).

### 3.6 Migration geçmişine bağımlı yerler

| Yer | Komut / davranış | Adres |
|---|---|---|
| CI | `npx prisma migrate deploy` (`DATABASE_URL` = `medikal_dev`) | `.github/workflows/ci.yml:58-59` |
| CI → e2e | `npm run test:e2e` → Playwright `webServer` (aşağıda) | `.github/workflows/ci.yml:73-74` |
| Playwright webServer | `DATABASE_URL="<TEST_DATABASE_URL>" npx prisma migrate reset --force` → `npm run db:seed` → `npm run dev` (yorum: Prisma 7'de `migrate reset` seed çalıştırmıyor) | `playwright.config.ts:32-39` |
| Playwright global setup | yok (`globalSetup`/`globalTeardown` anahtarı yok) | `playwright.config.ts` tamamı |
| docker compose init | yalnız `CREATE DATABASE medikal_test OWNER medikal;` (migration çalıştırmaz) | `docker-compose.yml:15`, `docker/init-test-db.sql:3` |
| `db:reset` | `prisma migrate reset --force` | `package.json:12` |
| `db:seed` | `tsx prisma/seed.ts` | `package.json:11` |
| `db:up` / `db:down` | `docker compose up -d` / `down` | `package.json:13-14` |
| `prisma.config.ts` | `migrations.path = "prisma/migrations"`, `migrations.seed` | `prisma.config.ts:8-11` |
| README | `npx prisma migrate dev` | `README.md:19` |
| README | `npm run db:reset # migration'ları sıfırla` | `README.md:76` |

### 3.7 Ham SQL ve DB seviyesi nesneler

| Arama | Sonuç |
|---|---|
| `$queryRaw` / `$executeRaw` (`git grep -nE '\$(queryRaw|executeRaw)'`) | 0 |
| `information_schema` (`git grep -ni information_schema`) | 0 |
| `CHECK` / `TRIGGER` / `FUNCTION` / `EXTENSION` (`migration.sql`) | 0 |
| DB constraint/index | yalnız Prisma'nın ürettikleri: 25 PK, 8 unique index, 30 index, 30 FK (§3.2) |
| Zaman tipi | 41 kolonun tamamı `TIMESTAMP(3)` (`grep -c 'TIMESTAMP(3)' migration.sql` → 41); `TIMESTAMPTZ` 0 |

**e2e'de ham SQL** (`pg` `Client` ile) — 11 spec dosyası (`grep -rl 'import { Client } from "pg"' e2e`): `e2e/admin/collections.spec.ts`, `commissions.spec.ts`, `congress-edit.spec.ts`, `congress.spec.ts`, `dealer.spec.ts`, `doctor-detail.spec.ts`, `doctor-transfer.spec.ts`, `reports.spec.ts`, `e2e/dealer/panel.spec.ts`, `e2e/seller/doctors.spec.ts`, `e2e/seller/session-revocation.spec.ts`. `INSERT` içeren: `commissions.spec.ts:52,61`, `congress-edit.spec.ts:28,34,90,133`, `congress.spec.ts:44`, `dealer.spec.ts:65,72` (hepsi `gen_random_uuid()::text` ile id üretir). `DELETE FROM`: `congress.spec.ts:181-182,241-242,325-326`.

---

## 4. Silinecek tabloların yarıçapı

Yöntem:
- **FK:** `migration.sql:523-610` `ALTER TABLE … FOREIGN KEY` satırları + şemadaki ilişki alanları.
- **Prisma çağrısı:** `(prisma|tx).<model>.<işlem>` deseni, izlenen `.ts/.tsx` dosyalarında (çok satırlı ifadeler dahil).
- **İlişki üzerinden erişim:** `include`/`select`/`where`/nested `create` içinde ilişki alan adı (`allocations:`, `congressLedger:`, `items:` …) — satırlar tek tek okunarak modele ait olanlar ayıklandı (ör. `Order.items` → OrderItem olduğu için DealerShipmentItem'a sayılmadı).
- **Ham SQL:** `(FROM|INTO|UPDATE|JOIN) "<Tablo>"` deseni.
- **Ekran/route:** Prisma/ilişki erişimi olan sayfa ve action'ların URL'leri ile bu dosyaların çağırdığı `src/lib/*` fonksiyonlarının kullanıldığı URL'ler.

### 4.1 `PaymentAllocation`

| Başlık | Bulgu |
|---|---|
| FK (bu model →) | `paymentId` → `DoctorPayment.id` ON DELETE CASCADE (`migration.sql:556`) · `orderId` → `Order.id` ON DELETE RESTRICT (`:559`) |
| FK (→ bu model) | yok. İlişki alanları: `DoctorPayment.allocations` (`schema.prisma:255`), `Order.allocations` (`:185`) |
| Prisma çağrısı (6, 4 dosya) | `prisma/seed.ts:39` deleteMany, `:278` create · `src/app/(admin)/collections/actions.ts:77` createMany, `:170` deleteMany · `src/lib/commission-service.ts:45` findMany · `src/lib/reports-service.ts:36` aggregate |
| İlişki üzerinden okuma (`allocations`) | `src/app/(admin)/collections/actions.ts:150` · `src/app/(admin)/collections/page.tsx:39` · `src/app/(admin)/doctors/[id]/page.tsx:60` · `src/app/(seller)/account/page.tsx:27` · `src/lib/commission-service.ts:110` · `src/lib/doctor-cari.ts:97,134,188` · `src/lib/reports-service.ts:91` |
| Dokunan dosyalar (toplam 8) | `prisma/seed.ts`, `collections/actions.ts`, `collections/page.tsx`, `doctors/[id]/page.tsx`, `account/page.tsx`, `commission-service.ts`, `doctor-cari.ts`, `reports-service.ts` |
| Ekran/route | `/collections` (liste + `recordCollection`, `cancelCollection`) · `/doctors/[id]` · `/account` · `/commissions` ve `/my-commissions` (`getPeriodPreview`, `closePeriod` → `getNetAllocations`) · `/reports` (`getSellerReports`, `getDoctorReports`) · `/dashboard`, `/sellers` (`getSellerReceivables`), `/sellers/[id]` (`getAgingSummary`) |
| Birim test | `src/lib/allocation.test.ts` (23 test; `allocateFIFO`, `validateManualAllocation`, `agingBucket`, `summarizeAging` — saf, model import yok) · `src/lib/commission.test.ts` (21 test; `netPortionOfAllocation` dahil — saf) |
| E2E test | `e2e/admin/collections.spec.ts` (SQL `:78`, `:133`; `/collections`) · `e2e/admin/commissions.spec.ts` (SQL INSERT `:61`) · `e2e/admin/dealer.spec.ts` (SQL count `:196`, `:216`) |

### 4.2 `CongressLedger`

| Başlık | Bulgu |
|---|---|
| FK (bu model →) | `doctorId` → `Doctor.id` RESTRICT (`migration.sql:583`) · `registrationId` → `CongressRegistration.id` SET NULL (`:586`) |
| FK (→ bu model) | yok. İlişki alanları: `Doctor.congressLedger` (`schema.prisma:98`), `CongressRegistration.ledgerEntries` (`:429`) |
| Prisma çağrısı (20, 5 dosya) | `prisma/seed.ts:35` · `src/app/(admin)/doctors/[id]/actions.ts:45,62,76,87` · `src/app/(admin)/doctors/[id]/page.tsx:71` · `src/lib/congress-service.ts:28,67,94,105,115,158,169,196,204,212,236,258,265` (13) · `src/lib/reports-service.ts:173` |
| İlişki üzerinden okuma (`congressLedger`) | `src/app/(seller)/my-congresses/page.tsx:35` · `src/lib/reports-service.ts:97` |
| `congress-service.ts` çağıranları | `earnFromPayment` → `collections/actions.ts:101` · `reverseEarnForPayment` → `collections/actions.ts:163` · `refundReservation` → `congresses/actions.ts:340` · `reserveBalance` → `my-congresses/actions.ts:87` · `expireLots` → `scripts/expire-congress-balances.ts:17` |
| Dokunan dosyalar (toplam 9) | yukarıdaki 5 + `my-congresses/page.tsx`, `collections/actions.ts`, `congresses/actions.ts`, `my-congresses/actions.ts` (+ `scripts/expire-congress-balances.ts`) |
| Ekran/route | `/doctors/[id]` (defter + `adjustCongressBalance`) · `/my-congresses` · `/congresses` (`cancelRegistration`) · `/collections` (tahsilat kayıt/iptal) · `/reports`, `/dashboard` (`getCongressLiability`; `/reports` ayrıca `getDoctorReports`) · `npm run job:expire` |
| Birim test | `src/lib/congress-ledger.test.ts` (27 test; saf lot fonksiyonları) |
| E2E test | `e2e/admin/congress.spec.ts` (SQL 11 satır: 30,44,103,126,181,241,255,307,325,360,364) · `e2e/admin/dealer.spec.ts` (`:193`, `:213`) · `e2e/admin/doctor-detail.spec.ts` (`:26`) |

### 4.3 `Congress`

| Başlık | Bulgu |
|---|---|
| FK (bu model →) | yok |
| FK (→ bu model) | `CongressPackage.congressId` → CASCADE (`migration.sql:574`); ilişki `Congress.packages` (`schema.prisma:389`) |
| Prisma çağrısı (10, 4 dosya) | `prisma/seed.ts:38,284` · `src/app/(admin)/congresses/[id]/edit/page.tsx:22` · `src/app/(admin)/congresses/actions.ts:66,92,95,116,119,151` · `src/app/(admin)/congresses/page.tsx:25` |
| İlişki üzerinden (`congress:` / `package.congressId`) | `src/app/(admin)/congresses/page.tsx:43` · `src/app/(admin)/congresses/actions.ts:142` · `src/app/(seller)/my-congresses/actions.ts:35` · `src/app/(seller)/my-congresses/page.tsx:47,49,58` |
| Ekran/route | `/congresses` · `/congresses/[id]/edit` · `/my-congresses` |
| Birim test | yok |
| E2E test | `e2e/admin/congress-edit.spec.ts` (SQL `:28`, `:52`, `:172`; `/congresses`, `/congresses/[id]/edit`, `/my-congresses`) · `e2e/admin/congress.spec.ts` (`/congresses`, `/my-congresses` akışları) |

### 4.4 `CongressPackage`

| Başlık | Bulgu |
|---|---|
| FK (bu model →) | `congressId` → `Congress.id` CASCADE (`migration.sql:574`) |
| FK (→ bu model) | `CongressRegistration.packageId` → RESTRICT (`:577`); ilişki `CongressRegistration.package` (`schema.prisma:413`) |
| Prisma çağrısı (8, 4 dosya) | `prisma/seed.ts:37,295` · `src/app/(admin)/congresses/actions.ts:195,226,229,260` · `src/app/(seller)/my-congresses/actions.ts:33` · `src/app/(seller)/my-congresses/page.tsx:46` |
| İlişki üzerinden (`packages:` / `package:`) | `src/app/(admin)/congresses/page.tsx:28,42` · `src/app/(admin)/congresses/actions.ts:142,284` · `src/app/(admin)/doctors/[id]/page.tsx:77` · `src/app/(seller)/my-congresses/page.tsx:57` |
| Ekran/route | `/congresses` (`NewPackageForm`, `PackageRow`) · `/my-congresses` · `/doctors/[id]` (defterde paket adı) |
| Birim test | yok |
| E2E test | `e2e/admin/congress-edit.spec.ts` (SQL `:34`, `:69`, `:111`, `:146`) · `e2e/admin/congress.spec.ts` (`:188`, `:250`, `:331`) |

### 4.5 `CongressRegistration`

| Başlık | Bulgu |
|---|---|
| FK (bu model →) | `packageId` → `CongressPackage.id` RESTRICT (`migration.sql:577`) · `doctorId` → `Doctor.id` RESTRICT (`:580`) · `sellerId` FK'sız String (`schema.prisma:417`) |
| FK (→ bu model) | `CongressLedger.registrationId` → SET NULL (`:586`); ilişki alanları `Doctor.congressRegistrations` (`schema.prisma:99`), `CongressPackage.registrations` (`:403`), `CongressLedger.registration` (`:451`) |
| Prisma çağrısı (13, 5 dosya) | `prisma/seed.ts:36` · `src/app/(admin)/congresses/actions.ts:141,253,282,291,299,333,341` · `src/app/(admin)/congresses/page.tsx:37` · `src/app/(seller)/my-congresses/actions.ts:60,67,77` · `src/app/(seller)/my-congresses/page.tsx:51` |
| İlişki / alan üzerinden | `src/app/(admin)/congresses/page.tsx:31` (`_count.registrations`) · `src/app/(admin)/doctors/[id]/page.tsx:76` (`registration`) · `src/lib/congress-service.ts:176,197,219-220` (`registrationId`, `refType: "CongressRegistration"`) |
| Ekran/route | `/congresses` (onay/iptal) · `/my-congresses` (`requestRegistration`) · `/doctors/[id]` |
| Birim test | yok |
| E2E test | `e2e/admin/congress-edit.spec.ts` (SQL `:90`, `:120`, `:133`) · `e2e/admin/congress.spec.ts` (SQL `:159`, `:182`, `:217`, `:242`, `:281`, `:295`, `:326`) |

### 4.6 `Dealer`

| Başlık | Bulgu |
|---|---|
| FK (bu model →) | `userId` → `User.id` SET NULL, `@unique` (`migration.sql:589`, `:496`) |
| FK (→ bu model) | `DealerPrice.dealerId` CASCADE (`:592`) · `DealerShipment.dealerId` RESTRICT (`:598`) · `DealerPayment.dealerId` RESTRICT (`:607`); ilişki `User.dealer` (`schema.prisma:70`) |
| Prisma çağrısı (9, 5 dosya) | `prisma/seed.ts:29,312,324` · `src/app/(admin)/dealers/[id]/page.tsx:34` · `src/app/(admin)/dealers/actions.ts:66,396,405` · `src/app/(admin)/dealers/page.tsx:12` · `src/lib/dealer-session.ts:14` |
| İlişki üzerinden | `src/app/(admin)/dealer-shipments/page.tsx:23` (`dealer:`) |
| Bağlı rol değeri | `Role.DEALER` (`schema.prisma:21`); string geçişleri §10.4 |
| Ekran/route | `/dealers`, `/dealers/new`, `/dealers/[id]`, `/dealer-shipments` · bayi grubu layout'u (`requireDealerAccount`) üzerinden `/bayi`, `/bayi/talep`, `/bayi/sevkiyatlar`, `/bayi/odemeler`, `/bayi/fiyatlar` |
| Birim test | yok |
| E2E test | `e2e/admin/dealer.spec.ts` (SQL `:49`, `:231`, `:251`) · `e2e/dealer/panel.spec.ts` (SQL `:54`, `:85`) · `e2e/auth.setup.ts:20-24` (bayi oturumu) |

### 4.7 `DealerPrice`

| Başlık | Bulgu |
|---|---|
| FK (bu model →) | `dealerId` → `Dealer.id` CASCADE (`migration.sql:592`) · `productId` → `Product.id` RESTRICT (`:595`); unique (`dealerId`,`productId`) (`:502`) |
| FK (→ bu model) | yok; ilişki alanları `Dealer.prices` (`schema.prisma:504`), `Product.dealerPrices` (`:138`) |
| Prisma çağrısı (7, 6 dosya) | `prisma/seed.ts:27,330` · `src/app/(admin)/dealers/[id]/page.tsx:43` · `src/app/(admin)/dealers/actions.ts:104` · `src/app/(dealer)/bayi/fiyatlar/page.tsx:11` · `src/app/(dealer)/bayi/talep/page.tsx:13` · `src/lib/dealer-shipment.ts:42` |
| `buildShipment` çağıranları | `src/app/(admin)/dealers/actions.ts:229` · `src/app/(dealer)/bayi/talep/actions.ts:42` |
| Ekran/route | `/dealers/[id]` (`setDealerPrice`) · `/bayi/fiyatlar` · `/bayi/talep` (`requestShipment`) |
| Birim test | yok |
| E2E test | `e2e/admin/dealer.spec.ts` (`:56`) · `e2e/dealer/panel.spec.ts` (`:57`, `:88`, `:95`) |

### 4.8 `DealerShipment`

| Başlık | Bulgu |
|---|---|
| FK (bu model →) | `dealerId` → `Dealer.id` RESTRICT (`migration.sql:598`) |
| FK (→ bu model) | `DealerShipmentItem.shipmentId` CASCADE (`:601`). FK'sız iz alanı: `StockMovement.dealerShipmentId` (`schema.prisma:152`; yazan `src/app/(admin)/dealers/actions.ts:160`, `:328`) |
| Prisma çağrısı (21, 10 dosya) | `prisma/seed.ts:26` · `src/app/(admin)/dealer-shipments/page.tsx:19` · `src/app/(admin)/dealers/[id]/page.tsx:53` · `src/app/(admin)/dealers/actions.ts:129,165,230,269,275,307,333` · `src/app/(admin)/reports/page.tsx:28` · `src/app/(dealer)/bayi/page.tsx:23` · `src/app/(dealer)/bayi/sevkiyatlar/page.tsx:28,39` · `src/app/(dealer)/bayi/talep/actions.ts:43,84,94` · `src/lib/dealer-cari.ts:25,47,87` · `src/lib/reports-service.ts:153` |
| Ekran/route | `/dealer-shipments` (`approveShipment`, `rejectShipment`, `cancelShipment`) · `/dealers/[id]` · `/dealers`, `/dashboard` (`getAllDealersCari`) · `/bayi`, `/bayi/sevkiyatlar` (`withdrawRequest`), `/bayi/talep` · `/reports` |
| Not | `createShipment` (`src/app/(admin)/dealers/actions.ts:204`) için `src` altında çağıran/import eden bileşen: 0 (`git grep -n createShipment -- src`) |
| Birim test | yok |
| E2E test | `e2e/admin/dealer.spec.ts` (SQL `:29`, `:65`, `:101`, `:131`, `:147`, `:174`, `:204`) · `e2e/dealer/panel.spec.ts` (`:29`, `:75`) |

### 4.9 `DealerShipmentItem`

| Başlık | Bulgu |
|---|---|
| FK (bu model →) | `shipmentId` → `DealerShipment.id` CASCADE (`migration.sql:601`) · `productId` → `Product.id` RESTRICT (`:604`) |
| FK (→ bu model) | yok; ilişki alanları `DealerShipment.items` (`schema.prisma:547`), `Product.dealerShipmentItems` (`:139`) |
| Prisma çağrısı (1) | `prisma/seed.ts:25` deleteMany |
| İlişki üzerinden | nested create: `src/app/(admin)/dealers/actions.ts:237`, `src/app/(dealer)/bayi/talep/actions.ts:51` · okuma: `src/app/(admin)/dealers/actions.ts:131`, `:309`, `src/app/(admin)/dealer-shipments/page.tsx:24`, `src/app/(dealer)/bayi/sevkiyatlar/page.tsx:34` · kalem tipi `BuiltItem` (`src/lib/dealer-shipment.ts:16-24`) |
| Ekran/route | `/dealer-shipments` · `/bayi/sevkiyatlar` · `/bayi/talep` |
| Birim test | yok |
| E2E test | `e2e/admin/dealer.spec.ts` (SQL INSERT `:72`) |

### 4.10 `DealerPayment`

| Başlık | Bulgu |
|---|---|
| FK (bu model →) | `dealerId` → `Dealer.id` RESTRICT (`migration.sql:607`) |
| FK (→ bu model) | yok; ilişki `Dealer.payments` (`schema.prisma:506`) |
| Prisma çağrısı (9, 6 dosya) | `prisma/seed.ts:28` · `src/app/(admin)/dealers/[id]/page.tsx:58` · `src/app/(admin)/dealers/actions.ts:370` · `src/app/(dealer)/bayi/odemeler/page.tsx:25,31` · `src/lib/dealer-cari.ts:29,52,92` · `src/lib/reports-service.ts:157` |
| Ekran/route | `/dealers/[id]` (`recordDealerPayment`) · `/bayi/odemeler` · `/bayi` · `/dealers`, `/dashboard` (`getAllDealersCari`) · `/reports` |
| Birim test | yok |
| E2E test | `e2e/admin/dealer.spec.ts` (`:31`) · `e2e/dealer/panel.spec.ts` (`:31`) |

### 4.11 `SystemSetting`

| Başlık | Bulgu |
|---|---|
| FK (iki yön) | yok (`key String @id`, `schema.prisma:467-472`) |
| Prisma çağrısı (2, 1 dosya) | `src/lib/settings.ts:23` findUnique (`getNumber`) · `:44` upsert (`setSetting`) |
| Dolaylı okuyanlar (`getDueSettings`) | `src/app/(admin)/collections/actions.ts:229` (`changeDueDate`) · `src/app/(admin)/dealers/actions.ts:136` (`approveShipmentTx`) · `src/app/(seller)/my-orders/actions.ts:66` (`createOrder`) |
| Yazan çağrı | `setSetting` için çağrı noktası 0 (`git grep -n setSetting -- src scripts prisma e2e`, tanım hariç) |
| Seed | dokunmuyor (§3.5) |
| Ekran/route | doğrudan okuyan/yazan sayfa: 0. Dolaylı: `/dealer-shipments` (onay), `/my-orders/new` (sipariş). `changeDueDate` için `src` altında çağıran bileşen: 0 (`git grep -n changeDueDate -- src`) |
| Test | birim 0 · e2e 0 (SQL referansı yok) |

---

## 5. Para katmanı

### 5.1 `src/lib/money.ts` ve `src/lib/vat.ts` dışa verilenleri

**`src/lib/money.ts`** (49 satır)

| İmza | Satır |
|---|---|
| `formatTRY(kurus: bigint \| number): string` — `Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(kurus) / 100)` | 11-16 |
| `tlToKurus(tl: number): bigint` — `BigInt(Math.round(tl * 100))` | 19-21 |
| `kurusToTl(kurus: bigint \| number): number` — `Number(kurus) / 100` | 24-26 |
| `divRound(numerator: bigint, denominator: bigint): bigint` | 35-42 |
| `sumKurus(values: Iterable<bigint \| null \| undefined>): bigint` | 45-49 |

**`src/lib/vat.ts`** (100 satır)

| İmza | Satır |
|---|---|
| `const DEFAULT_VAT_RATE = 20` | 15 |
| `vatAmount(net: bigint, rate: number): bigint` | 25-27 |
| `grossFromNet(net: bigint, rate: number): bigint` | 30-32 |
| `netFromGross(gross: bigint, rate: number): bigint` | 38-41 |
| `type LineTotals = { lineNetTotal: bigint; vatAmount: bigint; lineGrossTotal: bigint }` | 43-47 |
| `lineTotals(netUnitPrice: bigint, quantity: number, rate: number): LineTotals` | 53-68 |
| `type OrderTotals = { netTotal: bigint; vatTotal: bigint; grossTotal: bigint }` | 70-74 |
| `sumLineTotals(lines: readonly LineTotals[]): OrderTotals` | 77-86 |
| `discountRate(netListPrice: bigint, netUnitPrice: bigint): number` | 92-100 |

Dışa verilmeyen yardımcı: `assertRate(rate: number): bigint` (`vat.ts:17-22`).

### 5.2 `divRound` — tam gövde

`src/lib/money.ts:35-42`:

```ts
export function divRound(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new Error("Sıfıra bölme.");
  const negative = numerator < 0n !== denominator < 0n;
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const q = (2n * n + d) / (2n * d);
  return negative ? -q : q;
}
```

`divRound` çağıranları (`git grep -n 'divRound(' -- src`, tanım ve yorum hariç): `src/lib/vat.ts:26`, `:40`, `:99` · `src/lib/commission.ts:58`, `:68` · `src/lib/reports.ts:13`. Birim testlerde doğrudan `divRound` import'u: 0. `sumKurus` için `src` altında test dışı çağrı: 0.

`src` (test dosyaları hariç) ve `prisma` altında `divRound` gövdesi (`money.ts:40`) dışında kalan bigint `/` işlemleri (TS tip denetleyicisi, §5.5): `src/lib/congress-ledger.ts:147` (`(netCollected * BigInt(EARN_RATE_PERCENT)) / 100n`), `prisma/seed.ts:267` (`grossTotal / 3n`), `prisma/seed.ts:334` (`netListPrice * 9n / 10n`).

### 5.3 Şemadaki `BigInt` alanlar — 28

`Product.netListPrice` (:128) · `Product.netMinPrice` (:129) · `Order.netTotal` (:172) · `Order.vatTotal` (:173) · `Order.grossTotal` (:174) · `OrderItem.netUnitPrice` (:202) · `OrderItem.listPriceAtSale` (:203) · `OrderItem.vatAmount` (:206) · `OrderItem.lineNetTotal` (:207) · `OrderItem.lineGrossTotal` (:208) · `DoctorPayment.amount` (:242) · `PaymentAllocation.amount` (:270) · `CommissionPeriod.baseAmount` (:311) · `CommissionPeriod.commissionAmount` (:313) · `CommissionAdjustment.amount` (:336) · `CongressPackage.value` (:400) · `CongressRegistration.reservedAmount` (:420) · `CongressLedger.amount` (:444) · `CongressLedger.remainingAmount` (:449) · `DealerPrice.netPrice` (:517) · `DealerShipment.netTotal` (:533) · `DealerShipment.vatTotal` (:534) · `DealerShipment.grossTotal` (:535) · `DealerShipmentItem.netUnitPrice` (:561) · `DealerShipmentItem.vatAmount` (:563) · `DealerShipmentItem.lineNetTotal` (:564) · `DealerShipmentItem.lineGrossTotal` (:565) · `DealerPayment.amount` (:575).

(Satırlar `prisma/schema.prisma`; sayım §3.1 tablosundan `Prisma tipi = BigInt`.) SQL karşılığı: `BIGINT` (`grep -c 'BIGINT' migration.sql` satırları: 26 `BIGINT NOT NULL` + 2 `BIGINT NOT NULL DEFAULT 0`).

### 5.4 `BigInt` literal, `BigInt(`, `Number(` geçişleri

Komutlar (izlenen `.ts/.tsx/.mjs`, `//` veya `*` ile başlayan yorum satırları hariç): literal `(?<![\w.])\d[\d_]*n\b` · `\bBigInt\(` · `\bNumber\(`. Toplamlar: literal **468 / 42 dosya** · `BigInt(` **35 / 13 dosya** · `Number(` **30 / 19 dosya**. `Number(` sayımı parasal olmayan kullanımları da içerir (ör. form'dan yıl/ay/miktar okuma).

| Dosya | `123n` | `BigInt(` | `Number(` |
|---|---|---|---|
| `e2e/admin/collections.spec.ts` | 5 | 1 | 0 |
| `e2e/admin/commissions.spec.ts` | 8 | 8 | 0 |
| `e2e/admin/congress-edit.spec.ts` | 5 | 0 | 0 |
| `e2e/admin/congress.spec.ts` | 5 | 11 | 0 |
| `e2e/admin/dealer.spec.ts` | 1 | 4 | 0 |
| `e2e/admin/doctor-detail.spec.ts` | 2 | 1 | 1 |
| `e2e/admin/reports.spec.ts` | 0 | 2 | 1 |
| `e2e/dealer/panel.spec.ts` | 0 | 1 | 1 |
| `prisma/seed.ts` | 3 | 1 | 0 |
| `src/app/(admin)/collections/actions.ts` | 4 | 0 | 1 |
| `src/app/(admin)/collections/page.tsx` | 3 | 0 | 0 |
| `src/app/(admin)/commissions/actions.ts` | 0 | 0 | 2 |
| `src/app/(admin)/commissions/page.tsx` | 1 | 0 | 0 |
| `src/app/(admin)/congresses/actions.ts` | 0 | 0 | 3 |
| `src/app/(admin)/congresses/page.tsx` | 0 | 0 | 1 |
| `src/app/(admin)/dashboard/page.tsx` | 12 | 0 | 0 |
| `src/app/(admin)/dealers/[id]/page.tsx` | 2 | 0 | 0 |
| `src/app/(admin)/dealers/actions.ts` | 0 | 0 | 4 |
| `src/app/(admin)/dealers/page.tsx` | 4 | 0 | 0 |
| `src/app/(admin)/doctors/[id]/actions.ts` | 3 | 0 | 1 |
| `src/app/(admin)/doctors/[id]/page.tsx` | 11 | 0 | 0 |
| `src/app/(admin)/products/actions.ts` | 0 | 0 | 4 |
| `src/app/(admin)/reports/page.tsx` | 4 | 0 | 0 |
| `src/app/(admin)/sellers/[id]/page.tsx` | 2 | 0 | 0 |
| `src/app/(admin)/sellers/page.tsx` | 3 | 0 | 0 |
| `src/app/(admin)/stock/actions.ts` | 0 | 0 | 1 |
| `src/app/(dealer)/bayi/page.tsx` | 3 | 0 | 0 |
| `src/app/(dealer)/bayi/talep/RequestForm.tsx` | 0 | 0 | 1 |
| `src/app/(dealer)/bayi/talep/actions.ts` | 0 | 0 | 1 |
| `src/app/(dealer)/bayi/talep/page.tsx` | 0 | 0 | 1 |
| `src/app/(seller)/account/page.tsx` | 6 | 0 | 0 |
| `src/app/(seller)/my-commissions/page.tsx` | 2 | 0 | 0 |
| `src/app/(seller)/my-congresses/actions.ts` | 2 | 0 | 0 |
| `src/app/(seller)/my-congresses/page.tsx` | 6 | 0 | 0 |
| `src/app/(seller)/my-orders/OrderForm.tsx` | 5 | 0 | 2 |
| `src/lib/allocation.test.ts` | 58 | 0 | 0 |
| `src/lib/allocation.ts` | 11 | 0 | 0 |
| `src/lib/audit.test.ts` | 3 | 0 | 0 |
| `src/lib/commission-service.ts` | 6 | 0 | 0 |
| `src/lib/commission.test.ts` | 49 | 0 | 0 |
| `src/lib/commission.ts` | 5 | 1 | 0 |
| `src/lib/congress-ledger.test.ts` | 61 | 0 | 0 |
| `src/lib/congress-ledger.ts` | 13 | 1 | 0 |
| `src/lib/congress-service.ts` | 15 | 0 | 0 |
| `src/lib/dealer-cari.ts` | 7 | 0 | 0 |
| `src/lib/doctor-cari.ts` | 13 | 0 | 0 |
| `src/lib/money.test.ts` | 19 | 0 | 0 |
| `src/lib/money.ts` | 9 | 1 | 2 |
| `src/lib/reports-service.ts` | 12 | 0 | 0 |
| `src/lib/reports.test.ts` | 26 | 0 | 0 |
| `src/lib/reports.ts` | 4 | 1 | 1 |
| `src/lib/settings.ts` | 0 | 0 | 1 |
| `src/lib/vat.test.ts` | 47 | 0 | 0 |
| `src/lib/vat.ts` | 8 | 2 | 1 |

### 5.5 Parasal değerler üzerinde aritmetik

**(a) `bigint` tipli operand üzerinde `+ - * / %`, `+= -= *= /=` ve tekli `-`** — TypeScript derleyici API'si ile: `tsconfig.json` programındaki her `BinaryExpression`/`PrefixUnaryExpression` için sol veya sağ operandın tipi `bigint` ise sayıldı (`node_modules`, `src/generated`, `.next` hariç). Tüm parasal alanlar `BigInt` olduğundan bu liste parasal aritmetiği kapsar; `BigInt(quantity)` çarpımı ve `10000n` ölçekleme gibi parasal olmayan bigint işlemleri de sayıma dahildir. Toplam: **126 ifade / 29 dosya**. Hücre biçimi: `satır+operatör` (`u-` = tekli eksi).

| Dosya | Sayı | Konumlar |
|---|---|---|
| `e2e/admin/collections.spec.ts` | 3 | 74-, 98-, 152- |
| `e2e/admin/commissions.spec.ts` | 4 | 112/, 112+, 112*, 148u- |
| `e2e/admin/dealer.spec.ts` | 6 | 60*, 61/, 61*, 62+, 110+, 156- |
| `e2e/admin/doctor-detail.spec.ts` | 2 | 72+, 108/ |
| `prisma/seed.ts` | 3 | 267/, 334/, 334* |
| `src/app/(admin)/collections/actions.ts` | 1 | 97+ |
| `src/app/(admin)/collections/page.tsx` | 2 | 46+, 107+ |
| `src/app/(admin)/dashboard/page.tsx` | 3 | 62+=, 63+=, 69+ |
| `src/app/(admin)/dealers/[id]/page.tsx` | 1 | 65+ |
| `src/app/(admin)/doctors/[id]/actions.ts` | 3 | 81-=, 91u-, 111u- |
| `src/app/(admin)/doctors/[id]/page.tsx` | 3 | 89+, 223+, 224- |
| `src/app/(admin)/sellers/[id]/page.tsx` | 2 | 40+, 41- |
| `src/app/(dealer)/bayi/page.tsx` | 2 | 30+, 31- |
| `src/app/(seller)/account/page.tsx` | 4 | 48-, 48+, 52+, 54+ |
| `src/app/(seller)/my-congresses/page.tsx` | 2 | 72+, 73+ |
| `src/lib/allocation.test.ts` | 2 | 44+, 50+ |
| `src/lib/allocation.ts` | 3 | 50-=, 82+=, 150+= |
| `src/lib/commission-service.ts` | 5 | 119+, 120-, 121+, 170+, 194u- |
| `src/lib/commission.test.ts` | 7 | 68/, 69/, 83-, 85+, 89+, 93-, 93- |
| `src/lib/commission.ts` | 5 | 58*, 68*, 90+, 91+, 92+ |
| `src/lib/congress-ledger.ts` | 7 | 64+, 89+, 125+, 127-, 136-=, 147/, 147* |
| `src/lib/congress-service.ts` | 8 | 109+=, 112-, 114+=, 119u-, 173u-, 202u-, 208+=, 269u- |
| `src/lib/dealer-cari.ts` | 4 | 40-, 72-, 102-=, 103- |
| `src/lib/doctor-cari.ts` | 10 | 46-, 79-, 109-, 109+, 159-, 159+, 162+=, 163+=, 199-, 199+ |
| `src/lib/money.ts` | 8 | 38u-, 39u-, 40/, 40+, 40*, 40*, 41u-, 47+= |
| `src/lib/reports-service.ts` | 7 | 47+, 50+, 107+, 111+, 112-, 114+, 181+ |
| `src/lib/reports.ts` | 6 | 13*, 36+=, 36*, 37+=, 37*, 37- |
| `src/lib/vat.test.ts` | 2 | 90+, 92+ |
| `src/lib/vat.ts` | 11 | 26*, 31+, 40*, 40+, 61*, 66+, 80+, 81+, 82+, 97-, 99* |

**(b) `number` tipli kuruş/TL aritmetiği** — komut: `git ls-files 'src/*' 'prisma/*' 'scripts/*' | xargs grep -nE '(\* ?100\b|/ ?100\b|grossKurus \*|1e-6)'` (test dosyaları ve yorum satırları hariç):

| Adres | İfade |
|---|---|
| `src/lib/money.ts:15` | `Number(kurus) / 100` |
| `src/lib/money.ts:20` | `Math.round(tl * 100)` |
| `src/lib/money.ts:25` | `Number(kurus) / 100` |
| `src/lib/validation.ts:13` | `Math.abs(v * 100 - Math.round(v * 100)) < 1e-6` |
| `src/lib/commission.ts:67` | `Math.round(ratePercent * 100)` (oran) |
| `src/lib/reports.ts:13` | `Number(divRound(...)) / 100` (yüzde) |
| `src/lib/vat.ts:99` | `Number(divRound(...)) / 100` (yüzde) |
| `src/app/(admin)/congresses/page.tsx:141` | `Number(p.value) / 100` |
| `src/app/(dealer)/bayi/talep/RequestForm.tsx:39` | `p.grossKurus * r.quantity` |
| `src/app/(dealer)/bayi/talep/RequestForm.tsx:119` | `p.grossKurus * row.quantity` |
| `prisma/seed.ts:19` | `Math.round(v * 100)` |

### 5.6 `aggregate` / `groupBy` / `_sum` çağrı noktaları

Komut: `git grep -nE '\.aggregate\('` (14 / 5 dosya) · `'\.groupBy\('` (5 / 2 dosya) · `'\b_sum\b'` (38 geçiş / 7 dosya; `money.ts:44` ve `money.test.ts:48` yorum/test).

| Adres | Model | İşlem | Toplanan alan |
|---|---|---|---|
| `src/app/(admin)/dashboard/page.tsx:30` | Product | aggregate | `_sum.stock` (Int) |
| `src/app/(admin)/dashboard/page.tsx:39` | Order | aggregate | `_sum.grossTotal` |
| `src/app/(admin)/dashboard/page.tsx:43` | DoctorPayment | aggregate | `_sum.amount` |
| `src/app/(admin)/reports/page.tsx:28-33` | DealerShipment | aggregate | `_sum.grossTotal` |
| `src/lib/dealer-cari.ts:25` | DealerShipment | aggregate | `_sum.grossTotal` |
| `src/lib/dealer-cari.ts:29` | DealerPayment | aggregate | `_sum.amount` |
| `src/lib/dealer-cari.ts:47` | DealerShipment | groupBy `dealerId` | `_sum.grossTotal` |
| `src/lib/dealer-cari.ts:52` | DealerPayment | groupBy `dealerId` | `_sum.amount` |
| `src/lib/dealer-cari.ts:92` | DealerPayment | aggregate | `_sum.amount` |
| `src/lib/doctor-cari.ts:31` | Order | aggregate | `_sum.grossTotal` |
| `src/lib/doctor-cari.ts:35` | DoctorPayment | aggregate | `_sum.amount` |
| `src/lib/doctor-cari.ts:53` | Order | groupBy `doctorId` | `_sum.grossTotal` |
| `src/lib/doctor-cari.ts:58` | DoctorPayment | groupBy `doctorId` | `_sum.amount` |
| `src/lib/doctor-cari.ts:140` | Doctor | groupBy `ownerSellerId` | `_count._all` (para değil) |
| `src/lib/reports-service.ts:36` | PaymentAllocation | aggregate | `_sum.amount` |
| `src/lib/reports-service.ts:145` | Order | aggregate | `_sum[netTotal \| grossTotal]` (dinamik, `:143`) |
| `src/lib/reports-service.ts:149` | DoctorPayment | aggregate | `_sum.amount` |
| `src/lib/reports-service.ts:153` | DealerShipment | aggregate | `_sum[netTotal \| grossTotal]` |
| `src/lib/reports-service.ts:157` | DealerPayment | aggregate | `_sum.amount` |

`_sum` null dönüşü `?? 0n` ile karşılanıyor: ör. `dealer-cari.ts:35-36`, `doctor-cari.ts:41-42`, `reports-service.ts:160-167`, `dashboard/page.tsx:67-68`, `reports/page.tsx:33`.

### 5.7 İstemciye para gönderen serileştirme noktaları

Server action dönüş tiplerinde `bigint` yok (tüm state tipleri `string`/`boolean` alanlı, §9.2). `BigInt.prototype.toJSON` yaması, `superjson`: 0 (`git grep -nE 'BigInt\.prototype|toJSON|superjson' -- src scripts prisma`).

**Sunucu bileşeni → istemci bileşeni prop'ları** (istemci bileşenleri: `git grep -l '^"use client"' -- src` → 25 dosya; her birinin prop tipi okundu):

| Sunucu adresi | İstemci bileşeni | Para nasıl geçiyor |
|---|---|---|
| `src/app/(seller)/my-orders/new/page.tsx:23-35`, `:44-48` | `OrderForm` | `netListPrice`, `netMinPrice` **`bigint` olarak doğrudan** (prop tipi `src/app/(seller)/my-orders/OrderForm.tsx:15-16`) |
| `src/app/(dealer)/bayi/talep/page.tsx:21-30` | `RequestForm` | `grossPrice: formatTRY(gross)` (string) + `grossKurus: Number(gross)` (number) (tip `RequestForm.tsx:13-14`) |
| `src/app/(admin)/congresses/page.tsx:136-146` | `PackageRow` | `valueTL: Number(p.value) / 100` (number) + `formatValue: formatTRY(p.value)` (string) |
| `src/app/(admin)/products/[id]/edit/page.tsx:32-33` | `ProductForm` | `kurusToTl(...)` (number) |
| `src/app/(seller)/my-congresses/page.tsx:170-177` | `RegistrationForm` | `label` string'ine gömülü `formatTRY(...)` |

Diğer istemci bileşenlerine (`CollectionForm`, `CancelCollection`, `PeriodActions`, `CongressControls`, `NewPackageForm`, `RegistrationActions`, `StatusToggle`, `DealerForms`, `ShipmentActions`, `AdjustForm`, `TransferForm`, `SellerForm`, `StockEntryForm`, `WithdrawButton`, `DoctorForm`, `VatToggle`, `LogoutButton`, `SidebarLink`, `ConfirmSubmit`, `form.tsx` bileşenleri) para prop'u geçmiyor.

**Sunucu bileşenlerinde gösterim:** `formatTRY(` 118 geçiş / 30 dosya (tanım `money.ts:11` ve `money.test.ts` 3 dahil) → HTML'e string olarak yazılır. Sunucu bileşeni `src/components/OrderDetail.tsx` `bigint` prop alır (`:14-16`, `:23-26`) ve `formatTRY` ile render eder (`:111-151`).

**İstemci → sunucu:**

| Yol | Adres |
|---|---|
| Form alanı TL → `Number(...)` → Zod (`amountTLSchema`/`priceTLSchema`) → `tlToKurus` | `collections/actions.ts:45-51` · `dealers/actions.ts:94-107`, `:364-373` · `congresses/actions.ts:169-181` · `products/actions.ts:18-19`, `:42-43` |
| Form alanı TL → `Number(...)` → `tlToKurus(Math.abs(...))` (Zod yok) | `doctors/[id]/actions.ts:26`, `:38` |
| `OrderForm` gizli `items` JSON'u: `netUnitPriceTL: kurusToTl(netUnit)` → sunucuda `priceTLSchema` → `tlToKurus` | `OrderForm.tsx:109-113`, `:134` → `my-orders/actions.ts:26`, `:95` |

**Diğer serileştirme:** AuditLog JSON'unda `bigint` → `data.toString()` (`src/lib/audit.ts:116`, `:132`). e2e'de SQL `::text` + `BigInt(row.x)` (ör. `e2e/admin/congress.spec.ts:29-36`, `e2e/admin/dealer.spec.ts:26-35`).

---

## 6. Lint ve tip altyapısı

### 6.1 ESLint yapılandırması — `eslint.config.mjs` (18 satır, **flat config**)

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

Legacy yapılandırma dosyası (`.eslintrc*`): yok (`git ls-files | grep -i eslintrc` → 0).

### 6.2 Tip-farkında (type-aware) kurallar

| Soru | Bulgu | Adres / komut |
|---|---|---|
| `parserOptions.project` / `projectService` | **yok** — proje yapılandırmasında yok; `eslint-config-next` TS bloğu yalnız `parserOptions: { sourceType: "module" }` | `eslint.config.mjs`; `node_modules/eslint-config-next/dist/index.js` (`next/typescript` bloğu) |
| Etkin parser (money.ts için) | `typescript-eslint/parser@8.64.0`; etkin `parserOptions`: `requireConfigFile`, `sourceType`, `allowImportExportEverywhere`, `babelOptions` — `project`/`projectService` anahtarı yok | `npx eslint --print-config src/lib/money.ts` |
| `@typescript-eslint` sürümü | 8.64.0 (`typescript-eslint`, `parser`, `eslint-plugin`) | `package-lock.json` |
| Kullanılan TS preset | `typescript-eslint` `configs.recommended` (tip-kontrolsüz) + `no-unused-vars: warn`, `no-unused-expressions: warn` | `node_modules/eslint-config-next/dist/typescript.js` (`configs.recommended` birleştirmesi) |
| `recommendedTypeChecked` / `strictTypeChecked` | kullanılmıyor | aynı dosya; `print-config`'te `no-floating-promises`, `no-misused-promises`, `no-unsafe-*`, `restrict-plus-operands`, `strict-boolean-expressions`, `await-thenable` kuralları: 0 |
| Etkin kural sayısı | 112 kural; bunların 20'si `@typescript-eslint/*` (açık) | `print-config` çıktısı |

Açık `@typescript-eslint/*` kuralları (`print-config`): `ban-ts-comment`, `no-array-constructor`, `no-duplicate-enum-values`, `no-empty-object-type`, `no-explicit-any`, `no-extra-non-null-assertion`, `no-misused-new`, `no-namespace`, `no-non-null-asserted-optional-chain`, `no-require-imports`, `no-this-alias`, `no-unnecessary-type-constraint`, `no-unsafe-declaration-merging`, `no-unsafe-function-type`, `no-unused-expressions` (warn), `no-unused-vars` (warn), `no-wrapper-object-types`, `prefer-as-const`, `prefer-namespace-keyword`, `triple-slash-reference` (warn dışındakiler error).

### 6.3 `no-restricted-syntax` / `no-restricted-imports`

Kullanılmıyor: `eslint.config.mjs`'te yok; `npx eslint --print-config src/lib/money.ts` çıktısında adı `restricted` içeren kural: 0.

### 6.4 `tsconfig.json` (34 satır)

Dosya 30 satırı aştığı için içerik birebir tablo hâlinde:

| Anahtar | Değer | Satır |
|---|---|---|
| `compilerOptions.target` | `"ES2020"` | 3 |
| `compilerOptions.lib` | `["dom", "dom.iterable", "esnext"]` | 4 |
| `compilerOptions.allowJs` | `true` | 5 |
| `compilerOptions.skipLibCheck` | `true` | 6 |
| `compilerOptions.strict` | `true` | 7 |
| `compilerOptions.noEmit` | `true` | 8 |
| `compilerOptions.esModuleInterop` | `true` | 9 |
| `compilerOptions.module` | `"esnext"` | 10 |
| `compilerOptions.moduleResolution` | `"bundler"` | 11 |
| `compilerOptions.resolveJsonModule` | `true` | 12 |
| `compilerOptions.isolatedModules` | `true` | 13 |
| `compilerOptions.jsx` | `"react-jsx"` | 14 |
| `compilerOptions.incremental` | `true` | 15 |
| `compilerOptions.plugins` | `[{ "name": "next" }]` | 16-20 |
| `compilerOptions.paths` | `{ "@/*": ["./src/*"] }` | 21-23 |
| `include` | `["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.mts"]` | 25-32 |
| `exclude` | `["node_modules"]` | 33 |

Başka `compilerOptions` anahtarı yok (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` vb. tanımlı değil). `include` deseni `e2e/`, `prisma/`, `scripts/` ve `src/generated/` altındaki `.ts` dosyalarını da kapsar; `exclude` yalnız `node_modules`.

### 6.5 `npm run lint` ve `npm run typecheck`

| Komut | Tam hâli | Ölçülen süre | Sonuç |
|---|---|---|---|
| `npm run lint` | `eslint` (`package.json:9`) | 56 451 ms | exit 0; 0 error, 0 warning |
| `npm run typecheck` (1. koşu, `tsconfig.tsbuildinfo` yokken) | `tsc --noEmit` (`package.json:10`) | 6 593 ms | exit 0; `error TS` satırı 0 |
| `npm run typecheck` (2. koşu, artımlı bilgi varken) | aynı | 2 486 ms | exit 0 |
| `npm test` (bilgi) | `vitest run` (`package.json:15`) | vitest raporu "Duration 2.77s" | 10 dosya, 134 test geçti |

Süre ölçümü: `S=$(date +%s%N); <komut>; T=$(date +%s%N)` (Git Bash). Tek ölçüm; ortam bilgisi başlıkta.

**ESLint'in taradığı dosyalar** (`npx eslint -f json -o <geçici> .` → dosya listesi dizine göre gruplandı): toplam **191** — `src/app` 82 · `src/lib` 37 · `src/generated` 33 · `e2e` 20 (`admin` 11, `seller` 4, `guest` 2, `dealer` 1, kök 2) · `src/components` 9 · kök yapılandırma dosyaları 6 · `scripts` 2 · `prisma` 1 · `src/types` 1. (`src/generated/` gitignored olduğu hâlde ESLint ignore listesinde değil: `eslint.config.mjs:9-15`.)

---

## 7. Test altyapısı

### 7.1 Vitest

`vitest.config.ts` (14 satır) — tek yapılandırma dosyası; `projects` / `workspace` tanımı yok.

| Anahtar | Değer | Satır |
|---|---|---|
| `test.environment` | `"node"` | 6 |
| `test.include` | `["src/**/*.test.ts"]` | 9 |
| `resolve.alias` | `{ "@": resolve(__dirname, "./src") }` | 11-13 |

### 7.2 Birim test dosyaları

Test sayıları `npm test` çıktısından; modül/semboller import satırlarından.

| Dosya | Test | Test edilen modül · semboller | DB |
|---|---|---|---|
| `src/lib/allocation.test.ts` | 23 | `allocation.ts` · `allocateFIFO`, `validateManualAllocation`, `agingBucket`, `summarizeAging` | dokunmuyor (saf) |
| `src/lib/audit.test.ts` | 5 | `audit.ts` · `sanitizeAuditData` | `vi.mock("@/lib/db", () => ({ prisma: {} }))` (`:4`); DB'ye dokunmuyor |
| `src/lib/commission.test.ts` | 21 | `commission.ts` · `DEFAULT_COMMISSION_RATE`, `calculateCommission`, `commissionAmount`, `formatPeriod`, `isPeriodBefore`, `netPortionOfAllocation`, `nextPeriod`, `periodEquals`, `periodOf` | saf |
| `src/lib/congress-ledger.test.ts` | 27 | `congress-ledger.ts` · `EARN_RATE_PERCENT`, `EXPIRY_MONTHS`, `availableBalance`, `earnFromCollection`, `expiredLots`, `expiringSoon`, `expiryFor`, `isExpired`, `planFifoSpend` | saf |
| `src/lib/doctor.test.ts` | 9 | `doctor.ts` · `canSellerOrderForDoctor`, `doctorScopeFor` | saf |
| `src/lib/money.test.ts` | 7 | `money.ts` · `formatTRY`, `kurusToTl`, `sumKurus`, `tlToKurus` | saf |
| `src/lib/pagination.test.ts` | 6 | `pagination.ts` · `DEFAULT_PER_PAGE`, `getPagination`, `pageCount` | saf |
| `src/lib/phone.test.ts` | 10 | `phone.ts` · `InvalidPhoneError`, `formatPhone`, `normalizePhone`, `tryNormalizePhone` | saf |
| `src/lib/reports.test.ts` | 11 | `reports.ts` · `ciroField`, `collectionRate`, `ratePercent`, `weightedDiscount` | saf |
| `src/lib/vat.test.ts` | 15 | `vat.ts` · `DEFAULT_VAT_RATE`, `discountRate`, `grossFromNet`, `lineTotals`, `netFromGross`, `sumLineTotals`, `vatAmount` | saf |
| **Toplam** | **134** | 10 dosya | DB'ye dokunan: 0 |

Birim testi olmayan `src/lib` modülleri (27 kaynak − 10 testli): `auth.ts`, `auth-actions.ts`, `commission-service.ts`, `congress-service.ts`, `db.ts`, `dealer-cari.ts`, `dealer-session.ts`, `dealer-shipment.ts`, `doctor-cari.ts`, `format.ts`, `rate-limit.ts`, `reports-service.ts`, `roles.ts`, `session.ts`, `settings.ts`, `validation.ts`, `vat-mode.ts`.

### 7.3 Playwright yapılandırması — `playwright.config.ts` (80 satır)

Dosya 30 satırı aştığı için içerik tablo hâlinde (yorum satırları 3-8, 30-33 hariç):

| Anahtar | Değer | Satır |
|---|---|---|
| import | `defineConfig, devices` from `@playwright/test` | 1 |
| `PORT` | `3100` | 9 |
| `baseURL` | `` `http://localhost:${PORT}` `` | 10 |
| `TEST_DATABASE_URL` | `process.env.TEST_DATABASE_URL ?? "postgresql://medikal:medikal_dev@localhost:5432/medikal_test?schema=public"` | 12-14 |
| `testDir` | `"e2e"` | 17 |
| `fullyParallel` | `false` | 18 |
| `forbidOnly` | `!!process.env.CI` | 19 |
| `retries` | `process.env.CI ? 1 : 0` | 20 |
| `workers` | `1` | 21 |
| `reporter` | `"html"` | 22 |
| `use` | `baseURL`, `trace: "on-first-retry"`, `screenshot: "only-on-failure"` | 24-28 |
| `webServer.command` | `` `DATABASE_URL="${TEST_DATABASE_URL}" npx prisma migrate reset --force` `` && `` `DATABASE_URL="${TEST_DATABASE_URL}" npm run db:seed` `` && `` `DATABASE_URL="${TEST_DATABASE_URL}" PORT=${PORT} npm run dev` `` | 35-39 |
| `webServer.url` | `baseURL` | 40 |
| `webServer.reuseExistingServer` | `false` | 41 |
| `webServer.timeout` | `120_000` | 42 |
| proje `setup` | `testMatch: /auth\.setup\.ts/` | 46 |
| proje `guest` | `testMatch: "guest/**/*.spec.ts"`, `devices["Desktop Chrome"]` | 47-51 |
| proje `admin` | `"admin/**/*.spec.ts"`, `dependencies: ["setup"]`, Desktop Chrome, `storageState: "playwright/.auth/admin.json"` | 52-60 |
| proje `seller` | `"seller/**/*.spec.ts"`, `["setup"]`, `storageState: "playwright/.auth/seller.json"` | 61-69 |
| proje `dealer` | `"dealer/**/*.spec.ts"`, `["setup"]`, `storageState: "playwright/.auth/dealer.json"` | 70-78 |
| `globalSetup` / `globalTeardown` | tanımlı değil | — |

**Testler arası DB durumu**

| Mekanizma | Bulgu | Adres |
|---|---|---|
| Koşu başı sıfırlama | `webServer` her koşuda `migrate reset --force` + seed | `playwright.config.ts:35-37` |
| Testler arası otomatik temizlik | yok (global teardown yok, `TRUNCATE` yok) | `git grep -n TRUNCATE -- e2e` → 0 |
| Eşzamanlılık sınırı | `workers: 1`, `fullyParallel: false` | `playwright.config.ts:18`, `:21` |
| Benzersiz veri | `unique(prefix)` = `` `${prefix}-${Date.now()}-${random}` `` | `e2e/helpers.ts:15-17` |
| Test içi geri alma | `beforeAll` sahiplik snapshot'ı + `afterEach` `UPDATE "Doctor" SET "ownerSellerId"` | `e2e/admin/congress.spec.ts:67-83` |
| Test içi silme | `DELETE FROM "CongressLedger"` / `"CongressRegistration"` (tek doktor) | `e2e/admin/congress.spec.ts:181-184`, `:241-244`, `:325-328` |
| `try/finally` ile durum geri yükleme | bayi/kullanıcı status | `e2e/admin/dealer.spec.ts:228-252`; `e2e/seller/session-revocation.spec.ts:42-50` |
| Elle geri yükleme | stok `0` → `100` | `e2e/admin/dealer.spec.ts:165`, `:182` |
| Elle geri yükleme | `ownerSellerId` | `e2e/admin/doctor-transfer.spec.ts:126`, `:158` |

### 7.4 E2E spec dosyaları

`npx playwright test --list` → **66 test / 19 dosya** (3'ü `auth.setup.ts`; `*.spec.ts` içinde 63). Proje dağılımı: admin 44 · seller 11 · guest 4 · dealer 4 · setup 3.

| Dosya | Test | Test ettiği akış |
|---|---|---|
| `e2e/auth.setup.ts` | 3 | admin / satıcı / bayi için login formundan geçip `storageState` dosyası yazar |
| `e2e/guest/auth.spec.ts` | 3 | yanlış şifre mesajı; girişsiz `/dashboard` ve `/` → `/login` |
| `e2e/guest/smoke.spec.ts` | 1 | `/login` hatasız render |
| `e2e/admin/smoke.spec.ts` | 8 | 8 admin sayfası açılır (`/dashboard`, `/products`, `/stock`, `/sellers`, `/orders`, `/shipping`, `/collections`, `/doctors`) |
| `e2e/admin/products.spec.ts` | 2 | ürün oluşturma; taban fiyat > liste fiyatı reddi |
| `e2e/admin/sellers.spec.ts` | 1 | satıcı oluşturma |
| `e2e/admin/collections.spec.ts` | 5 | tahsilat + FIFO mahsup; tahsilat iptali; kısmi tahsilat; yaşlandırma özeti; geçersiz tutar reddi |
| `e2e/admin/commissions.spec.ts` | 4 | kapanmış dönem dondurma ve iptal etkisi; açık dönem kapatılamaz; durum ilerletme; aynı dönem iki kez kapatılamaz |
| `e2e/admin/congress.spec.ts` | 5 | tahsilat → kongre kazanımı (+12 ay); yetersiz bakiye reddi; eşzamanlı rezervasyon yarışı; iptalde iade (son kullanma uzamaz); FIFO harcama |
| `e2e/admin/congress-edit.spec.ts` | 5 | kongre düzenleme; kayıtsız paket silme; paket değeri değişince `reservedAmount` sabit; kayıtlı paket silinemez; iptal edilen kongre satıcıda görünmez |
| `e2e/admin/dealer.spec.ts` | 5 | onayda stok düşümü + cari; onaylı sevkiyat iptali; stok yetersizse onay reddi; bayi sevkiyatı `CongressLedger`/`PaymentAllocation` sayısını değiştirmez; pasif bayi login olamaz |
| `e2e/admin/doctor-detail.spec.ts` | 4 | doktor detayı; gerekçeli manuel düzeltme + audit; gerekçesiz düzeltme reddi; bakiyeden fazla düşüm reddi |
| `e2e/admin/doctor-transfer.spec.ts` | 2 | doktor devri (geçmiş siparişler eski satıcıda); sahipsiz havuz |
| `e2e/admin/reports.spec.ts` | 3 | rapor tabloları; KDV toggle net ↔ brüt; tercih çerezde kalıcı |
| `e2e/dealer/panel.spec.ts` | 4 | panel açılır; talep stok/cariyi etkilemez; yalnız kendi fiyat listesi; admin sayfalarına erişemez |
| `e2e/seller/doctors.spec.ts` | 5 | doktor ekleme + sahiplik; aynı telefonla ikinci kayıt reddi; başka satıcının doktoru görünmez; "Düzenle" linki 404 vermez; sahibi olmayan doktora sipariş sunucuda reddi |
| `e2e/seller/orders.spec.ts` | 2 | sipariş oluşturma; admin sayfasına erişimde `/my-orders`'a yönlenme |
| `e2e/seller/pricing.spec.ts` | 3 | taban altı fiyat arayüz uyarısı; sunucu tarafı zorlama; KDV dahil/hariç dönüşüm + tercih |
| `e2e/seller/session-revocation.spec.ts` | 1 | pasifleştirilen satıcının oturumu sonraki istekte kesilir (`UPDATE "User"` ham SQL) |

### 7.5 Oturum kurulumunun testlerdeki yeri

| Soru | Bulgu | Adres |
|---|---|---|
| Üreten dosya | `e2e/auth.setup.ts` (`setup` projesi) | `playwright.config.ts:46` |
| Yöntem | **gerçek login akışı**: `login(page, USERS.x)` → `/login`'e gider, "E-posta"/"Şifre" alanlarını doldurur, "Giriş Yap"a tıklar, URL'nin `/login` olmadığını bekler; ardından `page.context().storageState({ path })` | `e2e/auth.setup.ts:8-24`; `e2e/helpers.ts:20-29` |
| Kullanıcılar | seed kullanıcıları `admin@medikal.local`, `ahmet@medikal.local`, `bayi@medikal.local` | `e2e/helpers.ts:4-8` |
| Dosyalar | `playwright/.auth/admin.json`, `seller.json`, `dealer.json` (gitignored) | `e2e/auth.setup.ts:4-6`; `.gitignore:55` |
| Token/cookie enjeksiyonu | yok (`git grep -nE 'addCookies|setExtraHTTPHeaders|authjs|next-auth\.session' -- e2e playwright.config.ts` → 0) | — |
| Test içinde ek bağlam | `browser.newContext({ storageState: "playwright/.auth/seller.json" })` | `e2e/admin/congress.spec.ts:130-131`, `:195-196`, `:260-261`, `:341-342`; `e2e/admin/congress-edit.spec.ts:159-160` (admin), `:183-184` (seller) |
| Oturumsuz bağlam | `browser.newContext()` (pasif bayi login denemesi) | `e2e/admin/dealer.spec.ts:234` |

### 7.6 `.github/workflows/*.yml`

Tek dosya: `.github/workflows/ci.yml` (81 satır). 30 satırı aştığı için içerik satır satır tablo hâlinde (yorum satırları 8, 14, 48-49 hariç):

| Satır | İçerik |
|---|---|
| 1 | `name: CI` |
| 3-6 | `on:` → `push: branches: [main]`; `pull_request:` |
| 9-11 | `concurrency:` `group: ${{ github.workflow }}-${{ github.ref }}`, `cancel-in-progress: true` |
| 13, 15-17 | `env:` `DATABASE_URL: postgresql://medikal:medikal_dev@localhost:5432/medikal_dev?schema=public` · `TEST_DATABASE_URL: postgresql://medikal:medikal_dev@localhost:5432/medikal_test?schema=public` · `AUTH_SECRET: ci-only-secret-not-used-in-production` |
| 19-21 | `jobs:` `verify:` `runs-on: ubuntu-latest` |
| 23-36 | `services: postgres:` `image: postgres:17-alpine` · `env: POSTGRES_USER: medikal, POSTGRES_PASSWORD: medikal_dev, POSTGRES_DB: medikal_dev` · `ports: - 5432:5432` · `options: --health-cmd "pg_isready -U medikal -d medikal_dev" --health-interval 5s --health-timeout 5s --health-retries 10` |
| 38-39 | `steps:` `- uses: actions/checkout@v4` |
| 41-44 | `- uses: actions/setup-node@v4` `with: node-version-file: .nvmrc`, `cache: npm` |
| 46 | `- run: npm ci` |
| 50-51 | `- name: Prisma client üret` `run: npx prisma generate` |
| 53-56 | `- name: e2e test veritabanını oluştur` `run: PGPASSWORD=medikal_dev psql -h localhost -U medikal -d medikal_dev -c 'CREATE DATABASE medikal_test OWNER medikal;'` |
| 58-59 | `- name: Migrasyonları uygula` `run: npx prisma migrate deploy` |
| 61-62 | `- name: Typecheck` `run: npm run typecheck` |
| 64-65 | `- name: Lint` `run: npm run lint` |
| 67-68 | `- name: Birim testler` `run: npm test` |
| 70-71 | `- name: Playwright tarayıcılarını kur` `run: npx playwright install --with-deps chromium` |
| 73-74 | `- name: E2E testler` `run: npm run test:e2e` |
| 76-81 | `- uses: actions/upload-artifact@v4` `if: ${{ !cancelled() }}` `with: name: playwright-report`, `path: playwright-report/`, `retention-days: 7` |

### 7.7 Eşzamanlılık (paralel bağlantı) testi

Var — 1 adet: `e2e/admin/congress.spec.ts:168-228` ("RULE-09 … yarış testi"). Aynı `seller` storageState'iyle iki ayrı tarayıcı bağlamı açılıp aynı pakete kayıt talebi `Promise.all([runOnce(), runOnce()])` ile gönderilir (`:194-213`); sonrasında aktif kayıt ≤ 1 ve bakiye ≥ 0 SQL ile doğrulanır (`:215-227`). Başka eşzamanlılık testi: 0 (`grep -rniE "eşzamanlı|yarış|concurr|parallel|race" e2e src/lib/*.test.ts` yalnız bu dosyayı döndürdü). Birim testlerde eşzamanlılık testi: 0.

---

## 8. Zaman katmanı

### 8.1 `new Date()` geçişleri

Komut: izlenen `.ts/.tsx/.mjs` dosyalarında `new Date\(\)` (argümansız) ve `new Date\((?!\))` (argümanlı) — yorum satırları hariç.

**Argümansız `new Date()` — toplam 43, 22 dosya**

| Dosya | Sayı | Satırlar |
|---|---|---|
| `e2e/admin/commissions.spec.ts` | 3 | 28, 139, 155 |
| `e2e/admin/congress.spec.ts` | 4 | 40, 247, 336, 339 |
| `prisma/seed.ts` | 4 | 175, 209, 289, 290 |
| `scripts/backup.ts` | 1 | 50 |
| `src/app/(admin)/collections/actions.ts` | 2 | 67, 175 |
| `src/app/(admin)/commissions/actions.ts` | 1 | 47 |
| `src/app/(admin)/commissions/page.tsx` | 1 | 31 |
| `src/app/(admin)/congresses/actions.ts` | 2 | 303, 345 |
| `src/app/(admin)/dashboard/page.tsx` | 1 | 13 |
| `src/app/(admin)/dealers/actions.ts` | 4 | 170, 171, 280, 338 |
| `src/app/(admin)/doctors/[id]/actions.ts` | 2 | 44, 67 |
| `src/app/(admin)/doctors/actions.ts` | 1 | 51 |
| `src/app/(admin)/shipping/actions.ts` | 2 | 34, 40 |
| `src/app/(dealer)/bayi/talep/actions.ts` | 1 | 99 |
| `src/app/(seller)/my-commissions/page.tsx` | 1 | 16 |
| `src/app/(seller)/my-congresses/actions.ts` | 1 | 54 |
| `src/app/(seller)/my-orders/actions.ts` | 1 | 67 |
| `src/lib/allocation.ts` | 2 | 127, 139 (varsayılan parametre `asOf`) |
| `src/lib/commission-service.ts` | 1 | 152 |
| `src/lib/congress-ledger.ts` | 5 | 52, 59, 73, 82, 114 (varsayılan parametre `asOf`) |
| `src/lib/doctor-cari.ts` | 1 | 156 |
| `src/lib/reports-service.ts` | 2 | 104, 177 |

**Argümanlı `new Date(<x>)` — toplam 39, 12 dosya**

| Dosya | Sayı | Satırlar |
|---|---|---|
| `e2e/admin/commissions.spec.ts` | 2 | 29, 49 |
| `e2e/admin/congress.spec.ts` | 1 | 41 |
| `src/app/(admin)/collections/actions.ts` | 2 | 66 (`String(formData.get("paidAt"))`), 216 (`raw` = `newDueDate`) |
| `src/app/(admin)/congresses/actions.ts` | 2 | 29, 30 (`startDate`, `endDate` form string'i) |
| `src/lib/allocation.test.ts` | 5 | 10, 170, 171, 175×2 |
| `src/lib/audit.test.ts` | 1 | 24 |
| `src/lib/commission-service.ts` | 2 | 19, 20 (`new Date(y, m-1, 1, 0,0,0,0)` yerel saat) |
| `src/lib/commission.test.ts` | 2 | 22, 23 |
| `src/lib/congress-ledger.test.ts` | 17 | 22, 26×2, 39×2, 44×2, 48×2, 53, 60, 67, 103, 104, 109, 192, 203 |
| `src/lib/congress-ledger.ts` | 3 | 44, 46, 84 |
| `src/lib/rate-limit.ts` | 1 | 53 |
| `src/lib/settings.ts` | 1 | 53 |

Ek: `Date.now()` 12 geçiş / 6 dosya — `e2e/admin/congress-edit.spec.ts` (5), `e2e/helpers.ts:16`, `e2e/seller/doctors.spec.ts:29`, `src/app/(dealer)/bayi/talep/RequestForm.tsx:43`, `src/app/(seller)/my-orders/OrderForm.tsx:120`, `src/lib/rate-limit.ts:30,50,53`.

Yerel saat getter/setter'ları (`getFullYear|getMonth|getDate|setDate|setHours|setFullYear|getHours|getMinutes`) — `src` altında: `src/lib/allocation.ts:118-122` (`Date.UTC(dueDate.getFullYear(), …)`), `src/lib/commission.ts:23`, `src/lib/congress-ledger.ts:38-47`, `:85`, `src/lib/settings.ts:54`, `src/app/(admin)/dashboard/page.tsx:14` (`setHours(0,0,0,0)`), `src/app/(admin)/congresses/[id]/edit/page.tsx:11`; ayrıca `scripts/backup.ts:52-54`, `e2e/admin/commissions.spec.ts` (8), `e2e/admin/congress.spec.ts` (8), `src/lib/congress-ledger.test.ts` (5). Toplam 47 / 10 dosya.

### 8.2 Şemadaki `DateTime` alanları — 41

`@db.Date` (veya herhangi bir `@db.*`) taşıyan alan: **0** (`grep -c '@db\.' prisma/schema.prisma`). SQL'de 41 kolonun tamamı `TIMESTAMP(3)` (zaman dilimsiz), `TIMESTAMPTZ` 0.

| Model.alan (schema satırı) | Nullable |
|---|---|
| `User.createdAt` (:57) · `Doctor.createdAt` (:93) · `DoctorAssignment.fromDate` (:113) · `Product.createdAt` (:134) · `StockMovement.createdAt` (:153) · `Order.dueDate` (:177) · `Order.orderDate` (:179) · `Order.createdAt` (:180) · `Shipment.createdAt` (:221) · `DoctorPayment.paidAt` (:244) · `DoctorPayment.createdAt` (:253) · `PaymentAllocation.createdAt` (:271) · `DueDateChange.oldDueDate` (:283) · `DueDateChange.newDueDate` (:284) · `DueDateChange.changedAt` (:287) · `CommissionPeriod.closedAt` (:316) · `CommissionAdjustment.createdAt` (:341) · `Congress.startDate` (:381) · `Congress.endDate` (:382) · `Congress.createdAt` (:387) · `CongressRegistration.requestedAt` (:422) · `CongressLedger.earnedAt` (:447) · `CongressLedger.createdAt` (:459) · `SystemSetting.updatedAt` (:470) · `Dealer.createdAt` (:498) · `DealerShipment.requestedAt` (:545) · `DealerPayment.paidAt` (:577) · `DealerPayment.createdAt` (:581) · `LoginAttempt.updatedAt` (:592) · `AuditLog.createdAt` (:608) | hayır (30) |
| `DoctorAssignment.toDate` (:114) · `Shipment.shippedAt` (:219) · `DoctorPayment.cancelledAt` (:250) · `Congress.registrationDeadline` (:384) · `CongressRegistration.approvedAt` (:423) · `CongressRegistration.cancelledAt` (:425) · `CongressLedger.expiresAt` (:448) · `DealerShipment.approvedAt` (:539) · `DealerShipment.cancelledAt` (:541) · `DealerShipment.dueDate` (:543) · `LoginAttempt.lockedUntil` (:591) | evet (11) |

### 8.3 Tarih biçimlendirme / ayrıştırma

| Soru | Bulgu | Adres |
|---|---|---|
| Harici tarih kütüphanesi | yok: `date-fns`, `dayjs`, `moment`, `luxon` ne `package.json`'da ne import'ta (`git grep -nE 'date-fns|dayjs|moment|luxon'` → 0) | — |
| Yardımcı modül | `src/lib/format.ts` — `formatDate(d)` ve `formatDateTime(d)`, ikisi de `new Intl.DateTimeFormat("tr-TR", {...})`; `timeZone` seçeneği yok | `src/lib/format.ts:1-7`, `:9-17` |
| Yerel kopya | `src/app/(admin)/stock/page.tsx:5-13` kendi `formatDate`'i (`Intl.DateTimeFormat("tr-TR")`, saat+dakika dahil) | — |
| `Intl.DateTimeFormat` | 3 geçiş / 2 dosya (`format.ts:2`, `:10`; `stock/page.tsx:6`) | — |
| `format.ts` `formatDate` çağrıları | 23 / 15 dosya: `collections/page.tsx` 1 · `congresses/page.tsx` 3 · `dealer-shipments/page.tsx` 1 · `dealers/[id]/page.tsx` 3 · `doctors/[id]/page.tsx` 4 · `orders/page.tsx` 1 · `sellers/[id]/page.tsx` 1 · `shipping/page.tsx` 1 · `bayi/odemeler/page.tsx` 1 · `bayi/page.tsx` 1 · `bayi/sevkiyatlar/page.tsx` 2 · `account/page.tsx` 1 · `my-congresses/page.tsx` 1 · `my-orders/page.tsx` 1 · `components/OrderDetail.tsx` 1 | `git grep -n 'formatDate('` (tanımlar ve `stock/page.tsx` hariç) |
| `formatDateTime` çağrıları | 3: `audit-logs/page.tsx:107`, `shipping/page.tsx:145`, `components/OrderDetail.tsx:174` | — |
| Gün ekleme | `addDays(from, days)` — `setDate(getDate() + days)` (yerel) | `src/lib/settings.ts:52-56` |
| Dönem sınırları | `periodRange(p)` — yerel takvim ayı `[start, end)` | `src/lib/commission-service.ts:17-22` |
| Yaşlandırma gün farkı | `daysOverdue` — yerel getter'larla `Date.UTC(...)` | `src/lib/allocation.ts:116-124` |
| Son kullanma | `expiryFor(earnedAt)` — +12 ay, ay sonu kırpma | `src/lib/congress-ledger.ts:37-49` |
| Form tarih girdileri (`type="date"`) | `paidAt` (`CollectionForm.tsx:40`), `startDate`/`endDate` (`CongressForms.tsx:49`, `:56`); ayrıştırma `new Date(String(...))` | `collections/actions.ts:65-67`; `congresses/actions.ts:29-30` |
| Form'a tarih yazma | `toDateInput(d)` — yerel `YYYY-MM-DD` | `src/app/(admin)/congresses/[id]/edit/page.tsx:9-12` |
| ISO serileştirme | `toISOString()`: `src/lib/audit.ts:113` (audit JSON); e2e 5 geçiş | — |

### 8.4 Container ve veritabanı zaman dilimi

| Yer | Bulgu |
|---|---|
| `docker-compose.yml` (23 satır) | `TZ` / `PGTZ` yok; `environment` yalnız `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (`:6-9`) |
| `Dockerfile` | BULUNAMADI (`ls Dockerfile*` → yok; `git ls-files | grep -i dockerfile` → 0) |
| `.github/workflows/ci.yml` | `TZ` / `PGTZ` yok (`env` `:13-17`, servis `env` `:26-29`) |
| `.env.example` | `TZ` / `PGTZ` yok (değişkenler §11.3) |
| Kod | `git grep -nE '\b(TZ|PGTZ|timezone|time_zone|TimeZone)\b' -- . ':!package-lock.json'` → 0; `Intl` çağrılarında `timeZone` seçeneği → 0 |

`.env.example` içeriği (10 satır):

```dotenv
# Bu dosya bir ŞABLONDUR — gerçek gizli değerleri buraya YAZMA.
# Kurulumda kopyala:  cp .env.example .env  ve değerleri doldur.

# Veritabanı bağlantısı (PostgreSQL).
# Yerel geliştirme için:  docker compose up -d
DATABASE_URL="postgresql://medikal:medikal_dev@localhost:5432/medikal_dev?schema=public"

# Auth.js / NextAuth JWT imzalama anahtarı.
# Üret:  openssl rand -base64 32
AUTH_SECRET=""
```

---

## 9. Server action ve hata yüzeyi

### 9.1 Server action sayısı

Komut: `git grep -l '^"use server"' -- src` → **16 dosya** · `git grep -cE '^export (async )?function' -- <bu dosyalar>` → **43 export edilmiş fonksiyon**. Dosya içi (satır içi) `"use server"`: 0.

| Dosya | Export | Fonksiyonlar |
|---|---|---|
| `src/app/(admin)/collections/actions.ts` | 3 | `recordCollection`, `cancelCollection`, `changeDueDate` |
| `src/app/(admin)/commissions/actions.ts` | 2 | `closePeriod`, `advanceCommissionStatus` |
| `src/app/(admin)/congresses/actions.ts` | 9 | `createCongress`, `updateCongress`, `cancelCongress`, `deleteCongress`, `createPackage`, `updatePackage`, `deletePackage`, `approveRegistration`, `cancelRegistration` |
| `src/app/(admin)/dealers/actions.ts` | 8 | `createDealer`, `setDealerPrice`, `approveShipment`, `createShipment`, `rejectShipment`, `cancelShipment`, `recordDealerPayment`, `toggleDealerStatus` |
| `src/app/(admin)/doctors/[id]/actions.ts` | 1 | `adjustCongressBalance` |
| `src/app/(admin)/doctors/actions.ts` | 1 | `transferDoctor` |
| `src/app/(admin)/orders/actions.ts` | 3 | `prepareOrder`, `markDelivered`, `cancelOrder` |
| `src/app/(admin)/products/actions.ts` | 3 | `createProduct`, `updateProduct`, `deleteProduct` |
| `src/app/(admin)/sellers/actions.ts` | 3 | `createSeller`, `updateSeller`, `deleteSeller` |
| `src/app/(admin)/shipping/actions.ts` | 1 | `shipOrder` |
| `src/app/(admin)/stock/actions.ts` | 1 | `addStockEntry` |
| `src/app/(dealer)/bayi/talep/actions.ts` | 2 | `requestShipment`, `withdrawRequest` |
| `src/app/(seller)/my-congresses/actions.ts` | 1 | `requestRegistration` |
| `src/app/(seller)/my-doctors/actions.ts` | 2 | `createDoctor`, `updateDoctor` |
| `src/app/(seller)/my-orders/actions.ts` | 1 | `createOrder` |
| `src/lib/auth-actions.ts` | 2 | `loginAction`, `logoutAction` |

Export edilmeyen iç yardımcı: `approveShipmentTx` (`src/app/(admin)/dealers/actions.ts:127`), `parseMethod`, `parsePeriod`, `parseCongressForm`, `parsePackageForm`, `parseProductForm`, `parseDoctorForm`, `revalidateOrders`, `lockedMessage`.

İstemciden çağrılma biçimi: `useActionState` 44 geçiş / 17 dosya (`git grep -c useActionState -- src`); `.bind(null, …)` 11 geçiş (`git grep -nE '\.bind\(null' -- src`); `useTransition` içinde doğrudan çağrı `src/app/(admin)/congresses/CongressControls.tsx:15-18`.

### 9.2 Dönüş şekilleri

Tip tanımları okunarak; 14 state tip adı, 3 yapısal şekil + `void`.

| Şekil | Tip adları (adres) | Action sayısı |
|---|---|---|
| **A** `{ error?: string; ok?: string }` | `CollectionState` (`collections/actions.ts:20`), `CommissionActionState` (`commissions/actions.ts:20`), `CongressState` (`congresses/actions.ts:13`), `DealerState` (`dealers/actions.ts:15`), `AdjustState` (`doctors/[id]/actions.ts:10`), `TransferState` (`doctors/actions.ts:8`), `RequestState` (`bayi/talep/actions.ts:9`), `RegistrationState` (`my-congresses/actions.ts:11`) | 26 |
| **B** `{ error?: string }` | `ProductFormState` (`products/actions.ts:12`), `SellerFormState` (`sellers/actions.ts:11`), `DoctorFormState` (`my-doctors/actions.ts:10`), `OrderFormState` (`my-orders/actions.ts:15`), `LoginState` (`src/lib/auth-actions.ts:8`) | 8 (`createProduct`, `updateProduct`, `createSeller`, `updateSeller`, `createDoctor`, `updateDoctor`, `createOrder`, `loginAction`) |
| **C** `Promise<void>` + `redirect()` / `signOut` | — | 8 (`prepareOrder`, `markDelivered`, `cancelOrder`, `deleteProduct`, `deleteSeller`, `shipOrder`, `toggleDealerStatus`, `logoutAction`) |
| **D** `{ error?: string; ok?: boolean }` | `StockFormState` (`stock/actions.ts:9`) | 1 (`addStockEntry`) |

B şeklindeki action'lardan başarı yolunda `redirect()` ile biten: `createProduct`, `updateProduct`, `createSeller`, `updateSeller`, `createDoctor`, `updateDoctor`, `createOrder`; A şeklinden `updateCongress` (`congresses/actions.ts:110`) ve `createDealer` (`dealers/actions.ts:82`). `redirect(` toplam 29 geçiş / 11 dosya.

En sık üç şekil:

```ts
// A — 26 action · src/app/(admin)/collections/actions.ts:20
export type CollectionState = { error?: string; ok?: string };
//   ör. return { error: "Doktor seçiniz." };            (:46)
//       return { ok: "Vade güncellendi." };              (:262)

// B — 8 action · src/app/(admin)/products/actions.ts:12
export type ProductFormState = { error?: string };
//   ör. if (parsed.error) return { error: parsed.error }; (:56) … redirect("/products"); (:91)

// C — 8 action · src/app/(admin)/orders/actions.ts:17-35
export async function prepareOrder(id: string) {
  const session = await requireAdmin();
  // … updateMany + createAuditLog …
  revalidateOrders();
  redirect(`/orders/${id}`);
}
```

**`throw` davranışı**

| Soru | Bulgu |
|---|---|
| Çağırana kasıtlı `throw` eden export action | 1: `loginAction` — `AuthError` dışındaki hatayı yeniden fırlatır (`src/lib/auth-actions.ts:40`) |
| Action dosyalarındaki `throw new Error` | 10 geçiş, tamamı `try/catch` kapsamında yakalanıp `{ error }`'a çevriliyor: `dealers/actions.ts:133,134,150` (`approveShipmentTx`; yakalayan `:185-189`, `:227-245`) · `doctors/[id]/actions.ts:80,84` (try `:41-104`) · `my-congresses/actions.ts:97` (try `:75-113`) · `my-orders/actions.ts:88,90,100,115` (try `:70-167`) |
| `try/catch` içinde olmayan `$transaction` | `collections/actions.ts:156`, `:238` · `commissions/actions.ts:76` · `congresses/actions.ts:339` · `dealers/actions.ts:316`, `:404` · `doctors/actions.ts:47` · `orders/actions.ts:41`, `:81` · `shipping/actions.ts:23` · `stock/actions.ts:28` (11) |
| `try/catch` içindeki `$transaction` | `collections/actions.ts:59` · `dealers/actions.ts:53`, `:128` (çağrı yeri try içinde), `:228` · `doctors/[id]/actions.ts:42` · `my-congresses/actions.ts:76` · `my-doctors/actions.ts:74` · `my-orders/actions.ts:71` (8) |
| `$transaction(` toplam | 20 geçiş / 13 dosya (`src/lib/congress-service.ts:255` dahil) |
| `catch` bloğunda sabit mesaj (hata ayrıntısı atılıyor) | ör. `collections/actions.ts:111-113`, `dealers/actions.ts:69-71`, `products/actions.ts:65-67`, `sellers/actions.ts:45-47`, `my-doctors/actions.ts:89-93` |
| `catch` bloğunda `e.message` dönen | `dealers/actions.ts:188`, `:244` · `doctors/[id]/actions.ts:102` · `bayi/talep/actions.ts:57` · `my-congresses/actions.ts:111` · `my-orders/actions.ts:165` |

### 9.3 Ortak sarmalayıcı

Yok: `git grep -nE 'withAuth|safeAction|createSafeAction|next-safe-action|actionClient' -- src` → 0. Her action kendi guard'ını (`requireAdmin`/`requireSeller`/`requireDealerAccount`) ilk satırlarda çağırır, `createAuditLog` ve `revalidatePath` çağrılarını tek tek yapar (`createAuditLog(` 43 geçiş / 18 dosya; `revalidatePath(` 53 / 15).

### 9.4 Zod kullanım deseni

| Soru | Bulgu | Adres |
|---|---|---|
| `zod` import eden dosya | 2 | `src/lib/validation.ts:9`, `src/app/(seller)/my-orders/actions.ts:5` |
| Ortak şemalar | `amountTLSchema` (> 0, ≤ 1e9, tam kuruş), `priceTLSchema` (≥ 0, ≤ 1e9, tam kuruş), `quantitySchema` (int, > 0, ≤ 1e6) | `src/lib/validation.ts:20-34` |
| Action içi şema | `orderLinesSchema` (`z.array(z.object({ productId, quantity, netUnitPriceTL? })).min(1)`) | `src/app/(seller)/my-orders/actions.ts:19-29` |
| Doğrulama yeri | server action gövdesi, guard'dan sonra | `safeParse(` 8 geçiş / 6 dosya: `collections/actions.ts:47`, `congresses/actions.ts:171`, `dealers/actions.ts:97`, `:366`, `products/actions.ts:27`, `:29`, `stock/actions.ts:22`, `my-orders/actions.ts:59` |
| Hata taşıma | yalnız `.success` boole'u okunur; dönen mesaj action'da yazılı sabit Türkçe string. `.parse(` (fırlatan), `ZodError`, `.issues`, `.flatten(` kullanımı: 0 | ör. `collections/actions.ts:47-49`, `my-orders/actions.ts:60-61` |
| Zod dışı doğrulama | elle `if` kontrolleri | ör. `products/actions.ts:26`, `:31-36`; `commissions/actions.ts:22-28`; `my-doctors/actions.ts:19-30` |

### 9.5 `error.tsx` / `global-error.tsx` / `not-found.tsx`

Komut: `find src/app -name error.tsx -o -name global-error.tsx -o -name not-found.tsx -o -name loading.tsx -o -name template.tsx`.

| Dosya | Yer | Not |
|---|---|---|
| `error.tsx` | `src/app/error.tsx` (tek) | `"use client"`; bileşen adı `GlobalError`; `console.error` + `error.digest` gösterimi + `reset` butonu (`:1`, `:5`, `:12-14`, `:25-29`, `:30-35`) |
| `global-error.tsx` | BULUNAMADI | — |
| `not-found.tsx` | `src/app/not-found.tsx` (tek) | — |
| `loading.tsx` | `src/app/loading.tsx` (tek) | — |
| Grup seviyesinde (`(admin)`, `(seller)`, `(dealer)`) error/not-found/loading | yok | — |
| `notFound()` çağrısı | 9 / 9 dosya | `congresses/[id]/edit`, `dealers/[id]`, `doctors/[id]`, `orders/[id]`, `products/[id]/edit`, `sellers/[id]/edit`, `sellers/[id]`, `my-doctors/[id]/edit`, `my-orders/[id]` sayfaları |

### 9.6 `AuditLog` yazan merkezî fonksiyon

`createAuditLog` — `src/lib/audit.ts:148-163`:

```ts
export async function createAuditLog(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        beforeData: serialize(input.before),
        afterData: serialize(input.after),
      },
    });
  } catch (err) {
    console.error("[audit] kayıt oluşturulamadı:", err);
  }
}
```

| Parça | Bulgu | Adres |
|---|---|---|
| Girdi tipi | `{ actorId?: string \| null; action: AuditAction; entityType: string; entityId?: string \| null; before?: unknown; after?: unknown }` | `src/lib/audit.ts:138-145` |
| `serialize` | `undefined`/`null` → `null`; `JSON.stringify(sanitizeAuditData(data))`; hata → `null` | `src/lib/audit.ts:129-136` |
| **Sanitize edilen alanlar (`SENSITIVE_KEYS`)** | `passwordHash`, `password`, `token`, `accessToken`, `refreshToken`, `secret` — iç içe nesnelerde de çıkarılır | `src/lib/audit.ts:102-109`, `:121` |
| Diğer dönüşümler | `Date` → `toISOString()`; `bigint` → `toString()`; diziler öğe öğe | `src/lib/audit.ts:113`, `:116`, `:117` |
| Action sabitleri | `AUDIT_ACTIONS` 39 anahtar; etiketler `AUDIT_ACTION_LABELS` | `src/lib/audit.ts:14-54`, `:59-99` |
| Başka `auditLog` yazan yer | yok (`git grep -n 'auditLog\.' -- src` → yalnız `audit.ts:150` yazma, `audit-logs/page.tsx:21` okuma) | — |
| Audit filtre listesi | `ENTITY_TYPES = ["Product", "Order", "Payment", "Seller", "Auth"]` | `src/app/(admin)/audit-logs/page.tsx:7` |

---

## 10. Frontend yüzeyi

### 10.1 Route grupları ve sayfalar

Komut: `git ls-files 'src/app/**/page.tsx' 'src/app/page.tsx' | wc -l` → **41 sayfa**. Layout: 4 (`src/app/layout.tsx`, `(admin)`, `(seller)`, `(dealer)`). Route handler: 1 (`src/app/api/auth/[...nextauth]/route.ts`).

| Grup | Sayfa sayısı |
|---|---|
| `(admin)` | 24 |
| `(seller)` | 9 |
| `(dealer)` | 5 |
| grup dışı | 3 |

**`(admin)` — 24:** `/audit-logs` · `/collections` · `/commissions` · `/congresses` · `/congresses/[id]/edit` · `/dashboard` · `/dealer-shipments` · `/dealers` · `/dealers/new` · `/dealers/[id]` · `/doctors` · `/doctors/[id]` · `/orders` · `/orders/[id]` · `/products` · `/products/new` · `/products/[id]/edit` · `/reports` · `/sellers` · `/sellers/new` · `/sellers/[id]` · `/sellers/[id]/edit` · `/shipping` · `/stock`

**`(seller)` — 9:** `/account` · `/my-commissions` · `/my-congresses` · `/my-doctors` · `/my-doctors/new` · `/my-doctors/[id]/edit` · `/my-orders` · `/my-orders/new` · `/my-orders/[id]`

**`(dealer)` — 5:** `/bayi` · `/bayi/fiyatlar` · `/bayi/odemeler` · `/bayi/sevkiyatlar` · `/bayi/talep`

**Grup dışı — 3:** `/` (`src/app/page.tsx`) · `/login` (`src/app/login/page.tsx`) · `/privacy` (`src/app/privacy/page.tsx`)

**API:** `/api/auth/[...nextauth]` (`GET`, `POST`).

Sidebar menü öğeleri: admin 14 (`src/app/(admin)/layout.tsx:20-35`), seller 5 (`src/app/(seller)/layout.tsx:11-17`), dealer 5 (`src/app/(dealer)/layout.tsx:11-17`).

### 10.2 KDV toggle'ına dokunan dosyalar

Komut: `git grep -nE 'vat-mode|VAT_MODE_COOKIE|\bVatMode\b|VatToggle|parseVatMode'` → **40 geçiş / 6 dosya** (src).

| Dosya | Geçiş | Satırlar | Rol |
|---|---|---|---|
| `src/lib/vat-mode.ts` | 4 | 12, 14, 17×2 | `type VatMode = "NET" \| "GROSS"`, `VAT_MODE_COOKIE = "vatMode"`, `parseVatMode` |
| `src/components/VatToggle.tsx` | 10 | 4×3, 6, 7, 14, 15, 17×2, 20 | istemci toggle; çerez yazar (`:7`), `router.refresh()` (`:22`) |
| `src/app/(admin)/reports/page.tsx` | 8 | 5×3, 13×2, 20×2, 43 | çerezi okur (`:20`), `<VatToggle>` render (`:43`) |
| `src/lib/reports-service.ts` | 5 | 5×2, 18, 79, 142 | `mode` parametresiyle `netTotal`/`grossTotal` seçimi |
| `src/app/(seller)/my-orders/new/page.tsx` | 5 | 5×3, 12, 13 | çerezi okur, `initialVatMode` prop'u |
| `src/app/(seller)/my-orders/OrderForm.tsx` | 8 | 8×3, 21, 22, 42, 53, 72 | form içi kendi KDV düğmeleri (`:181-202`) ve çerez yazımı (`:21-23`) |

İlgili: `ciroField(mode)` `src/lib/reports.ts:43-45` (yalnız `reports.test.ts`'te çağrılıyor). E2E: `e2e/admin/reports.spec.ts:40-91`, `e2e/seller/pricing.spec.ts:44-61`.

### 10.3 `netMinPrice` / taban fiyat reddine dokunan dosyalar

Komut: izlenen `.ts/.tsx/.mjs` dosyalarında `netMinPrice` → **15 geçiş / 8 dosya** (tabloya ayrıca şema satırı eklendi).

| Dosya | Satırlar | İşlev |
|---|---|---|
| `prisma/schema.prisma` | 129 | alan tanımı (`BigInt @default(0)`) |
| `prisma/seed.ts` | 78 | seed değeri |
| `src/app/(admin)/products/ProductForm.tsx` | 24, 52, 57 | form alanı |
| `src/app/(admin)/products/[id]/edit/page.tsx` | 33×2 | varsayılan değer |
| `src/app/(admin)/products/actions.ts` | 19, 43 | ayrıştırma + "Taban fiyat liste fiyatından yüksek olamaz" (`:33-36`) |
| `src/app/(admin)/products/page.tsx` | 77 | liste gösterimi |
| `src/app/(seller)/my-orders/OrderForm.tsx` | 16, 100, 339 | istemci `belowMin` uyarısı, gönder butonunu kilitler (`:115`, `:369`) |
| `src/app/(seller)/my-orders/actions.ts` | 99, 102 | **sunucu reddi**: `netUnitPrice < product.netMinPrice` → `throw` → `{ error }` |
| `src/app/(seller)/my-orders/new/page.tsx` | 31 | select |

Bayi kanalında (`DealerPrice`, `buildShipment`) taban fiyat kontrolü: 0 (`src/lib/dealer-shipment.ts` ve `dealers/actions.ts`'te `netMinPrice` geçişi yok).

### 10.4 `Role` değerlerinin string olarak geçtiği yerler

Komut: izlenen `.ts/.tsx/.mjs` dosyalarında `"ADMIN"` veya `'ADMIN'` deseni (SELLER ve DEALER için aynı).

| Değer | Toplam | Dosya:satır |
|---|---|---|
| `"ADMIN"` | 5 / 5 dosya | `e2e/admin/commissions.spec.ts:55` · `prisma/seed.ts:56` · `src/lib/doctor.test.ts:65` · `src/lib/doctor.ts:49` · `src/lib/session.ts:44` |
| `"SELLER"` | 17 / 15 dosya | `e2e/admin/commissions.spec.ts:153` · `e2e/admin/congress-edit.spec.ts:87,130` · `e2e/admin/doctor-transfer.spec.ts:69` · `prisma/seed.ts:68` · `src/app/(admin)/commissions/page.tsx:35` · `src/app/(admin)/dashboard/page.tsx:48` · `src/app/(admin)/doctors/actions.ts:35` · `src/app/(admin)/doctors/page.tsx:32` · `src/app/(admin)/sellers/[id]/edit/page.tsx:14` · `src/app/(admin)/sellers/[id]/page.tsx:22` · `src/app/(admin)/sellers/actions.ts:41,95` · `src/app/(admin)/sellers/page.tsx:23` · `src/lib/doctor.test.ts:69` · `src/lib/reports-service.ts:20` · `src/lib/session.ts:51` |
| `"DEALER"` | 4 / 4 dosya | `prisma/seed.ts:309` · `src/app/(admin)/dealers/actions.ts:61` · `src/lib/doctor.test.ts:75` · `src/lib/session.ts:58` |

Tırnaksız anahtar olarak: `ADMIN:`, `SELLER:`, `DEALER:` → `src/lib/roles.ts:11-13`. Enum tanımı `prisma/schema.prisma:18-22`, SQL `migration.sql:2`; şema varsayılanı `@default(SELLER)` (`schema.prisma:55`).

### 10.5 Paylaşılan bileşenler — `src/components/`

9 dosya, 732 satır; dışa verilen bileşen sayısı 18 (+1 sabit, +1 tip).

| Dosya | Satır | `"use client"` | Dışa verilenler |
|---|---|---|---|
| `AppShell.tsx` | 82 | hayır | `default AppShell`, `type NavItem` |
| `ConfirmSubmit.tsx` | 27 | evet | `default ConfirmSubmit` |
| `form.tsx` | 143 | evet | `Field`, `SelectField`, `TextArea`, `SubmitButton`, `FormError` |
| `LogoutButton.tsx` | 16 | evet | `default LogoutButton` |
| `OrderDetail.tsx` | 183 | hayır | `default OrderDetail` |
| `Pagination.tsx` | 62 | hayır | `default Pagination` |
| `SidebarLink.tsx` | 34 | evet | `default SidebarLink` |
| `ui.tsx` | 136 | hayır | `PageHeader`, `LinkButton`, `Card`, `StatusBadge`, `StatCard`, `EmptyRow`, `const PAYMENT_METHOD_LABELS` |
| `VatToggle.tsx` | 49 | evet | `default VatToggle` |

`src/app` altında `"use client"` ile başlayan 20 dosya var (`git grep -l '^"use client"' -- src/app`); `login/page.tsx` ve `error.tsx` dışındaki 18'i route'a özgü bileşendir.

---

## 11. Çalışma ve dağıtım

### 11.1 `docker-compose.yml` (çalışma ağacındaki hâli, 23 satır)

```yaml
services:
  postgres:
    image: postgres:17-alpine
    container_name: medikal_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: medikal
      POSTGRES_PASSWORD: medikal_dev
      POSTGRES_DB: medikal_dev
    ports:
      - "5433:5432"
    volumes:
      - medikal_pgdata:/var/lib/postgresql/data
      # e2e testleri ayrı bir veritabanında koşar (playwright.config.ts).
      - ./docker/init-test-db.sql:/docker-entrypoint-initdb.d/init-test-db.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U medikal -d medikal_dev"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  medikal_pgdata:
```

Çalışma ağacı ↔ HEAD farkı (`git diff docker-compose.yml`): satır 11 — HEAD `"5432:5432"`, çalışma ağacı `"5433:5432"`. `localhost:5432` bağlantı dizesi geçen yerler: `.env.example:6`, `playwright.config.ts:14`, `.github/workflows/ci.yml:15-16` (CI servisi `5432:5432`, `:31`).

`docker/init-test-db.sql` (3 satır): yorum 2 satır + `CREATE DATABASE medikal_test OWNER medikal;`. Diğer `docker-compose*.yml`: yok (`ls docker-compose*.yml` → yalnız bu dosya).

### 11.2 `Dockerfile`

BULUNAMADI (`ls Dockerfile*` → yok; `git ls-files | grep -iE 'dockerfile'` → 0). `next.config.ts` boş yapılandırma (`output` anahtarı yok, `next.config.ts:3-5`).

### 11.3 `.env.example` değişkenleri

| Değişken | Değer (şablon) | Satır |
|---|---|---|
| `DATABASE_URL` | `"postgresql://medikal:medikal_dev@localhost:5432/medikal_dev?schema=public"` | 6 |
| `AUTH_SECRET` | `""` | 10 |

Toplam 2 değişken (tam içerik §8.4). Gitignored `.env` dosyasında da yalnız bu iki anahtar var (değerler rapora alınmadı; `sed 's/=.*//' .env`). Kodda okunan diğer ortam değişkenleri: `NODE_ENV` (`src/lib/db.ts:24`, `:30`), `TEST_DATABASE_URL` (`playwright.config.ts:13` ve 11 e2e spec), `CI` (`playwright.config.ts:19-20`), `PG_CONTAINER` (`scripts/backup.ts:24`), `PORT` (`playwright.config.ts:38`).

### 11.4 `scripts/`

| Script | Ne yapıyor | Tetikleme |
|---|---|---|
| `scripts/backup.ts` (132 satır) | `pg_dump --format=custom` ile `backups/backup-YYYY-MM-DD-HH-mm.dump` üretir; host'ta `pg_dump` yoksa `docker exec medikal_postgres` kullanır; `pg_restore --list` ile arşivde `User` tablo verisini doğrular (`:57-122`) | `npm run backup` (`package.json:20`); zamanlanmış tetikleyici repoda yok (README'de örnek cron `README.md:149-151`) |
| `scripts/expire-congress-balances.ts` (30 satır) | `expireLots()` çağırır: süresi dolmuş EARN/ADJUST lotlarını `remainingAmount = 0` yapar, `EXPIRE` hareketi yazar (`src/lib/congress-service.ts:235-281`) | `npm run job:expire` (`package.json:21`); zamanlanmış tetikleyici repoda yok (yorum "gecelik cron" `:5`) |

CI bu iki script'i çalıştırmıyor (`.github/workflows/ci.yml` adımları §7.6).

### 11.5 Config / policy modülü

Tek adlandırılmış ayar modülü: **`src/lib/settings.ts`** (`SystemSetting` tablosu anahtar/değer; okunamazsa varsayılan).

| Anahtar | Varsayılan | Okuyan | Adres |
|---|---|---|---|
| `DEFAULT_DUE_DAYS` | 30 | `getDueSettings()` → `dealers/actions.ts:136`, `my-orders/actions.ts:66` | `src/lib/settings.ts:12`, `:18` |
| `MAX_DUE_DAYS` | 180 | `getDueSettings()` → `collections/actions.ts:229` | `src/lib/settings.ts:14`, `:19` |

`prisma/seed.ts:9` ayrıca kendi `DEFAULT_DUE_DAYS = 30` sabitini tanımlar.

Modül dışında dağınık tanımlı politika sabitleri (`git grep -nE '^(export )?const [A-Z][A-Z0-9_]+\s*(:[^=]+)?='`, etiket/stil haritaları hariç):

| Sabit | Değer | Adres |
|---|---|---|
| `MAX_FAILURES` | 5 | `src/lib/rate-limit.ts:17` |
| `LOCK_MS` | 10 dk | `src/lib/rate-limit.ts:18` |
| `DEFAULT_COMMISSION_RATE` | 5 (%) | `src/lib/commission.ts:17` |
| `DEFAULT_VAT_RATE` | 20 (%) | `src/lib/vat.ts:15` |
| `EARN_RATE_PERCENT` | 100 | `src/lib/congress-ledger.ts:25` |
| `EXPIRY_MONTHS` | 12 | `src/lib/congress-ledger.ts:28` |
| `DEFAULT_PER_PAGE` / `MAX_PER_PAGE` | 25 / 100 | `src/lib/pagination.ts:9-10` |
| `MAX_TL` | 1 000 000 000 | `src/lib/validation.ts:17` |
| `ROLE_HOME` | ADMIN→`/dashboard`, SELLER→`/my-orders`, DEALER→`/bayi` | `src/lib/roles.ts:10-14` |
| `VAT_MODE_COOKIE` | `"vatMode"` | `src/lib/vat-mode.ts:14` |
| `CRITICAL_STOCK` | 10 (iki ayrı tanım) | `src/app/(admin)/dashboard/page.tsx:10`, `src/app/(admin)/products/page.tsx:14` |
| `EXPIRY_WARNING_DAYS` | 60 | `src/app/(seller)/my-congresses/page.tsx:9` |
| `SENSITIVE_KEYS` | 6 anahtar | `src/lib/audit.ts:102-109` |

Sayı olarak geçen diğer değerler: parola min. uzunluğu 4 (`sellers/actions.ts:25`, `:89`) ve 6 (`dealers/actions.ts:36`); bcrypt maliyeti 10 (`sellers/actions.ts:42`, `:91`; `dealers/actions.ts:60`); yakında dolacak bakiye 60 gün (`doctors/[id]/page.tsx:87`, `congress-service.ts:43`); liste `take` sınırları (ör. `audit-logs/page.tsx:24` 100, `dealer-shipments/page.tsx:21` 200).

---

## 12. Belge ↔ kod farkı

**Belge yolu:** istenen `docs/PROJE_DURUMU.md` BULUNAMADI (`ls docs/PROJE_DURUMU.md` → yok). Depo kökünde izlenen `PROJE_DURUMU.md` (160 satır, "Son güncelleme: 2026-07-24 · Sürüm: 2.2") mevcut; karşılaştırma bu dosyayla yapıldı.

### 12.1 Ölçülebilir farklar

| # | Konu | Belgede yazan | Kodda olan | Adres |
|---|---|---|---|---|
| 1 | E2E test sayısı | "~**65 test**" | `npx playwright test --list` → 66 test / 19 dosya; bunun 3'ü `auth.setup.ts`, `*.spec.ts` içinde 63 | `PROJE_DURUMU.md:118` · `playwright.config.ts:45-79` |
| 2 | Playwright projeleri | "`admin`/`seller`/`dealer`/`guest` projeleri" (4) | 5 proje: `setup`, `guest`, `admin`, `seller`, `dealer` | `PROJE_DURUMU.md:118` · `playwright.config.ts:46-78` |
| 3 | Sayfa sayısı | "Üç rol bazlı route grubu: `(admin)`, `(seller)`, `(dealer)` — ayrı layout'lar (41 sayfa)" | toplam `page.tsx` 41; üç route grubunun içinde 38 (24 + 9 + 5), grup dışı 3 (`/`, `/login`, `/privacy`) | `PROJE_DURUMU.md:53` · §10.1 |
| 4 | Sürüm | "Sürüm: 2.2" | `package.json` `"version": "0.1.0"` | `PROJE_DURUMU.md:3` · `package.json:3` |
| 5 | Dashboard KDV toggle | "Dashboard — özet stat kartları, kritik stok, satıcı/cari özetleri, KDV dahil/hariç toggle" | `src/app/(admin)/dashboard/page.tsx`'te `VatToggle` / `vat-mode` geçişi 0; `VatToggle` yalnız `src/app/(admin)/reports/page.tsx:13,43`'te | `PROJE_DURUMU.md:56` · §10.2 |
| 6 | Satıcı ekranlarında prim oranı | "Satıcılar — liste / yeni / düzenle / detay (prim oranı dahil)" | `commissionRate` `src` altında 3 geçiş: `src/app/(admin)/commissions/page.tsx:37`, `src/lib/commission-service.ts:27,30`; `src/app/(admin)/sellers/**` dosyalarında 0 geçiş | `PROJE_DURUMU.md:59` · `git grep -n commissionRate -- src` |
| 7 | Bayi sevkiyatlar ekranı | "Sevkiyatlar / Ödemeler / Fiyat Listem — salt görüntüleme" | `/bayi/sevkiyatlar` `WithdrawButton` render eder → `withdrawRequest` server action'ı `dealerShipment.update` yapar | `PROJE_DURUMU.md:81` · `src/app/(dealer)/bayi/sevkiyatlar/page.tsx:85-87` · `src/app/(dealer)/bayi/talep/actions.ts:75-106` |
| 8 | SystemSetting yazımı | "SystemSetting (vade üst sınırı vb. admin ayarları)" | `SystemSetting`'e yazan tek fonksiyon `setSetting` (`src/lib/settings.ts:39-49`); çağrı noktası 0; bu tabloyu okuyan/yazan sayfa 0 | `PROJE_DURUMU.md:44` · §4.11 |

### 12.2 Karşılaştırılıp fark bulunmayan ölçülebilir kalemler

Model sayısı 25 ve enum sayısı 11 (`PROJE_DURUMU.md:30`) · migration adı `20260723175607_init_v2` (`:30`) · birim test 134 / 10 dosya ve dosya adları (`:116-117`) · e2e spec dosyası 18 (`:119`; `git ls-files 'e2e/**/*.spec.ts' | wc -l` → 18) · Next.js 16.2.10, React 19.2.4 (`:15-16`) · Prisma 7.8 (`prisma` ve `@prisma/client` 7.8.0) · `@prisma/adapter-pg` + `pg` kullanımı (`:17`; belgede adapter sürümü yazmıyor, kodda 7.9.0) · TypeScript 5 (5.9.3), Tailwind CSS 4 (4.3.2), Zod 4 (4.4.3), NextAuth v5 beta (5.0.0-beta.31), Playwright 1.61 (1.61.1) (`:16-20`) · CI adım sırası ve PostgreSQL 17 (`:113-115` ↔ `ci.yml:25`, `:46-74`) · `src/generated/prisma/` yolu ve gitignore (`:25` ↔ `schema.prisma:9`, `.gitignore:44`) · `error.tsx` / `loading.tsx` / `not-found.tsx` kökte (`:86`) · `scripts/backup.ts`, `scripts/expire-congress-balances.ts`, `npm run job:expire` (`:87`) · `session-revocation.spec.ts` (`:142` ↔ `e2e/seller/session-revocation.spec.ts`) · git remote `memirdemir/medikal-satis-operasyon` (`:111` ↔ `git remote -v`) · `README.md`, `UYGULAMA_PLANI.md` yolları (`:9`) · `public/logo.png`, `public/logo-mark.png`, `--color-brand` (`:91-92` ↔ `src/app/globals.css:10`) · demo hesapları (`:134-135` ↔ `prisma/seed.ts:46-47`, `:303-308`).
