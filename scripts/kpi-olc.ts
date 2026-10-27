import { performance } from "node:perf_hooks";

import { prisma } from "../src/lib/db";
import { bakiyeSerisi } from "../src/lib/doctor-cari";
import { donemCoz, karsilastirmaAraliklari, sonAylar } from "../src/lib/donem";
import { ciroOzeti, enCokSevkEdilenler, saticiCiroSerileri, tahsilatToplamlari } from "../src/lib/reports-service";
import { simdi, takvimAyi } from "../src/lib/zaman";

/**
 * KPI sorgularının süresini ölçer (ADR-010) — yalnız okur, hiçbir şey yazmaz. Her sorgu bir
 * ısınma ve beş ölçümle çalışır; medyan milisaniye yazılır (PR açıklaması için markdown tablo).
 * Kullanım: `DATABASE_URL=… npx tsx scripts/kpi-olc.ts`
 */
async function olc(ad: string, sorgu: () => Promise<unknown>) {
  await sorgu();
  const sureler: number[] = [];
  for (let i = 0; i < 5; i++) {
    const t = performance.now();
    await sorgu();
    sureler.push(performance.now() - t);
  }
  sureler.sort((a, b) => a - b);
  console.log(`| ${ad} | ${sureler[2].toFixed(1)} |`);
}

async function main() {
  const an = simdi();
  const aylar = sonAylar(6, takvimAyi(an), an);
  const k = karsilastirmaAraliklari(donemCoz(undefined, an), an);
  const saticilar = (await prisma.user.findMany({ where: { role: "SATICI" }, select: { id: true } })).map((s) => s.id);
  const doktor = await prisma.doctor.findFirst({ select: { id: true } });
  const [siparis, sevkSatiri, tahsilat] = await Promise.all([
    prisma.order.count(),
    prisma.shipmentItem.count(),
    prisma.doctorPayment.count(),
  ]);

  console.log(`Veri: ${siparis} sipariş · ${sevkSatiri} sevk satırı · ${tahsilat} tahsilat · ${saticilar.length} satıcı\n`);
  console.log("| KPI sorgusu | medyan ms |\n|---|---|");
  await olc("ciroOzeti — şirket, 6 ay + karşılaştırma", () => ciroOzeti({ kovalar: aylar, ...k }, { tur: "sirket" }));
  if (saticilar[0]) {
    await olc("ciroOzeti — tek satıcı", () => ciroOzeti({ kovalar: aylar, ...k }, { tur: "satici", saticiId: saticilar[0] }));
  }
  await olc("tahsilatToplamlari — 6 ay + 2 dönem, tek sorgu", () =>
    tahsilatToplamlari([...aylar.map((a) => a.aralik), k.simdi, ...(k.onceki ? [k.onceki] : [])])
  );
  await olc("saticiCiroSerileri — bütün satıcılar, 6 ay", () => saticiCiroSerileri(aylar, saticilar));
  await olc("enCokSevkEdilenler — bu ay, ilk 5", () => enCokSevkEdilenler(k.simdi, 5));
  await olc("sipariş sayıları (bekleyen + kargolanacak)", () =>
    Promise.all([prisma.order.count({ where: { status: "BEKLIYOR" } }), prisma.order.count({ where: { status: "HAZIRLANIYOR" } })])
  );
  if (doktor) await olc("bakiyeSerisi — tek doktor, 6 ay sonu", () => bakiyeSerisi(doktor.id, aylar.map((a) => a.aralik.bitis)));
}

main().finally(() => prisma.$disconnect());
