import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/ui";
import { ListeSayfalama } from "@/components/liste/ListeSayfalama";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { gizliSutunlar } from "@/lib/liste/sutun-tercihi";
import { ilk, type Parametreler } from "@/lib/liste/parametreler";
import { sayfaCoz, sayfaDisi } from "@/lib/liste/sayfa";
import { konsinyedekiMal, mevcutStok, stokHareketleri, stokKpileri } from "@/lib/stok-listesi/sorgu";
import { bosDurum, stokAdresi, suzgecCoz } from "@/lib/stok-listesi/suzgec";
import { requireStaff } from "@/lib/session";
import { bugun, yerelGunMetni } from "@/lib/zaman";
import StockEntryForm from "./StockEntryForm";
import KonumBelgesiFormu from "./KonumBelgesiFormu";
import { addConsignment, addTransfer } from "./actions";
import DuzeltmeFormu from "./DuzeltmeFormu";
import { HareketTablosu } from "./HareketTablosu";
import { KpiKartlari } from "./KpiKartlari";
import { MevcutStokKarti } from "./MevcutStokKarti";
import { SuzgecCubugu } from "./SuzgecCubugu";

export default async function StockPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireStaff();
  const params = await searchParams;
  const urun = ilk(params, "urun");
  const yonetici = session.user.role === "YONETICI";
  const sayfa = sayfaCoz(params);
  const { perPage, skip, take, yer } = sayfa;
  const suzgec = suzgecCoz(params);
  const gun = yerelGunMetni(bugun());
  // Sütun tercihi çerezdedir; gizli sütun hiç çizilmez (spec §3.5).
  const gizli = await gizliSutunlar("/stock");
  const listeAdresi = stokAdresi(suzgec, yer);

  const [tumUrunler, liste, sayilar, konumlar, doktorlar, sebepler, konsinyeStok, mevcut] = await Promise.all([
    // Formlar yalnız aktif ürünü seçer; ürün süzgeci pasif ürünün eski hareketlerini de bulur (B-4-12).
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, status: true },
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
    mevcutStok(),
  ]);
  // Seçeneklerde olmayan ürün süzgeci (eski yer imi, elle yazılmış kimlik) adresten düşer: formda "Tümü"
  // görünürken uygulanırsa bir sonraki Uygula onu sessizce kaldırırdı (B-4-12).
  if (suzgec.urunId && !tumUrunler.some((p) => p.id === suzgec.urunId)) {
    redirect(stokAdresi({ ...suzgec, urunId: null }, yer));
  }
  // Son sayfanın satırı kalmamış ya da elle büyük sayfa yazılmışsa son sayfaya gidilir (PR #85).
  const son = sayfaDisi(liste, perPage);
  if (son !== null) {
    redirect(stokAdresi(suzgec, { ...yer, page: son }));
  }

  const products = tumUrunler.filter((p) => p.status === "AKTIF").map(({ id, name, code }) => ({ id, name, code }));
  const secenek = (p: { id: string; name: string; code: string }) => ({ value: p.id, label: `${p.name} (${p.code})` });
  const urunSecenekleri = products.map(secenek);
  const urunSuzgeci = tumUrunler.map((p) => {
    const o = secenek(p);
    return p.status === "AKTIF" ? o : { ...o, label: `${o.label} · pasif` };
  });
  const depolar = konumlar.filter((k) => k.type === "DEPO");
  const konsinyeler = konumlar.filter((k) => k.type === "KONSINYE");

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
                    // A-4-4 (F-5): kaynak yalnız konsinye konumudur; Merkez Depo kaynak olarak listelenmez.
                    { name: "fromLocationId", label: "Kaynak", options: konsinyeler.map((k) => ({ value: k.id, label: k.name })) },
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

          <div className="mt-6">
            <MevcutStokKarti satirlar={mevcut} />
          </div>

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
              urunler={urunSuzgeci}
              sutunMenusu={<SutunSecici liste="/stock" gizli={gizli} donus={listeAdresi} />}
            />
            <HareketTablosu satirlar={liste.satirlar} gizli={gizli} suzgecli={bosDurum(suzgec) === "suzgecli"} />
            <ListeSayfalama sayfa={sayfa} toplam={liste.toplam} adres={stokAdresi(suzgec)} />
          </Card>
        </div>
      </div>
    </div>
  );
}
