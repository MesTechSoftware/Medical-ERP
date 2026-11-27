import Link from "next/link";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import { formatSayi } from "@/lib/format";
import type { KpiSonucu } from "@/lib/kpi/getir";
import type { KargoKpileri } from "@/lib/kargo-listesi/sorgu";
import { BOS_SUZGEC, kargoAdresi } from "@/lib/kargo-listesi/suzgec";
import { siparisAdresi, BOS_SUZGEC as BOS_SIPARIS } from "@/lib/siparis-listesi/suzgec";
import { KPI_BAGLANTISI } from "@/components/stil";

/**
 * Kargo ekranının üst kartları (spec Ü-24 §3.2): süzgeçten bağımsız. Bugün kargolanan sevkiyat listesinin
 * bugünkü süzgecini, teslim bekleyen Siparişler'in Kargolandı süzgecini açar — kart = satır (D-3-2).
 * Onay ekranı yalnız yöneticinindir (`requireAdmin`); OPERASYON'da kart bağlantı değildir.
 */
export function KpiKartlari({ sonuc, bugun, yonetici }: { sonuc: KpiSonucu<KargoKpileri>; bugun: string; yonetici: boolean }) {
  const k = sonuc.tamam ? sonuc.deger : null;
  const hataReferansi = sonuc.tamam ? undefined : sonuc.referans;
  const onay = (
    <KpiCard
      etiket="Onay bekleyen"
      varyant="ikincil"
      iyiYon="asagi-iyi"
      bosDavranisi="sifir"
      adet={k ? k.onayBekleyen : null}
      ikincilMetrik={k && k.reddedilen > 0 ? `${formatSayi(k.reddedilen)} reddedildi` : undefined}
      karsilastirma={{ anlik: "şu an" }}
      vurgu={k && k.onayBekleyen > 0 ? "uyari" : undefined}
      hataReferansi={hataReferansi}
    />
  );
  return (
    <section aria-label="Kargo sayıları">
      <KpiSatiri>
        <KpiCard
          etiket="Kargo bekleyen"
          varyant="birincil"
          iyiYon="notr"
          bosDavranisi="sifir"
          adet={k ? k.bekleyen : null}
          ikincilMetrik={`${k ? formatSayi(k.bekleyenAdet) : "—"} adet kalan`}
          karsilastirma={{ anlik: "şu an" }}
          hataReferansi={hataReferansi}
        />
        {yonetici ? (
          <Link href="/approvals" className={KPI_BAGLANTISI}>
            {onay}
          </Link>
        ) : (
          onay
        )}
        <Link href={kargoAdresi({ ...BOS_SUZGEC, baslangic: bugun, bitis: bugun })} className={KPI_BAGLANTISI}>
          <KpiCard
            etiket="Bugün kargolanan"
            varyant="ikincil"
            iyiYon="notr"
            bosDavranisi="sifir"
            adet={k ? k.bugunKargolanan : null}
            karsilastirma={{ anlik: "bugün" }}
            hataReferansi={hataReferansi}
          />
        </Link>
        <Link href={siparisAdresi({ ...BOS_SIPARIS, durum: "KARGOLANDI" })} className={KPI_BAGLANTISI}>
          <KpiCard
            etiket="Teslim bekleyen"
            varyant="ikincil"
            iyiYon="notr"
            bosDavranisi="sifir"
            adet={k ? k.teslimBekleyen : null}
            karsilastirma={{ anlik: "şu an" }}
            hataReferansi={hataReferansi}
          />
        </Link>
      </KpiSatiri>
    </section>
  );
}
