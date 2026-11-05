import Link from "next/link";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import type { KpiSonucu } from "@/lib/kpi/getir";
import type { DenetimKpileri } from "@/lib/denetim/sorgu";
import { kartAdresleri } from "@/lib/denetim/suzgec";
import { KPI_BAGLANTISI } from "@/components/stil";

/**
 * Denetim kaydının üst kartları (spec Ü-28 §3.1): süzgeçten bağımsız, anlık. Her kart açtığı süzgecin satır
 * sayısıdır (X-18-8); başarısız giriş ve silme sıfırdan büyükse uyarı tonundadır.
 */
export function KpiKartlari({ sonuc, bugun }: { sonuc: KpiSonucu<DenetimKpileri>; bugun: string }) {
  const k = sonuc.tamam ? sonuc.deger : null;
  const hataReferansi = sonuc.tamam ? undefined : sonuc.referans;
  const adres = kartAdresleri(bugun);
  return (
    <section aria-label="Denetim sayıları">
      <KpiSatiri>
        <Link href={adres.bugun} className={KPI_BAGLANTISI}>
          <KpiCard etiket="Bugün işlem" varyant="birincil" iyiYon="notr" bosDavranisi="sifir" adet={k ? k.bugun : null} karsilastirma={{ anlik: "bugün" }} hataReferansi={hataReferansi} />
        </Link>
        <Link href={adres.yediGun} className={KPI_BAGLANTISI}>
          <KpiCard etiket="Son 7 gün işlem" varyant="ikincil" iyiYon="notr" bosDavranisi="sifir" adet={k ? k.yediGun : null} karsilastirma={{ anlik: "son 7 gün" }} hataReferansi={hataReferansi} />
        </Link>
        <Link href={adres.basarisiz} className={KPI_BAGLANTISI}>
          <KpiCard
            etiket="Bugün başarısız giriş"
            varyant="ikincil"
            iyiYon="asagi-iyi"
            bosDavranisi="sifir"
            adet={k ? k.basarisiz : null}
            karsilastirma={{ anlik: "bugün" }}
            vurgu={k && k.basarisiz > 0 ? "uyari" : undefined}
            hataReferansi={hataReferansi}
          />
        </Link>
        <Link href={adres.silme} className={KPI_BAGLANTISI}>
          <KpiCard
            etiket="Bugün silme"
            varyant="ikincil"
            iyiYon="asagi-iyi"
            bosDavranisi="sifir"
            adet={k ? k.silme : null}
            karsilastirma={{ anlik: "bugün" }}
            vurgu={k && k.silme > 0 ? "uyari" : undefined}
            hataReferansi={hataReferansi}
          />
        </Link>
      </KpiSatiri>
    </section>
  );
}
