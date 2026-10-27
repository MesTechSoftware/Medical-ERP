import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { TANIMLAR, VERI_TIPI_ADI } from "@/lib/ice-aktarim";
import type { ImportDataType } from "@/generated/prisma/enums";
import { PageHeader, Card, EmptyRow } from "@/components/ui";
import { IslemFormu } from "@/components/Sonuc";
import IceAktarimFormu from "./IceAktarimFormu";
import { partiyiGeriAl } from "./actions";
import { ACILIR_EYLEM, KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { Ikon } from "@/components/Ikon";

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
  const turler = (Object.keys(TANIMLAR) as ImportDataType[]).map((kod) => ({ kod, ad: VERI_TIPI_ADI[kod] }));

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
        <div className="tablo-kutusu">
          <table className="veri-tablosu">
            <thead>
              <tr>
                <th>Parti</th>
                <th>Tür</th>
                <th className="oncelik-dusuk">Dosya</th>
                <th className="oncelik-dusuk">Yapan · Zaman</th>
                <th className="sayi">Kayıt</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {partiler.length === 0 && <EmptyRow colSpan={6} text="Henüz içe aktarım yok." />}
              {partiler.map((p) => {
                const kayit = Object.values(p._count).reduce((a, b) => a + b, 0);
                return (
                  <tr key={p.id} data-parti={p.batchNo} className="align-top">
                    <td className="whitespace-nowrap font-medium text-slate-900">{p.batchNo}</td>
                    <td>{VERI_TIPI_ADI[p.dataType]}</td>
                    <td className="text-slate-500 oncelik-dusuk">{p.fileName ?? "—"}</td>
                    <td className="text-slate-500 oncelik-dusuk">
                      {p.user.name} · {formatDateTime(p.createdAt)}
                    </td>
                    <td className="sayi">{kayit}</td>
                    <td>
                      {p.revertedAt ? (
                        <span className="text-slate-500">
                          Geri alındı ({p.revertedBy?.name}, {formatDateTime(p.revertedAt)}): {p.revertReason}
                        </span>
                      ) : TANIMLAR[p.dataType]?.geriAl ? (
                        <details>
                          <summary className={`${ACILIR_EYLEM} text-xs text-negative`}>
                            <Ikon ad="geriAl" />
                            Geri al
                          </summary>
                          <IslemFormu action={partiyiGeriAl.bind(null, p.id)} className="mt-2 w-56 space-y-2">
                            <input aria-label="Geri alma gerekçesi" name="reason" required placeholder="Gerekçe" className={`w-full ${KONTROL_TEK_SATIR}`} />
                            <button type="submit" className={buton("olumsuz")}>
                              <Ikon ad="geriAl" />
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
