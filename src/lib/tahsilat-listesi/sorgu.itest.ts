import Decimal from "decimal.js";
import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { hesaplaDoktorBakiye } from "@/lib/doctor-cari";
import { tahsilatKpileri, tahsilatListesi, tahsilatPaneli } from "@/lib/tahsilat-listesi/sorgu";
import { BOS_SUZGEC, type TahsilatSuzgeci, type TahsilatTipi } from "@/lib/tahsilat-listesi/suzgec";
import { referansVeri, yeniDoktorVerisi } from "../../../test/integration/referans";

// Tahsilat ekranı sorguları — KABUL_KRITERLERI A-11-2, A-11-3 (spec Ü-26 §4).

const SAYFA = { skip: 0, take: 100 };
const S = (ek: Partial<TahsilatSuzgeci>): TahsilatSuzgeci => ({ ...BOS_SUZGEC, ...ek });
const ARALIK = { baslangic: "2026-11-01", bitis: "2026-11-04" };
let yontem: Record<TahsilatTipi, { id: string }>;
let kaydeden: { id: string };
let doktor: { id: string };
let no = 0;

beforeEach(async () => {
  await referansVeri();
  no += 1;
  const bul = (type: TahsilatTipi) => prisma.paymentMethod.findFirstOrThrow({ where: { type }, orderBy: { sortOrder: "asc" } });
  yontem = { NAKIT: await bul("NAKIT"), BANKA: await bul("BANKA"), POS: await bul("POS") };
  kaydeden = await prisma.user.create({ data: { name: "Operasyon Ayşe", email: `t${no}@medikal.local`, passwordHash: "x", role: "OPERASYON" } });
  doktor = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. Işık Tan") });
});

async function tahsilat(o: {
  tip: TahsilatTipi;
  tutar: string;
  an: string;
  komisyon?: string;
  oran?: string;
  iptal?: string;
  referans?: string;
  doktorId?: string;
}) {
  no += 1;
  return prisma.doctorPayment.create({
    data: {
      documentNo: `THS-2026-${String(no).padStart(6, "0")}`,
      doctorId: o.doktorId ?? doktor.id,
      amount: o.tutar,
      paymentMethodId: yontem[o.tip].id,
      commissionRate: o.oran ?? "0",
      commissionAmount: o.komisyon ?? "0",
      paidAt: new Date(o.an),
      referenceNo: o.referans ?? null,
      recordedBy: kaydeden.id,
      ...(o.iptal ? { status: "IPTAL" as const, cancelledAt: new Date(o.an), cancelledBy: kaydeden.id, cancelReason: o.iptal } : {}),
    },
  });
}

const tl = (d: Decimal) => d.toFixed(2);

describe("tahsilat kartları = süzgeç (A-11-2)", () => {
  beforeEach(async () => {
    await tahsilat({ tip: "NAKIT", tutar: "100", an: "2026-11-02T09:00:00Z" });
    await tahsilat({ tip: "BANKA", tutar: "200", an: "2026-11-03T09:00:00Z" });
    await tahsilat({ tip: "POS", tutar: "300", an: "2026-11-04T09:00:00Z", oran: "2.5", komisyon: "7.50" });
    await tahsilat({ tip: "NAKIT", tutar: "999", an: "2026-11-02T10:00:00Z", iptal: "Dekont hatalı" });
    // 31.10 23:30 İstanbul — aralık dışı
    await tahsilat({ tip: "BANKA", tutar: "50", an: "2026-10-31T20:30:00Z" });
  });

  it("toplam ve tip başına tutar/adet; iptal ve aralık dışı girmez", async () => {
    const k = await tahsilatKpileri(ARALIK);
    expect([tl(k.toplam.tutar), k.toplam.adet]).toEqual(["600.00", 3]);
    expect([tl(k.NAKIT.tutar), k.NAKIT.adet]).toEqual(["100.00", 1]);
    expect([tl(k.BANKA.tutar), k.BANKA.adet]).toEqual(["200.00", 1]);
    expect([tl(k.POS.tutar), k.POS.adet, tl(k.POS.komisyon)]).toEqual(["300.00", 1, "7.50"]);
  });

  it("kartın açtığı süzgecin toplam satırı ve satır sayısı kartla aynı", async () => {
    const k = await tahsilatKpileri(ARALIK);
    for (const tip of [null, "NAKIT", "BANKA", "POS"] as const) {
      const l = await tahsilatListesi(S({ ...ARALIK, tip }), SAYFA);
      const kart = tip ? k[tip] : k.toplam;
      expect(l.ozet && [tl(l.ozet.tutar), l.ozet.adet]).toEqual([tl(kart.tutar), kart.adet]);
      expect(l.toplam).toBe(kart.adet);
    }
  });

  it("iptal süzgeci yalnız iptal edileni verir, toplam satırı yok; tümü ikisini", async () => {
    const iptal = await tahsilatListesi(S({ ...ARALIK, durum: "IPTAL" }), SAYFA);
    expect(iptal.satirlar.map((s) => tl(s.amount))).toEqual(["999.00"]);
    expect(iptal.ozet).toBeNull();
    expect((await tahsilatListesi(S({ ...ARALIK, durum: "tumu" }), SAYFA)).toplam).toBe(4);
  });

  it("sıralama tahsilat anına göre yeniden eskiye", async () => {
    const l = await tahsilatListesi(S({}), SAYFA);
    expect(l.satirlar.map((s) => tl(s.amount))).toEqual(["300.00", "200.00", "100.00", "50.00"]);
    expect(l.satirlar[0]).toMatchObject({ doktor: "Dr. Işık Tan", tip: "POS", kaydeden: "Operasyon Ayşe", status: "AKTIF" });
  });
});

describe("tahsilat süzgeci — gün sınırı ve metin", () => {
  it("bitiş günü İstanbul gece yarısına kadardır", async () => {
    await tahsilat({ tip: "NAKIT", tutar: "10", an: "2026-11-04T20:30:00Z" }); // 04.11 23:30
    await tahsilat({ tip: "NAKIT", tutar: "20", an: "2026-11-04T21:30:00Z" }); // 05.11 00:30
    const l = await tahsilatListesi(S({ bitis: "2026-11-04" }), SAYFA);
    expect(l.satirlar.map((s) => tl(s.amount))).toEqual(["10.00"]);
    expect(tl((await tahsilatKpileri({ baslangic: "2026-11-01", bitis: "2026-11-04" })).toplam.tutar)).toBe("10.00");
  });

  it("belge no, referans ve cari adında arar (Türkçe I/ı)", async () => {
    const a = await tahsilat({ tip: "BANKA", tutar: "10", an: "2026-11-02T09:00:00Z", referans: "DEK-77" });
    const baska = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. Başka") });
    const b = await tahsilat({ tip: "BANKA", tutar: "20", an: "2026-11-02T09:00:00Z", doktorId: baska.id });
    const ara = async (q: string) => (await tahsilatListesi(S({ q }), SAYFA)).satirlar.map((s) => s.id);
    expect(await ara(b.documentNo)).toEqual([b.id]);
    expect(await ara("dek-77")).toEqual([a.id]);
    expect(await ara("IŞIK")).toEqual([a.id]);
  });
});

describe("tahsilat paneli (A-11-3)", () => {
  it("komisyon kayıttaki donmuş oran ve tutardır; bakiye tek kaynaktan", async () => {
    const p = await tahsilat({ tip: "POS", tutar: "5000", an: "2026-11-02T09:00:00Z", oran: "2.5", komisyon: "125.00" });
    await prisma.paymentMethod.update({ where: { id: yontem.POS.id }, data: { commissionRate: "4" } });
    const panel = (await tahsilatPaneli(p.id))!;
    expect([panel.commissionRate.toFixed(2), tl(panel.commissionAmount)]).toEqual(["2.50", "125.00"]);
    expect(panel.bakiye.bakiye.toFixed(2)).toBe((await hesaplaDoktorBakiye(doktor.id)).bakiye.toFixed(2));
    expect(panel.iptal).toBeNull();
    await prisma.paymentMethod.update({ where: { id: yontem.POS.id }, data: { commissionRate: "0" } });
  });

  it("iptal edilmişte iptal eden, zaman ve gerekçe; bulunmayan null", async () => {
    const p = await tahsilat({ tip: "NAKIT", tutar: "10", an: "2026-11-02T09:00:00Z", iptal: "Dekont hatalı" });
    expect((await tahsilatPaneli(p.id))!.iptal).toEqual({ eden: "Operasyon Ayşe", zaman: new Date("2026-11-02T09:00:00Z"), gerekce: "Dekont hatalı" });
    expect(await tahsilatPaneli("yok")).toBeNull();
  });
});
