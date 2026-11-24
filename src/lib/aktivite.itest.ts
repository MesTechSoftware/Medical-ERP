import { describe, expect, it } from "vitest";

import { aktiviteAkisi } from "@/lib/aktivite";
import { prisma } from "@/lib/db";
import { ISLEM_SINIFI, type AuditAction } from "@/lib/denetim/olaylar";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// Aktivite akışı (brief §3.6): son kayıtlar, en yeniden; rol süzgeci sunucuda, tek tablodan.

const DAKIKA = 60_000;

async function kurulum() {
  const ref = await referansVeri();
  const an = Date.now();
  const selin = await prisma.user.create({ data: { name: "Selin Aksoy", email: "selin@medikal.local", passwordHash: "x", role: "OPERASYON" } });
  const doktor = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. Gizli") });
  const urun = await prisma.product.create({ data: { name: "Eldiven", code: "ELD", taxRateId: ref.kdv20.id } });
  const siparis = await prisma.order.create({
    data: { documentNo: "SIP-2026-000042", doctorId: doktor.id, paymentTermDays: 30, stage: "ONAYLI", status: "BEKLIYOR" },
  });
  const kayit = (dk: number, action: string, entityType: string, entityId: string | null, afterData: unknown) =>
    prisma.auditLog.create({
      data: {
        actorId: selin.id,
        action,
        actionType: ISLEM_SINIFI[action as AuditAction].tur,
        module: ISLEM_SINIFI[action as AuditAction].modul,
        entityType,
        entityId,
        afterData: afterData === undefined ? null : typeof afterData === "string" ? afterData : JSON.stringify(afterData),
        createdAt: new Date(an - dk * DAKIKA),
      },
    });
  await kayit(5, "DOCTOR_CREATE", "Doctor", doktor.id, { fullName: "Dr. Gizli" });
  await kayit(4, "ORDER_CREATE", "Order", siparis.id, { documentNo: "SIP-2026-000042", doctorName: "Dr. Gizli" });
  await kayit(3, "ORDER_STATUS_CHANGE", "Order", siparis.id, { status: "HAZIRLANIYOR" });
  await kayit(2, "ORDER_STATUS_CHANGE", "Order", siparis.id, "{bozuk");
  await kayit(1, "STOCK_ENTRY", "Product", urun.id, { quantity: 50 });
  await kayit(0, "AUTH_LOGIN_SUCCESS", "Auth", null, undefined);
  return { doktor, urun, siparis };
}

describe("aktiviteAkisi — dashboard aktivite akışı", () => {
  it("yönetici: en yeniden, akış dışı olay yok; nesne belge no ya da ürün adı; kişi adı ve kimlik yok", async () => {
    const { doktor, urun, siparis } = await kurulum();
    const satirlar = await aktiviteAkisi("YONETICI", 15);
    expect(satirlar.map((s) => s.metin)).toEqual([
      "Selin Aksoy stok girişi yaptı · Eldiven",
      "Selin Aksoy sipariş durumunu değiştirdi · SIP-2026-000042",
      "Selin Aksoy siparişi hazırlığa aldı · SIP-2026-000042",
      "Selin Aksoy yeni sipariş oluşturdu · SIP-2026-000042",
      "Selin Aksoy yeni cari açtı",
    ]);
    const hepsi = satirlar.map((s) => s.metin).join("\n");
    for (const gizli of ["Dr. Gizli", "{", doktor.id, urun.id, siparis.id]) expect(hepsi).not.toContain(gizli);
    expect(satirlar[0].an.getTime()).toBeGreaterThan(satirlar[1].an.getTime());
  });

  it("devir satırı nesneyi gösterir: doktor → yeni sahip (sahipsizse 'Sahipsiz'); kimlik yazılmaz", async () => {
    const { doktor } = await kurulum();
    const satici = await prisma.user.create({ data: { name: "Ayşe Demir", email: "ayse@medikal.local", passwordHash: "x", role: "SATICI" } });
    const devir = (dk: number, sahip: string | null) =>
      prisma.auditLog.create({
        data: {
          action: "DOCTOR_TRANSFER",
          actionType: ISLEM_SINIFI.DOCTOR_TRANSFER.tur,
          module: ISLEM_SINIFI.DOCTOR_TRANSFER.modul,
          entityType: "Doctor",
          entityId: doktor.id,
          afterData: JSON.stringify({ ownerSellerId: sahip }),
          createdAt: new Date(Date.now() + dk * DAKIKA),
        },
      });
    await devir(2, satici.id);
    await devir(3, null);
    const metinler = (await aktiviteAkisi("YONETICI", 15)).map((s) => s.metin);
    expect(metinler.slice(0, 2)).toEqual(["Sistem doktor devretti · Dr. Gizli → Sahipsiz", "Sistem doktor devretti · Dr. Gizli → Ayşe Demir"]);
    expect(metinler.join("\n")).not.toContain(satici.id);
  });

  it("adet sınırı: istenen kadar satır", async () => {
    await kurulum();
    expect(await aktiviteAkisi("YONETICI", 2)).toHaveLength(2);
  });

  it("OPERASYON ve satıcı için akış boştur (denetim kaydı yöneticinin, D-2)", async () => {
    await kurulum();
    expect(await aktiviteAkisi("OPERASYON", 15)).toEqual([]);
    expect(await aktiviteAkisi("SATICI", 15)).toEqual([]);
  });
});
