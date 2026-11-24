import { bilgi, KURAL_KODLARI, type Bildirim } from "@/lib/sonuc";

/**
 * Başarıyla biten işlemin BİLGİ bildirimleri yönlendirmeden sonra da görünsün diye adres parametresinde taşınır
 * (A-12-6): sipariş ve sevkiyat action'ları başarıda `redirect` eder, sonuç gövdesi düşer. Parametre
 * kullanıcı girdisi sayılır: kural kodu kapalı listeden, parametreler kısa metin/sayı olmalıdır; metni `sozluk.ts` üretir.
 */
export const BILGI_PARAMETRESI = "bilgi";

export function bilgiParametresi(bildirimler: readonly Bildirim[]): string | null {
  const b = bildirimler.filter((x) => x.kademe === "BILGI").map((x) => ({ k: x.kural_kodu, p: x.parametreler }));
  return b.length === 0 ? null : JSON.stringify(b);
}

/** Adrese `bilgi` parametresini ekler; bildirim yoksa adres değişmez. */
export function bilgiyleAdres(adres: string, bildirimler: readonly Bildirim[]): string {
  const p = bilgiParametresi(bildirimler);
  return p === null ? adres : `${adres}${adres.includes("?") ? "&" : "?"}${BILGI_PARAMETRESI}=${encodeURIComponent(p)}`;
}

export function bilgiCoz(ham: string | string[] | undefined): Bildirim[] {
  if (typeof ham !== "string" || ham.length > 1000) return [];
  try {
    const liste: unknown = JSON.parse(ham);
    if (!Array.isArray(liste)) return [];
    return liste.slice(0, 4).flatMap((x): Bildirim[] => {
      if (typeof x !== "object" || x === null) return [];
      const { k, p } = x as { k?: unknown; p?: unknown };
      if (typeof k !== "string" || !(KURAL_KODLARI as readonly string[]).includes(k)) return [];
      const parametreler: Record<string, string | number> = {};
      for (const [ad, v] of Object.entries(typeof p === "object" && p !== null ? p : {})) {
        if (typeof v === "string" || typeof v === "number") parametreler[ad] = typeof v === "string" ? v.slice(0, 80) : v;
      }
      return [bilgi(k as Bildirim["kural_kodu"], parametreler)];
    });
  } catch {
    return [];
  }
}
