import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { xlsxKitap } from "@/lib/disa-aktarim-yazici";
import { calistirIceAktarim, partiGeriAl, sablonUret } from "@/lib/ice-aktarim";
import { CARI_TANIMI } from "@/lib/ice-aktarim/cari";
import { xlsxIlkSayfa } from "@/lib/xlsx-okuyucu";
import { referansVeri, yeniDoktorVerisi } from "../../../test/integration/referans";

// X-16-1 · D-6-1 — CARI içe aktarımı: elle girişin toplu hâli, dosya düzeyi sert kısıt, kısmi yazma yok,
// önizleme özeti, parti ve geri alma.

let s: Awaited<ReturnType<typeof seed>>;
async function seed() {
  const ref = await referansVeri();
  const y = await prisma.user.create({ data: { name: "Y", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" } });
  const satici = await prisma.user.create({ data: { name: "Ahmet", email: "ahmet@medikal.local", passwordHash: "x", role: "SATICI" } });
  await prisma.priceList.create({ data: { code: "BAYI", name: "Bayi" } });
  return { ...ref, yoneticiId: y.id, satici };
}
beforeEach(async () => {
  s = await seed();
});

const BASLIK = ["Hesap sınıfı", "Ad Soyad / Ünvan", "Klinik", "Bölge", "Telefon", "Sorumlu satıcı e-postası", "Fiyat listesi kodu"];
const dosya = (satirlar: (string | null)[][], baslik = BASLIK, ad = "cari.xlsx") => ({
  ad,
  icerik: xlsxKitap([{ ad: "Veri", kolonlar: baslik.map((b) => ({ baslik: b, tip: "metin" as const })), satirlar }]),
});
const calistir = (d: ReturnType<typeof dosya>, asama: "onizle" | "yaz" = "onizle") => calistirIceAktarim("CARI", d, asama, s.yoneticiId);
const hatalar = (r: Awaited<ReturnType<typeof calistir>>) => r.bildirimler.map((b) => [b.parametreler.satir ?? null, b.parametreler.kolon ?? null, b.kural_kodu]);

describe("şablon (ADR-006 §3)", () => {
  it("başlık satırı tanımdan, açılır listeler kapalı kataloglarda, Açıklama sayfası ikinci sayfada", () => {
    const b = sablonUret("CARI");
    expect(xlsxIlkSayfa(b)).toEqual([{ no: 1, hucreler: CARI_TANIMI.kolonlar.map((k) => k.baslik) }]);
    const xml = b.toString("utf8"); // sıkıştırmasız zip: parçalar düz metin
    expect(xml).toContain('"DOKTOR,BAYI"');
    expect(xml).toContain('"TUZEL_KISI,GERCEK_KISI"');
    expect(xml).toContain('<sheet name="Açıklama" sheetId="2"');
  });
});

describe("dosya düzeyi sert kısıt (X-16 §(3), E-3 §(3))", () => {
  it("xlsx olmayan, eksik zorunlu kolonlu, tanınmayan kolonlu ya da boş dosya bütünüyle reddedilir", async () => {
    expect(hatalar(await calistir({ ad: "cari.csv", icerik: Buffer.from("a;b") }))).toEqual([[null, null, "ICE_AKTARIM_DOSYA_GECERSIZ"]]);
    expect(hatalar(await calistir({ ad: "cari.xlsx", icerik: Buffer.from("PK bozuk") }))).toEqual([[null, null, "ICE_AKTARIM_DOSYA_GECERSIZ"]]);
    const eksik = await calistir(dosya([["DOKTOR"]], ["Hesap sınıfı", "Ad Soyad / Ünvan", "Klinik", "Bölge", "Fax"]));
    expect(eksik.bildirimler.map((b) => [b.kural_kodu, b.parametreler.kolon])).toEqual([
      ["ICE_AKTARIM_KOLON_EKSIK", "Telefon"],
      ["ICE_AKTARIM_KOLON_TANINMIYOR", "Fax"],
    ]);
    expect(hatalar(await calistir(dosya([])))).toEqual([[null, null, "ICE_AKTARIM_BOS"]]);
    // Başlıkta büyük/küçük harf ve boşluk tolere edilir (ADR-006 §4).
    const tolere = await calistir(dosya([["DOKTOR", "Dr. A", "K", "B", "05320000001", null, null]], BASLIK.map((b) => ` ${b.toLocaleUpperCase("tr-TR")} `)));
    expect(tolere.durum).toBe("BASARILI");
  });
});

describe("satır doğrulaması = elle giriş (X-16 §(1)), kısmi yazma yok (§(4))", () => {
  it("satır hataları satır ve kolonla döner; dosya içi aynı telefon bütün satırları reddeder; kayıtlı telefon yalnız o satırı", async () => {
    await prisma.doctor.create({ data: { ...yeniDoktorVerisi("Eski"), phoneNormalized: "+905329999999" } });
    const d = dosya([
      ["DOKTOR", "Dr. Ayşe", "Klinik", "Kadıköy", "0532 111 22 33", "ahmet@medikal.local", null], // 2 geçerli
      ["Bayi", "Bayi A.Ş.", null, null, "0216 111 22 33", null, null], // 3 geçerli (küçük harf katalog)
      ["BAYI", "Bayi B", null, null, "0216 222 33 44", "ahmet@medikal.local", null], // 4 BAYI sahip
      [null, "Dr. X", "K", "B", "0532 000 00 01", null, null], // 5 sınıf yok
      ["DOKTOR", "Dr. Y", "K", "B", "0532 000 00 02", null, "YOK"], // 6 liste yok
      ["DOKTOR", "Dr. Z1", "K", "B", "0533 000 00 03", null, null], // 7 dosya içi çakışma
      ["DOKTOR", "Dr. Z2", "K", "B", "05330000003", null, null], // 8 dosya içi çakışma
      ["DOKTOR", "Dr. Eski", "K", "B", "0532 999 99 99", null, null], // 9 kayıtlı
      ["UZMAN", "Dr. Q", "K", "B", "0532 000 00 04", "kimse@x.com", null], // 10 katalog dışı + satıcı yok
    ]);
    const r = await calistir(d);
    expect(hatalar(r)).toEqual([
      [4, "Sorumlu satıcı e-postası", "BAYI_SAHIP_ATANAMAZ"],
      [5, "Hesap sınıfı", "ALAN_ZORUNLU"],
      [6, "Fiyat listesi kodu", "FIYAT_LISTESI_BULUNAMADI"],
      [7, "Telefon", "TELEFON_KAYITLI"],
      [8, "Telefon", "TELEFON_KAYITLI"],
      [9, "Telefon", "TELEFON_KAYITLI"],
      [10, "Hesap sınıfı", "DEGER_KATALOG_DISI"],
      [10, "Sorumlu satıcı e-postası", "SAHIP_AKTIF_SATICI_DEGIL"],
    ]);
    expect(r.acilacak).toBe(2);
    expect(r.kodAdetleri).toContainEqual({ kod: "TELEFON_KAYITLI", adet: 3 });

    // "Yaz" de aynı denetimden geçer; tek hatalı satır varken hiçbir şey yazılmaz.
    const y = await calistir(d, "yaz");
    expect(y.bildirimler[0]).toMatchObject({ kural_kodu: "ICE_AKTARIM_SATIR_HATALI", parametreler: { adet: 7 } });
    expect([await prisma.doctor.count(), await prisma.importBatch.count()]).toEqual([1, 0]);
  });

  it("hatasız dosya: önizleme özeti, yazım parti numarasıyla; sahiplik tek noktadan, gerekçesi partidir", async () => {
    const d = dosya([
      ["DOKTOR", "Dr. Ayşe", "Klinik", "Kadıköy", "0532 111 22 33", "AHMET@medikal.local", null],
      ["DOKTOR", "Dr. Can", "Klinik", "Üsküdar", "0532 111 22 34", null, null],
      ["BAYI", "Bayi A.Ş.", null, null, "0216 111 22 33", null, null],
      ["BAYI", "Bayi B", null, null, "0216 111 22 34", null, "bayi"],
    ]);
    const o = await calistir(d);
    expect(o.ozet).toEqual([
      { etiket: "Doktor", deger: 2 },
      { etiket: "Bayi", deger: 2 },
      { etiket: "Satıcı: Ahmet", deger: 1 },
      { etiket: "Sahipsiz doktor", deger: 1 },
      { etiket: "Fiyat listesi boş bayi", deger: 1, bilgi: true },
    ]);
    expect(await prisma.doctor.count()).toBe(0);

    const y = await calistir(d, "yaz");
    expect(y.partiNo).toMatch(/^CARI-\d{8}-[A-Z0-9]{5}$/);
    const parti = await prisma.importBatch.findUniqueOrThrow({ where: { batchNo: y.partiNo! } });
    expect([parti.dataType, parti.fileName, parti.userId]).toEqual(["CARI", "cari.xlsx", s.yoneticiId]);
    expect(await prisma.doctor.count({ where: { importBatchId: parti.id } })).toBe(4);
    const iz = await prisma.doctorAssignment.findFirstOrThrow();
    expect([iz.toSellerId, iz.reason]).toEqual([s.satici.id, `İçe aktarım ${y.partiNo}`]);
    expect(await prisma.auditLog.count({ where: { action: "IMPORT_CREATE" } })).toBe(1);
  });
});

describe("kredi limiti (A-12-7)", () => {
  it("0 kabul edilir ve yazılır; negatif limit satır hatasıdır", async () => {
    const baslik = [...BASLIK, "Kredi limiti"];
    const iyi = dosya([["DOKTOR", "Dr. Pesin", "K", "B", "0532 111 22 33", null, null, "0"]], baslik);
    expect((await calistir(iyi, "yaz")).durum).toBe("BASARILI");
    expect((await prisma.doctor.findFirstOrThrow({ where: { fullName: "Dr. Pesin" } })).creditLimit?.toFixed(2)).toBe("0.00");
    const kotu = await calistir(dosya([["DOKTOR", "Dr. Eksi", "K", "B", "0532 111 22 34", null, null, "-5"]], baslik));
    expect(hatalar(kotu)).toEqual([[2, "Kredi limiti", "GECERSIZ_TUTAR"]]);
  });
});

describe("parti geri alma (X-12 §(3), X-16 §(10))", () => {
  it("belgeye bağlı cari varsa hiçbir kayıt silinmez; yoksa parti bütünüyle geri alınır; ikinci kez alınmaz", async () => {
    const d = dosya([
      ["DOKTOR", "Dr. Ayşe", "Klinik", "Kadıköy", "0532 111 22 33", "ahmet@medikal.local", null],
      ["BAYI", "Bayi A.Ş.", null, null, "0216 111 22 33", null, null],
    ]);
    const { partiNo } = await calistir(d, "yaz");
    const parti = await prisma.importBatch.findUniqueOrThrow({ where: { batchNo: partiNo! } });
    const bayi = await prisma.doctor.findFirstOrThrow({ where: { accountClass: "BAYI" } });
    const siparis = await prisma.order.create({
      data: { documentNo: "SIP-G", doctorId: bayi.id, stage: "ONAYLI", status: "BEKLIYOR", paymentTermDays: 30 },
    });

    expect((await partiGeriAl(parti.id, s.yoneticiId, "Yanlış dosya")).bildirimler.map((b) => b.kural_kodu)).toEqual(["PARTI_GERI_ALINAMAZ"]);
    expect(await prisma.doctor.count()).toBe(2);
    expect((await prisma.importBatch.findUniqueOrThrow({ where: { id: parti.id } })).revertedAt).toBeNull();

    await prisma.order.delete({ where: { id: siparis.id } });
    expect((await partiGeriAl(parti.id, s.yoneticiId, "Yanlış dosya")).durum).toBe("BASARILI");
    expect([await prisma.doctor.count(), await prisma.doctorAssignment.count()]).toEqual([0, 0]);
    const geri = await prisma.importBatch.findUniqueOrThrow({ where: { id: parti.id } });
    expect([geri.revertedById, geri.revertReason]).toEqual([s.yoneticiId, "Yanlış dosya"]);
    expect((await partiGeriAl(parti.id, s.yoneticiId, "x")).bildirimler.map((b) => b.kural_kodu)).toEqual(["PARTI_ZATEN_GERI_ALINDI"]);
  });
});
