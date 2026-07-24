import { prisma } from "@/lib/db";
import { requireDealerAccount } from "@/lib/dealer-session";
import { formatTRY } from "@/lib/money";
import { grossFromNet } from "@/lib/vat";
import { PageHeader, Card } from "@/components/ui";
import RequestForm from "./RequestForm";

/** FR-46d: Bayi sevkiyat talebi oluşturma sayfası. */
export default async function DealerRequestPage() {
  const { dealer } = await requireDealerAccount();

  // Yalnızca fiyatı tanımlı aktif ürünler talep edilebilir (RULE-06).
  const prices = await prisma.dealerPrice.findMany({
    where: { dealerId: dealer.id, product: { status: "ACTIVE" } },
    orderBy: { product: { name: "asc" } },
    include: { product: { select: { name: true, code: true } } },
  });

  // BigInt istemciye geçmesin: fiyatları sunucuda formatla, toplam için de
  // güvenli (2^53 altı) number kuruş gönder.
  const priceItems = prices.map((p) => {
    const gross = grossFromNet(p.netPrice, p.vatRate);
    return {
      productId: p.productId,
      name: p.product.name,
      code: p.product.code,
      grossPrice: formatTRY(gross),
      grossKurus: Number(gross),
    };
  });

  return (
    <div>
      <PageHeader
        title="Yeni Sevkiyat Talebi"
        description="Ürün ve miktar seçip talep oluşturun"
      />
      <Card>
        <RequestForm prices={priceItems} />
      </Card>
    </div>
  );
}
