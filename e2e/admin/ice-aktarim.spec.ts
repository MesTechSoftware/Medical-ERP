import { test, expect } from "@playwright/test";
import { xlsxKitap } from "../../src/lib/disa-aktarim-yazici";

/** X-16-1 · D-6-1 — ekrandan cari içe aktarımı: şablon, önizleme, hatalı satır, yazma, geri alma. */
const BASLIK = ["Hesap sınıfı", "Ad Soyad / Ünvan", "Klinik", "Bölge", "Telefon"];
const dosya = (satirlar: (string | null)[][]) => ({
  name: "cari.xlsx",
  mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  buffer: xlsxKitap([{ ad: "Veri", kolonlar: BASLIK.map((b) => ({ baslik: b, tip: "metin" as const })), satirlar }]),
});

test("şablon iner; hatalı satır yazmayı kapatır; hatasız dosya önizlenip yazılır ve parti geri alınır (X-16-1)", async ({ page }) => {
  const ek = `${Date.now()}`.slice(-7);
  await page.goto("/imports");

  const indirme = page.waitForEvent("download");
  await page.getByRole("button", { name: "Şablonu indir" }).click();
  expect((await indirme).suggestedFilename()).toBe("sablon_cari.xlsx");

  await page.getByLabel("Dosya (.xlsx)").setInputFiles(
    dosya([
      ["DOKTOR", `Dr. İçe ${ek}`, "Klinik", "Bölge", `0531${ek}`],
      ["DOKTOR", `Dr. Eksik ${ek}`, null, "Bölge", `0530${ek}`],
    ])
  );
  await page.getByRole("button", { name: "Doğrula ve önizle" }).click();
  const tablo = page.getByRole("table", { name: "Satır hataları" });
  await expect(tablo).toContainText("Klinik");
  await expect(tablo.locator("tr").nth(1)).toContainText("3");
  await expect(page.getByRole("button", { name: /^Yaz/ })).toHaveCount(0);

  await page.getByLabel("Dosya (.xlsx)").setInputFiles(
    dosya([
      ["DOKTOR", `Dr. İçe ${ek}`, "Klinik", "Bölge", `0531${ek}`],
      ["BAYI", `Bayi İçe ${ek}`, null, null, `0212${ek}`],
    ])
  );
  await page.getByRole("button", { name: "Doğrula ve önizle" }).click();
  await expect(page.getByText("Açılacak kayıt")).toBeVisible();
  await page.getByRole("button", { name: "Yaz (2 kayıt)" }).click();
  await expect(page.getByText(/Parti CARI-\d{8}-\w{5} yazıldı\./)).toBeVisible();

  const satir = page.locator("tr[data-parti]").first();
  await expect(satir).toContainText("cari.xlsx");
  await satir.getByText("Geri al", { exact: true }).click();
  await satir.getByLabel("Geri alma gerekçesi").fill("Deneme");
  await satir.getByRole("button", { name: "Partiyi geri al" }).click();
  await expect(page.locator("tr[data-parti]").first()).toContainText("Geri alındı");
});
