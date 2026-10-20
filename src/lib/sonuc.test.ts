import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it } from "vitest";

import { SonucGosterimi } from "@/components/Sonuc";

import { KURAL_KODLARI, basarili, bilgi, engel, sert, sonucOlustur, yumusak } from "@/lib/sonuc";
import { KURAL_METNI, bildirimMetni } from "@/lib/sozluk";

const SRC = join(__dirname, "..");

function dosyalar(dizin: string, ad: RegExp): string[] {
  return readdirSync(dizin).flatMap((d) => {
    const yol = join(dizin, d);
    if (statSync(yol).isDirectory()) return d === "generated" ? [] : dosyalar(yol, ad);
    return ad.test(d) ? [yol] : [];
  });
}

const actionlar = dosyalar(SRC, /^(actions|auth-actions)\.ts$/);

describe("üç kademe (§0.3-1)", () => {
  it("bildirim yoksa BASARILI; en yüksek kademe akışı belirler", () => {
    expect(basarili()).toEqual({ durum: "BASARILI", kademe: null, bildirimler: [] });
    expect(sonucOlustur([bilgi("NEGATIF_STOK")])).toMatchObject({ durum: "BASARILI_UYARILI", kademe: "BILGI" });
    expect(sonucOlustur([bilgi("NEGATIF_STOK"), yumusak("NEGATIF_STOK")])).toMatchObject({
      durum: "ONAY_GEREKLI",
      kademe: "YUMUSAK",
    });
    expect(sonucOlustur([bilgi("NEGATIF_STOK"), yumusak("NEGATIF_STOK"), sert("ALAN_ZORUNLU")])).toMatchObject({
      durum: "ENGELLENDI",
      kademe: "SERT",
    });
  });
});

describe("tek dönüş sözleşmesi (X-4-1)", () => {
  it("her server action IslemSonucu döner; tek istisna yalnız yönlendiren çıkıştır", () => {
    for (const yol of actionlar) {
      const k = readFileSync(yol, "utf8");
      for (const parca of k.split(/^export async function /m).slice(1)) {
        const ad = parca.match(/^(\w+)/)![1];
        if (ad === "logoutAction") continue; // iş kuralı yok; daima /login'e yönlendirir
        const donus = parca.match(/\)\s*:\s*Promise<(\w+)>\s*\{/)?.[1];
        expect(["IslemSonucu", "UserFormState"], `${relative(SRC, yol)}#${ad}`).toContain(donus);
      }
    }
    expect(readFileSync(join(SRC, "app", "(admin)", "users", "actions.ts"), "utf8")).toMatch(
      /export type UserFormState = IslemSonucu & \{/
    );
  });

  it("eski biçim kalmadı: error/ok alanı, ?error= yönlendirmesi, metinli IsHatasi yok", () => {
    for (const yol of actionlar) {
      const k = readFileSync(yol, "utf8");
      const ad = relative(SRC, yol);
      expect(k, ad).not.toMatch(/[{,]\s*(error|ok)\??\s*:/);
      expect(k, ad).not.toMatch(/\?error=/);
      expect(k, ad).not.toMatch(/new IsHatasi\(\s*["'`]/);
    }
  });

  it("iş hatası loglanmaz ve sunucu sözlüğü okumaz (X-4 §(3)/(8))", () => {
    for (const yol of actionlar) {
      const k = readFileSync(yol, "utf8");
      expect(k, relative(SRC, yol)).not.toMatch(/console\./);
      expect(k, relative(SRC, yol)).not.toMatch(/@\/lib\/sozluk/);
    }
  });
});

describe("tek sözlük (X-4-2)", () => {
  it("katalogdaki her kural kodunun metni vardır; sözlükte katalog dışı kod yoktur", () => {
    expect(Object.keys(KURAL_METNI).sort()).toEqual([...KURAL_KODLARI].sort());
  });

  it("her metin parametresiyle dolar, boş ya da 'undefined' kalmaz", () => {
    const parametre = new Proxy({}, { get: () => "1" }); // hem metin hem tutar parametresi olarak geçerli
    for (const kod of KURAL_KODLARI) {
      const metin = bildirimMetni({ kural_kodu: kod, parametreler: parametre });
      expect(metin, kod).not.toBe("");
      expect(metin, kod).not.toMatch(/undefined/);
    }
  });

  it("metne dönüşüm ve kademe deseni tek bileşendedir; başka dosya kendi mesaj tablosunu tutmaz", () => {
    const tsx = dosyalar(SRC, /\.tsx?$/).filter((y) => !/\.(i?test)\.ts$/.test(y));
    for (const yol of tsx) {
      const ad = relative(SRC, yol);
      const k = readFileSync(yol, "utf8");
      if (ad !== join("components", "Sonuc.tsx") && ad !== join("lib", "sozluk.ts")) {
        expect(k, ad).not.toMatch(/bildirimMetni|KURAL_METNI|data-kademe/);
      }
      expect(k, ad).not.toMatch(/_MESAJI\b|FormError|state\.error|searchParams.*error/);
    }
  });
});

describe("bildirimler yutulmaz (X-4-3)", () => {
  it("bütün bildirimler kademeye göre sıralı döner, hiçbiri atılmaz", () => {
    const b = [bilgi("NEGATIF_STOK", { sonra: -1 }), sert("ALAN_ZORUNLU", {}, "a"), yumusak("NEGATIF_STOK"), sert("GECERSIZ_TUTAR")];
    const s = sonucOlustur(b);
    expect(s.bildirimler).toHaveLength(4);
    expect(s.bildirimler.map((x) => x.kademe)).toEqual(["SERT", "SERT", "YUMUSAK", "BILGI"]);
  });

  it("engel tek SERT bildirimdir ve alanı taşır", () => {
    expect(engel("ALAN_ZORUNLU", {}, "amount")).toEqual({
      durum: "ENGELLENDI",
      kademe: "SERT",
      bildirimler: [{ kademe: "SERT", kural_kodu: "ALAN_ZORUNLU", parametreler: {}, alan: "amount" }],
    });
  });
});

describe("kademe başına tek gösterim deseni (X-4-4)", () => {
  const html = (sonuc: Parameters<typeof SonucGosterimi>[0]["sonuc"], basari?: () => string) =>
    renderToStaticMarkup(createElement(SonucGosterimi, { sonuc, basari }));

  it("BILGI: işlem tamamlanır — başarı metni ve kapatılabilir şerit birlikte", () => {
    const h = html(sonucOlustur([bilgi("NAKIT_TEVSIK_LIMITI", { toplam: "35000", limit: "30000" })]), () => "Kaydedildi.");
    expect(h).toMatch(/role="status" data-kademe="BILGI"/);
    expect(h).toMatch(/tevsik sınırını aşıyor/);
    expect(h).toMatch(/>Kapat</);
    expect(h).toMatch(/Kaydedildi\./);
    expect(h).not.toMatch(/role="alert"|role="dialog"/);
  });

  it("YUMUSAK: onay diyaloğu, gerekçe alanı zorunlu ve aynı formla gönderilir", () => {
    const h = html(sonucOlustur([yumusak("NEGATIF_STOK", { sonra: -2 })]), () => "Kaydedildi.");
    expect(h).toMatch(/role="dialog"/);
    expect(h).toMatch(/<textarea[^>]*name="gerekce"[^>]*required/);
    expect(h).toMatch(/işlem sonrası stok -2 adet/);
    expect(h).not.toMatch(/Kaydedildi/);
  });

  it("SERT: alansız bildirim form kutusunda; alanı formda gösterilen bildirim kutuda tekrar edilmez", () => {
    const sonuc = sonucOlustur([sert("URUN_SIPARISTE_KULLANILDI"), sert("ALAN_ZORUNLU", {}, "name")]);
    const kutu = renderToStaticMarkup(createElement(SonucGosterimi, { sonuc, alanlar: ["name"] }));
    expect(kutu).toMatch(/role="alert"/);
    expect(kutu).toMatch(/silinemez/);
    expect(kutu).not.toMatch(/Bu alan zorunludur/);
    // Alan formda yoksa bildirim atılmaz, kutuya düşer (X-4 §(7)).
    expect(html(sonuc)).toMatch(/Bu alan zorunludur/);
  });
});
