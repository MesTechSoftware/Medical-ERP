import { test, expect } from "@playwright/test";
import { sorgu } from "../helpers";

/** Ü-18 — cari listesi: yeni sütunlar, rozetler, eksik fatura vurgusu, boş durum (A-12-5 · A-13-3). */

const satir = (page: import("@playwright/test").Page, ad: string) =>
  page.getByRole("row").filter({ has: page.getByRole("link", { name: new RegExp(ad) }) });

test("yeni sütunlar: son sipariş tarihi ve bakiye (KDV dahil başlık)", async ({ page }) => {
  const [d] = await sorgu<{ fullName: string }>(
    `SELECT d."fullName" FROM "Doctor" d JOIN "Order" o ON o."doctorId" = d.id
      WHERE o.stage = 'ONAYLI' AND o.status <> 'IPTAL' ORDER BY d."fullName" LIMIT 1`
  );
  await page.goto("/doctors?per=100");
  await expect(page.getByRole("columnheader", { name: "Son Sipariş" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Bakiye (KDV dahil)" })).toBeVisible();
  const r = satir(page, d.fullName);
  await expect(r.getByText(/^\d{2}\.\d{2}\.\d{4}$/)).toBeVisible();
  await expect(r.getByText(/^(bugün|\d+ gün önce)$/)).toBeVisible();
  await expect(r.getByText(/^(Doktor borçlu|Doktor alacaklı \(avans\)|Bakiye kapalı)$/)).toBeVisible();
});

test("eksik faturalı satır rozetli ve vurgulu (A-13-3)", async ({ page }) => {
  const [d] = await sorgu<{ fullName: string }>(
    `SELECT "fullName" FROM "Doctor" WHERE "invoiceAddress" IS NULL ORDER BY "fullName" LIMIT 1`
  );
  await page.goto("/doctors?per=100");
  const r = satir(page, d.fullName);
  await expect(r.getByText("Eksik fatura", { exact: true })).toBeVisible();
  await expect(r).toHaveClass(/bg-critical-bg/);
});

test("limiti aşan cari 'Limit aşıldı' rozeti taşır (A-12-5)", async ({ page }) => {
  const [d] = await sorgu<{ id: string; fullName: string; creditLimit: string | null }>(
    `SELECT d.id, d."fullName", d."creditLimit" FROM "Doctor" d
      JOIN "LedgerEntry" l ON l."doctorId" = d.id
      GROUP BY d.id
      HAVING SUM(CASE WHEN l.direction = 'BORC' THEN l.amount ELSE -l.amount END) > 1
      ORDER BY d."fullName" LIMIT 1`
  );
  expect(d).toBeTruthy();
  await sorgu(`UPDATE "Doctor" SET "creditLimit" = 1 WHERE id = $1`, [d.id]);
  try {
    await page.goto("/doctors?per=100");
    await expect(satir(page, d.fullName).getByText("Limit aşıldı")).toBeVisible();
  } finally {
    await sorgu(`UPDATE "Doctor" SET "creditLimit" = $2 WHERE id = $1`, [d.id, d.creditLimit]);
  }
});

test("süzgeç sonucu boşsa açıklayıcı boş durum ve Süzgeçleri temizle", async ({ page }) => {
  await page.goto("/doctors?bolge=E2E-Olmayan-Bolge");
  await expect(page.getByText("Bu süzgeçlere uyan cari bulunamadı.")).toBeVisible();
  await page.getByRole("link", { name: "Süzgeçleri temizle" }).click();
  await expect(page).toHaveURL(/\/doctors$/);
});

/** X-8-4 — birleşik süzgeç, etkin etiketler, KPI kartları, eski adres. */

const sekmeler = (page: import("@playwright/test").Page) => page.getByRole("navigation", { name: "Hızlı süzgeçler" });

test("Filtrele: bölge + satıcı birlikte süzer; etiket × ile kalkar", async ({ page }) => {
  const [s] = await sorgu<{ id: string; name: string }>(
    `SELECT u.id, u.name FROM "User" u JOIN "Doctor" d ON d."ownerSellerId" = u.id
      WHERE d.region = 'Marmara' GROUP BY u.id ORDER BY u.name LIMIT 1`
  );
  const beklenen = await sorgu<{ fullName: string }>(
    `SELECT "fullName" FROM "Doctor" WHERE region = 'Marmara' AND "ownerSellerId" = $1`,
    [s.id]
  );
  const disarida = await sorgu<{ fullName: string }>(
    `SELECT "fullName" FROM "Doctor" WHERE region <> 'Marmara' AND "ownerSellerId" IS NOT NULL LIMIT 1`
  );

  await page.goto("/doctors");
  await page.getByText("Filtrele", { exact: true }).click();
  const form = page.getByRole("form", { name: "Cari süzgeci" });
  await form.getByLabel("Bölge").selectOption("Marmara");
  await form.getByLabel("Sorumlu satıcı").selectOption(s.id);
  await form.getByRole("button", { name: "Uygula" }).click();

  await expect(page).toHaveURL(/bolge=Marmara/);
  await expect(page).toHaveURL(new RegExp(`satici=${s.id}`));
  await expect(page.getByText("Filtrele · 2")).toBeVisible();
  for (const d of beklenen) await expect(page.getByRole("link", { name: new RegExp(d.fullName) })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(disarida[0].fullName) })).toHaveCount(0);

  await page.getByRole("link", { name: "Kaldır: Bölge: Marmara" }).click();
  await expect(page).not.toHaveURL(/bolge=/);
  await expect(page).toHaveURL(new RegExp(`satici=${s.id}`));
});

test("Son sipariş: hiç sipariş vermemişler", async ({ page }) => {
  const [siparissiz] = await sorgu<{ fullName: string }>(
    `SELECT d."fullName" FROM "Doctor" d WHERE NOT EXISTS (
       SELECT 1 FROM "Order" o WHERE o."doctorId" = d.id AND o.stage = 'ONAYLI' AND o.status <> 'IPTAL')
     ORDER BY d."fullName" LIMIT 1`
  );
  const [siparisli] = await sorgu<{ fullName: string }>(
    `SELECT d."fullName" FROM "Doctor" d JOIN "Order" o ON o."doctorId" = d.id
      WHERE o.stage = 'ONAYLI' AND o.status <> 'IPTAL' LIMIT 1`
  );
  await page.goto("/doctors");
  await page.getByText("Filtrele", { exact: true }).click();
  await page.getByRole("form", { name: "Cari süzgeci" }).getByLabel("Son sipariş", { exact: true }).selectOption("hic");
  await page.getByRole("button", { name: "Uygula" }).click();
  await expect(page).toHaveURL(/sessiz=hic/);
  await expect(page.getByText("Son sipariş: hiç yok")).toBeVisible();
  if (siparissiz) await expect(page.getByRole("link", { name: new RegExp(siparissiz.fullName) })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(siparisli.fullName) })).toHaveCount(0);
});

test("KPI kartı tıklanınca süzgeç uygulanır", async ({ page }) => {
  await page.goto("/doctors");
  const kpi = page.getByRole("region", { name: "Cari sayıları" });
  await expect(kpi.getByText("Toplam cari")).toBeVisible();
  await kpi.getByRole("link", { name: /Eksik fatura bilgisi/ }).click();
  await expect(page).toHaveURL(/fatura=eksik/);
  await expect(sekmeler(page).getByRole("link", { name: "Eksik fatura bilgisi" })).toHaveAttribute("aria-current", "page");
});

test("eski adres ?sahip=yok Sahipsiz sekmesini açar", async ({ page }) => {
  await page.goto("/doctors?sahip=yok");
  await expect(sekmeler(page).getByRole("link", { name: "Sahipsiz" })).toHaveAttribute("aria-current", "page");
});

/** Yan panel (spec §3.6) — X-18 §(9) kabuğu. */

test("isim yan paneli açar; Esc kapatır, odak isme döner", async ({ page }) => {
  const [d] = await sorgu<{ id: string; fullName: string }>(
    `SELECT id, "fullName" FROM "Doctor" WHERE region = 'Marmara' ORDER BY "fullName" LIMIT 1`
  );
  await page.goto("/doctors?bolge=Marmara");
  await page.locator(`a[data-kayit="${d.id}"]`).click();
  const panel = page.getByRole("dialog", { name: new RegExp(d.fullName) });
  await expect(panel).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`detay=${d.id}`));
  await expect(page).toHaveURL(/bolge=Marmara/);
  for (const bolum of ["Cari özeti", "Son siparişler", "Son cari hareketler", "Devir geçmişi"]) {
    await expect(panel.getByRole("region", { name: bolum })).toBeVisible();
  }
  await expect(panel.getByRole("link", { name: "Tam detaya git" })).toHaveAttribute("href", `/doctors/${d.id}`);
  await expect(panel.getByRole("link", { name: "Düzenle" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).not.toHaveURL(/detay=/);
  await expect(page).toHaveURL(/bolge=Marmara/);
  await expect(page.locator(`a[data-kayit="${d.id}"]`)).toBeFocused();
});

test("Tam detaya git detay sayfasını açar", async ({ page }) => {
  const [d] = await sorgu<{ id: string; fullName: string }>(`SELECT id, "fullName" FROM "Doctor" ORDER BY "fullName" LIMIT 1`);
  await page.goto(`/doctors?detay=${d.id}`);
  await page.getByRole("dialog").getByRole("link", { name: "Tam detaya git" }).click();
  await expect(page).toHaveURL(new RegExp(`/doctors/${d.id}$`));
  await expect(page.getByRole("heading", { level: 1, name: new RegExp(d.fullName) })).toBeVisible();
});

test("geçersiz detay kimliği paneli açmaz", async ({ page }) => {
  await page.goto("/doctors?detay=olmayan-kimlik");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("table")).toBeVisible();
});

/** Sütun seçici (spec §3.4) — tercih çerezde, sayfa sunucuda gizli sütunu hiç çizmez. */

const sutunMenusu = async (page: import("@playwright/test").Page) => {
  await page.getByText("Sütunlar", { exact: true }).click();
  return page.getByRole("form", { name: "Görünür sütunlar" });
};

test.describe("sütun seçici", () => {
  test.afterEach(async ({ context }) => {
    await context.clearCookies({ name: "doktor-sutunlar" });
  });

  test("Telefon ve Bakiye gizlenir, yenilemede gizli kalır; Varsayılana dön geri getirir", async ({ page }) => {
    await page.goto("/doctors?bolge=Marmara");
    const menu = await sutunMenusu(page);
    await menu.getByLabel("Telefon").uncheck();
    await menu.getByLabel("Bakiye").uncheck();
    await menu.getByRole("button", { name: "Kaydet" }).click();
    await expect(page).toHaveURL(/bolge=Marmara/);
    await expect(page.getByRole("columnheader", { name: "Telefon" })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: "Bakiye (KDV dahil)" })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: "Durum" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("columnheader", { name: "Telefon" })).toHaveCount(0);

    await (await sutunMenusu(page)).getByRole("button", { name: "Varsayılana dön" }).click();
    await expect(page.getByRole("columnheader", { name: "Telefon" })).toBeVisible();
  });

  test("bütün sütunlar gizli ve sonuç boş: boş durum tüm satırı kaplar", async ({ page }) => {
    await page.goto("/doctors?bolge=E2E-Olmayan-Bolge");
    const menu = await sutunMenusu(page);
    for (const kutu of await menu.getByRole("checkbox").all()) await kutu.uncheck();
    await menu.getByRole("button", { name: "Kaydet" }).click();
    await expect(page.getByRole("columnheader")).toHaveCount(2); // seçim kutusu + Ad Soyad
    await expect(page.getByText("Bu süzgeçlere uyan cari bulunamadı.").locator("xpath=ancestor::td[1]")).toHaveAttribute("colspan", "2");
  });

  test("bozuk çerez varsayılan görünümü verir", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "doktor-sutunlar", value: "%%%,adSoyad", url: `${baseURL}/doctors` }]);
    await page.goto("/doctors");
    for (const baslik of ["Klinik / Bölge", "Telefon", "Sorumlu Satıcı", "Sipariş", "Son Sipariş", "Bakiye (KDV dahil)", "Durum"]) {
      await expect(page.getByRole("columnheader", { name: baslik, exact: true })).toBeVisible();
    }
  });
});

/** Gözden geçirme bulgusu: yumuşak gezinmeden sonra süzgeç formu güncel süzgeci gösterir. */
test("sekmeden sonra Filtrele sekmenin süzgecini korur; kaldırılan etiket geri gelmez", async ({ page }) => {
  await page.goto("/doctors");
  await sekmeler(page).getByRole("link", { name: "Doktorlar" }).click();
  await expect(page).toHaveURL(/sinif=DOKTOR/);
  await page.getByText("Filtrele · 1").click();
  const form = page.getByRole("form", { name: "Cari süzgeci" });
  await expect(form.getByLabel("Hesap sınıfı")).toHaveValue("DOKTOR");
  await form.getByLabel("Bölge").selectOption("Marmara");
  await form.getByRole("button", { name: "Uygula" }).click();
  await expect(page).toHaveURL(/sinif=DOKTOR/);
  await expect(page).toHaveURL(/bolge=Marmara/);

  await page.getByRole("link", { name: "Kaldır: Bölge: Marmara" }).click();
  await expect(page).not.toHaveURL(/bolge=/);
  await page.getByText("Filtrele · 1").click();
  await expect(page.getByRole("form", { name: "Cari süzgeci" }).getByLabel("Bölge")).toHaveValue("");
});

test("sayfa dışı adres son sayfaya gider; boş durum çıkmaz", async ({ page }) => {
  await page.goto("/doctors?page=999");
  await expect(page).not.toHaveURL(/page=999/);
  await expect(page.locator("a[data-kayit]").first()).toBeVisible();
  await expect(page.getByText("Henüz cari yok.")).toHaveCount(0);
});
