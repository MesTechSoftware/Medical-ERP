import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { degistirDoktorSahibi, portfoyuDevret, siparisSahibiniKilitle } from "@/lib/sahiplik";
import { yeniDoktorVerisi } from "../../test/integration/referans";

// X-17 — sahipliğin tek yazma noktası ve DB kısıtları. KABUL_KRITERLERI X-17-1, X-17-2, X-17-4.
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

  it("denetim kaydı her değişen doktor için aynı transaction'da yazılır (X-17-1)", async () => {
    const d1 = await prisma.doctor.create({ data: yeniDoktorVerisi("A") });
    const d2 = await prisma.doctor.create({ data: yeniDoktorVerisi("B") });
    await degistir([d1.id], ali, yonetici);
    await degistir([d1.id, d2.id], veli, yonetici, "Bölge değişti");

    const loglar = await prisma.auditLog.findMany({
      where: { action: "DOCTOR_TRANSFER", afterData: { contains: "Bölge değişti" } },
      orderBy: { entityId: "asc" },
    });
    expect(loglar.map((l) => l.entityId).sort()).toEqual([d1.id, d2.id].sort());
    const d1Log = loglar.find((l) => l.entityId === d1.id)!;
    expect(d1Log.actorId).toBe(yonetici);
    expect(JSON.parse(d1Log.beforeData!)).toEqual({ ownerSellerId: ali });
    expect(JSON.parse(d1Log.afterData!)).toEqual({ ownerSellerId: veli, reason: "Bölge değişti" });
  });

  it("transaction geri alınırsa ne sahip ne iz ne denetim kaydı kalır (X-17-1)", async () => {
    const d = await prisma.doctor.create({ data: yeniDoktorVerisi() });
    await expect(
      prisma.$transaction(async (tx) => {
        await degistirDoktorSahibi([d.id], ali, { metin: "geri alınacak", yapanId: yonetici }, tx);
        throw new Error("sonraki adım başarısız");
      })
    ).rejects.toThrow("sonraki adım başarısız");

    expect((await prisma.doctor.findUniqueOrThrow({ where: { id: d.id } })).ownerSellerId).toBeNull();
    expect(await prisma.doctorAssignment.count()).toBe(0);
    expect(await prisma.auditLog.count({ where: { action: "DOCTOR_TRANSFER" } })).toBe(0);
  });
});

describe("doktor satırı kilidi — devir ve sipariş (X-17-2)", () => {
  let yonetici = "";
  let ali = "";
  let veli = "";
  let doktorId = "";
  const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));

  beforeEach(async () => {
    const kullanici = (email: string, role: "YONETICI" | "SATICI") =>
      prisma.user.create({ data: { name: email, email, passwordHash: "x", role } });
    yonetici = (await kullanici("y@m.local", "YONETICI")).id;
    ali = (await kullanici("ali@m.local", "SATICI")).id;
    veli = (await kullanici("veli@m.local", "SATICI")).id;
    doktorId = (await prisma.doctor.create({ data: yeniDoktorVerisi() })).id;
    await degistir([doktorId], ali, yonetici);
  });

  it("sipariş sahibi kilitli okur: sahibi olana TAMAM, olmayana SAHIP_DEGISTI", async () => {
    expect(await prisma.$transaction((tx) => siparisSahibiniKilitle(tx, doktorId, ali))).toEqual({ durum: "TAMAM" });
    expect(await prisma.$transaction((tx) => siparisSahibiniKilitle(tx, doktorId, veli))).toEqual({
      durum: "HATA",
      kuralKodu: "SAHIP_DEGISTI",
    });
  });

  it("devir önce kilidi alırsa sipariş bekler ve SAHIP_DEGISTI alır", async () => {
    let devirBitti = false;
    const devir = prisma.$transaction(async (tx) => {
      await degistirDoktorSahibi([doktorId], veli, { metin: "devir", yapanId: yonetici }, tx);
      await bekle(300);
      devirBitti = true;
    });
    await bekle(100);
    const siparis = prisma.$transaction(async (tx) => {
      const sonuc = await siparisSahibiniKilitle(tx, doktorId, ali);
      return { sonuc, devirBittiMi: devirBitti };
    });

    const [, s] = await Promise.all([devir, siparis]);
    expect(s.devirBittiMi).toBe(true); // kilit beklendi
    expect(s.sonuc).toEqual({ durum: "HATA", kuralKodu: "SAHIP_DEGISTI" });
  });

  it("sipariş önce kilidi alırsa devir bekler; sipariş eski sahibe yazılır", async () => {
    let siparisBitti = false;
    const siparis = prisma.$transaction(async (tx) => {
      const sonuc = await siparisSahibiniKilitle(tx, doktorId, ali);
      await bekle(300);
      siparisBitti = true;
      return sonuc;
    });
    await bekle(100);
    const devir = prisma.$transaction(async (tx) => {
      await degistirDoktorSahibi([doktorId], veli, { metin: "devir", yapanId: yonetici }, tx);
      return siparisBitti;
    });

    const [s, devirSiparistenSonra] = await Promise.all([siparis, devir]);
    expect(s).toEqual({ durum: "TAMAM" });
    expect(devirSiparistenSonra).toBe(true);
    expect((await prisma.doctor.findUniqueOrThrow({ where: { id: doktorId } })).ownerSellerId).toBe(veli);
  });

  it("eşzamanlı iki devirde ikincisi sahibi kilit altında okur; iz zinciri kopmaz", async () => {
    const birinci = prisma.$transaction(async (tx) => {
      await degistirDoktorSahibi([doktorId], veli, { metin: "birinci", yapanId: yonetici }, tx);
      await bekle(300);
    });
    await bekle(100);
    const ikinci = prisma.$transaction((tx) =>
      degistirDoktorSahibi([doktorId], null, { metin: "ikinci", yapanId: yonetici }, tx)
    );
    await Promise.all([birinci, ikinci]);

    const iz = await prisma.doctorAssignment.findFirstOrThrow({ where: { reason: "ikinci" } });
    expect(iz).toMatchObject({ fromSellerId: veli, toSellerId: null }); // bayat okumada ali olurdu
  });
});

describe("portfoyuDevret — pasifleştirmede portföy (X-17-4)", () => {
  let yonetici = "";
  let ali = "";
  let veli = "";

  beforeEach(async () => {
    const kullanici = (email: string, role: "YONETICI" | "SATICI") =>
      prisma.user.create({ data: { name: email, email, passwordHash: "x", role } });
    yonetici = (await kullanici("y@m.local", "YONETICI")).id;
    ali = (await kullanici("ali@m.local", "SATICI")).id;
    veli = (await kullanici("veli@m.local", "SATICI")).id;
  });

  const portfoy = async (sahip: string, adet: number) => {
    const idler = [];
    for (let i = 0; i < adet; i++) idler.push((await prisma.doctor.create({ data: yeniDoktorVerisi(`${sahip}-${i}`) })).id);
    await degistir(idler, sahip, yonetici, "İlk kayıt");
    return idler;
  };
  const sahipler = async (idler: string[]) =>
    (await prisma.doctor.findMany({ where: { id: { in: idler } }, select: { ownerSellerId: true } })).map(
      (d) => d.ownerSellerId
    );

  it("satıcının bütün doktorları tek satıcıya geçer; başkasının portföyü değişmez; gerekçe her iz satırında", async () => {
    const aliler = await portfoy(ali, 3);
    const veliler = await portfoy(veli, 1);
    const sonuc = await prisma.$transaction((tx) =>
      portfoyuDevret(tx, ali, veli, { metin: "Ali ayrıldı", yapanId: yonetici })
    );

    expect(sonuc).toEqual({ durum: "TAMAM", degisen: 3 });
    expect(await sahipler(aliler)).toEqual([veli, veli, veli]);
    expect(await sahipler(veliler)).toEqual([veli]);
    expect(await prisma.doctorAssignment.count({ where: { reason: "Ali ayrıldı", fromSellerId: ali } })).toBe(3);
  });

  it("sahipsiz bırakmak tek adımdır; başka satıcının portföyü sahipsiz kalmaz", async () => {
    const aliler = await portfoy(ali, 2);
    const veliler = await portfoy(veli, 1);
    await prisma.$transaction((tx) => portfoyuDevret(tx, ali, null, { metin: "Ali ayrıldı", yapanId: yonetici }));
    expect(await sahipler(aliler)).toEqual([null, null]);
    expect(await sahipler(veliler)).toEqual([veli]);
    expect(await prisma.doctorAssignment.count({ where: { reason: "Ali ayrıldı", toSellerId: null } })).toBe(2);
  });

  it("hedef aktif satıcı değilse hiçbir doktor değişmez", async () => {
    const aliler = await portfoy(ali, 2);
    const sonuc = await prisma.$transaction((tx) =>
      portfoyuDevret(tx, ali, yonetici, { metin: "yanlış hedef", yapanId: yonetici })
    );
    expect(sonuc).toEqual({ durum: "HATA", kuralKodu: "SAHIP_AKTIF_SATICI_DEGIL" });
    expect(await sahipler(aliler)).toEqual([ali, ali]);
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
