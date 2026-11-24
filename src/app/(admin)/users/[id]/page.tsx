import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { Tutar } from "@/components/Tutar";
import { SATIR_TABANI, tabanli } from "@/lib/taban";
import { SIPARIS_SATIRI, siparisToplami } from "@/lib/siparis";
import { formatDate } from "@/lib/format";
import {
  PageHeader,
  Card,
  StatCard,
  StatusBadge,
  EmptyRow,
} from "@/components/ui";
import { buton } from "@/components/stil";
import { Ikon } from "@/components/Ikon";

export const metadata: Metadata = { title: "Kullanıcı Detayı" };

export default async function SellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStaff();
  const { id } = await params;
  const seller = await prisma.user.findFirst({ where: { id, role: "SATICI" } });
  if (!seller) notFound();

  const [orders, doctors] = await Promise.all([
    prisma.order.findMany({
      where: { sellerId: id },
      orderBy: { orderDate: "desc" },
      take: 20,
      include: { doctor: { select: { fullName: true } }, items: { select: SIPARIS_SATIRI } },
    }),
    prisma.doctor.findMany({
      where: { ownerSellerId: id },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, clinic: true, region: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={seller.name}
        description={`${seller.email}${seller.phone ? " · " + seller.phone : ""}`}
        action={
          // OPERASYON salt okur (D-2 17.10 eki).
          session.user.role === "YONETICI" && (
            <Link
              href={`/users/${id}/edit`}
              className={buton("metin")}
            >
              <Ikon ad="duzenle" />
              Düzenle
            </Link>
          )
        }
      />

      {/* Açık alacak, yaşlandırma ve vadesi geçmiş tutar C3'te söküldü (GÇ-3, X-6). */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Doktor Sayısı" value={String(doctors.length)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Siparişler
          </h2>
          <div className="tablo-kutusu">
            <table className="veri-tablosu">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Doktor</th>
                  <th className="sayi">{tabanli("Tutar", SATIR_TABANI.toplam)}</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <EmptyRow colSpan={4} text="Sipariş yok." />
                )}
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="whitespace-nowrap text-slate-500">
                      {formatDate(o.orderDate)}
                    </td>
                    <td className="text-slate-900">{o.doctor.fullName}</td>
                    <td className="sayi">
                      <Tutar deger={siparisToplami(o.items).toplam} taban={SATIR_TABANI.toplam} baslikta />
                    </td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Doktor Portföyü
          </h2>
          <div className="tablo-kutusu">
            <table className="veri-tablosu">
              <thead>
                <tr>
                  <th>Doktor</th>
                  <th>Klinik</th>
                  <th className="oncelik-dusuk">Bölge</th>
                </tr>
              </thead>
              <tbody>
                {doctors.length === 0 && (
                  <EmptyRow colSpan={3} text="Portföyde doktor yok." />
                )}
                {doctors.map((d) => (
                  <tr key={d.id}>
                    <td className="text-slate-900">{d.fullName}</td>
                    <td className="text-slate-500">{d.clinic ?? "—"}</td>
                    <td className="text-slate-500 oncelik-dusuk">{d.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
