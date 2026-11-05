import Link from "next/link";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import type { KpiSonucu } from "@/lib/kpi/getir";
import type { saticiDoktorKpileri } from "@/lib/doktor-listesi/sorgu";
import { SATICI_KARTLARI, doktorAdresi } from "@/lib/doktor-listesi/suzgec";

const KART = "block h-full rounded-xl transition hover:opacity-90";

/**
 * Doktorlarım'ın üst kartları (spec Ü-32 §3.1): portföyün anlık sayıları, süzgeçten bağımsız. Her kart tıklanınca
 * kendi süzgecini açar; sayısı açtığı listenin satır sayısıdır (X-13-4). Kart düzeyinde hata (ADR-010).
 */
export function KpiKartlari({ sonuc }: { sonuc: KpiSonucu<Awaited<ReturnType<typeof saticiDoktorKpileri>>> }) {
  const k = sonuc.tamam ? sonuc.deger : null;
  const hataReferansi = sonuc.tamam ? undefined : sonuc.referans;
  const [toplam, ...digerleri] = SATICI_KARTLARI;
  return (
    <section aria-label="Doktor sayıları">
      <KpiSatiri>
        <Link href={doktorAdresi(toplam.suzgec, {}, "/my-doctors")} className={KART}>
          <KpiCard
            etiket={toplam.etiket}
            varyant="birincil"
            iyiYon="notr"
            bosDavranisi="sifir"
            adet={k ? k[toplam.anahtar] : null}
            karsilastirma={{ anlik: "şu an" }}
            hataReferansi={hataReferansi}
          />
        </Link>
        {digerleri.map((kart) => (
          <Link key={kart.anahtar} href={doktorAdresi(kart.suzgec, {}, "/my-doctors")} className={KART}>
            <KpiCard
              etiket={kart.etiket}
              varyant="ikincil"
              iyiYon={kart.anahtar === "aktif" ? "notr" : "asagi-iyi"}
              bosDavranisi="sifir"
              adet={k ? k[kart.anahtar] : null}
              karsilastirma={{ anlik: "şu an" }}
              hataReferansi={hataReferansi}
            />
          </Link>
        ))}
      </KpiSatiri>
    </section>
  );
}
