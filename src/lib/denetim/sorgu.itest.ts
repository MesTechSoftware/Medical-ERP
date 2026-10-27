import { beforeEach, describe, expect, it } from "vitest";

import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { denetimKaydi, denetimListesi } from "@/lib/denetim/sorgu";
import { BOS_SUZGEC, SISTEM, type Imlec } from "@/lib/denetim/suzgec";
import { referansVeri } from "../../../test/integration/referans";

// X-18-6 liste (imleçli sayfalama, süzgeçler) · X-18-7 detay (fark, bütünlük).

let yonetici: string;
beforeEach(async () => {
  yonetici = (await prisma.user.create({ data: { name: "Ayşe Yönetici", email: "ayse@m.local", passwordHash: "x", role: "YONETICI" } })).id;
});

const giris = (e: string) =>
  prisma.$transaction((tx) => createAuditLog({ action: AUDIT_ACTIONS.AUTH_LOGIN_FAILURE, entityType: "Auth", entityId: e }, tx));

describe("denetimListesi — imleçli sayfalama (X-18-6)", () => {
  it("ileri ve geri gezintide satır tekrarlanmaz, atlanmaz; aynı transaction'daki satırlar dahil", async () => {
    for (let t = 0; t < 3; t++) {
      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < 5; i++) {
          await createAuditLog({ action: AUDIT_ACTIONS.AUTH_LOGIN_FAILURE, entityType: "Auth", entityId: `t${t}-${i}@m.local` }, tx);
        }
      });
    }
    for (let i = 0; i < 4; i++) await giris(`tek${i}@m.local`);
    const hepsi = (await prisma.auditLog.findMany({ orderBy: { seq: "desc" }, select: { seq: true } })).map((k) => k.seq);
    expect(hepsi).toHaveLength(19);

    const sayfalar: number[][] = [];
    let imlec: Imlec = null;
    for (;;) {
      const s = await denetimListesi(BOS_SUZGEC, imlec, 4);
      if (sayfalar.length === 0) expect(s.dahaYeni).toBeNull();
      sayfalar.push(s.satirlar.map((x) => x.seq));
      if (s.dahaEski === null) break;
      imlec = { yon: "once", seq: s.dahaEski };
    }
    expect(sayfalar.flat()).toEqual(hepsi);
    expect(sayfalar.map((s) => s.length)).toEqual([4, 4, 4, 4, 3]);

    // Son sayfadan geri: "Daha yeni" bağlantıları aynı sayfaları ters sırayla verir.
    const geri: number[][] = [];
    let ilk = sayfalar.at(-1)![0];
    for (;;) {
      const s = await denetimListesi(BOS_SUZGEC, { yon: "sonra", seq: ilk }, 4);
      geri.push(s.satirlar.map((x) => x.seq));
      expect(s.dahaEski).not.toBeNull();
      if (s.dahaYeni === null) break;
      ilk = s.dahaYeni;
    }
    expect(geri).toEqual(sayfalar.slice(0, -1).reverse());
  });

  it("satırlar zamana göre sıralanır; aynı milisaniyedeki satırları sıra numarası ayırır, sayfa sınırında tekrar ya da atlama yok", async () => {
    const yaz = (createdAt: Date, entityId: string) =>
      prisma.auditLog.create({ data: { action: "AUTH_LOGIN_FAILURE", actionType: "OTURUM", module: "KULLANICI", entityType: "Auth", entityId, createdAt } });
    await giris("simdi@m.local"); // en küçük sıra numarası, en yeni zaman
    for (let i = 0; i < 5; i++) await yaz(new Date("2026-10-20T10:00:00.000Z"), `ayni-${i}@m.local`);
    await yaz(new Date("2026-01-01T00:00:00.000Z"), "eski@m.local"); // en büyük sıra numarası, en eski zaman

    const sayfalar: string[][] = [];
    let imlec: Imlec = null;
    for (;;) {
      const s = await denetimListesi(BOS_SUZGEC, imlec, 2);
      sayfalar.push(s.satirlar.map((x) => x.entityId!));
      if (s.dahaEski === null) break;
      imlec = { yon: "once", seq: s.dahaEski };
    }
    expect(sayfalar.flat()).toEqual(["simdi@m.local", "ayni-4@m.local", "ayni-3@m.local", "ayni-2@m.local", "ayni-1@m.local", "ayni-0@m.local", "eski@m.local"]);

    const geri: string[][] = [];
    let yeni = (await prisma.auditLog.findFirstOrThrow({ where: { entityId: "eski@m.local" } })).seq;
    for (;;) {
      const s = await denetimListesi(BOS_SUZGEC, { yon: "sonra", seq: yeni }, 2);
      geri.push(s.satirlar.map((x) => x.entityId!));
      if (s.dahaYeni === null) break;
      yeni = s.dahaYeni;
    }
    // "Daha yeni" en eskiden yukarı çıkar; her sayfa yine en yeni üstte.
    expect(geri).toEqual([
      ["ayni-1@m.local", "ayni-0@m.local"],
      ["ayni-3@m.local", "ayni-2@m.local"],
      ["simdi@m.local", "ayni-4@m.local"],
    ]);
  });

  it("satır kısa özet, aktör adı ve o anki rolüyle gelir", async () => {
    const { kdv20 } = await referansVeri();
    const urun = await prisma.product.create({ data: { name: "Eldiven", code: "ELD", taxRateId: kdv20.id } });
    await prisma.$transaction((tx) =>
      createAuditLog({ actorId: yonetici, action: AUDIT_ACTIONS.STOCK_ENTRY, entityType: "Product", entityId: urun.id, after: { quantity: 40 } }, tx)
    );
    const [satir] = (await denetimListesi(BOS_SUZGEC, null)).satirlar;
    expect(satir).toMatchObject({
      action: "STOCK_ENTRY",
      actionType: "EKLEME",
      module: "STOK",
      aktor: "Ayşe Yönetici",
      actorRole: "YONETICI",
      ozet: "Stok girişi yaptı · Eldiven",
    });
  });
});

describe("denetimListesi — süzgeçler (X-18-6)", () => {
  beforeEach(async () => {
    await prisma.$transaction((tx) =>
      createAuditLog(
        { actorId: yonetici, action: AUDIT_ACTIONS.DUE_DATE_CHANGE, entityType: "LedgerEntry", entityId: "h1", before: { dueDate: "a" }, after: { dueDate: "b" } },
        tx
      )
    );
    await prisma.$transaction((tx) =>
      createAuditLog({ actorId: yonetici, action: AUDIT_ACTIONS.STOCK_ENTRY, entityType: "Product", entityId: "u1", after: { quantity: 1 } }, tx)
    );
    await giris("kim@m.local");
  });

  const say = async (s: Partial<typeof BOS_SUZGEC>) => (await denetimListesi({ ...BOS_SUZGEC, ...s }, null)).satirlar.length;

  it("kullanıcı, sistem, modül, tür ve olay tek tek ve birlikte", async () => {
    expect(await say({})).toBe(3);
    expect(await say({ kullanici: yonetici })).toBe(2);
    expect(await say({ kullanici: SISTEM })).toBe(1);
    expect(await say({ modul: "STOK" })).toBe(1);
    expect(await say({ tur: "GUNCELLEME" })).toBe(1);
    expect(await say({ olay: "AUTH_LOGIN_FAILURE" })).toBe(1);
    expect(await say({ kullanici: yonetici, modul: "FINANS" })).toBe(1);
    expect(await say({ kullanici: SISTEM, modul: "FINANS" })).toBe(0);
  });

  it("tarih aralığı İstanbul günüdür (E-1)", async () => {
    const yaz = (createdAt: Date) =>
      prisma.auditLog.create({ data: { action: "PRODUCT_UPDATE", actionType: "GUNCELLEME", module: "URUN_FIYAT", entityType: "Product", createdAt } });
    await yaz(new Date("2026-10-26T21:30:00Z")); // 27 Ekim 00:30 İstanbul
    await yaz(new Date("2026-10-26T20:30:00Z")); // 26 Ekim 23:30 İstanbul
    expect(await say({ baslangic: "2026-10-27", bitis: "2026-10-27", modul: "URUN_FIYAT" })).toBe(1);
    expect(await say({ baslangic: "2026-10-26", bitis: "2026-10-26", modul: "URUN_FIYAT" })).toBe(1);
    expect(await say({ bitis: "2026-10-27", modul: "URUN_FIYAT" })).toBe(2);
  });
});

describe("denetimKaydi — detay (X-18-7)", () => {
  it("aktör, rol, gerekçe, alan bazlı fark ve doğrulanmış bütünlük", async () => {
    await prisma.$transaction((tx) =>
      createAuditLog(
        {
          actorId: yonetici,
          action: AUDIT_ACTIONS.DUE_DATE_CHANGE,
          entityType: "LedgerEntry",
          entityId: "h1",
          before: { dueDate: new Date("2026-11-01T00:00:00Z") },
          after: { dueDate: new Date("2026-11-15T00:00:00Z") },
          gerekce: "Müşteri isteği",
        },
        tx
      )
    );
    const { id } = await prisma.auditLog.findFirstOrThrow();
    const d = await denetimKaydi(id);
    expect(d).toMatchObject({
      kayit: { id, reason: "Müşteri isteği", actorRole: "YONETICI" },
      aktor: { name: "Ayşe Yönetici", email: "ayse@m.local" },
      farklar: [{ alan: "dueDate", eski: "2026-11-01T00:00:00.000Z", yeni: "2026-11-15T00:00:00.000Z" }],
      modulOncesi: false,
      butunluk: "DOGRULANDI",
    });
    expect(d?.muhur?.chainIndex).toBe(1);
  });

  it("kurcalanan kayıt uyuşmuyor; bilinmeyen kayıt yok", async () => {
    await giris("a@m.local");
    const { id } = await prisma.auditLog.findFirstOrThrow();
    await prisma.$transaction([
      prisma.$executeRawUnsafe("SET LOCAL session_replication_role = replica"),
      prisma.$executeRawUnsafe('UPDATE "AuditLog" SET "entityId" = $1 WHERE "id" = $2', "b@m.local", id),
    ]);
    expect((await denetimKaydi(id))?.butunluk).toBe("ICERIK_UYUSMUYOR");
    expect(await denetimKaydi("olmayan")).toBeNull();
  });

  it("modül öncesi kayıtta fark önceki ve sonraki hâlden çıkarılır", async () => {
    const eski = await prisma.auditLog.create({
      data: {
        action: "PRODUCT_UPDATE",
        actionType: "GUNCELLEME",
        module: "URUN_FIYAT",
        entityType: "Product",
        beforeData: JSON.stringify({ name: "Eldiven" }),
        afterData: JSON.stringify({ name: "Eldiven M" }),
      },
    });
    expect(await denetimKaydi(eski.id)).toMatchObject({ modulOncesi: true, farklar: [{ alan: "name", eski: "Eldiven", yeni: "Eldiven M" }] });
  });
});
