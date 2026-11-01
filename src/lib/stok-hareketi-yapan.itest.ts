import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// B-4-8 — eski hareketleri dolduran migration ifadeleri (`-- doldurma` altı).

const MIGRATION = path.join(process.cwd(), "prisma/migrations/20261101120000_stok_hareketi_yapan/migration.sql");

function doldurmaIfadeleri(): string[] {
  const sql = readFileSync(MIGRATION, "utf8");
  const bolum = sql.split("-- doldurma")[1];
  return bolum
    .split(";")
    .map((i) => i.trim())
    .filter((i) => i.length > 0);
}

let depoId = "";
let taxRateId = "";

beforeEach(async () => {
  const ref = await referansVeri();
  depoId = ref.depo.id;
  taxRateId = ref.kdv20.id;
});

describe("hareketi yapan — eski kayıtların doldurulması (B-4-8)", () => {
  it("beş kaynak belgenin sahibinden dolar; sevkiyat, sipariş ve elle giriş boş kalır", async () => {
    const kullanici = (ad: string) =>
      prisma.user.create({ data: { name: ad, email: `${ad}@medikal.local`, passwordHash: "x", role: "YONETICI" } });
    const [iadeci, konsinyeci, transferci, duzeltici, aktarici] = await Promise.all(
      ["iade", "konsinye", "transfer", "duzeltme", "aktarim"].map(kullanici)
    );
    const doktor = await prisma.doctor.create({ data: yeniDoktorVerisi() });
    const kns = await prisma.stockLocation.create({ data: { code: "KNS-Y", name: "Konsinye", type: "KONSINYE", doctorId: doktor.id } });
    const u = await prisma.product.create({ data: { name: "U1", code: "U1", taxRateId } });

    const iade = await prisma.returnNote.create({
      data: { documentNo: "IAD-1", doctorId: doktor.id, locationId: depoId, reason: "r", createdById: iadeci.id },
    });
    const konsinye = await prisma.consignmentIssue.create({
      data: { documentNo: "KNS-1", doctorId: doktor.id, fromLocationId: depoId, toLocationId: kns.id, createdById: konsinyeci.id },
    });
    const transfer = await prisma.stockTransfer.create({
      data: { documentNo: "TRF-1", fromLocationId: kns.id, toLocationId: depoId, createdById: transferci.id },
    });
    const duzeltme = await prisma.stockAdjustment.create({ data: { documentNo: "DZL-1", createdById: duzeltici.id } });
    const parti = await prisma.importBatch.create({ data: { batchNo: "P-1", dataType: "ACILIS_STOGU", userId: aktarici.id } });
    const siparis = await prisma.order.create({ data: { documentNo: "SIP-1", doctorId: doktor.id, paymentTermDays: 30 } });
    const sevkiyat = await prisma.shipment.create({ data: { documentNo: "SVK-1", orderId: siparis.id } });

    const hareket = (bag: Record<string, string>) =>
      prisma.stockMovement.create({ data: { productId: u.id, locationId: depoId, type: "GIRIS", quantity: 1, ...bag } });
    const beklenen = new Map<string, string | null>();
    beklenen.set((await hareket({ returnNoteId: iade.id })).id, iadeci.id);
    beklenen.set((await hareket({ consignmentIssueId: konsinye.id })).id, konsinyeci.id);
    beklenen.set((await hareket({ stockTransferId: transfer.id })).id, transferci.id);
    beklenen.set((await hareket({ stockAdjustmentId: duzeltme.id })).id, duzeltici.id);
    beklenen.set((await hareket({ importBatchId: parti.id })).id, aktarici.id);
    beklenen.set((await hareket({ shipmentId: sevkiyat.id })).id, null);
    beklenen.set((await hareket({ orderId: siparis.id })).id, null);
    beklenen.set((await hareket({})).id, null);

    for (const ifade of doldurmaIfadeleri()) await prisma.$executeRawUnsafe(ifade);

    const satirlar = await prisma.stockMovement.findMany({ where: { productId: u.id }, select: { id: true, createdById: true } });
    expect(new Map(satirlar.map((s) => [s.id, s.createdById]))).toEqual(beklenen);
  });
});
