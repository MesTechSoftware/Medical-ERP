import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { PageHeader, Card, LinkButton } from "@/components/ui";
import { ListeSayfalama } from "@/components/liste/ListeSayfalama";
import { sayfaCoz, sayfaDisi } from "@/lib/liste/sayfa";
import { doktorKpileri, doktorListesi, doktorPaneli, doktorSuzgecSecenekleri } from "@/lib/doktor-listesi/sorgu";
import { doktorAdresi, saticiyiDogrula, suzgecCoz, type Parametreler } from "@/lib/doktor-listesi/suzgec";
import { simdi } from "@/lib/zaman";
import { kapsamliDoktorlariGetir } from "@/lib/doctor";
import TransferForm from "./TransferForm";
import { DoktorPaneli } from "./DoktorPaneli";
import { DoktorTablosu } from "./DoktorTablosu";
import { KpiKartlari } from "./KpiKartlari";
import { SuzgecCubugu } from "./SuzgecCubugu";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { gizliSutunlar } from "@/lib/liste/sutun-tercihi";

export default async function AdminDoctorsPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireStaff();
  // Cariyi OPERASYON da görür (X-13 §(1)); devir yalnız YONETICI (X-13 §(5)) — yetki action'dadır.
  const devirYetkisi = session.user.role === "YONETICI";
  const params = await searchParams;
  const sayfa = sayfaCoz(params);
  const { perPage, skip, take, yer } = sayfa;
  // X-8 §(5) hesap sınıfı, A-13 §(5) eksik fatura bilgisi ve diğer süzgeçler birleşir (X-8-4).
  const cozulen = suzgecCoz(params);
  const detay = cozulen.detay;
  const an = simdi();
  // Bilinmeyen ya da pasif satıcı süzgeci yok sayılır: liste, etiket ve sayaç aynı süzgeci görür.
  const secenekler = await doktorSuzgecSecenekleri();
  const suzgec = saticiyiDogrula(cozulen.suzgec, secenekler.saticilar.map((s) => s.id));
  // Sütun tercihi çerezdedir; gizli sütun hiç çizilmez (spec §3.4).
  const gizli = await gizliSutunlar("/doctors");
  const listeAdresi = doktorAdresi(suzgec, yer);

  // FR-05: admin TÜM doktorları görür.
  const [liste, sayilar, panel] = await Promise.all([
    doktorListesi(suzgec, { skip, take }, kapsamliDoktorlariGetir(session.user), an),
    doktorKpileri(),
    detay ? doktorPaneli(detay) : null,
  ]);

  // Son sayfanın satırı silinmiş ya da elle büyük sayfa yazılmışsa son sayfaya gidilir; boş durum
  // "hiç kayıt yok" demesin.
  const son = sayfaDisi(liste, perPage);
  if (son !== null) {
    redirect(doktorAdresi(suzgec, { ...yer, page: son, ...(detay ? { detay } : {}) }));
  }

  return (
    <div>
      <PageHeader
        title="Doktorlar"
        description="Doktor ve bayi carileri, satıcı devirleri"
        action={devirYetkisi ? <LinkButton href="/doctors/new" ikon="yeni">Yeni Cari</LinkButton> : undefined}
      />

      <KpiKartlari sayilar={sayilar} />

      {sayilar.sahipsiz > 0 && (
        <div className="mb-4 rounded-lg border border-critical/30 bg-critical-bg px-4 py-3 text-sm text-critical">
          <strong>{sayilar.sahipsiz}</strong> doktor sahipsiz havuzda. Bir satıcıya
          atanana kadar bu doktorlara sipariş girilemez.
        </div>
      )}

      <SuzgecCubugu suzgec={suzgec} secenekler={secenekler} sutunMenusu={<SutunSecici liste="/doctors" gizli={gizli} donus={listeAdresi} />} />

      {/*
        Toplu devir (X-17 §(4)): satırlardaki kutular bu forma `form` niteliğiyle bağlıdır. Çubuk yalnız
        seçim varken (ya da devir sonucunu gösterirken) görünür (CSS `:has`).
      */}
      <div className="[&:not(:has(input[name=doctorId]:checked))_#toplu-cubuk:not(:has([data-sonuc]))]:hidden">
        {devirYetkisi && (
          <div id="toplu-cubuk" className="mb-4">
            <Card>
              <TransferForm formId="toplu-devir" sellers={secenekler.saticilar} />
            </Card>
          </div>
        )}

        <DoktorTablosu satirlar={liste.satirlar} gizli={gizli} devirYetkisi={devirYetkisi} suzgec={suzgec} yer={yer} an={an} />
      </div>

      <ListeSayfalama sayfa={sayfa} toplam={liste.toplam} adres={doktorAdresi(suzgec)} />

      {/* Geçersiz ya da bulunamayan kimlikte panel açılmaz (spec §3.6). */}
      {panel && (
        <DoktorPaneli key={panel.doktor.id} veri={panel} kapatAdresi={listeAdresi} yonetici={devirYetkisi} />
      )}
    </div>
  );
}
