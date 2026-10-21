import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { xlsxKitap } from "@/lib/disa-aktarim-yazici";
import { hesaplaDoktorBakiye } from "@/lib/doctor-cari";
import { calistirIceAktarim, partiGeriAl } from "@/lib/ice-aktarim";
import { hesaplaStok } from "@/lib/stok";
import { takvimYili } from "@/lib/zaman";
import { referansVeri, yeniDoktorVerisi } from "../../../test/integration/referans";

// A-6-1 · D-6-2 · B-4-6 — açılış bakiyesi ve açılış stoğu içe aktarımı.

let s: Awaited<ReturnType<typeof seed>>;
async function seed() {
  const ref = await referansVeri();
  const y = await prisma.user.create({ data: { name: "Y", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" } });
  const a = await prisma.doctor.create({ data: { ...yeniDoktorVerisi("A"), phoneNormalized: "+905320000001" } });
  const b = await prisma.doctor.create({ data: { ...yeniDoktorVerisi("B"), phoneNormalized: "+905320000002" } });
  const c = await prisma.doctor.create({ data: { ...yeniDoktorVerisi("C"), phoneNormalized: "+905320000003" } });
  const urun = await prisma.product.create({ data: { name: "Stent", code: "MED-1", taxRateId: ref.kdv20.id } });
  return { ...ref, yoneticiId: y.id, a, b, c, urun };
}
beforeEach(async () => {
  s = await seed();
});
const dosya = (baslik: string[], satirlar: (string | null)[][]) => ({
  ad: "a.xlsx",
  icerik: xlsxKitap([{ ad: "Veri", kolonlar: baslik.map((b) => ({ baslik: b, tip: "metin" as const })), satirlar }]),
});
const hatalar = (r: { bildirimler: { kural_kodu: string; parametreler: Record<string, string | number> }[] }) =>
  r.bildirimler.map((b) => [b.parametreler.satir ?? null, b.parametreler.kolon ?? null, b.kural_kodu]);

describe("açılış bakiyesi (A-6-1, D-6-2)", () => {
  const BASLIK = ["Cari telefonu", "Yön", "Tutar", "Vade"];

  it("satır kuralları: cari telefonla, tutar pozitif (negatif TUTAR_NEGATIF), yön katalog, vade yalnız borçta, tek açılış", async () => {
    await prisma.ledgerEntry.create({
      data: { doctorId: s.c.id, type: "ACILIS", direction: "BORC", amount: "1", documentNo: "ACL-X", createdById: s.yoneticiId },
    });
    const r = await calistirIceAktarim(
      "ACILIS_BAKIYESI",
      dosya(BASLIK, [
        ["0532 000 00 01", "BORC", "-150", null],
        ["0532 000 00 01", "ALACAK", "10", "2026-12-31"],
        ["0532 999 99 99", "BORC", "10", null],
        ["0532 000 00 03", "BORC", "10", null],
        ["0532 000 00 02", "BOR", "10,5", "2026-02-30"],
      ]),
      "onizle",
      s.yoneticiId
    );
    expect(hatalar(r)).toEqual([
      [2, "Cari telefonu", "ACILIS_KAYITLI"],
      [2, "Tutar", "TUTAR_NEGATIF"],
      [3, "Cari telefonu", "ACILIS_KAYITLI"],
      [3, "Vade", "VADE_YALNIZ_BORC"],
      [4, "Cari telefonu", "CARI_BULUNAMADI"],
      [5, "Cari telefonu", "ACILIS_KAYITLI"],
      [6, "Yön", "DEGER_KATALOG_DISI"],
      [6, "Vade", "GECERSIZ_TARIH"],
    ]);
  });

  it("önizleme özeti brüt ve taban etiketli; yazım ACL numaralı ACILIS hareketi; bakiye; parti geri alınmaz", async () => {
    const d = dosya(BASLIK, [
      ["0532 000 00 01", "BORC", "1500", "46022"], // Excel gün seri numarası → 2025-12-31
      ["0532 000 00 02", "alacak", "200,50", null],
    ]);
    const o = await calistirIceAktarim("ACILIS_BAKIYESI", d, "onizle", s.yoneticiId);
    expect(o.ozet).toEqual([
      { etiket: "Cari", deger: 2 },
      { etiket: "Toplam borç", deger: "₺1.500,00 (KDV dahil)" },
      { etiket: "Toplam alacak", deger: "₺200,50 (KDV dahil)" },
      { etiket: "Net (cariler borçlu)", deger: "₺1.299,50 (KDV dahil)" },
    ]);
    const y = await calistirIceAktarim("ACILIS_BAKIYESI", d, "yaz", s.yoneticiId);
    const hareketler = await prisma.ledgerEntry.findMany({ orderBy: { documentNo: "asc" } });
    expect(hareketler.map((h) => [h.type, h.direction, h.amount.toFixed(2), h.documentNo, h.dueDate?.toISOString().slice(0, 10) ?? null])).toEqual([
      ["ACILIS", "BORC", "1500.00", `ACL-${takvimYili()}-000001`, "2025-12-31"],
      ["ACILIS", "ALACAK", "200.50", `ACL-${takvimYili()}-000002`, null],
    ]);
    expect((await hesaplaDoktorBakiye(s.b.id)).bakiye.toFixed(2)).toBe("-200.50");
    const parti = await prisma.importBatch.findUniqueOrThrow({ where: { batchNo: y.partiNo! } });
    expect((await partiGeriAl(parti.id, s.yoneticiId, "x")).bildirimler.map((b) => b.kural_kodu)).toEqual(["PARTI_GERI_ALINMAZ_TUR"]);
    // Ters kayıtla çevrilmiş açılışın yerine yenisi yüklenebilir.
    await prisma.ledgerEntry.create({
      data: { doctorId: s.a.id, type: "TERS_KAYIT", direction: "ALACAK", amount: "1500", documentNo: hareketler[0].documentNo, reversedEntryId: hareketler[0].id, createdById: s.yoneticiId },
    });
    expect((await calistirIceAktarim("ACILIS_BAKIYESI", dosya(BASLIK, [["0532 000 00 01", "BORC", "1400", null]]), "onizle", s.yoneticiId)).durum).toBe("BASARILI");
  });
});

describe("açılış stoğu (B-4-6, D-6-2)", () => {
  const BASLIK = ["Ürün kodu", "Konum kodu", "Miktar"];

  it("ürün ve konum koduyla; boş konum varsayılan depo; tekrar, geçersiz miktar ve bilinmeyen kod reddedilir; yazım GIRIS hareketi", async () => {
    const r = await calistirIceAktarim(
      "ACILIS_STOGU",
      dosya(BASLIK, [
        ["MED-1", null, "100"],
        ["MED-1", "MERKEZ", "5"],
        ["MED-X", null, "1"],
        ["MED-1", "YOK", "0"],
      ]),
      "onizle",
      s.yoneticiId
    );
    // Boş konum varsayılan depodur: "MERKEZ" ile aynı konum — tekrar.
    expect(hatalar(r)).toEqual([
      [2, "Ürün kodu", "ACILIS_STOGU_TEKRAR"],
      [3, "Ürün kodu", "ACILIS_STOGU_TEKRAR"],
      [4, "Ürün kodu", "URUN_BULUNAMADI"],
      [5, "Konum kodu", "STOK_KONUMU_BULUNAMADI"],
      [5, "Miktar", "GECERSIZ_MIKTAR"],
    ]);

    const y = await calistirIceAktarim("ACILIS_STOGU", dosya(BASLIK, [["MED-1", null, "100"]]), "yaz", s.yoneticiId);
    expect(await hesaplaStok(s.urun.id, s.depo.id)).toBe(100);
    const h = await prisma.stockMovement.findFirstOrThrow();
    expect([h.type, h.note, h.importBatchId !== null]).toEqual(["GIRIS", "Açılış stoğu", true]);
    const parti = await prisma.importBatch.findUniqueOrThrow({ where: { batchNo: y.partiNo! } });
    expect((await partiGeriAl(parti.id, s.yoneticiId, "x")).bildirimler.map((b) => b.kural_kodu)).toEqual(["PARTI_GERI_ALINMAZ_TUR"]);

    const ikinci = await calistirIceAktarim("ACILIS_STOGU", dosya(BASLIK, [["MED-1", "merkez", "3"], ["MED-1", "MERKEZ", "4"]]), "onizle", s.yoneticiId);
    expect(hatalar(ikinci)).toEqual([
      [2, "Ürün kodu", "ACILIS_STOGU_TEKRAR"],
      [3, "Ürün kodu", "ACILIS_STOGU_TEKRAR"],
    ]);
    const bilgi = await calistirIceAktarim("ACILIS_STOGU", dosya(BASLIK, [["MED-1", "MERKEZ", "3"]]), "onizle", s.yoneticiId);
    expect(bilgi.ozet).toContainEqual({ etiket: "Stoğu zaten olan ürün × konum", deger: 1, bilgi: true });
  });
});
