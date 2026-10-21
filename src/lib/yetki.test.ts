import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { ROLE_HOME } from "@/lib/roles";

// D-2-1 · D-2 §(1) ve 17.10 eki: ekran matrisi. Yetki SUNUCUDA uygulanır — her server
// action ve her yönetim sayfası kendi guard'ını çağırır; menüden gizlemek yetki değildir
// (D-2 §(3)). Matris bu dosyadadır: yeni bir action ya da sayfa buraya yazılmadan kırmızıdır.

const APP = join(__dirname, "..", "app");

const ACTION_YETKISI: Record<string, "requireAdmin" | "requireStaff" | "requireSeller"> = {
  // OPERASYON: sipariş, sevkiyat, tahsilat, stok hareketi (D-2 §(1)).
  "(admin)/orders/actions.ts#prepareOrder": "requireStaff",
  "(admin)/orders/actions.ts#markDelivered": "requireStaff",
  "(admin)/orders/actions.ts#cancelOrder": "requireStaff",
  "(admin)/orders/actions.ts#createReturn": "requireStaff", // A-1 eki: YONETICI + OPERASYON
  "(admin)/stock/actions.ts#addConsignment": "requireStaff", // A-4: stok hareketi (D-2 §(1))
  "(admin)/stock/actions.ts#addTransfer": "requireStaff", // B-4
  "(admin)/stock/actions.ts#addStockAdjustment": "requireAdmin", // B-7: yalnız YONETICI (D-2 §(2))
  "(admin)/shipping/actions.ts#shipOrder": "requireStaff",
  "(admin)/collections/actions.ts#recordCollection": "requireStaff",
  "(admin)/collections/actions.ts#cancelCollection": "requireStaff",
  "(admin)/stock/actions.ts#addStockEntry": "requireStaff",
  // Yalnız YONETICI: vade (X-15), devir (X-13 §(5)), ürün tanımı, kullanıcı yönetimi.
  "(admin)/collections/actions.ts#changeDueDate": "requireAdmin",
  "(admin)/doctors/actions.ts#transferDoctor": "requireAdmin",
  "(admin)/products/actions.ts#createProduct": "requireAdmin",
  "(admin)/products/actions.ts#updateProduct": "requireAdmin",
  "(admin)/products/actions.ts#deleteProduct": "requireAdmin",
  "(admin)/users/actions.ts#createUser": "requireAdmin",
  "(admin)/users/actions.ts#updateUser": "requireAdmin",
  "(admin)/exports/actions.ts#disaAktar": "requireAdmin", // D-5 §(4)
  "(admin)/approvals/actions.ts#blokKarari": "requireAdmin", // A-8: karar yetkisi yönetici
  "(admin)/doctors/actions.ts#createCari": "requireAdmin", // X-8 §(5): BAYI dahil cari açma yöneticide
  "(admin)/doctors/actions.ts#updateCari": "requireAdmin", // X-16 §(9): düzeltme yolu
  "(admin)/doctors/actions.ts#addVadeFarki": "requireAdmin", // A-7: elle vade farkı
  "(admin)/doctors/actions.ts#reverseLedgerEntry": "requireAdmin", // X-16 §(10): ACL/VDF ters kaydı
  "(admin)/imports/actions.ts#iceAktar": "requireAdmin", // X-16 §(6)
  "(admin)/imports/actions.ts#sablonIndir": "requireAdmin",
  "(admin)/imports/actions.ts#partiyiGeriAl": "requireAdmin", // X-12 §(3)
  "(admin)/price-lists/actions.ts#createPriceList": "requireAdmin", // X-10 §(6): fiyat tanımı
  "(admin)/price-lists/actions.ts#setPriceListItem": "requireAdmin",
  "(admin)/price-lists/actions.ts#deletePriceListItem": "requireAdmin",
  // SATICI ekranları.
  "(seller)/my-orders/actions.ts#createOrder": "requireSeller",
  "(seller)/my-doctors/actions.ts#createDoctor": "requireSeller",
  "(seller)/my-doctors/actions.ts#updateDoctor": "requireSeller",
};

// Yönetim rota grubunun layout'u YONETICI + OPERASYON'u alır; yalnız YONETICI'nin
// sayfaları kendi guard'ını taşır (17.10 eki: raporlar, denetim kaydı; ürün ve satıcı
// ekleme/düzenleme kullanıcı yönetimi ve ürün tanımıdır).
const YALNIZ_YONETICI_SAYFALARI = [
  "(admin)/reports/page.tsx",
  "(admin)/audit-logs/page.tsx",
  "(admin)/exports/page.tsx",
  "(admin)/approvals/page.tsx",
  "(admin)/price-lists/page.tsx",
  "(admin)/doctors/new/page.tsx",
  "(admin)/imports/page.tsx",
  "(admin)/doctors/[id]/edit/page.tsx",
  "(admin)/price-lists/[id]/page.tsx",
  "(admin)/products/new/page.tsx",
  "(admin)/products/[id]/edit/page.tsx",
  "(admin)/users/new/page.tsx",
  "(admin)/users/[id]/edit/page.tsx",
];

function dosyalar(dizin: string, ad: RegExp): string[] {
  return readdirSync(dizin).flatMap((d) => {
    const yol = join(dizin, d);
    if (statSync(yol).isDirectory()) return dosyalar(yol, ad);
    return ad.test(d) ? [relative(APP, yol)] : [];
  });
}

/** Her export edilen action'ın gövdesinde çağrılan ilk `require*()` guard'ı. */
function actionGuardlari(): Record<string, string | null> {
  const sonuc: Record<string, string | null> = {};
  for (const dosya of dosyalar(APP, /^actions\.ts$/)) {
    const kaynak = readFileSync(join(APP, dosya), "utf8");
    const parcalar = kaynak.split(/^export async function /m).slice(1);
    for (const p of parcalar) {
      const ad = p.match(/^(\w+)/)![1];
      sonuc[`${dosya}#${ad}`] = p.match(/await (require\w+)\(/)?.[1] ?? null;
    }
  }
  return sonuc;
}

describe("ekran matrisi — sunucu guard'ları (D-2-1)", () => {
  it("her server action matristeki guard'ı çağırır; matrise yazılmamış action yoktur", () => {
    expect(actionGuardlari()).toEqual(ACTION_YETKISI);
  });

  it("yönetim layout'u YONETICI ve OPERASYON'u alır", () => {
    expect(readFileSync(join(APP, "(admin)/layout.tsx"), "utf8")).toMatch(/await requireStaff\(\)/);
  });

  it("yalnız YONETICI'nin sayfaları kendi requireAdmin()'ini çağırır", () => {
    for (const sayfa of YALNIZ_YONETICI_SAYFALARI) {
      expect(readFileSync(join(APP, sayfa), "utf8"), sayfa).toMatch(/await requireAdmin\(\)/);
    }
  });

  it("OPERASYON giriş yapar; ana sayfası Dashboard'dur", () => {
    expect(ROLE_HOME.OPERASYON).toBe("/dashboard");
    expect(readFileSync(join(APP, "..", "lib", "auth-actions.ts"), "utf8")).not.toMatch(/OPERASYON/);
  });
});

describe("cari açma — BAYI yalnız YONETICI (X-8-1)", () => {
  it("satıcı ekranından açılan cari daima DOKTOR'dur", () => {
    const kaynak = readFileSync(join(APP, "(seller)/my-doctors/actions.ts"), "utf8");
    expect(kaynak).toMatch(/accountClass:\s*"DOKTOR"/);
    expect(kaynak).not.toMatch(/accountClass:(?!\s*"DOKTOR")/);
  });

  it("yönetim rota grubunda cari yalnız cariAc() ile açılır; action requireAdmin (OPERASYON cari açmaz)", () => {
    for (const dosya of dosyalar(join(APP, "(admin)"), /^actions\.ts$/)) {
      expect(readFileSync(join(APP, dosya), "utf8"), dosya).not.toMatch(/doctor\.create\s*\(/);
    }
    expect(actionGuardlari()["(admin)/doctors/actions.ts#createCari"]).toBe("requireAdmin");
    const lib = readFileSync(join(APP, "..", "lib", "cari.ts"), "utf8");
    expect(lib).not.toMatch(/accountClass:\s*"/); // sınıf girdiden gelir, varsayılan yok (X-16 §(8))
  });
});
