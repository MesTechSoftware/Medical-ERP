import Link from "next/link";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import { BOS_SUZGEC, urunAdresi } from "@/lib/urun-listesi/suzgec";
import { KPI_BAGLANTISI } from "@/components/stil";

type Sayilar = { toplam: number; aktif: number; kritik: number; pasif: number };

/**
 * Ürün listesinin üst kartları (spec Ü-19 §3.1): anlık sayılar, süzgeçten bağımsız. Kritik stok kartı
 * `durum=AKTIF` ile birleşik adres açar — kart sayısı satır sayısıyla aynıdır.
 */
export function KpiKartlari({ sayilar }: { sayilar: Sayilar }) {
  return (
    <section aria-label="Ürün sayıları">
      <KpiSatiri>
        <Link href={urunAdresi(BOS_SUZGEC)} className={KPI_BAGLANTISI}>
          <KpiCard etiket="Toplam ürün" varyant="birincil" iyiYon="notr" bosDavranisi="sifir" adet={sayilar.toplam} karsilastirma={{ anlik: "şu an" }} />
        </Link>
        <Link href={urunAdresi({ ...BOS_SUZGEC, durum: "AKTIF" })} className={KPI_BAGLANTISI}>
          <KpiCard etiket="Aktif" varyant="ikincil" iyiYon="notr" bosDavranisi="sifir" adet={sayilar.aktif} karsilastirma={{ anlik: "şu an" }} />
        </Link>
        <Link href={urunAdresi({ durum: "AKTIF", stok: "kritik" })} className={KPI_BAGLANTISI}>
          <KpiCard
            etiket="Kritik stok"
            varyant="ikincil"
            iyiYon="asagi-iyi"
            bosDavranisi="sifir"
            adet={sayilar.kritik}
            karsilastirma={{ anlik: "şu an" }}
            vurgu={sayilar.kritik > 0 ? "uyari" : undefined}
          />
        </Link>
        <Link href={urunAdresi({ ...BOS_SUZGEC, durum: "PASIF" })} className={KPI_BAGLANTISI}>
          <KpiCard etiket="Pasif" varyant="ikincil" iyiYon="notr" bosDavranisi="sifir" adet={sayilar.pasif} karsilastirma={{ anlik: "şu an" }} />
        </Link>
      </KpiSatiri>
    </section>
  );
}
