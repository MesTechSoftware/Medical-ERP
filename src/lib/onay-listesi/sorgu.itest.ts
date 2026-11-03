import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { istisnalar } from "@/lib/istisnalar";
import { onayKpileri, onayListesi, onayPaneli } from "@/lib/onay-listesi/sorgu";
import { BOS_SUZGEC, type OnaySuzgeci } from "@/lib/onay-listesi/suzgec";
import { referansVeri, yeniDoktorVerisi } from "../../../test/integration/referans";

// Onay ekranı sorguları — KABUL_KRITERLERI A-8-11, A-8-12 (spec Ü-25 §4).

const SAYFA = { skip: 0, take: 100 };
const SAAT = 3_600_000;
// 4 Kasım 12:00 İstanbul
const AN = new Date("2026-11-04T09:00:00Z");
const S = (ek: Partial<OnaySuzgeci>): OnaySuzgeci => ({ ...BOS_SUZGEC, ...ek });
let ref: Awaited<ReturnType<typeof referansVeri>>;
let yon: { id: string };
let ops: { id: string };
let no = 0;

beforeEach(async () => {
  ref = await referansVeri();
  no += 1;
  yon = await prisma.user.create({ data: { name: "Yönetici", email: `y${no}@medikal.local`, passwordHash: "x", role: "YONETICI" } });
  ops = await prisma.user.create({ data: { name: "Operasyon Işık", email: `o${no}@medikal.local`, passwordHash: "x", role: "OPERASYON" } });
});

async function siparis(o: { cari?: string; kalemler?: { miktar: number; bedelsiz?: boolean; urun?: string }[] } = {}) {
  no += 1;
  const d = await prisma.doctor.create({ data: yeniDoktorVerisi(o.cari ?? `Dr. ${no}`) });
  const urun = await prisma.product.create({ data: { name: `Stent ${no}`, code: `ST-${no}`, taxRateId: ref.kdv20.id } });
  return prisma.order.create({
    data: {
      documentNo: `SIP-ON-${no}`,
      doctorId: d.id,
      stage: "ONAYLI",
      status: "HAZIRLANIYOR",
      paymentTermDays: 30,
      items: {
        create: (o.kalemler ?? [{ miktar: 5 }]).map((k) => ({
          productId: k.urun ?? urun.id,
          quantity: k.miktar,
          listPrice: "10",
          unitPrice: k.bedelsiz ? "0" : "10",
          vatRate: "20",
          isFree: k.bedelsiz ?? false,
          freeReason: k.bedelsiz ? "PROMOSYON" : null,
          freeNote: null,
        })),
      },
    },
    include: { items: { orderBy: { id: "asc" } } },
  });
}

const blok = (o: {
  belge: string;
  tur?: string;
  kural?: "NEGATIF_STOK" | "BEDELSIZ_ONAYI";
  acildi: Date;
  karar?: { tur: "ONAY" | "RED"; an: Date; not?: string };
  acan?: string;
}) =>
  prisma.approvalBlock.create({
    data: {
      documentType: o.tur ?? "SIP",
      documentId: o.belge,
      ruleCode: o.kural ?? "NEGATIF_STOK",
      openedById: o.acan ?? ops.id,
      openReason: "acil vaka",
      openedAt: o.acildi,
      ...(o.karar ? { decision: o.karar.tur, decidedById: yon.id, decidedAt: o.karar.an, decisionNote: o.karar.not ?? "not" } : {}),
    },
  });

describe("kartlar ve süzgeç (A-8-11)", () => {
  it("24 saatten eski kart = eski süzgeç = dashboard istisnası; bekleyen en eski önce", async () => {
    const o = await siparis();
    const b25 = await blok({ belge: o.id, acildi: new Date(AN.getTime() - 25 * SAAT) });
    const b23 = await blok({ belge: o.id, acildi: new Date(AN.getTime() - 23 * SAAT) });
    await blok({ belge: o.id, acildi: new Date(AN.getTime() - 30 * SAAT), karar: { tur: "ONAY", an: new Date(AN.getTime() - 26 * SAAT) } });

    const k = await onayKpileri("2026-11-04", AN);
    const eski = await onayListesi(S({ eski: true }), SAYFA, AN);
    const dashboard = (await istisnalar("YONETICI", [], AN)).find((i) => i.kod === "eskiOnay")?.adet ?? 0;
    expect(k.eski).toBe(1);
    expect(eski.toplam).toBe(1);
    expect(dashboard).toBe(1);
    expect(eski.satirlar[0].id).toBe(b25.id);
    expect(k.bekleyen).toBe(2);
    expect(k.enEski).toEqual(b25.openedAt);
    expect((await onayListesi(BOS_SUZGEC, SAYFA, AN)).satirlar.map((r) => r.id)).toEqual([b25.id, b23.id]);
  });

  it("bugün onaylanan / reddedilen = karar gününün süzgeci; günler önce açılıp bugün karar verilen dahil, dün 23:59 hariç", async () => {
    const o = await siparis();
    const bugunGeceYarisi = new Date("2026-11-03T21:00:00Z"); // 4 Kasım 00:00 İstanbul
    const eskiAcilmis = await blok({ belge: o.id, acildi: new Date(AN.getTime() - 72 * SAAT), karar: { tur: "ONAY", an: bugunGeceYarisi } });
    await blok({ belge: o.id, acildi: new Date(AN.getTime() - 72 * SAAT), karar: { tur: "ONAY", an: new Date("2026-11-03T20:59:00Z") } });
    const red = await blok({ belge: o.id, acildi: new Date(AN.getTime() - 2 * SAAT), karar: { tur: "RED", an: new Date(AN.getTime() - SAAT), not: "stok yok" } });

    const k = await onayKpileri("2026-11-04", AN);
    const bugun = { baslangic: "2026-11-04", bitis: "2026-11-04" };
    const onaylar = await onayListesi(S({ durum: "ONAY", ...bugun }), SAYFA, AN);
    const redler = await onayListesi(S({ durum: "RED", ...bugun }), SAYFA, AN);
    expect(k.bugunOnay).toBe(1);
    expect(onaylar.satirlar.map((r) => r.id)).toEqual([eskiAcilmis.id]);
    expect(k.bugunRed).toBe(1);
    expect(redler.satirlar[0]).toMatchObject({ id: red.id, decision: "RED", decisionNote: "stok yok", kararVeren: "Yönetici" });
    // Tümü sekmesi açılış anı desc (Prisma'da olay anı coalesce sıralaması yok — spec §3.4).
    expect((await onayListesi(S({ durum: "tumu" }), SAYFA, AN)).satirlar[0].id).toBe(red.id);
  });

  it("kural, açan ve metin süzgeci (SIP belge no, Türkçe cari, KNS belge no); belgesi bulunmayan blok çizilir", async () => {
    const o = await siparis({ cari: "Dr. Işık Ilgaz" });
    const a = await blok({ belge: o.id, acildi: new Date(AN.getTime() - SAAT) });
    const b = await blok({ belge: o.id, kural: "BEDELSIZ_ONAYI", acildi: new Date(AN.getTime() - 2 * SAAT), acan: yon.id });
    const konsinye = await prisma.consignmentIssue.create({
      data: { documentNo: `KNS-ON-${no}`, doctorId: o.doctorId, fromLocationId: ref.depo.id, toLocationId: ref.depo.id, createdById: yon.id },
    });
    const k = await blok({ belge: konsinye.id, tur: "KNS", acildi: new Date(AN.getTime() - 3 * SAAT) });
    const yetim = await blok({ belge: "silinmis-belge", acildi: new Date(AN.getTime() - 4 * SAAT) });

    const idler = async (s: OnaySuzgeci) => (await onayListesi(s, SAYFA, AN)).satirlar.map((r) => r.id).sort();
    expect(await idler(S({ kural: "BEDELSIZ_ONAYI" }))).toEqual([b.id]);
    expect(await idler(S({ acan: yon.id }))).toEqual([b.id]);
    expect(await idler(S({ q: o.documentNo }))).toEqual([a.id, b.id].sort());
    expect(await idler(S({ q: "ışık" }))).toEqual([a.id, b.id, k.id].sort());
    expect(await idler(S({ q: konsinye.documentNo }))).toEqual([k.id]);

    const satirlar = (await onayListesi(BOS_SUZGEC, SAYFA, AN)).satirlar;
    expect(satirlar.find((r) => r.id === a.id)).toMatchObject({ belge: { no: o.documentNo, siparisId: o.id }, cari: "Dr. Işık Ilgaz", acan: "Operasyon Işık" });
    expect(satirlar.find((r) => r.id === k.id)).toMatchObject({ belge: { no: konsinye.documentNo, siparisId: null }, cari: "Dr. Işık Ilgaz" });
    expect(satirlar.find((r) => r.id === yetim.id)).toMatchObject({ belge: null, cari: null });
  });
});

describe("karar paneli (A-8-12)", () => {
  it("negatif stok: kalem başına kalan ve varsayılan depo stoğu; tamamen sevk edilmiş kalem yetiyor sayılır", async () => {
    const ikinci = await prisma.product.create({ data: { name: "Kılavuz", code: `KL-${no}`, taxRateId: ref.kdv20.id } });
    const o = await siparis({ kalemler: [{ miktar: 5 }, { miktar: 2, urun: ikinci.id }] });
    await prisma.stockMovement.create({ data: { productId: o.items[0].productId, locationId: ref.depo.id, type: "GIRIS", quantity: 2 } });
    // ikinci kalem tamamen sevk edilmiş
    await prisma.shipment.create({ data: { documentNo: `SVK-ON-${no}`, orderId: o.id, items: { create: [{ orderItemId: o.items[1].id, quantity: 2 }] } } });
    const b = await blok({ belge: o.id, acildi: new Date(AN.getTime() - SAAT) });

    const p = (await onayPaneli(b.id))!;
    expect(p.siparisDurumu).toBe("HAZIRLANIYOR");
    expect(p.negatifStok).toEqual([
      expect.objectContaining({ kalan: 5, depo: 2, yetmiyor: true }),
      expect.objectContaining({ kalan: 0, yetmiyor: false }),
    ]);
    expect(p.bedelsiz).toBeNull();
  });

  it("bedelsiz onay: bedelsiz satırlar sebebiyle; RED'li önceki blok önceki kararlarda", async () => {
    const o = await siparis({ kalemler: [{ miktar: 3 }, { miktar: 1, bedelsiz: true }] });
    const onceki = await blok({ belge: o.id, kural: "BEDELSIZ_ONAYI", acildi: new Date(AN.getTime() - 5 * SAAT), karar: { tur: "RED", an: new Date(AN.getTime() - 4 * SAAT), not: "kongre yok" } });
    const b = await blok({ belge: o.id, kural: "BEDELSIZ_ONAYI", acildi: new Date(AN.getTime() - SAAT) });

    const p = (await onayPaneli(b.id))!;
    expect(p.bedelsiz).toEqual([expect.objectContaining({ adet: 1, sebep: "PROMOSYON", not: null })]);
    expect(p.negatifStok).toBeNull();
    expect(p.oncekiler).toEqual([expect.objectContaining({ id: onceki.id, decision: "RED", decisionNote: "kongre yok", kararVeren: "Yönetici" })]);
    expect(p.blok.decision).toBeNull();
  });

  it("negatif stok ürün başına toplanır (sevkiyatın denetimi gibi): aynı ürünün iki kalemi 3 + 3, depo 5 → yetmiyor", async () => {
    const urun = await prisma.product.create({ data: { name: "Kateter", code: `KT-${no}`, taxRateId: ref.kdv20.id } });
    await prisma.stockMovement.create({ data: { productId: urun.id, locationId: ref.depo.id, type: "GIRIS", quantity: 5 } });
    const o = await siparis({ kalemler: [{ miktar: 3, urun: urun.id }, { miktar: 3, urun: urun.id, bedelsiz: true }] });
    const b = await blok({ belge: o.id, acildi: new Date(AN.getTime() - SAAT) });
    expect((await onayPaneli(b.id))!.negatifStok).toEqual([{ urun: "Kateter", kod: urun.code, kalan: 6, depo: 5, yetmiyor: true }]);
  });

  it("önceki kararlar yalnız karar verilmiş bloklardır", async () => {
    const o = await siparis();
    await blok({ belge: o.id, kural: "BEDELSIZ_ONAYI", acildi: new Date(AN.getTime() - 3 * SAAT) });
    const b = await blok({ belge: o.id, acildi: new Date(AN.getTime() - SAAT) });
    expect((await onayPaneli(b.id))!.oncekiler).toEqual([]);
  });

  it("bulunmayan blok → null", async () => {
    expect(await onayPaneli("yok-boyle-blok")).toBeNull();
  });
});
