import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import type { BlokKuralKodu } from "@/lib/onay-blogu";
import { BLOK_KURAL_ADI } from "@/lib/sozluk";
import { PageHeader, Card, StatusBadge } from "@/components/ui";
import { IslemFormu } from "@/components/Sonuc";
import { blokKarari } from "./actions";

/**
 * Onay bekleyenler (A-8): karar verilmemiş bloklar, en eskisi önce. Bugün tek kural
 * `NEGATIF_STOK`'tur ve blok siparişe bağlıdır (A-8 eki 20.10.2026).
 */
export default async function ApprovalsPage() {
  await requireAdmin();

  const bloklar = await prisma.approvalBlock.findMany({
    where: { decision: null },
    orderBy: [{ openedAt: "asc" }, { id: "asc" }],
  });
  const [siparisler, acanlar] = await Promise.all([
    prisma.order.findMany({
      where: { id: { in: bloklar.filter((b) => b.documentType === "SIP").map((b) => b.documentId) } },
      select: { id: true, documentNo: true, status: true, doctor: { select: { fullName: true } } },
    }),
    prisma.user.findMany({
      where: { id: { in: bloklar.map((b) => b.openedById) } },
      select: { id: true, name: true },
    }),
  ]);
  const siparis = new Map(siparisler.map((o) => [o.id, o]));
  const acan = new Map(acanlar.map((u) => [u.id, u.name]));

  return (
    <div>
      <PageHeader title="Onay Bekleyenler" description="Gerekçeyle onaya gönderilen işlemler. Karar notu zorunludur." />

      <Card>
        {bloklar.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Onay bekleyen işlem yok.</p>
        ) : (
          <div className="space-y-3">
            {bloklar.map((b) => {
              const o = siparis.get(b.documentId);
              return (
                <div key={b.id} data-blok-id={b.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div>
                      <span className="font-medium text-slate-900">
                        {BLOK_KURAL_ADI[b.ruleCode as BlokKuralKodu] ?? b.ruleCode}
                      </span>
                      {o && (
                        <>
                          {" · "}
                          <Link href={`/orders/${o.id}`} className="text-slate-700 hover:underline">
                            {o.documentNo}
                          </Link>
                          <span className="ml-2 text-slate-500">{o.doctor.fullName}</span>
                        </>
                      )}
                    </div>
                    {o && <StatusBadge status={o.status} />}
                  </div>
                  <p className="mb-3 text-sm text-slate-700">
                    <span className="text-slate-500">
                      {acan.get(b.openedById) ?? "—"} · {formatDateTime(b.openedAt)}:
                    </span>{" "}
                    {b.openReason}
                  </p>
                  <IslemFormu action={blokKarari.bind(null, b.id)} className="space-y-2">
                    <label htmlFor={`not_${b.id}`} className="block text-xs text-slate-500">
                      Karar notu
                    </label>
                    <textarea
                      id={`not_${b.id}`}
                      name="not"
                      required
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        name="karar"
                        value="ONAY"
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                      >
                        Onayla
                      </button>
                      <button
                        type="submit"
                        name="karar"
                        value="RED"
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        Reddet
                      </button>
                    </div>
                  </IslemFormu>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
