import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { BRUT, MATRAH } from "@/lib/taban";
import { donemBitisAyi, donemCoz, karsilastirmaAraliklari, karsilastirmaNotu, sonAylar } from "@/lib/donem";
import { kpiGetir } from "@/lib/kpi/getir";
import { simdi } from "@/lib/zaman";
import DonemSecici from "@/components/DonemSecici";
import { ilk, type Parametreler } from "@/lib/liste/parametreler";
import SaticiRaporTablosu from "@/components/SaticiRaporTablosu";
import Pagination from "@/components/Pagination";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { gizliSutunlariCoz } from "@/lib/liste/sutunlar";
import { getPagination, pageCount } from "@/lib/pagination";
import { doktorSiralamasi, saticiSecenekleri } from "@/lib/rapor-listesi/sorgu";
import { SUTUNLAR, SUTUN_CEREZI } from "@/lib/rapor-listesi/sutunlar";
import { SAHIPSIZ, korunanlar, raporAdresi, saticiAdresi, suzgecCoz } from "@/lib/rapor-listesi/suzgec";
import { DoktorSiralamasi } from "./DoktorSiralamasi";
import { sutunlariKaydet } from "./sutunEylemi";
import {
  ciroOzeti,
  getSellerReports,
  saticiCiroSerileri,
  tahsilatToplamlari,
} from "@/lib/reports-service";
import { PageHeader, Card } from "@/components/ui";
import { KovaOzeti } from "@/components/kpi/KovaOzeti";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";

/**
 * FR-62/FR-63/FR-60: Raporlar. KDV toggle'ı C6'da söküldü (GÇ-9, Ü-3 §(3)):
 * ciro daima KDV hariç (matrah), tahsilat daima KDV dahil (brüt); her
 * tutarın tabanı başlığında yazılıdır (Ü-3 §(6)/(7)).
 * KPI'lar seçili döneme bağlıdır (K-4); karşılaştırma K-1, "tüm zamanlar"da yoktur (ADR-010).
 * Doktor ciro sıralaması dönemin bütün cirolu carileridir; süzgeç ve sütun seçici (spec Ü-27, X-1-2).
 */
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Parametreler>;
}) {
  const session = await requireAdmin();
  const an = simdi();
  const params = await searchParams;
  // Tekrarlanan `donem` dizi gelir; ilk değer okunur.
  const donem = donemCoz(ilk(params, "donem") ?? undefined, an);
  const k = karsilastirmaAraliklari(donem, an);
  const aylar = sonAylar(6, donemBitisAyi(donem, an), an);
  const baglam = { yol: "/reports", kullaniciId: session.user.id };
  const not = karsilastirmaNotu(k.devamEdiyor);
  const suzgec = suzgecCoz(params);
  const per = ilk(params, "per") ?? undefined;
  const { page, perPage, skip, take } = getPagination({ page: ilk(params, "page") ?? undefined, per });
  const yer = { page, per: per ? perPage : undefined };
  const gizli = gizliSutunlariCoz(SUTUNLAR, (await cookies()).get(SUTUN_CEREZI)?.value);

  // Seçeneklerde olmayan satıcı (eski yer imi, elle yazılmış kimlik) ağır sorgulardan önce adresten düşer.
  const saticilar = await saticiSecenekleri();
  if (suzgec.satici && suzgec.satici !== SAHIPSIZ && !saticilar.some((u) => u.id === suzgec.satici)) {
    redirect(raporAdresi({ ...suzgec, satici: null }, yer));
  }

  const sellers = await getSellerReports(session.user, donem.aralik);
  const [siralama, ozet, tahsilat, seriler] = await Promise.all([
    doktorSiralamasi(donem.aralik, suzgec, { skip, take }),
    kpiGetir(() => ciroOzeti({ kovalar: aylar, ...k }, { tur: "sirket" }), baglam),
    kpiGetir(() => tahsilatToplamlari(k.onceki ? [k.simdi, k.onceki] : [k.simdi]), baglam),
    saticiCiroSerileri(aylar, sellers.map((s) => s.sellerId)),
  ]);
  const karsilastir = <T,>(onceki: T | null | undefined) => (k.onceki ? { onceki: onceki ?? null, not } : undefined);
  // Sayfa dışı adres son sayfaya gider.
  if (siralama.satirlar.length === 0 && siralama.toplam > 0) {
    redirect(raporAdresi(suzgec, { ...yer, page: pageCount(siralama.toplam, perPage) }));
  }
  const adres = raporAdresi(suzgec, yer);
  const sayfaParametreleri = {
    ...Object.fromEntries(new URL(raporAdresi(suzgec), "http://x").searchParams),
    per: yer.per === undefined ? undefined : String(yer.per),
  };

  return (
    <div>
      <PageHeader
        title="Raporlar"
        description="Ciro ve performans"
      />

      <DonemSecici anahtar={donem.anahtar} yol="/reports" korunan={korunanlar(suzgec)} />

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
                  ozet: <KovaOzeti baslik="Son 6 ay ciro" kovalar={aylar} tur="ay" seri={ozet.deger.seri} taban={MATRAH} />,
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
        <SaticiRaporTablosu satirlar={sellers} seriler={{ aylar, degerler: seriler }} saticiBaglantisi={(id) => saticiAdresi(suzgec, id)} />
      </Card>

      {/* FR-63: doktor ciro sıralaması (Ü-27: bütün cirolu cariler, süzgeç, sayfalama) */}
      <div className="mt-6">
        <DoktorSiralamasi
          satirlar={siralama.satirlar}
          suzgec={suzgec}
          per={yer.per}
          saticilar={saticilar}
          gizli={gizli}
          sutunMenusu={<SutunSecici sutunlar={SUTUNLAR} gizli={gizli} action={sutunlariKaydet} donus={adres} />}
        />
        <Pagination page={page} totalPages={pageCount(siralama.toplam, perPage)} total={siralama.toplam} basePath="/reports" params={sayfaParametreleri} />
      </div>
    </div>
  );
}
