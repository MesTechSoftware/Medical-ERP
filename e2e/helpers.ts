import { type Page, expect } from "@playwright/test";

// Seed'lenen sabit kullanıcılar (prisma/seed.ts ile birebir).
export const USERS = {
  admin: { email: "admin@medikal.local", password: "admin123" },
  seller: { email: "ahmet@medikal.local", password: "satici123" },
  operasyon: { email: "operasyon@medikal.local", password: "operasyon123" },
} as const;

// Seed'lenen satıcı adları (cari/ödeme testleri için).
export const SEED_SELLER_NAME = "Ahmet Yılmaz";

/** Aynı test.db bir koşu boyunca paylaşıldığı için mutasyon testleri
 *  benzersiz veri kullanır; böylece retry/tekrarda çakışma olmaz. */
export function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
}

/**
 * Sonraki gezinmenin istemci tarafında kaldığını denetler: işaret pencerede durur, tam sayfa
 * yüklemesi onu siler. Dönen fonksiyon gezinmeden sonra çağrılır.
 */
export async function yumusakGezinmeIsareti(page: Page): Promise<() => Promise<boolean>> {
  await page.evaluate(() => ((window as unknown as { __yumusak?: boolean }).__yumusak = true));
  // Tam yüklemenin ortasında bağlam yok olur; değerlendirme hatası da "yumuşak değil" sayılır.
  return () => page.evaluate(() => (window as unknown as { __yumusak?: boolean }).__yumusak === true).catch(() => false);
}

/** Login formunu doldurup gönderir ve yönlenmeyi bekler. */
export async function login(
  page: Page,
  user: { email: string; password: string }
) {
  await page.goto("/login");
  await page.getByLabel("E-posta").fill(user.email);
  await page.getByLabel("Şifre").fill(user.password);
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Politikaya uyan iki parola (E-2-6): yöneticinin verdiği geçici parola ve kullanıcının yenisi. */
export const GECICI_PAROLA = "gecici-parola-1";
export const YENI_PAROLA = "kalici-parola-2";

/**
 * Yönetici ekranından yeni hesap açar (E-2-5); e-postasını döner. Parola geçicidir —
 * kullanıcı ilk girişte değiştirir (`ilkGiris`).
 */
export async function yeniKullanici(
  admin: Page,
  opts: { role?: "SATICI" | "OPERASYON" | "YONETICI"; prefix?: string } = {}
): Promise<string> {
  const email = `${unique(opts.prefix ?? "kullanici")}@test.local`;
  await admin.goto("/users/new");
  await admin.getByLabel("Ad Soyad").fill(unique("E2E Kullanıcı"));
  await admin.getByLabel("E-posta").fill(email);
  await admin.getByLabel("Rol", { exact: true }).selectOption(opts.role ?? "SATICI");
  await admin.getByLabel("Geçici Parola").fill(GECICI_PAROLA);
  await admin.getByLabel("Gerekçe").fill("E2E hesap açılışı");
  await admin.getByRole("button", { name: "Kullanıcı Ekle" }).click();
  await expect(admin).toHaveURL(/\/users$/);
  return email;
}

/** Geçici parolayla girer, zorunlu parola değişimini tamamlar (E-2-7). */
export async function ilkGiris(page: Page, email: string, gecici = GECICI_PAROLA, yeni = YENI_PAROLA) {
  await login(page, { email, password: gecici });
  await expect(page).toHaveURL(/\/parola-degistir$/);
  await page.getByLabel("Mevcut (geçici) parola").fill(gecici);
  await page.getByLabel("Yeni parola", { exact: true }).fill(yeni);
  await page.getByLabel("Yeni parola (tekrar)").fill(yeni);
  await page.getByRole("button", { name: "Parolayı Değiştir" }).click();
  await expect(page).not.toHaveURL(/\/parola-degistir/);
}

const TEST_DB =
  process.env.TEST_DATABASE_URL ?? "postgresql://medikal:medikal_dev@localhost:5432/medikal_test?schema=public";

/** Test veritabanında tek sorgu (medikal_test). */
export async function sorgu<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const { Client } = await import("pg");
  const client = new Client({ connectionString: TEST_DB });
  await client.connect();
  try {
    return (await client.query(sql, params)).rows as T[];
  } finally {
    await client.end();
  }
}

/**
 * Stoğu hiç olmayan yeni ürünle `HAZIRLANIYOR` sipariş (2 adet) — sevkiyatı negatif stok
 * onayına düşer (A-8). Doktor ve ürün benzersizdir; başka testin stoğuna dokunmaz.
 * `stoklu` verilirse yeni ürüne 10 adet giriş yazılır (sevkiyat onaysız geçer).
 */
export async function stoksuzSiparis({ stoklu = false } = {}) {
  const ek = `${Date.now() % 100000}`.padStart(5, "0") + `${Math.floor(Math.random() * 100)}`.padStart(2, "0");
  const doktorAdi = `Dr. Onay ${ek}`;
  const urunAdi = `Stoksuz Ürün ${ek}`;
  const [{ id: doktorId }] = await sorgu<{ id: string }>(
    `INSERT INTO "Doctor" (id, "accountClass", "fullName", clinic, region, "phoneNormalized", "partyType", status)
     VALUES ($1, 'DOKTOR', $2, 'Klinik', 'Bölge', $3, 'TUZEL_KISI', 'AKTIF') RETURNING id`,
    [`e2e-dr-${ek}`, doktorAdi, `+90538${ek}`]
  );
  await sorgu(
    `INSERT INTO "Product" (id, name, code, "taxRateId") SELECT $1, $2, $3, "taxRateId" FROM "Product" LIMIT 1`,
    [`e2e-urun-${ek}`, urunAdi, `E2E-${ek}`]
  );
  if (stoklu) {
    await sorgu(
      `INSERT INTO "StockMovement" (id, "productId", "locationId", type, quantity)
       SELECT $1, $2, id, 'GIRIS', 10 FROM "StockLocation" WHERE type = 'DEPO' ORDER BY "sortOrder" LIMIT 1`,
      [`e2e-stok-${ek}`, `e2e-urun-${ek}`]
    );
  }
  const siparisId = `e2e-sip-${ek}`;
  const kalemId = `e2e-kal-${ek}`;
  const documentNo = `E2E-SIP-${ek}`;
  await sorgu(
    `INSERT INTO "Order" (id, "documentNo", "doctorId", stage, status, "paymentTermDays", "updatedAt")
     VALUES ($1, $2, $3, 'ONAYLI', 'HAZIRLANIYOR', 30, now())`,
    [siparisId, documentNo, doktorId]
  );
  await sorgu(
    `INSERT INTO "OrderItem" (id, "orderId", "productId", quantity, "listPrice", "unitPrice", "vatRate")
     VALUES ($1, $2, $3, 2, 100, 100, 20)`,
    [kalemId, siparisId, `e2e-urun-${ek}`]
  );
  return { doktorId, doktorAdi, urunAdi, urunId: `e2e-urun-${ek}`, urunKodu: `E2E-${ek}`, siparisId, kalemId, documentNo };
}

/**
 * Yükleme iskeletini belirlenimci gösterir (ADR-009): belge akışı, kabuk ve iskelet açıldıktan sonra
 * sayfa içeriği gelmeden kesilir. React akışında içerik `<div hidden id="S:…">` parçalarıyla gelir;
 * sayfa başlığını (`<h1`) taşıyan ilk parça sayfa içeriğidir — ondan önceki her şey (kabuk, grup ve
 * varsa sayfaya özel iskelet) kalır. Kabukta ve iskelette `<h1` yoktur.
 * Uygulama JS paketleri bu sırada engellenir: eksik akışla hidrasyon kırılır ve Next sayfayı yeniden
 * yükler; satır içi açma betikleri ($RC) çalışmaya devam eder, CSS de yüklenir.
 * (Geliştirme sunucusunda `loading.tsx` önceden getirilmez; istemci gezintisini geciktirmek
 * iskeleti göstermez — tek güvenilir yol akışın kendisidir.)
 */
export async function iskeletiAc(page: Page, yol: string) {
  const js = /\/_next\/static\/.*\.js(\?|$)/;
  await page.route(js, (route) => route.abort());
  await page.route(
    (u) => u.pathname === yol && !u.searchParams.has("_rsc"),
    async (route) => {
      const yanit = await route.fetch();
      const govde = await yanit.text();
      const parcalar = [...govde.matchAll(/<div hidden id="S:[^"]+"/g)].map((m) => m.index!);
      const kes = parcalar.find((i, n) => govde.slice(i, parcalar[n + 1] ?? govde.length).includes("<h1"));
      expect(kes, "akışta sayfa içeriği parçası bulunmalı").toBeDefined();
      await route.fulfill({ response: yanit, body: govde.slice(0, kes) });
    },
    { times: 1 }
  );
  await page.goto(yol);
  await page.unrouteAll({ behavior: "ignoreErrors" });
}

/** Tablonun üst kenarı, başlık ve ilk satır yüksekliği (px). */
export async function tabloOlcu(tablo: import("@playwright/test").Locator) {
  const [t, th, td] = await Promise.all([
    tablo.boundingBox(),
    tablo.locator("thead th").first().boundingBox(),
    tablo.locator("tbody td").first().boundingBox(),
  ]);
  return { ust: t!.y, baslik: th!.height, satir: td!.height };
}

/**
 * İskelet gerçek yerleşimle eşleşir: tablonun üst kenarı ve başlık yüksekliği ±2 px, iskelet
 * satırı `--row-h`. Gerçek satır içeriği sararsa uzayabilir; kısalamaz. Kabuk iskelet sırasında yerindedir.
 */
export async function iskeletGercekleEslesir(page: Page, yol: string) {
  await iskeletiAc(page, yol);
  await expect(page.getByRole("navigation", { name: "Ana menü" })).toBeVisible();
  const iskelet = page.getByRole("main").getByRole("status");
  await expect(iskelet).toContainText("Yükleniyor");
  const satirH = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--row-h")));
  const i = await tabloOlcu(iskelet.getByRole("table"));

  await page.goto(yol);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const g = await tabloOlcu(page.getByRole("main").getByRole("table"));

  expect(Math.abs(i.ust - g.ust), "tablo üst kenarı").toBeLessThanOrEqual(2);
  expect(Math.abs(i.baslik - g.baslik), "başlık satırı").toBeLessThanOrEqual(2);
  expect(Math.abs(i.satir - satirH), "iskelet satırı --row-h").toBeLessThanOrEqual(1);
  expect(g.satir, "gerçek satır --row-h'den kısa olamaz").toBeGreaterThanOrEqual(satirH - 1);
}

/**
 * Sipariş detayında her belge toplamı kendi tabanının kolonunun altındadır (Ü-3 §(7)/(8)):
 * değer hücresinin sağ kenarı, başlık hücresinin sağ kenarıyla ±1 px aynı.
 */
export async function toplamlarKolonlaHizali(page: Page) {
  await page.goto("/orders");
  await page.getByRole("link", { name: "Detay" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Sipariş Detayı" })).toBeVisible();
  const tablo = page.getByRole("table").filter({ has: page.getByRole("columnheader", { name: "Ürün" }) });
  // Gizli kolon colSpan hesabını kaydırır: altı kolonun hepsi görünür olmalı.
  await expect(tablo.getByRole("columnheader")).toHaveCount(6);
  for (const baslik of await tablo.getByRole("columnheader").all()) await expect(baslik).toBeVisible();

  const sagKenar = async (l: import("@playwright/test").Locator) => {
    const k = (await l.boundingBox())!;
    return k.x + k.width;
  };
  const satirlar = tablo.locator("tfoot tr");
  const beklenen: [RegExp, string][] = [
    [/^Ara Toplam/, "Tutar (KDV hariç)"],
    [/^KDV$/, "KDV"],
    [/^Genel Toplam/, "Tutar (KDV dahil)"],
  ];
  for (const [i, [etiket, baslik]] of beklenen.entries()) {
    const satir = satirlar.nth(i);
    await expect(satir.locator("td").first()).toHaveText(etiket);
    const deger = await sagKenar(satir.locator("td").nth(1));
    const kolon = await sagKenar(tablo.getByRole("columnheader", { name: baslik, exact: true }));
    expect(Math.abs(deger - kolon), `${baslik} kolonu altında olmalı`).toBeLessThanOrEqual(1);
  }
}

/** KPI satırındaki kart kutuları — iskelette ve gerçek sayfada aynı seçici. */
async function kpiKutulari(page: Page) {
  const satir = page.getByRole("main").locator("[data-kpi-satiri]");
  await expect(satir).toBeVisible();
  return satir.locator(":scope > div").evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, genislik: r.width, yukseklik: r.height };
    })
  );
}

/**
 * KPI satırı iskeleti gerçek satırla kart kart eşleşir (x, y, genişlik, yükseklik ±2 px): iskelet
 * kartla aynı sınıfları ve aynı metinleri taşır, değer tek satırdır (ADR-010). Dashboard'un istisna
 * bandı veriye bağlıdır (yalnız istisna varken çizilir, brief §3.1) ve iskelette yoktur: kartlar
 * tam bant yüksekliği (ve alt boşluğu) kadar aşağıda başlar — başka kayma yoktur.
 */
export async function kpiIskeletiEslesir(page: Page, yol: string) {
  await iskeletiAc(page, yol);
  const iskelet = await kpiKutulari(page);

  await page.goto(yol);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const gercek = await kpiKutulari(page);
  const bant = await page.evaluate(() => {
    const b = document.querySelector('main [role="region"][aria-label="Dikkat gerektirenler"]');
    return b ? b.getBoundingClientRect().height + parseFloat(getComputedStyle(b).marginBottom) : 0;
  });

  expect(gercek.length, `${yol} kart sayısı`).toBe(iskelet.length);
  gercek.forEach((g, i) => {
    for (const olcu of ["x", "y", "genislik", "yukseklik"] as const) {
      const beklenen = olcu === "y" ? iskelet[i].y + bant : iskelet[i][olcu];
      expect(Math.abs(beklenen - g[olcu]), `${yol} ${i + 1}. kart ${olcu}`).toBeLessThanOrEqual(2);
    }
  });
}

/** KPI kartlarında değer ve satırlar kartın içinde kalır (tek satırlık değer taşmaz, kesilmez). */
export async function kpiKartlariTasmaz(page: Page) {
  const tasan = await page.locator("[data-kpi-satiri] [role=group]").evaluateAll((kartlar) =>
    kartlar
      .filter((k) => [...k.querySelectorAll("div, p")].some((e) => e.scrollWidth > e.clientWidth + 1))
      .map((k) => k.getAttribute("aria-label"))
  );
  expect(tasan, "içeriği taşan KPI kartı").toEqual([]);
}

/**
 * Kargo ekranında siparişin kısmi sevk panelini açar (Ü-24 §3.4): metni taşıyan bekleyen satırının
 * "Kısmi sevk" bağlantısı; panelde bugünkü kart formu (`data-sevk-karti`) vardır.
 */
export async function sevkKartiAc(page: Page, metin: string) {
  await page.goto("/shipping");
  await page.locator("tr[data-kargo-satiri]").filter({ hasText: metin }).getByRole("link", { name: "Kısmi sevk" }).click();
  const kart = page.locator("[data-sevk-karti]").filter({ hasText: metin });
  await expect(kart).toBeVisible();
  return kart;
}
