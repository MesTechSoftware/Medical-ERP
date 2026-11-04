import Link from "next/link";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import type { KpiSonucu } from "@/lib/kpi/getir";
import type { PartiKpileri } from "@/lib/ice-aktarim-listesi/sorgu";
import { kartAdresleri } from "@/lib/ice-aktarim-listesi/suzgec";

const KART = "block h-full rounded-xl transition hover:opacity-90";

/** İçe aktarım ekranının üst kartları (spec Ü-30 §3.1): süzgeçten bağımsız, anlık; kart = açtığı süzgecin satırı (X-12-2). */
export function KpiKartlari({ sonuc, bugun }: { sonuc: KpiSonucu<PartiKpileri>; bugun: string }) {
  const k = sonuc.tamam ? sonuc.deger : null;
  const hataReferansi = sonuc.tamam ? undefined : sonuc.referans;
  const adres = kartAdresleri(bugun);
  return (
    <section aria-label="Parti sayıları">
      <KpiSatiri>
        <Link href={adres.tumu} className={KART}>
          <KpiCard etiket="Parti" varyant="birincil" iyiYon="notr" bosDavranisi="sifir" adet={k ? k.tumu : null} karsilastirma={{ anlik: "şu an" }} hataReferansi={hataReferansi} />
        </Link>
        <Link href={adres.buAy} className={KART}>
          <KpiCard etiket="Bu ay" varyant="ikincil" iyiYon="notr" bosDavranisi="sifir" adet={k ? k.buAy : null} karsilastirma={{ anlik: "bu ay" }} hataReferansi={hataReferansi} />
        </Link>
        <Link href={adres.geriAlinabilir} className={KART}>
          <KpiCard etiket="Geri alınabilir" varyant="ikincil" iyiYon="notr" bosDavranisi="sifir" adet={k ? k.geriAlinabilir : null} karsilastirma={{ anlik: "şu an" }} hataReferansi={hataReferansi} />
        </Link>
        <Link href={adres.geriAlindi} className={KART}>
          <KpiCard etiket="Geri alındı" varyant="ikincil" iyiYon="notr" bosDavranisi="sifir" adet={k ? k.geriAlindi : null} karsilastirma={{ anlik: "şu an" }} hataReferansi={hataReferansi} />
        </Link>
      </KpiSatiri>
    </section>
  );
}
