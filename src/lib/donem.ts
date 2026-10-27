import { ayAraligi, geceYarisi, simdi, takvimAyi, takvimGunu, TUM_ZAMANLAR } from "@/lib/zaman";

export type Aralik = { baslangic: Date; bitis: Date };

export type Donem = { anahtar: string; aralik: Aralik };

/** Seri kovası (gün, hafta ya da ay): yarı açık aralık; `an` içindeyse kova devam ediyor. */
export type Kova = { aralik: Aralik; devamEdiyor: boolean };

/** Bir takvim ayı: yarı açık aralığı ve `an`ın o ayın içinde olup olmadığı (devam eden ay). */
export type Ay = Kova & { yil: number; ay: number };

/**
 * Rapor ekranının `?donem=` parametresi (X-1 §(2)): `YYYY-AA` bir takvim ayıdır, `tum`
 * tüm zamanlardır. Parametre yoksa ya da geçersizse içinde bulunulan ay.
 */
export function donemCoz(param: string | undefined, an: Date = simdi()): Donem {
  if (param === "tum") return { anahtar: "tum", aralik: TUM_ZAMANLAR };
  const m = param?.match(/^(\d{4})-(\d{2})$/);
  const ay = m ? parseInt(m[2], 10) : 0;
  if (m && ay >= 1 && ay <= 12) return { anahtar: param!, aralik: ayAraligi(parseInt(m[1], 10), ay) };
  const simdiki = takvimAyi(an);
  const anahtar = `${simdiki.yil}-${String(simdiki.ay).padStart(2, "0")}`;
  return { anahtar, aralik: ayAraligi(simdiki.yil, simdiki.ay) };
}

function oncekiAy(yil: number, ay: number): { yil: number; ay: number } {
  return ay === 1 ? { yil: yil - 1, ay: 12 } : { yil, ay: ay - 1 };
}

/** `bitis` ayıyla biten son `n` takvim ayı, eskiden yeniye (KPI ve mikro grafik serileri). */
export function sonAylar(n: number, bitis: { yil: number; ay: number }, an: Date = simdi()): Ay[] {
  const aylar: Ay[] = [];
  let yer = bitis;
  for (let i = 0; i < n; i++) {
    const aralik = ayAraligi(yer.yil, yer.ay);
    const devamEdiyor = an.getTime() >= aralik.baslangic.getTime() && an.getTime() < aralik.bitis.getTime();
    aylar.unshift({ yil: yer.yil, ay: yer.ay, aralik, devamEdiyor });
    yer = oncekiAy(yer.yil, yer.ay);
  }
  return aylar;
}

/**
 * KPI karşılaştırma aralıkları (K-1, aynı gün aralığı). Devam eden ayda: ay başından `an`a kadar,
 * önceki ayın aynı uzunluktaki başı ile kıyaslanır (önceki ay kısaysa ay sonuna kırpılır).
 * Geçmiş ya da gelecek ay: tam ay, önceki tam ayla. "Tüm zamanlar"ın karşılaştırması yoktur.
 */
export function karsilastirmaAraliklari(
  donem: Donem,
  an: Date = simdi()
): { simdi: Aralik; onceki: Aralik | null; devamEdiyor: boolean } {
  if (donem.anahtar === "tum") return { simdi: donem.aralik, onceki: null, devamEdiyor: false };
  const [yil, ay] = donem.anahtar.split("-").map((x) => parseInt(x, 10));
  const o = oncekiAy(yil, ay);
  const onceki = ayAraligi(o.yil, o.ay);
  const { baslangic, bitis } = donem.aralik;
  if (an.getTime() >= baslangic.getTime() && an.getTime() < bitis.getTime()) {
    const gecen = an.getTime() - baslangic.getTime();
    const oncekiBitis = new Date(Math.min(onceki.baslangic.getTime() + gecen, onceki.bitis.getTime()));
    return { simdi: { baslangic, bitis: an }, onceki: { baslangic: onceki.baslangic, bitis: oncekiBitis }, devamEdiyor: true };
  }
  return { simdi: donem.aralik, onceki, devamEdiyor: false };
}

/** KPI karşılaştırma notu (K-1): devam eden ay geçen ayın aynı günleriyle, geçmiş ay önceki tam ayla. */
export function karsilastirmaNotu(devamEdiyor: boolean): string {
  return devamEdiyor ? "geçen ayın aynı günlerine göre" : "önceki aya göre";
}

/** Dönemin son takvim ayı (KPI trendi bu ayla biter); "tüm zamanlar"da içinde bulunulan ay. */
export function donemBitisAyi(donem: Donem, an: Date = simdi()): { yil: number; ay: number } {
  if (donem.anahtar === "tum") return takvimAyi(an);
  const [yil, ay] = donem.anahtar.split("-").map((x) => parseInt(x, 10));
  return { yil, ay };
}

/** Dashboard zaman filtresi (K-D2): URL `?aralik=`; anlık KPI'lar filtreden etkilenmez. */
export const ARALIKLAR = ["bugun", "hafta", "ay", "yil"] as const;

export type AralikAnahtari = (typeof ARALIKLAR)[number];

export type KovaTuru = "gun" | "hafta" | "ay";

/** `?aralik=` parametresi; yoksa ya da geçersizse "bu ay" (K-D2 varsayılanı). */
export function aralikCoz(param: string | undefined): AralikAnahtari {
  return ARALIKLAR.find((a) => a === param) ?? "ay";
}

export type DashboardAraligi = {
  anahtar: AralikAnahtari;
  /** Aralık başından `an`a. */
  simdi: Aralik;
  /** Karşılaştırma: önceki dönemin aynı uzunluktaki başı. */
  onceki: Aralik;
  kovaTuru: KovaTuru;
  /** Mikro grafik kovaları, eskiden yeniye; son kova devam ediyor. */
  kovalar: Kova[];
  donemNotu: string;
  karsilastirmaNotu: string;
  seriBasligi: string;
};

const NOTLAR: Record<AralikAnahtari, Pick<DashboardAraligi, "donemNotu" | "karsilastirmaNotu" | "seriBasligi">> = {
  bugun: { donemNotu: "Bugün", karsilastirmaNotu: "dünün aynı saatine göre", seriBasligi: "Son 14 gün" },
  hafta: { donemNotu: "Bu hafta", karsilastirmaNotu: "geçen haftanın aynı günlerine göre", seriBasligi: "Son 14 gün" },
  ay: { donemNotu: "Bu ay", karsilastirmaNotu: karsilastirmaNotu(true), seriBasligi: "Son 12 hafta" },
  yil: { donemNotu: "Bu yıl", karsilastirmaNotu: "geçen yılın aynı günlerine göre", seriBasligi: "Son 12 ay" },
};

type Gun = { yil: number; ay: number; gun: number };

/** Takvim gününün ISO hafta günü: Pazartesi 0 … Pazar 6 (dilimden bağımsız takvim hesabı). */
function haftaGunu(g: Gun): number {
  return (new Date(Date.UTC(g.yil, g.ay - 1, g.gun)).getUTCDay() + 6) % 7;
}

/** Ayın gün sayısı (takvim hesabı). */
function aySonGunu(yil: number, ay: number): number {
  return new Date(Date.UTC(yil, ay, 0)).getUTCDate();
}

/** Son kovası `son` günüyle başlayan `adet` kova, her biri `adim` gün; eskiden yeniye. */
function gunKovalari(adet: number, adim: number, son: Gun, an: Date): Kova[] {
  return Array.from({ length: adet }, (_, i) => {
    const gun = son.gun - adim * (adet - 1 - i);
    const aralik = { baslangic: geceYarisi(son.yil, son.ay, gun), bitis: geceYarisi(son.yil, son.ay, gun + adim) };
    return { aralik, devamEdiyor: an.getTime() >= aralik.baslangic.getTime() && an.getTime() < aralik.bitis.getTime() };
  });
}

/** Önceki dönemin, şimdiki dönemin `an`a kadar geçen süresi kadar başı. */
function ayniSureyle(oncekiBasi: Date, baslangic: Date, an: Date): Date {
  return new Date(oncekiBasi.getTime() + (an.getTime() - baslangic.getTime()));
}

/**
 * Dashboard zaman filtresinin aralıkları (K-D2, brief §4.1). Sınırlar dilimdeki gün başlarıdır (E-1);
 * karşılaştırma önceki dönemin aynı uzunluktaki başıdır:
 * - bugün: gün başı → an; dünün aynı saatine kadarla; 14 günlük kova;
 * - bu hafta: Pazartesi 00:00 → an; geçen haftanın aynı gün ve saatine kadarla; 14 günlük kova;
 * - bu ay: K-1 (`karsilastirmaAraliklari`); 12 haftalık kova;
 * - bu yıl: 1 Ocak → an; geçen yılın aynı gün ve saatine kadarla (29 Şubat → 28 Şubat); 12 aylık kova.
 */
export function dashboardAraligi(anahtar: AralikAnahtari, an: Date = simdi()): DashboardAraligi {
  const g = takvimGunu(an);
  const bugunBasi = geceYarisi(g.yil, g.ay, g.gun);
  const pazartesi = { ...g, gun: g.gun - haftaGunu(g) };
  const ortak = { anahtar, ...NOTLAR[anahtar] };
  switch (anahtar) {
    case "bugun": {
      const dun = geceYarisi(g.yil, g.ay, g.gun - 1);
      return {
        ...ortak,
        simdi: { baslangic: bugunBasi, bitis: an },
        onceki: { baslangic: dun, bitis: ayniSureyle(dun, bugunBasi, an) },
        kovaTuru: "gun",
        kovalar: gunKovalari(14, 1, g, an),
      };
    }
    case "hafta": {
      const bas = geceYarisi(pazartesi.yil, pazartesi.ay, pazartesi.gun);
      const gecen = geceYarisi(pazartesi.yil, pazartesi.ay, pazartesi.gun - 7);
      return {
        ...ortak,
        simdi: { baslangic: bas, bitis: an },
        onceki: { baslangic: gecen, bitis: ayniSureyle(gecen, bas, an) },
        kovaTuru: "gun",
        kovalar: gunKovalari(14, 1, g, an),
      };
    }
    case "ay": {
      const k = karsilastirmaAraliklari(donemCoz(undefined, an), an);
      return { ...ortak, simdi: k.simdi, onceki: k.onceki!, kovaTuru: "hafta", kovalar: gunKovalari(12, 7, pazartesi, an) };
    }
    case "yil": {
      const gecenYilGunu = geceYarisi(g.yil - 1, g.ay, Math.min(g.gun, aySonGunu(g.yil - 1, g.ay)));
      return {
        ...ortak,
        simdi: { baslangic: geceYarisi(g.yil, 1, 1), bitis: an },
        onceki: { baslangic: geceYarisi(g.yil - 1, 1, 1), bitis: ayniSureyle(gecenYilGunu, bugunBasi, an) },
        kovaTuru: "ay",
        kovalar: sonAylar(12, { yil: g.yil, ay: g.ay }, an),
      };
    }
  }
}
