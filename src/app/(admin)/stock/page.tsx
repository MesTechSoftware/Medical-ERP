import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { gizliSutunlariCoz } from "@/lib/liste/sutunlar";
import { ilk, type Parametreler } from "@/lib/liste/parametreler";
import { getPagination, pageCount } from "@/lib/pagination";
import { konsinyedekiMal, stokHareketleri, stokKpileri } from "@/lib/stok-listesi/sorgu";
import { SUTUNLAR, SUTUN_CEREZI } from "@/lib/stok-listesi/sutunlar";
import { bosDurum, stokAdresi, suzgecCoz } from "@/lib/stok-listesi/suzgec";
import { requireStaff } from "@/lib/session";
import { bugun, yerelGunMetni } from "@/lib/zaman";
import StockEntryForm from "./StockEntryForm";
import KonumBelgesiFormu from "./KonumBelgesiFormu";
import { addConsignment, addTransfer } from "./actions";
import DuzeltmeFormu from "./DuzeltmeFormu";
import { HareketTablosu } from "./HareketTablosu";
import { KpiKartlari } from "./KpiKartlari";
import { SuzgecCubugu } from "./SuzgecCubugu";
import { sutunlariKaydet } from "./sutunEylemi";

export default async function StockPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireStaff();
  const params = await searchParams;
  const urun = ilk(params, "urun");
  const yonetici = session.user.role === "YONETICI";
  const { page, perPage, skip, take } = getPagination({ page: ilk(params, "page") ?? undefined, per: ilk(params, "per") ?? undefined });
  const suzgec = suzgecCoz(params);
  const yer = { page, per: ilk(params, "per") ? perPage : undefined };
  const gun = yerelGunMetni(bugun());
  // Sütun tercihi çerezdedir; gizli sütun hiç çizilmez (spec §3.5).
  const gizli = gizliSutunlariCoz(SUTUNLAR, (await cookies()).get(SUTUN_CEREZI)?.value);
  const listeAdresi = stokAdresi(suzgec, yer);

  const [products, liste, sayilar, konumlar, doktorlar, sebepler, konsinyeStok] = await Promise.all([
    prisma.product.findMany({
      where: { status: "AKTIF" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    stokHareketleri(suzgec, { skip, take }),
    stokKpileri(gun),
    prisma.stockLocation.findMany({
      where: { isActive: true },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, type: true },
    }),
    prisma.doctor.findMany({
      where: { status: "AKTIF" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
    // B-7 §(2): sebep tanım tablosu; pasif sebep seçilemez.
    prisma.stockAdjustmentReason.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    // Konsinyedeki mal: konum × ürün tek okuma (`konumStoklari`, B-4-9); pasif ürün de görünür.
    konsinyedekiMal(),
  ]);
  // Son sayfanın satırı kalmamış ya da elle büyük sayfa yazılmışsa son sayfaya gidilir (PR #85).
  if (liste.satirlar.length === 0 && liste.toplam > 0) {
    redirect(stokAdresi(suzgec, { ...yer, page: pageCount(liste.toplam, perPage) }));
  }
  // Sayfalama süzgeci ve sayfa boyunu korur.
  const sayfaParametreleri = {
    ...Object.fromEntries(new URL(stokAdresi(suzgec), "http://x").searchParams),
    per: ilk(params, "per") ?? undefined,
  };

  const depolar = konumlar.filter((k) => k.type === "DEPO");
  const konsinyeler = konumlar.filter((k) => k.type === "KONSINYE");
  const urunSecenekleri = products.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }));

  return (
    <div>
      <PageHeader
        title="Stok"
        description="Stok girişleri ve hareket geçmişi"
      />

      <KpiKartlari sayilar={sayilar} bugun={gun} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              Stok Girişi
            </h2>
            {/* Dashboard'un kritik stok hızlı işlemi ürünü önseçer (`?urun=`); yalnız aktif ürün. */}
            <StockEntryForm products={products} seciliUrunId={products.some((p) => p.id === urun) ? urun! : undefined} />
          </Card>

          {/* B-7 · D-2 §(2): stok düzeltme yalnız yöneticinin; sunucuda da requireAdmin. */}
          {yonetici && (
            <div className="mt-6">
              <Card>
                <h2 className="mb-1 text-sm font-semibold text-slate-900">Stok Düzeltme</h2>
                <p className="mb-4 text-xs text-slate-500">
                  Sayım farkı, hasar, kayıp, miad/imha. Kayıt anında tarihlenir; vergisel sonucu müşavirdedir.
                </p>
                <DuzeltmeFormu
                  urunler={urunSecenekleri}
                  konumlar={konumlar.map((k) => ({ value: k.id, label: k.name }))}
                  sebepler={sebepler.map((r) => ({ value: r.id, label: r.name }))}
                />
              </Card>
            </div>
          )}

          <div className="mt-6">
            <Card>
              <h2 className="mb-1 text-sm font-semibold text-slate-900">Konsinye Çıkış</h2>
              <p className="mb-4 text-xs text-slate-500">Mal depodan doktora konsinye bırakılır; satış sayılmaz.</p>
              <KonumBelgesiFormu
                ad="konsinye"
                action={addConsignment}
                secimler={[{ name: "doctorId", label: "Doktor", options: doktorlar.map((d) => ({ value: d.id, label: d.fullName })) }]}
                urunler={urunSecenekleri}
                dugme="Konsinye Çıkış Kaydet"
                basari="Konsinye çıkış kaydedildi"
              />
            </Card>
          </div>

          {konsinyeler.length > 0 && (
            <div className="mt-6">
              <Card>
                <h2 className="mb-1 text-sm font-semibold text-slate-900">Depoya Transfer</h2>
                <p className="mb-4 text-xs text-slate-500">
                  Kullanılan ya da geri gelen konsinye mal depoya alınır; satış ardından normal siparişle girilir.
                </p>
                <KonumBelgesiFormu
                  ad="transfer"
                  action={addTransfer}
                  secimler={[
                    { name: "fromLocationId", label: "Kaynak", options: konumlar.map((k) => ({ value: k.id, label: k.name })) },
                    // B-4: tek depoda hedef seçimi görünmez (UI satır sayısından türer).
                    ...(depolar.length > 1
                      ? [{ name: "toLocationId", label: "Hedef depo", options: depolar.map((k) => ({ value: k.id, label: k.name })) }]
                      : []),
                  ]}
                  gizli={depolar.length === 1 ? { toLocationId: depolar[0].id } : undefined}
                  urunler={urunSecenekleri}
                  dugme="Transfer Kaydet"
                  basari="Transfer kaydedildi"
                />
              </Card>
            </div>
          )}

          {konsinyeStok.length > 0 && (
            <div className="mt-6">
              <Card>
                <h2 className="mb-3 text-sm font-semibold text-slate-900">Konsinyedeki Mal</h2>
                <ul className="space-y-1 text-sm text-slate-700">
                  {konsinyeStok.map((r) => (
                    <li key={`${r.konum}|${r.urun}`} className="flex justify-between gap-2">
                      <span>
                        {r.konum} · {r.urun}
                      </span>
                      <span className="tabular-nums">{r.miktar}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              Hareket Geçmişi
            </h2>
            <SuzgecCubugu
              suzgec={suzgec}
              bugun={gun}
              sutunMenusu={<SutunSecici sutunlar={SUTUNLAR} gizli={gizli} action={sutunlariKaydet} donus={listeAdresi} />}
            />
            <HareketTablosu satirlar={liste.satirlar} gizli={gizli} suzgecli={bosDurum(suzgec) === "suzgecli"} />
            <Pagination
              page={page}
              totalPages={pageCount(liste.toplam, perPage)}
              total={liste.toplam}
              basePath="/stock"
              params={sayfaParametreleri}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
