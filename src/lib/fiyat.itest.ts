import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { cozumleBirimFiyat } from "@/lib/fiyat";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// `cozumleBirimFiyat()` tamamı — B-5-1 (tarih), B-6-1 (barem), X-10-1 (liste seçimi).

let s: Awaited<ReturnType<typeof referansVeri>>;
let urunId = "";

const gun = (t: string) => new Date(`${t}T00:00:00Z`); // `date` kolonu biçimi
const satir = (listPrice: string, minQuantity = 1, validFrom?: string, validTo?: string, priceListId = s.liste.id) =>
  prisma.priceListItem.create({
    data: {
      priceListId,
      productId: urunId,
      listPrice,
      minQuantity,
      validFrom: validFrom ? gun(validFrom) : null,
      validTo: validTo ? gun(validTo) : null,
    },
  });
const fiyat = async (miktar: number, t = "2026-10-20", doktorId: string | null = null) => {
  const r = await cozumleBirimFiyat(urunId, doktorId, { miktar, gun: gun(t) });
  return r.durum === "TAMAM" ? r.listeFiyat.toFixed(2) : r.neden;
};

beforeEach(async () => {
  s = await referansVeri();
  const urun = await prisma.product.create({ data: { name: "Stent", code: "MED-001", taxRateId: s.kdv20.id } });
  urunId = urun.id;
});

describe("barem — min_adet alt sınır satırları (B-6-1)", () => {
  it("miktarı karşılayan en yüksek min_adet seçilir; üst sınır yoktur", async () => {
    await satir("100", 1);
    await satir("90", 10);
    await satir("80", 50);
    expect(await fiyat(1)).toBe("100.00");
    expect(await fiyat(9)).toBe("100.00");
    expect(await fiyat(10)).toBe("90.00");
    expect(await fiyat(49)).toBe("90.00");
    expect(await fiyat(5000)).toBe("80.00");
  });

  it("miktarı karşılayan satır yoksa çözümlenemez; daha yüksek baremin fiyatına düşülmez", async () => {
    await satir("90", 10);
    expect(await fiyat(5)).toBe("FIYAT_COZUMLENEMEDI");
  });

  it("geçersiz miktar teknik hatadır", async () => {
    await satir("100");
    await expect(cozumleBirimFiyat(urunId, null, { miktar: 0, gun: gun("2026-10-20") })).rejects.toThrow();
  });
});

describe("geçerlilik aralığı — yarı açık [başlangıç, bitiş) (B-5-1)", () => {
  it("başlangıç günü dahil, bitiş günü hariç; boş uç süresizdir", async () => {
    await satir("100", 1, undefined, "2026-10-01"); // eski fiyat, 01.10'a kadar
    await satir("120", 1, "2026-10-01"); // yeni fiyat, 01.10'dan itibaren süresiz
    expect(await fiyat(1, "2026-09-30")).toBe("100.00");
    expect(await fiyat(1, "2026-10-01")).toBe("120.00");
    expect(await fiyat(1, "2030-01-01")).toBe("120.00");
  });

  it("günde geçerli satır yoksa son fiyata düşülmez (B-5)", async () => {
    await satir("100", 1, "2026-01-01", "2026-06-01");
    expect(await fiyat(1, "2026-10-20")).toBe("FIYAT_COZUMLENEMEDI");
  });

  it("barem ve tarih birlikte uygulanır", async () => {
    await satir("100", 1);
    await satir("85", 10, "2026-10-01", "2026-11-01"); // ekim kampanyası
    expect(await fiyat(10, "2026-10-15")).toBe("85.00");
    expect(await fiyat(10, "2026-11-01")).toBe("100.00");
  });
});

describe("liste seçimi (X-10-1)", () => {
  it("atanmış listenin satırı kullanılır; atanmış listede uygun satır yoksa varsayılana düşülmez", async () => {
    const ozel = await prisma.priceList.create({ data: { code: "OZEL", name: "Özel" } });
    const doktor = await prisma.doctor.create({ data: { ...yeniDoktorVerisi(), priceListId: ozel.id } });
    await satir("100", 1);
    await satir("70", 20, undefined, undefined, ozel.id);
    expect(await fiyat(20, "2026-10-20", doktor.id)).toBe("70.00");
    expect(await fiyat(5, "2026-10-20", doktor.id)).toBe("FIYAT_COZUMLENEMEDI");
  });

  it("listesi atanmamış cari varsayılan listeyi kullanır", async () => {
    const doktor = await prisma.doctor.create({ data: yeniDoktorVerisi() });
    await satir("100", 1);
    expect(await fiyat(1, "2026-10-20", doktor.id)).toBe("100.00");
  });
});
