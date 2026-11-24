import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { ISLEM_SINIFI, type AuditAction } from "@/lib/denetim/olaylar";

// X-18-1 — denetim kaydı değişmezdir; kaynak taraması (ADR-011 §2/§11, ADR-012 §4). Uygulama, betik
// ve seed dosyaları taranır; testler ve Prisma'nın ürettiği istemci hariçtir.

const KOK = join(__dirname, "..", "..", "..");
const MIGRATION = join(KOK, "prisma", "migrations", "20261027160000_denetim_kaydi_modulu", "migration.sql");

function kaynaklar(dizin: string): string[] {
  return readdirSync(dizin).flatMap((ad) => {
    const yol = join(dizin, ad);
    if (statSync(yol).isDirectory()) return ad === "generated" || ad === "node_modules" ? [] : kaynaklar(yol);
    return /\.(ts|tsx)$/.test(ad) && !/\.(test|itest|spec)\.ts$/.test(ad) ? [yol] : [];
  });
}

const DOSYALAR = ["src", "scripts", "prisma"].flatMap((d) => kaynaklar(join(KOK, d))).map((yol) => relative(KOK, yol));
const gecen = (desen: RegExp) => DOSYALAR.filter((yol) => desen.test(readFileSync(join(KOK, yol), "utf8"))).sort();

describe("değişmezlik — kaynak taraması (X-18-1)", () => {
  it("denetim kaydını güncelleyen ya da silen, mührü yazan Prisma çağrısı yok", () => {
    expect(gecen(/auditLog\.(update|updateMany|delete|deleteMany|upsert)\s*\(/)).toEqual([]);
    expect(gecen(/auditLogSeal\.(create|createMany|update|updateMany|delete|deleteMany|upsert)\s*\(/)).toEqual([]);
  });

  it("denetim kaydına ham UPDATE/DELETE yalnız demo geçmiş üreticisinde (bakım yolu)", () => {
    expect(gecen(/UPDATE\s+"AuditLog(Seal)?"|DELETE\s+FROM\s+"AuditLog(Seal)?"/)).toEqual([join("prisma", "demo-gecmis.ts")]);
  });

  it("bakım ayarı (session_replication_role) uygulamada geçmez; yalnız seed'lerde", () => {
    expect(gecen(/session_replication_role/)).toEqual([join("prisma", "demo-gecmis.ts"), join("prisma", "seed-demo.ts")]);
  });

  it("zincir kilidi uygulamada alınmaz; yalnız migration'daki tetikleyicidedir (ADR-012 §3)", () => {
    expect(gecen(/pg_advisory/)).toEqual([]);
    expect(readFileSync(MIGRATION, "utf8")).toMatch(/pg_advisory_xact_lock/);
  });
});

// Migration'dan sonra eklenen olaylar eski satırları doldurmaz (yeni olayın sınıfı yazımda `islemSinifi()`'ndan gelir).
const SONRADAN_EKLENEN: readonly string[] = ["PRODUCT_DELETE"];
const SINIF = Object.entries(ISLEM_SINIFI).filter(([olay]) => !SONRADAN_EKLENEN.includes(olay));

describe("sınıf tablosu — migration ile aynı (X-18-3)", () => {
  const sql = readFileSync(MIGRATION, "utf8");
  const blok = (ad: string) => sql.slice(sql.indexOf(`-- ${ad}:başla`), sql.indexOf(`-- ${ad}:bitir`));
  const eslemeler = (metin: string) => Object.fromEntries([...metin.matchAll(/WHEN '([A-Z_]+)' THEN '([A-Z_]+)'/g)].map((m) => [m[1], m[2]]));

  it("modül eşlemesi birebir aynıdır", () => {
    const beklenen = Object.fromEntries(SINIF.map(([olay, s]) => [olay, s.modul]));
    expect(eslemeler(blok("modül"))).toEqual(beklenen);
  });

  it("tür eşlemesi birebir aynıdır; fiyat satırı önceki değere göre seçilir", () => {
    const tek = SINIF.filter(([olay]) => olay !== "PRICE_LIST_ITEM_SET");
    expect(eslemeler(blok("tür"))).toEqual(Object.fromEntries(tek.map(([olay, s]) => [olay, s.tur])));
    expect(blok("tür")).toContain(`WHEN 'PRICE_LIST_ITEM_SET' THEN (CASE WHEN "beforeData" IS NULL THEN 'EKLEME' ELSE 'GUNCELLEME' END)`);
    expect(ISLEM_SINIFI["PRICE_LIST_ITEM_SET" satisfies AuditAction].tur).toBe("GUNCELLEME");
  });
});
