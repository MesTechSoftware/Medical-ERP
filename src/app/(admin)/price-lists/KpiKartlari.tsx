import Link from "next/link";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import type { ListeKpileri } from "@/lib/fiyat-listesi-listesi/sorgu";
import { BOS_SUZGEC, listeAdresi } from "@/lib/fiyat-listesi-listesi/suzgec";

const KART = "block h-full rounded-xl transition hover:opacity-90";
const ANLIK = { anlik: "şu an" } as const;

/**
 * Fiyat listesi ekranının üst kartları (spec Ü-21 §3.2): anlık sayılar, süzgeçten bağımsız. Aktif liste
 * kartı `durum=aktif` süzgecini açar (X-10-6); fiyatsız ürün kartı varsayılan listenin panelini.
 */
export function KpiKartlari({ sayilar }: { sayilar: ListeKpileri }) {
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
        <Link href={listeAdresi(BOS_SUZGEC)} className={KART}>
          <KpiCard etiket="Toplam liste" varyant="birincil" iyiYon="notr" bosDavranisi="sifir" adet={sayilar.toplam} karsilastirma={ANLIK} />
        </Link>
        <Link href={listeAdresi({ durum: "aktif" })} className={KART}>
          <KpiCard etiket="Aktif liste" varyant="ikincil" iyiYon="notr" bosDavranisi="sifir" adet={sayilar.aktif} karsilastirma={ANLIK} />
        </Link>
        <KpiCard
          etiket="Özel listeli cari"
          varyant="ikincil"
          iyiYon="notr"
          bosDavranisi="sifir"
          adet={sayilar.ozelListeliCari}
          karsilastirma={ANLIK}
          ikincilMetrik={`${sayilar.varsayilanKullanan} cari varsayılanı kullanır`}
        />
        {sayilar.varsayilanListeId ? (
          <Link href={listeAdresi(BOS_SUZGEC, { detay: sayilar.varsayilanListeId })} scroll={false} className={KART}>
            {fiyatsiz}
          </Link>
        ) : (
          fiyatsiz
        )}
      </KpiSatiri>
    </section>
  );
}
