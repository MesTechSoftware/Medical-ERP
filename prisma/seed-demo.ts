import "dotenv/config";
import bcrypt from "bcryptjs";
import { demoParola } from "../src/lib/demo-parola";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalizePhone } from "../src/lib/phone";
import { policy } from "../src/lib/policy";
import { uretBelgeNo } from "../src/lib/belge-no";
import { degistirDoktorSahibi } from "../src/lib/sahiplik";
import { sevkiyatYaz } from "../src/lib/sevkiyat";
import { konsinyeCikisYaz } from "../src/lib/stok-transfer";
import { tahsilatHareketiYaz } from "../src/lib/cari-hareket";
import { referansVeriYukle } from "./referans";

// `db:seed:demo` — YALNIZ GELİŞTİRME VE TEST (C9). Bütün tabloları boşaltır, referans
// veriyi yükler, üstüne örnek kullanıcı/ürün/doktor/sipariş basar. Canlıda çalışmaz.

if (process.env.NODE_ENV === "production") {
  throw new Error("db:seed:demo canlıda çalıştırılamaz — referans veri için db:seed kullanın.");
}
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL tanımlı değil (bkz. .env.example).");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Demo seed başlıyor: mevcut veriler temizleniyor...");
  const tablolar = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tablolar.length > 0) {
    // Denetim kaydı değişmezdir (KARARLAR X-18 §(1)); demo öncesi boşaltma bakım yolundan, tetikleyiciler
    // yalnız bu transaction'da kapalıyken yapılır (ADR-011 §11, süper kullanıcı ister).
    await prisma.$transaction([
      prisma.$executeRawUnsafe("SET LOCAL session_replication_role = replica"),
      prisma.$executeRawUnsafe(`TRUNCATE ${tablolar.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`),
    ]);
  }

  // Demo yöneticisi referans veriden ÖNCE açılır: referans seed bir YONETICI gördüğünde
  // ortam değişkenindeki ilk yöneticiyi açmaz (E-2 §(2) yalnız devreye almanın konusudur).
  const adminParola = demoParola("admin");
  const saticiParola = demoParola("satici");
  const operasyonParola = demoParola("operasyon");
  const adminPass = await bcrypt.hash(adminParola.parola, 10);
  const sellerPass = await bcrypt.hash(saticiParola.parola, 10);
  const admin = await prisma.user.create({
    data: {
      name: "Sistem Yöneticisi",
      email: "admin@medikal.local",
      phone: "0212 000 00 00",
      passwordHash: adminPass,
      role: "YONETICI",
    },
  });

  await referansVeriYukle(prisma);
  const liste = await prisma.priceList.findUniqueOrThrow({
    where: { code: policy.pricing.varsayilanFiyatListesiKodu },
  });
  const depo = await prisma.stockLocation.findUniqueOrThrow({ where: { code: "MERKEZ" } });

  // --- Satıcılar ---
  const sellers = await Promise.all(
    [
      { name: "Ahmet Yılmaz", email: "ahmet@medikal.local", phone: "0532 111 11 11" },
      { name: "Ayşe Demir", email: "ayse@medikal.local", phone: "0532 222 22 22" },
      { name: "Mehmet Kaya", email: "mehmet@medikal.local", phone: "0532 333 33 33" },
    ].map((s) =>
      prisma.user.create({
        data: { ...s, passwordHash: sellerPass, role: "SATICI" },
      })
    )
  );

  // --- Operasyon (D-2 §(1)) ---
  const operasyon = await prisma.user.create({
    data: {
      name: "Operasyon Sorumlusu",
      email: "operasyon@medikal.local",
      passwordHash: await bcrypt.hash(operasyonParola.parola, 10),
      role: "OPERASYON",
    },
  });

  // --- Ürünler: jenerik estetik / tıbbi cihaz kataloğu (toksin yok, gerçek marka yok) ---
  // Liste fiyatı NET (KDV hariç). `esikler` barem satırlarıdır: [en az adet, birim fiyat] (B-5, B-6);
  // ürün başına eşiği aşan en yüksek satır uygulanır. Stok saklanmaz; başlangıç stoğu GIRIS hareketidir (ADR-005).
  // KDV oranı C-6 tanım tablosundan seçilir.
  const productSeeds: {
    name: string;
    code: string;
    kdv: "KDV10" | "KDV20";
    esikler: [number, string][];
    ozel?: [number, string][];
    stok: number;
  }[] = [
    { name: "Hyaluronik Asit Dolgu 1 ml", code: "MED-001", kdv: "KDV10", esikler: [[1, "1200.00"], [10, "1100.00"], [25, "1000.00"]], ozel: [[1, "1050.00"], [10, "960.00"]], stok: 400 },
    { name: "Mezoterapi Kokteyli 5 ml", code: "MED-002", kdv: "KDV20", esikler: [[1, "450.00"], [10, "410.00"], [25, "380.00"]], ozel: [[1, "400.00"]], stok: 600 },
    { name: "PDO İp Mono (10'lu)", code: "MED-003", kdv: "KDV10", esikler: [[1, "850.00"]], ozel: [[1, "800.00"]], stok: 250 },
    { name: "Kanül 25G 50 mm (20'li)", code: "MED-004", kdv: "KDV10", esikler: [[1, "380.00"], [10, "350.00"]], ozel: [[1, "360.00"], [10, "330.00"]], stok: 300 },
    { name: "Enjeksiyon İğnesi 30G 4 mm (100'lü)", code: "MED-005", kdv: "KDV10", esikler: [[1, "140.00"], [10, "125.00"], [25, "110.00"]], ozel: [[1, "120.00"]], stok: 800 },
    { name: "PRP Kiti (2'li)", code: "MED-006", kdv: "KDV20", esikler: [[1, "520.00"]], ozel: [[1, "490.00"]], stok: 8 }, // kritik stok
    { name: "Cihaz Sarf Başlığı (Tek Kullanımlık)", code: "MED-007", kdv: "KDV20", esikler: [[1, "260.00"], [25, "230.00"]], ozel: [[1, "245.00"], [25, "220.00"]], stok: 1200 },
    { name: "Mikroiğne Başlık Seti", code: "MED-008", kdv: "KDV20", esikler: [[1, "310.00"]], ozel: [[1, "290.00"]], stok: 5 }, // kritik stok
  ];

  const ozelListe = await prisma.priceList.create({ data: { code: "OZEL-KLINIK", name: "Klinik Özel Liste" } });
  const vergiler = new Map((await prisma.taxRate.findMany()).map((v) => [v.code, v]));
  const products: { id: string; code: string; esikler: [number, string][]; ozel?: [number, string][]; rate: string }[] = [];
  for (const s of productSeeds) {
    const vergi = vergiler.get(s.kdv)!;
    const created = await prisma.product.create({
      data: { name: s.name, code: s.code, taxRateId: vergi.id },
    });
    for (const [minQuantity, listPrice] of s.esikler) {
      await prisma.priceListItem.create({ data: { priceListId: liste.id, productId: created.id, listPrice, minQuantity } });
    }
    for (const [minQuantity, listPrice] of s.ozel ?? []) {
      await prisma.priceListItem.create({ data: { priceListId: ozelListe.id, productId: created.id, listPrice, minQuantity } });
    }
    await prisma.stockMovement.create({
      data: {
        productId: created.id,
        locationId: depo.id,
        type: "GIRIS",
        quantity: s.stok,
        note: "Başlangıç stok girişi",
        createdById: admin.id,
      },
    });
    products.push({ id: created.id, code: s.code, esikler: s.esikler, ozel: s.ozel, rate: vergi.rate.toString() });
  }

  /** Miktara uygulanan liste fiyatı (barem). Özel liste her ürünü kapsar: atanmış cari için listede fiyatı olmayan ürün çözülemez. */
  const fiyatBul = (code: string, miktar: number, ozel: boolean) => {
    const p = products.find((x) => x.code === code)!;
    const tablo = ozel && p.ozel ? p.ozel : p.esikler;
    return [...tablo].filter(([e]) => e <= miktar).sort((x, y) => y[0] - x[0])[0][1];
  };

  const byCode = (code: string) => products.find((p) => p.code === code)!;

  // --- Cariler: doktorlar (her biri bir satıcının portföyünde — RULE-02) ve bayiler ---
  // Fatura bilgisi (A-13): Selin, Burak, Cem ve bayiler tam; Elif'te adres/il yok, Kaan'da hiçbiri yok
  // (EKSIK_FATURA_BILGISI senaryosu).
  const tamFatura = (unvan: string, vergiNo: string, daire: string, adres: string, ilce: string, il: string) => ({
    partyType: "TUZEL_KISI" as const,
    taxId: vergiNo,
    invoiceTitle: unvan,
    taxOffice: daire,
    invoiceAddress: adres,
    invoiceDistrict: ilce,
    invoiceCity: il,
  });
  const doctorSeeds = [
    { fullName: "Selin Aksoy", title: "Dr.", specialty: "Dermatoloji", clinic: "Lotus Estetik Kliniği", region: "Marmara", city: "İstanbul", phone: "0532 111 22 33", seller: 0, fatura: tamFatura("Lotus Estetik Sağlık Hizmetleri Ltd. Şti.", "1234567890", "Kadıköy", "Örnek Mah. Deneme Sok. No:1", "Kadıköy", "İstanbul") },
    { fullName: "Kaan Öz", title: "Op. Dr.", specialty: "Plastik Cerrahi", clinic: "Mavi Estetik Merkezi", region: "Marmara", city: "İstanbul", phone: "0533 222 33 44", seller: 0, fatura: {} },
    { fullName: "Elif Yıldız", title: "Prof. Dr.", specialty: "Estetik Tıp", clinic: "Zeytin Cilt Kliniği", region: "Marmara", city: "İstanbul", phone: "0534 333 44 55", seller: 1, fatura: { partyType: "TUZEL_KISI" as const, taxId: "2345678901", invoiceTitle: "Zeytin Cilt Kliniği A.Ş.", taxOffice: "Beşiktaş" } },
    { fullName: "Burak Şahin", title: "Dr.", specialty: "Dermatoloji", clinic: "Ege Estetik Kliniği", region: "Ege", city: "İzmir", phone: "0535 444 55 66", seller: 1, ozelListe: true, fatura: tamFatura("Ege Estetik Tıp Ltd. Şti.", "3456789012", "Konak", "Deneme Cad. No:12", "Konak", "İzmir") },
    { fullName: "Cem Arslan", title: "Dr.", specialty: "Estetik Tıp", clinic: "Anadolu Güzellik Kliniği", region: "İç Anadolu", city: "Ankara", phone: "0536 555 66 77", seller: 2, fatura: tamFatura("Anadolu Güzellik Kliniği Ltd. Şti.", "4567890123", "Çankaya", "Örnek Bulvarı No:34", "Çankaya", "Ankara") },
  ];

  const doctors: { id: string; fullName: string }[] = [];
  for (const d of doctorSeeds) {
    const created = await prisma.$transaction(async (tx) => {
      const doc = await tx.doctor.create({
        data: {
          accountClass: "DOKTOR",
          fullName: d.fullName,
          title: d.title,
          specialty: d.specialty,
          clinic: d.clinic,
          region: d.region,
          city: d.city,
          phoneNormalized: normalizePhone(d.phone),
          priceListId: d.ozelListe ? ozelListe.id : null,
          ...d.fatura,
        },
      });
      // Sahiplik yalnız tek noktadan yazılır (X-17 §(1)).
      const sonuc = await degistirDoktorSahibi(
        [doc.id],
        sellers[d.seller].id,
        { metin: "Seed ilk atama", yapanId: admin.id },
        tx
      );
      if (sonuc.durum === "HATA") throw new Error(sonuc.kuralKodu);
      return doc;
    });
    doctors.push(created);
  }

  // Bayiler (X-8): sahipsiz; siparişi yönetici/operasyon girer.
  const bayiSeeds = [
    { fullName: "Anadolu Medikal Dağıtım Ltd. Şti.", phone: "0212 555 01 01", city: "İstanbul", fatura: tamFatura("Anadolu Medikal Dağıtım Ltd. Şti.", "5678901234", "Şişli", "Dağıtım Sok. No:5", "Şişli", "İstanbul") },
    { fullName: "Karadeniz Estetik Ürünleri A.Ş.", phone: "0312 555 02 02", city: "Ankara", fatura: tamFatura("Karadeniz Estetik Ürünleri A.Ş.", "6789012345", "Çankaya", "Ticaret Cad. No:9", "Çankaya", "Ankara") },
  ];
  for (const b of bayiSeeds) {
    const bayi = await prisma.doctor.create({
      data: { accountClass: "BAYI", fullName: b.fullName, city: b.city, phoneNormalized: normalizePhone(b.phone), ...b.fatura },
    });
    doctors.push(bayi);
  }

  const byDoctor = (fullName: string) =>
    doctors.find((d) => d.fullName === fullName)!;

  // --- Kargo: Kurye ve Elden teslim takip bağlantısı olmayan seçeneklerdir (D-3) ---
  for (const k of [
    { name: "Kurye", sortOrder: 4 },
    { name: "Elden teslim", sortOrder: 5 },
  ]) {
    await prisma.carrier.upsert({ where: { name: k.name }, create: { ...k, trackingUrlTemplate: null }, update: {} });
  }
  const kargo = async (ad: string) => prisma.carrier.findUniqueOrThrow({ where: { name: ad } });

  // --- Örnek siparişler: stok, borç ve prim sevkiyatta doğar (A-3) ---
  async function createOrder(opts: {
    sellerId: string | null;
    doctorName: string;
    status: "BEKLIYOR" | "HAZIRLANIYOR" | "KARGOLANDI" | "TESLIM_EDILDI" | "IPTAL";
    lines: { code: string; qty: number }[];
    kargo?: string;
    takipNo?: string | null;
    /** Sevk günü bu kadar gün geriye alınır (fatura geriye dönük uyarısı senaryosu). */
    sevkGunOnce?: number;
    /** Yönetici dışı yapan ve gerekçe: stok yetmezse sevkiyat yazılmaz, onaya düşer (A-8). */
    sevkYapan?: { id: string; rol: "OPERASYON" };
    gerekce?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const sevkEdilir = opts.status === "KARGOLANDI" || opts.status === "TESLIM_EDILDI" || opts.sevkYapan !== undefined;
      const ozel = doctorSeeds.find((d) => d.fullName === opts.doctorName)?.ozelListe === true;
      const order = await tx.order.create({
        data: {
          documentNo: await uretBelgeNo("SIP", tx),
          sellerId: opts.sellerId,
          doctorId: byDoctor(opts.doctorName).id,
          stage: "ONAYLI",
          status: sevkEdilir ? "HAZIRLANIYOR" : opts.status,
          paymentTermDays: policy.finance.odemeVadesiGunVarsayilan,
          items: {
            create: opts.lines.map((l) => {
              const prod = byCode(l.code);
              const fiyat = fiyatBul(l.code, l.qty, ozel);
              return {
                productId: prod.id,
                quantity: l.qty,
                listPrice: fiyat,
                unitPrice: fiyat,
                vatRate: prod.rate,
              };
            }),
          },
        },
        include: { items: true },
      });

      // Sevk edilmiş siparişler uygulamanın kendi sevkiyat yolundan geçer.
      if (sevkEdilir) {
        const firma = await kargo(opts.kargo ?? "Aras Kargo");
        const sonuc = await sevkiyatYaz(tx, {
          siparisId: order.id,
          kalemler: order.items.map((i) => ({ siparisKalemiId: i.id, miktar: i.quantity })),
          carrierId: firma.id,
          trackingNumber: opts.takipNo === undefined ? "TR" + Math.floor(Math.random() * 1_000_000_000) : opts.takipNo,
          externalDispatchNo: null,
          yapan: opts.sevkYapan ?? { id: admin.id, rol: "YONETICI" },
          gerekce: opts.gerekce ?? null,
        });
        if (opts.sevkGunOnce && sonuc.durum === "SEVK_EDILDI") {
          const gun = opts.sevkGunOnce * 24 * 60 * 60 * 1000;
          const sevk = await tx.shipment.findUniqueOrThrow({ where: { id: sonuc.sevkiyatId } });
          await tx.shipment.update({
            where: { id: sevk.id },
            data: { shippedOn: new Date(sevk.shippedOn!.getTime() - gun), shippedAt: new Date(sevk.shippedAt!.getTime() - gun) },
          });
          // Sevk siparişten önce olamaz: sipariş günü de aynı kadar geri gider.
          await tx.order.update({ where: { id: order.id }, data: { orderDate: new Date(order.orderDate.getTime() - gun) } });
        }
        if (opts.status === "TESLIM_EDILDI") {
          await tx.order.update({ where: { id: order.id }, data: { status: "TESLIM_EDILDI" } });
          await tx.shipment.updateMany({ where: { orderId: order.id }, data: { status: "TESLIM_EDILDI" } });
        }
      }
      return order;
    });
  }

  // Fatura senaryoları: tam (Selin, bugün sevk) · eksik (Kaan) · 7 günden eski sevk (Burak, özel liste).
  await createOrder({
    sellerId: sellers[0].id,
    doctorName: "Selin Aksoy",
    status: "TESLIM_EDILDI",
    lines: [
      { code: "MED-001", qty: 10 },
      { code: "MED-002", qty: 20 },
    ],
  });

  await createOrder({
    sellerId: sellers[0].id,
    doctorName: "Kaan Öz",
    status: "KARGOLANDI",
    kargo: "Kurye",
    takipNo: null,
    lines: [{ code: "MED-005", qty: 5 }],
  });

  await createOrder({
    sellerId: sellers[1].id,
    doctorName: "Burak Şahin",
    status: "KARGOLANDI",
    sevkGunOnce: 10,
    lines: [
      { code: "MED-001", qty: 12 },
      { code: "MED-005", qty: 4 },
    ],
  });

  await createOrder({
    sellerId: sellers[1].id,
    doctorName: "Elif Yıldız",
    status: "HAZIRLANIYOR",
    lines: [
      { code: "MED-004", qty: 15 },
      { code: "MED-007", qty: 30 },
    ],
  });

  await createOrder({
    sellerId: sellers[1].id,
    doctorName: "Burak Şahin",
    status: "BEKLIYOR",
    lines: [{ code: "MED-003", qty: 4 }],
  });

  await createOrder({
    sellerId: sellers[2].id,
    doctorName: "Cem Arslan",
    status: "IPTAL",
    lines: [{ code: "MED-006", qty: 2 }],
  });

  // Bayi siparişi (sahipsiz): barem 25+ ve elden teslim.
  await createOrder({
    sellerId: null,
    doctorName: "Anadolu Medikal Dağıtım Ltd. Şti.",
    status: "TESLIM_EDILDI",
    kargo: "Elden teslim",
    takipNo: null,
    lines: [
      { code: "MED-001", qty: 25 },
      { code: "MED-007", qty: 30 },
    ],
  });
  await createOrder({
    sellerId: null,
    doctorName: "Karadeniz Estetik Ürünleri A.Ş.",
    status: "BEKLIYOR",
    lines: [{ code: "MED-002", qty: 10 }],
  });

  // Onay bekleyen işlemler (A-8): stoğu yetmeyen kalemde operasyonun gerekçeli sevki yazılmaz, onaya düşer.
  await createOrder({
    sellerId: sellers[2].id,
    doctorName: "Cem Arslan",
    status: "HAZIRLANIYOR",
    lines: [{ code: "MED-008", qty: 8 }],
    sevkYapan: { id: operasyon.id, rol: "OPERASYON" },
    gerekce: "Depo sayımı bekleniyor, müşteri acil istedi.",
  });
  await createOrder({
    sellerId: sellers[0].id,
    doctorName: "Selin Aksoy",
    status: "HAZIRLANIYOR",
    lines: [{ code: "MED-006", qty: 12 }],
    sevkYapan: { id: operasyon.id, rol: "OPERASYON" },
    gerekce: "Yeni parti yolda, sevk onayı isteniyor.",
  });

  // Konsinye bırakılmış klinik (A-4): Elif Yıldız'ın kliniğine depodan konsinye çıkış.
  await prisma.$transaction(async (tx) => {
    await konsinyeCikisYaz(tx, {
      doktorId: byDoctor("Elif Yıldız").id,
      kalemler: [
        { urunId: byCode("MED-001").id, miktar: 10 },
        { urunId: byCode("MED-004").id, miktar: 20 },
      ],
      yapan: { id: operasyon.id, rol: "OPERASYON" },
      gerekce: null,
    });
  });

  // --- Örnek tahsilat (doktordan ŞİRKETE — D-01) ---
  // Kısmi tahsilat (FR-25). Tahsilat siparişe eşlenmez — mahsup yok (X-6).
  const havale = await prisma.paymentMethod.findFirstOrThrow({ where: { type: "BANKA" } });
  await prisma.$transaction(async (tx) => {
    const documentNo = await uretBelgeNo("THS", tx);
    const odeme = await tx.doctorPayment.create({
      data: {
        documentNo,
        doctorId: byDoctor("Selin Aksoy").id,
        amount: "500.00",
        paymentMethodId: havale.id,
        commissionRate: havale.commissionRate,
        commissionAmount: "0.00",
        referenceNo: "SEED-001",
        note: "Kısmi tahsilat (seed)",
        recordedBy: admin.id,
      },
    });
    await tahsilatHareketiYaz(tx, {
      doctorId: odeme.doctorId,
      tutar: odeme.amount,
      yon: odeme.direction,
      documentNo,
      paymentId: odeme.id,
      yapanId: admin.id,
    });
  });

  console.log("Demo seed tamamlandı.");
  console.log(`  Yönetici: ${admin.email} / ${adminParola.ortamdan ? "(DEMO_ADMIN_PAROLA)" : adminParola.parola}`);
  console.log(`  Satıcı:   ${sellers.map((s) => s.email).join(", ")} / ${saticiParola.ortamdan ? "(DEMO_SATICI_PAROLA)" : saticiParola.parola}`);
  console.log(`  Operasyon: ${operasyon.email} / ${operasyonParola.ortamdan ? "(DEMO_OPERASYON_PAROLA)" : operasyonParola.parola}`);
  console.log("  Cariler: 5 doktor, 2 bayi · özel liste: Burak Şahin · konsinye: Elif Yıldız · onay bekleyen: 2");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
