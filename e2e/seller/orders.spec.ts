import { test, expect } from "@playwright/test";
import { unique } from "../helpers";

test("satıcı yeni sipariş oluşturur ve listesinde görür", async ({ page }) => {
  const doctor = unique("Dr. Test");

  await page.goto("/my-orders/new");
  await page.getByLabel("Doktor Adı").fill(doctor);

  // İlk kalemdeki ürün seçimi (native select — ilk gerçek ürünü seç).
  await page.getByRole("combobox").first().selectOption({ index: 1 });

  await page.getByRole("button", { name: "Siparişi Oluştur" }).click();

  await expect(page).toHaveURL(/\/my-orders$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Siparişlerim" })
  ).toBeVisible();
  await expect(page.getByText(doctor)).toBeVisible();
});

test("satıcı admin sayfasına erişince /my-orders'a yönlenir", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/my-orders/);
});
