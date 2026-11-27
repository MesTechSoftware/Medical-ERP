import type { FaturaKarti, FaturaKolonu } from "@/lib/disa-aktarim";

const MUHATAP: { kod: FaturaKolonu; etiket: string }[] = [
  { kod: "FATURA_UNVANI", etiket: "Fatura unvanı" },
  { kod: "VKN_TCKN", etiket: "VKN / TCKN" },
  { kod: "VERGI_DAIRESI", etiket: "Vergi dairesi" },
  { kod: "FATURA_ADRESI", etiket: "Fatura adresi" },
  { kod: "FATURA_ILCE", etiket: "İlçe" },
  { kod: "FATURA_IL", etiket: "İl" },
];

/** Karttaki alan etiketleri (kart ve kopyalanan metin aynı listeyi okur). */
export const FATURA_MUHATAP_ALANLARI = MUHATAP;

/**
 * "Tümünü Kopyala" metni (D-3/C-1 §(2), KARARLAR §5.23 S3): muhatap `Etiket: değer` satırları, boş satır, sekmeli
 * kalemler, KDV kırılımı, toplam ve bilgi notu. Tutarlar karttaki dizgilerdir; yeni hesap yoktur.
 */
export function faturaKartiMetni(belgeNo: string, karti: FaturaKarti): string {
  const { veri } = karti;
  const ilk = veri.satirlar[0];
  if (!ilk) return `Fatura bilgisi — ${belgeNo}\nBu sevkiyat fatura hazırlığına girmiyor.`;
  const i = (kod: FaturaKolonu) => veri.kolonlar.findIndex((c) => c.kod === kod);
  const muhatap = MUHATAP.map(({ kod, etiket }) => `${etiket}: ${ilk[i(kod)] ?? "—"}`);
  const kalemler = veri.satirlar.map((r) =>
    [r[i("URUN_ADI")], r[i("MIKTAR")], r[i("KDV_ORANI")], r[i("MATRAH")], r[i("KDV_TUTARI")], r[i("TOPLAM")]].map((d) => d ?? "").join("\t")
  );
  const kirilim = karti.kdvKirilimi.map((k) => `KDV %${k.oran} — matrah: ${k.matrah} · KDV: ${k.kdv}`);
  return [
    `Fatura bilgisi — ${belgeNo}`,
    ...muhatap,
    "",
    ["Ürün", "Miktar", "KDV %", "Tutar", "KDV", "Toplam"].join("\t"),
    ...kalemler,
    "",
    ...kirilim,
    `Toplam: ${karti.toplam.toplam}`,
    "",
    "Bilgi amaçlıdır — mali belge değildir.",
  ].join("\n");
}
