import { Children } from "react";

/**
 * Sayfa başlığının KPI satırı: en çok 4 kart, ilki birincil (geniş), eşit üçlü dizi yok. Tek istisna
 * Siparişler ekranının 6 kartıdır (ADR-010 eki, kullanıcı kararı 03.11.2026).
 * Yatay kaydırmalı şerit yoktur — görünmeyen KPI okunmaz.
 *
 * Yerleşim satırın KENDİ genişliğinden gelir (container query): kenar çubuğu 768 px'ten itibaren
 * 240 px yer, ekran genişliği kartın genişliğini söylemez. Eşikler ikincil kartın içerik alanını
 * ≥ ~150 px tutar (değer ~20 px ve üstü). Sınıflar statiktir (Tailwind dinamik sınıf üretmez):
 *
 * | Kart | Dar (< 576 px)        | Orta (576–983 px)     | Geniş (≥ 984 px)   |
 * |------|-----------------------|-----------------------|--------------------|
 * | 4    | 2 kolon: B tam satır  | 3 kolon: B tam satır  | 5 kolon: B 2 birim |
 * | 3    | 2 kolon: B tam satır  | 784 px'ten 4 kolon: B 2 birim              |
 * | 2    | alt alta              | 3 kolon: B 2 birim    | aynı               |
 * | 1    | tam genişlik          | tam genişlik          | tam genişlik       |
 * | 6    | 2 kolon: B ve son kart tam satır | 6 birim: B tam satır, 3 + 2 | 1200 px'ten 7 birim: B 2, tek satır |
 *
 * Yönetici kabuğunda ekran karşılığı (satır = ekran − 288 px; telefonda ekran − 32 px): telefon ve
 * 768–863 px dar, 864–1271 px orta, ≥ 1272 px geniş.
 */
type Yerlesim = { kap: string; birincil: string; /** İkinci karttan itibaren kart başına sınıf. */ digerleri?: readonly string[] };

const ORTA_UCLU = "@min-[576px]:col-span-2 @min-[1200px]:col-span-1";

const YERLESIM: Record<1 | 2 | 3 | 4 | 6, Yerlesim> = {
  1: { kap: "grid-cols-1", birincil: "" },
  2: { kap: "grid-cols-1 @min-[576px]:grid-cols-3", birincil: "@min-[576px]:col-span-2" },
  3: { kap: "grid-cols-2 @min-[784px]:grid-cols-4", birincil: "col-span-2" },
  4: {
    kap: "grid-cols-2 @min-[576px]:grid-cols-3 @min-[984px]:grid-cols-5",
    birincil: "col-span-2 @min-[576px]:col-span-3 @min-[984px]:col-span-2",
  },
  6: {
    kap: "grid-cols-2 @min-[576px]:grid-cols-6 @min-[1200px]:grid-cols-7",
    birincil: "col-span-2 @min-[576px]:col-span-6 @min-[1200px]:col-span-2",
    digerleri: [
      ORTA_UCLU,
      ORTA_UCLU,
      ORTA_UCLU,
      "@min-[576px]:col-span-3 @min-[1200px]:col-span-1",
      "col-span-2 @min-[576px]:col-span-3 @min-[1200px]:col-span-1",
    ],
  },
};

/** Kart sayısının yerleşimi; desteklenmeyen sayıda hata (görünmeyen KPI okunmaz). */
export function kpiYerlesimi(adet: number): Yerlesim {
  if (!(adet in YERLESIM)) throw new Error(`KPI satırında 1–4 ya da 6 kart olur; ${adet} verildi.`);
  return YERLESIM[adet as keyof typeof YERLESIM];
}

/** `i`. kartın sınıfı (0 birincildir). */
export function kartSinifi(yer: Yerlesim, i: number): string {
  return i === 0 ? yer.birincil : (yer.digerleri?.[i - 1] ?? "");
}

export function KpiSatiri({ children }: { children: React.ReactNode }) {
  const kartlar = Children.toArray(children);
  const yer = kpiYerlesimi(kartlar.length);
  return (
    <div className="@container mb-6">
      <div data-kpi-satiri={kartlar.length} className={`grid gap-4 ${yer.kap}`}>
        {kartlar.map((kart, i) => (
          <div key={i} className={`min-w-0 ${kartSinifi(yer, i)}`}>
            {kart}
          </div>
        ))}
      </div>
    </div>
  );
}

