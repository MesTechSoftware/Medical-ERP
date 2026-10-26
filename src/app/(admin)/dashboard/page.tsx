import Link from "next/link";
import { prisma } from "@/lib/db";
import { BRUT, MATRAH } from "@/lib/taban";
import { hesaplaStok } from "@/lib/stok";
import { CRITICAL_STOCK } from "@/lib/stok-durumu";
import { ciroOzeti, enCokSevkEdilenler, tahsilatToplamlari } from "@/lib/reports-service";
import { donemCoz, karsilastirmaAraliklari, karsilastirmaNotu, sonAylar } from "@/lib/donem";
import { formatSayi } from "@/lib/format";
import { kpiGetir } from "@/lib/kpi/getir";
import { cubukOranlari } from "@/lib/kpi/olcek";
import { requireStaff } from "@/lib/session";
import { simdi, takvimAyi } from "@/lib/zaman";
import { PageHeader, Card, EmptyRow } from "@/components/ui";
import { AyOzeti } from "@/components/kpi/AyOzeti";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import { BarMicro } from "@/components/grafik/BarMicro";
import { StokMiktari } from "@/components/StokMiktari";
import { buton } from "@/components/stil";

/**
 * Dashboard (YONETICI + OPERASYON) — "bu ay" KPI'ları (K-4; ADR-010). Ekran prim/hakediş
 * taşımaz (D-2). Karşılaştırma geçen ayın aynı günleridir (K-1). Ciro matrahtır, sevk edilen
 * maldan doğar (A-3); tahsilat brüttür (Ü-3).
 */
export default async function DashboardPage() {
  const session = await requireStaff();
  const an = simdi();
  const aylar = sonAylar(6, takvimAyi(an), an);
  const k = karsilastirmaAraliklari(donemCoz(undefined, an), an);
  const baglam = { yol: "/dashboard", kullaniciId: session.user.id };
  const not = karsilastirmaNotu(true);

  const [ciro, tahsilat, bekleyen, kargolanacak, enCok, products] = await Promise.all([
    kpiGetir(() => ciroOzeti({ aylar, ...k }, { tur: "sirket" }), baglam),
    // Tek sorgu: altı ay + bu dönem + karşılaştırma dönemi.
    kpiGetir(() => tahsilatToplamlari([...aylar.map((a) => a.aralik), k.simdi, ...(k.onceki ? [k.onceki] : [])]), baglam),
    kpiGetir(() => prisma.order.count({ where: { status: "BEKLIYOR" } }), baglam),
    kpiGetir(() => prisma.order.count({ where: { status: "HAZIRLANIYOR" } }), baglam),
    kpiGetir(() => enCokSevkEdilenler(k.simdi, 5), baglam),
    prisma.product.findMany({
      where: { status: "AKTIF" },
      select: { id: true, name: true, code: true },
    }),
  ]);

  // Stok hareketlerden türer; tek okuma yolu hesaplaStok() (B-4, ADR-005).
  const stoklu = await Promise.all(
    products.map(async (p) => ({ ...p, stock: await hesaplaStok(p.id) }))
  );
  const criticalProducts = stoklu
    .filter((p) => p.stock <= CRITICAL_STOCK)
    .sort((a, b) => a.stock - b.stock);

  const tahsilatSerisi = tahsilat.tamam ? tahsilat.deger.slice(0, aylar.length) : [];
  const enCokOranlari = enCok.tamam ? cubukOranlari(enCok.deger.map((u) => u.miktar)) : [];

  return (
    <div>
      <PageHeader title="Dashboard" description="Operasyon özeti" />

      <KpiSatiri>
        <KpiCard
          etiket="Ciro"
          varyant="birincil"
          iyiYon="yukari-iyi"
          bosDavranisi="sifir"
          tutar={ciro.tamam ? ciro.deger.simdi.ciro : null}
          taban={MATRAH}
          karsilastirma={ciro.tamam ? { onceki: ciro.deger.onceki?.ciro ?? null, not } : undefined}
          trend={
            ciro.tamam
              ? {
                  seri: ciro.deger.seri,
                  sonDevamEdiyor: true,
                  ozet: <AyOzeti baslik="Son 6 ay ciro" aylar={aylar} seri={ciro.deger.seri} taban={MATRAH} />,
                }
              : undefined
          }
          donemNotu="Bu ay"
          hataReferansi={ciro.tamam ? undefined : ciro.referans}
        />
        <KpiCard
          etiket="Tahsilat"
          varyant="ikincil"
          iyiYon="yukari-iyi"
          bosDavranisi="sifir"
          tutar={tahsilat.tamam ? tahsilat.deger[aylar.length] : null}
          taban={BRUT}
          karsilastirma={tahsilat.tamam ? { onceki: tahsilat.deger[aylar.length + 1] ?? null, not } : undefined}
          trend={
            tahsilat.tamam
              ? {
                  seri: tahsilatSerisi,
                  sonDevamEdiyor: true,
                  ozet: <AyOzeti baslik="Son 6 ay tahsilat" aylar={aylar} seri={tahsilatSerisi} taban={BRUT} />,
                }
              : undefined
          }
          donemNotu="Bu ay"
          hataReferansi={tahsilat.tamam ? undefined : tahsilat.referans}
        />
        <KpiCard
          etiket="Bekleyen sipariş"
          varyant="ikincil"
          iyiYon="asagi-iyi"
          bosDavranisi="sifir"
          adet={bekleyen.tamam ? bekleyen.deger : null}
          karsilastirma={{ anlik: "şu an" }}
          vurgu={bekleyen.tamam && bekleyen.deger > 0 ? "uyari" : undefined}
          hataReferansi={bekleyen.tamam ? undefined : bekleyen.referans}
        />
        <KpiCard
          etiket="Kargolanacak"
          varyant="baglamsal"
          iyiYon="asagi-iyi"
          bosDavranisi="sifir"
          adet={kargolanacak.tamam ? kargolanacak.deger : null}
          karsilastirma={{ anlik: "şu an" }}
          vurgu={kargolanacak.tamam && kargolanacak.deger > 0 ? "uyari" : undefined}
          hataReferansi={kargolanacak.tamam ? undefined : kargolanacak.referans}
        />
      </KpiSatiri>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Kritik stok */}
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Kritik Stok ({criticalProducts.length})
          </h2>
          <div className="tablo-kutusu">
            <table className="veri-tablosu">
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th className="oncelik-dusuk">Kod</th>
                  <th className="sayi">Stok</th>
                </tr>
              </thead>
              <tbody>
                {criticalProducts.length === 0 && (
                  <EmptyRow colSpan={3} text="Kritik stokta ürün yok." />
                )}
                {criticalProducts.map((p) => (
                  <tr key={p.id}>
                    <td className="text-slate-900">{p.name}</td>
                    <td className="text-slate-500 oncelik-dusuk">{p.code}</td>
                    <td className="sayi">
                      <StokMiktari miktar={p.stock} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-right">
            <Link
              href="/stock"
              className={buton("metin")}
            >
              Stok Yönetimi →
            </Link>
          </div>
        </Card>

        {/* Stok planlaması için: bu ay en çok sevk edilenler (adet, sayılan belgeler). */}
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Bu ay en çok sevk edilen ürünler</h2>
          {enCok.tamam ? (
            <BarMicro
              satirlar={enCok.deger.map((u, i) => ({
                anahtar: u.urunId,
                etiket: u.ad,
                deger: `${formatSayi(u.miktar)} adet`,
                oran: enCokOranlari[i],
              }))}
            />
          ) : (
            <p className="text-sm text-negative">
              Yüklenemedi <span className="text-xs text-slate-500">· Hata referansı: <span className="font-mono">{enCok.referans}</span></span>
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
