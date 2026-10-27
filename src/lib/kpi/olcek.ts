import Decimal from "decimal.js";

/**
 * Gösterim ölçeği (X-5 eki, 26.10.2026): KPI dönem değişim yüzdesi ve mikro grafik geometrisi.
 * YALNIZ GÖSTERİMDİR; kayda ve hesaba girmez. Bu dosya parasal tutar üretmez — dışarıya yalnız
 * boyutsuz değer (yüzde, oran, SVG koordinatı) verir. `Decimal` bölmesi ve `number`'a çevirme
 * uygulamada yalnız burada ve X-5 §(4)'ün kendi dosyalarında geçer (`olcek.test.ts` tarar).
 */

/** Girdi: Prisma ya da decimal.js `Decimal`, metin, sayı; `null` boşluktur (veri yok). */
export type OlcekGirdisi = Decimal.Value | { toFixed(dp?: number): string } | null;

export type Degisim =
  | { tur: "yuzde"; deger: number }
  | { tur: "yeni" }
  | { tur: "yok" };

export type Yon = "artis" | "azalis" | "esit";

export type Alan = { genislik: number; yukseklik: number };
export type Nokta = { x: number; y: number };

function ondalik(deger: Exclude<OlcekGirdisi, null>): Decimal {
  if (deger instanceof Decimal || typeof deger === "string" || typeof deger === "number") {
    return new Decimal(deger);
  }
  if (typeof deger === "bigint") return new Decimal(deger.toString());
  return new Decimal(deger.toFixed());
}

/** Tek yuvarlama noktası: yarım yukarı, `basamak` ondalık; sonuç boyutsuz `number`. */
function yuvarla(deger: Decimal, basamak: number): number {
  return deger.toDecimalPlaces(basamak, Decimal.ROUND_HALF_UP).toNumber();
}

/** İki değerin yönü (aritmetik yok, yalnız karşılaştırma); değerlerden biri yoksa `null`. */
export function yon(simdi: OlcekGirdisi, onceki: OlcekGirdisi): Yon | null {
  if (simdi === null || onceki === null) return null;
  const k = ondalik(simdi).comparedTo(ondalik(onceki));
  return k > 0 ? "artis" : k < 0 ? "azalis" : "esit";
}

/**
 * Önceki döneme göre değişim yüzdesi, 1 ondalık. Taban 0 ise yüzde yoktur: şimdi pozitifse
 * "yeni", ikisi de 0 ise %0. Negatif tabanda (iadesi sevkinden büyük dönem) yüzde anlamsızdır.
 */
export function degisimYuzdesi(simdi: OlcekGirdisi, onceki: OlcekGirdisi): Degisim {
  if (simdi === null || onceki === null) return { tur: "yok" };
  const s = ondalik(simdi);
  const o = ondalik(onceki);
  if (o.isZero()) {
    if (s.isZero()) return { tur: "yuzde", deger: 0 };
    return s.isPositive() ? { tur: "yeni" } : { tur: "yok" };
  }
  if (o.isNegative()) return { tur: "yok" };
  return { tur: "yuzde", deger: yuvarla(s.minus(o).div(o).times(100), 1) };
}

/**
 * Seriyi SVG alanına yerleştirir; koordinatlar 0,1 px'e yuvarlanır. `null` boşluktur, araya
 * nokta uydurulmaz. Ölçek sıfırı içerir: sıfır çizgisi (`tabanY`) daima alandadır, negatif değer
 * onun altına düşer. Bütün değerler eşit ve sıfırsa çizgi alanın ortasındadır.
 */
export function olcekle(seri: readonly OlcekGirdisi[], alan: Alan): { noktalar: (Nokta | null)[]; tabanY: number } {
  const degerler = seri.map((d) => (d === null ? null : ondalik(d)));
  const dolu = degerler.filter((d): d is Decimal => d !== null);
  const sifir = new Decimal(0);
  const enKucuk = Decimal.min(sifir, ...dolu);
  const aralik = Decimal.max(sifir, ...dolu).minus(enKucuk);
  const yukseklik = new Decimal(alan.yukseklik);
  const genislik = new Decimal(alan.genislik);
  const yAl = (d: Decimal) =>
    aralik.isZero()
      ? yuvarla(yukseklik.div(2), 1)
      : yuvarla(yukseklik.minus(d.minus(enKucuk).div(aralik).times(yukseklik)), 1);
  const n = degerler.length;
  const xAl = (i: number) => (n <= 1 ? yuvarla(genislik.div(2), 1) : yuvarla(genislik.times(i).div(n - 1), 1));
  return {
    noktalar: degerler.map((d, i) => (d === null ? null : { x: xAl(i), y: yAl(d) })),
    tabanY: yAl(sifir),
  };
}

/** Medyan hazırlama süresinin en az örneği (brief §4.2): birkaç değerin ortası tipik süre değildir. */
export const MEDYAN_EN_AZ_ORNEK = 5;

const GUN_MS = 86_400_000;

/**
 * Sürelerin (ms) medyanı, gün cinsinden 1 ondalık (yarım yukarı); çift sayıda örnekte ortadaki
 * ikisinin ortalaması. Örnek `MEDYAN_EN_AZ_ORNEK`ten azsa `null` (ekranda "Yetersiz veri").
 */
export function medyanGun(sureler: readonly number[]): number | null {
  if (sureler.length < MEDYAN_EN_AZ_ORNEK) return null;
  const s = [...sureler].sort((a, b) => a - b);
  const orta = Math.floor(s.length / 2);
  const medyan = s.length % 2 === 1 ? new Decimal(s[orta]) : new Decimal(s[orta - 1]).plus(s[orta]).div(2);
  return yuvarla(medyan.div(GUN_MS), 1);
}

/**
 * Yığılmış oran çubuğunun oranları (brief §3.3): her adetin toplama oranı, 0,001'e yuvarlı ve
 * toplamı tam 1 — yuvarlama kalanı en büyük kesirlere dağıtılır (eşitlikte öndekine), çubukta boşluk
 * ya da taşma kalmaz. Adetler tam sayıdır; bölme kalanlı tam sayı bölmesidir. Toplam 0 ise hepsi 0.
 */
export function yigilmisOranlar(adetler: readonly number[]): number[] {
  const toplam = adetler.reduce((a, b) => a + b, 0);
  if (toplam <= 0) return adetler.map(() => 0);
  const binde = adetler.map((a) => Math.floor((a * 1000) / toplam));
  let kalan = 1000 - binde.reduce((a, b) => a + b, 0);
  const sira = adetler
    .map((a, i) => ({ i, kesir: (a * 1000) % toplam }))
    .sort((x, y) => y.kesir - x.kesir || x.i - y.i);
  for (const { i } of sira) {
    if (kalan <= 0) break;
    binde[i] += 1;
    kalan -= 1;
  }
  return binde.map((b) => b / 1000);
}

/** Çubuk oranları [0, 1]: her değerin en büyük değere oranı, 0,001'e yuvarlı. Sıfır ve negatif 0, boşluk `null`. */
export function cubukOranlari(degerler: readonly OlcekGirdisi[]): (number | null)[] {
  const d = degerler.map((x) => (x === null ? null : ondalik(x)));
  const enBuyuk = Decimal.max(new Decimal(0), ...d.filter((x): x is Decimal => x !== null));
  return d.map((x) => {
    if (x === null) return null;
    if (enBuyuk.isZero() || x.lte(0)) return 0;
    return yuvarla(x.div(enBuyuk), 3);
  });
}
