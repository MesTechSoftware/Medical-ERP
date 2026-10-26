import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { SIPARIS_SATIRI, siparisToplami } from "@/lib/siparis";
import { formatDate } from "@/lib/format";
import {
  PageHeader,
  LinkButton,
  Card,
  StatusBadge,
  EmptyRow,
} from "@/components/ui";
import Pagination from "@/components/Pagination";
import { getPagination, pageCount } from "@/lib/pagination";
import { Tutar } from "@/components/Tutar";
import { SATIR_TABANI, tabanli } from "@/lib/taban";
import { belgeOnayDurumlari } from "@/lib/onay-blogu";
import { OnayEtiketi } from "@/components/OnayEtiketi";
import { buton } from "@/components/stil";

export default async function MyOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string }>;
}) {
  const session = await requireSeller();
  const { page, perPage, skip, take } = getPagination(await searchParams);
  const where = { sellerId: session.user.id };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { orderDate: "desc" },
      skip,
      take,
      include: {
        items: { select: SIPARIS_SATIRI },
        doctor: { select: { fullName: true, clinic: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);
  const onayDurumu = await belgeOnayDurumlari("SIP", orders.map((o) => o.id));

  return (
    <div>
      <PageHeader
        title="Siparişlerim"
        description="Oluşturduğunuz siparişler"
        action={<LinkButton href="/my-orders/new">Yeni Sipariş</LinkButton>}
      />

      <Card>
        <div className="tablo-kutusu">
          <table className="veri-tablosu">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Doktor</th>
                <th className="oncelik-dusuk">Hastane</th>
                <th className="sayi oncelik-dusuk">Kalem</th>
                <th className="sayi">{tabanli("Tutar", SATIR_TABANI.toplam)}</th>
                <th>Durum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <EmptyRow colSpan={7} text="Henüz sipariş oluşturmadınız." />
              )}
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="whitespace-nowrap text-slate-500">
                    {formatDate(o.orderDate)}
                  </td>
                  <td className="font-medium text-slate-900">
                    {o.doctor.fullName}
                  </td>
                  <td className="text-slate-500 oncelik-dusuk">{o.doctor.clinic ?? "—"}</td>
                  <td className="sayi oncelik-dusuk">
                    {o.items.length}
                  </td>
                  <td className="sayi">
                    <Tutar deger={siparisToplami(o.items).toplam} taban={SATIR_TABANI.toplam} baslikta />
                  </td>
                  <td>
                    <span className="flex flex-wrap items-center gap-1">
                      <StatusBadge status={o.status} />
                      <OnayEtiketi durum={onayDurumu.get(o.id)} />
                    </span>
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/my-orders/${o.id}`}
                      className={buton("metin")}
                    >
                      Detay
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination
        page={page}
        totalPages={pageCount(total, perPage)}
        total={total}
        basePath="/my-orders"
      />
    </div>
  );
}
