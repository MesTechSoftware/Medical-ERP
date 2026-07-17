import { test, expect } from "@playwright/test";

const pages: [path: string, heading: string][] = [
  ["/dashboard", "Dashboard"],
  ["/products", "Ürünler"],
  ["/stock", "Stok"],
  ["/sellers", "Satıcılar"],
  ["/orders", "Siparişler"],
  ["/shipping", "Kargo"],
  ["/payments", "Ödemeler"],
];

for (const [path, heading] of pages) {
  test(`admin ${path} açılır`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(path.replace("/", "\\/")));
    await expect(
      page.getByRole("heading", { level: 1, name: heading })
    ).toBeVisible();
  });
}
