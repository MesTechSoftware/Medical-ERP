import Decimal from "decimal.js";
import type { ParaDegeri } from "@/lib/money";

/**
 * `hesaplaSatirTutarlari()` — satır hesabı ve yuvarlamanın TEK noktası (C-6 §(5)).
 * Tek çağrı noktası listesinin 8. maddesi; bu, `CM` ilk sürümüdür. Bedelsiz satır
 * ayrıntısı, kısmi sevkiyat ve taban etiketi 1B madde 5'te tamamlanır.
 *
 * Kurallar:
 * - Kanonik taban KDV hariçtir; KDV hiçbir yerde saklanmaz, burada türetilir (C-6 §(3)).
 * - Yuvarlama 2 hane, yarım sıfırdan uzağa (X-5 §(7)) — yalnız matrah ve KDV'de.
 * - Belge toplamı satır toplamlarının toplamıdır; yeniden yuvarlanmaz (C-6 §(5)).
 * - Bedelsiz satırın tutarı 0, KDV'si 0'dır (A-2, C-6 §(8)); iskonto ortalamasına girmez.
 * - İskonto oranı saklanmaz, burada türetilir (X-5 §(10)). Liste üstü satışta negatiftir.
 *
 * Saf fonksiyondur: sunucu ve istemci (sipariş formu önizlemesi) aynı hesabı kullanır.
 * X-5 §(4): parasal aritmetiğe izin verilen iki dosyadan biridir.
 */

const D = Decimal.clone({ rounding: Decimal.ROUND_HALF_UP });

export type SatirGirdisi = {
  /** Satıcının girdiği net birim fiyat (X-5 §(9) `birim_fiyat`). */
  birimFiyat: ParaDegeri;
  /** `cozumleBirimFiyat()` çıktısı (X-5 §(9) `liste_fiyat`). */
  listeFiyat: ParaDegeri;
  miktar: number;
  /** Yüzde, ör. 20 (C-6 §(2-a): satıra değer olarak donar). */
  kdvOrani: ParaDegeri;
  bedelsiz?: boolean;
};

export type SatirTutari = {
  matrah: Decimal;
  kdvTutar: Decimal;
  toplam: Decimal;
  /** Yüzde, 2 hane. Bedelsiz satırda ve liste fiyatı 0 ise `null`. */
  iskontoOran: Decimal | null;
};

export type BelgeTutari = {
  matrah: Decimal;
  kdvTutar: Decimal;
  toplam: Decimal;
  /** Tutar ağırlıklı ortalama iskonto (%); hesaba giren satır yoksa `null`. */
  iskontoOran: Decimal | null;
};

const SIFIR = new D(0);

function iskonto(liste: Decimal, birim: Decimal): Decimal | null {
  if (liste.lte(0)) return null;
  return liste.minus(birim).div(liste).times(100).toDecimalPlaces(2);
}

export function hesaplaSatirTutarlari(satirlar: readonly SatirGirdisi[]): {
  satirlar: SatirTutari[];
  toplam: BelgeTutari;
} {
  let matrahT = SIFIR;
  let kdvT = SIFIR;
  let listeT = SIFIR;
  let birimT = SIFIR;

  const sonuc = satirlar.map((s) => {
    if (!Number.isInteger(s.miktar) || s.miktar <= 0) {
      throw new Error(`Geçersiz miktar: ${s.miktar}`);
    }
    const oran = new D(s.kdvOrani as Decimal.Value);
    if (oran.isNegative() || oran.gt(100)) {
      throw new Error(`Geçersiz KDV oranı: ${oran.toFixed()}`);
    }
    if (s.bedelsiz) {
      return { matrah: SIFIR, kdvTutar: SIFIR, toplam: SIFIR, iskontoOran: null };
    }

    const birim = new D(s.birimFiyat as Decimal.Value);
    const liste = new D(s.listeFiyat as Decimal.Value);
    const matrah = birim.times(s.miktar).toDecimalPlaces(2);
    const kdvTutar = matrah.times(oran).div(100).toDecimalPlaces(2);
    const toplam = matrah.plus(kdvTutar);

    matrahT = matrahT.plus(matrah);
    kdvT = kdvT.plus(kdvTutar);
    listeT = listeT.plus(liste.times(s.miktar));
    birimT = birimT.plus(birim.times(s.miktar));

    return { matrah, kdvTutar, toplam, iskontoOran: iskonto(liste, birim) };
  });

  return {
    satirlar: sonuc,
    toplam: {
      matrah: matrahT,
      kdvTutar: kdvT,
      toplam: matrahT.plus(kdvT),
      iskontoOran: iskonto(listeT, birimT),
    },
  };
}

/**
 * Tahsilat komisyon tutarı (A-11): `tutar × oran / 100`, 2 hane, aynı yuvarlama modu.
 * ⚠️ Açık nokta: X-5 §(4) parasal aritmetiği iki fonksiyonla sınırlar ve A-11'in
 * komisyon tutarı bu ikisinin dışında kalır. Yuvarlamanın tek noktası korunsun diye
 * `CM`'de buraya kondu; yeri 1B madde 7'de (A-11) karara bağlanır.
 */
export function hesaplaKomisyonTutari(tutar: ParaDegeri, oran: ParaDegeri): Decimal {
  return new D(tutar as Decimal.Value)
    .times(new D(oran as Decimal.Value))
    .div(100)
    .toDecimalPlaces(2);
}
