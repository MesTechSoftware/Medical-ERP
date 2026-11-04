import { test, expect } from "@playwright/test";
import { xlsxKitap } from "../../src/lib/disa-aktarim-yazici";
import { sorgu, stoksuzSiparis } from "../helpers";

/** X-16-1 · D-6-1 — ekrandan cari içe aktarımı: şablon, önizleme, hatalı satır, yazma, geri alma. */
const BASLIK = ["Hesap sınıfı", "Ad Soyad / Ünvan", "Klinik", "Bölge", "Telefon"];
const dosya = (satirlar: (string | null)[][]) => ({
  name: "cari.xlsx",
  mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  buffer: xlsxKitap([{ ad: "Veri", kolonlar: BASLIK.map((b) => ({ baslik: b, tip: "metin" as const })), satirlar }]),
});

test("şablon iner; hatalı satır yazmayı kapatır; hatasız dosya önizlenip yazılır ve parti geri alınır (X-16-1)", async ({ page }) => {
  const ek = `${Date.now()}`.slice(-7);
  await page.goto("/imports/new");

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

  // Parti listede; geri alma parti panelinden, gerekçeyle (Ü-30 §3.4).
  await page.goto("/imports");
  const satir = page.locator("tr[data-parti]").first();
  await expect(satir).toContainText("cari.xlsx");
  await satir.getByRole("link", { name: "İncele" }).click();
  const panel = page.getByRole("dialog");
  await expect(panel.getByRole("region", { name: "Kayıtlar" })).toContainText("Cari");
  await panel.getByLabel("Geri alma gerekçesi").fill("Deneme");
  await panel.getByRole("button", { name: "Partiyi geri al" }).click();
  await expect(panel.getByRole("region", { name: "Geri alma" })).toContainText("Deneme");
  await expect(page.locator("tr[data-parti]").first()).toContainText("Geri alındı");
});

test("açılış bakiyesi: özet brüt toplamları gösterir, yazılır, parti geri alınmaz (A-6-1, D-6-2)", async ({ page }) => {
  const s = await stoksuzSiparis(); // yeni cari
  const [{ telefon }] = await sorgu<{ telefon: string }>(`SELECT "phoneNormalized" AS telefon FROM "Doctor" WHERE id = $1`, [s.doktorId]);
  await page.goto("/imports/new");
  await page.getByLabel("Veri türü").selectOption("ACILIS_BAKIYESI");
  await page.getByLabel("Dosya (.xlsx)").setInputFiles({
    name: "acilis.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: xlsxKitap([
      { ad: "Veri", kolonlar: ["Cari telefonu", "Yön", "Tutar"].map((b) => ({ baslik: b, tip: "metin" as const })), satirlar: [[telefon, "BORC", "750"]] },
    ]),
  });
  await page.getByRole("button", { name: "Doğrula ve önizle" }).click();
  await expect(page.getByText("Toplam borç")).toBeVisible();
  await expect(page.getByText("₺750,00 (KDV dahil)").first()).toBeVisible();
  await page.getByRole("button", { name: "Yaz (1 kayıt)" }).click();
  await expect(page.getByText(/Parti ACILIS_BAKIYESI-\d{8}-\w{5} yazıldı\./)).toBeVisible();
  await page.goto("/imports");
  const satir = page.locator("tr[data-parti]").first();
  await expect(satir).toContainText("Yazıldı");
  // Açılış partisi geri alınmaz: panelde form yok, açıklama var (D-6-2).
  await satir.getByRole("link", { name: "İncele" }).click();
  const geriAlma = page.getByRole("dialog").getByRole("region", { name: "Geri alma" });
  await expect(geriAlma).toContainText("Bu tür geri alınmaz (açılış).");
  await expect(geriAlma.getByRole("button", { name: "Partiyi geri al" })).toHaveCount(0);

  const [h] = await sorgu<{ type: string; amount: string }>(`SELECT type::text, amount::text FROM "LedgerEntry" WHERE "doctorId" = $1`, [s.doktorId]);
  expect(h).toEqual({ type: "ACILIS", amount: "750.00" });
});
