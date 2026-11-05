import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { kalemMiktarlari } from "@/lib/siparis";
import { siparisListesi } from "@/lib/siparis-listesi/sorgu";
import { BOS_SUZGEC as BOS_SIPARIS, TUM_SIPARISLER } from "@/lib/siparis-listesi/suzgec";
import { firmaSecenekleri, kargoBekleyenler, kargoKpileri, kismiSecimi, sevkiyatListesi } from "@/lib/kargo-listesi/sorgu";
import { BOS_SUZGEC, type KargoSuzgeci } from "@/lib/kargo-listesi/suzgec";
import { referansVeri, yeniDoktorVerisi } from "../../../test/integration/referans";

// Kargo ekranı sorguları — KABUL_KRITERLERI D-3-2 (spec Ü-24 §4).

const SAYFA = { skip: 0, take: 100 };
let ref: Awaited<ReturnType<typeof referansVeri>>;
let no = 0;

beforeEach(async () => {
  ref = await referansVeri();
});

const S = (ek: Partial<KargoSuzgeci>): KargoSuzgeci => ({ ...BOS_SUZGEC, ...ek });

async function siparis(o: { status?: "HAZIRLANIYOR" | "KARGOLANDI" | "BEKLIYOR"; cari?: string; adetler?: number[] } = {}) {
  no += 1;
  const urun = await prisma.product.create({ data: { name: `Ürün ${no}`, code: `U-${no}`, taxRateId: ref.kdv20.id } });
  const d = await prisma.doctor.create({ data: yeniDoktorVerisi(o.cari ?? `Dr. ${no}`) });
  return prisma.order.create({
    data: {
      documentNo: `SIP-KL-${no}`,
      doctorId: d.id,
      stage: "ONAYLI",
      status: o.status ?? "HAZIRLANIYOR",
      paymentTermDays: 30,
      orderDate: new Date(Date.UTC(2026, 10, 1, 9, no)),
      items: { create: (o.adetler ?? [3]).map((q) => ({ productId: urun.id, quantity: q, listPrice: "10", unitPrice: "10", vatRate: "20" })) },
    },
    include: { items: { orderBy: { id: "asc" } } },
  });
}

async function sevkiyat(o: { orderId: string; itemId: string; adet: number; shippedAt: Date; carrierId?: string; takip?: string; durum?: "KARGOLANDI" | "TESLIM_EDILDI" }) {
  no += 1;
  return prisma.shipment.create({
    data: {
      documentNo: `SVK-KL-${no}`,
      orderId: o.orderId,
      carrierId: o.carrierId,
      trackingNumber: o.takip,
      shippedAt: o.shippedAt,
      shippedOn: o.shippedAt,
      status: o.durum ?? "KARGOLANDI",
      items: { create: [{ orderItemId: o.itemId, quantity: o.adet }] },
    },
  });
}

describe("kargo bekleyenler ve KPI", () => {
  it("kalan kalemMiktarlari'ndan; tamamen sevk edilmiş kalem sayılmaz; en eski önce; onay bloklu işaretlenir", async () => {
    const a = await siparis({ adetler: [3, 2] });
    const b = await siparis({ adetler: [4] });
    await siparis({ status: "BEKLIYOR" });
    await sevkiyat({ orderId: a.id, itemId: a.items[0].id, adet: 3, shippedAt: new Date("2026-11-02T09:00:00Z") });
    await sevkiyat({ orderId: b.id, itemId: b.items[0].id, adet: 1, shippedAt: new Date("2026-11-02T09:00:00Z") });
    const yon = await prisma.user.create({ data: { name: "Y", email: `y${no}@medikal.local`, passwordHash: "x", role: "YONETICI" } });
    await prisma.approvalBlock.create({ data: { documentType: "SIP", documentId: b.id, ruleCode: "NEGATIF_STOK", openedById: yon.id, openReason: "x" } });

    const liste = await kargoBekleyenler();
    expect(liste.map((r) => r.documentNo)).toEqual([a.documentNo, b.documentNo]);
    const ra = liste[0];
    expect(ra).toMatchObject({ kalanKalem: 1, kalanAdet: 2, adet: 5, onay: undefined });
    expect(ra.kalemler.map((k) => k.kalan)).toEqual(
      a.items.map((k, i) => kalemMiktarlari({ quantity: k.quantity, shipmentItems: i === 0 ? [{ quantity: 3 }] : [], returnItems: [] }).kalan)
    );
    expect(liste[1].onay).toBe("BEKLIYOR");

    const k = await kargoKpileri("2026-11-02", liste);
    expect(k).toMatchObject({ bekleyen: 2, bekleyenAdet: 5, onayBekleyen: 1 });
  });

  it("D-3-2: bugün kargolanan = bugünün süzgeci (İstanbul gece yarısı kenarı); teslim bekleyen = siparişler durum=KARGOLANDI", async () => {
    const o = await siparis({ adetler: [5] });
    // 3 Kasım 00:00 İstanbul = 2 Kasım 21:00 UTC
    await sevkiyat({ orderId: o.id, itemId: o.items[0].id, adet: 1, shippedAt: new Date("2026-11-02T21:00:00Z") });
    await sevkiyat({ orderId: o.id, itemId: o.items[0].id, adet: 1, shippedAt: new Date("2026-11-02T20:59:00Z") });
    await siparis({ status: "KARGOLANDI" });

    const k = await kargoKpileri("2026-11-03", await kargoBekleyenler());
    const bugun = await sevkiyatListesi(S({ baslangic: "2026-11-03", bitis: "2026-11-03" }), SAYFA);
    expect(k.bugunKargolanan).toBe(1);
    expect(k.bugunKargolanan).toBe(bugun.toplam);
    expect(k.teslimBekleyen).toBe((await siparisListesi({ ...BOS_SIPARIS, durum: "KARGOLANDI" }, SAYFA, TUM_SIPARISLER)).toplam);
  });

  it("kismiSecimi yalnız kargo bekleyeni döner", async () => {
    const a = await siparis();
    const k = await siparis({ status: "KARGOLANDI" });
    const liste = await kargoBekleyenler();
    expect(kismiSecimi(liste, a.id)?.id).toBe(a.id);
    expect(kismiSecimi(liste, k.id)).toBeNull();
    expect(kismiSecimi(liste, null)).toBeNull();
  });
});

describe("sevkiyat listesi süzgeçleri", () => {
  it("firma / firmasız / durum / metin (takip, SVK, cari — Türkçe); sıralama gönderi desc; takip linki şablondan", async () => {
    const firma = await prisma.carrier.create({ data: { name: "Kargo X", trackingUrlTemplate: "https://x.test/{takip_no}" } });
    await prisma.carrier.create({ data: { name: "Pasif Kargo", isActive: false } });
    const o = await siparis({ cari: "Dr. Işık Ilgaz", adetler: [5] });
    const s1 = await sevkiyat({ orderId: o.id, itemId: o.items[0].id, adet: 2, shippedAt: new Date("2026-11-01T09:00:00Z"), carrierId: firma.id, takip: "TR777" });
    const s2 = await sevkiyat({ orderId: o.id, itemId: o.items[0].id, adet: 1, shippedAt: new Date("2026-11-02T09:00:00Z"), durum: "TESLIM_EDILDI" });

    const idler = async (s: KargoSuzgeci) => (await sevkiyatListesi(s, SAYFA)).satirlar.map((r) => r.id);
    expect(await idler(BOS_SUZGEC)).toEqual([s2.id, s1.id]);
    expect(await idler(S({ firma: firma.id }))).toEqual([s1.id]);
    expect(await idler(S({ firma: "yok" }))).toEqual([s2.id]);
    expect(await idler(S({ durum: "TESLIM_EDILDI" }))).toEqual([s2.id]);
    expect(await idler(S({ q: "tr777" }))).toEqual([s1.id]);
    expect(await idler(S({ q: s2.documentNo }))).toEqual([s2.id]);
    expect(await idler(S({ q: "ışık" }))).toEqual([s2.id, s1.id]);

    const [r2, r1] = (await sevkiyatListesi(BOS_SUZGEC, SAYFA)).satirlar;
    expect(r1).toMatchObject({ firma: "Kargo X", takipNo: "TR777", takipLinki: "https://x.test/TR777", adet: 2, cari: "Dr. Işık Ilgaz", durum: "KARGOLANDI" });
    expect(r1.siparis).toEqual({ id: o.id, documentNo: o.documentNo });
    expect(r2).toMatchObject({ firma: null, takipLinki: null, durum: "TESLIM_EDILDI" });

    expect((await firmaSecenekleri()).map((f) => [f.name, f.isActive])).toEqual(
      expect.arrayContaining([["Kargo X", true], ["Pasif Kargo", false]])
    );
  });
});
