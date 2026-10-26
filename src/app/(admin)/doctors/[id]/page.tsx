import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { Tutar } from "@/components/Tutar";
import { BRUT, SATIR_TABANI, tabanli } from "@/lib/taban";
import { SIPARIS_SATIRI, siparisToplami } from "@/lib/siparis";
import { formatDate } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { hesaplaDoktorBakiye, vadesiGecmisUyarisi } from "@/lib/doctor-cari";
import { SonucGosterimi } from "@/components/Sonuc";
import { sonucOlustur } from "@/lib/sonuc";
import CariHareketleri from "./CariHareketleri";
import {
  PageHeader,
  Card,
  StatCard,
  StatusBadge,
  EmptyRow,
} from "@/components/ui";

const BAKIYE_ETIKETI = {
  BORC: "Doktor borçlu",
  ALACAK: "Doktor alacaklı (avans)",
  KAPALI: "Bakiye kapalı",
} as const;

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

  const [cari, vadeUyarisi, orders, payments] = await Promise.all([
    hesaplaDoktorBakiye(id),
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
            <Link href={`/doctors/${id}/edit`} className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Düzenle
            </Link>
          ) : undefined
        }
      />

      {/* A-13 §(9): Genel ve Fatura bilgileri — kart bilgisi; fiyat listesi (X-10 §(2)). */}
      <div className="mb-6">
        <Card>
          <dl className="grid gap-4 text-sm sm:grid-cols-4">
            {[
              ["Fiyat listesi", doctor.priceList ? `${doctor.priceList.code} — ${doctor.priceList.name}` : "Varsayılan"],
              ["Ödeme vadesi", doctor.paymentTermDays !== null ? `${doctor.paymentTermDays} gün` : "Varsayılan"],
              ["Cari tipi", doctor.partyType === "GERCEK_KISI" ? "Gerçek kişi" : "Tüzel kişi"],
              ["VKN / TCKN", doctor.taxId ?? "—"],
              ["Fatura ünvanı", doctor.invoiceTitle ?? doctor.fullName],
              ["Vergi dairesi", doctor.taxOffice ?? "—"],
              ["Fatura adresi", [doctor.invoiceAddress, doctor.invoiceDistrict, doctor.invoiceCity].filter(Boolean).join(", ") || "—"],
              ["Muhasebe kodu", doctor.accountingCode ?? "—"],
            ].map(([etiket, deger]) => (
              <div key={etiket}>
                <dt className="text-xs uppercase text-slate-500">{etiket}</dt>
                <dd className="mt-0.5 text-slate-900">{deger}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      {/* X-6 §(6): vadesi geçmiş hareketin varlığı — BILGI şeridi, tutar yok. */}
      {vadeUyarisi && (
        <div className="mb-4">
          <SonucGosterimi sonuc={sonucOlustur([vadeUyarisi])} />
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sorumlu Satıcı"
          value={doctor.ownerSeller?.name ?? "Sahipsiz"}
          tone={doctor.ownerSeller ? "default" : "danger"}
        />
        {/* Cari hareketten okunur (X-11); CM → 1B arası boş görünür (FAZ1 R-11). */}
        <StatCard label="Toplam Borç" value={<Tutar deger={cari.toplamBorc} taban={BRUT} />} />
        <StatCard label="Toplam Alacak" value={<Tutar deger={cari.toplamAlacak} taban={BRUT} />} />
        {/* K-2: çıplak negatif gösterilmez; tutar mutlak değer, yön etikette. */}
        <StatCard
          label="Cari Bakiye"
          value={<Tutar deger={cari.bakiye.abs()} taban={BRUT} />}
          tone={cari.yon === "BORC" ? "danger" : "success"}
          hint={BAKIYE_ETIKETI[cari.yon]}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Sipariş Geçmişi
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2 font-medium">Belge No</th>
                  <th className="px-3 py-2 font-medium">Tarih</th>
                  <th className="px-3 py-2 font-medium">Satıcı</th>
                  <th className="px-3 py-2 text-right font-medium">{tabanli("Tutar", SATIR_TABANI.toplam)}</th>
                  <th className="px-3 py-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <EmptyRow colSpan={5} text="Sipariş yok." />
                )}
                {orders.map((o) => {
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                        {o.documentNo}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                        {formatDate(o.orderDate)}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {o.seller?.name ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        <Tutar deger={siparisToplami(o.items).toplam} taban={SATIR_TABANI.toplam} baslikta />
                      </td>
                      <td className="px-3 py-2">
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2 font-medium">Tarih</th>
                  <th className="px-3 py-2 font-medium">Yöntem</th>
                  <th className="px-3 py-2 text-right font-medium">{tabanli("Tutar", BRUT)}</th>
                  <th className="px-3 py-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && (
                  <EmptyRow colSpan={4} text="Tahsilat yok." />
                )}
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className={
                      "border-b border-slate-100 last:border-0 " +
                      (p.status === "IPTAL" ? "text-slate-400 line-through" : "")
                    }
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDate(p.paidAt)}
                    </td>
                    <td className="px-3 py-2">
                      {p.paymentMethod.name}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <Tutar deger={p.amount} taban={BRUT} baslikta />
                    </td>
                    <td className="px-3 py-2">
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
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Doktor listesi
        </Link>
      </div>
    </div>
  );
}
