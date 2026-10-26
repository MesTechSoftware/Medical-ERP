import { test } from "@playwright/test";
import { iskeletGercekleEslesir } from "../helpers";

test.use({ storageState: "playwright/.auth/admin.json" });

test("yükleme iskeleti gerçek yerleşimle eşleşir (telefon / Android / dokunmatik tablet)", async ({ page }) => {
  await iskeletGercekleEslesir(page, "/products");
});
