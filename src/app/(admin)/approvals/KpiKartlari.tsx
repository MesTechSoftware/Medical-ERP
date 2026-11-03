import Link from "next/link";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import { goreliZaman } from "@/lib/format";
import type { KpiSonucu } from "@/lib/kpi/getir";
import type { OnayKpileri } from "@/lib/onay-listesi/sorgu";
import { kartAdresleri } from "@/lib/onay-listesi/suzgec";

const KART = "block h-full rounded-xl transition hover:opacity-90";

/** Birincil kartın ikincil metriği: en eski bekleyen talebin yaşı. */
export function enEskiMetni(enEski: Date | null, an: Date): string {
  return enEski ? `en eskisi ${goreliZaman(enEski, an)}` : "bekleyen yok";
}

/**
 * Onay ekranının üst kartları (spec Ü-25 §3.2): süzgeçten bağımsız. "24 saatten eski" dashboard istisnasıyla,
 * bugünkü kararlar karar gününün süzgeciyle aynı koşuldan sayılır — kart = satır (A-8-11).
 */
export function KpiKartlari({ sonuc, bugun, an }: { sonuc: KpiSonucu<OnayKpileri>; bugun: string; an: Date }) {
  const k = sonuc.tamam ? sonuc.deger : null;
  const hataReferansi = sonuc.tamam ? undefined : sonuc.referans;
  const adres = kartAdresleri(bugun);
  return (
    <section aria-label="Onay sayıları">
      <KpiSatiri>
        <KpiCard
          etiket="Onay bekleyen"
          varyant="birincil"
          iyiYon="asagi-iyi"
          bosDavranisi="sifir"
          adet={k ? k.bekleyen : null}
          ikincilMetrik={k ? enEskiMetni(k.enEski, an) : undefined}
          karsilastirma={{ anlik: "şu an" }}
          vurgu={k && k.bekleyen > 0 ? "uyari" : undefined}
          hataReferansi={hataReferansi}
        />
        <Link href={adres.eski} className={KART}>
          <KpiCard
            etiket="24 saatten eski"
            varyant="ikincil"
            iyiYon="asagi-iyi"
            bosDavranisi="sifir"
            adet={k ? k.eski : null}
            karsilastirma={{ anlik: "şu an" }}
            vurgu={k && k.eski > 0 ? "uyari" : undefined}
            hataReferansi={hataReferansi}
          />
        </Link>
        <Link href={adres.bugunOnay} className={KART}>
          <KpiCard etiket="Bugün onaylanan" varyant="ikincil" iyiYon="notr" bosDavranisi="sifir" adet={k ? k.bugunOnay : null} karsilastirma={{ anlik: "bugün" }} hataReferansi={hataReferansi} />
        </Link>
        <Link href={adres.bugunRed} className={KART}>
          <KpiCard etiket="Bugün reddedilen" varyant="ikincil" iyiYon="notr" bosDavranisi="sifir" adet={k ? k.bugunRed : null} karsilastirma={{ anlik: "bugün" }} hataReferansi={hataReferansi} />
        </Link>
      </KpiSatiri>
    </section>
  );
}
