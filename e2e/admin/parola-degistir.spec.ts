import { test, expect } from "@playwright/test";
import { GECICI_PAROLA, YENI_PAROLA, login, yeniKullanici } from "../helpers";

/**
 * E-2-7 — geçici parolanın zorunlu değişimi. Hesap yönetici oturumuyla açılır, kullanıcı ayrı
 * bağlamda girer.
 */
test("geçici parolalı kullanıcı parolasını değiştirmeden hiçbir sayfaya geçemez (E-2-7)", async ({
  page,
  browser,
}) => {
  const email = await yeniKullanici(page);
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const k = await ctx.newPage();

  await login(k, { email, password: GECICI_PAROLA });
  await expect(k).toHaveURL(/\/parola-degistir$/);
  for (const yol of ["/my-orders", "/my-doctors", "/"]) {
    await k.goto(yol);
    await expect(k, yol).toHaveURL(/\/parola-degistir$/);
  }

  const gonder = async (mevcut: string, yeni: string, tekrar = yeni) => {
    await k.getByLabel("Mevcut (geçici) parola").fill(mevcut);
    await k.getByLabel("Yeni parola", { exact: true }).fill(yeni);
    await k.getByLabel("Yeni parola (tekrar)").fill(tekrar);
    await k.getByRole("button", { name: "Parolayı Değiştir" }).click();
  };

  await gonder("yanlis-parola", YENI_PAROLA);
  await expect(k.getByText("Mevcut parola hatalı.")).toBeVisible();
  await gonder(GECICI_PAROLA, "12345678");
  await expect(k.getByText(/çok yaygın/)).toBeVisible();
  await gonder(GECICI_PAROLA, YENI_PAROLA, "baska-bir-parola");
  await expect(k.getByText(/tekrarı aynı değil/)).toBeVisible();
  await gonder(GECICI_PAROLA, GECICI_PAROLA);
  await expect(k.getByText(/geçici paroladan farklı/)).toBeVisible();

  await gonder(GECICI_PAROLA, YENI_PAROLA);
  await expect(k).toHaveURL(/\/my-orders$/);

  // Bayrağı kalkan kullanıcı sayfaya giremez; yeni parolayla girer.
  await k.goto("/parola-degistir");
  await expect(k).toHaveURL(/\/my-orders$/);
  await k.getByRole("button", { name: "Çıkış" }).click();
  await login(k, { email, password: YENI_PAROLA });
  await expect(k).toHaveURL(/\/my-orders$/);
  await ctx.close();
});
