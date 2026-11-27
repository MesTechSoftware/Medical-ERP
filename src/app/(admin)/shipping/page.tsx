import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { PageHeader, Card } from "@/components/ui";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { BAGLANTI } from "@/components/stil";
import { BilgiSeridi } from "@/components/BilgiSeridi";
import { ListeSayfalama } from "@/components/liste/ListeSayfalama";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { gizliSutunlar } from "@/lib/liste/sutun-tercihi";
import { kpiGetir } from "@/lib/kpi/getir";
import { firmaSecenekleri, kargoBekleyenler, kargoKpileri, kismiSecimi, sevkiyatListesi } from "@/lib/kargo-listesi/sorgu";
import { FIRMASIZ, kargoAdresi, suzgecCoz, type Parametreler } from "@/lib/kargo-listesi/suzgec";
import { sayfaCoz, sayfaDisi } from "@/lib/liste/sayfa";
import { simdi, yerelGunMetni } from "@/lib/zaman";
import { BekleyenTablosu } from "./BekleyenTablosu";
import { KismiPanel } from "./KismiPanel";
import { KpiKartlari } from "./KpiKartlari";
import { SevkiyatTablosu } from "./SevkiyatTablosu";
import { SuzgecCubugu } from "./SuzgecCubugu";

export const metadata: Metadata = { title: "Kargo" };

export default async function ShippingPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireStaff();
  const params = await searchParams;
  const sayfa = sayfaCoz(params);
  const { perPage, skip, take, yer } = sayfa;
  const { suzgec, kismi } = suzgecCoz(params);
  const gizli = await gizliSutunlar("/shipping");
  const adres = kargoAdresi(suzgec, yer);
  const bugun = yerelGunMetni(simdi());

  // Seçeneklerde olmayan firma süzgeci (eski yer imi, elle yazılmış kimlik) liste sorgularından önce adresten düşer.
  const firmalarP = firmaSecenekleri();
  if (suzgec.firma && suzgec.firma !== FIRMASIZ && !(await firmalarP).some((f) => f.id === suzgec.firma)) {
    redirect(kargoAdresi({ ...suzgec, firma: null }, { ...yer, ...(kismi ? { kismi } : {}) }));
  }

  // KPI sayımları bekleyenler okunurken başlar; bekleyen kartları aynı okumadan sayılır.
  const bekleyenlerP = kargoBekleyenler();
  const [bekleyenler, liste, firmalar, kpi] = await Promise.all([
    bekleyenlerP,
    sevkiyatListesi(suzgec, { skip, take }),
    firmalarP,
    kpiGetir(() => kargoKpileri(bugun, bekleyenlerP), { yol: "/shipping", kullaniciId: session.user.id }),
  ]);
  // Sayfa dışı adres son sayfaya gider; boş durum "hiç kayıt yok" demesin.
  const son = sayfaDisi(liste, perPage);
  if (son !== null) {
    redirect(kargoAdresi(suzgec, { ...yer, page: son, ...(kismi ? { kismi } : {}) }));
  }

  const aktifFirmalar = firmalar.filter((f) => f.isActive);
  const panel = kismiSecimi(bekleyenler, kismi);
  // Sevk başarı bildirimi: kimlik DB'den doğrulanır, bağlantı sunucuda kurulur; parametreden metin alınmaz.
  const sevkiyatId = typeof params.sevkiyat === "string" && params.sevkiyat.length <= 40 ? params.sevkiyat : null;
  const yeniSevkiyat = sevkiyatId ? await prisma.shipment.findUnique({ where: { id: sevkiyatId }, select: { documentNo: true, orderId: true } }) : null;

  return (
    <div>
      <PageHeader title="Kargo" description="Hazırlanan siparişleri kargoya verin" />

      {yeniSevkiyat && (
        <p data-sevkiyat-bildirimi className="mb-4 text-sm text-slate-700">
          {yeniSevkiyat.documentNo} oluşturuldu.{" "}
          <Link href={`/orders/${yeniSevkiyat.orderId}#fatura-${yeniSevkiyat.documentNo}`} className={BAGLANTI}>
            Fatura bilgisi
          </Link>
        </p>
      )}

      <BilgiSeridi ham={params.bilgi} />

      <KpiKartlari sonuc={kpi} bugun={bugun} yonetici={session.user.role === "YONETICI"} />

      <div className="mb-6">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Kargo Bekleyenler ({bekleyenler.length})</h2>
          <BekleyenTablosu satirlar={bekleyenler} firmalar={aktifFirmalar} kismiAdresi={(id) => kargoAdresi(suzgec, { ...yer, kismi: id })} yonetici={session.user.role === "YONETICI"} />
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Sevkiyatlar</h2>
        <SuzgecCubugu
          suzgec={suzgec}
          bugun={bugun}
          per={yer.per}
          firmalar={firmalar}
          sutunMenusu={<SutunSecici liste="/shipping" gizli={gizli} donus={adres} />}
        />
        <SevkiyatTablosu satirlar={liste.satirlar} gizli={gizli} suzgec={suzgec} />
      </Card>

      <ListeSayfalama sayfa={sayfa} toplam={liste.toplam} adres={kargoAdresi(suzgec)} />

      {/* Kargo bekleyen olmayan sipariş için panel açılmaz (spec §3.4). */}
      {panel && <KismiPanel key={panel.id} r={panel} firmalar={aktifFirmalar} kapatAdresi={adres} />}
    </div>
  );
}
