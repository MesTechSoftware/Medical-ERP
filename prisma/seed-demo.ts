import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalizePhone } from "../src/lib/phone";
import { policy } from "../src/lib/policy";
import { uretBelgeNo } from "../src/lib/belge-no";
import { degistirDoktorSahibi } from "../src/lib/sahiplik";
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
    await prisma.$executeRawUnsafe(
      `TRUNCATE ${tablolar.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`
    );
  }

  // Demo yöneticisi referans veriden ÖNCE açılır: referans seed bir YONETICI gördüğünde
  // ortam değişkenindeki ilk yöneticiyi açmaz (E-2 §(2) yalnız devreye almanın konusudur).
  const adminPass = await bcrypt.hash("admin123", 10);
  const sellerPass = await bcrypt.hash("satici123", 10);
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
  const varsayilanVergi = await prisma.taxRate.findUniqueOrThrow({
    where: { code: policy.tax.varsayilanVergiOraniKodu },
  });
  const liste = await prisma.priceList.findUniqueOrThrow({
    where: { code: policy.pricing.varsayilanFiyatListesiKodu },
  });
  const depo = await prisma.stockLocation.findUniqueOrThrow({ where: { code: "MERKEZ" } });
  const kargolar = await prisma.carrier.findMany({ orderBy: { sortOrder: "asc" } });

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

  // --- Ürünler ---
  // Liste fiyatı NET (KDV hariç) ve varsayılan listenin satırıdır (X-10 §(5)).
  // Stok saklanmaz; başlangıç stoğu GIRIS hareketidir (ADR-005).
  const productSeeds = [
    { name: "Cerrahi Eldiven (Kutu)", code: "MED-001", fiyat: "120.00", stok: 500 },
    { name: "Steril Gazlı Bez", code: "MED-002", fiyat: "45.50", stok: 800 },
    { name: "Enjektör 5ml (100lü)", code: "MED-003", fiyat: "85.00", stok: 300 },
    { name: "Ameliyat İpliği", code: "MED-004", fiyat: "230.00", stok: 150 },
    { name: "Dijital Ateş Ölçer", code: "MED-005", fiyat: "340.90", stok: 60 },
    { name: "Tansiyon Aleti", code: "MED-006", fiyat: "750.00", stok: 8 }, // kritik stok
    { name: "Cerrahi Maske (50li)", code: "MED-007", fiyat: "60.00", stok: 1200 },
    { name: "İnfüzyon Seti", code: "MED-008", fiyat: "95.75", stok: 5 }, // kritik stok
  ];

  const products: { id: string; code: string; fiyat: string }[] = [];
  for (const s of productSeeds) {
    const created = await prisma.product.create({
      data: { name: s.name, code: s.code, taxRateId: varsayilanVergi.id },
    });
    await prisma.priceListItem.create({
      data: { priceListId: liste.id, productId: created.id, listPrice: s.fiyat },
    });
    await prisma.stockMovement.create({
      data: {
        productId: created.id,
        locationId: depo.id,
        type: "GIRIS",
        quantity: s.stok,
        note: "Başlangıç stok girişi",
      },
    });
    products.push({ id: created.id, code: s.code, fiyat: s.fiyat });
  }

  const byCode = (code: string) => products.find((p) => p.code === code)!;

  // --- Doktorlar (her biri bir satıcının portföyünde — RULE-02) ---
  const doctorSeeds = [
    { fullName: "Selin Aksoy", title: "Dr.", specialty: "Kardiyoloji", clinic: "Acıbadem Hastanesi", region: "Marmara", city: "İstanbul", phone: "0532 111 22 33", seller: 0 },
    { fullName: "Kaan Öz", title: "Op. Dr.", specialty: "Ortopedi", clinic: "Memorial", region: "Marmara", city: "İstanbul", phone: "0533 222 33 44", seller: 0 },
    { fullName: "Elif Yıldız", title: "Prof. Dr.", specialty: "Nöroloji", clinic: "Medipol", region: "Marmara", city: "İstanbul", phone: "0534 333 44 55", seller: 1 },
    { fullName: "Burak Şahin", title: "Dr.", specialty: "Dahiliye", clinic: "Florence Nightingale", region: "Ege", city: "İzmir", phone: "0535 444 55 66", seller: 1 },
    { fullName: "Cem Arslan", title: "Dr.", specialty: "Genel Cerrahi", clinic: "Liv Hospital", region: "İç Anadolu", city: "Ankara", phone: "0536 555 66 77", seller: 2 },
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

  const byDoctor = (fullName: string) =>
    doctors.find((d) => d.fullName === fullName)!;

  // --- Örnek siparişler (bugünkü akış: stok sipariş anında düşer) ---
  async function createOrder(opts: {
    sellerId: string;
    doctorName: string;
    status: "BEKLIYOR" | "HAZIRLANIYOR" | "KARGOLANDI" | "TESLIM_EDILDI" | "IPTAL";
    lines: { code: string; qty: number }[];
  }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          documentNo: await uretBelgeNo("SIP", tx),
          sellerId: opts.sellerId,
          doctorId: byDoctor(opts.doctorName).id,
          stage: "ONAYLI",
          status: opts.status,
          paymentTermDays: policy.finance.odemeVadesiGunVarsayilan,
          items: {
            create: opts.lines.map((l) => {
              const prod = byCode(l.code);
              return {
                productId: prod.id,
                quantity: l.qty,
                listPrice: prod.fiyat,
                unitPrice: prod.fiyat,
                vatRate: varsayilanVergi.rate,
              };
            }),
          },
        },
      });

      // İptal edilmemiş siparişlerde CIKIS hareketi (kaynağı sipariş — B-7).
      if (opts.status !== "IPTAL") {
        for (const l of opts.lines) {
          await tx.stockMovement.create({
            data: {
              productId: byCode(l.code).id,
              locationId: depo.id,
              type: "CIKIS",
              quantity: l.qty,
              note: "Sipariş çıkışı",
              orderId: order.id,
            },
          });
        }
      }

      // Kargolanmış/teslim edilmiş siparişlere sevkiyat başlığı (satırı 1B madde 7'de).
      if (opts.status === "KARGOLANDI" || opts.status === "TESLIM_EDILDI") {
        await tx.shipment.create({
          data: {
            documentNo: await uretBelgeNo("SVK", tx),
            orderId: order.id,
            carrierId: kargolar[0].id,
            trackingNumber: "TR" + Math.floor(Math.random() * 1_000_000_000),
            shippedAt: new Date(),
            status: opts.status,
          },
        });
      }
      return order;
    });
  }

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
    lines: [{ code: "MED-005", qty: 5 }],
  });

  await createOrder({
    sellerId: sellers[1].id,
    doctorName: "Elif Yıldız",
    status: "HAZIRLANIYOR",
    lines: [
      { code: "MED-003", qty: 15 },
      { code: "MED-007", qty: 30 },
    ],
  });

  await createOrder({
    sellerId: sellers[1].id,
    doctorName: "Burak Şahin",
    status: "BEKLIYOR",
    lines: [{ code: "MED-004", qty: 4 }],
  });

  await createOrder({
    sellerId: sellers[2].id,
    doctorName: "Cem Arslan",
    status: "IPTAL",
    lines: [{ code: "MED-006", qty: 2 }],
  });

  // --- Örnek tahsilat (doktordan ŞİRKETE — D-01) ---
  // Kısmi tahsilat (FR-25). Tahsilat siparişe eşlenmez — mahsup yok (X-6).
  const havale = await prisma.paymentMethod.findFirstOrThrow({ where: { type: "BANKA" } });
  await prisma.$transaction(async (tx) => {
    await tx.doctorPayment.create({
      data: {
        documentNo: await uretBelgeNo("THS", tx),
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
  });

  console.log("Demo seed tamamlandı.");
  console.log(`  Yönetici: ${admin.email} / admin123`);
  console.log(`  Satıcı:   ${sellers.map((s) => s.email).join(", ")} / satici123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
