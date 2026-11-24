import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import { formatSayi } from "@/lib/format";
import type { KpiSonucu } from "@/lib/kpi/getir";
import { stokDurumu } from "@/lib/stok-durumu";

/**
 * OPERASYON panosunun KPI satırı (D-2): Ciro ve Tahsilat yoktur; bekleyen sipariş, kargolanacak,
 * kritik stok ve kalanı açık sipariş (onay bekleyen ikincil metinde). Ayrı bileşendir: yönetici
 * satırı sayfadadır ve bir dosyada en çok 4 kart olur (`tasarim.test.ts`).
 */
export function OperasyonKpiSatiri({
  bekleyen,
  kargolanacak,
  stoklar,
  sayilar,
  hazirlama,
}: {
  bekleyen: KpiSonucu<number>;
  kargolanacak: KpiSonucu<number>;
  stoklar: KpiSonucu<readonly { stok: number }[]>;
  sayilar: KpiSonucu<{ onayBekleyen: number; kalaniAcik: number }>;
  hazirlama: string;
}) {
  const kritik = stoklar.tamam ? stoklar.deger.filter((u) => stokDurumu(u.stok) !== null).length : null;
  return (
    <KpiSatiri>
      <KpiCard
        etiket="Bekleyen sipariş"
        varyant="birincil"
        iyiYon="asagi-iyi"
        bosDavranisi="sifir"
        adet={bekleyen.tamam ? bekleyen.deger : null}
        karsilastirma={{ anlik: "şu an" }}
        ikincilMetrik={hazirlama}
        vurgu={bekleyen.tamam && bekleyen.deger > 0 ? "uyari" : undefined}
        hataReferansi={bekleyen.tamam ? undefined : bekleyen.referans}
      />
      <KpiCard
        etiket="Kargolanacak"
        varyant="ikincil"
        iyiYon="asagi-iyi"
        bosDavranisi="sifir"
        adet={kargolanacak.tamam ? kargolanacak.deger : null}
        karsilastirma={{ anlik: "şu an" }}
        vurgu={kargolanacak.tamam && kargolanacak.deger > 0 ? "uyari" : undefined}
        hataReferansi={kargolanacak.tamam ? undefined : kargolanacak.referans}
      />
      <KpiCard
        etiket="Kritik stok"
        varyant="ikincil"
        iyiYon="asagi-iyi"
        bosDavranisi="sifir"
        adet={kritik}
        karsilastirma={{ anlik: "şu an" }}
        vurgu={kritik !== null && kritik > 0 ? "uyari" : undefined}
        hataReferansi={stoklar.tamam ? undefined : stoklar.referans}
      />
      <KpiCard
        etiket="Kalanı açık sipariş"
        varyant="baglamsal"
        iyiYon="asagi-iyi"
        bosDavranisi="sifir"
        adet={sayilar.tamam ? sayilar.deger.kalaniAcik : null}
        karsilastirma={{ anlik: "şu an" }}
        ikincilMetrik={sayilar.tamam ? `Onay bekleyen: ${formatSayi(sayilar.deger.onayBekleyen)}` : undefined}
        vurgu={sayilar.tamam && sayilar.deger.kalaniAcik + sayilar.deger.onayBekleyen > 0 ? "uyari" : undefined}
        hataReferansi={sayilar.tamam ? undefined : sayilar.referans}
      />
    </KpiSatiri>
  );
}
