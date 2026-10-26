import { test } from "@playwright/test";
import { toplamlarKolonlaHizali } from "../helpers";

test("sipariş detayında toplamlar kendi tabanlarının kolonu altında (Ü-3-1)", async ({ page }) => {
  await toplamlarKolonlaHizali(page);
});
