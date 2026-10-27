import { prisma } from "@/lib/db";
import { BRUT, MATRAH } from "@/lib/taban";
import { ciroOzeti, tahsilatToplamlari } from "@/lib/reports-service";
import { donemCoz, karsilastirmaAraliklari, karsilastirmaNotu, sonAylar } from "@/lib/donem";
import { kpiGetir } from "@/lib/kpi/getir";
import { requireStaff } from "@/lib/session";
import { simdi, takvimAyi } from "@/lib/zaman";
import { PageHeader } from "@/components/ui";
import { AyOzeti } from "@/components/kpi/AyOzeti";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import { SayfaOzetleri } from "@/components/SayfaOzetleri";

/**
 * Dashboard (YONETICI + OPERASYON) — "bu ay" KPI'ları (K-4; ADR-010) ve altında bütün sayfaların
 * özeti (rolün görebildiği sayfalar). Ekran prim/hakediş taşımaz (D-2). Karşılaştırma geçen ayın
 * aynı günleridir (K-1). Ciro matrahtır, sevk edilen maldan doğar (A-3); tahsilat brüttür (Ü-3).
 */
export default async function DashboardPage() {
  const session = await requireStaff();
  const an = simdi();
  const aylar = sonAylar(6, takvimAyi(an), an);
  const k = karsilastirmaAraliklari(donemCoz(undefined, an), an);
  const baglam = { yol: "/dashboard", kullaniciId: session.user.id };
  const not = karsilastirmaNotu(true);

  const [ciro, tahsilat, bekleyen, kargolanacak] = await Promise.all([
    kpiGetir(() => ciroOzeti({ kovalar: aylar, ...k }, { tur: "sirket" }), baglam),
    // Tek sorgu: altı ay + bu dönem + karşılaştırma dönemi.
    kpiGetir(() => tahsilatToplamlari([...aylar.map((a) => a.aralik), k.simdi, ...(k.onceki ? [k.onceki] : [])]), baglam),
    kpiGetir(() => prisma.order.count({ where: { status: "BEKLIYOR" } }), baglam),
    kpiGetir(() => prisma.order.count({ where: { status: "HAZIRLANIYOR" } }), baglam),
  ]);

  const tahsilatSerisi = tahsilat.tamam ? tahsilat.deger.slice(0, aylar.length) : [];

  return (
    <div>
      <PageHeader title="Dashboard" description="Operasyon özeti" />

      <KpiSatiri>
        <KpiCard
          etiket="Ciro"
          varyant="birincil"
          iyiYon="yukari-iyi"
          bosDavranisi="sifir"
          tutar={ciro.tamam ? ciro.deger.simdi.ciro : null}
          taban={MATRAH}
          karsilastirma={ciro.tamam ? { onceki: ciro.deger.onceki?.ciro ?? null, not } : undefined}
          trend={
            ciro.tamam
              ? {
                  seri: ciro.deger.seri,
                  sonDevamEdiyor: true,
                  ozet: <AyOzeti baslik="Son 6 ay ciro" aylar={aylar} seri={ciro.deger.seri} taban={MATRAH} />,
                }
              : undefined
          }
          donemNotu="Bu ay"
          hataReferansi={ciro.tamam ? undefined : ciro.referans}
        />
        <KpiCard
          etiket="Tahsilat"
          varyant="ikincil"
          iyiYon="yukari-iyi"
          bosDavranisi="sifir"
          tutar={tahsilat.tamam ? tahsilat.deger[aylar.length] : null}
          taban={BRUT}
          karsilastirma={tahsilat.tamam ? { onceki: tahsilat.deger[aylar.length + 1] ?? null, not } : undefined}
          trend={
            tahsilat.tamam
              ? {
                  seri: tahsilatSerisi,
                  sonDevamEdiyor: true,
                  ozet: <AyOzeti baslik="Son 6 ay tahsilat" aylar={aylar} seri={tahsilatSerisi} taban={BRUT} />,
                }
              : undefined
          }
          donemNotu="Bu ay"
          hataReferansi={tahsilat.tamam ? undefined : tahsilat.referans}
        />
        <KpiCard
          etiket="Bekleyen sipariş"
          varyant="ikincil"
          iyiYon="asagi-iyi"
          bosDavranisi="sifir"
          adet={bekleyen.tamam ? bekleyen.deger : null}
          karsilastirma={{ anlik: "şu an" }}
          vurgu={bekleyen.tamam && bekleyen.deger > 0 ? "uyari" : undefined}
          hataReferansi={bekleyen.tamam ? undefined : bekleyen.referans}
        />
        <KpiCard
          etiket="Kargolanacak"
          varyant="baglamsal"
          iyiYon="asagi-iyi"
          bosDavranisi="sifir"
          adet={kargolanacak.tamam ? kargolanacak.deger : null}
          karsilastirma={{ anlik: "şu an" }}
          vurgu={kargolanacak.tamam && kargolanacak.deger > 0 ? "uyari" : undefined}
          hataReferansi={kargolanacak.tamam ? undefined : kargolanacak.referans}
        />
      </KpiSatiri>

      {/* Bütün sayfaların özeti: kritik stok Stok kartında, en çok sevk edilenler Kargo kartında. */}
      <SayfaOzetleri kullanici={session.user} />
    </div>
  );
}
