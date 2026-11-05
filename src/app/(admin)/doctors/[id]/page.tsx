import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { Tutar } from "@/components/Tutar";
import { BRUT, SATIR_TABANI, tabanli } from "@/lib/taban";
import { SIPARIS_SATIRI, siparisToplami } from "@/lib/siparis";
import { formatDate } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { bakiyeSerisi, hesaplaDoktorBakiye, vadesiGecmisUyarisi } from "@/lib/doctor-cari";
import { sonAylar } from "@/lib/donem";
import { kpiGetir } from "@/lib/kpi/getir";
import { simdi, takvimAyi } from "@/lib/zaman";
import { SonucGosterimi } from "@/components/Sonuc";
import { sonucOlustur } from "@/lib/sonuc";
import CariHareketleri from "./CariHareketleri";
import { BAKIYE_ETIKETI } from "@/components/doktor/bakiye";
import {
  PageHeader,
  Card,
  StatusBadge,
  StatusChip,
  EmptyRow,
} from "@/components/ui";
import { KovaOzeti } from "@/components/kpi/KovaOzeti";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import { buton } from "@/components/stil";
import { Ikon } from "@/components/Ikon";

/**
 * FR-10: Doktor detayı — cari bakiye, sipariş ve tahsilat geçmişi.
 * Kongre defteri C2'de (GÇ-5), yaşlandırma ve vadesi geçmiş tutar C3'te
 * söküldü (GÇ-3, X-6 §(5)/(7)).
 */
export default async function DoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStaff();
  const { id } = await params;

  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: { ownerSeller: { select: { name: true } }, priceList: { select: { code: true, name: true } } },
  });
  if (!doctor) notFound();

  const an = simdi();
  const aylar = sonAylar(6, takvimAyi(an), an);
  const [cari, vadeUyarisi, orders, payments] = await Promise.all([
    // Bakiye ve ay sonu trendi tek hata alanıdır: biri düşerse kart referansla düşer (X-3).
    kpiGetir(
      async () => ({
        bakiye: await hesaplaDoktorBakiye(id),
        seri: await bakiyeSerisi(id, aylar.map((a) => a.aralik.bitis)),
      }),
      { yol: `/doctors/${id}`, kullaniciId: session.user.id }
    ),
    vadesiGecmisUyarisi(id),
    prisma.order.findMany({
      where: { doctorId: id },
      orderBy: { orderDate: "desc" },
      take: 30,
      include: {
        seller: { select: { name: true } },
        items: { select: SIPARIS_SATIRI },
      },
    }),
    prisma.doctorPayment.findMany({
      where: { doctorId: id },
      orderBy: { paidAt: "desc" },
      take: 30,
      include: { paymentMethod: { select: { name: true } } },
    }),
  ]);

  // Ölçüm serisi: cari açılmadan önceki ay sonları boşluktur, sıfır değil (enterpolasyon yok).
  const bakiyeTrendi = cari.tamam
    ? aylar.map((a, i) => (a.aralik.bitis <= doctor.createdAt ? null : cari.deger.seri[i]))
    : [];
  const hataReferansi = cari.tamam ? undefined : cari.referans;

  return (
    <div>
      <PageHeader
        title={`${doctor.title ? `${doctor.title} ` : ""}${doctor.fullName}`}
        description={[
          doctor.accountClass === "BAYI" ? "Bayi" : null,
          doctor.clinic,
          doctor.region,
          doctor.city,
          formatPhone(doctor.phoneNormalized),
        ]
          .filter(Boolean)
          .join(" · ")}
        action={
          // Cari düzeltme yalnız yönetici (X-16 §(9)); OPERASYON cariyi görür (D-2 §(1)).
          session.user.role === "YONETICI" ? (
            <Link href={`/doctors/${id}/edit`} className={buton("metin")}>
              <Ikon ad="duzenle" />
              Düzenle
            </Link>
          ) : undefined
        }
      />

      {/* Cari hareketten okunur (X-11). K-2: çıplak negatif gösterilmez; tutar mutlak değer, yön etikette. */}
      <KpiSatiri>
        <KpiCard
          etiket="Cari Bakiye"
          varyant="birincil"
          iyiYon="notr"
          bosDavranisi="sifir"
          tutar={cari.tamam ? cari.deger.bakiye.bakiye.abs() : null}
          taban={BRUT}
          karsilastirma={cari.tamam ? { anlik: BAKIYE_ETIKETI[cari.deger.bakiye.yon] } : undefined}
          trend={
            cari.tamam
              ? {
                  seri: bakiyeTrendi,
                  sonDevamEdiyor: true,
                  ozet: <KovaOzeti baslik="Son 6 ay sonu bakiye" kovalar={aylar} tur="ay" seri={bakiyeTrendi} taban={BRUT} />,
                }
              : undefined
          }
          hataReferansi={hataReferansi}
        />
        <KpiCard
          etiket="Toplam Borç"
          varyant="baglamsal"
          iyiYon="notr"
          bosDavranisi="sifir"
          tutar={cari.tamam ? cari.deger.bakiye.toplamBorc : null}
          taban={BRUT}
          hataReferansi={hataReferansi}
        />
        <KpiCard
          etiket="Toplam Alacak"
          varyant="baglamsal"
          iyiYon="notr"
          bosDavranisi="sifir"
          tutar={cari.tamam ? cari.deger.bakiye.toplamAlacak : null}
          taban={BRUT}
          hataReferansi={hataReferansi}
        />
      </KpiSatiri>

      {/* X-6 §(6): vadesi geçmiş hareketin varlığı — BILGI şeridi, tutar yok. */}
      {vadeUyarisi && (
        <div className="mb-4">
          <SonucGosterimi sonuc={sonucOlustur([vadeUyarisi])} />
        </div>
      )}

      {/* A-13 §(9): Genel ve Fatura bilgileri — kart bilgisi; fiyat listesi (X-10 §(2)). */}
      <div className="mb-6">
        <Card>
          <dl className="grid gap-4 text-sm sm:grid-cols-4">
            {[
              [
                "Sorumlu satıcı",
                doctor.ownerSeller?.name ?? <StatusChip ton="uyari">Sahipsiz</StatusChip>,
              ],
              ["Fiyat listesi", doctor.priceList ? `${doctor.priceList.code} — ${doctor.priceList.name}` : "Varsayılan"],
              ["Ödeme vadesi", doctor.paymentTermDays !== null ? `${doctor.paymentTermDays} gün` : "Varsayılan"],
              ["Cari tipi", doctor.partyType === "GERCEK_KISI" ? "Gerçek kişi" : "Tüzel kişi"],
              ["VKN / TCKN", doctor.taxId ?? "—"],
              ["Fatura ünvanı", doctor.invoiceTitle ?? doctor.fullName],
              ["Vergi dairesi", doctor.taxOffice ?? "—"],
              ["Fatura adresi", [doctor.invoiceAddress, doctor.invoiceDistrict, doctor.invoiceCity].filter(Boolean).join(", ") || "—"],
              ["Muhasebe kodu", doctor.accountingCode ?? "—"],
            ].map(([etiket, deger]) => (
              <div key={String(etiket)}>
                <dt className="text-xs uppercase text-slate-500">{etiket}</dt>
                <dd className="mt-0.5 text-slate-900">{deger}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Sipariş Geçmişi
          </h2>
          <div className="tablo-kutusu">
            <table className="veri-tablosu">
              <thead>
                <tr>
                  <th>Belge No</th>
                  <th>Tarih</th>
                  <th className="oncelik-dusuk">Satıcı</th>
                  <th className="sayi">{tabanli("Tutar", SATIR_TABANI.toplam)}</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <EmptyRow colSpan={5} text="Sipariş yok." />
                )}
                {orders.map((o) => {
                  return (
                    <tr key={o.id}>
                      <td className="whitespace-nowrap text-slate-500">
                        {o.documentNo}
                      </td>
                      <td className="whitespace-nowrap text-slate-500">
                        {formatDate(o.orderDate)}
                      </td>
                      <td className="text-slate-500 oncelik-dusuk">
                        {o.seller?.name ?? "—"}
                      </td>
                      <td className="sayi">
                        <Tutar deger={siparisToplami(o.items).toplam} taban={SATIR_TABANI.toplam} baslikta />
                      </td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Tahsilat Geçmişi
          </h2>
          <div className="tablo-kutusu">
            <table className="veri-tablosu">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th className="oncelik-dusuk">Yöntem</th>
                  <th className="sayi">{tabanli("Tutar", BRUT)}</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && (
                  <EmptyRow colSpan={4} text="Tahsilat yok." />
                )}
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className={p.status === "IPTAL" ? "text-slate-400 line-through" : undefined}
                  >
                    <td className="whitespace-nowrap">
                      {formatDate(p.paidAt)}
                    </td>
                    <td className="oncelik-dusuk">
                      {p.paymentMethod.name}
                    </td>
                    <td className="sayi">
                      <Tutar deger={p.amount} taban={BRUT} baslikta />
                    </td>
                    <td>
                      {p.status === "IPTAL" ? "İptal" : "Aktif"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <CariHareketleri doktorId={id} yonetici={session.user.role === "YONETICI"} />
      </div>

      <div className="mt-6">
        <Link
          href="/doctors"
          className={buton("metin")}
        >
          <Ikon ad="geri" />
          Doktor listesi
        </Link>
      </div>
    </div>
  );
}
