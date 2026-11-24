import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import { referansVeri } from "../../../../test/integration/referans";

// C-3-2 — ürün silme: bağı olmayan ürün fiyat satırlarıyla silinir ve denetlenir; stok hareketi ya da
// sipariş kalemi olan ürün silinmez, stok hareketi hiçbir koşulda silinmez.
const h = vi.hoisted(() => ({ adminId: "" }));
vi.mock("@/lib/session", () => ({ requireAdmin: async () => ({ user: { id: h.adminId, role: "YONETICI" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({ redirect: () => {} }));
const { deleteProduct } = await import("./actions");

let s: Awaited<ReturnType<typeof seed>>;
async function seed() {
  const ref = await referansVeri();
  const admin = await prisma.user.create({ data: { name: "Y", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" } });
  h.adminId = admin.id;
  const urun = await prisma.product.create({ data: { name: "Stent", code: "MED-001", taxRateId: ref.kdv20.id } });
  await prisma.priceListItem.create({ data: { priceListId: ref.liste.id, productId: urun.id, listPrice: "10", minQuantity: 1 } });
  return { ...ref, urun, admin };
}

beforeEach(async () => {
  s = await seed();
});

describe("ürün silme (C-3-2)", () => {
  it("bağı olmayan ürün ve fiyat satırı silinir; denetime yazılır", async () => {
    await deleteProduct(s.urun.id);
    expect(await prisma.product.findUnique({ where: { id: s.urun.id } })).toBeNull();
    expect(await prisma.priceListItem.count({ where: { productId: s.urun.id } })).toBe(0);
    const iz = await prisma.auditLog.findMany({ where: { entityId: s.urun.id }, select: { action: true, actionType: true, actorId: true } });
    expect(iz).toEqual([{ action: "PRODUCT_DELETE", actionType: "SILME", actorId: s.admin.id }]);
  });

  it("stok hareketi olan ürün silinmez; hareket ve fiyat satırı yerinde kalır", async () => {
    await prisma.stockMovement.create({
      data: { productId: s.urun.id, locationId: s.depo.id, type: "GIRIS", quantity: 5, createdById: s.admin.id },
    });
    const sonuc = await deleteProduct(s.urun.id);
    expect(sonuc?.bildirimler.map((b) => b.kural_kodu)).toEqual(["URUN_SIPARISTE_KULLANILDI"]);
    expect(await prisma.product.count({ where: { id: s.urun.id } })).toBe(1);
    expect(await prisma.stockMovement.count({ where: { productId: s.urun.id } })).toBe(1);
    expect(await prisma.priceListItem.count({ where: { productId: s.urun.id } })).toBe(1);
    expect(await prisma.auditLog.count({ where: { entityId: s.urun.id } })).toBe(0);
  });

  it("olmayan ürün URUN_BULUNAMADI döner", async () => {
    await deleteProduct(s.urun.id);
    const sonuc = await deleteProduct(s.urun.id);
    expect(sonuc?.bildirimler.map((b) => b.kural_kodu)).toEqual(["URUN_BULUNAMADI"]);
  });
});
