import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { degistirDoktorSahibi } from "@/lib/sahiplik";
import { stokGirisiYaz } from "@/lib/stok-giris";
import { gunAraligi, simdi, takvimYili } from "@/lib/zaman";
import { DEMO_ISARETI, demoGecmisUret, tutarlilikDenetle } from "../../prisma/demo-gecmis";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// Demo geçmiş seed'i (tasarım 2-7b): kayıtlar uygulamanın servislerinden yazılır, olay olay aynı Δ ile
// geçmişe kayar; sonda tutarlılık denetimi, başarısızsa hepsi geri alınır. Testler düşük yoğunlukla koşar.

/** Demo seed'inin karşılığı: yönetici (demo işareti), operasyon, iki satıcı, sahipli üç doktor, stoklu üç ürün. */
async function demoTabani() {
  const { liste, kdv20 } = await referansVeri();
  const yonetici = await prisma.user.create({ data: { name: "Yönetici", email: DEMO_ISARETI, passwordHash: "x", role: "YONETICI" } });
  await prisma.user.create({ data: { name: "Operasyon", email: "operasyon@medikal.local", passwordHash: "x", role: "OPERASYON" } });
  const saticilar: { id: string }[] = [];
  for (const h of ["a", "b"]) {
    saticilar.push(await prisma.user.create({ data: { name: `Satıcı ${h}`, email: `${h}@medikal.local`, passwordHash: "x", role: "SATICI" } }));
  }
  const doktorlar = [];
  for (let i = 0; i < 3; i++) {
    const d = await prisma.doctor.create({ data: yeniDoktorVerisi(`Dr. ${i}`) });
    await prisma.$transaction((tx) => degistirDoktorSahibi([d.id], saticilar[i % 2].id, { metin: "İlk atama", yapanId: yonetici.id }, tx));
    doktorlar.push(d);
  }
  for (const [i, fiyat] of ["120.00", "45.50", "300.00"].entries()) {
    const u = await prisma.product.create({ data: { name: `Ürün ${i}`, code: `U-${i}`, taxRateId: kdv20.id } });
    await prisma.priceListItem.create({ data: { priceListId: liste.id, productId: u.id, listPrice: fiyat } });
    await prisma.$transaction((tx) => stokGirisiYaz(tx, { urunId: u.id, miktar: 30, not: "Başlangıç stok girişi", yapanId: yonetici.id }));
  }
  return { yonetici, doktorlar };
}

const say = async (sql: string) => Number((await prisma.$queryRawUnsafe<{ n: bigint }[]>(sql))[0].n);

describe("demoGecmisUret — servislerden yazılır, geçmişe kayar, tutarlıdır", () => {
  it("belgeler geçmiş aralıkta; vade ile sevk günü farkı korunur; ana veri geçmişin öncesinde; ikinci koşu durur", async () => {
    const taban = await demoTabani();
    const bugunBasi = gunAraligi(simdi()).baslangic;
    const o = await demoGecmisUret({ ay: 1, tohum: 11, yogunluk: 0.7 });

    expect(o.siparis).toBeGreaterThan(5);
    expect(o.sevkiyat).toBeGreaterThan(3);
    for (const s of await prisma.order.findMany({ select: { orderDate: true, createdAt: true } })) {
      expect(s.orderDate >= o.baslangic && s.orderDate < bugunBasi).toBe(true);
      expect(s.createdAt < bugunBasi).toBe(true);
    }
    // Sevk günü sevk anının İstanbul günü; vade = sevk günü + vade gün sayısı (fark kaymaz).
    expect(
      await say(`SELECT count(*) AS n FROM "LedgerEntry" l JOIN "Shipment" s ON s."id" = l."shipmentId" JOIN "Order" o ON o."id" = s."orderId"
                 WHERE l."dueDate" - s."shippedOn" <> o."paymentTermDays"`)
    ).toBe(0);
    // Denetim kayıtları da geçmişte: bugünden sonra ya da bugün tarihli kayıt yok.
    expect(await prisma.auditLog.count({ where: { createdAt: { gte: bugunBasi } } })).toBe(0);
    // Ana veri (doktor, sahiplik izi, açılış stoku) geçmişin ilk gününden önce.
    const doktor = await prisma.doctor.findUniqueOrThrow({ where: { id: taban.doktorlar[0].id } });
    expect(doktor.createdAt < o.baslangic).toBe(true);
    expect(await prisma.doctorAssignment.count({ where: { changedAt: { gte: o.baslangic } } })).toBe(0);
    expect(await tutarlilikDenetle(prisma, simdi())).toEqual([]);

    await expect(demoGecmisUret({ ay: 1, tohum: 11 })).rejects.toThrow(/iki günden eski sevkiyat/);
  }, 120_000);

  it("kaydırılan belgenin yılı değişirse numara o yılın sayacından; cari harekette aynı numara", async () => {
    await demoTabani();
    const o = await demoGecmisUret({ ay: 11, tohum: 3, yogunluk: 0.12 });
    expect(o.yenidenNumaralanan).toBeGreaterThan(0);

    for (const s of await prisma.order.findMany({ select: { documentNo: true, orderDate: true } })) {
      expect(s.documentNo.split("-")[1]).toBe(String(takvimYili(s.orderDate)));
    }
    for (const s of await prisma.shipment.findMany({ select: { documentNo: true, shippedAt: true } })) {
      expect(s.documentNo.split("-")[1]).toBe(String(takvimYili(s.shippedAt!)));
    }
    expect(await say(`SELECT count(*) AS n FROM "LedgerEntry" l JOIN "Shipment" s ON s."id" = l."shipmentId" WHERE l."documentNo" <> s."documentNo"`)).toBe(0);
    // Önceki yılın sayacı o yılın belgeleriyle tutarlı: son değer = o yıldaki belge sayısı (sırayla alındı).
    const oncekiYil = takvimYili(o.baslangic);
    const [sayac] = await prisma.$queryRaw<{ lastValue: number }[]>`
      SELECT "lastValue" FROM "DocumentCounter" WHERE "prefix" = 'SVK' AND "year" = ${oncekiYil}`;
    expect(sayac.lastValue).toBe(await prisma.shipment.count({ where: { documentNo: { startsWith: `SVK-${oncekiYil}-` } } }));
    expect(await tutarlilikDenetle(prisma, simdi())).toEqual([]);
  }, 300_000);
});

describe("tutarlilikDenetle — bozulmayı yakalar", () => {
  it("sevk siparişten önce, gelecek tarihli kayıt ve bakiye uyuşmazlığı ihlal olarak döner", async () => {
    await demoTabani();
    await demoGecmisUret({ ay: 1, tohum: 5, yogunluk: 0.5 });
    expect(await tutarlilikDenetle(prisma, simdi())).toEqual([]);

    const sevk = await prisma.shipment.findFirstOrThrow({ include: { order: true } });
    await prisma.shipment.update({ where: { id: sevk.id }, data: { shippedAt: new Date(sevk.order.orderDate.getTime() - 3_600_000) } });
    const kayit = await prisma.auditLog.findFirstOrThrow();
    await prisma.auditLog.update({ where: { id: kayit.id }, data: { createdAt: new Date(Date.now() + 86_400_000) } });
    const hareket = await prisma.ledgerEntry.findFirstOrThrow({ where: { type: "SEVKIYAT" } });
    await prisma.ledgerEntry.update({ where: { id: hareket.id }, data: { amount: "1.00" } });

    const ihlaller = await tutarlilikDenetle(prisma, simdi());
    expect(ihlaller.some((i) => i.startsWith("sevk siparişten önce"))).toBe(true);
    expect(ihlaller.some((i) => i.startsWith("AuditLog.createdAt"))).toBe(true);
    expect(ihlaller.some((i) => i.includes("cari bakiye"))).toBe(true);
  }, 120_000);
});

describe("demoGecmisUret — korumalar ve geri alma", () => {
  it("demo işareti yoksa durur ve hiçbir şey yazmaz", async () => {
    await referansVeri();
    await expect(demoGecmisUret({ ay: 1, tohum: 1 })).rejects.toThrow(/Demo işareti/);
    expect(await prisma.order.count()).toBe(0);
  });

  it("tutarlılık denetimi başarısızsa bütün geçmiş geri alınır", async () => {
    await demoTabani();
    // Seed'in dokunmadığı, yarına tarihli bir sevk günü: sonda "gelecek tarihli" ihlali.
    const doktor = await prisma.doctor.findFirstOrThrow();
    const s = await prisma.order.create({ data: { documentNo: "SIP-T-1", doctorId: doktor.id, paymentTermDays: 30, stage: "ONAYLI", status: "KARGOLANDI" } });
    const yarin = new Date(Date.UTC(2099, 0, 1));
    await prisma.shipment.create({ data: { documentNo: "SVK-T-1", orderId: s.id, status: "KARGOLANDI", shippedAt: simdi(), shippedOn: yarin } });

    await expect(demoGecmisUret({ ay: 1, tohum: 2, yogunluk: 0.5 })).rejects.toThrow(/Shipment\.shippedOn: 1 gelecek tarihli/);
    expect(await prisma.order.count()).toBe(1);
    expect(await prisma.ledgerEntry.count()).toBe(0);
    expect(await prisma.doctorPayment.count()).toBe(0);
  }, 120_000);
});
