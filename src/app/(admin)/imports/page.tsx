import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { LinkButton, PageHeader } from "@/components/ui";
import { ListeSayfalama } from "@/components/liste/ListeSayfalama";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { gizliSutunlar } from "@/lib/liste/sutun-tercihi";
import { kpiGetir } from "@/lib/kpi/getir";
import { sayfaCoz, sayfaDisi } from "@/lib/liste/sayfa";
import { partiKpileri, partiListesi, partiPaneli } from "@/lib/ice-aktarim-listesi/sorgu";
import { partiAdresi, suzgecCoz, type Parametreler } from "@/lib/ice-aktarim-listesi/suzgec";
import { simdi, yerelGunMetni } from "@/lib/zaman";
import { KpiKartlari } from "./KpiKartlari";
import { PartiPaneli } from "./PartiPaneli";
import { PartiTablosu } from "./PartiTablosu";
import { SuzgecCubugu } from "./SuzgecCubugu";

/**
 * İçe aktarım (D-6, X-16) — yalnız yönetici; devreye alma aracı. Partiler süzgeçli ve sayfalı; parti paneli kayıt
 * dağılımını ve geri almayı (X-12, gerekçeli) taşır. Yeni içe aktarım `/imports/new`'dedir (spec Ü-30).
 */
export const metadata: Metadata = { title: "İçe Aktarım" };

export default async function ImportsPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireAdmin();
  const params = await searchParams;
  const bugun = yerelGunMetni(simdi());
  const sayfa = sayfaCoz(params);
  const { perPage, skip, take, yer } = sayfa;
  const { suzgec, detay } = suzgecCoz(params);
  const gizli = await gizliSutunlar("/imports");
  const adres = partiAdresi(suzgec, yer);

  const [liste, kpi, panel] = await Promise.all([
    partiListesi(suzgec, { skip, take }),
    kpiGetir(() => partiKpileri(bugun), { yol: "/imports", kullaniciId: session.user.id }),
    detay ? partiPaneli(detay) : null,
  ]);
  // Sayfa dışı adres son sayfaya gider; boş durum "hiç kayıt yok" demesin.
  const son = sayfaDisi(liste, perPage);
  if (son !== null) {
    redirect(partiAdresi(suzgec, { ...yer, page: son, ...(detay ? { detay } : {}) }));
  }

  return (
    <div>
      <PageHeader
        title="İçe Aktarım"
        description="Devreye alma partileri. Yeni içe aktarımda önce doğrulayıp önizleyin; hatalı satır varsa hiçbir kayıt yazılmaz."
        action={
          <LinkButton href="/imports/new" ikon="yeni">
            Yeni İçe Aktarım
          </LinkButton>
        }
      />

      <KpiKartlari sonuc={kpi} bugun={bugun} />

      <SuzgecCubugu suzgec={suzgec} per={yer.per} sutunMenusu={<SutunSecici liste="/imports" gizli={gizli} donus={adres} />} />

      <PartiTablosu satirlar={liste.satirlar} gizli={gizli} suzgec={suzgec} yer={yer} />

      <ListeSayfalama sayfa={sayfa} toplam={liste.toplam} adres={partiAdresi(suzgec)} />

      {/* Bulunmayan parti için panel açılmaz. */}
      {panel && <PartiPaneli key={panel.id} veri={panel} kapatAdresi={adres} />}
    </div>
  );
}
