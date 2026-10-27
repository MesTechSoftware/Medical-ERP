import { requireSeller } from "@/lib/session";
import { donemBitisAyi, donemCoz, karsilastirmaAraliklari, karsilastirmaNotu, sonAylar } from "@/lib/donem";
import { kpiGetir } from "@/lib/kpi/getir";
import { BRUT, MATRAH } from "@/lib/taban";
import { simdi } from "@/lib/zaman";
import { ciroOzeti, getSellerReports, saticiTahsilatOzeti } from "@/lib/reports-service";
import DonemSecici from "@/components/DonemSecici";
import SaticiRaporTablosu from "@/components/SaticiRaporTablosu";
import { PageHeader, Card } from "@/components/ui";
import { KovaOzeti } from "@/components/kpi/KovaOzeti";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";

/**
 * Satıcının kendi prim/hakediş ekranı (D-2 §(1)). Kısıt sorgudadır: `getSellerReports`
 * `SATICI`'ya yalnız kendi satırını döndürür (X-1 §(8)); KPI'lar da satıcı kapsamıyla okunur
 * (ciro siparişin satıcısına, tahsilat X-17 §(3) atfıyla). Dosya olarak indirilemez (D-5 §(4)).
 * KPI'lar seçili döneme bağlıdır (K-4, K-5; ADR-010).
 */
export default async function MyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ donem?: string }>;
}) {
  const session = await requireSeller();
  const an = simdi();
  const donem = donemCoz((await searchParams).donem, an);
  const k = karsilastirmaAraliklari(donem, an);
  const aylar = sonAylar(6, donemBitisAyi(donem, an), an);
  const not = karsilastirmaNotu(k.devamEdiyor);
  const baglam = { yol: "/my-report", kullaniciId: session.user.id };

  const [satirlar, ozet, tahsilat] = await Promise.all([
    getSellerReports(session.user, donem.aralik),
    kpiGetir(() => ciroOzeti({ kovalar: aylar, ...k }, { tur: "satici", saticiId: session.user.id }), baglam),
    kpiGetir(() => saticiTahsilatOzeti(k, session.user.id), baglam),
  ]);
  const karsilastir = <T,>(onceki: T | null | undefined) => (k.onceki ? { onceki: onceki ?? null, not } : undefined);

  return (
    <div>
      <PageHeader title="Raporum" description="Dönem cirom, hakedişim ve tahsilatım" />
      <DonemSecici anahtar={donem.anahtar} yol="/my-report" />
      <KpiSatiri>
        <KpiCard
          etiket="Cirom"
          varyant="birincil"
          iyiYon="yukari-iyi"
          bosDavranisi="sifir"
          tutar={ozet.tamam ? ozet.deger.simdi.ciro : null}
          taban={MATRAH}
          karsilastirma={ozet.tamam ? karsilastir(ozet.deger.onceki?.ciro) : undefined}
          trend={
            ozet.tamam
              ? {
                  seri: ozet.deger.seri,
                  sonDevamEdiyor: aylar[aylar.length - 1].devamEdiyor,
                  ozet: <KovaOzeti baslik="Son 6 ay cirom" kovalar={aylar} tur="ay" seri={ozet.deger.seri} taban={MATRAH} />,
                }
              : undefined
          }
          hataReferansi={ozet.tamam ? undefined : ozet.referans}
        />
        <KpiCard
          etiket="Hakedişim"
          varyant="ikincil"
          iyiYon="notr"
          bosDavranisi="sifir"
          tutar={ozet.tamam ? ozet.deger.simdi.hakedis : null}
          taban={MATRAH}
          karsilastirma={ozet.tamam ? karsilastir(ozet.deger.onceki?.hakedis) : undefined}
          hataReferansi={ozet.tamam ? undefined : ozet.referans}
        />
        <KpiCard
          etiket="Tahsilatım"
          varyant="ikincil"
          iyiYon="yukari-iyi"
          bosDavranisi="sifir"
          tutar={tahsilat.tamam ? tahsilat.deger.simdi : null}
          taban={BRUT}
          karsilastirma={tahsilat.tamam ? karsilastir(tahsilat.deger.onceki) : undefined}
          hataReferansi={tahsilat.tamam ? undefined : tahsilat.referans}
        />
      </KpiSatiri>
      <Card>
        {/* "Son 6 ay" Cirom'un serisidir — ek sorgu yok. */}
        <SaticiRaporTablosu
          satirlar={satirlar}
          seriler={ozet.tamam ? { aylar, degerler: new Map([[session.user.id, ozet.deger.seri]]) } : undefined}
        />
        <p className="mt-3 text-xs text-slate-500">
          Hakediş sevkiyat anında doğar; ödeme zamanlaması sistemin dışındadır.
        </p>
      </Card>
    </div>
  );
}
