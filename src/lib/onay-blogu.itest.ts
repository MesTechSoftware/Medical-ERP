import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { acikBlokVarMi, blokKontrolleriniCalistir, type BlokIhlali } from "@/lib/onay-blogu";

// `acikBlokVarMi()` / `blokKontrolleriniCalistir()` — KABUL_KRITERLERI A-8-1…A-8-5.

let yoneticiId = "";
let saticiId = "";
let operasyonId = "";

const negatif: BlokIhlali = { kuralKodu: "NEGATIF_STOK", parametreler: { urunId: "u1", once: 2, sonra: -6 } };
const blok = (documentId: string, decision?: "ONAY" | "RED", openedAt?: Date, ruleCode = "NEGATIF_STOK") =>
  prisma.approvalBlock.create({
    data: {
      documentType: "SIP",
      documentId,
      ruleCode,
      ...(openedAt ? { openedAt } : {}),
      openedById: saticiId,
      openReason: "acil",
      ...(decision ? { decision, decidedById: yoneticiId, decidedAt: new Date(), decisionNote: "not" } : {}),
    },
  });
const calistir = (yapan: { id: string; rol: "YONETICI" | "OPERASYON" | "SATICI" }, gerekce: string | null, ihlaller = [negatif]) =>
  prisma.$transaction((tx) => blokKontrolleriniCalistir(tx, { belgeTipi: "SIP", belgeId: "o1", ihlaller, yapan, gerekce }));

beforeEach(async () => {
  const kullanici = (email: string, role: "YONETICI" | "OPERASYON" | "SATICI") =>
    prisma.user.create({ data: { name: email, email, passwordHash: "x", role } });
  yoneticiId = (await kullanici("y@medikal.local", "YONETICI")).id;
  saticiId = (await kullanici("s@medikal.local", "SATICI")).id;
  operasyonId = (await kullanici("o@medikal.local", "OPERASYON")).id;
});

describe("acikBlokVarMi (A-8-1)", () => {
  it("blok yoksa false", async () => {
    expect(await acikBlokVarMi("SIP", "o1")).toBe(false);
  });

  it("kararı verilmemiş blok adımı durdurur", async () => {
    await blok("o1");
    expect(await acikBlokVarMi("SIP", "o1")).toBe(true);
  });

  it("RED kararlı blok adımı durdurur; ONAY'lı blok durdurmaz", async () => {
    await blok("o1", "RED");
    await blok("o2", "ONAY");
    expect(await acikBlokVarMi("SIP", "o1")).toBe(true);
    expect(await acikBlokVarMi("SIP", "o2")).toBe(false);
  });

  it("her kural için son blok belirler: RED'den sonra yeni blok ONAY alırsa adım açılır", async () => {
    await blok("o1", "RED", new Date("2026-10-01T09:00:00Z"));
    await blok("o1", undefined, new Date("2026-10-02T09:00:00Z"));
    expect(await acikBlokVarMi("SIP", "o1")).toBe(true); // yeniden karara gitti

    await prisma.approvalBlock.updateMany({ where: { decision: null }, data: { decision: "ONAY", decidedById: yoneticiId } });
    expect(await acikBlokVarMi("SIP", "o1")).toBe(false);
  });

  it("ONAY'dan sonra gelen RED adımı yeniden durdurur", async () => {
    await blok("o1", "ONAY", new Date("2026-10-01T09:00:00Z"));
    await blok("o1", "RED", new Date("2026-10-02T09:00:00Z"));
    expect(await acikBlokVarMi("SIP", "o1")).toBe(true);
  });

  it("kurallar ayrı değerlendirilir: bir kuralın ONAY'ı ötekinin açık bloğunu geçirmez", async () => {
    await blok("o1", "ONAY", new Date("2026-10-02T09:00:00Z"));
    await blok("o1", undefined, new Date("2026-10-01T09:00:00Z"), "KONTENJAN_ASIMI");
    expect(await acikBlokVarMi("SIP", "o1")).toBe(true);
  });

  it("başka belgenin ya da başka belge tipinin bloğu etkilemez", async () => {
    await blok("o2");
    await prisma.approvalBlock.create({
      data: { documentType: "SVK", documentId: "o1", ruleCode: "NEGATIF_STOK", openedById: saticiId, openReason: "x" },
    });
    expect(await acikBlokVarMi("SIP", "o1")).toBe(false);
  });

  it("aynı kural için önceden açık blok varsa yönetici ona karar vermez; belge onayda kalır", async () => {
    await blok("o1");
    const s = await calistir({ id: yoneticiId, rol: "YONETICI" }, "g");
    expect(s).toMatchObject({ durum: "BASARILI_UYARILI", onayaGonderildi: true });
    expect(await prisma.approvalBlock.count()).toBe(1);
    expect(await acikBlokVarMi("SIP", "o1")).toBe(true);
  });
});

describe("blokKontrolleriniCalistir — ihlal yok (A-8-2)", () => {
  it("BASARILI döner, blok yazmaz", async () => {
    expect(await calistir({ id: saticiId, rol: "SATICI" }, null, [])).toEqual({ durum: "BASARILI" });
    expect(await prisma.approvalBlock.count()).toBe(0);
  });
});

describe("blokKontrolleriniCalistir — gerekçe yok (A-8-3)", () => {
  it.each([null, "", "   "])("gerekçe %j → ONAY_GEREKLI, bütün ihlaller döner, blok yazılmaz", async (gerekce) => {
    const ikinci: BlokIhlali = { kuralKodu: "NEGATIF_STOK", parametreler: { urunId: "u2", once: 0, sonra: -1 } };
    const s = await calistir({ id: yoneticiId, rol: "YONETICI" }, gerekce, [negatif, ikinci]);
    expect(s).toEqual({ durum: "ONAY_GEREKLI", kademe: "YUMUSAK", ihlaller: [negatif, ikinci] });
    expect(await prisma.approvalBlock.count()).toBe(0);
  });
});

describe("blokKontrolleriniCalistir — yetkisiz kullanıcı (A-8-4)", () => {
  it.each([
    ["SATICI", () => saticiId],
    ["OPERASYON", () => operasyonId],
  ] as const)("%s gerekçe yazınca blok açılır ve onaya gönderilir", async (rol, id) => {
    const s = await calistir({ id: id(), rol }, "  doktor acil istedi ");
    expect(s).toEqual({ durum: "BASARILI_UYARILI", kademe: "YUMUSAK", ihlaller: [negatif], onayaGonderildi: true });

    const [b] = await prisma.approvalBlock.findMany();
    expect(b).toMatchObject({
      documentType: "SIP",
      documentId: "o1",
      ruleCode: "NEGATIF_STOK",
      openedById: id(),
      openReason: "doktor acil istedi",
      decision: null,
    });
    expect(await acikBlokVarMi("SIP", "o1")).toBe(true);
  });

  it("kural kodu başına tek blok; aynı belge ve kural için açık blok varsa ikincisi açılmaz", async () => {
    const ikinci: BlokIhlali = { kuralKodu: "NEGATIF_STOK", parametreler: { urunId: "u2", once: 0, sonra: -1 } };
    await calistir({ id: saticiId, rol: "SATICI" }, "g1", [negatif, ikinci]);
    await calistir({ id: saticiId, rol: "SATICI" }, "g2", [negatif]);
    expect(await prisma.approvalBlock.count()).toBe(1);
  });
});

describe("blokKontrolleriniCalistir — RED sonrası (A-8-4)", () => {
  it("RED'li kural için yeni gerekçe yeni blok açar ve belge yeniden onaya gider", async () => {
    await blok("o1", "RED", new Date("2026-10-01T09:00:00Z"));
    const s = await calistir({ id: saticiId, rol: "SATICI" }, "stok geldi");
    expect(s).toMatchObject({ durum: "BASARILI_UYARILI", onayaGonderildi: true });
    expect(await prisma.approvalBlock.count()).toBe(2);
    expect(await acikBlokVarMi("SIP", "o1")).toBe(true);
  });
});

describe("blokKontrolleriniCalistir — yönetici (A-8-5)", () => {
  it("blok yazılır ve aynı işlemde ONAY ile kapanır", async () => {
    const s = await calistir({ id: yoneticiId, rol: "YONETICI" }, "sayım bekleniyor");
    expect(s).toEqual({ durum: "BASARILI_UYARILI", kademe: "YUMUSAK", ihlaller: [negatif], onayaGonderildi: false });

    const [b] = await prisma.approvalBlock.findMany();
    expect(b).toMatchObject({
      openedById: yoneticiId,
      openReason: "sayım bekleniyor",
      decision: "ONAY",
      decidedById: yoneticiId,
      decisionNote: "sayım bekleniyor",
    });
    expect(b.decidedAt).toBeInstanceOf(Date);
    expect(await acikBlokVarMi("SIP", "o1")).toBe(false);
  });
});

describe("ISKONTO_TAVANI kuralı (A-10-4)", () => {
  const iskonto: BlokIhlali = { kuralKodu: "ISKONTO_TAVANI", parametreler: { urun: "Stent", oran: "25.00", tavan: 10 } };

  it("satıcı gerekçeyle gönderirse ISKONTO_TAVANI bloğu açılır ve belge onaya gider", async () => {
    const s = await calistir({ id: saticiId, rol: "SATICI" }, "Hacimli sipariş", [iskonto]);
    expect(s).toMatchObject({ durum: "BASARILI_UYARILI", onayaGonderildi: true });
    const bloklar = await prisma.approvalBlock.findMany();
    expect(bloklar.map((b) => b.ruleCode)).toEqual(["ISKONTO_TAVANI"]);
    expect(await acikBlokVarMi("SIP", "o1")).toBe(true);
  });

  it("gerekçe yoksa ONAY_GEREKLI döner, blok yazılmaz", async () => {
    const s = await calistir({ id: saticiId, rol: "SATICI" }, null, [iskonto]);
    expect(s.durum).toBe("ONAY_GEREKLI");
    expect(await prisma.approvalBlock.count()).toBe(0);
  });
});
