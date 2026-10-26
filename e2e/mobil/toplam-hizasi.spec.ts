import { test } from "@playwright/test";
import { toplamlarKolonlaHizali } from "../helpers";

test.use({ storageState: "playwright/.auth/admin.json" });

test("telefon ve tablette sipariş toplamları kendi tabanlarının kolonu altında (Ü-3-1)", async ({ page }) => {
  await toplamlarKolonlaHizali(page);
});
