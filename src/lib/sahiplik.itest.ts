import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { degistirDoktorSahibi } from "@/lib/sahiplik";
import { yeniDoktorVerisi } from "../../test/integration/referans";

// X-17 — sahipliğin tek yazma noktası (CM ilk sürümü) ve DB kısıtları.
const degistir = (ids: string[], sahip: string | null, yapanId: string, metin = "devir") =>
  prisma.$transaction((tx) => degistirDoktorSahibi(ids, sahip, { metin, yapanId }, tx));

describe("degistirDoktorSahibi (X-17)", () => {
  let yonetici = "";
  let ali = "";
  let veli = "";

  beforeEach(async () => {
    const kullanici = (name: string, email: string, role: "YONETICI" | "SATICI" | "OPERASYON", isActive = true) =>
      prisma.user.create({ data: { name, email, passwordHash: "x", role, isActive } });
    yonetici = (await kullanici("Yönetici", "y@m.local", "YONETICI")).id;
    ali = (await kullanici("Ali", "ali@m.local", "SATICI")).id;
    veli = (await kullanici("Veli", "veli@m.local", "SATICI")).id;
  });

  it("açılışta atama da iz satırıdır: eski sahip boş (X-17 §(3))", async () => {
    const d = await prisma.doctor.create({ data: yeniDoktorVerisi() });
    const sonuc = await degistir([d.id], ali, yonetici, "İlk kayıt");
    expect(sonuc).toEqual({ durum: "TAMAM", degisen: 1 });

    expect((await prisma.doctor.findUniqueOrThrow({ where: { id: d.id } })).ownerSellerId).toBe(ali);
    const [iz] = await prisma.doctorAssignment.findMany();
    expect(iz).toMatchObject({ fromSellerId: null, toSellerId: ali, changedById: yonetici, reason: "İlk kayıt" });
  });

  it("toplu devir: gerekçe bir kez, her doktora ayrı iz satırı (X-17 §(4))", async () => {
    const d1 = await prisma.doctor.create({ data: yeniDoktorVerisi("A") });
    const d2 = await prisma.doctor.create({ data: yeniDoktorVerisi("B") });
    await degistir([d1.id, d2.id], ali, yonetici);
    const sonuc = await degistir([d1.id, d2.id], veli, yonetici, "Bölge değişti");

    expect(sonuc).toEqual({ durum: "TAMAM", degisen: 2 });
    const izler = await prisma.doctorAssignment.findMany({ where: { reason: "Bölge değişti" } });
    expect(izler).toHaveLength(2);
    expect(izler.every((i) => i.fromSellerId === ali && i.toSellerId === veli)).toBe(true);
  });

  it("sahipsiz bırakmak da izlenir: yeni sahip boş (X-17 §(3)/(5))", async () => {
    const d = await prisma.doctor.create({ data: yeniDoktorVerisi() });
    await degistir([d.id], ali, yonetici);
    await degistir([d.id], null, yonetici, "Satıcı ayrıldı");

    expect((await prisma.doctor.findUniqueOrThrow({ where: { id: d.id } })).ownerSellerId).toBeNull();
    const son = await prisma.doctorAssignment.findFirstOrThrow({ where: { reason: "Satıcı ayrıldı" } });
    expect(son).toMatchObject({ fromSellerId: ali, toSellerId: null });
  });

  it("sahibi değişmeyen doktora iz yazılmaz", async () => {
    const d = await prisma.doctor.create({ data: yeniDoktorVerisi() });
    await degistir([d.id], ali, yonetici);
    expect(await degistir([d.id], ali, yonetici)).toEqual({ durum: "TAMAM", degisen: 0 });
    expect(await prisma.doctorAssignment.count()).toBe(1);
  });

  it("sahip daima aktif SATICI'dır (SAHIP_AKTIF_SATICI_DEGIL)", async () => {
    const d = await prisma.doctor.create({ data: yeniDoktorVerisi() });
    const pasif = await prisma.user.create({
      data: { name: "Pasif", email: "p@m.local", passwordHash: "x", role: "SATICI", isActive: false },
    });
    for (const hedef of [pasif.id, yonetici, "olmayan-id"]) {
      expect(await degistir([d.id], hedef, yonetici)).toEqual({
        durum: "HATA",
        kuralKodu: "SAHIP_AKTIF_SATICI_DEGIL",
      });
    }
    expect(await prisma.doctorAssignment.count()).toBe(0);
  });

  it("BAYI'nin sahibi olmaz (BAYI_SAHIP_ATANAMAZ); karışık toplu işlem bütünüyle reddedilir", async () => {
    const doktor = await prisma.doctor.create({ data: yeniDoktorVerisi("Doktor") });
    const bayi = await prisma.doctor.create({ data: { ...yeniDoktorVerisi("Bayi"), accountClass: "BAYI" } });
    expect(await degistir([doktor.id, bayi.id], ali, yonetici)).toEqual({
      durum: "HATA",
      kuralKodu: "BAYI_SAHIP_ATANAMAZ",
    });
    expect((await prisma.doctor.findUniqueOrThrow({ where: { id: doktor.id } })).ownerSellerId).toBeNull();
  });
});

describe("DB kısıtları — elle yazılan SQL (CM migration)", () => {
  it("BAYI satırına sahip yazmak DB'de reddedilir (CHECK — X-17 §(2))", async () => {
    const satici = await prisma.user.create({ data: { name: "S", email: "s@m.local", passwordHash: "x", role: "SATICI" } });
    const bayi = await prisma.doctor.create({ data: { ...yeniDoktorVerisi("Bayi"), accountClass: "BAYI" } });
    await expect(
      prisma.doctor.update({ where: { id: bayi.id }, data: { ownerSellerId: satici.id } })
    ).rejects.toThrow(/Doctor_bayi_sahipsiz_check/);
  });

  it("doktoru olan kullanıcı silinemez (sahip FK RESTRICT — X-17)", async () => {
    const satici = await prisma.user.create({ data: { name: "S", email: "s@m.local", passwordHash: "x", role: "SATICI" } });
    const d = await prisma.doctor.create({ data: yeniDoktorVerisi() });
    await degistir([d.id], satici.id, satici.id);
    await prisma.doctorAssignment.deleteMany(); // iz FK'si ayrı; yalnız sahip FK'sini sına
    await expect(prisma.user.delete({ where: { id: satici.id } })).rejects.toThrow();
  });

  it("doktor silinince sahiplik izi de gider (iz FK CASCADE — X-17 §(10))", async () => {
    const satici = await prisma.user.create({ data: { name: "S", email: "s@m.local", passwordHash: "x", role: "SATICI" } });
    const d = await prisma.doctor.create({ data: yeniDoktorVerisi() });
    await degistir([d.id], satici.id, satici.id);
    await degistir([d.id], null, satici.id);
    await prisma.doctor.delete({ where: { id: d.id } });
    expect(await prisma.doctorAssignment.count()).toBe(0);
  });
});
