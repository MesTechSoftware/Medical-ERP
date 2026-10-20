import { prisma } from "@/lib/db";
import { PageHeader, Card, EmptyRow } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import StockEntryForm from "./StockEntryForm";
import KonumBelgesiFormu from "./KonumBelgesiFormu";
import { addConsignment, addTransfer } from "./actions";
import { hesaplaStok } from "@/lib/stok";

export default async function StockPage() {
  const [products, movements, konumlar, doktorlar] = await Promise.all([
    prisma.product.findMany({
      where: { status: "AKTIF" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        product: { select: { name: true, code: true } },
        location: { select: { name: true } },
      },
    }),
    prisma.stockLocation.findMany({
      where: { isActive: true },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, type: true },
    }),
    prisma.doctor.findMany({
      where: { status: "AKTIF" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
  ]);
  const depolar = konumlar.filter((k) => k.type === "DEPO");
  const konsinyeler = konumlar.filter((k) => k.type === "KONSINYE");
  // Konsinyedeki mal: konum × ürün, tek okuma yolu hesaplaStok() (B-4); yalnız sıfırdan farklı satırlar.
  const konsinyeStok = (
    await Promise.all(
      konsinyeler.flatMap((k) =>
        products.map(async (p) => ({ konum: k.name, urun: p.name, miktar: await hesaplaStok(p.id, k.id) }))
      )
    )
  ).filter((r) => r.miktar !== 0);
  const urunSecenekleri = products.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }));

  return (
    <div>
      <PageHeader
        title="Stok"
        description="Stok girişleri ve hareket geçmişi"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              Stok Girişi
            </h2>
            <StockEntryForm products={products} />
          </Card>

          <div className="mt-6">
            <Card>
              <h2 className="mb-1 text-sm font-semibold text-slate-900">Konsinye Çıkış</h2>
              <p className="mb-4 text-xs text-slate-500">Mal depodan doktora konsinye bırakılır; satış sayılmaz.</p>
              <KonumBelgesiFormu
                ad="konsinye"
                action={addConsignment}
                secimler={[{ name: "doctorId", label: "Doktor", options: doktorlar.map((d) => ({ value: d.id, label: d.fullName })) }]}
                urunler={urunSecenekleri}
                dugme="Konsinye Çıkış Kaydet"
                basari="Konsinye çıkış kaydedildi"
              />
            </Card>
          </div>

          {konsinyeler.length > 0 && (
            <div className="mt-6">
              <Card>
                <h2 className="mb-1 text-sm font-semibold text-slate-900">Depoya Transfer</h2>
                <p className="mb-4 text-xs text-slate-500">
                  Kullanılan ya da geri gelen konsinye mal depoya alınır; satış ardından normal siparişle girilir.
                </p>
                <KonumBelgesiFormu
                  ad="transfer"
                  action={addTransfer}
                  secimler={[
                    { name: "fromLocationId", label: "Kaynak", options: konumlar.map((k) => ({ value: k.id, label: k.name })) },
                    // B-4: tek depoda hedef seçimi görünmez (UI satır sayısından türer).
                    ...(depolar.length > 1
                      ? [{ name: "toLocationId", label: "Hedef depo", options: depolar.map((k) => ({ value: k.id, label: k.name })) }]
                      : []),
                  ]}
                  gizli={depolar.length === 1 ? { toLocationId: depolar[0].id } : undefined}
                  urunler={urunSecenekleri}
                  dugme="Transfer Kaydet"
                  basari="Transfer kaydedildi"
                />
              </Card>
            </div>
          )}

          {konsinyeStok.length > 0 && (
            <div className="mt-6">
              <Card>
                <h2 className="mb-3 text-sm font-semibold text-slate-900">Konsinyedeki Mal</h2>
                <ul className="space-y-1 text-sm text-slate-700">
                  {konsinyeStok.map((r) => (
                    <li key={`${r.konum}|${r.urun}`} className="flex justify-between gap-2">
                      <span>
                        {r.konum} · {r.urun}
                      </span>
                      <span className="tabular-nums">{r.miktar}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              Hareket Geçmişi
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                    <th className="px-4 py-2 font-medium">Tarih</th>
                    <th className="px-4 py-2 font-medium">Ürün</th>
                    <th className="px-4 py-2 font-medium">Tip</th>
                    <th className="px-4 py-2 text-right font-medium">Miktar</th>
                    <th className="px-4 py-2 font-medium">Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 && (
                    <EmptyRow colSpan={5} text="Henüz hareket yok." />
                  )}
                  {movements.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                        {formatDateTime(m.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        {m.product.name}
                        <span className="ml-1 text-xs text-slate-400">
                          {m.product.code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {m.type === "GIRIS" ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Giriş
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                            Çıkış
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {m.type === "GIRIS" ? "+" : "−"}
                        {m.quantity}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {m.note}
                        {konumlar.length > 1 && <span className="ml-1 text-xs text-slate-400">· {m.location.name}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
