import "dotenv/config";
import { korumaHatasi } from "./demo-gecmis-koruma";

// `db:seed:gecmis` — YALNIZ DEMO VE GELİŞTİRME (tasarım 2-7b). Demo seed'inin (db:seed:demo) üstüne
// 6 aylık geçmiş üretir. Korumalar: canlıda çalışmaz; DEMO_GECMIS=evet bayrağı ve DATABASE_URL
// sunucusunun DEMO_GECMIS_HOST izin listesinde olması gerekir; demo işareti (admin@medikal.local)
// yoksa ya da geçmiş zaten varsa durur. Hata olursa hiçbir şey yazılmaz (tek transaction).
//
//   DEMO_GECMIS=evet DEMO_GECMIS_HOST=localhost npm run db:seed:gecmis

async function main() {
  const hata = korumaHatasi(process.env, process.env.DATABASE_URL);
  if (hata) throw new Error(hata);
  // Çekirdek veritabanı istemcisini yükler; korumalardan sonra içe aktarılır.
  const { demoGecmisUret } = await import("./demo-gecmis");
  const { prisma } = await import("../src/lib/db");
  const { yerelGunMetni } = await import("../src/lib/zaman");
  try {
    console.log("Demo geçmişi üretiliyor (6 ay)…");
    const o = await demoGecmisUret({ ay: 6, tohum: 20261026 });
    // Yerel (İstanbul) günler; bitiş bugünün başıdır, son gün dündür.
    console.log(`Tamam: ${yerelGunMetni(o.baslangic)} – ${yerelGunMetni(new Date(o.bitis.getTime() - 1))}`);
    console.log(
      `  ${o.siparis} sipariş · ${o.sevkiyat} sevkiyat · ${o.teslim} teslim · ${o.iade} iade · ${o.tahsilat} tahsilat · ${o.stokGirisi} stok girişi`
    );
    if (o.yenidenNumaralanan > 0) console.log(`  ${o.yenidenNumaralanan} belge kaydırılan yılın sayacından numaralandı.`);
    console.log("  Tutarlılık denetimi geçti.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
