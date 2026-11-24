import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { PageHeader, LinkButton } from "@/components/ui";
import { ListeSayfalama } from "@/components/liste/ListeSayfalama";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { gizliSutunlar } from "@/lib/liste/sutun-tercihi";
import { sayfaCoz, sayfaDisi } from "@/lib/liste/sayfa";
import { bugun } from "@/lib/zaman";
import { fiyatListeleri, fiyatListesiKpileri, fiyatListesiPaneli } from "@/lib/fiyat-listesi-listesi/sorgu";
import { listeAdresi, suzgecCoz, type Parametreler } from "@/lib/fiyat-listesi-listesi/suzgec";
import { KpiKartlari } from "./KpiKartlari";
import { ListePaneli } from "./ListePaneli";
import { ListeTablosu } from "./ListeTablosu";
import { SuzgecCubugu } from "./SuzgecCubugu";

/** Fiyat listeleri (X-10, spec Ü-21) — yalnız yönetici. Cariye atama cari kartında, satır yazımı detayda. */
export const metadata: Metadata = { title: "Fiyat Listeleri" };

export default async function PriceListsPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  await requireAdmin();
  const params = await searchParams;
  const sayfa = sayfaCoz(params);
  const { perPage, skip, take, yer } = sayfa;
  const { suzgec, detay } = suzgecCoz(params);
  const gizli = await gizliSutunlar("/price-lists");
  const adres = listeAdresi(suzgec, yer);

  // Gün bir kez okunur: "Aktif liste" kartı ile Aktif sekmesi aynı günü sayar (X-10-6).
  const gun = bugun();
  const [liste, sayilar, panel] = await Promise.all([
    fiyatListeleri(suzgec, { skip, take }, gun),
    fiyatListesiKpileri(gun),
    detay ? fiyatListesiPaneli(detay, gun) : null,
  ]);

  // Sayfa dışı adres son sayfaya gider; boş durum "hiç kayıt yok" demesin.
  const son = sayfaDisi(liste, perPage);
  if (son !== null) {
    redirect(listeAdresi(suzgec, { ...yer, page: son, ...(detay ? { detay } : {}) }));
  }

  return (
    <div>
      <PageHeader
        title="Fiyat Listeleri"
        description="Liste fiyatı ve barem satırları. Atanmamış cari varsayılan listeyi kullanır."
        action={<LinkButton href="/price-lists/new" ikon="yeni">Yeni Liste</LinkButton>}
      />

      <KpiKartlari
        sayilar={sayilar}
        fiyatsizAdresi={sayilar.varsayilanListeId ? listeAdresi(suzgec, { ...yer, detay: sayilar.varsayilanListeId }) : null}
      />

      <SuzgecCubugu
        suzgec={suzgec}
        sutunMenusu={<SutunSecici liste="/price-lists" gizli={gizli} donus={adres} />}
      />

      <ListeTablosu satirlar={liste.satirlar} gizli={gizli} suzgec={suzgec} yer={yer} />

      <ListeSayfalama sayfa={sayfa} toplam={liste.toplam} adres={listeAdresi(suzgec)} />

      {/* Geçersiz ya da bulunamayan kimlikte panel açılmaz (spec §3.5). */}
      {panel && <ListePaneli key={panel.liste.id} veri={panel} kapatAdresi={adres} />}
    </div>
  );
}
