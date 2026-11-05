import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { PageHeader, LinkButton } from "@/components/ui";
import { ListeSayfalama } from "@/components/liste/ListeSayfalama";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { gizliSutunlar } from "@/lib/liste/sutun-tercihi";
import { kpiGetir } from "@/lib/kpi/getir";
import { sayfaCoz, sayfaDisi } from "@/lib/liste/sayfa";
import { gunleriAraliga } from "@/lib/liste/parametreler";
import { saticiSecenekleri, siparisKpileri, siparisListesi, siparisPaneli } from "@/lib/siparis-listesi/sorgu";
import { kpiAraligi, SATICISIZ, siparisAdresi, suzgecCoz, TUM_SIPARISLER, type Parametreler } from "@/lib/siparis-listesi/suzgec";
import { simdi, yerelGunMetni } from "@/lib/zaman";
import { KpiKartlari } from "@/components/siparis/KpiKartlari";
import { SiparisPaneli } from "@/components/siparis/SiparisPaneli";
import { SiparisTablosu } from "@/components/siparis/SiparisTablosu";
import { SuzgecCubugu } from "@/components/siparis/SuzgecCubugu";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireStaff();
  const params = await searchParams;
  const sayfa = sayfaCoz(params);
  const { perPage, skip, take, yer } = sayfa;
  const { suzgec, detay } = suzgecCoz(params);
  const gizli = await gizliSutunlar("/orders");
  const adres = siparisAdresi(suzgec, yer);
  const aralik = kpiAraligi(suzgec, yerelGunMetni(simdi()));

  const [liste, kpi, panel, saticilar] = await Promise.all([
    siparisListesi(suzgec, { skip, take }, TUM_SIPARISLER),
    kpiGetir(() => siparisKpileri(gunleriAraliga(aralik), TUM_SIPARISLER), { yol: "/orders", kullaniciId: session.user.id }),
    detay ? siparisPaneli(detay, TUM_SIPARISLER) : null,
    saticiSecenekleri(),
  ]);

  // Seçeneklerde olmayan satıcı süzgeci (eski yer imi, elle yazılmış kimlik) adresten düşer: formda
  // "Tümü" görünürken uygulanırsa bir sonraki Uygula onu sessizce kaldırırdı (B-4-12 deseni).
  if (suzgec.satici && suzgec.satici !== SATICISIZ && !saticilar.some((s) => s.id === suzgec.satici)) {
    redirect(siparisAdresi({ ...suzgec, satici: null }, { ...yer, ...(detay ? { detay } : {}) }));
  }
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

      <KpiKartlari sonuc={kpi} aralik={aralik} yol="/orders" />

      <SuzgecCubugu
        suzgec={suzgec}
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
