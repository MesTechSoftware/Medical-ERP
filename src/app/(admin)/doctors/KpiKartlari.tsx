import Link from "next/link";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import { BOS_SUZGEC, SAHIPSIZ, doktorAdresi } from "@/lib/doktor-listesi/suzgec";
import { KPI_BAGLANTISI } from "@/components/stil";

type Sayilar = { toplam: number; aktif: number; sahipsiz: number; eksikFatura: number };

/**
 * Cari listesinin üst kartları (spec Ü-18 §3.1): anlık sayılar, süzgeçten bağımsız. Kart tıklanınca
 * o süzgeç uygulanır. Sahipsiz ve eksik fatura sıfırdan büyükse uyarı tonundadır.
 */
export function KpiKartlari({ sayilar }: { sayilar: Sayilar }) {
  return (
    <section aria-label="Cari sayıları">
      <KpiSatiri>
        <Link href={doktorAdresi(BOS_SUZGEC)} className={KPI_BAGLANTISI}>
          <KpiCard etiket="Toplam cari" varyant="birincil" iyiYon="notr" bosDavranisi="sifir" adet={sayilar.toplam} karsilastirma={{ anlik: "şu an" }} />
        </Link>
        <Link href={doktorAdresi({ ...BOS_SUZGEC, durum: "AKTIF" })} className={KPI_BAGLANTISI}>
          <KpiCard etiket="Aktif" varyant="ikincil" iyiYon="notr" bosDavranisi="sifir" adet={sayilar.aktif} karsilastirma={{ anlik: "şu an" }} />
        </Link>
        <Link href={doktorAdresi({ ...BOS_SUZGEC, satici: SAHIPSIZ })} className={KPI_BAGLANTISI}>
          <KpiCard
            etiket="Sahipsiz"
            varyant="ikincil"
            iyiYon="asagi-iyi"
            bosDavranisi="sifir"
            adet={sayilar.sahipsiz}
            karsilastirma={{ anlik: "şu an" }}
            vurgu={sayilar.sahipsiz > 0 ? "uyari" : undefined}
          />
        </Link>
        <Link href={doktorAdresi({ ...BOS_SUZGEC, fatura: "eksik" })} className={KPI_BAGLANTISI}>
          <KpiCard
            etiket="Eksik fatura bilgisi"
            varyant="ikincil"
            iyiYon="asagi-iyi"
            bosDavranisi="sifir"
            adet={sayilar.eksikFatura}
            karsilastirma={{ anlik: "şu an" }}
            vurgu={sayilar.eksikFatura > 0 ? "uyari" : undefined}
          />
        </Link>
      </KpiSatiri>
    </section>
  );
}
