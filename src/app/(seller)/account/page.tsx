import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { kapsamliDoktorlariGetir } from "@/lib/doctor";
import { donemBitisAyi, donemCoz, karsilastirmaAraliklari, karsilastirmaNotu, sonAylar } from "@/lib/donem";
import { formatla } from "@/lib/money";
import { policy } from "@/lib/policy";
import { kpiGetir } from "@/lib/kpi/getir";
import { ciroOzeti, saticiOrtalamaIskontosu } from "@/lib/reports-service";
import { kartSayisi } from "@/lib/doktor-listesi/sorgu";
import { BOS_SUZGEC as TUM_DOKTORLAR } from "@/lib/doktor-listesi/suzgec";
import { gunleriAraliga } from "@/lib/liste/parametreler";
import { siparisKpileri } from "@/lib/siparis-listesi/sorgu";
import { BOS_SUZGEC, kpiAraligi } from "@/lib/siparis-listesi/suzgec";
import { MATRAH } from "@/lib/taban";
import { simdi, yerelGunMetni } from "@/lib/zaman";
import { Card, PageHeader } from "@/components/ui";
import { KovaOzeti } from "@/components/kpi/KovaOzeti";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import { KPI_BAGLANTISI } from "@/components/stil";

function Yuklenemedi({ referans }: { referans: string }) {
  return (
    <span className="text-negative">
      Yüklenemedi <span className="font-mono text-xs text-slate-500">{referans}</span>
    </span>
  );
}

function Satir({ ad, children }: { ad: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[10rem_minmax(0,1fr)] gap-2 py-2 text-sm">
      <dt className="text-slate-500">{ad}</dt>
      <dd className="min-w-0 break-words text-slate-900">{children}</dd>
    </div>
  );
}

/**
 * Hesabım (spec Ü-34): portföy ve bu ayın özeti, profil. Kartlar öbür satıcı ekranlarının kartlarıyla aynı
 * fonksiyonlardandır — Doktorlarım = Doktorlarım'ın toplamı (`kartSayisi`), Bu ay siparişim =
 * Siparişlerim'in Toplam kartı (`siparisKpileri`), Bu ay cirom = Raporum'un Cirom'u (`ciroOzeti`); sayılar ekranlar
 * arasında aynıdır. Okumalar tek turdadır; her kart kendi hatasını taşır (ADR-010).
 *
 * BRK-01: satıcı şirkete borçlu değildir (D-01); vadesi geçmiş tutar gösterilmez (X-6 §(7)).
 */
export default async function AccountPage() {
  const session = await requireSeller();
  const saticiId = session.user.id;
  const an = simdi();
  const baglam = { yol: "/account", kullaniciId: saticiId };
  const kapsam = { tur: "satici", saticiId } as const;
  // Raporum'un varsayılan dönemiyle aynı: bu ay, geçen ayın aynı günleriyle karşılaştırmalı, son 6 ay serisi.
  const donem = donemCoz(undefined, an);
  const k = karsilastirmaAraliklari(donem, an);
  const aylar = sonAylar(6, donemBitisAyi(donem, an), an);
  const siparisAraligi = kpiAraligi(BOS_SUZGEC, yerelGunMetni(an));

  const [prim, doktorSayisi, siparisler, ciro, iskonto] = await Promise.all([
    // Ad ve e-posta oturumdadır; yalnız prim oranı okunur, o da kapsüllü (düşerse yalnız o satır).
    kpiGetir(() => prisma.user.findUniqueOrThrow({ where: { id: saticiId }, select: { commissionRate: true } }), baglam),
    kpiGetir(() => kartSayisi(TUM_DOKTORLAR, kapsamliDoktorlariGetir(session.user), an), baglam),
    kpiGetir(() => siparisKpileri(gunleriAraliga(siparisAraligi), kapsam), baglam),
    kpiGetir(() => ciroOzeti({ kovalar: aylar, ...k }, kapsam), baglam),
    kpiGetir(() => saticiOrtalamaIskontosu(saticiId), baglam),
  ]);
  const not = karsilastirmaNotu(k.devamEdiyor);

  return (
    <div>
      <PageHeader title="Hesabım" description="Portföy ve bu ayın özeti" />

      <section aria-label="Hesap özeti">
        <KpiSatiri>
          <Link href="/my-doctors" className={KPI_BAGLANTISI}>
            <KpiCard
              etiket="Doktorlarım"
              varyant="birincil"
              iyiYon="notr"
              bosDavranisi="sifir"
              adet={doktorSayisi.tamam ? doktorSayisi.deger : null}
              karsilastirma={{ anlik: "şu an" }}
              hataReferansi={doktorSayisi.tamam ? undefined : doktorSayisi.referans}
            />
          </Link>
          <Link href="/my-orders" className={KPI_BAGLANTISI}>
            <KpiCard
              etiket="Bu ay siparişim"
              varyant="ikincil"
              iyiYon="notr"
              bosDavranisi="sifir"
              adet={siparisler.tamam ? siparisler.deger.toplam : null}
              donemNotu="Bu ay · teklif hariç"
              hataReferansi={siparisler.tamam ? undefined : siparisler.referans}
            />
          </Link>
          <Link href="/my-report" className={KPI_BAGLANTISI}>
            <KpiCard
              etiket="Bu ay cirom"
              varyant="ikincil"
              iyiYon="yukari-iyi"
              bosDavranisi="sifir"
              tutar={ciro.tamam ? ciro.deger.simdi.ciro : null}
              taban={MATRAH}
              karsilastirma={ciro.tamam && k.onceki ? { onceki: ciro.deger.onceki?.ciro ?? null, not } : undefined}
              trend={
                ciro.tamam
                  ? {
                      seri: ciro.deger.seri,
                      sonDevamEdiyor: aylar[aylar.length - 1].devamEdiyor,
                      ozet: <KovaOzeti baslik="Son 6 ay cirom" kovalar={aylar} tur="ay" seri={ciro.deger.seri} taban={MATRAH} />,
                    }
                  : undefined
              }
              hataReferansi={ciro.tamam ? undefined : ciro.referans}
            />
          </Link>
        </KpiSatiri>
      </section>

      <Card>
        <section aria-label="Profil">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Profil</h2>
          <dl className="divide-y divide-slate-100">
            <Satir ad="Ad soyad">{session.user.name}</Satir>
            <Satir ad="E-posta">{session.user.email}</Satir>
            <Satir ad="Rol">Satıcı</Satir>
            {/* X-14 §(2): satıcıya özel oran yoksa `finance.primOraniVarsayilan`; uygulanan oran sevkiyat satırına donar. */}
            <Satir ad="Prim oranım">
              {!prim.tamam ? (
                <Yuklenemedi referans={prim.referans} />
              ) : prim.deger.commissionRate !== null ? (
                formatla(prim.deger.commissionRate, "oran")
              ) : (
                `${formatla(policy.finance.primOraniVarsayilan, "oran")} (varsayılan)`
              )}
            </Satir>
            <Satir ad="Ortalama iskontom">
              {iskonto.tamam ? (
                <>
                  {formatla(iskonto.deger, "oran")}
                  <span className="block text-xs text-slate-500">Bütün siparişlerim, tutar ağırlıklı, teklif ve iptal hariç</span>
                </>
              ) : (
                <Yuklenemedi referans={iskonto.referans} />
              )}
            </Satir>
          </dl>
        </section>
      </Card>
    </div>
  );
}
