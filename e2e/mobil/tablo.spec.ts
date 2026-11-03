import { test, expect, type Locator } from "@playwright/test";
import { dokunmaHedefi, telefonda } from "./ortak";

test.use({ storageState: "playwright/.auth/admin.json" });

/** Tablonun kaydırma kutusu (overflow-x'i visible olmayan ilk ata) — sınıfa bağlanmadan. */
async function kutuOlc(tablo: Locator, kaydir = 0) {
  return tablo.evaluate((t, dx) => {
    let kutu = t.parentElement!;
    while (getComputedStyle(kutu).overflowX === "visible") kutu = kutu.parentElement!;
    const ilk = t.querySelector("tbody td")!;
    const ikinci = t.querySelector("tbody td:nth-child(2)")!;
    const kose = t.querySelector("thead th")!;
    const olc = () => [ilk, ikinci, kose].map((e) => e.getBoundingClientRect().left);
    const once = olc();
    kutu.scrollLeft = dx;
    const sonra = olc();
    // Köşe başlığı üstte mi: sağ kenarındaki (öbür başlığın altından kaydığı yer) en üst öğe kendisi olmalı.
    const r = kose.getBoundingClientRect();
    const ust = document.elementFromPoint(r.right - 4, r.top + r.height / 2);
    const koseUstte = !!ust && kose.contains(ust);
    const s = getComputedStyle(kutu);
    return {
      yatayTasma: kutu.scrollWidth > kutu.clientWidth,
      dikeyTasma: kutu.scrollHeight > kutu.clientHeight,
      kaydi: kutu.scrollLeft,
      once,
      sonra,
      koseUstte,
      azamiY: s.maxHeight,
      tasmaY: s.overflowY,
    };
  }, kaydir);
}

test("telefonda: ilk sütun yatay kaydırmada sabit, tablo kutusunda dikey iç kaydırma yok", async ({ page }) => {
  test.skip(!telefonda(page), "yalnız telefon genişliği");
  await page.goto("/orders");
  await page.getByRole("link", { name: "Detay" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Sipariş Detayı" })).toBeVisible();
  // Altı tutar sütunlu kalem tablosu telefona sığmaz; kutunun içinde kayar.
  const tablo = page.getByRole("table").filter({ has: page.getByRole("columnheader", { name: "Ürün" }) });
  const o = await kutuOlc(tablo, 120);
  expect(o.yatayTasma).toBe(true);
  expect(o.kaydi).toBeGreaterThan(0);
  expect(Math.abs(o.sonra[0] - o.once[0]), "ilk sütun yerinde kalmalı").toBeLessThanOrEqual(1);
  expect(Math.abs(o.sonra[2] - o.once[2]), "köşe başlığı yerinde kalmalı").toBeLessThanOrEqual(1);
  expect(o.koseUstte, "köşe başlığı öbür başlıkların altında kalmamalı").toBe(true);
  expect(o.once[1] - o.sonra[1], "ikinci sütun kaymalı").toBeGreaterThan(o.kaydi - 2);
  expect(o.dikeyTasma, "telefonda dikey iç kaydırma olmamalı").toBe(false);
  expect(o.azamiY).toBe("none");
});

test("md ve üstünde tablo kutusu dikeyde sınırlı; taşarsa başlık kutunun içinde sabit", async ({ page }) => {
  test.skip(telefonda(page), "yalnız md ve üstü");
  await page.goto("/audit-logs");
  const tablo = page.getByRole("table");
  await expect(tablo.getByRole("columnheader").first()).toBeVisible();
  const o = await kutuOlc(tablo);
  expect(o.azamiY).not.toBe("none");
  expect(o.tasmaY).toBe("auto");
  if (o.dikeyTasma) {
    const baslik = tablo.getByRole("columnheader").first();
    const once = (await baslik.boundingBox())!;
    await tablo.evaluate((t) => {
      let kutu = t.parentElement!;
      while (getComputedStyle(kutu).overflowX === "visible") kutu = kutu.parentElement!;
      kutu.scrollTop = 300;
    });
    const sonra = (await baslik.boundingBox())!;
    expect(Math.abs(sonra.y - once.y), "başlık kutu kayınca yerinde kalmalı").toBeLessThanOrEqual(1);
  }
});

test("sayfalama ve filtre hapları dokunmatikte en az 44 px; telefonda kısa biçim", async ({ page }) => {
  await page.goto("/orders?per=1");
  const sayfalama = page.getByRole("navigation", { name: "Sayfalama" });
  await expect(sayfalama).toBeVisible();
  await dokunmaHedefi(sayfalama.getByRole("link", { name: "Sonraki" }), "Sonraki");
  if (telefonda(page)) {
    await expect(sayfalama.getByText(/^1 \/ \d+$/)).toBeVisible();
    await expect(sayfalama.getByText(/toplam \d+ kayıt/)).toBeHidden();
  }
  for (const ad of ["Tümü", "Bekliyor", "İptal"]) {
    // KPI kartları da aynı adı taşır (Ü-23); hap sekme bölgesindedir.
    await dokunmaHedefi(page.getByRole("navigation", { name: "Hızlı süzgeçler" }).getByRole("link", { name: ad, exact: true }), `hap: ${ad}`);
  }
});

test("satır kutucuğunun dokunma alanı 44 px; kenarına dokunmak işaretler", async ({ page }) => {
  await page.goto("/doctors");
  const kutucuk = page.getByRole("checkbox", { name: /seç$/ }).first();
  await expect(kutucuk).toBeVisible();
  const alan = kutucuk.locator("xpath=ancestor::label[1]");
  await dokunmaHedefi(alan, "kutucuk alanı");
  await alan.click({ position: { x: 2, y: 2 } });
  await expect(kutucuk).toBeChecked();
});
