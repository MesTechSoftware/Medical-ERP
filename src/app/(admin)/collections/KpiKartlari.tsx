import Link from "next/link";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import type { KpiSonucu } from "@/lib/kpi/getir";
import { aralikEtiketi } from "@/lib/liste/parametreler";
import { BRUT } from "@/lib/taban";
import type { TahsilatKpileri } from "@/lib/tahsilat-listesi/sorgu";
import { TIP_ADI, kartAdresi, type TahsilatTipi, type kpiAraligi } from "@/lib/tahsilat-listesi/suzgec";

const KART = "block h-full rounded-xl transition hover:opacity-90";

type Aralik = ReturnType<typeof kpiAraligi>;

/** Kartların alt notu: varsayılan aralık "Bu ay", yoksa süzgecin gün aralığı. */
export function kpiDonemNotu(a: Aralik): string {
  return a.varsayilan ? "Bu ay" : aralikEtiketi(a.baslangic, a.bitis);
}

export const adetMetni = (adet: number) => `${adet} tahsilat`;

/** Kart sırası ve etiketleri (iskelet de okur). */
export const KARTLAR: readonly { tip: TahsilatTipi | null; etiket: string }[] = [
  { tip: null, etiket: "Tahsilat" },
  { tip: "NAKIT", etiket: TIP_ADI.NAKIT },
  { tip: "BANKA", etiket: TIP_ADI.BANKA },
  { tip: "POS", etiket: TIP_ADI.POS },
];

function Kart({
  tip,
  etiket,
  k,
  aralik,
  donemNotu,
  hataReferansi,
  birincil,
}: {
  tip: TahsilatTipi | null;
  etiket: string;
  k: TahsilatKpileri | null;
  aralik: Aralik;
  donemNotu: string;
  hataReferansi: string | undefined;
  birincil?: boolean;
}) {
  const o = k ? (tip ? k[tip] : k.toplam) : null;
  return (
    <Link href={kartAdresi(tip, aralik)} className={KART}>
      <KpiCard
        etiket={etiket}
        varyant={birincil ? "birincil" : "ikincil"}
        iyiYon="yukari-iyi"
        bosDavranisi="sifir"
        tutar={o ? o.tutar : null}
        taban={BRUT}
        ikincilMetrik={o ? adetMetni(o.adet) : undefined}
        donemNotu={donemNotu}
        hataReferansi={hataReferansi}
      />
    </Link>
  );
}

/**
 * Tahsilat ekranının üst kartları (spec Ü-26 §3.2): aralıktaki aktif tahsilatlar, toplam ve yöntem tipi
 * başına (tutar tabanı `BRUT`). Durum, tip ve metin süzgecinden bağımsızdır. Kart saydığı aralığı adrese yazar;
 * açtığı listenin toplam satırı kartın tutarına eşittir (A-11-2).
 */
export function KpiKartlari({ sonuc, aralik }: { sonuc: KpiSonucu<TahsilatKpileri>; aralik: Aralik }) {
  const k = sonuc.tamam ? sonuc.deger : null;
  const hataReferansi = sonuc.tamam ? undefined : sonuc.referans;
  const donemNotu = kpiDonemNotu(aralik);
  return (
    <section aria-label="Tahsilat sayıları">
      <KpiSatiri>
        <Kart tip={null} etiket={KARTLAR[0].etiket} k={k} aralik={aralik} donemNotu={donemNotu} hataReferansi={hataReferansi} birincil />
        <Kart tip="NAKIT" etiket={KARTLAR[1].etiket} k={k} aralik={aralik} donemNotu={donemNotu} hataReferansi={hataReferansi} />
        <Kart tip="BANKA" etiket={KARTLAR[2].etiket} k={k} aralik={aralik} donemNotu={donemNotu} hataReferansi={hataReferansi} />
        <Kart tip="POS" etiket={KARTLAR[3].etiket} k={k} aralik={aralik} donemNotu={donemNotu} hataReferansi={hataReferansi} />
      </KpiSatiri>
    </section>
  );
}
