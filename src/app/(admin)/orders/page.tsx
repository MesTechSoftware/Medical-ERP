import Link from "next/link";
import { prisma } from "@/lib/db";
import { SIPARIS_SATIRI, siparisToplami } from "@/lib/siparis";
import { formatDate } from "@/lib/format";
import { PageHeader, Card, StatusBadge, EmptyRow, LinkButton } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { getPagination, pageCount } from "@/lib/pagination";
import { OrderStatus } from "@/generated/prisma/enums";
import { Tutar } from "@/components/Tutar";
import { SATIR_TABANI, tabanli } from "@/lib/taban";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Tümü" },
  { value: "BEKLIYOR", label: "Bekliyor" },
  { value: "HAZIRLANIYOR", label: "Hazırlanıyor" },
  { value: "KARGOLANDI", label: "Kargolandı" },
  { value: "TESLIM_EDILDI", label: "Teslim Edildi" },
  { value: "IPTAL", label: "İptal" },
];

function isOrderStatus(v: string): v is OrderStatus {
  return v in OrderStatus;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; per?: string }>;
}) {
  const sp = await searchParams;
  const { status } = sp;
  const where =
    status && isOrderStatus(status) ? { status } : {};

  const { page, perPage, skip, take } = getPagination(sp);
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { orderDate: "desc" },
      skip,
      take,
      include: {
        seller: { select: { name: true } },
        doctor: { select: { fullName: true, clinic: true } },
        items: { select: SIPARIS_SATIRI },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return (
    <div>
      <PageHeader
        title="Siparişler"
        description="Doktor ve bayi siparişleri, durum yönetimi"
        action={<LinkButton href="/orders/new">Yeni Sipariş</LinkButton>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = (status ?? "") === f.value;
          return (
            <Link
              key={f.value}
              href={f.value ? `/orders?status=${f.value}` : "/orders"}
              className={
                "inline-flex h-(--toolbar-h) items-center rounded-full px-3 text-sm font-medium transition " +
                (active
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100")
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <Card>
        <div className="tablo-kutusu">
          <table className="veri-tablosu">
            <thead>
              <tr>
                <th>Tarih</th>
                <th className="oncelik-dusuk">Satıcı</th>
                <th>Doktor</th>
                <th className="oncelik-dusuk">Hastane</th>
                <th className="sayi">{tabanli("Tutar", SATIR_TABANI.toplam)}</th>
                <th>Durum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <EmptyRow colSpan={7} text="Sipariş bulunamadı." />
              )}
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="whitespace-nowrap text-slate-500">
                    {formatDate(o.orderDate)}
                  </td>
                  <td className="text-slate-900 oncelik-dusuk">{o.seller?.name ?? "—"}</td>
                  <td className="font-medium text-slate-900">
                    {o.doctor.fullName}
                  </td>
                  <td className="text-slate-500 oncelik-dusuk">
                    {o.doctor.clinic}
                  </td>
                  <td className="sayi">
                    <Tutar deger={siparisToplami(o.items).toplam} taban={SATIR_TABANI.toplam} baslikta />
                  </td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/orders/${o.id}`}
                      className="text-sm font-medium text-slate-600 hover:text-slate-900"
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
        basePath="/orders"
        params={{ status }}
      />
    </div>
  );
}
