import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { PageHeader, LinkButton } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { kpiGetir } from "@/lib/kpi/getir";
import { gizliSutunlariCoz } from "@/lib/liste/sutunlar";
import { ilk } from "@/lib/liste/parametreler";
import { getPagination, pageCount } from "@/lib/pagination";
import { gunleriAraliga, saticiSecenekleri, siparisKpileri, siparisListesi, siparisPaneli } from "@/lib/siparis-listesi/sorgu";
import { SUTUNLAR, SUTUN_CEREZI } from "@/lib/siparis-listesi/sutunlar";
import { kpiAraligi, SATICISIZ, siparisAdresi, suzgecCoz, TUM_SIPARISLER, type Parametreler } from "@/lib/siparis-listesi/suzgec";
import { simdi, yerelGunMetni } from "@/lib/zaman";
import { KpiKartlari } from "@/components/siparis/KpiKartlari";
import { SiparisPaneli } from "@/components/siparis/SiparisPaneli";
import { SiparisTablosu } from "@/components/siparis/SiparisTablosu";
import { SuzgecCubugu } from "@/components/siparis/SuzgecCubugu";
import { sutunlariKaydet } from "./sutunEylemi";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireStaff();
  const params = await searchParams;
  const per = ilk(params, "per") ?? undefined;
  const { page, perPage, skip, take } = getPagination({ page: ilk(params, "page") ?? undefined, per });
  const { suzgec, detay } = suzgecCoz(params);
  const yer = { page, per: per ? perPage : undefined };
  const gizli = gizliSutunlariCoz(SUTUNLAR, (await cookies()).get(SUTUN_CEREZI)?.value);
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
  if (liste.satirlar.length === 0 && liste.toplam > 0) {
    redirect(siparisAdresi(suzgec, { ...yer, page: pageCount(liste.toplam, perPage), ...(detay ? { detay } : {}) }));
  }

  // Sayfalama süzgeci ve (çözülmüş) sayfa boyunu korur — tablo ve panel bağlantılarıyla aynı değer.
  const sayfaParametreleri = {
    ...Object.fromEntries(new URL(siparisAdresi(suzgec), "http://x").searchParams),
    per: yer.per === undefined ? undefined : String(yer.per),
  };

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
        sutunMenusu={<SutunSecici sutunlar={SUTUNLAR} gizli={gizli} action={sutunlariKaydet} donus={adres} />}
      />

      <SiparisTablosu satirlar={liste.satirlar} gizli={gizli} suzgec={suzgec} yer={yer} yol="/orders" />

      <Pagination page={page} totalPages={pageCount(liste.toplam, perPage)} total={liste.toplam} basePath="/orders" params={sayfaParametreleri} />

      {/* Bulunamayan kimlikte panel açılmaz (spec §5). */}
      {panel && <SiparisPaneli key={panel.siparis.id} veri={panel} kapatAdresi={adres} yol="/orders" />}
    </div>
  );
}
