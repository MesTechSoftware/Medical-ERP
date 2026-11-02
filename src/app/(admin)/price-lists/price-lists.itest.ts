import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import { cozumleBirimFiyat } from "@/lib/fiyat";
import { referansVeri } from "../../../../test/integration/referans";

// X-10-2 — fiyat listesi ekranı: başlık + satır (fiyat, min_adet), yalnız yönetici, denetim kaydı.
const h = vi.hoisted(() => ({ adminId: "", yonlendirme: "" }));
vi.mock("@/lib/session", () => ({ requireAdmin: async () => ({ user: { id: h.adminId, role: "YONETICI" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({ redirect: (yol: string) => void (h.yonlendirme = yol) }));
const { createPriceList, setPriceListItem, deletePriceListItem } = await import("./actions");

let s: Awaited<ReturnType<typeof seed>>;
async function seed() {
  const ref = await referansVeri();
  const admin = await prisma.user.create({ data: { name: "Y", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" } });
  h.adminId = admin.id;
  const urun = await prisma.product.create({ data: { name: "Stent", code: "MED-001", taxRateId: ref.kdv20.id } });
  return { ...ref, urun };
}
const form = (veri: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(veri)) fd.set(k, v);
  return fd;
};
const kodlar = (r: { bildirimler: { kural_kodu: string; alan?: string }[] }) => r.bildirimler.map((b) => [b.kural_kodu, b.alan]);

beforeEach(async () => {
  s = await seed();
});

describe("fiyat listesi ekranı (X-10-2)", () => {
  it("liste oluşturur; kod büyük harfe çevrilir, geçersiz ve kayıtlı kod alan altında reddedilir", async () => {
    await createPriceList(null, form({ code: "bayi-a", name: "Bayi A" }));
    const yeni = await prisma.priceList.findUnique({ where: { code: "BAYI-A" } });
    expect(yeni).not.toBeNull();
    expect(h.yonlendirme).toBe(`/price-lists/${yeni!.id}`); // oluşturunca detaya (spec Ü-21 §3.7)
    expect(kodlar(await createPriceList(null, form({ code: "BAYI-A", name: "x" })))).toEqual([["FIYAT_LISTESI_KODU_KAYITLI", "code"]]);
    expect(kodlar(await createPriceList(null, form({ code: "a b", name: "" })))).toEqual([
      ["FIYAT_LISTESI_KODU_GECERSIZ", "code"],
      ["ALAN_ZORUNLU", "name"],
    ]);
    expect(await prisma.auditLog.count({ where: { action: "PRICE_LIST_CREATE" } })).toBe(1);
  });

  it("satır yazar, aynı ürün + min adet yeniden girilince günceller; barem satırı fiyat çözümüne girer; silinir", async () => {
    await createPriceList(null, form({ code: "OZEL", name: "Özel" }));
    const liste = await prisma.priceList.findUniqueOrThrow({ where: { code: "OZEL" } });
    const yaz = (minQuantity: string, listPrice: string) => setPriceListItem(liste.id, null, form({ productId: s.urun.id, minQuantity, listPrice }));

    expect((await yaz("1", "100")).durum).toBe("BASARILI");
    expect((await yaz("1", "95,5")).durum).toBe("BASARILI");
    expect((await yaz("10", "80")).durum).toBe("BASARILI");
    const satirlar = await prisma.priceListItem.findMany({ where: { priceListId: liste.id }, orderBy: { minQuantity: "asc" } });
    expect(satirlar.map((x) => [x.minQuantity, x.listPrice.toFixed(2), x.validFrom, x.validTo])).toEqual([
      [1, "95.50", null, null],
      [10, "80.00", null, null],
    ]);

    const doktor = await prisma.doctor.create({
      data: { accountClass: "DOKTOR", fullName: "Dr. X", phoneNormalized: "+905551112233", priceListId: liste.id },
    });
    const fiyat = async (miktar: number) => {
      const r = await cozumleBirimFiyat(s.urun.id, doktor.id, { miktar, gun: new Date("2026-10-21T00:00:00Z") });
      return r.durum === "TAMAM" ? r.listeFiyat.toFixed(2) : r.neden;
    };
    expect([await fiyat(9), await fiyat(10)]).toEqual(["95.50", "80.00"]);

    expect((await deletePriceListItem(satirlar[1].id)).durum).toBe("BASARILI");
    expect(await fiyat(10)).toBe("95.50");
    const izler = await prisma.auditLog.findMany({ where: { entityId: liste.id }, orderBy: { createdAt: "asc" }, select: { action: true } });
    expect(izler.map((i) => i.action)).toEqual(["PRICE_LIST_CREATE", "PRICE_LIST_ITEM_SET", "PRICE_LIST_ITEM_SET", "PRICE_LIST_ITEM_SET", "PRICE_LIST_ITEM_DELETE"]);
  });

  it("geçersiz fiyat ve miktar alan altında reddedilir; satır yazılmaz", async () => {
    const r = await setPriceListItem(s.liste.id, null, form({ productId: s.urun.id, minQuantity: "0", listPrice: "-1" }));
    expect(kodlar(r)).toEqual([
      ["GECERSIZ_TUTAR", "listPrice"],
      ["GECERSIZ_MIKTAR", "minQuantity"],
    ]);
    expect(await prisma.priceListItem.count({ where: { productId: s.urun.id } })).toBe(0);
  });
});
