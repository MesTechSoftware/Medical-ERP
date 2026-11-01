import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { HAREKET_TURLERI } from "@/lib/stok-hareket-turu";
import { BOS_SUZGEC, type StokSuzgeci } from "@/lib/stok-listesi/suzgec";
import { konsinyedekiMal, stokHareketleri, stokKpileri } from "@/lib/stok-listesi/sorgu";
import { bugun, yerelGunAraligi, yerelGunMetni } from "@/lib/zaman";
import { referansVeri, yeniDoktorVerisi } from "../../../test/integration/referans";

// Stok ekranı sorguları — KABUL_KRITERLERI B-4-8, B-4-10.

const HEPSI = { skip: 0, take: 1000 };

let ref: Awaited<ReturnType<typeof referansVeri>>;
let yapan: { id: string; name: string };

const urun = (code: string, status: "AKTIF" | "PASIF" = "AKTIF") =>
  prisma.product.create({ data: { name: `Ürün ${code}`, code, status, taxRateId: ref.kdv20.id } });

type Hareket = {
  productId: string;
  type?: "GIRIS" | "CIKIS";
  quantity?: number;
  locationId?: string;
  createdAt?: Date;
  createdById?: string | null;
  bag?: Record<string, string>;
};
const hareket = (h: Hareket) =>
  prisma.stockMovement.create({
    data: {
      productId: h.productId,
      locationId: h.locationId ?? ref.depo.id,
      type: h.type ?? "GIRIS",
      quantity: h.quantity ?? 1,
      createdById: h.createdById === undefined ? yapan.id : h.createdById,
      ...(h.createdAt ? { createdAt: h.createdAt } : {}),
      ...h.bag,
    },
  });

const liste = (s: Partial<StokSuzgeci>, sayfa = HEPSI) => stokHareketleri({ ...BOS_SUZGEC, ...s }, sayfa);

beforeEach(async () => {
  ref = await referansVeri();
  yapan = await prisma.user.create({
    data: { name: "Depo Sorumlusu", email: "depo@medikal.local", passwordHash: "x", role: "OPERASYON" },
    select: { id: true, name: true },
  });
});

describe("stokHareketleri — süzgeç", () => {
  it("tarih süzgeci İstanbul günüdür", async () => {
    const u = await urun("T1");
    const gun = yerelGunAraligi("2026-10-15")!;
    const geceYarisinaBirDakika = await hareket({ productId: u.id, createdAt: new Date(gun.bitis.getTime() - 60_000) });
    await hareket({ productId: u.id, createdAt: gun.bitis });
    const { satirlar } = await liste({ baslangic: "2026-10-15", bitis: "2026-10-15" });
    expect(satirlar.map((s) => s.id)).toEqual([geceYarisinaBirDakika.id]);
  });

  it("tür × yön birleşir; her hareket tam bir türdedir (B-4-10)", async () => {
    const u = await urun("T2");
    const doktor = await prisma.doctor.create({ data: yeniDoktorVerisi() });
    const siparis = await prisma.order.create({ data: { documentNo: "SIP-T-1", doctorId: doktor.id, paymentTermDays: 30 } });
    const sevk = await prisma.shipment.create({ data: { documentNo: "SVK-T-1", orderId: siparis.id } });
    const dzl = await prisma.stockAdjustment.create({ data: { documentNo: "DZL-T-1", createdById: yapan.id } });
    await hareket({ productId: u.id, quantity: 9 });
    await hareket({ productId: u.id, type: "CIKIS", bag: { shipmentId: sevk.id } });
    await hareket({ productId: u.id, type: "CIKIS", bag: { stockAdjustmentId: dzl.id } });
    await hareket({ productId: u.id, type: "GIRIS", bag: { stockAdjustmentId: dzl.id } });
    const iptalIadesi = await hareket({ productId: u.id, type: "GIRIS", bag: { orderId: siparis.id } });

    const toplam = (await liste({})).toplam;
    let turlerToplami = 0;
    for (const t of HAREKET_TURLERI) turlerToplami += (await liste({ tur: t.kod })).toplam;
    expect(turlerToplami).toBe(toplam);

    expect((await liste({ tur: "siparis" })).satirlar.map((s) => s.id)).toEqual([iptalIadesi.id]);
    expect((await liste({ tur: "giris" })).satirlar.map((s) => s.id)).not.toContain(iptalIadesi.id);
    expect((await liste({ tur: "duzeltme", yon: "CIKIS" })).toplam).toBe(1);
    expect((await liste({ yon: "CIKIS" })).toplam).toBe(2);
  });
});

describe("stokHareketleri — satır", () => {
  it("belge no, konum, ± miktar, tür ve yapan; eski kayıtta yapan null", async () => {
    const u = await urun("S1");
    const doktor = await prisma.doctor.create({ data: yeniDoktorVerisi() });
    const siparis = await prisma.order.create({ data: { documentNo: "SIP-S-1", doctorId: doktor.id, paymentTermDays: 30 } });
    const sevk = await prisma.shipment.create({ data: { documentNo: "SVK-S-1", orderId: siparis.id } });
    const parti = await prisma.importBatch.create({ data: { batchNo: "P-S-1", dataType: "ACILIS_STOGU", userId: yapan.id } });
    const cikis = await hareket({ productId: u.id, type: "CIKIS", quantity: 4, bag: { shipmentId: sevk.id } });
    const acilis = await hareket({ productId: u.id, quantity: 7, bag: { importBatchId: parti.id } });
    const eski = await hareket({ productId: u.id, quantity: 2, createdById: null });

    const satir = new Map((await liste({})).satirlar.map((s) => [s.id, s]));
    expect(satir.get(cikis.id)).toMatchObject({
      urun: { id: u.id, name: "Ürün S1", code: "S1" },
      tur: "Sevkiyat",
      belgeNo: "SVK-S-1",
      konum: ref.depo.name,
      miktar: -4,
      yapan: "Depo Sorumlusu",
    });
    expect(satir.get(acilis.id)).toMatchObject({ tur: "Açılış", belgeNo: null, miktar: 7 });
    expect(satir.get(eski.id)).toMatchObject({ tur: "Stok girişi", belgeNo: null, yapan: null });
  });

  it("yeniden eskiye; sayfalama süzgeçten sonra, toplam süzgeçli sayım", async () => {
    const u = await urun("S2");
    const gun = yerelGunAraligi("2026-10-10")!.baslangic;
    const idler: string[] = [];
    for (let i = 0; i < 5; i++) {
      idler.push((await hareket({ productId: u.id, createdAt: new Date(gun.getTime() + i * 60_000) })).id);
    }
    await hareket({ productId: u.id, type: "CIKIS", createdAt: gun });
    const sayfa = await liste({ yon: "GIRIS" }, { skip: 1, take: 2 });
    expect(sayfa.toplam).toBe(5);
    expect(sayfa.satirlar.map((s) => s.id)).toEqual([idler[3], idler[2]]);
  });
});

describe("stokKpileri", () => {
  it("bugün giriş/çıkış = aynı süzgeçli liste toplamı (B-4-10); stoktaki yalnız stok > 0 aktif ürün", async () => {
    const [a, b, sifir, pasif] = await Promise.all([urun("K1"), urun("K2"), urun("K3"), urun("K4", "PASIF")]);
    await hareket({ productId: a.id, quantity: 50 });
    await hareket({ productId: b.id, quantity: 5 });
    await hareket({ productId: sifir.id, quantity: 3 });
    await hareket({ productId: sifir.id, type: "CIKIS", quantity: 3 });
    await hareket({ productId: pasif.id, quantity: 8 });
    await hareket({ productId: a.id, quantity: 1, createdAt: yerelGunAraligi("2026-01-05")!.baslangic });

    const gun = yerelGunMetni(bugun());
    const k = await stokKpileri(gun);
    expect(k.bugunGiris).toBe((await liste({ baslangic: gun, bitis: gun, yon: "GIRIS" })).toplam);
    expect(k.bugunCikis).toBe((await liste({ baslangic: gun, bitis: gun, yon: "CIKIS" })).toplam);
    expect(k.bugunGiris).toBe(4);
    expect(k.bugunCikis).toBe(1);
    expect(k.stoktaki).toBe(2);
    expect(k.toplamAdet).toBe(56);
    expect(k.kritik).toBe(2);
  });
});

describe("konsinyedekiMal", () => {
  it("pasif ürün ve negatif konum görünür, sıfır görünmez; konum ve ürün adına göre", async () => {
    const dB = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. B") });
    const dA = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. A") });
    const knsB = await prisma.stockLocation.create({ data: { code: "KNS-B", name: "Konsinye B", type: "KONSINYE", doctorId: dB.id } });
    const knsA = await prisma.stockLocation.create({ data: { code: "KNS-A", name: "Konsinye A", type: "KONSINYE", doctorId: dA.id } });
    const [x, y, z] = await Promise.all([urun("X"), urun("Y", "PASIF"), urun("Z")]);
    await hareket({ productId: y.id, locationId: knsB.id, quantity: 3 });
    await hareket({ productId: x.id, locationId: knsB.id, quantity: 2 });
    await hareket({ productId: z.id, locationId: knsA.id, type: "CIKIS", quantity: 1 });
    await hareket({ productId: x.id, locationId: knsA.id, quantity: 4 });
    await hareket({ productId: x.id, locationId: knsA.id, type: "CIKIS", quantity: 4 });

    expect(await konsinyedekiMal()).toEqual([
      { konum: "Konsinye A", urun: "Ürün Z", miktar: -1 },
      { konum: "Konsinye B", urun: "Ürün X", miktar: 2 },
      { konum: "Konsinye B", urun: "Ürün Y", miktar: 3 },
    ]);
  });
});
