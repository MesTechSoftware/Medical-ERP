import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

// Tek çağrı noktası koruması (KARARLAR §1.3 (9), FAZ1 §B.6): bir iş kuralının
// formülü yalnız kendi dosyasında yazılır. Kaynak taranır; test dosyaları ve
// Prisma'nın ürettiği istemci hariçtir.

const KOK = join(__dirname, "..");

function kaynaklar(dizin: string): string[] {
  return readdirSync(dizin).flatMap((ad) => {
    const yol = join(dizin, ad);
    if (statSync(yol).isDirectory()) return ad === "generated" ? [] : kaynaklar(yol);
    return /\.(ts|tsx)$/.test(ad) && !/\.(test|itest)\.ts$/.test(ad) ? [yol] : [];
  });
}

function ihlaller(desen: RegExp, izinli: string): string[] {
  return kaynaklar(KOK)
    .map((yol) => relative(KOK, yol))
    .filter((yol) => yol !== izinli && desen.test(readFileSync(join(KOK, yol), "utf8")));
}

describe("tek çağrı noktası — cari bakiye (K-2-4)", () => {
  it("LedgerEntry toplamı yalnız doctor-cari.ts'de alınır", () => {
    const desen = /FROM\s+"LedgerEntry"|ledgerEntry\.(aggregate|groupBy)\s*\(/;
    expect(ihlaller(desen, join("lib", "doctor-cari.ts"))).toEqual([]);
  });
});

describe("tek çağrı noktası — stok yazımı ve kilit (B-4-2)", () => {
  it("stok hareketi yalnız stok.ts'de yazılır", () => {
    const desen = /stockMovement\.(create|createMany|upsert|update|updateMany)\s*\(|INSERT\s+INTO\s+"StockMovement"/;
    expect(ihlaller(desen, join("lib", "stok.ts"))).toEqual([]);
  });

  it("FOR UPDATE yalnız sayılı kilit dosyalarında geçer (ADR-008 §(6))", () => {
    // Sayılı liste: ürün satırı (stok.ts) · doktor satırı (sahiplik.ts, X-17 §(8)).
    expect(ihlaller(/FOR\s+UPDATE/i, "").sort()).toEqual([join("lib", "sahiplik.ts"), join("lib", "stok.ts")]);
  });
});

describe("tek çağrı noktası — onay bloğu (A-8-6)", () => {
  it("OnayBlogu yalnız onay-blogu.ts'de yazılır", () => {
    const desen = /approvalBlock\.(create|createMany|upsert|update|updateMany|delete|deleteMany)\s*\(|INSERT\s+INTO\s+"ApprovalBlock"/;
    expect(ihlaller(desen, join("lib", "onay-blogu.ts"))).toEqual([]);
  });
});

describe("tek çağrı noktası — modül durumu (§1.3-1)", () => {
  it("policy.modules yalnız modul.ts'de okunur", () => {
    expect(ihlaller(/\bmodules\s*[.[]/, join("lib", "modul.ts"))).toEqual([]);
  });
});

describe("tek çağrı noktası — doktor kapsamı (X-13-1)", () => {
  it("satıcı ekranlarında sahip süzgeci elle yazılmaz; kapsam kapsamliDoktorlariGetir()'den gelir", () => {
    const saticiEkranlari = ihlaller(/ownerSellerId\s*:(?!\s*true\b)/, "").filter((yol) =>
      yol.startsWith(join("app", "(seller)"))
    );
    expect(saticiEkranlari).toEqual([]);
  });
});

describe("tek çağrı noktası — doktor sahibi (X-17-1)", () => {
  it("sahip alanına yalnız sahiplik.ts yazar", () => {
    const yazim = /\.doctor\.(create|createMany|update|updateMany|upsert)\s*\(/;
    const sahipAlani = /ownerSeller(Id)?\s*:(?!\s*true\b)/;
    const hamSql = /UPDATE\s+"Doctor"[^;]*"ownerSellerId"/i;
    const yazanlar = kaynaklar(KOK)
      .map((yol) => relative(KOK, yol))
      .filter((yol) => {
        const kaynak = readFileSync(join(KOK, yol), "utf8");
        return (yazim.test(kaynak) && sahipAlani.test(kaynak)) || hamSql.test(kaynak);
      });
    expect(yazanlar).toEqual([join("lib", "sahiplik.ts")]);
  });
});

describe("tek çağrı noktası — belge numarası (A-14-5, X-2-1)", () => {
  it("sayaç tablosuna yalnız belge-no.ts dokunur", () => {
    expect(ihlaller(/documentCounter\.|"DocumentCounter"/, join("lib", "belge-no.ts"))).toEqual([]);
  });

  it("kaynakta elle kurulmuş belge numarası yoktur", () => {
    expect(ihlaller(/["'`](SIP|SVK|IAD|KNS|TRF|THS|ACL|VDF|DZL)-/, join("lib", "belge-no.ts"))).toEqual([]);
  });

  it("tahsilat kaydı yalnız tahsilat akışında yazılır", () => {
    const desen = /doctorPayment\.(create|createMany|upsert)\s*\(|INSERT\s+INTO\s+"DoctorPayment"/;
    expect(ihlaller(desen, join("lib", "tahsilat.ts"))).toEqual([]);
  });
});

describe("tek çağrı noktası — oturum (E-2-1, E-2-3)", () => {
  it("oturum tablosuna yalnız oturum.ts yazar", () => {
    const desen = /\.session\.(create|createMany|upsert|update|updateMany|delete|deleteMany)\s*\(|(INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+"Session"/;
    expect(ihlaller(desen, join("lib", "oturum.ts"))).toEqual([]);
  });

  it("next-auth yoktur ve uygulamada route handler kalmaz (ADR-003)", () => {
    expect(ihlaller(/from\s+["']next-auth/, "")).toEqual([]);
    const routeHandler = kaynaklar(join(KOK, "app")).filter((yol) => /[/\\]route\.tsx?$/.test(yol));
    expect(routeHandler).toEqual([]);
  });
});

describe("tek çağrı noktası — parola ve hesap (E-2-5, E-2-6)", () => {
  it("bcrypt yalnız parola.ts'de çağrılır", () => {
    expect(ihlaller(/from\s+["']bcryptjs["']/, join("lib", "parola.ts"))).toEqual([]);
  });

  it("kullanıcı silinmez: silme yolu yoktur (E-2 §(6))", () => {
    expect(ihlaller(/\.user\.(delete|deleteMany)\s*\(|DELETE\s+FROM\s+"User"/, "")).toEqual([]);
  });
});

describe("tek çağrı noktası — dışa aktarım (D-5-1, D-5-2)", () => {
  it("veri seti yalnız calistirDisaAktarim() ile, yalnız dışa aktarım action'ından çalışır", () => {
    const cagiranlar = ihlaller(/calistirDisaAktarim\s*\(/, join("app", "(admin)", "exports", "actions.ts"));
    expect(cagiranlar.filter((y) => y !== join("lib", "disa-aktarim.ts"))).toEqual([]);
  });

  it("kütük yalnız dışa aktarım action'ında yazılır; kütüğü okuyan ekran yoktur (D-5 §(5))", () => {
    expect(ihlaller(/exportLog\./, join("app", "(admin)", "exports", "actions.ts"))).toEqual([]);
  });
});

describe("tek çağrı noktası — cari hareket yazımı (X-11-1)", () => {
  it("cari hareket yalnız cari-hareket.ts'de yazılır; satır silinmez", () => {
    const yazim = /ledgerEntry\.(create|createMany|upsert)\s*\(|INSERT\s+INTO\s+"LedgerEntry"/;
    expect(ihlaller(yazim, join("lib", "cari-hareket.ts"))).toEqual([]);
    expect(ihlaller(/ledgerEntry\.(delete|deleteMany)\s*\(|DELETE\s+FROM\s+"LedgerEntry"/, "")).toEqual([]);
  });
});
