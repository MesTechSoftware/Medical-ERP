import { test, expect } from "@playwright/test";

test("satıcı yeni sipariş oluşturur ve listesinde görür", async ({ page }) => {
  await page.goto("/my-orders/new");

  // Doktor artık serbest metin değil, portföyden seçilen bir varlık (BRK-02).
  const doctorSelect = page.getByLabel("Doktor");
  await doctorSelect.selectOption({ index: 1 });
  const doctorName = (await doctorSelect.locator("option:checked").textContent())!
    .split("—")[0]
    .trim();

  await page.getByLabel("Ürün").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Siparişi Oluştur" }).click();

  await expect(page).toHaveURL(/\/my-orders$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Siparişlerim" })
  ).toBeVisible();
  // Listede unvansız ad geçer; unvanı ayıklayıp soyadıyla eşleştiriyoruz.
  const lastName = doctorName.split(" ").at(-1)!;
  await expect(page.getByText(lastName).first()).toBeVisible();
});

test("satıcı admin sayfasına erişince /my-orders'a yönlenir", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/my-orders/);
});

test("promosyon bedelsiz satır gerekçe ister; sipariş kaydolur ve onay bekler (A-2-2)", async ({ page }) => {
  await page.goto("/my-orders/new");
  await page.getByLabel("Doktor").selectOption({ index: 1 });
  await page.getByLabel("Ürün").selectOption({ index: 1 });
  await page.getByLabel("Bedelsiz", { exact: true }).check();
  await page.getByLabel("Bedelsiz sebebi").selectOption("PROMOSYON");
  await page.getByRole("button", { name: "Siparişi Oluştur" }).click();

  const diyalog = page.getByRole("dialog");
  await expect(diyalog).toContainText("Bedelsiz satır");
  await expect(diyalog).toContainText("Promosyon");
  await diyalog.getByLabel("Gerekçe").fill("Kongre standı için");
  await diyalog.getByRole("button", { name: "Gerekçeyle devam et" }).click();

  await expect(page).toHaveURL(/\/my-orders$/);
  await expect(page.getByText("Onay bekliyor").first()).toBeVisible();
});
