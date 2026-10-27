import { requireAdmin } from "@/lib/session";
import { Tutar } from "@/components/Tutar";
import { BRUT, MATRAH, tabanli } from "@/lib/taban";
import { donemBitisAyi, donemCoz, karsilastirmaAraliklari, karsilastirmaNotu, sonAylar } from "@/lib/donem";
import { kpiGetir } from "@/lib/kpi/getir";
import { cubukOranlari } from "@/lib/kpi/olcek";
import { simdi } from "@/lib/zaman";
import DonemSecici from "@/components/DonemSecici";
import SaticiRaporTablosu from "@/components/SaticiRaporTablosu";
import {
  ciroOzeti,
  getDoctorReports,
  getSellerReports,
  saticiCiroSerileri,
  tahsilatToplamlari,
} from "@/lib/reports-service";
import { PageHeader, Card, EmptyRow } from "@/components/ui";
import { AyOzeti } from "@/components/kpi/AyOzeti";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import { OranCubugu } from "@/components/grafik/BarMicro";

/**
 * FR-62/FR-63/FR-60: Raporlar. KDV toggle'ı C6'da söküldü (GÇ-9, Ü-3 §(3)):
 * ciro daima KDV hariç (matrah), tahsilat daima KDV dahil (brüt); her
 * tutarın tabanı başlığında yazılıdır (Ü-3 §(6)/(7)).
 * KPI'lar seçili döneme bağlıdır (K-4); karşılaştırma K-1, "tüm zamanlar"da yoktur (ADR-010).
 */
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ donem?: string }>;
}) {
  const session = await requireAdmin();
  const an = simdi();
  const donem = donemCoz((await searchParams).donem, an);
  const k = karsilastirmaAraliklari(donem, an);
  const aylar = sonAylar(6, donemBitisAyi(donem, an), an);
  const baglam = { yol: "/reports", kullaniciId: session.user.id };
  const not = karsilastirmaNotu(k.devamEdiyor);

  const sellers = await getSellerReports(session.user, donem.aralik);
  const [doctors, ozet, tahsilat, seriler] = await Promise.all([
    getDoctorReports(donem.aralik, 25),
    kpiGetir(() => ciroOzeti({ kovalar: aylar, ...k }, { tur: "sirket" }), baglam),
    kpiGetir(() => tahsilatToplamlari(k.onceki ? [k.simdi, k.onceki] : [k.simdi]), baglam),
    saticiCiroSerileri(aylar, sellers.map((s) => s.sellerId)),
  ]);
  const karsilastir = <T,>(onceki: T | null | undefined) => (k.onceki ? { onceki: onceki ?? null, not } : undefined);
  const doktorOranlari = cubukOranlari(doctors.map((d) => d.ciro));

  return (
    <div>
      <PageHeader
        title="Raporlar"
        description="Ciro ve performans"
      />

      <DonemSecici anahtar={donem.anahtar} yol="/reports" />

      {/* FR-60: kanal karşılaştırması C5'te söküldü (X-8) */}
      <KpiSatiri>
        <KpiCard
          etiket="Dönem Cirosu"
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
                  ozet: <AyOzeti baslik="Son 6 ay ciro" aylar={aylar} seri={ozet.deger.seri} taban={MATRAH} />,
                }
              : undefined
          }
          hataReferansi={ozet.tamam ? undefined : ozet.referans}
        />
        <KpiCard
          etiket="Dönem Hakedişi"
          varyant="ikincil"
          iyiYon="notr"
          bosDavranisi="sifir"
          tutar={ozet.tamam ? ozet.deger.simdi.hakedis : null}
          taban={MATRAH}
          karsilastirma={ozet.tamam ? karsilastir(ozet.deger.onceki?.hakedis) : undefined}
          hataReferansi={ozet.tamam ? undefined : ozet.referans}
        />
        <KpiCard
          etiket="Dönem Tahsilatı"
          varyant="ikincil"
          iyiYon="yukari-iyi"
          bosDavranisi="sifir"
          tutar={tahsilat.tamam ? tahsilat.deger[0] : null}
          taban={BRUT}
          karsilastirma={tahsilat.tamam ? karsilastir(tahsilat.deger[1]) : undefined}
          hataReferansi={tahsilat.tamam ? undefined : tahsilat.referans}
        />
        <KpiCard
          etiket="Dönem İadesi"
          varyant="baglamsal"
          iyiYon="asagi-iyi"
          bosDavranisi="sifir"
          tutar={ozet.tamam ? ozet.deger.simdi.iade : null}
          taban={MATRAH}
          karsilastirma={ozet.tamam ? karsilastir(ozet.deger.onceki?.iade) : undefined}
          hataReferansi={ozet.tamam ? undefined : ozet.referans}
        />
      </KpiSatiri>

      {/* FR-62: satıcı performans karşılaştırması · X-1: dönem cirosu, hakediş, tahsilat */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Satıcı Performansı
        </h2>
        <SaticiRaporTablosu satirlar={sellers} seriler={{ aylar, degerler: seriler }} />
      </Card>

      {/* FR-63: doktor ciro sıralaması */}
      <div className="mt-6">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Doktor Ciro Sıralaması (dönem, ilk 25)
          </h2>
          <div className="tablo-kutusu">
            <table className="veri-tablosu">
              <thead>
                <tr>
                  <th>Doktor</th>
                  <th className="oncelik-dusuk">Satıcı</th>
                  <th className="sayi">{tabanli("Ciro", MATRAH)}</th>
                  <th>Lidere göre</th>
                </tr>
              </thead>
              <tbody>
                {doctors.length === 0 && (
                  <EmptyRow colSpan={4} text="Doktor yok." />
                )}
                {doctors.map((d, i) => (
                  <tr key={d.doctorId}>
                    <td className="font-medium text-slate-900">
                      {d.fullName}
                    </td>
                    <td className="text-slate-500 oncelik-dusuk">
                      {d.sellerName ?? "—"}
                    </td>
                    <td className="sayi">
                      <Tutar deger={d.ciro} taban={MATRAH} baslikta />
                    </td>
                    <td>
                      <OranCubugu oran={doktorOranlari[i]} className="w-24" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
