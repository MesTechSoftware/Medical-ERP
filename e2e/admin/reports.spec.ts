import { test, expect } from "@playwright/test";
import { Client } from "pg";

/**
 * Faz F — raporlar.
 *
 * FR-62 satıcı performansı · FR-63 doktor sıralaması ·
 * FR-60 toplam ciro (kanal karşılaştırması C5'te söküldü) · FR-64 KDV Dahil/Hariç toggle.
 */

const connectionString =
  process.env.TEST_DATABASE_URL ??
  "postgresql://medikal:medikal_dev@localhost:5432/medikal_test?schema=public";

async function query<T = unknown>(sql: string, params: unknown[] = []) {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    return (await client.query(sql, params)).rows as T[];
  } finally {
    await client.end();
  }
}

test("rapor sayfası satıcı ve doktor tablolarını gösterir (FR-62/FR-63)", async ({
  page,
}) => {
  await page.goto("/reports");
  await expect(
    page.getByRole("heading", { name: "Satıcı Performansı" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Doktor Ciro Sıralaması/ })
  ).toBeVisible();
  await expect(page.getByText("Toplam Ciro")).toBeVisible();
  // X-8: kanal karşılaştırması C5'te söküldü.
  await expect(page.getByText("Bayi Kanalı Ciro")).toHaveCount(0);
  // GÇ-4: kongre yükümlülüğü kartı C2'de söküldü.
  await expect(page.getByText("Açık Kongre Bakiyesi")).toHaveCount(0);
});

test("🔴 FR-64: KDV toggle ciroyu net ↔ brüt arasında değiştirir", async ({
  page,
}) => {
  // Beklenen değerleri DB'den hesapla.
  const [row] = await query<{ net: string; gross: string }>(
    `SELECT COALESCE(SUM("netTotal"),0)::text AS net,
            COALESCE(SUM("grossTotal"),0)::text AS gross
       FROM "Order" WHERE status <> 'CANCELLED'`
  );
  const net = BigInt(row.net);
  const gross = BigInt(row.gross);
  // Anlamlı bir test için net ≠ brüt olmalı (KDV var).
  expect(gross).toBeGreaterThan(net);

  // Intl'in ürettiği ayırıcılar test ortamına göre değişebilir; sadece
  // rakam/virgül/nokta bırakarak tutarı karşılaştırıyoruz.
  const digits = (k: bigint) =>
    new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(
      Number(k) / 100
    );

  await page.goto("/reports");
  const card = page.getByText("Toplam Ciro").locator("..");

  // KDV Hariç (NET): kart NET tutarı göstermeli. toContainText otomatik bekler.
  await page.getByRole("button", { name: "KDV Hariç" }).click();
  await expect(card).toContainText(digits(net));

  // KDV Dahil (GROSS): kart BRÜT tutarı göstermeli.
  await page.getByRole("button", { name: "KDV Dahil" }).click();
  await expect(card).toContainText(digits(gross));
  // Ve artık net tutarı gostermemeli (gerçekten değişti).
  await expect(card).not.toContainText(digits(net));
});

test("KDV tercihi çerezde kalıcı (sayfa yenilenince korunur)", async ({
  page,
}) => {
  await page.goto("/reports");
  await page.getByRole("button", { name: "KDV Hariç" }).click();
  // Tercih uygulandı: KDV Hariç butonu basılı.
  await expect(page.getByRole("button", { name: "KDV Hariç" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  await page.reload();
  await expect(page.getByRole("button", { name: "KDV Hariç" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});
