import { cariAcmaDenetle, cariAcmaYaz, type DenetlenmisCari } from "@/lib/cari";
import { tryNormalizePhone } from "@/lib/phone";
import { sert, type Bildirim } from "@/lib/sonuc";
import { BRUT, TABAN_ETIKETI } from "@/lib/taban";
import { satirBildirimi, type IceAktarimTanimi, type Kolon } from "./tanim";

/**
 * `CARI` içe aktarımı — `YONETICI` cari açma akışının toplu hâli (X-16 §(1)/(5)/(6)). Satır denetimi
 * `cariAcmaDenetle()`'dir; burada yalnız çözümleyiciler (satıcı e-postası → id, liste kodu → id),
 * dosya içi telefon tekilliği (küme kuralı) ve özet vardır.
 */
const KOLONLAR: readonly Kolon[] = [
  { baslik: "Hesap sınıfı", alan: "accountClass", zorunlu: true, izinli: ["DOKTOR", "BAYI"], aciklama: "Doktor ya da bayi. Boş bırakılamaz; varsayılanı yoktur.", ornek: "DOKTOR", kaynak: "X-8 §(1)/(6)" },
  { baslik: "Ad Soyad / Ünvan", alan: "fullName", zorunlu: true, aciklama: "Doktorun adı soyadı ya da bayinin ünvanı.", ornek: "Ayşe Yılmaz", kaynak: "FR-01" },
  { baslik: "Unvan", alan: "title", zorunlu: false, aciklama: "Prof. Dr., Op. Dr. …", ornek: "Op. Dr.", kaynak: "FR-01" },
  { baslik: "Branş", alan: "specialty", zorunlu: false, aciklama: "", ornek: "Kardiyoloji", kaynak: "FR-01" },
  { baslik: "Klinik", alan: "clinic", zorunlu: true, aciklama: "Doktorda zorunlu, bayide boş kalabilir.", ornek: "Merkez Klinik", kaynak: "X-15 §(3)" },
  { baslik: "Bölge", alan: "region", zorunlu: true, aciklama: "Doktorda zorunlu, bayide boş kalabilir.", ornek: "Kadıköy", kaynak: "X-15 §(3)" },
  { baslik: "Şehir", alan: "city", zorunlu: false, aciklama: "", ornek: "İstanbul", kaynak: "FR-01" },
  { baslik: "Telefon", alan: "phone", zorunlu: true, aciklama: "Doktorda kişisel cep telefonu; bayide firma numarası. Benzersizdir.", ornek: "0532 111 22 33", kaynak: "X-15 §(2)/(5)" },
  { baslik: "E-posta", alan: "email", zorunlu: false, aciklama: "", ornek: "ayse@ornek.com", kaynak: "A-13 §(4)" },
  { baslik: "Sorumlu satıcı e-postası", alan: "ownerSellerId", zorunlu: false, aciklama: "Aktif bir satıcının kullanıcı e-postası. Doktorda boş bırakılabilir (sahipsiz açılır); bayide boş olmalı.", ornek: "ahmet@medikal.local", kaynak: "X-17 §(7), X-16 §(5)" },
  { baslik: "Fiyat listesi kodu", alan: "priceListId", zorunlu: false, aciklama: "Boşsa varsayılan liste.", ornek: "BAYI", kaynak: "X-10 §(2), X-16 §(5)" },
  { baslik: "Ödeme vadesi (gün)", alan: "paymentTermDays", zorunlu: false, aciklama: "Boşsa varsayılan vade.", ornek: "30", kaynak: "A-7" },
  { baslik: "Kredi limiti", alan: "creditLimit", zorunlu: false, aciklama: `${TABAN_ETIKETI[BRUT]}; boşsa limitsiz.`, ornek: "50000", kaynak: "A-12" },
  { baslik: "Cari tipi", alan: "partyType", zorunlu: false, izinli: ["TUZEL_KISI", "GERCEK_KISI"], aciklama: "Boşsa tüzel kişi.", ornek: "TUZEL_KISI", kaynak: "A-13 §(2)" },
  { baslik: "VKN / TCKN", alan: "taxId", zorunlu: false, aciklama: "10 hane VKN ya da 11 hane TCKN; kontrol hanesi doğrulanır.", ornek: "1234567890", kaynak: "A-13 §(1)/(3)" },
  { baslik: "Fatura ünvanı", alan: "invoiceTitle", zorunlu: false, aciklama: "Boşsa ad soyad kullanılır.", ornek: "", kaynak: "A-13 §(4)" },
  { baslik: "Vergi dairesi", alan: "taxOffice", zorunlu: false, aciklama: "", ornek: "Kadıköy", kaynak: "A-13 §(4)" },
  { baslik: "Fatura adresi", alan: "invoiceAddress", zorunlu: false, aciklama: "", ornek: "", kaynak: "A-13 §(4)" },
  { baslik: "Fatura ilçe", alan: "invoiceDistrict", zorunlu: false, aciklama: "", ornek: "", kaynak: "A-13 §(4)" },
  { baslik: "Fatura il", alan: "invoiceCity", zorunlu: false, aciklama: "", ornek: "", kaynak: "A-13 §(4)" },
  { baslik: "Muhasebe kodu", alan: "accountingCode", zorunlu: false, aciklama: "Salt kayıt.", ornek: "120.01.001", kaynak: "C-2" },
];

export const CARI_TANIMI: IceAktarimTanimi<DenetlenmisCari> = {
  tur: "CARI",
  tablo: "Doctor",
  kolonlar: KOLONLAR,
  sistemDoldurur: ["id", "phoneNormalized"],
  kumeKurallari: [
    { anahtar: "normalize telefon", kapsam: "veritabani+parti", kuralKodu: "TELEFON_KAYITLI", kisit: "Doctor_phoneNormalized_key" },
  ],
  // Bayinin sahipsizliği satır kuralıdır (BAYI_SAHIP_ATANAMAZ); import fiyat listesi/konum bağı açmaz.
  importtanErisilemez: ["Doctor_bayi_sahipsiz_check"],

  async denetle(db, satirlar) {
    const hatalar: Bildirim[] = [];
    const yazilacak: DenetlenmisCari[] = [];
    const [saticilar, listeler] = await Promise.all([
      db.user.findMany({ select: { id: true, email: true, name: true } }),
      db.priceList.findMany({ select: { id: true, code: true } }),
    ]);
    const saticiId = new Map(saticilar.map((s) => [s.email.toLocaleLowerCase("tr-TR"), s.id]));
    const saticiAdi = new Map(saticilar.map((s) => [s.id, s.name]));
    const listeId = new Map(listeler.map((l) => [l.code.toUpperCase(), l.id]));

    // Küme kuralı (X-16 §(1)): dosya içi çakışmada çakışan satırların hepsi reddedilir.
    const telefonSatirlari = new Map<string, number[]>();
    for (const s of satirlar) {
      const t = tryNormalizePhone(s.deger.phone ?? "");
      if (t) telefonSatirlari.set(t, [...(telefonSatirlari.get(t) ?? []), s.no]);
    }

    const sahipSayisi = new Map<string, number>();
    let sahipsiz = 0;
    let listesizBayi = 0;
    for (const s of satirlar) {
      const d = s.deger;
      const satirHatalari: Bildirim[] = [];
      // Katalog kodları ASCII'dir; tr-TR büyütme "Bayi"yi "BAYİ" yapardı.
      const sinif = d.accountClass?.trim().toUpperCase();
      if (sinif && sinif !== "DOKTOR" && sinif !== "BAYI") satirHatalari.push(sert("DEGER_KATALOG_DISI", { deger: d.accountClass! }, "accountClass"));
      const tip = d.partyType?.trim().toUpperCase();
      if (tip && tip !== "TUZEL_KISI" && tip !== "GERCEK_KISI") satirHatalari.push(sert("DEGER_KATALOG_DISI", { deger: d.partyType! }, "partyType"));
      const eposta = d.ownerSellerId?.trim().toLocaleLowerCase("tr-TR");
      const sahip = eposta ? saticiId.get(eposta) : undefined;
      if (eposta && !sahip) satirHatalari.push(sert("SAHIP_AKTIF_SATICI_DEGIL", {}, "ownerSellerId"));
      const kod = d.priceListId?.trim().toUpperCase();
      const liste = kod ? listeId.get(kod) : undefined;
      if (kod && !liste) satirHatalari.push(sert("FIYAT_LISTESI_BULUNAMADI", {}, "priceListId"));
      const t = tryNormalizePhone(d.phone ?? "");
      const ayni = t ? (telefonSatirlari.get(t) ?? []) : [];
      if (ayni.length > 1) satirHatalari.push(sert("TELEFON_KAYITLI", { telefon: d.phone ?? "", portfoyunuzde: 0, satirlar: ayni.join(", ") }, "phone"));

      const { hatalar: kural, cari } = await cariAcmaDenetle(db, {
        accountClass: sinif === "DOKTOR" || sinif === "BAYI" ? sinif : undefined,
        sorumluSaticiId: sahip ?? null,
        fullName: d.fullName ?? "",
        title: d.title,
        specialty: d.specialty,
        clinic: d.clinic,
        region: d.region,
        city: d.city,
        email: d.email,
        phone: d.phone ?? "",
        priceListId: liste ?? null,
        paymentTermDays: d.paymentTermDays,
        creditLimit: d.creditLimit,
        partyType: tip === "GERCEK_KISI" ? "GERCEK_KISI" : "TUZEL_KISI",
        taxId: d.taxId,
        invoiceTitle: d.invoiceTitle,
        taxOffice: d.taxOffice,
        invoiceAddress: d.invoiceAddress,
        invoiceDistrict: d.invoiceDistrict,
        invoiceCity: d.invoiceCity,
        accountingCode: d.accountingCode,
      });
      // Çözümleyici zaten bildirdiyse aynı alanın tekrarı atılır (sınıf boş görünür, liste boş görünür).
      const alanlar = new Set(satirHatalari.map((b) => b.alan));
      const tum = [...satirHatalari, ...kural.filter((b) => !alanlar.has(b.alan))];
      hatalar.push(...tum.map((b) => satirBildirimi(b, s.no, KOLONLAR)));
      if (tum.length === 0 && cari) {
        yazilacak.push(cari);
        if (cari.sinif === "DOKTOR") {
          if (cari.sorumluSaticiId) {
            const ad = saticiAdi.get(cari.sorumluSaticiId) ?? cari.sorumluSaticiId;
            sahipSayisi.set(ad, (sahipSayisi.get(ad) ?? 0) + 1);
          } else sahipsiz++;
        } else if (!cari.veri.priceListId) listesizBayi++;
      }
    }

    // X-16 §(7): CARI özeti.
    const ozet = [
      { etiket: "Doktor", deger: yazilacak.filter((c) => c.sinif === "DOKTOR").length },
      { etiket: "Bayi", deger: yazilacak.filter((c) => c.sinif === "BAYI").length },
      ...[...sahipSayisi].sort().map(([ad, n]) => ({ etiket: `Satıcı: ${ad}`, deger: n })),
      { etiket: "Sahipsiz doktor", deger: sahipsiz },
      { etiket: "Fiyat listesi boş bayi", deger: listesizBayi, bilgi: listesizBayi > 0 },
    ];
    return { hatalar, yazilacak, ozet };
  },

  async yaz(tx, yazilacak, parti) {
    for (const c of yazilacak) {
      await cariAcmaYaz(tx, c, { id: parti.yapanId, gerekce: `İçe aktarım ${parti.no}`, partiId: parti.id });
    }
  },

  /** C-3 §(6), X-16 §(10): partinin hiçbir carisi belgeye bağlı değilse hepsi silinir; kısmi yok. */
  async geriAl(tx, partiId) {
    const bagli = await tx.doctor.count({
      where: {
        importBatchId: partiId,
        OR: [
          { orders: { some: {} } },
          { payments: { some: {} } },
          { ledger: { some: {} } },
          { returns: { some: {} } },
          { consignments: { some: {} } },
          { konsinyeKonumu: { isNot: null } },
        ],
      },
    });
    if (bagli > 0) return "PARTI_GERI_ALINAMAZ";
    const idler = (await tx.doctor.findMany({ where: { importBatchId: partiId }, select: { id: true } })).map((d) => d.id);
    await tx.doctorAssignment.deleteMany({ where: { doctorId: { in: idler } } });
    await tx.doctor.deleteMany({ where: { id: { in: idler } } });
    return null;
  },
};
