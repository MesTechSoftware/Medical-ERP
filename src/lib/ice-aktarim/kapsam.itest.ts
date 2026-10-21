import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { TANIMLAR } from "@/lib/ice-aktarim";

// ADR-006 §5 — üç koruma testi. Kolon ve kısıt bilgisi veritabanından okunur (migration SQL'indeki ham
// kısıtlar dahil); yeni bir zorunlu kolon ya da tekillik kısıtı tanıma bağlanmadan eklenemez.

/** Tanım alanı → tablo kolonu (form alan adı kolondan farklıysa). */
const KOLON_ADI: Record<string, string> = { phone: "phoneNormalized", ownerSellerId: "ownerSellerId" };

describe("içe aktarım kapsama testleri (ADR-006 §5)", () => {
  for (const tanim of Object.values(TANIMLAR)) {
    describe(tanim!.tur, () => {
      it("şema kapsama: NOT NULL ve varsayılansız her kolon tanımda ya da 'sistem doldurur' listesinde", async () => {
        const kolonlar = await prisma.$queryRaw<{ kolon: string }[]>`
          SELECT column_name AS kolon FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = ${tanim!.tablo} AND is_nullable = 'NO' AND column_default IS NULL`;
        const tanimda = new Set([...tanim!.kolonlar.map((k) => KOLON_ADI[k.alan] ?? k.alan), ...tanim!.sistemDoldurur]);
        expect(kolonlar.map((k) => k.kolon).filter((k) => !tanimda.has(k))).toEqual([]);
      });

      it("küme kuralı kapsama: her UNIQUE, EXCLUDE ve çok kolonlu CHECK bir küme kuralına bağlı ya da açıkça erişilemez", async () => {
        const kisitlar = await prisma.$queryRaw<{ ad: string }[]>`
          SELECT i.relname AS ad FROM pg_index x JOIN pg_class i ON i.oid = x.indexrelid
          WHERE x.indrelid = ${`"${tanim!.tablo}"`}::regclass AND x.indisunique AND NOT x.indisprimary
          UNION
          SELECT c.conname AS ad FROM pg_constraint c
          WHERE c.conrelid = ${`"${tanim!.tablo}"`}::regclass
            AND (c.contype = 'x' OR (c.contype = 'c' AND cardinality(c.conkey) > 1))`;
        const bagli = new Set([...tanim!.kumeKurallari.map((k) => k.kisit), ...tanim!.importtanErisilemez]);
        expect(kisitlar.map((k) => k.ad).filter((k) => !bagli.has(k)).sort()).toEqual([]);
        // Bağlanan ad gerçekten var olmalı (yanlış yazılmış ad sessizce geçmesin).
        expect([...bagli].filter((b) => !kisitlar.some((k) => k.ad === b))).toEqual([]);
      });
    });
  }

  it("varsayılan yasağı: hesap sınıfının veritabanında varsayılanı yoktur ve şablonda zorunludur (X-8 §(1), X-16 §(8))", async () => {
    const [k] = await prisma.$queryRaw<{ varsayilan: string | null }[]>`
      SELECT column_default AS varsayilan FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Doctor' AND column_name = 'accountClass'`;
    expect(k.varsayilan).toBeNull();
    expect(TANIMLAR.CARI!.kolonlar.find((c) => c.alan === "accountClass")?.zorunlu).toBe(true);
  });
});
