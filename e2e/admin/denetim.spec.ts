import { test, expect } from "@playwright/test";
import { sorgu, yumusakGezinmeIsareti } from "../helpers";

/** X-18-6 / X-18-7 — denetim kaydı: süzgeçli liste, sağdan detay paneli, maskeli alan bazlı fark. */

test("cari VKN'si değişince kayıt Güncelleme olur; detayda istek bağlamı, maskeli fark ve doğrulanmış bütünlük", async ({ page }) => {
  const ek = `${Date.now()}`.slice(-7);
  const ad = `E2E Denetim ${ek}`;
  await page.goto("/doctors/new");
  await page.getByLabel("Bayi").check();
  await page.getByLabel("Ünvan / Ad").fill(ad);
  await page.getByLabel("Telefon", { exact: true }).fill(`0217${ek}`);
  await page.getByText("Fatura bilgileri").click();
  await page.getByLabel("VKN / TCKN").fill("1234567890");
  await page.getByRole("button", { name: "Cariyi Aç" }).click();
  await expect(page.getByRole("heading", { level: 1, name: ad })).toBeVisible();
  await page.getByRole("link", { name: "Düzenle" }).click();
  await page.getByLabel("VKN / TCKN").fill("9876543217");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByRole("heading", { level: 1, name: ad })).toBeVisible();
  const [cari] = await sorgu<{ id: string }>(`SELECT id FROM "Doctor" WHERE "fullName" = $1`, [ad]);

  // Liste: olay süzgeci; en yeni üstte, rozet ikon ve metinle.
  await page.goto("/audit-logs?olay=DOCTOR_UPDATE");
  const satir = page.getByRole("row").filter({ hasText: "Cari bilgilerini güncelledi" }).first();
  await expect(satir.getByText("Güncelleme")).toBeVisible();
  await expect(satir.getByText("Sistem Yöneticisi")).toBeVisible();
  await expect(satir.getByText("Cari", { exact: true })).toBeVisible();
  const detay = satir.getByRole("link", { name: "Detay" });
  await detay.click();

  const panel = page.getByRole("dialog", { name: "Doktor güncelleme" });
  await expect(panel).toBeVisible();
  await expect(page).toHaveURL(/[?&]kayit=/);
  const adres = page.url();
  const kayitBolumu = panel.getByRole("region", { name: "Kayıt" });
  await expect(kayitBolumu.getByText(cari.id)).toBeVisible();
  await expect(kayitBolumu.getByText("Sistem Yöneticisi")).toBeVisible();

  const istek = panel.getByRole("region", { name: "İstek" });
  await expect(istek.getByText(/^POST \/doctors\//)).toBeVisible();
  await expect(istek.getByText("Bu işlem gerekçe istemez.")).toBeVisible();
  await expect(istek.getByText("kayıt yok")).toHaveCount(0); // IP ve oturum dolu

  const vkn = panel.getByRole("list", { name: "Alan değişiklikleri" }).getByRole("listitem").filter({ hasText: "VKN / TCKN" });
  await expect(vkn.getByText("gizli")).toBeVisible();
  await expect(vkn.locator("del")).toHaveText("***");
  await expect(vkn.locator("ins")).toHaveText("***");
  await expect(page.locator("body")).not.toContainText("9876543217");
  await expect(page.locator("body")).not.toContainText("1234567890");
  await expect(panel.getByRole("region", { name: "Bütünlük" }).getByText("Doğrulandı")).toBeVisible();

  // Esc listeye döner, odak açan satıra gelir; adres paneli yeniden açar; Kapat da döner.
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(page).not.toHaveURL(/kayit=/);
  await expect(detay).toBeFocused();
  await page.goto(adres);
  await expect(page.getByRole("dialog", { name: "Doktor güncelleme" })).toBeVisible();
  await page.getByRole("dialog").getByRole("link", { name: "Kapat" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page).not.toHaveURL(/kayit=/);
});

test("süzgeç formu adres çubuğuna yazılır; Daha eski ve Daha yeni sayfalar tekrar etmeden gezer", async ({ page }) => {
  // Değişmezlik INSERT'i engellemez; mühür tetikleyicisi bu satırları da mühürler.
  await sorgu(
    `INSERT INTO "AuditLog" ("id", "action", "actionType", "module", "entityType", "entityId", "changes")
     SELECT gen_random_uuid()::text, 'AUTH_LOGIN_FAILURE', 'OTURUM', 'KULLANICI', 'Auth', $1 || '-' || n || '@m.local', '[]'
     FROM generate_series(1, 60) AS n`,
    [`e2e-sayfa-${Date.now()}`]
  );
  await page.goto("/audit-logs");
  const form = page.getByRole("form", { name: "Denetim kaydı süzgeci" });
  await form.getByLabel("Kullanıcı").selectOption({ label: "Sistem / anonim" });
  await form.getByLabel("Olay").selectOption({ label: "Giriş başarısız" });
  const yumusak = await yumusakGezinmeIsareti(page);
  await form.getByRole("button", { name: "Filtrele" }).click();
  await expect(page).toHaveURL(/kullanici=sistem/);
  expect(await yumusak()).toBe(true);
  await expect(page).toHaveURL(/olay=AUTH_LOGIN_FAILURE/);
  await expect(form.getByLabel("Olay")).toHaveValue("AUTH_LOGIN_FAILURE");

  const kimlikler = () => page.locator("a[data-kayit]").evaluateAll((a) => a.map((x) => x.getAttribute("data-kayit")));
  const ilk = await kimlikler();
  expect(ilk).toHaveLength(50);
  await expect(page.getByRole("row").filter({ hasText: "Başarısız giriş denemesi" })).toHaveCount(50);

  await page.getByRole("link", { name: "Daha eski" }).click();
  await expect(page).toHaveURL(/once=\d+/);
  await expect(page).toHaveURL(/olay=AUTH_LOGIN_FAILURE/);
  const ikinci = await kimlikler();
  expect(ikinci.length).toBeGreaterThan(0);
  expect(ikinci.filter((k) => ilk.includes(k))).toEqual([]);

  await page.getByRole("link", { name: "Daha yeni" }).click();
  await expect(page).toHaveURL(/sonra=\d+/);
  expect(await kimlikler()).toEqual(ilk);

  // Temizle süzgeci kaldırır; form da yeniden kurulur, eski seçimi göstermez.
  await page.getByRole("link", { name: "Temizle" }).click();
  await expect(page).toHaveURL(/\/audit-logs$/);
  await expect(form.getByLabel("Olay")).toHaveValue("");
});
