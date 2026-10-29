import Link from "next/link";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import { BOS_SUZGEC, urunAdresi } from "@/lib/urun-listesi/suzgec";

type Sayilar = { toplam: number; aktif: number; kritik: number; pasif: number };

/**
 * Ürün listesinin üst kartları (spec Ü-19 §3.1): anlık sayılar, süzgeçten bağımsız. Kritik stok kartı
 * `durum=AKTIF` ile birleşik adres açar — kart sayısı satır sayısıyla aynıdır.
 */
const KART = "block h-full rounded-xl transition hover:opacity-90";

export function KpiKartlari({ sayilar }: { sayilar: Sayilar }) {
  return (
    <section aria-label="Ürün sayıları">
      <KpiSatiri>
        <Link href={urunAdresi(BOS_SUZGEC)} className={KART}>
          <KpiCard etiket="Toplam ürün" varyant="birincil" iyiYon="notr" bosDavranisi="sifir" adet={sayilar.toplam} karsilastirma={{ anlik: "şu an" }} />
        </Link>
        <Link href={urunAdresi({ ...BOS_SUZGEC, durum: "AKTIF" })} className={KART}>
          <KpiCard etiket="Aktif" varyant="ikincil" iyiYon="notr" bosDavranisi="sifir" adet={sayilar.aktif} karsilastirma={{ anlik: "şu an" }} />
        </Link>
        <Link href={urunAdresi({ durum: "AKTIF", stok: "kritik" })} className={KART}>
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
        <Link href={urunAdresi({ ...BOS_SUZGEC, durum: "PASIF" })} className={KART}>
          <KpiCard etiket="Pasif" varyant="ikincil" iyiYon="notr" bosDavranisi="sifir" adet={sayilar.pasif} karsilastirma={{ anlik: "şu an" }} />
        </Link>
      </KpiSatiri>
    </section>
  );
}
