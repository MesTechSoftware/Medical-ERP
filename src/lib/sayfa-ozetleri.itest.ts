import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { VERI_SETLERI } from "@/lib/disa-aktarim";
import { SAYFA_SAYILARI, type SeritBaglami } from "@/lib/sayfa-ozetleri";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// Dashboard sayfa şeridi: sayfa başına tek sayı, ekranın kendi tanımıyla. Sayılmaması gerekenler
// (iptal, kararlı onay, pasif ürün/cari/kullanıcı, aralık dışı) veritabanında durur ama sayılmaz.

const AN = new Date("2026-10-26T11:00:00Z"); // 26 Ekim 14:00 İstanbul
const EKIM = { baslangic: new Date("2026-09-30T21:00:00Z"), bitis: AN };
let no = 0;

async function kullanici(rol: "YONETICI" | "OPERASYON" | "SATICI", aktif = true) {
  no += 1;
  return prisma.user.create({ data: { name: `K${no}`, email: `k${no}@medikal.local`, passwordHash: "x", role: rol, isActive: aktif } });
}

async function siparis(status: "BEKLIYOR" | "HAZIRLANIYOR" | "IPTAL") {
  no += 1;
  const d = await prisma.doctor.create({ data: yeniDoktorVerisi(`Dr. ${no}`) });
  return prisma.order.create({ data: { documentNo: `SIP-S-${no}`, doctorId: d.id, paymentTermDays: 30, stage: "ONAYLI", status } });
}

const baglam = (stoklar: { stok: number }[] = []): SeritBaglami => ({ aralik: EKIM, an: AN, stoklar });
const say = async (sayfa: keyof typeof SAYFA_SAYILARI, b = baglam()) => SAYFA_SAYILARI[sayfa](b);

describe("SAYFA_SAYILARI — dashboard sayfa şeridi", () => {
  it("iş akışı: bekleyen, kargolanacak, karar bekleyen onay, kritik ya da tükenen ürün", async () => {
    await siparis("BEKLIYOR");
    await siparis("BEKLIYOR");
    await siparis("HAZIRLANIYOR");
    await siparis("IPTAL");
    const blok = { documentType: "SIP", documentId: "x", ruleCode: "NEGATIF_STOK", openedById: "u", openReason: "acil" };
    await prisma.approvalBlock.create({ data: blok });
    await prisma.approvalBlock.create({ data: { ...blok, decision: "ONAY", decidedById: "y", decidedAt: AN, decisionNote: "not" } });
    expect(await say("/orders")).toBe(2);
    expect(await say("/shipping")).toBe(1);
    expect(await say("/approvals")).toBe(1);
    expect(await say("/stock", baglam([{ stok: 0 }, { stok: 5 }, { stok: 50 }]))).toBe(2);
  });

  it("tanımlar: aktif ürün, aktif cari, fiyat listesi, aktif kullanıcı, aktif satıcı, veri seti", async () => {
    const ref = await referansVeri();
    await prisma.product.create({ data: { name: "A", code: "A", taxRateId: ref.kdv20.id } });
    await prisma.product.create({ data: { name: "P", code: "P", taxRateId: ref.kdv20.id, status: "PASIF" } });
    await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. Aktif") });
    await prisma.doctor.create({ data: { ...yeniDoktorVerisi("Dr. Pasif"), status: "PASIF" } });
    await kullanici("SATICI");
    await kullanici("SATICI", false);
    await kullanici("YONETICI");
    expect(await say("/products")).toBe(1);
    expect(await say("/doctors")).toBe(1);
    expect(await say("/price-lists")).toBe(await prisma.priceList.count());
    expect(await say("/users")).toBe(2);
    expect(await say("/reports")).toBe(1);
    expect(await say("/exports")).toBe(VERI_SETLERI.length);
  });

  it("dönem sayıları seçili aralıktan (AKTIF tahsilat, içe aktarım partisi); denetim kaydı bugünün", async () => {
    const ref = await referansVeri();
    const k = await kullanici("YONETICI");
    const d = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. T") });
    const tahsilat = (paidAt: Date, status: "AKTIF" | "IPTAL" = "AKTIF") =>
      prisma.doctorPayment.create({
        data: { documentNo: `THS-S-${++no}`, doctorId: d.id, amount: "100", paymentMethodId: ref.havale.id, commissionRate: "0", commissionAmount: "0", recordedBy: k.id, paidAt, status },
      });
    await tahsilat(new Date("2026-10-05T09:00:00Z"));
    await tahsilat(new Date("2026-10-06T09:00:00Z"), "IPTAL");
    await tahsilat(new Date("2026-09-29T09:00:00Z"));
    const parti = (createdAt: Date) =>
      prisma.importBatch.create({ data: { batchNo: `IMP-S-${++no}`, dataType: "URUN", userId: k.id, createdAt } });
    await parti(new Date("2026-10-10T09:00:00Z"));
    await parti(new Date("2026-08-10T09:00:00Z"));
    const kayit = (createdAt: Date) => prisma.auditLog.create({ data: { action: "PRODUCT_UPDATE", actionType: "GUNCELLEME", module: "URUN_FIYAT", entityType: "Product", createdAt } });
    await kayit(new Date("2026-10-26T06:00:00Z")); // 26 Ekim 09:00
    await kayit(new Date("2026-10-25T20:00:00Z")); // 25 Ekim 23:00
    expect(await say("/collections")).toBe(1);
    expect(await say("/imports")).toBe(1);
    expect(await say("/audit-logs")).toBe(1);
  });
});
