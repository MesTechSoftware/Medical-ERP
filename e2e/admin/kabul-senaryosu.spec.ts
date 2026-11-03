import { test, expect, type Page } from "@playwright/test";
import { USERS, ilkGiris, login, sorgu, yeniKullanici, sevkKartiAc } from "../helpers";

/**
 * F-11 — uçtan uca kabul senaryosu (FAZ1 §D.3 madde 9, §C-e). Eski PRD senaryosu geri çekilen
 * mekanizmalara (tahsilat bazlı prim, kongre EARN, bayi paneli) dayanıyordu; bu senaryo
 * `KABUL_KRITERLERI.md`'nin bugünkü kurallarıyla yeniden yazıldı. Rakamlar:
 *
 *  1. Yönetici: Ürün X — liste 1.000 ₺ (KDV hariç), KDV %20, başlangıç stoğu 1.000.
 *  2. Yönetici: yeni satıcı A açar (varsayılan prim %5); A ilk girişte parolasını değiştirir.
 *  3. Satıcı A: Dr. Ayşe'yi açar → sahibi A.
 *  4. Satıcı B: aynı telefonla açmayı dener → reddedilir (X-15 §(2)).
 *  5. Satıcı A: 700 × 850 ₺ → matrah 595.000 + KDV 119.000 = 714.000 ₺; stok düşmez (A-3).
 *  6. Yönetici: hazırlığa alır; kısmi sevk 400 (borç 408.000) + kalan 300 (borç 306.000) → stok 300.
 *  7. Yönetici: ilk sevkiyatın vadesini uzatır → iz kaydı (X-15 §(1)).
 *  8. Yönetici: 714.000 ₺ tahsil eder → bakiye kapalı.
 *  9. Satıcı A raporu: ciro 595.000 · hakediş %5 = 29.750 · tahsilat 714.000.
 * 10. Yönetici: 100 adet iade → cariye 102.000 alacak; A raporu: ciro 510.000 · hakediş 25.500.
 * 11. Yönetici: bayi C (liste 600 ₺) açar, 50 adet sipariş girer ve sevk eder → borç 36.000;
 *     20.000 tahsil eder → bakiye 16.000 borç. Bayi satıcısızdır; A'nın raporu değişmez.
 */
test("kabul senaryosu (F-11)", async ({ page, browser }) => {
  test.setTimeout(180_000);
  const ek = `${Date.now()}`.slice(-7);
  const urunKodu = `KBL-${ek}`;
  const urunAdi = `Ürün X ${ek}`;
  const doktorAdi = `Dr. Ayşe Demir ${ek}`;
  const telefon = `0539${ek}`;
  const bayiAdi = `Bayi C ${ek}`;
  const tutarlar = async (doktorId: string) =>
    sorgu<{ type: string; direction: string; amount: string }>(
      `SELECT type::text, direction::text, amount::text FROM "LedgerEntry" WHERE "doctorId" = $1 ORDER BY "createdAt"`,
      [doktorId]
    );

  // 1 — ürün ve stok
  await page.goto("/products/new");
  await page.getByLabel("Ürün Adı").fill(urunAdi);
  await page.getByLabel("Ürün Kodu").fill(urunKodu);
  await page.getByLabel(/Liste Fiyatı/).fill("1000");
  await page.getByLabel("KDV Oranı").selectOption({ label: "KDV %20" });
  await page.getByLabel("Başlangıç Stoğu (adet)").fill("1000");
  await page.getByRole("button", { name: "Ürün Ekle" }).click();
  await expect(page).toHaveURL(/\/products$/);
  const [{ id: urunId }] = await sorgu<{ id: string }>(`SELECT id FROM "Product" WHERE code = $1`, [urunKodu]);
  const stok = async () =>
    (await sorgu<{ s: string }>(
      `SELECT COALESCE(SUM(CASE WHEN type = 'GIRIS' THEN quantity ELSE -quantity END), 0)::text AS s FROM "StockMovement" WHERE "productId" = $1`,
      [urunId]
    ))[0].s;
  expect(await stok()).toBe("1000");

  // 2 — satıcı A
  const epostaA = await yeniKullanici(page, { prefix: "kabul-a" });
  const a: Page = await (await browser.newContext({ storageState: undefined })).newPage();
  await ilkGiris(a, epostaA);

  // 3 — Dr. Ayşe, sahibi A
  await a.goto("/my-doctors/new");
  await a.getByLabel("Ad Soyad").fill(doktorAdi);
  await a.getByLabel("Klinik / Kurum").fill("Merkez Klinik");
  await a.getByLabel("Bölge").fill("Kadıköy");
  await a.getByLabel("Telefon").fill(telefon);
  await a.getByRole("button", { name: "Doktor Ekle" }).click();
  await expect(a).toHaveURL(/\/my-doctors$/);
  const [{ id: doktorId }] = await sorgu<{ id: string }>(`SELECT id FROM "Doctor" WHERE "fullName" = $1`, [doktorAdi]);

  // 4 — satıcı B aynı telefonla açamaz
  const b: Page = await (await browser.newContext({ storageState: undefined })).newPage();
  await login(b, USERS.seller);
  await b.goto("/my-doctors/new");
  await b.getByLabel("Ad Soyad").fill(`Dr. Kopya ${ek}`);
  await b.getByLabel("Klinik / Kurum").fill("K");
  await b.getByLabel("Bölge").fill("B");
  await b.getByLabel("Telefon").fill(telefon);
  await b.getByRole("button", { name: "Doktor Ekle" }).click();
  await expect(b.getByText(/sistemde zaten kayıtlı/)).toBeVisible();

  // 5 — sipariş 700 × 850
  await a.goto("/my-orders/new");
  await a.getByLabel("Doktor").selectOption({ label: `${doktorAdi} — Merkez Klinik` });
  await a.getByLabel("Ürün").selectOption({ label: `${urunAdi} (${urunKodu}) — Stok: 1000` });
  await a.getByLabel("Miktar").fill("700");
  await a.getByLabel(/^Birim/).fill("850");
  await expect(a.getByText("₺714.000,00")).toBeVisible();
  await a.getByRole("button", { name: "Siparişi Oluştur" }).click();
  await expect(a).toHaveURL(/\/my-orders$/);
  const [{ id: siparisId }] = await sorgu<{ id: string }>(`SELECT id FROM "Order" WHERE "doctorId" = $1`, [doktorId]);
  expect(await stok()).toBe("1000");

  // 6 — hazırlık, kısmi + kalan sevkiyat
  await page.goto(`/orders/${siparisId}`);
  await page.getByRole("button", { name: "Hazırlığa Al" }).click();
  await expect(page.getByRole("link", { name: "Kargo Bilgisi Gir" })).toBeVisible();
  await sevkKartiAc(page, doktorAdi);
  const kart = () => page.locator("[data-sevk-karti]").filter({ hasText: doktorAdi });
  await kart().locator('input[name^="miktar_"]').fill("400");
  await kart().getByRole("button", { name: "Kargola" }).click();
  await expect(kart().getByText("kalan 300/700")).toBeVisible();
  await kart().getByRole("button", { name: "Kargola" }).click();
  await expect(kart()).toHaveCount(0);
  expect(await tutarlar(doktorId)).toEqual([
    { type: "SEVKIYAT", direction: "BORC", amount: "408000.00" },
    { type: "SEVKIYAT", direction: "BORC", amount: "306000.00" },
  ]);
  expect(await stok()).toBe("300");

  // 7 — vade uzatma
  await page.goto(`/doctors/${doktorId}`);
  const ilk = page.locator("tr[data-hareket-id]").filter({ hasText: "₺408.000,00" });
  await ilk.getByText("Vade değiştir").click();
  await ilk.getByLabel("Yeni vade").fill("2027-06-30");
  await ilk.getByLabel("Vade gerekçesi").fill("Kongre dönemi");
  await ilk.getByRole("button", { name: "Kaydet" }).click();
  await expect(ilk.getByText("Vade değişti.")).toBeVisible();
  expect(await sorgu(`SELECT 1 FROM "DueDateChange" c JOIN "LedgerEntry" l ON l.id = c."ledgerEntryId" WHERE l."doctorId" = $1`, [doktorId])).toHaveLength(1);

  // 8 — tahsilat 714.000
  const tahsil = async (cari: string, tutar: string) => {
    await page.goto("/collections");
    await page.getByLabel("Doktor").selectOption({ label: cari });
    await page.getByLabel(/^Tutar/).fill(tutar);
    await page.getByLabel("Yöntem").selectOption({ label: "Havale / EFT" });
    await page.getByRole("button", { name: "Tahsilat Kaydet" }).click();
    await expect(page.getByText(/kaydedildi/i).first()).toBeVisible();
  };
  await tahsil(`${doktorAdi} — Merkez Klinik`, "714000");
  await page.goto(`/doctors/${doktorId}`);
  await expect(page.getByText("Bakiye kapalı")).toBeVisible();

  // 9 — satıcı A raporu
  const rapor = async (ciro: string, hakedis: string) => {
    await a.goto("/my-report");
    const satir = a.locator("tbody tr").first();
    await expect(satir).toContainText(ciro);
    await expect(satir).toContainText(hakedis);
    await expect(satir).toContainText("₺714.000,00");
  };
  await rapor("₺595.000,00", "₺29.750,00");

  // 10 — iade 100
  await page.goto(`/orders/${siparisId}`);
  await page.locator('input[name^="iade_"]').fill("100");
  await page.getByLabel("İade sebebi").fill("Ambalaj hasarlı");
  await page.getByRole("button", { name: "İade Kaydet" }).click();
  await expect(page.getByText(/İade kaydedildi: IAD-/)).toBeVisible();
  expect((await tutarlar(doktorId)).at(-1)).toEqual({ type: "IADE", direction: "ALACAK", amount: "102000.00" });
  await rapor("₺510.000,00", "₺25.500,00");

  // 11 — bayi: liste, cari, sipariş, sevk, tahsilat
  const listeKodu = `KBL${ek}`;
  await page.goto("/price-lists/new");
  await page.getByLabel("Kod").fill(listeKodu);
  await page.getByLabel("Ad").fill("Kabul bayi");
  await page.getByRole("button", { name: "Liste Oluştur" }).click();
  await expect(page.getByRole("heading", { name: `${listeKodu} — Kabul bayi` })).toBeVisible();
  await page.getByLabel("Ürün").selectOption({ label: `${urunAdi} (${urunKodu})` });
  await page.getByLabel(/Liste fiyatı/).fill("600");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Satır kaydedildi.")).toBeVisible();

  await page.goto("/doctors/new");
  await page.getByLabel("Bayi").check();
  await page.getByLabel("Ünvan / Ad").fill(bayiAdi);
  await page.getByLabel("Telefon", { exact: true }).fill(`0216${ek}`);
  await page.getByLabel("Fiyat listesi (boş: varsayılan)").selectOption({ label: `${listeKodu} — Kabul bayi` });
  await page.getByRole("button", { name: "Cariyi Aç" }).click();
  await expect(page.getByRole("heading", { level: 1, name: bayiAdi })).toBeVisible();
  const [{ id: bayiId }] = await sorgu<{ id: string }>(`SELECT id FROM "Doctor" WHERE "fullName" = $1`, [bayiAdi]);

  await page.goto("/orders/new");
  await page.getByLabel("Doktor").selectOption({ label: `[Bayi] ${bayiAdi}` });
  await page.getByLabel("Ürün").selectOption({ label: `${urunAdi} (${urunKodu}) — Stok: 400` });
  await page.getByLabel("Miktar").fill("50");
  await page.getByRole("button", { name: "Siparişi Oluştur" }).click();
  await expect(page).toHaveURL(/\/orders\/(?!new$)[^/]+$/);
  await page.getByRole("button", { name: "Hazırlığa Al" }).click();
  await expect(page.getByRole("link", { name: "Kargo Bilgisi Gir" })).toBeVisible();
  await (await sevkKartiAc(page, bayiAdi)).getByRole("button", { name: "Kargola" }).click();
  await expect(page.locator("[data-sevk-karti]").filter({ hasText: bayiAdi })).toHaveCount(0);
  expect(await tutarlar(bayiId)).toEqual([{ type: "SEVKIYAT", direction: "BORC", amount: "36000.00" }]);
  expect((await sorgu<{ c: string | null }>(`SELECT si."commissionRate"::text AS c FROM "ShipmentItem" si JOIN "Shipment" s ON s.id = si."shipmentId" JOIN "Order" o ON o.id = s."orderId" WHERE o."doctorId" = $1`, [bayiId]))[0].c).toBeNull();

  await tahsil(bayiAdi, "20000");
  await page.goto(`/doctors/${bayiId}`);
  await expect(page.getByText("Doktor borçlu")).toBeVisible();
  await expect(page.getByText("₺16.000,00").first()).toBeVisible();
  expect(await stok()).toBe("350"); // 1000 − 700 + 100 iade − 50

  // Bayi satıcısızdır: A'nın raporu değişmez.
  await rapor("₺510.000,00", "₺25.500,00");
});
