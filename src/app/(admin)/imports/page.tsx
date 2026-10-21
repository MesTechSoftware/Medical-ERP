import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { TANIMLAR } from "@/lib/ice-aktarim";
import type { ImportDataType } from "@/generated/prisma/enums";
import { PageHeader, Card, EmptyRow } from "@/components/ui";
import { IslemFormu } from "@/components/Sonuc";
import IceAktarimFormu from "./IceAktarimFormu";
import { partiyiGeriAl } from "./actions";

const TUR_ADI: Record<ImportDataType, string> = {
  CARI: "Cari (doktor ve bayi)",
  URUN: "Ürün",
  FIYAT_LISTESI: "Fiyat listesi",
  ACILIS_BAKIYESI: "Açılış bakiyesi",
  ACILIS_STOGU: "Açılış stoğu",
};

/** İçe aktarım (D-6, X-16) — yalnız yönetici; devreye alma aracı. Partiler ve geri alma (X-12). */
export default async function ImportsPage() {
  await requireAdmin();
  const partiler = await prisma.importBatch.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { name: true } },
      revertedBy: { select: { name: true } },
      _count: { select: { doctors: true, products: true, priceListItems: true, ledgerEntries: true, stockMovements: true } },
    },
  });
  const turler = (Object.keys(TANIMLAR) as ImportDataType[]).map((kod) => ({ kod, ad: TUR_ADI[kod] }));

  return (
    <div>
      <PageHeader
        title="İçe Aktarım"
        description="Şablonu indirin, doldurun, önce doğrulayıp önizleyin. Hatalı satır varsa hiçbir kayıt yazılmaz."
      />
      <div className="mb-6">
        <Card>
          <IceAktarimFormu turler={turler} />
        </Card>
      </div>
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Partiler</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2 font-medium">Parti</th>
                <th className="px-3 py-2 font-medium">Tür</th>
                <th className="px-3 py-2 font-medium">Dosya</th>
                <th className="px-3 py-2 font-medium">Yapan · Zaman</th>
                <th className="px-3 py-2 text-right font-medium">Kayıt</th>
                <th className="px-3 py-2 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {partiler.length === 0 && <EmptyRow colSpan={6} text="Henüz içe aktarım yok." />}
              {partiler.map((p) => {
                const kayit = Object.values(p._count).reduce((a, b) => a + b, 0);
                return (
                  <tr key={p.id} data-parti={p.batchNo} className="border-b border-slate-100 align-top last:border-0">
                    <td className="px-3 py-2 whitespace-nowrap font-medium text-slate-900">{p.batchNo}</td>
                    <td className="px-3 py-2">{TUR_ADI[p.dataType]}</td>
                    <td className="px-3 py-2 text-slate-500">{p.fileName ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {p.user.name} · {formatDateTime(p.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{kayit}</td>
                    <td className="px-3 py-2">
                      {p.revertedAt ? (
                        <span className="text-slate-500">
                          Geri alındı ({p.revertedBy?.name}, {formatDateTime(p.revertedAt)}): {p.revertReason}
                        </span>
                      ) : TANIMLAR[p.dataType]?.geriAl ? (
                        <details>
                          <summary className="cursor-pointer text-xs text-red-600">Geri al</summary>
                          <IslemFormu action={partiyiGeriAl.bind(null, p.id)} className="mt-2 w-56 space-y-2">
                            <input aria-label="Geri alma gerekçesi" name="reason" required placeholder="Gerekçe" className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                            <button type="submit" className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
                              Partiyi geri al
                            </button>
                          </IslemFormu>
                        </details>
                      ) : (
                        <span className="text-slate-400">Yazıldı</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
