import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { ListeSayfalama } from "@/components/liste/ListeSayfalama";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { gizliSutunlar } from "@/lib/liste/sutun-tercihi";
import { kpiGetir } from "@/lib/kpi/getir";
import { acanSecenekleri, onayKpileri, onayListesi, onayPaneli } from "@/lib/onay-listesi/sorgu";
import { onayAdresi, suzgecCoz, type Parametreler } from "@/lib/onay-listesi/suzgec";
import { sayfaCoz, sayfaDisi } from "@/lib/liste/sayfa";
import { simdi, yerelGunMetni } from "@/lib/zaman";
import { KpiKartlari } from "./KpiKartlari";
import { OnayPaneli } from "./OnayPaneli";
import { OnayTablosu } from "./OnayTablosu";
import { SuzgecCubugu } from "./SuzgecCubugu";

/**
 * Onay bekleyenler (A-8, spec Ü-25): bekleyen talepler en eskisi önce; verilmiş kararlar geçmiş sekmelerinde.
 * Karar yalnız yöneticinindir; karar formu yan paneldedir (not zorunlu).
 */
export const metadata: Metadata = { title: "Onay Bekleyenler" };

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireAdmin();
  const params = await searchParams;
  const an = simdi();
  const bugun = yerelGunMetni(an);
  const sayfa = sayfaCoz(params);
  const { perPage, skip, take, yer } = sayfa;
  const { suzgec, detay } = suzgecCoz(params);
  const gizli = await gizliSutunlar("/approvals");
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
  const son = sayfaDisi(liste, perPage);
  if (son !== null) {
    redirect(onayAdresi(suzgec, { ...yer, page: son, ...(detay ? { detay } : {}) }));
  }

  return (
    <div>
      <PageHeader title="Onay Bekleyenler" description="Gerekçeyle onaya gönderilen işlemler. Karar notu zorunludur." />

      <KpiKartlari sonuc={kpi} bugun={bugun} an={an} />

      <SuzgecCubugu
        suzgec={suzgec}
        per={yer.per}
        kullanicilar={kullanicilar}
        sutunMenusu={<SutunSecici liste="/approvals" gizli={gizli} donus={adres} />}
      />

      <OnayTablosu satirlar={liste.satirlar} gizli={gizli} suzgec={suzgec} yer={yer} />

      <ListeSayfalama sayfa={sayfa} toplam={liste.toplam} adres={onayAdresi(suzgec)} />

      {/* Bulunmayan talep için panel açılmaz (spec §5). */}
      {panel && <OnayPaneli key={panel.blok.id} veri={panel} kapatAdresi={adres} />}
    </div>
  );
}
