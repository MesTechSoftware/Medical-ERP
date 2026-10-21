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
 * - Ters satır (`ters`, A-1 iade) aynı hesapla yuvarlanır ve toplamdan düşülür; tutarları
 *   eksidir, iskonto ortalamasına girmez. Ciro/hakediş netlemesi böyle yapılır.
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
  /** Sevkiyat satırına donmuş prim oranı, yüzde (X-14 §(3)); boşsa hakediş doğmaz. */
  primOrani?: ParaDegeri | null;
  /** Toplamdan düşülen satır (A-1 iade): tutarları eksi döner, iskonto ortalamasına girmez. */
  ters?: boolean;
};

export type SatirTutari = {
  matrah: Decimal;
  kdvTutar: Decimal;
  toplam: Decimal;
  /** Yüzde, 2 hane. Bedelsiz satırda ve liste fiyatı 0 ise `null`. */
  iskontoOran: Decimal | null;
  /** Matrah × donmuş oran / 100, 2 hane (X-14 §(4), C-6 §(6)). */
  hakedis: Decimal;
};

export type BelgeTutari = {
  matrah: Decimal;
  kdvTutar: Decimal;
  toplam: Decimal;
  /** Tutar ağırlıklı ortalama iskonto (%); hesaba giren satır yoksa `null`. */
  iskontoOran: Decimal | null;
  /** Satır hakedişlerinin toplamı (X-1). */
  hakedis: Decimal;
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
  let hakedisT = SIFIR;

  const sonuc = satirlar.map((s) => {
    if (!Number.isInteger(s.miktar) || s.miktar <= 0) {
      throw new Error(`Geçersiz miktar: ${s.miktar}`);
    }
    const oran = new D(s.kdvOrani as Decimal.Value);
    if (oran.isNegative() || oran.gt(100)) {
      throw new Error(`Geçersiz KDV oranı: ${oran.toFixed()}`);
    }
    const primOrani = s.primOrani == null ? null : new D(s.primOrani as Decimal.Value);
    if (primOrani && (primOrani.isNegative() || primOrani.gt(100))) {
      throw new Error(`Geçersiz prim oranı: ${primOrani.toFixed()}`);
    }
    if (s.bedelsiz) {
      return { matrah: SIFIR, kdvTutar: SIFIR, toplam: SIFIR, iskontoOran: null, hakedis: SIFIR };
    }

    const birim = new D(s.birimFiyat as Decimal.Value);
    const liste = new D(s.listeFiyat as Decimal.Value);
    // Yuvarlama işaretten önce: ters satır, aynı satırın tutarının tam eksisidir.
    const isaret = s.ters ? -1 : 1;
    const matrah = birim.times(s.miktar).toDecimalPlaces(2).times(isaret);
    const kdvTutar = matrah.abs().times(oran).div(100).toDecimalPlaces(2).times(isaret);
    const toplam = matrah.plus(kdvTutar);
    const hakedis = primOrani ? matrah.abs().times(primOrani).div(100).toDecimalPlaces(2).times(isaret) : SIFIR;

    matrahT = matrahT.plus(matrah);
    kdvT = kdvT.plus(kdvTutar);
    if (!s.ters) {
      listeT = listeT.plus(liste.times(s.miktar));
      birimT = birimT.plus(birim.times(s.miktar));
    }
    hakedisT = hakedisT.plus(hakedis);

    return { matrah, kdvTutar, toplam, iskontoOran: s.ters ? null : iskonto(liste, birim), hakedis };
  });

  return {
    satirlar: sonuc,
    toplam: {
      matrah: matrahT,
      kdvTutar: kdvT,
      toplam: matrahT.plus(kdvT),
      iskontoOran: iskonto(listeT, birimT),
      hakedis: hakedisT,
    },
  };
}

/**
 * Tahsilat komisyon tutarı (A-11): `tutar × oran / 100`, 2 hane, aynı yuvarlama modu.
 * Yeri burasıdır (1B-7b): X-5 §(4)'ün iki dosyalık aritmetik sınırı içinde kalır ve
 * yuvarlama modu satır hesabıyla tek noktada tanımlıdır. Komisyon cariye dokunmaz (A-11).
 */
export function hesaplaKomisyonTutari(tutar: ParaDegeri, oran: ParaDegeri): Decimal {
  return new D(tutar as Decimal.Value)
    .times(new D(oran as Decimal.Value))
    .div(100)
    .toDecimalPlaces(2);
}

/**
 * Açılış bakiyesi önizlemesinin toplamları (D-6 eki 24.09.2026): toplam borç, toplam alacak ve net
 * (borç − alacak, mutlak değer + yön). Tutarlar brüttür ve zaten 2 hanedir; yuvarlanmaz. Aritmetik X-5 §(4) gereği buradadır.
 */
export function acilisToplamlari(satirlar: readonly { tutar: ParaDegeri; yon: "BORC" | "ALACAK" }[]): {
  borc: Decimal;
  alacak: Decimal;
  /** Mutlak değer; yön ayrı (K-2: çıplak negatif gösterilmez). */
  net: Decimal;
  netYon: "BORC" | "ALACAK" | "KAPALI";
} {
  let borc = SIFIR;
  let alacak = SIFIR;
  for (const s of satirlar) {
    if (s.yon === "BORC") borc = borc.plus(new D(s.tutar as Decimal.Value));
    else alacak = alacak.plus(new D(s.tutar as Decimal.Value));
  }
  const fark = borc.minus(alacak);
  return { borc, alacak, net: fark.abs(), netYon: fark.isZero() ? "KAPALI" : fark.isNegative() ? "ALACAK" : "BORC" };
}
