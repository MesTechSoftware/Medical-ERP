import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { baremMatrisi, cozumleBirimFiyat, cozumleListeFiyatlari } from "@/lib/fiyat";
import { siparisFiyatiOnizle } from "@/lib/siparis-giris";
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

describe("cozumleListeFiyatlari — toplu ≡ tekli (X-10-4)", () => {
  const yeniUrun = async (code: string) =>
    (await prisma.product.create({ data: { name: code, code, taxRateId: s.kdv20.id } })).id;
  const satirEkle = (productId: string, listPrice: string, minQuantity = 1, validFrom?: string, validTo?: string) =>
    prisma.priceListItem.create({
      data: {
        priceListId: s.liste.id,
        productId,
        listPrice,
        minQuantity,
        validFrom: validFrom ? gun(validFrom) : null,
        validTo: validTo ? gun(validTo) : null,
      },
    });
  const ozet = (r: Awaited<ReturnType<typeof cozumleBirimFiyat>> | undefined) =>
    r?.durum === "TAMAM" ? `${r.listeFiyat.toFixed(4)}@${r.fiyatListesiId}` : r?.neden;

  it("her ürün için cozumleBirimFiyat(urun, null, …) ile aynı", async () => {
    const tek = await yeniUrun("T");
    const barem = await yeniUrun("B");
    const yalniz10 = await yeniUrun("Y");
    const sureli = await yeniUrun("S");
    const satirsiz = await yeniUrun("X");
    await satirEkle(tek, "100");
    await satirEkle(barem, "100", 1);
    await satirEkle(barem, "90", 10);
    await satirEkle(yalniz10, "80", 10);
    await satirEkle(sureli, "50", 1, undefined, "2026-10-01");
    await satirEkle(sureli, "55.5", 1, "2026-10-01");
    const idler = [tek, barem, yalniz10, sureli, satirsiz];
    for (const miktar of [1, 10]) {
      const kosul = { miktar, gun: gun("2026-10-20") };
      const toplu = await cozumleListeFiyatlari(idler, kosul);
      expect(toplu.size).toBe(idler.length);
      for (const id of idler) expect(ozet(toplu.get(id))).toBe(ozet(await cozumleBirimFiyat(id, null, kosul)));
    }
    const birde = await cozumleListeFiyatlari(idler, { miktar: 1, gun: gun("2026-10-20") });
    expect(ozet(birde.get(yalniz10))).toBe("FIYAT_COZUMLENEMEDI");
    expect(ozet(birde.get(sureli))).toBe(`55.5000@${s.liste.id}`);
  });

  it("varsayılan liste yoksa her ürün LISTE_YOK", async () => {
    await satir("100");
    await prisma.priceList.update({ where: { id: s.liste.id }, data: { code: "BASKA" } });
    const toplu = await cozumleListeFiyatlari([urunId], { miktar: 1, gun: gun("2026-10-20") });
    expect(ozet(toplu.get(urunId))).toBe("LISTE_YOK");
  });

  it("boş liste boş harita", async () => {
    expect((await cozumleListeFiyatlari([], { miktar: 1, gun: gun("2026-10-20") })).size).toBe(0);
  });
});

describe("barem matrisi — fiyat seçiminin tek yolundan (X-10-5)", () => {
  const ozet = (h: { fiyat: { toFixed(n: number): string }; devralinan: boolean } | null) =>
    h ? `${h.fiyat.toFixed(2)}${h.devralinan ? "*" : ""}` : null;

  it("eşikler küçükten büyüğe; hücre o miktardaki seçimdir, alt eşikten gelen devralınmış, eşiğe kadar satır yoksa boş", async () => {
    const b = await prisma.product.create({ data: { name: "Balon", code: "MED-002", taxRateId: s.kdv20.id } });
    await satir("100", 1);
    await satir("90", 10);
    await satir("80", 50);
    await prisma.priceListItem.create({ data: { priceListId: s.liste.id, productId: b.id, listPrice: "70", minQuantity: 10 } });

    const m = await baremMatrisi(s.liste.id, gun("2026-10-20"));
    expect(m.esikler).toEqual([1, 10, 50]);
    expect(m.urunler.map((u) => u.name)).toEqual(["Balon", "Stent"]);
    expect(m.urunler[1].hucreler.map(ozet)).toEqual(["100.00", "90.00", "80.00"]);
    expect(m.urunler[0].hucreler.map(ozet)).toEqual([null, "70.00", "70.00*"]);
    expect(m.urunler[0].hucreler.map((h) => h?.kaynakEsik ?? null)).toEqual([null, 10, 10]);
  });

  it("her hücre listeye atanmış carinin cozumleBirimFiyat sonucuna eşittir", async () => {
    const ozel = await prisma.priceList.create({ data: { code: "OZEL", name: "Özel" } });
    const b = await prisma.product.create({ data: { name: "Balon", code: "MED-002", taxRateId: s.kdv20.id } });
    await satir("100", 1, undefined, undefined, ozel.id);
    await satir("95", 5, undefined, undefined, ozel.id);
    await satir("60", 20, "2026-10-01", undefined, ozel.id);
    await prisma.priceListItem.create({ data: { priceListId: ozel.id, productId: b.id, listPrice: "40", minQuantity: 5 } });
    const doktor = await prisma.doctor.create({ data: { ...yeniDoktorVerisi(), priceListId: ozel.id } });

    const t = gun("2026-10-20");
    const m = await baremMatrisi(ozel.id, t);
    expect(m.esikler).toEqual([1, 5, 20]);
    for (const u of m.urunler) {
      for (const [i, esik] of m.esikler.entries()) {
        const r = await cozumleBirimFiyat(u.id, doktor.id, { miktar: esik, gun: t });
        const h = u.hucreler[i];
        expect(h ? h.fiyat.toFixed(4) : "FIYAT_COZUMLENEMEDI").toBe(r.durum === "TAMAM" ? r.listeFiyat.toFixed(4) : r.neden);
      }
    }
  });

  it("tarihli satır yalnız geçerli olduğu günde sayılır; bugün geçerli satırı olmayan liste boştur", async () => {
    await satir("100", 1, undefined, "2026-10-20"); // 20.10 hariç biter
    await satir("90", 10, "2026-10-21"); // 21.10'da başlar
    expect(await baremMatrisi(s.liste.id, gun("2026-10-20"))).toEqual({ esikler: [], urunler: [] });
    const yarin = await baremMatrisi(s.liste.id, gun("2026-10-21"));
    expect(yarin.esikler).toEqual([10]);
    expect(yarin.urunler[0].hucreler.map(ozet)).toEqual(["90.00"]);
    const dun = await baremMatrisi(s.liste.id, gun("2026-10-19"));
    expect(dun.esikler).toEqual([1]);
  });
});

describe("sipariş formu fiyat önizlemesi (A-10-2)", () => {
  it("seçili carinin listesinden ve miktarın barem basamağından çözülür", async () => {
    const ozel = await prisma.priceList.create({ data: { code: "OZEL", name: "Özel" } });
    await satir("100", 1);
    await satir("70", 1, undefined, undefined, ozel.id);
    await satir("60", 20, undefined, undefined, ozel.id);
    const doktor = await prisma.doctor.create({ data: { ...yeniDoktorVerisi(), priceListId: ozel.id } });

    expect(await siparisFiyatiOnizle(doktor.id, urunId, 1)).toBe("70");
    expect(await siparisFiyatiOnizle(doktor.id, urunId, 25)).toBe("60");
    expect(await siparisFiyatiOnizle("", urunId, 1)).toBe("100");
  });

  it("fiyat çözülemezse ya da miktar geçersizse null döner; varsayılana düşülmez", async () => {
    await satir("90", 10);
    expect(await siparisFiyatiOnizle("", urunId, 5)).toBeNull();
    expect(await siparisFiyatiOnizle("", urunId, 0)).toBeNull();
  });
});
