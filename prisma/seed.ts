import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEFAULT_VAT_RATE, lineTotals, sumLineTotals } from "../src/lib/vat";
import { normalizePhone } from "../src/lib/phone";
import { addDays } from "../src/lib/settings";

const DEFAULT_DUE_DAYS = 30;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL tanımlı değil (bkz. .env.example).");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// TL -> kuruş (BigInt; parasal alanlar BigInt kuruş olarak saklanır)
const tl = (v: number) => BigInt(Math.round(v * 100));

async function main() {
  console.log("Seed başlıyor: mevcut veriler temizleniyor...");
  // Bağımlılık sırasına göre temizle
  await prisma.loginAttempt.deleteMany();
  await prisma.dealerShipmentItem.deleteMany();
  await prisma.dealerShipment.deleteMany();
  await prisma.dealerPrice.deleteMany();
  await prisma.dealerPayment.deleteMany();
  await prisma.dealer.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.doctorAssignment.deleteMany();
  await prisma.congressLedger.deleteMany();
  await prisma.congressRegistration.deleteMany();
  await prisma.congressPackage.deleteMany();
  await prisma.congress.deleteMany();
  await prisma.paymentAllocation.deleteMany();
  await prisma.dueDateChange.deleteMany();
  await prisma.doctorPayment.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const adminPass = await bcrypt.hash("admin123", 10);
  const sellerPass = await bcrypt.hash("satici123", 10);

  // --- Admin ---
  const admin = await prisma.user.create({
    data: {
      name: "Sistem Yöneticisi",
      email: "admin@medikal.local",
      phone: "0212 000 00 00",
      passwordHash: adminPass,
      role: "ADMIN",
    },
  });

  // --- Satıcılar ---
  const sellers = await Promise.all(
    [
      { name: "Ahmet Yılmaz", email: "ahmet@medikal.local", phone: "0532 111 11 11" },
      { name: "Ayşe Demir", email: "ayse@medikal.local", phone: "0532 222 22 22" },
      { name: "Mehmet Kaya", email: "mehmet@medikal.local", phone: "0532 333 33 33" },
    ].map((s) =>
      prisma.user.create({
        data: { ...s, passwordHash: sellerPass, role: "SELLER" },
      })
    )
  );

  // --- Ürünler ---
  // Fiyatlar NET (KDV hariç) kuruş. Taban fiyat listenin %80'i olarak kurgulandı
  // ki satıcının serbest fiyat alanı (FR-12) test edilebilsin.
  const p = (listTL: number, minTL: number, stock: number) => ({
    netListPrice: tl(listTL),
    netMinPrice: tl(minTL),
    vatRate: DEFAULT_VAT_RATE,
    stock,
  });
  const productSeeds = [
    { name: "Cerrahi Eldiven (Kutu)", code: "MED-001", ...p(120, 96, 500) },
    { name: "Steril Gazlı Bez", code: "MED-002", ...p(45.5, 36.4, 800) },
    { name: "Enjektör 5ml (100lü)", code: "MED-003", ...p(85, 68, 300) },
    { name: "Ameliyat İpliği", code: "MED-004", ...p(230, 184, 150) },
    { name: "Dijital Ateş Ölçer", code: "MED-005", ...p(340.9, 272.72, 60) },
    { name: "Tansiyon Aleti", code: "MED-006", ...p(750, 600, 8) }, // kritik stok
    { name: "Cerrahi Maske (50li)", code: "MED-007", ...p(60, 48, 1200) },
    { name: "İnfüzyon Seti", code: "MED-008", ...p(95.75, 76.6, 5) }, // kritik stok
  ];

  const products: Awaited<ReturnType<typeof prisma.product.create>>[] = [];
  for (const p of productSeeds) {
    const created = await prisma.product.create({ data: p });
    // başlangıç stok girişi hareketi
    await prisma.stockMovement.create({
      data: {
        productId: created.id,
        type: "IN",
        quantity: p.stock,
        note: "Başlangıç stok girişi",
      },
    });
    products.push(created);
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
    const ownerId = sellers[d.seller].id;
    const created = await prisma.doctor.create({
      data: {
        fullName: d.fullName,
        title: d.title,
        specialty: d.specialty,
        clinic: d.clinic,
        region: d.region,
        city: d.city,
        phoneNormalized: normalizePhone(d.phone),
        ownerSellerId: ownerId,
      },
    });
    await prisma.doctorAssignment.create({
      data: {
        doctorId: created.id,
        sellerId: ownerId,
        assignedBy: admin.id,
        reason: "Seed ilk atama",
      },
    });
    doctors.push(created);
  }

  const byDoctor = (fullName: string) =>
    doctors.find((d) => d.fullName === fullName)!;

  // --- Örnek siparişler (stok düşümü + OUT hareketi ile) ---
  async function createOrder(opts: {
    sellerId: string;
    doctorName: string;
    status: "PENDING" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    lines: { code: string; qty: number }[];
  }) {
    const items = opts.lines.map((l) => {
      const prod = byCode(l.code);
      return {
        productId: prod.id,
        quantity: l.qty,
        netUnitPrice: prod.netListPrice,
        listPriceAtSale: prod.netListPrice,
        discountRate: 0,
        vatRate: prod.vatRate,
        ...lineTotals(prod.netListPrice, l.qty, prod.vatRate),
      };
    });
    const { netTotal, vatTotal, grossTotal } = sumLineTotals(items);
    const cancelled = opts.status === "CANCELLED";

    const order = await prisma.order.create({
      data: {
        sellerId: opts.sellerId,
        doctorId: byDoctor(opts.doctorName).id,
        status: opts.status,
        dueDate: addDays(new Date(), DEFAULT_DUE_DAYS),
        netTotal,
        vatTotal,
        grossTotal,
        items: { create: items },
      },
    });

    // İptal edilmemiş siparişlerde stok düşer + OUT hareketi
    if (!cancelled) {
      for (const it of items) {
        await prisma.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: it.quantity } },
        });
        await prisma.stockMovement.create({
          data: {
            productId: it.productId,
            type: "OUT",
            quantity: it.quantity,
            note: "Sipariş çıkışı",
            orderId: order.id,
          },
        });
      }
    }

    // Kargolanmış/teslim edilmiş siparişlere kargo kaydı
    if (opts.status === "SHIPPED" || opts.status === "DELIVERED") {
      await prisma.shipment.create({
        data: {
          orderId: order.id,
          carrier: "Aras Kargo",
          trackingNumber: "TR" + Math.floor(Math.random() * 1_000_000_000),
          shippedAt: new Date(),
          status: opts.status,
        },
      });
    }

    return order;
  }

  await createOrder({
    sellerId: sellers[0].id,
    doctorName: "Selin Aksoy",
    status: "DELIVERED",
    lines: [
      { code: "MED-001", qty: 10 },
      { code: "MED-002", qty: 20 },
    ],
  });

  await createOrder({
    sellerId: sellers[0].id,
    doctorName: "Kaan Öz",
    status: "SHIPPED",
    lines: [{ code: "MED-005", qty: 5 }],
  });

  await createOrder({
    sellerId: sellers[1].id,
    doctorName: "Elif Yıldız",
    status: "PREPARING",
    lines: [
      { code: "MED-003", qty: 15 },
      { code: "MED-007", qty: 30 },
    ],
  });

  await createOrder({
    sellerId: sellers[1].id,
    doctorName: "Burak Şahin",
    status: "PENDING",
    lines: [{ code: "MED-004", qty: 4 }],
  });

  await createOrder({
    sellerId: sellers[2].id,
    doctorName: "Cem Arslan",
    status: "CANCELLED",
    lines: [{ code: "MED-006", qty: 2 }],
  });

  // --- Örnek tahsilatlar (doktordan ŞİRKETE — D-01) ---
  // Biri KISMİ (FR-25). Tahsilat siparişe eşlenmez — mahsup yok (X-6).
  const firstDoctor = byDoctor("Selin Aksoy");
  const openOrder = await prisma.order.findFirst({
    where: { doctorId: firstDoctor.id, status: { not: "CANCELLED" } },
    orderBy: { dueDate: "asc" },
  });
  if (openOrder) {
    const partial = openOrder.grossTotal / 3n; // kısmi tahsilat
    await prisma.doctorPayment.create({
      data: {
        doctorId: firstDoctor.id,
        amount: partial,
        method: "TRANSFER",
        referenceNo: "SEED-001",
        note: "Kısmi tahsilat (seed)",
        recordedBy: admin.id,
      },
    });
  }

  // --- Bayiler (Faz D) ---
  const dealerLoginPass = await bcrypt.hash("bayi123", 10);
  const dealerUser = await prisma.user.create({
    data: {
      name: "Anadolu Medikal Ltd.",
      email: "bayi@medikal.local",
      passwordHash: dealerLoginPass,
      role: "DEALER",
    },
  });
  const dealer = await prisma.dealer.create({
    data: {
      code: "BAYI-001",
      title: "Anadolu Medikal Ltd.",
      taxOffice: "Kızılay",
      taxNo: "1234567890",
      contactName: "Deniz Aslan",
      phone: "0312 444 55 66",
      userId: dealerUser.id,
    },
  });
  // Login'siz ikinci bayi (admin-only yönetilen).
  await prisma.dealer.create({
    data: { code: "BAYI-002", title: "Ege Sağlık A.Ş.", contactName: "Merve Kaya" },
  });
  // Bayiye özel fiyat listesi (listenin ~%90'ı).
  for (const code of ["MED-001", "MED-002", "MED-006"]) {
    const prod = byCode(code);
    await prisma.dealerPrice.create({
      data: {
        dealerId: dealer.id,
        productId: prod.id,
        netPrice: (prod.netListPrice * 9n) / 10n,
        vatRate: prod.vatRate,
      },
    });
  }

  console.log("Seed tamamlandı.");
  console.log(`  Admin:   ${admin.email} / admin123`);
  console.log(`  Satıcı:  ${sellers.map((s) => s.email).join(", ")} / satici123`);
  console.log(`  Bayi:    ${dealerUser.email} / bayi123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
