import type Decimal from "decimal.js";
import { acilisHareketiYaz } from "@/lib/cari-hareket";
import { formatla } from "@/lib/money";
import { tryNormalizePhone } from "@/lib/phone";
import { acilisToplamlari } from "@/lib/satir-tutarlari";
import { sert, type Bildirim } from "@/lib/sonuc";
import { BRUT, TABAN_ETIKETI } from "@/lib/taban";
import { amountSchema } from "@/lib/validation";
import { satirBildirimi, type IceAktarimTanimi, type Kolon } from "./tanim";
import { gunHucresi } from "./gun";

/**
 * `ACILIS_BAKIYESI` — elle giriş yolu olmayan tür: doğrulama tanımın kendisidir (X-16 §(1)). Carinin
 * tek açılış hareketi (A-6) `ACL` numarasıyla yazılır. Tutar pozitiftir, yön ayrı kolondur; negatif
 * tutar `TUTAR_NEGATIF` (D-6 eki 24.09.2026) — işaret yöne çevrilmez. Vade nullable, yalnız borçta.
 * Parti geri alınmaz; hata ters kayıtla düzeltilir (X-16 §(10)).
 */
type Acilis = { doctorId: string; tutar: Decimal; yon: "BORC" | "ALACAK"; vade: Date | null };

const KOLONLAR: readonly Kolon[] = [
  { baslik: "Cari telefonu", alan: "doctorId", zorunlu: true, aciklama: "Carinin kayıtlı telefonu; cari bununla bulunur.", ornek: "0532 111 22 33", kaynak: "X-15 §(2)" },
  { baslik: "Yön", alan: "direction", zorunlu: true, izinli: ["BORC", "ALACAK"], aciklama: "BORC: cari bize borçlu. ALACAK: cari alacaklı (avans).", ornek: "BORC", kaynak: "X-11 §(3), D-6 eki" },
  { baslik: "Tutar", alan: "amount", zorunlu: true, aciklama: `${TABAN_ETIKETI[BRUT]}; pozitif, en fazla 2 ondalık. İşaret yazılmaz.`, ornek: "1500.00", kaynak: "A-6, D-6 eki" },
  { baslik: "Vade", alan: "dueDate", zorunlu: false, aciklama: "YYYY-AA-GG; yalnız borçta, boş bırakılabilir.", ornek: "2026-12-31", kaynak: "A-7" },
];

export const ACILIS_BAKIYESI_TANIMI: IceAktarimTanimi<Acilis> = {
  tur: "ACILIS_BAKIYESI",
  tablo: "LedgerEntry",
  kolonlar: KOLONLAR,
  sistemDoldurur: ["id", "type", "documentNo", "createdById", "updatedAt"],
  kumeKurallari: [],
  // Ters kayıt bağı içe aktarımla yazılmaz.
  importtanErisilemez: ["LedgerEntry_reversedEntryId_key"],

  async denetle(db, satirlar) {
    const telefonlar = satirlar.flatMap((s) => {
      const t = tryNormalizePhone(s.deger.doctorId ?? "");
      return t ? [t] : [];
    });
    const cariler = await db.doctor.findMany({
      where: { phoneNormalized: { in: telefonlar } },
      select: { id: true, phoneNormalized: true, ledger: { where: { type: "ACILIS", reversal: null }, select: { id: true } } },
    });
    const cari = new Map(cariler.map((c) => [c.phoneNormalized, c]));
    const cariSatirlari = new Map<string, number[]>();
    for (const s of satirlar) {
      const c = cari.get(tryNormalizePhone(s.deger.doctorId ?? "") ?? "");
      if (c) cariSatirlari.set(c.id, [...(cariSatirlari.get(c.id) ?? []), s.no]);
    }

    const hatalar: Bildirim[] = [];
    const yazilacak: Acilis[] = [];
    for (const s of satirlar) {
      const d = s.deger;
      const b: Bildirim[] = [];
      const telefon = tryNormalizePhone(d.doctorId ?? "");
      const c = telefon ? cari.get(telefon) : undefined;
      if (!d.doctorId) b.push(sert("ALAN_ZORUNLU", {}, "doctorId"));
      else if (!c) b.push(sert("CARI_BULUNAMADI", {}, "doctorId"));
      else if (c.ledger.length > 0) b.push(sert("ACILIS_KAYITLI", {}, "doctorId"));
      else if ((cariSatirlari.get(c.id) ?? []).length > 1) b.push(sert("ACILIS_KAYITLI", { satirlar: cariSatirlari.get(c.id)!.join(", ") }, "doctorId"));

      const yon = d.direction?.trim().toUpperCase();
      if (!yon) b.push(sert("ALAN_ZORUNLU", {}, "direction"));
      else if (yon !== "BORC" && yon !== "ALACAK") b.push(sert("DEGER_KATALOG_DISI", { deger: d.direction! }, "direction"));

      const ham = (d.amount ?? "").trim();
      const tutar = amountSchema.safeParse(ham);
      if (!ham) b.push(sert("ALAN_ZORUNLU", {}, "amount"));
      else if (ham.startsWith("-")) b.push(sert("TUTAR_NEGATIF", {}, "amount"));
      else if (!tutar.success) b.push(sert("GECERSIZ_TUTAR", {}, "amount"));

      const vade = d.dueDate ? gunHucresi(d.dueDate) : null;
      if (d.dueDate && !vade) b.push(sert("GECERSIZ_TARIH", {}, "dueDate"));
      else if (vade && yon === "ALACAK") b.push(sert("VADE_YALNIZ_BORC", {}, "dueDate"));

      hatalar.push(...b.map((x) => satirBildirimi(x, s.no, KOLONLAR)));
      if (b.length === 0 && c && tutar.success && (yon === "BORC" || yon === "ALACAK")) {
        yazilacak.push({ doctorId: c.id, tutar: tutar.data, yon, vade });
      }
    }

    // D-6 eki (24.09.2026): cari adedi · toplam borç · toplam alacak · net — brüt, taban etiketiyle.
    const t = acilisToplamlari(yazilacak);
    const para = (x: Decimal) => `${formatla(x)} (${TABAN_ETIKETI[BRUT]})`;
    const ozet = [
      { etiket: "Cari", deger: yazilacak.length },
      { etiket: "Toplam borç", deger: para(t.borc) },
      { etiket: "Toplam alacak", deger: para(t.alacak) },
      { etiket: t.netYon === "ALACAK" ? "Net (cariler alacaklı)" : t.netYon === "BORC" ? "Net (cariler borçlu)" : "Net (kapalı)", deger: para(t.net) },
    ];
    return { hatalar, yazilacak, ozet };
  },

  async yaz(tx, yazilacak, parti) {
    for (const a of yazilacak) {
      await acilisHareketiYaz(tx, { ...a, yapanId: parti.yapanId, partiId: parti.id });
    }
  },
};
