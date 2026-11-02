import { beforeEach, describe, expect, it } from "vitest";

import type { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { kullaniciKpileri, kullaniciListesi, kullaniciPaneli } from "@/lib/kullanici-listesi/sorgu";
import { BOS_SUZGEC } from "@/lib/kullanici-listesi/suzgec";
import { referansVeri, yeniDoktorVerisi } from "../../../test/integration/referans";

// Kullanıcılar ekranı sorguları — KABUL_KRITERLERI X-17-6, D-2-3 (spec Ü-22 §4).

const SAYFA = { skip: 0, take: 100 };
const SAAT = 3_600_000;
const SIMDI = new Date("2026-11-02T12:00:00Z");
let sira = 0;

async function kullanici(name: string, role: Role, ek: { isActive?: boolean; mustChangePassword?: boolean } = {}) {
  sira += 1;
  return prisma.user.create({ data: { name, email: `k${sira}@medikal.local`, passwordHash: "x", role, ...ek } });
}
const cari = (ownerSellerId: string | null, status: "AKTIF" | "PASIF" = "AKTIF") =>
  prisma.doctor.create({ data: { ...yeniDoktorVerisi(), ownerSellerId, status } });
const oturum = (userId: string, lastSeenAt: Date, ek: { createdAt?: Date; revokedAt?: Date } = {}) =>
  prisma.session.create({ data: { userId, tokenHash: `t${(sira += 1)}`, createdAt: ek.createdAt ?? lastSeenAt, lastSeenAt, revokedAt: ek.revokedAt } });

beforeEach(async () => {
  await referansVeri();
});

describe("portföysüz aktif satıcı (X-17-6)", () => {
  it("portföy aktif carilerdir; yalnız pasif carili aktif satıcı portföysüz, pasif satıcı sayılmaz; kart = süzgeç", async () => {
    const dolu = await kullanici("Dolu", "SATICI");
    const yalnizPasif = await kullanici("Yalnız pasif", "SATICI");
    await kullanici("Boş", "SATICI");
    const pasifSatici = await kullanici("Pasif satıcı", "SATICI", { isActive: false });
    await kullanici("Yönetici", "YONETICI");
    await cari(dolu.id);
    await cari(dolu.id, "PASIF");
    await cari(yalnizPasif.id, "PASIF");
    await cari(pasifSatici.id);

    const liste = await kullaniciListesi({ ...BOS_SUZGEC, portfoy: "yok" }, "YONETICI", SAYFA);
    expect(liste.satirlar.map((u) => u.name).sort()).toEqual(["Boş", "Yalnız pasif"]);
    expect((await kullaniciKpileri("YONETICI")).portfoysuz).toBe(liste.toplam);

    const tum = await kullaniciListesi(BOS_SUZGEC, "YONETICI", SAYFA);
    const portfoy = Object.fromEntries(tum.satirlar.map((u) => [u.name, u.portfoy]));
    expect(portfoy).toMatchObject({ Dolu: 1, "Yalnız pasif": 0, Boş: 0, "Pasif satıcı": 1, Yönetici: null });
  });
});

describe("KPI ve süzgeç tutarlılığı", () => {
  it("aktif kullanıcı, aktif satıcı ve ilk girişi bekleyen kartları süzgeç sayılarına eşittir", async () => {
    await kullanici("A", "YONETICI");
    await kullanici("B", "OPERASYON", { mustChangePassword: true });
    await kullanici("C", "SATICI", { mustChangePassword: true });
    await kullanici("D", "SATICI", { isActive: false, mustChangePassword: true });

    const k = await kullaniciKpileri("YONETICI");
    const say = async (s: Partial<typeof BOS_SUZGEC>) => (await kullaniciListesi({ ...BOS_SUZGEC, ...s }, "YONETICI", SAYFA)).toplam;
    expect(k.aktifKullanici).toBe(await say({ durum: "aktif" }));
    expect(k.aktifSatici).toBe(await say({ durum: "aktif", rol: "SATICI" }));
    expect(k.ilkGirisBekleyen).toBe(await say({ durum: "aktif", parola: "gecici" }));
    expect(k.ilkGirisBekleyen).toBe(2);
    expect((await kullaniciListesi({ ...BOS_SUZGEC, durum: "pasif" }, "YONETICI", SAYFA)).satirlar.map((u) => u.name)).toEqual(["D"]);
  });

  it("sıralama rol sonra ad; geçici parola işareti", async () => {
    await kullanici("Zeki", "SATICI", { mustChangePassword: true });
    await kullanici("Ali", "SATICI");
    await kullanici("Yön", "YONETICI");
    const { satirlar } = await kullaniciListesi(BOS_SUZGEC, "YONETICI", SAYFA);
    expect(satirlar.map((u) => u.name)).toEqual(["Yön", "Ali", "Zeki"]);
    expect(satirlar.find((u) => u.name === "Zeki")!.geciciParola).toBe(true);
  });
});

describe("son etkinlik", () => {
  it("oturumların en büyük lastSeenAt'i (iptal edilmiş dahil); hiç oturum yoksa null", async () => {
    const a = await kullanici("A", "SATICI");
    await kullanici("Hiç", "SATICI");
    await oturum(a.id, new Date(SIMDI.getTime() - 5 * SAAT));
    await oturum(a.id, new Date(SIMDI.getTime() - 1 * SAAT), { revokedAt: SIMDI });
    const { satirlar } = await kullaniciListesi(BOS_SUZGEC, "YONETICI", SAYFA);
    expect(satirlar.find((u) => u.name === "A")!.sonEtkinlik).toEqual(new Date(SIMDI.getTime() - SAAT));
    expect(satirlar.find((u) => u.name === "Hiç")!.sonEtkinlik).toBeNull();
  });
});

describe("OPERASYON kapsamı (D-2-3)", () => {
  it("liste ve KPI yalnız satıcılardan; yönetici/operasyon paneli açılmaz; satıcı panelinde prim ve son işlemler yok", async () => {
    const y = await kullanici("Yönetici", "YONETICI");
    const o = await kullanici("Operasyon", "OPERASYON");
    const s = await kullanici("Satıcı", "SATICI");
    await prisma.user.update({ where: { id: s.id }, data: { commissionRate: "7.50" } });

    const liste = await kullaniciListesi(BOS_SUZGEC, "OPERASYON", SAYFA);
    expect(liste.satirlar.map((u) => u.name)).toEqual(["Satıcı"]);
    const k = await kullaniciKpileri("OPERASYON");
    expect(k.aktifKullanici).toBe(1);
    expect(k.aktifSatici).toBe(1);
    // OPERASYON'un adreste yazdığı rol süzgeci zaten çözülmez; sorgu kapsamı yine uygular.
    expect((await kullaniciListesi({ ...BOS_SUZGEC, rol: "YONETICI" }, "OPERASYON", SAYFA)).toplam).toBe(0);

    expect(await kullaniciPaneli(y.id, "OPERASYON", SIMDI)).toBeNull();
    expect(await kullaniciPaneli(o.id, "OPERASYON", SIMDI)).toBeNull();
    const p = await kullaniciPaneli(s.id, "OPERASYON", SIMDI);
    expect(p!.prim).toBeNull();
    expect(p!.islemler).toBeNull();

    const py = await kullaniciPaneli(s.id, "YONETICI", SIMDI);
    expect(py!.prim).toEqual({ oran: "7.50" });
    expect(py!.islemler).toEqual([]);
    // Özel oranı olmayan satıcıda yönetici "varsayılan" görür; yönetici kaydında prim yoktur.
    const varsayilan = await kullanici("Varsayılan oranlı", "SATICI");
    expect((await kullaniciPaneli(varsayilan.id, "YONETICI", SIMDI))!.prim).toEqual({ oran: null });
    expect((await kullaniciPaneli(y.id, "YONETICI", SIMDI))!.prim).toBeNull();
  });
});

describe("yan panel", () => {
  it("açık oturum: iptal ve süresi dolmuş hariç; portföy ilk 10 aktif cari; son 5 sipariş", async () => {
    const s = await kullanici("Satıcı", "SATICI");
    await oturum(s.id, new Date(SIMDI.getTime() - SAAT)); // açık
    await oturum(s.id, new Date(SIMDI.getTime() - SAAT), { revokedAt: SIMDI }); // iptal
    await oturum(s.id, new Date(SIMDI.getTime() - 5 * SAAT)); // hareketsizlik süresi doldu
    await oturum(s.id, new Date(SIMDI.getTime() - SAAT), { createdAt: new Date(SIMDI.getTime() - 13 * SAAT) }); // mutlak süre doldu
    for (let i = 0; i < 12; i++) await cari(s.id);
    await cari(s.id, "PASIF");
    const d = await prisma.doctor.findFirstOrThrow({ where: { ownerSellerId: s.id, status: "AKTIF" } });
    const siparis = (documentNo: string, stage: "TEKLIF" | "ONAYLI") =>
      prisma.order.create({ data: { documentNo, doctorId: d.id, sellerId: s.id, stage, paymentTermDays: 30 } });
    await siparis("SIP-1", "ONAYLI");
    await siparis("TKL-1", "TEKLIF");

    const p = await kullaniciPaneli(s.id, "YONETICI", SIMDI);
    expect(p!.acikOturum).toBe(1);
    expect(p!.cariler).toHaveLength(10);
    expect(p!.kullanici.portfoy).toBe(12);
    expect(p!.siparisler.map((x) => [x.documentNo, x.stage]).sort()).toEqual([
      ["SIP-1", "ONAYLI"],
      ["TKL-1", "TEKLIF"],
    ]);
  });

  it("bulunamayan kimlik null", async () => {
    expect(await kullaniciPaneli("yok", "YONETICI", SIMDI)).toBeNull();
  });
});
