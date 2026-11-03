import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { kpiGetir } from "@/lib/kpi/getir";
import { gizliSutunlariCoz } from "@/lib/liste/sutunlar";
import { ilk } from "@/lib/liste/parametreler";
import { acanSecenekleri, onayKpileri, onayListesi, onayPaneli } from "@/lib/onay-listesi/sorgu";
import { SUTUNLAR, SUTUN_CEREZI } from "@/lib/onay-listesi/sutunlar";
import { onayAdresi, suzgecCoz, type Parametreler } from "@/lib/onay-listesi/suzgec";
import { getPagination, pageCount } from "@/lib/pagination";
import { simdi, yerelGunMetni } from "@/lib/zaman";
import { KpiKartlari } from "./KpiKartlari";
import { OnayPaneli } from "./OnayPaneli";
import { OnayTablosu } from "./OnayTablosu";
import { SuzgecCubugu } from "./SuzgecCubugu";
import { sutunlariKaydet } from "./sutunEylemi";

/**
 * Onay bekleyenler (A-8, spec Ü-25): bekleyen talepler en eskisi önce; verilmiş kararlar geçmiş sekmelerinde.
 * Karar yalnız yöneticinindir; karar formu yan paneldedir (not zorunlu).
 */
export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireAdmin();
  const params = await searchParams;
  const an = simdi();
  const bugun = yerelGunMetni(an);
  const per = ilk(params, "per") ?? undefined;
  const { page, perPage, skip, take } = getPagination({ page: ilk(params, "page") ?? undefined, per });
  const { suzgec, detay } = suzgecCoz(params);
  const yer = { page, per: per ? perPage : undefined };
  const gizli = gizliSutunlariCoz(SUTUNLAR, (await cookies()).get(SUTUN_CEREZI)?.value);
  const adres = onayAdresi(suzgec, yer);

  const [kullanicilar, liste, kpi, panel] = await Promise.all([
    acanSecenekleri(),
    onayListesi(suzgec, { skip, take }, an),
    kpiGetir(() => onayKpileri(bugun, an), { yol: "/approvals", kullaniciId: session.user.id }),
    detay ? onayPaneli(detay) : null,
  ]);
  // Seçeneklerde olmayan açan süzgeci (eski yer imi, elle yazılmış kimlik) adresten düşer.
  if (suzgec.acan && !kullanicilar.some((u) => u.id === suzgec.acan)) {
    redirect(onayAdresi({ ...suzgec, acan: null }, { ...yer, ...(detay ? { detay } : {}) }));
  }
  // Sayfa dışı adres son sayfaya gider; boş durum "hiç kayıt yok" demesin.
  if (liste.satirlar.length === 0 && liste.toplam > 0) {
    redirect(onayAdresi(suzgec, { ...yer, page: pageCount(liste.toplam, perPage), ...(detay ? { detay } : {}) }));
  }

  const sayfaParametreleri = {
    ...Object.fromEntries(new URL(onayAdresi(suzgec), "http://x").searchParams),
    per: yer.per === undefined ? undefined : String(yer.per),
  };

  return (
    <div>
      <PageHeader title="Onay Bekleyenler" description="Gerekçeyle onaya gönderilen işlemler. Karar notu zorunludur." />

      <KpiKartlari sonuc={kpi} bugun={bugun} an={an} />

      <SuzgecCubugu
        suzgec={suzgec}
        per={yer.per}
        kullanicilar={kullanicilar}
        sutunMenusu={<SutunSecici sutunlar={SUTUNLAR} gizli={gizli} action={sutunlariKaydet} donus={adres} />}
      />

      <OnayTablosu satirlar={liste.satirlar} gizli={gizli} suzgec={suzgec} yer={yer} />

      <Pagination page={page} totalPages={pageCount(liste.toplam, perPage)} total={liste.toplam} basePath="/approvals" params={sayfaParametreleri} />

      {/* Bulunmayan talep için panel açılmaz (spec §5). */}
      {panel && <OnayPaneli key={panel.blok.id} veri={panel} kapatAdresi={adres} />}
    </div>
  );
}
