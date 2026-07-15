import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

// TL -> kuruş
const tl = (v: number) => Math.round(v * 100);

async function main() {
  console.log("Seed başlıyor: mevcut veriler temizleniyor...");
  // Bağımlılık sırasına göre temizle
  await prisma.stockMovement.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.payment.deleteMany();
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

  // --- Ürünler (salePrice ve stok kuruş/adet) ---
  const productSeeds = [
    { name: "Cerrahi Eldiven (Kutu)", code: "MED-001", salePrice: tl(120), stock: 500 },
    { name: "Steril Gazlı Bez", code: "MED-002", salePrice: tl(45.5), stock: 800 },
    { name: "Enjektör 5ml (100lü)", code: "MED-003", salePrice: tl(85), stock: 300 },
    { name: "Ameliyat İpliği", code: "MED-004", salePrice: tl(230), stock: 150 },
    { name: "Dijital Ateş Ölçer", code: "MED-005", salePrice: tl(340.9), stock: 60 },
    { name: "Tansiyon Aleti", code: "MED-006", salePrice: tl(750), stock: 8 }, // kritik stok
    { name: "Cerrahi Maske (50li)", code: "MED-007", salePrice: tl(60), stock: 1200 },
    { name: "İnfüzyon Seti", code: "MED-008", salePrice: tl(95.75), stock: 5 }, // kritik stok
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

  // --- Örnek siparişler (stok düşümü + OUT hareketi ile) ---
  async function createOrder(opts: {
    sellerId: string;
    doctorName: string;
    hospital: string;
    status: "PENDING" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    lines: { code: string; qty: number }[];
  }) {
    const items = opts.lines.map((l) => {
      const prod = byCode(l.code);
      return {
        productId: prod.id,
        quantity: l.qty,
        unitPrice: prod.salePrice,
        lineTotal: prod.salePrice * l.qty,
      };
    });
    const total = items.reduce((s, i) => s + i.lineTotal, 0);
    const cancelled = opts.status === "CANCELLED";

    const order = await prisma.order.create({
      data: {
        sellerId: opts.sellerId,
        doctorName: opts.doctorName,
        hospital: opts.hospital,
        status: opts.status,
        totalAmount: total,
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
    doctorName: "Dr. Selin Aksoy",
    hospital: "Acıbadem Hastanesi",
    status: "DELIVERED",
    lines: [
      { code: "MED-001", qty: 10 },
      { code: "MED-002", qty: 20 },
    ],
  });

  await createOrder({
    sellerId: sellers[0].id,
    doctorName: "Dr. Kaan Öz",
    hospital: "Memorial",
    status: "SHIPPED",
    lines: [{ code: "MED-005", qty: 5 }],
  });

  await createOrder({
    sellerId: sellers[1].id,
    doctorName: "Dr. Elif Yıldız",
    hospital: "Medipol",
    status: "PREPARING",
    lines: [
      { code: "MED-003", qty: 15 },
      { code: "MED-007", qty: 30 },
    ],
  });

  await createOrder({
    sellerId: sellers[1].id,
    doctorName: "Dr. Burak Şahin",
    hospital: "Florence Nightingale",
    status: "PENDING",
    lines: [{ code: "MED-004", qty: 4 }],
  });

  await createOrder({
    sellerId: sellers[2].id,
    doctorName: "Dr. Cem Arslan",
    hospital: "Liv Hospital",
    status: "CANCELLED",
    lines: [{ code: "MED-006", qty: 2 }],
  });

  // --- Örnek ödemeler ---
  await prisma.payment.create({
    data: { sellerId: sellers[0].id, amount: tl(1500), method: "TRANSFER", note: "Kısmi ödeme" },
  });
  await prisma.payment.create({
    data: { sellerId: sellers[0].id, amount: tl(500), method: "CASH" },
  });
  await prisma.payment.create({
    data: { sellerId: sellers[1].id, amount: tl(1000), method: "CARD", note: "Peşin" },
  });

  console.log("Seed tamamlandı.");
  console.log(`  Admin:   ${admin.email} / admin123`);
  console.log(`  Satıcı:  ${sellers.map((s) => s.email).join(", ")} / satici123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
