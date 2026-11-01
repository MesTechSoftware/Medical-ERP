import Link from "next/link";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import { formatSayi } from "@/lib/format";
import { BOS_SUZGEC, stokAdresi } from "@/lib/stok-listesi/suzgec";
import { urunAdresi } from "@/lib/urun-listesi/suzgec";

type Sayilar = { stoktaki: number; toplamAdet: number; kritik: number; bugunGiris: number; bugunCikis: number };

const KART = "block h-full rounded-xl transition hover:opacity-90";

/**
 * Stok ekranının üst kartları (spec Ü-20 §3.2): süzgeçten bağımsız. Bugünkü kartlar listeyle aynı
 * süzgeç adresini açar — kart sayısı satır sayısıyla aynıdır (B-4-10). Kritik stok Ürünler ekranına gider.
 */
export function KpiKartlari({ sayilar, bugun }: { sayilar: Sayilar; bugun: string }) {
  const bugunku = (yon: "GIRIS" | "CIKIS") => stokAdresi({ ...BOS_SUZGEC, baslangic: bugun, bitis: bugun, yon });
  return (
    <section aria-label="Stok sayıları">
      <KpiSatiri>
        <KpiCard
          etiket="Stoktaki ürün"
          varyant="birincil"
          iyiYon="notr"
          bosDavranisi="sifir"
          adet={sayilar.stoktaki}
          ikincilMetrik={`toplam ${formatSayi(sayilar.toplamAdet)} adet`}
          karsilastirma={{ anlik: "şu an" }}
        />
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
        <Link href={bugunku("GIRIS")} className={KART}>
          <KpiCard etiket="Bugün giriş" varyant="ikincil" iyiYon="notr" bosDavranisi="sifir" adet={sayilar.bugunGiris} karsilastirma={{ anlik: "bugün" }} />
        </Link>
        <Link href={bugunku("CIKIS")} className={KART}>
          <KpiCard etiket="Bugün çıkış" varyant="ikincil" iyiYon="notr" bosDavranisi="sifir" adet={sayilar.bugunCikis} karsilastirma={{ anlik: "bugün" }} />
        </Link>
      </KpiSatiri>
    </section>
  );
}
