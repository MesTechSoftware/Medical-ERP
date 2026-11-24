import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { PageHeader, LinkButton } from "@/components/ui";
import { ListeSayfalama } from "@/components/liste/ListeSayfalama";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { gizliSutunlar } from "@/lib/liste/sutun-tercihi";
import { sayfaCoz, sayfaDisi } from "@/lib/liste/sayfa";
import { saticiSecenekleri, siparisListesi, siparisPaneli, siparisSekmeSayilari } from "@/lib/siparis-listesi/sorgu";
import { SATICISIZ, siparisAdresi, suzgecCoz, TUM_SIPARISLER, type Parametreler } from "@/lib/siparis-listesi/suzgec";
import { SiparisPaneli } from "@/components/siparis/SiparisPaneli";
import { SiparisTablosu } from "@/components/siparis/SiparisTablosu";
import { SuzgecCubugu } from "@/components/siparis/SuzgecCubugu";

export const metadata: Metadata = { title: "Siparişler" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  await requireStaff();
  const params = await searchParams;
  const sayfa = sayfaCoz(params);
  const { perPage, skip, take, yer } = sayfa;
  const { suzgec, detay } = suzgecCoz(params);
  const gizli = await gizliSutunlar("/orders");
  const adres = siparisAdresi(suzgec, yer);

  // Seçeneklerde olmayan satıcı süzgeci (eski yer imi, elle yazılmış kimlik) liste sorgularından önce adresten
  // düşer: formda "Tümü" görünürken uygulanırsa bir sonraki Uygula onu sessizce kaldırırdı (B-4-12 deseni).
  const saticilarP = saticiSecenekleri();
  if (suzgec.satici && suzgec.satici !== SATICISIZ && !(await saticilarP).some((s) => s.id === suzgec.satici)) {
    redirect(siparisAdresi({ ...suzgec, satici: null }, { ...yer, ...(detay ? { detay } : {}) }));
  }

  const [liste, sayilar, panel, saticilar] = await Promise.all([
    siparisListesi(suzgec, { skip, take }, TUM_SIPARISLER),
    siparisSekmeSayilari(suzgec, TUM_SIPARISLER),
    detay ? siparisPaneli(detay, TUM_SIPARISLER) : null,
    saticilarP,
  ]);

  // Sayfa dışı adres son sayfaya gider; boş durum "hiç kayıt yok" demesin.
  const son = sayfaDisi(liste, perPage);
  if (son !== null) {
    redirect(siparisAdresi(suzgec, { ...yer, page: son, ...(detay ? { detay } : {}) }));
  }

  return (
    <div>
      <PageHeader
        title="Siparişler"
        description="Doktor ve bayi siparişleri, durum yönetimi"
        action={<LinkButton href="/orders/new" ikon="yeni">Yeni Sipariş</LinkButton>}
      />

      <SuzgecCubugu
        suzgec={suzgec}
        sayilar={sayilar}
        per={yer.per}
        saticilar={saticilar}
        yol="/orders"
        sutunMenusu={<SutunSecici liste="/orders" gizli={gizli} donus={adres} />}
      />

      <SiparisTablosu satirlar={liste.satirlar} gizli={gizli} suzgec={suzgec} yer={yer} yol="/orders" />

      <ListeSayfalama sayfa={sayfa} toplam={liste.toplam} adres={siparisAdresi(suzgec)} />

      {/* Bulunamayan kimlikte panel açılmaz (spec §5). */}
      {panel && <SiparisPaneli key={panel.siparis.id} veri={panel} kapatAdresi={adres} yol="/orders" />}
    </div>
  );
}
