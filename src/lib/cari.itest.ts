import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { cariAc, cariDuzelt, EKSIK_FATURA_BILGISI, type CariAcmaGirdisi } from "@/lib/cari";
import { eksikFaturaBilgisiUyarisi } from "@/lib/disa-aktarim";
import { IsHatasi } from "@/lib/hata";
import { referansVeri } from "../../test/integration/referans";

// A-13-1 · X-8-2 · X-10-3 — yöneticinin tek cari akışı: açma ve düzeltme; eksik fatura bilgisi.

let s: Awaited<ReturnType<typeof seed>>;
async function seed() {
  const ref = await referansVeri();
  const y = await prisma.user.create({ data: { name: "Y", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" } });
  const satici = await prisma.user.create({ data: { name: "S", email: "s@medikal.local", passwordHash: "x", role: "SATICI" } });
  const ozel = await prisma.priceList.create({ data: { code: "BAYI", name: "Bayi" } });
  return { ...ref, yoneticiId: y.id, satici, ozel };
}
const girdi = (p: Partial<CariAcmaGirdisi> = {}): CariAcmaGirdisi => ({
  accountClass: "DOKTOR",
  fullName: "Dr. Ayşe",
  clinic: "Klinik",
  region: "Kadıköy",
  phone: "0532 111 22 33",
  partyType: "TUZEL_KISI",
  ...p,
});
const ac = (p: Partial<CariAcmaGirdisi> = {}) => prisma.$transaction((tx) => cariAc(tx, girdi(p), s.yoneticiId));
const kodlar = async (p: Promise<unknown>) => {
  try {
    await p;
    return [];
  } catch (e) {
    if (e instanceof IsHatasi) return e.sonuc.bildirimler.map((b) => [b.kural_kodu, b.alan]);
    throw e;
  }
};

beforeEach(async () => {
  s = await seed();
});

describe("cari açma (X-8-2, A-13-1)", () => {
  it("hesap sınıfı seçilmeden açılmaz; DOKTOR'da klinik/bölge zorunlu, BAYI'de değil; bütün hatalar birlikte", async () => {
    expect(await kodlar(ac({ accountClass: undefined, fullName: "", phone: "12", taxId: "1234567891", email: "x@" }))).toEqual([
      ["ALAN_ZORUNLU", "accountClass"],
      ["ALAN_ZORUNLU", "fullName"],
      ["GECERSIZ_TELEFON", "phone"],
      ["VERGI_KIMLIGI_GECERSIZ", "taxId"],
      ["GECERSIZ_EPOSTA", "email"],
    ]);
    expect(await kodlar(ac({ clinic: "", region: "" }))).toEqual([
      ["ALAN_ZORUNLU", "clinic"],
      ["ALAN_ZORUNLU", "region"],
    ]);
    expect(await kodlar(ac({ accountClass: "BAYI", fullName: "Bayi A.Ş.", clinic: "", region: "" }))).toEqual([]);
    expect(await prisma.doctor.count()).toBe(1);
  });

  it("BAYI'ye sahip atanamaz; DOKTOR sahibi tek yazma noktasından atanır; liste ve fatura alanları yazılır", async () => {
    expect(await kodlar(ac({ accountClass: "BAYI", sorumluSaticiId: s.satici.id }))).toEqual([["BAYI_SAHIP_ATANAMAZ", "ownerSellerId"]]);
    const { id } = await ac({ sorumluSaticiId: s.satici.id, priceListId: s.ozel.id, taxId: "1234567890", taxOffice: "Kadıköy VD", paymentTermDays: "45", creditLimit: "10000" });
    const c = await prisma.doctor.findUniqueOrThrow({ where: { id } });
    expect([c.accountClass, c.ownerSellerId, c.priceListId, c.taxId, c.paymentTermDays, c.creditLimit?.toFixed(2), c.phoneNormalized]).toEqual([
      "DOKTOR", s.satici.id, s.ozel.id, "1234567890", 45, "10000.00", "+905321112233",
    ]);
    expect(await prisma.doctorAssignment.count({ where: { doctorId: id } })).toBe(1);
    expect(await kodlar(ac({ phone: "05321112233" }))).toEqual([["TELEFON_KAYITLI", "phone"]]);
  });
});

describe("cari düzeltme (A-13-1, X-10-3)", () => {
  it("alanlar güncellenir; değişen alan adları loglanır, vergi kimliğinin değeri log'a yazılmaz; liste ataması", async () => {
    const { id } = await ac();
    await prisma.$transaction((tx) =>
      cariDuzelt(tx, id, { ...girdi(), taxId: "10000000146", partyType: "GERCEK_KISI", priceListId: s.ozel.id }, s.yoneticiId)
    );
    const c = await prisma.doctor.findUniqueOrThrow({ where: { id } });
    expect([c.taxId, c.partyType, c.priceListId, c.accountClass]).toEqual(["10000000146", "GERCEK_KISI", s.ozel.id, "DOKTOR"]);
    const log = await prisma.auditLog.findFirstOrThrow({ where: { action: "DOCTOR_UPDATE", entityId: id } });
    const after = JSON.parse(String(log.afterData)) as Record<string, unknown>;
    expect(after.degisenAlanlar).toEqual(["priceListId", "partyType", "taxId"]);
    expect(JSON.stringify(log.afterData)).not.toContain("10000000146");
    expect(JSON.stringify(log.beforeData)).not.toMatch(/taxId/);

    // Değişiklik yoksa log yazılmaz.
    await prisma.$transaction((tx) =>
      cariDuzelt(tx, id, { ...girdi(), taxId: "10000000146", partyType: "GERCEK_KISI", priceListId: s.ozel.id }, s.yoneticiId)
    );
    expect(await prisma.auditLog.count({ where: { action: "DOCTOR_UPDATE", entityId: id } })).toBe(1);
  });
});

describe("eksik fatura bilgisi (A-13-2)", () => {
  it("süzgeç: VKN/TCKN, adres ya da il boş, tüzel kişide vergi dairesi boş; dışa aktarım uyarısı sayıyı verir", async () => {
    await ac({ phone: "05320000001" }); // eksik — kimlik yok
    await ac({ phone: "05320000002", taxId: "1234567890", invoiceAddress: "Adres", invoiceCity: "İstanbul" }); // eksik — VD yok
    await ac({ phone: "05320000003", taxId: "1234567890", taxOffice: "VD", invoiceAddress: "Adres", invoiceCity: "İstanbul" }); // tam
    await ac({ phone: "05320000004", partyType: "GERCEK_KISI", taxId: "10000000146", invoiceAddress: "Adres", invoiceCity: "İzmir" }); // tam
    expect(await prisma.doctor.count({ where: EKSIK_FATURA_BILGISI })).toBe(2);
    expect(await eksikFaturaBilgisiUyarisi({ kod: "DOKTOR_LISTESI" })).toMatchObject({
      kademe: "BILGI",
      kural_kodu: "EKSIK_FATURA_BILGISI",
      parametreler: { sayi: 2 },
    });
  });
});
