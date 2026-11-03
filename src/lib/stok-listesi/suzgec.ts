import { HAREKET_TURLERI, type HareketTuruKodu } from "@/lib/stok-hareket-turu";
import { aralikEtiketi, gun, ilk, kimlik, secenek, type Parametreler } from "@/lib/liste/parametreler";

/**
 * Stok ekranının hareket süzgeci (spec Ü-20 §3.3); adres çubuğunda durur. Geçersiz değer yok sayılır.
 * Günler İstanbul günüdür (`YYYY-AA-GG`); aralığa çevirme `sorgu.ts`'tedir. `urun` formun önseçimidir,
 * süzgeç onu taşımaz; ürün süzgeci `urunId`'dir (B-4-12). Saf modül.
 */

export type StokSuzgeci = {
  baslangic: string | null;
  bitis: string | null;
  tur: HareketTuruKodu | null;
  yon: "GIRIS" | "CIKIS" | null;
  urunId: string | null;
};

export const BOS_SUZGEC: StokSuzgeci = { baslangic: null, bitis: null, tur: null, yon: null, urunId: null };

type Tarih = Pick<StokSuzgeci, "baslangic" | "bitis">;

const TUR_KODLARI = HAREKET_TURLERI.map((t) => t.kod);

export function suzgecCoz(p: Parametreler): StokSuzgeci {
  let baslangic = gun(ilk(p, "baslangic"));
  let bitis = gun(ilk(p, "bitis"));
  if (baslangic !== null && bitis !== null && bitis < baslangic) [baslangic, bitis] = [bitis, baslangic];
  return {
    baslangic,
    bitis,
    tur: secenek(ilk(p, "tur"), TUR_KODLARI),
    yon: secenek(ilk(p, "yon"), ["GIRIS", "CIKIS"] as const),
    urunId: kimlik(ilk(p, "urunId")),
  };
}

/** Süzgeci koruyan liste adresi; sayfa isteğe bağlı. */
export function stokAdresi(s: StokSuzgeci, ek: { page?: number; per?: number } = {}): string {
  const p = new URLSearchParams();
  if (s.baslangic) p.set("baslangic", s.baslangic);
  if (s.bitis) p.set("bitis", s.bitis);
  if (s.tur) p.set("tur", s.tur);
  if (s.yon) p.set("yon", s.yon);
  if (s.urunId) p.set("urunId", s.urunId);
  if (ek.page !== undefined && ek.page > 1) p.set("page", String(ek.page));
  if (ek.per !== undefined) p.set("per", String(ek.per));
  const q = p.toString();
  return q ? `/stock?${q}` : "/stock";
}

/** Tarih kısayolları ortak modüldedir (`liste/tarih-sekmeleri.ts`). */
export { tarihSekmeleri as hizliSekmeler, etkinTarihSekmesi as etkinSekme } from "@/lib/liste/tarih-sekmeleri";

/** Sekmenin adresi: tarihleri yazar, öbür süzgeçleri korur; sayfa düşer. */
export function sekmeAdresi(s: StokSuzgeci, tarih: Tarih): string {
  return stokAdresi({ ...s, ...tarih });
}

type Anahtar = "tarih" | "tur" | "yon" | "urun";

/** Etkin süzgeçlerin etiketleri, her biri o alanı düşüren adresle; bilinmeyen ürünü sayfa adresten düşürür. */
export function etkinSuzgecler(
  s: StokSuzgeci,
  urunAdi: (id: string) => string | undefined
): { anahtar: Anahtar; etiket: string; kaldirAdresi: string }[] {
  const liste: { anahtar: Anahtar; etiket: string; kaldirAdresi: string }[] = [];
  if (s.baslangic || s.bitis) {
    liste.push({
      anahtar: "tarih",
      etiket: `Tarih: ${aralikEtiketi(s.baslangic, s.bitis)}`,
      kaldirAdresi: stokAdresi({ ...s, baslangic: null, bitis: null }),
    });
  }
  if (s.tur) {
    const etiket = HAREKET_TURLERI.find((t) => t.kod === s.tur)!.etiket;
    liste.push({ anahtar: "tur", etiket: `Tür: ${etiket}`, kaldirAdresi: stokAdresi({ ...s, tur: null }) });
  }
  if (s.yon) {
    liste.push({ anahtar: "yon", etiket: `Yön: ${s.yon === "GIRIS" ? "Giriş" : "Çıkış"}`, kaldirAdresi: stokAdresi({ ...s, yon: null }) });
  }
  const ad = s.urunId ? urunAdi(s.urunId) : undefined;
  if (ad !== undefined) {
    liste.push({ anahtar: "urun", etiket: `Ürün: ${ad}`, kaldirAdresi: stokAdresi({ ...s, urunId: null }) });
  }
  return liste;
}

/** Sonuç boşken gösterilecek açıklamanın türü (spec §3.6). */
export function bosDurum(s: StokSuzgeci): "hic-kayit" | "suzgecli" {
  return s.baslangic || s.bitis || s.tur || s.yon || s.urunId ? "suzgecli" : "hic-kayit";
}
