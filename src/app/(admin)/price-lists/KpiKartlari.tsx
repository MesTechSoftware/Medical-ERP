import Link from "next/link";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import type { ListeKpileri } from "@/lib/fiyat-listesi-listesi/sorgu";
import { BOS_SUZGEC, listeAdresi } from "@/lib/fiyat-listesi-listesi/suzgec";
import { KPI_BAGLANTISI } from "@/components/stil";

const ANLIK = { anlik: "şu an" } as const;

/**
 * Fiyat listesi ekranının üst kartları (spec Ü-21 §3.2): anlık sayılar, süzgeçten bağımsız. Aktif liste
 * kartı `durum=aktif` süzgecini açar (X-10-6); fiyatsız ürün kartı varsayılan listenin panelini.
 */
export function KpiKartlari({
  sayilar,
  fiyatsizAdresi,
}: {
  sayilar: ListeKpileri;
  /** Varsayılan listenin paneli, bulunulan süzgeç ve sayfa korunarak; liste yoksa `null`. */
  fiyatsizAdresi: string | null;
}) {
  const fiyatsiz = (
    <KpiCard
      etiket="Fiyatsız ürün"
      varyant="ikincil"
      iyiYon="asagi-iyi"
      bosDavranisi="sifir"
      adet={sayilar.fiyatsizUrun}
      karsilastirma={ANLIK}
      ikincilMetrik="varsayılan listede, 1 adet"
      vurgu={sayilar.fiyatsizUrun > 0 ? "uyari" : undefined}
    />
  );
  return (
    <section aria-label="Fiyat listesi sayıları">
      <KpiSatiri>
        <Link href={listeAdresi(BOS_SUZGEC)} className={KPI_BAGLANTISI}>
          <KpiCard etiket="Toplam liste" varyant="birincil" iyiYon="notr" bosDavranisi="sifir" adet={sayilar.toplam} karsilastirma={ANLIK} />
        </Link>
        <Link href={listeAdresi({ durum: "aktif" })} className={KPI_BAGLANTISI}>
          <KpiCard etiket="Aktif liste" varyant="ikincil" iyiYon="notr" bosDavranisi="sifir" adet={sayilar.aktif} karsilastirma={ANLIK} />
        </Link>
        <KpiCard
          etiket="Özel listeli cari"
          varyant="ikincil"
          iyiYon="notr"
          bosDavranisi="sifir"
          adet={sayilar.ozelListeliCari}
          karsilastirma={ANLIK}
          ikincilMetrik={sayilar.varsayilanListeId ? `${sayilar.varsayilanKullanan} cari varsayılanı kullanır` : "varsayılan liste yok"}
        />
        {fiyatsizAdresi ? (
          <Link href={fiyatsizAdresi} scroll={false} className={KPI_BAGLANTISI}>
            {fiyatsiz}
          </Link>
        ) : (
          fiyatsiz
        )}
      </KpiSatiri>
    </section>
  );
}
