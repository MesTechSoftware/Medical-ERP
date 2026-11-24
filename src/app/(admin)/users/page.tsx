import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { PageHeader, LinkButton } from "@/components/ui";
import { ListeSayfalama } from "@/components/liste/ListeSayfalama";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { gizliSutunlar } from "@/lib/liste/sutun-tercihi";
import { sayfaCoz, sayfaDisi } from "@/lib/liste/sayfa";
import { kullaniciKpileri, kullaniciListesi, kullaniciPaneli } from "@/lib/kullanici-listesi/sorgu";
import { kullaniciAdresi, suzgecCoz, type GorenRol, type Parametreler } from "@/lib/kullanici-listesi/suzgec";
import { KpiKartlari } from "./KpiKartlari";
import { KullaniciPaneli } from "./KullaniciPaneli";
import { KullaniciTablosu } from "./KullaniciTablosu";
import { SuzgecCubugu } from "./SuzgecCubugu";

/** Kullanıcı sayısı küçüktür; varsayılan sayfa bütün ekibi gösterir (spec Ü-22 §3.4). */
const SAYFA_BOYU = 100;

export const metadata: Metadata = { title: "Kullanıcılar" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireStaff();
  // Kullanıcı yönetimi yalnız YONETICI'dedir. OPERASYON yalnız satıcıları görür ve salt okur (D-2, E-2).
  const gorenRol: GorenRol = session.user.role === "YONETICI" ? "YONETICI" : "OPERASYON";
  const yonetici = gorenRol === "YONETICI";
  const params = await searchParams;
  const sayfa = sayfaCoz(params, SAYFA_BOYU);
  const { perPage, skip, take, yer } = sayfa;
  const { suzgec, detay } = suzgecCoz(params, gorenRol);
  const gizli = await gizliSutunlar("/users");
  const adres = kullaniciAdresi(suzgec, yer);

  const [liste, sayilar, panel] = await Promise.all([
    kullaniciListesi(suzgec, gorenRol, { skip, take }),
    kullaniciKpileri(gorenRol),
    detay ? kullaniciPaneli(detay, gorenRol) : null,
  ]);

  // Sayfa dışı adres son sayfaya gider; boş durum "hiç kayıt yok" demesin.
  const son = sayfaDisi(liste, perPage);
  if (son !== null) {
    redirect(kullaniciAdresi(suzgec, { ...yer, page: son, ...(detay ? { detay } : {}) }));
  }

  return (
    <div>
      <PageHeader
        title="Kullanıcılar"
        description={yonetici ? "Hesaplar yalnız buradan açılır" : "Satıcılar"}
        action={yonetici && <LinkButton href="/users/new" ikon="yeni">Yeni Kullanıcı</LinkButton>}
      />

      <KpiKartlari sayilar={sayilar} gorenRol={gorenRol} />

      <SuzgecCubugu
        suzgec={suzgec}
        gorenRol={gorenRol}
        sutunMenusu={<SutunSecici liste="/users" gizli={gizli} donus={adres} />}
      />

      <KullaniciTablosu satirlar={liste.satirlar} gizli={gizli} yonetici={yonetici} suzgec={suzgec} yer={yer} />

      <ListeSayfalama sayfa={sayfa} toplam={liste.toplam} adres={kullaniciAdresi(suzgec)} />

      {/* Kapsam dışı ya da bulunamayan kimlikte panel açılmaz (spec §5, D-2-3). */}
      {panel && <KullaniciPaneli key={panel.kullanici.id} veri={panel} kapatAdresi={adres} yonetici={yonetici} />}
    </div>
  );
}
