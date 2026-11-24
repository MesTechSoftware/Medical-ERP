import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { LinkButton, PageHeader } from "@/components/ui";
import { ListeSayfalama } from "@/components/liste/ListeSayfalama";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { gizliSutunlar } from "@/lib/liste/sutun-tercihi";
import { kpiGetir } from "@/lib/kpi/getir";
import { sayfaCoz, sayfaDisi } from "@/lib/liste/sayfa";
import { tahsilatKpileri, tahsilatListesi, tahsilatPaneli } from "@/lib/tahsilat-listesi/sorgu";
import { kpiAraligi, suzgecCoz, tahsilatAdresi, type Parametreler } from "@/lib/tahsilat-listesi/suzgec";
import { simdi, yerelGunMetni } from "@/lib/zaman";
import { KpiKartlari } from "./KpiKartlari";
import { SuzgecCubugu } from "./SuzgecCubugu";
import { TahsilatPaneli } from "./TahsilatPaneli";
import { TahsilatTablosu } from "./TahsilatTablosu";

/**
 * Tahsilatlar (spec Ü-26): dönemin tahsilatı ve yöntem kırılımı, süzgeçli liste ve toplamı, tahsilat paneli
 * (donmuş komisyon, carinin bakiyesi, gerekçeli iptal). Yeni tahsilat `/collections/new`'dedir.
 */
export const metadata: Metadata = { title: "Tahsilatlar" };

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireStaff();
  const params = await searchParams;
  const bugun = yerelGunMetni(simdi());
  const sayfa = sayfaCoz(params);
  const { perPage, skip, take, yer } = sayfa;
  const { suzgec, detay } = suzgecCoz(params);
  const gizli = await gizliSutunlar("/collections");
  const adres = tahsilatAdresi(suzgec, yer);
  const aralik = kpiAraligi(suzgec, bugun);

  const [liste, kpi, panel] = await Promise.all([
    tahsilatListesi(suzgec, { skip, take }),
    kpiGetir(() => tahsilatKpileri(aralik), { yol: "/collections", kullaniciId: session.user.id }),
    detay ? tahsilatPaneli(detay) : null,
  ]);
  // Sayfa dışı adres son sayfaya gider; boş durum "hiç kayıt yok" demesin.
  const son = sayfaDisi(liste, perPage);
  if (son !== null) {
    redirect(tahsilatAdresi(suzgec, { ...yer, page: son, ...(detay ? { detay } : {}) }));
  }

  return (
    <div>
      <PageHeader
        title="Tahsilatlar"
        description="Carilerden yapılan tahsilatlar ve iptalleri."
        action={
          <LinkButton href="/collections/new" ikon="yeni">
            Yeni Tahsilat
          </LinkButton>
        }
      />

      <KpiKartlari sonuc={kpi} aralik={aralik} />

      <SuzgecCubugu
        suzgec={suzgec}
        bugun={bugun}
        per={yer.per}
        sutunMenusu={<SutunSecici liste="/collections" gizli={gizli} donus={adres} />}
      />

      <TahsilatTablosu satirlar={liste.satirlar} ozet={liste.ozet} gizli={gizli} suzgec={suzgec} yer={yer} />

      <ListeSayfalama sayfa={sayfa} toplam={liste.toplam} adres={tahsilatAdresi(suzgec)} />

      {/* Bulunmayan tahsilat için panel açılmaz (spec §5). */}
      {panel && <TahsilatPaneli key={panel.id} veri={panel} kapatAdresi={adres} />}
    </div>
  );
}
