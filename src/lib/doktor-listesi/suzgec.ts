import { aralikEtiketi, gun, ilk, kimlik, secenek, type Parametreler } from "@/lib/liste/parametreler";

/**
 * Cari listesinin süzgeci (KARARLAR X-8 §(5), A-13 §(5); spec Ü-18 §3.2); adres çubuğunda durur.
 * Geçersiz değer yok sayılır. Saf modül: gün metni ve Prisma koşulu `sorgu.ts`'te kurulur (E-1).
 */

/** Satıcı süzgecinde sahipsiz havuz (`SAHIPSIZ_DOKTOR`). */
export const SAHIPSIZ = "yok";

export type Sessiz = "30" | "60" | "90" | "180" | "hic";

export type DoktorSuzgeci = {
  sinif: "DOKTOR" | "BAYI" | null;
  bolge: string | null;
  /** Kullanıcı kimliği ya da `SAHIPSIZ`. */
  satici: string | null;
  durum: "AKTIF" | "PASIF" | null;
  fatura: "eksik" | null;
  /** Bu kadar gündür sayılan sipariş yok; aralık verilmişse `null`. */
  sessiz: Sessiz | null;
  /** İstanbul günü `YYYY-AA-GG`: son siparişi bu aralığa düşenler. */
  sonBas: string | null;
  sonBit: string | null;
};

export const BOS_SUZGEC: DoktorSuzgeci = {
  sinif: null,
  bolge: null,
  satici: null,
  durum: null,
  fatura: null,
  sessiz: null,
  sonBas: null,
  sonBit: null,
};

export type { Parametreler };

/** Listenin ekranı: yönetici `/doctors` (bütün cariler), satıcı `/my-doctors` (kendi portföyü — X-13, kapsam sorguda). */
export type DoktorYolu = "/doctors" | "/my-doctors";

const SESSIZ: readonly Sessiz[] = ["30", "60", "90", "180", "hic"];
const BOLGE_AZAMI = 100;

export function suzgecCoz(p: Parametreler): { suzgec: DoktorSuzgeci; detay: string | null } {
  const bolge = ilk(p, "bolge")?.trim() ?? "";
  // Eski adres: `?sahip=yok` (X-17-5) satıcı süzgecinin sahipsiz seçimidir.
  const satici = kimlik(ilk(p, "satici")) ?? (ilk(p, "sahip") === SAHIPSIZ ? SAHIPSIZ : null);
  let sonBas = gun(ilk(p, "sonBas"));
  let sonBit = gun(ilk(p, "sonBit"));
  if (sonBas !== null && sonBit !== null && sonBas > sonBit) sonBas = sonBit = null;
  const aralik = sonBas !== null || sonBit !== null;
  return {
    suzgec: {
      sinif: secenek(ilk(p, "sinif"), ["DOKTOR", "BAYI"] as const),
      bolge: bolge.length > 0 && bolge.length <= BOLGE_AZAMI ? bolge : null,
      satici,
      durum: secenek(ilk(p, "durum"), ["AKTIF", "PASIF"] as const),
      fatura: ilk(p, "fatura") === "eksik" ? "eksik" : null,
      sessiz: aralik ? null : secenek(ilk(p, "sessiz"), SESSIZ),
      sonBas,
      sonBit,
    },
    detay: kimlik(ilk(p, "detay")),
  };
}

/** Süzgeci koruyan liste adresi; sayfa ve panel isteğe bağlı. Sayfalama `detay` taşımaz. */
export function doktorAdresi(
  s: DoktorSuzgeci,
  ek: { page?: number; per?: number; detay?: string } = {},
  yol: DoktorYolu = "/doctors"
): string {
  const p = new URLSearchParams();
  for (const [ad, deger] of Object.entries(s)) if (deger !== null) p.set(ad, deger);
  if (ek.page !== undefined && ek.page > 1) p.set("page", String(ek.page));
  if (ek.per !== undefined) p.set("per", String(ek.per));
  if (ek.detay !== undefined) p.set("detay", ek.detay);
  const q = p.toString();
  return q ? `${yol}?${q}` : yol;
}

export const HIZLI_SEKMELER: readonly { etiket: string; suzgec: DoktorSuzgeci }[] = [
  { etiket: "Tümü", suzgec: BOS_SUZGEC },
  { etiket: "Doktorlar", suzgec: { ...BOS_SUZGEC, sinif: "DOKTOR" } },
  { etiket: "Bayiler", suzgec: { ...BOS_SUZGEC, sinif: "BAYI" } },
  { etiket: "Sahipsiz", suzgec: { ...BOS_SUZGEC, satici: SAHIPSIZ } },
  { etiket: "Eksik fatura bilgisi", suzgec: { ...BOS_SUZGEC, fatura: "eksik" } },
];

export function ayniSuzgec(a: DoktorSuzgeci, b: DoktorSuzgeci): boolean {
  return (Object.keys(BOS_SUZGEC) as (keyof DoktorSuzgeci)[]).every((k) => a[k] === b[k]);
}

export function etkinSayisi(s: DoktorSuzgeci): number {
  const { sonBas, sonBit, ...digerleri } = s;
  return Object.values(digerleri).filter((d) => d !== null).length + (sonBas !== null || sonBit !== null ? 1 : 0);
}

/** Etkin süzgeçlerin etiketleri, her biri o alanı düşüren adresle; aralığın iki ucu tek etikettir. */
export function etkinSuzgecler(
  s: DoktorSuzgeci,
  saticiAdi: (id: string) => string | undefined,
  yol: DoktorYolu = "/doctors"
): { anahtar: keyof DoktorSuzgeci; etiket: string; kaldirAdresi: string }[] {
  const liste: { anahtar: keyof DoktorSuzgeci; etiket: string | undefined; kalan: DoktorSuzgeci }[] = [];
  const ekle = (anahtar: keyof DoktorSuzgeci, etiket: string | undefined) =>
    liste.push({ anahtar, etiket, kalan: { ...s, [anahtar]: null } });

  if (s.sinif) ekle("sinif", `Sınıf: ${s.sinif === "DOKTOR" ? "Doktor" : "Bayi"}`);
  if (s.bolge) ekle("bolge", `Bölge: ${s.bolge}`);
  if (s.satici) {
    const ad = s.satici === SAHIPSIZ ? "Sahipsiz" : saticiAdi(s.satici);
    ekle("satici", ad === undefined ? undefined : `Satıcı: ${ad}`);
  }
  if (s.durum) ekle("durum", `Durum: ${s.durum === "AKTIF" ? "Aktif" : "Pasif"}`);
  if (s.fatura) ekle("fatura", "Eksik fatura bilgisi");
  if (s.sessiz) ekle("sessiz", `Son sipariş: ${s.sessiz === "hic" ? "hiç yok" : `${s.sessiz}+ gün önce`}`);
  if (s.sonBas !== null || s.sonBit !== null) {
    liste.push({
      anahtar: "sonBas",
      etiket: `Son sipariş: ${aralikEtiketi(s.sonBas, s.sonBit)}`,
      kalan: { ...s, sonBas: null, sonBit: null },
    });
  }
  return liste.flatMap((e) => (e.etiket === undefined ? [] : [{ anahtar: e.anahtar, etiket: e.etiket, kaldirAdresi: doktorAdresi(e.kalan, {}, yol) }]));
}

export type BosDurum = "hic-kayit" | "sahipsiz" | "eksik-fatura" | "suzgecli";

/** Sonuç boşken gösterilecek açıklamanın türü (spec §3.5). */
export function bosDurum(s: DoktorSuzgeci): BosDurum {
  if (etkinSayisi(s) === 0) return "hic-kayit";
  if (ayniSuzgec(s, { ...BOS_SUZGEC, satici: SAHIPSIZ })) return "sahipsiz";
  if (ayniSuzgec(s, { ...BOS_SUZGEC, fatura: "eksik" })) return "eksik-fatura";
  return "suzgecli";
}

/** Seçeneklerde olmayan (bilinmeyen ya da pasif) satıcı süzgeci yok sayılır (spec §5). */
export function saticiyiDogrula(s: DoktorSuzgeci, aktifSaticilar: readonly string[]): DoktorSuzgeci {
  return s.satici === null || s.satici === SAHIPSIZ || aktifSaticilar.includes(s.satici) ? s : { ...s, satici: null };
}

// --- Doktorlarım (satıcı, Ü-32) ------------------------------------------------------------------

/**
 * Doktorlarım'ın süzgeci: sınıf, satıcı ve fatura bu ekranda yoktur — kapsam yalnız satıcının `DOKTOR`
 * carileridir (X-13-1), sahibi kendisidir; fatura bilgisi yöneticinin işidir. Adreste kalmışlarsa düşer.
 */
export function saticiSuzgeci(s: DoktorSuzgeci): DoktorSuzgeci {
  return { ...s, sinif: null, satici: null, fatura: null };
}

/** Doktorlarım'ın kartları (ADR-010: en çok 4): kartın adresi de sayısı da bu süzgeçten türer — kart = satır. */
export const SATICI_KARTLARI: readonly { anahtar: "toplam" | "aktif" | "sessiz90" | "hic"; etiket: string; suzgec: DoktorSuzgeci }[] = [
  { anahtar: "toplam", etiket: "Doktorlarım", suzgec: BOS_SUZGEC },
  { anahtar: "aktif", etiket: "Aktif", suzgec: { ...BOS_SUZGEC, durum: "AKTIF" } },
  { anahtar: "sessiz90", etiket: "90+ gündür siparişsiz", suzgec: { ...BOS_SUZGEC, sessiz: "90" } },
  { anahtar: "hic", etiket: "Hiç siparişi yok", suzgec: { ...BOS_SUZGEC, sessiz: "hic" } },
];

export const SATICI_SEKMELERI: readonly { etiket: string; suzgec: DoktorSuzgeci }[] = [
  { etiket: "Tümü", suzgec: BOS_SUZGEC },
  { etiket: "Aktif", suzgec: { ...BOS_SUZGEC, durum: "AKTIF" } },
  { etiket: "Pasif", suzgec: { ...BOS_SUZGEC, durum: "PASIF" } },
];

