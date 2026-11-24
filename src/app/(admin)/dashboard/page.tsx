import { prisma } from "@/lib/db";
import type { OrderStatus } from "@/generated/prisma/enums";
import { BRUT, MATRAH } from "@/lib/taban";
import { aktiviteAkisi } from "@/lib/aktivite";
import { hazirlamaSureleri, operasyonSayilari, siparisDagilimi } from "@/lib/dashboard";
import { aralikCoz, dashboardAraligi } from "@/lib/donem";
import { formatGunSuresi, formatSayi } from "@/lib/format";
import { istisnalar } from "@/lib/istisnalar";
import { kpiGetir } from "@/lib/kpi/getir";
import { cubukOranlari, medyanGun } from "@/lib/kpi/olcek";
import { ciroOzeti, enCokSevkEdilenler, tahsilatToplamlari } from "@/lib/reports-service";
import { seritKutulari } from "@/lib/sayfa-ozetleri";
import { dagilimAdresi, TUM_SIPARISLER } from "@/lib/siparis-listesi/suzgec";
import { requireStaff } from "@/lib/session";
import { aktifUrunStoklari } from "@/lib/stok";
import { simdi } from "@/lib/zaman";
import { PageHeader, Card, durumEtiketi } from "@/components/ui";
import { SayfaSeridi } from "@/components/SayfaSeridi";
import { BarMicro } from "@/components/grafik/BarMicro";
import { YigilmisOranCubugu, type DilimTonu } from "@/components/grafik/YigilmisOranCubugu";
import { KovaOzeti } from "@/components/kpi/KovaOzeti";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import { AktiviteAkisi } from "@/components/dashboard/AktiviteAkisi";
import { AkisYenileyici } from "@/components/dashboard/AkisYenileyici";
import { DikkatListesi } from "@/components/dashboard/DikkatListesi";
import { OperasyonKpiSatiri } from "@/components/dashboard/OperasyonKpiSatiri";
import { KritikStokListesi } from "@/components/dashboard/KritikStokListesi";
import { ZamanFiltresi } from "@/components/dashboard/ZamanFiltresi";
import { ALAN, YERLESIM } from "@/components/dashboard/yerlesim";

/** Durum dağılımının tonları: anlam taşıyan durum semantik renkte, süreç adımları nötr (ADR-009). */
const DILIM_TONU: Record<OrderStatus, DilimTonu> = {
  BEKLIYOR: "uyari",
  HAZIRLANIYOR: "notr",
  KARGOLANDI: "notrAcik",
  TESLIM_EDILDI: "olumlu",
  IPTAL: "hata",
};

function Yuklenemedi({ referans }: { referans: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-negative">Yüklenemedi</p>
      <p className="text-xs text-slate-500">
        Hata referansı: <span className="font-mono">{referans}</span>
      </p>
    </div>
  );
}

function Blok({ alan, baslik, not, children }: { alan: string; baslik: string; not?: string; children: React.ReactNode }) {
  return (
    <div className={`min-w-0 ${alan}`}>
      <Card>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
          <h2 className="text-sm font-semibold text-slate-900">{baslik}</h2>
          {not && <p className="text-xs text-slate-500">{not}</p>}
        </div>
        {children}
      </Card>
    </div>
  );
}

/**
 * Dashboard (YONETICI + OPERASYON; brief "Tasarım 2. Tur Eki", ADR-010). Zaman filtresi URL'dedir
 * (K-D2, varsayılan bu ay): ciro, tahsilat, durum dağılımı, en çok sevk edilenler ve medyan hazırlama
 * süresi seçili aralıktan; bekleyen, kargolanacak, kritik stok ve istisnalar anlıktır. Her blok kendi
 * hata alanında (X-3). Ekran prim/hakediş taşımaz; aktivite akışı yalnız yöneticinin (D-2).
 */
export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ aralik?: string }> }) {
  const session = await requireStaff();
  const rol = session.user.role;
  const yonetici = rol === "YONETICI";
  const an = simdi();
  const r = dashboardAraligi(aralikCoz((await searchParams).aralik), an);
  const baglam = { yol: "/dashboard", kullaniciId: session.user.id };

  // Stok bir kez okunur: kritik stok listesi, istisnalar ve sayfa şeridi aynı okumayı paylaşır.
  const stoklar = await kpiGetir(() => aktifUrunStoklari(), baglam);
  // D-2: Ciro ve Tahsilat yalnız yöneticinindir; OPERASYON onların yerine onay ve kalan kartlarını görür.
  const [ciro, tahsilat, bekleyen, kargolanacak, sureler, dagilim, enCok, istisna, akis, kutular, sayilar] = await Promise.all([
    yonetici ? kpiGetir(() => ciroOzeti(r, { tur: "sirket" }), baglam) : null,
    // Tek sorgu: kovalar + bu dönem + karşılaştırma dönemi.
    yonetici ? kpiGetir(() => tahsilatToplamlari([...r.kovalar.map((k) => k.aralik), r.simdi, r.onceki]), baglam) : null,
    kpiGetir(() => prisma.order.count({ where: { status: "BEKLIYOR" } }), baglam),
    kpiGetir(() => prisma.order.count({ where: { status: "HAZIRLANIYOR" } }), baglam),
    kpiGetir(() => hazirlamaSureleri(r.simdi), baglam),
    kpiGetir(() => siparisDagilimi(r.simdi, TUM_SIPARISLER), baglam),
    kpiGetir(() => enCokSevkEdilenler(r.simdi, 5), baglam),
    stoklar.tamam ? kpiGetir(() => istisnalar(rol, stoklar.deger, an), baglam) : stoklar,
    yonetici ? kpiGetir(() => aktiviteAkisi(rol, 15), baglam) : null,
    seritKutulari(rol, { aralik: r.simdi, an, stoklar: stoklar.tamam ? stoklar.deger : null }, baglam),
    yonetici ? null : kpiGetir(() => operasyonSayilari(an), baglam),
  ]);

  const n = r.kovalar.length;
  const tahsilatSerisi = tahsilat?.tamam ? tahsilat.deger.slice(0, n) : [];
  const medyan = sureler.tamam ? medyanGun(sureler.deger) : null;
  const hazirlama = `Medyan hazırlama (${r.donemNotu.toLocaleLowerCase("tr-TR")}): ${
    !sureler.tamam ? "yüklenemedi" : medyan === null ? "yetersiz veri" : formatGunSuresi(medyan)
  }`;
  const enCokOranlari = enCok.tamam ? cubukOranlari(enCok.deger.map((u) => u.miktar)) : [];

  return (
    <div>
      <PageHeader
        title="Genel Bakış"
        description="Operasyon özeti"
        action={<ZamanFiltresi secili={r.anahtar} className="hidden md:block" />}
      />

      {/* Telefonda filtre KPI'ların hemen üstünde, tam genişlik (brief §2). */}
      <ZamanFiltresi secili={r.anahtar} className="mb-4 md:hidden" />

      {ciro && tahsilat ? (
        <KpiSatiri>
          <KpiCard
            etiket="Ciro"
            varyant="birincil"
            iyiYon="yukari-iyi"
            bosDavranisi="sifir"
            tutar={ciro.tamam ? ciro.deger.simdi.ciro : null}
            taban={MATRAH}
            karsilastirma={ciro.tamam ? { onceki: ciro.deger.onceki?.ciro ?? null, not: r.karsilastirmaNotu } : undefined}
            trend={
              ciro.tamam
                ? {
                    seri: ciro.deger.seri,
                    sonDevamEdiyor: true,
                    ozet: <KovaOzeti baslik={`${r.seriBasligi} ciro`} kovalar={r.kovalar} tur={r.kovaTuru} seri={ciro.deger.seri} taban={MATRAH} />,
                  }
                : undefined
            }
            donemNotu={r.donemNotu}
            hataReferansi={ciro.tamam ? undefined : ciro.referans}
          />
          <KpiCard
            etiket="Tahsilat"
            varyant="ikincil"
            iyiYon="yukari-iyi"
            bosDavranisi="sifir"
            tutar={tahsilat.tamam ? tahsilat.deger[n] : null}
            taban={BRUT}
            karsilastirma={tahsilat.tamam ? { onceki: tahsilat.deger[n + 1] ?? null, not: r.karsilastirmaNotu } : undefined}
            trend={
              tahsilat.tamam
                ? {
                    seri: tahsilatSerisi,
                    sonDevamEdiyor: true,
                    ozet: <KovaOzeti baslik={`${r.seriBasligi} tahsilat`} kovalar={r.kovalar} tur={r.kovaTuru} seri={tahsilatSerisi} taban={BRUT} />,
                  }
                : undefined
            }
            donemNotu={r.donemNotu}
            hataReferansi={tahsilat.tamam ? undefined : tahsilat.referans}
          />
          <KpiCard
            etiket="Bekleyen sipariş"
            varyant="ikincil"
            iyiYon="asagi-iyi"
            bosDavranisi="sifir"
            adet={bekleyen.tamam ? bekleyen.deger : null}
            karsilastirma={{ anlik: "şu an" }}
            ikincilMetrik={hazirlama}
            vurgu={bekleyen.tamam && bekleyen.deger > 0 ? "uyari" : undefined}
            hataReferansi={bekleyen.tamam ? undefined : bekleyen.referans}
          />
          <KpiCard
            etiket="Kargolanacak"
            varyant="baglamsal"
            iyiYon="asagi-iyi"
            bosDavranisi="sifir"
            adet={kargolanacak.tamam ? kargolanacak.deger : null}
            karsilastirma={{ anlik: "şu an" }}
            vurgu={kargolanacak.tamam && kargolanacak.deger > 0 ? "uyari" : undefined}
            hataReferansi={kargolanacak.tamam ? undefined : kargolanacak.referans}
          />
        </KpiSatiri>
      ) : (
        sayilar && <OperasyonKpiSatiri bekleyen={bekleyen} kargolanacak={kargolanacak} stoklar={stoklar} sayilar={sayilar} hazirlama={hazirlama} />
      )}

      <div className="@container">
        <div className={`grid items-start gap-6 ${yonetici ? YERLESIM.yonetici : YERLESIM.operasyon}`}>
          <Blok alan={ALAN.dagilim} baslik="Sipariş durumları" not={`${r.donemNotu} açılan siparişler`}>
            {dagilim.tamam ? (
              <YigilmisOranCubugu
                dilimler={(Object.keys(DILIM_TONU) as OrderStatus[]).map((s) => ({
                  anahtar: s,
                  etiket: durumEtiketi(s),
                  adet: dagilim.deger[s],
                  ton: DILIM_TONU[s],
                  href: dagilimAdresi(s, r.simdi),
                }))}
                bosMetin="Bu aralıkta sipariş yok"
              />
            ) : (
              <Yuklenemedi referans={dagilim.referans} />
            )}
          </Blok>

          <Blok alan={ALAN.kritik} baslik="Kritik stok" not="şu an">
            {stoklar.tamam ? <KritikStokListesi stoklar={stoklar.deger} /> : <Yuklenemedi referans={stoklar.referans} />}
          </Blok>

          <div className={`min-w-0 ${ALAN.dikkat}`}>
            {istisna.tamam ? (
              <DikkatListesi istisnalar={istisna.deger} />
            ) : (
              <Card>
                <h2 className="mb-3 text-sm font-semibold text-slate-900">Dikkat gerektirenler</h2>
                <Yuklenemedi referans={istisna.referans} />
              </Card>
            )}
          </div>

          {akis && (
            <div className={`min-w-0 ${ALAN.akis} @min-[984px]:relative @min-[984px]:min-h-96 @min-[984px]:self-stretch`}>
              {akis.tamam ? (
                <AktiviteAkisi satirlar={akis.deger} simdi={an} />
              ) : (
                <Card>
                  <h2 className="mb-3 text-sm font-semibold text-slate-900">Son hareketler</h2>
                  <Yuklenemedi referans={akis.referans} />
                </Card>
              )}
            </div>
          )}

          <Blok alan={ALAN.encok} baslik="En çok sevk edilen ürünler" not={r.donemNotu}>
            {enCok.tamam ? (
              <BarMicro
                satirlar={enCok.deger.map((u, i) => ({
                  anahtar: u.urunId,
                  etiket: u.ad,
                  deger: `${formatSayi(u.miktar)} adet`,
                  oran: enCokOranlari[i],
                }))}
              />
            ) : (
              <Yuklenemedi referans={enCok.referans} />
            )}
          </Blok>
        </div>
      </div>

      <SayfaSeridi kutular={kutular} donemNotu={r.donemNotu} />

      {/* K-D3: akış sekme görünürken dakikada bir tazelenir; akış yalnız yöneticinin. */}
      {yonetici && <AkisYenileyici />}
    </div>
  );
}
