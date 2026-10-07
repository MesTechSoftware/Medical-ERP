import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";

/**
 * C8 — anti-şema testi (FAZ1 §D.2). Şemada OLMAMASI gereken tablo ve kolonlar.
 *
 * Liste `docs/adr/ADR-001` ekindeki "Yasak adlar" tablosunun birebir karşılığıdır;
 * kaynak KARARLAR §4 "Kısıtlar"dır. Bir satır eklenirse önce ADR-001'e yazılır.
 *
 * Karşılaştırma `lower(...)` ile yapılır: Prisma camelCase adları tırnaklı üretir
 * ve büyük/küçük harf varyantı listeden kaçmamalıdır (ADR-001 §Sonuçlar).
 *
 * Kolon adıyla yakalanamayan ve yazılı kalan: bayi `Kullanici`'si yoktur (D-2) —
 * `Role` enum'unda bayi değeri bulunmadığı için ayrıca aranmaz.
 */

/** Hiçbir tabloda bulunmaması gereken kolonlar. */
const YASAK_KOLONLAR: Record<string, string> = {
  tenantId: "§D.2 — tek kiracı",
  lastLoginAt: "E-2 §(9)",
  institutionId: "A-9",
  discountRate: "X-5 — iskonto oranı türetilir",
  lotNumber: "K-10",
  serialNumber: "K-10",
  gtin: "K-10",
  expiryDate: "K-10",
  dataMatrix: "K-10 — karekod",
  utsClass: "K-10 §1.5-b",
  barcode: "B-3",
  fileUrl: "E-3",
  hasAttachment: "E-3",
  externalRef: "K-4 EK2",
  isExported: "K-4 EK2",
  externalInvoiceNo: "C-1",
  invoiceNo: "C-1 · GÇ-20",
  currency: "C-5",
  cost: "§4 — maliyet tutulmaz",
  unitCost: "§4 — maliyet tutulmaz",
  stockValue: "§4 — stok tutarı tutulmaz",
  isCleared: "X-1",
  warningShown: "X-4 §(6)",
};

/** Yalnız belirli tabloda yasak olan kolonlar (başka tabloda meşru karşılığı var). */
const YASAK_TABLO_KOLONLARI: [tablo: string, kolon: string, kaynak: string][] = [
  ["Product", "vatRate", "C-6 — oran OrderItem'da donar"],
  ["Product", "netListPrice", "X-10 §(5) — liste fiyatı varsayılan listenin satırı"],
  ["Product", "stock", "ADR-005 — stok hareketlerden türer"],
  ["PaymentMethod", "accountLabel", "C-2"],
];

/** Bulunmaması gereken tablolar. */
const YASAK_TABLOLAR: Record<string, string> = {
  Institution: "A-9 — Kurum tablosu",
  Permission: "D-2 — Yetki tablosu",
  ProductBarcode: "B-3",
  PaymentAllocation: "X-6",
  Dealer: "X-8",
  DealerPrice: "X-8",
  DealerShipment: "X-8",
  DealerShipmentItem: "X-8",
  DealerPayment: "X-8",
  LoginAttempt: "X-9",
};

async function kolonlar(): Promise<{ tablo: string; kolon: string }[]> {
  return prisma.$queryRaw`
    SELECT lower(table_name) AS tablo, lower(column_name) AS kolon
    FROM information_schema.columns
    WHERE table_schema = 'public'`;
}

async function tablolar(): Promise<string[]> {
  const satirlar = await prisma.$queryRaw<{ tablo: string }[]>`
    SELECT lower(table_name) AS tablo
    FROM information_schema.tables
    WHERE table_schema = 'public'`;
  return satirlar.map((s) => s.tablo);
}

describe("anti-şema (C8 — KARARLAR §4 Kısıtlar, ADR-001 ek)", () => {
  it("sorgu şemayı gerçekten görür (boş sonuçla yeşil kalmaz)", async () => {
    const k = await kolonlar();
    expect(k).toContainEqual({ tablo: "doctor", kolon: "accountclass" });
    expect(await tablolar()).toContain("ledgerentry");
  });

  it("yasak kolonlar hiçbir tabloda yoktur", async () => {
    const yasak = new Set(Object.keys(YASAK_KOLONLAR).map((k) => k.toLowerCase()));
    const bulunan = (await kolonlar())
      .filter((k) => yasak.has(k.kolon))
      .map((k) => `${k.tablo}.${k.kolon}`);
    expect(bulunan).toEqual([]);
  });

  it("tabloya özgü yasak kolonlar o tabloda yoktur", async () => {
    const k = await kolonlar();
    const bulunan = YASAK_TABLO_KOLONLARI.filter(([tablo, kolon]) =>
      k.some((x) => x.tablo === tablo.toLowerCase() && x.kolon === kolon.toLowerCase())
    ).map(([tablo, kolon]) => `${tablo}.${kolon}`);
    expect(bulunan).toEqual([]);
  });

  it("OrderItem'daki dondurulmuş KDV oranı yasağa takılmaz (C-6 — istenen kolon)", async () => {
    expect(await kolonlar()).toContainEqual({ tablo: "orderitem", kolon: "vatrate" });
  });

  it("yasak tablolar yoktur", async () => {
    const mevcut = new Set(await tablolar());
    const bulunan = Object.keys(YASAK_TABLOLAR).filter((t) => mevcut.has(t.toLowerCase()));
    expect(bulunan).toEqual([]);
  });

  it("bayi kullanıcı değildir: Role enum'unda bayi değeri yoktur (D-2, X-8)", async () => {
    const degerler = await prisma.$queryRaw<{ deger: string }[]>`
      SELECT e.enumlabel AS deger
      FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'Role'`;
    expect(degerler.map((d) => d.deger).sort()).toEqual(["OPERASYON", "SATICI", "YONETICI"]);
  });
});
