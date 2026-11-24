import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { aramaliSec } from "../helpers";

/**
 * A-12-6/8 — limit ve vade bilgisi: sipariş formunda cari seçilince anında, sipariş sonrası yönlendirmede
 * BİLGİ şeridi olarak; cari detayda risk ve limit tutarları. Bilgi işlemi engellemez (sipariş yine açılır).
 */
const connectionString =
  process.env.TEST_DATABASE_URL ??
  "postgresql://medikal:medikal_dev@localhost:5432/medikal_test?schema=public";

async function sorgu<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    return (await client.query(sql, params)).rows as T[];
  } finally {
    await client.end();
  }
}

async function pesinCari(ek: string) {
  const ad = `Dr. Peşin ${ek}`;
  const [{ id }] = await sorgu<{ id: string }>(
    `INSERT INTO "Doctor" (id, "accountClass", "fullName", clinic, region, "phoneNormalized", "partyType", status, "creditLimit", "ownerSellerId")
     VALUES ($1, 'DOKTOR', $2, 'Klinik', 'Bölge', $3, 'TUZEL_KISI', 'AKTIF', 0,
             (SELECT id FROM "User" WHERE role = 'SATICI' ORDER BY email LIMIT 1)) RETURNING id`,
    [`e2e-pesin-${ek}`, ad, `+90537${ek}`]
  );
  return { id, ad };
}

test("cari detay: limit 0 'Peşin çalışılan cari' görünür, risk tutarı yazılır (A-12-7/8)", async ({ page }) => {
  const { id } = await pesinCari(Date.now().toString().slice(-7));
  await page.goto(`/doctors/${id}`);
  await expect(page.getByText("Risk (bakiye + açık sipariş)")).toBeVisible();
  await expect(page.getByText("Peşin çalışılan cari")).toBeVisible();
});

test("sipariş formu: cari seçilince limit uyarısı anında görünür; sipariş açılır ve yönlendirmede bilgi şeridi çıkar (A-12-6/8)", async ({ page }) => {
  const ek = Date.now().toString().slice(-7);
  const { ad } = await pesinCari(ek);
  await page.goto("/orders/new");
  await aramaliSec(page, "Doktor", ad);
  await aramaliSec(page, "Ürün");
  // Risk 0 iken aşım yok: uyarı yok. Siparişten sonra risk limiti (0) aşar.
  await expect(page.locator("[data-cari-risk]")).toHaveCount(0);
  await page.getByRole("button", { name: "Siparişi Oluştur" }).click();

  await expect(page).toHaveURL(/\/orders\/[^?]+\?bilgi=/);
  await expect(page.locator("[data-bilgi-seridi]")).toContainText("Peşin çalışılan cari. Limit aşıldı");

  // Aynı cariye ikinci sipariş: artık formda seçer seçmez uyarı görünür.
  await page.goto("/orders/new");
  await aramaliSec(page, "Doktor", ad);
  await expect(page.locator("[data-cari-risk]")).toContainText("Peşin çalışılan cari. Limit aşıldı");
});
