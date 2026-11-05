import { redirect } from "next/navigation";
import { requireSeller } from "@/lib/session";
import { donemBitisAyi, donemCoz, karsilastirmaAraliklari, karsilastirmaNotu, sonAylar } from "@/lib/donem";
import { kpiGetir } from "@/lib/kpi/getir";
import { BRUT, MATRAH } from "@/lib/taban";
import { simdi } from "@/lib/zaman";
import { ciroOku, ciroOzeti, ciroOzetiAraligi, getSellerReports, kapsayanAralik, saticiTahsilatOzeti } from "@/lib/reports-service";
import DonemSecici from "@/components/DonemSecici";
import { ilk, type Parametreler } from "@/lib/liste/parametreler";
import SaticiRaporTablosu from "@/components/SaticiRaporTablosu";
import { ListeSayfalama } from "@/components/liste/ListeSayfalama";
import { sayfaCoz, sayfaDisi } from "@/lib/liste/sayfa";
import { doktorSiralamasi } from "@/lib/rapor-listesi/sorgu";
import { korunanlar, raporAdresi, suzgecCoz } from "@/lib/rapor-listesi/suzgec";
import { CiroSiralamasi } from "./CiroSiralamasi";
import { PageHeader, Card } from "@/components/ui";
import { KovaOzeti } from "@/components/kpi/KovaOzeti";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";

/**
 * Satıcının kendi prim/hakediş ekranı (D-2 §(1)). Kısıt sorgudadır: `getSellerReports`
 * `SATICI`'ya yalnız kendi satırını döndürür (X-1 §(8)); KPI'lar da satıcı kapsamıyla okunur
 * (ciro siparişin satıcısına, tahsilat X-17 §(3) atfıyla). Dosya olarak indirilemez (D-5 §(4)).
 * KPI'lar seçili döneme bağlıdır (K-4, K-5; ADR-010). Doktorlarıma göre cirom (spec Ü-33) aynı dönemin, satıcı
 * kapsamlı doktor ciro sıralamasıdır (`doktorSiralamasi`, Raporlar'la tek yol); İadem kartı Cirom'un okumasından gelir.
 */
const YOL = "/my-report";

export default async function MyReportPage({
  searchParams,
}: {
  searchParams: Promise<Parametreler>;
}) {
  const session = await requireSeller();
  const an = simdi();
  const params = await searchParams;
  // Tekrarlanan `donem` dizi gelir; ilk değer okunur.
  const donem = donemCoz(ilk(params, "donem") ?? undefined, an);
  const k = karsilastirmaAraliklari(donem, an);
  const aylar = sonAylar(6, donemBitisAyi(donem, an), an);
  const not = karsilastirmaNotu(k.devamEdiyor);
  const baglam = { yol: YOL, kullaniciId: session.user.id };
  const kapsam = { tur: "satici", saticiId: session.user.id } as const;
  const cozulen = suzgecCoz(params);
  // Satıcı süzgeci bu ekranda yoktur; adreste kalmışsa sorgulardan önce adresten düşer.
  const suzgec = { ...cozulen, satici: null };
  const sayfa = sayfaCoz(params);
  const { page, perPage, skip, take, yer } = sayfa;
  if (ilk(params, "satici") !== null) redirect(raporAdresi(suzgec, yer, YOL));

  // Satıcının dönem sevk ve iade satırları bir kez okunur: rapor satırı, Cirom özeti ve doktorlarıma göre cirom aynı
  // okumadan hesaplanır. Okumalar tek turdadır.
  const g = { kovalar: aylar, ...k };
  const okuma = ciroOku(kapsayanAralik([ciroOzetiAraligi(g), donem.aralik]), kapsam);
  const [satirlar, ozet, tahsilat, siralama] = await Promise.all([
    getSellerReports(session.user, donem.aralik, okuma),
    kpiGetir(() => ciroOzeti(g, kapsam, okuma), baglam),
    kpiGetir(() => saticiTahsilatOzeti(k, session.user.id), baglam),
    // Sıralama da kart gibi kapsüllüdür: hesap düşerse yalnız o bölüm hata referansı gösterir, KPI'lar kalır.
    kpiGetir(() => doktorSiralamasi(donem.aralik, suzgec, { skip, take }, kapsam, okuma), baglam),
  ]);
  // Sayfa dışı adres son sayfaya gider.
  // Sonuçsuz aramada ikinci sayfadan sonrası birinci sayfaya (sayfalama "3 / 1" demesin).
  if (siralama.tamam && siralama.deger.satirlar.length === 0 && page > 1) {
    redirect(raporAdresi(suzgec, { ...yer, page: sayfaDisi(siralama.deger, perPage) ?? 1 }, YOL));
  }
  const karsilastir = <T,>(onceki: T | null | undefined) => (k.onceki ? { onceki: onceki ?? null, not } : undefined);

  return (
    <div>
      <PageHeader title="Raporum" description="Dönem cirom, hakedişim ve tahsilatım" />
      {/* Dönem değişince arama ve sayfa boyu korunur (arama formu ve Temizle gibi). */}
      <DonemSecici anahtar={donem.anahtar} yol={YOL} korunan={{ ...korunanlar(suzgec), ...(yer.per ? { per: String(yer.per) } : {}) }} />
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
        <KpiCard
          etiket="İadem"
          varyant="baglamsal"
          iyiYon="asagi-iyi"
          bosDavranisi="sifir"
          tutar={ozet.tamam ? ozet.deger.simdi.iade : null}
          taban={MATRAH}
          karsilastirma={ozet.tamam ? karsilastir(ozet.deger.onceki?.iade) : undefined}
          hataReferansi={ozet.tamam ? undefined : ozet.referans}
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

      <div className="mt-6">
        <CiroSiralamasi sonuc={siralama} suzgec={suzgec} per={yer.per} saticiId={session.user.id} tumZamanlar={donem.anahtar === "tum"} />
        {siralama.tamam && (
          <ListeSayfalama sayfa={sayfa} toplam={siralama.deger.toplam} adres={raporAdresi(suzgec, {}, YOL)} />
        )}
      </div>
    </div>
  );
}
