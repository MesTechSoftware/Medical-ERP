import { HAREKET_TURLERI, type HareketTuruKodu } from "@/lib/stok-hareket-turu";
import { aralikEtiketi, gun, ilk, secenek, type Parametreler } from "@/lib/liste/parametreler";
import { gunEkle } from "@/lib/zaman";

/**
 * Stok ekranının hareket süzgeci (spec Ü-20 §3.3); adres çubuğunda durur. Geçersiz değer yok sayılır.
 * Günler İstanbul günüdür (`YYYY-AA-GG`); aralığa çevirme `sorgu.ts`'tedir. `urun` formun önseçimidir,
 * süzgeç onu taşımaz. Saf modül.
 */

export type StokSuzgeci = {
  baslangic: string | null;
  bitis: string | null;
  tur: HareketTuruKodu | null;
  yon: "GIRIS" | "CIKIS" | null;
};

export const BOS_SUZGEC: StokSuzgeci = { baslangic: null, bitis: null, tur: null, yon: null };

type Tarih = Pick<StokSuzgeci, "baslangic" | "bitis">;

const TUR_KODLARI = HAREKET_TURLERI.map((t) => t.kod);

export function suzgecCoz(p: Parametreler): StokSuzgeci {
  let baslangic = gun(ilk(p, "baslangic"));
  let bitis = gun(ilk(p, "bitis"));
  if (baslangic !== null && bitis !== null && bitis < baslangic) [baslangic, bitis] = [bitis, baslangic];
  return {
    baslangic,
    bitis,
    tur: secenek(ilk(p, "tur"), TUR_KODLARI),
    yon: secenek(ilk(p, "yon"), ["GIRIS", "CIKIS"] as const),
  };
}

/** Süzgeci koruyan liste adresi; sayfa isteğe bağlı. */
export function stokAdresi(s: StokSuzgeci, ek: { page?: number; per?: number } = {}): string {
  const p = new URLSearchParams();
  if (s.baslangic) p.set("baslangic", s.baslangic);
  if (s.bitis) p.set("bitis", s.bitis);
  if (s.tur) p.set("tur", s.tur);
  if (s.yon) p.set("yon", s.yon);
  if (ek.page !== undefined && ek.page > 1) p.set("page", String(ek.page));
  if (ek.per !== undefined) p.set("per", String(ek.per));
  const q = p.toString();
  return q ? `/stock?${q}` : "/stock";
}

/** Takvim gününden `adet` gün önce; takvim günü UTC parçalarıyla taşınır, saat dilimine bakılmaz. */
function gunOnce(metin: string, adet: number): string {
  const [yil, ay, g] = metin.split("-").map((p) => parseInt(p, 10));
  return gunEkle(new Date(Date.UTC(yil, ay - 1, g)), -adet).toISOString().slice(0, 10);
}

/** Tarih kısayolları; `bugun` İstanbul günüdür (sayfa `yerelGunMetni(bugun())` verir). */
export function hizliSekmeler(bugun: string): { etiket: "Tümü" | "Bugün" | "Son 7 gün" | "Bu ay"; tarih: Tarih }[] {
  return [
    { etiket: "Tümü", tarih: { baslangic: null, bitis: null } },
    { etiket: "Bugün", tarih: { baslangic: bugun, bitis: bugun } },
    { etiket: "Son 7 gün", tarih: { baslangic: gunOnce(bugun, 6), bitis: bugun } },
    { etiket: "Bu ay", tarih: { baslangic: `${bugun.slice(0, 8)}01`, bitis: bugun } },
  ];
}

/** Süzgecin tarihine uyan ilk sekme; ayın 1'inde "Bugün" ile "Bu ay" aynı aralıktır, yalnız ilki etkindir. */
export function etkinSekme<E extends string>(sekmeler: readonly { etiket: E; tarih: Tarih }[], s: StokSuzgeci): E | null {
  return sekmeler.find((f) => f.tarih.baslangic === s.baslangic && f.tarih.bitis === s.bitis)?.etiket ?? null;
}

/** Sekmenin adresi: tarihleri yazar, tür ve yönü korur; sayfa düşer. */
export function sekmeAdresi(s: StokSuzgeci, tarih: Tarih): string {
  return stokAdresi({ ...s, ...tarih });
}

/** Etkin süzgeçlerin etiketleri, her biri o alanı düşüren adresle. */
export function etkinSuzgecler(s: StokSuzgeci): { anahtar: "tarih" | "tur" | "yon"; etiket: string; kaldirAdresi: string }[] {
  const liste: { anahtar: "tarih" | "tur" | "yon"; etiket: string; kaldirAdresi: string }[] = [];
  if (s.baslangic || s.bitis) {
    liste.push({
      anahtar: "tarih",
      etiket: `Tarih: ${aralikEtiketi(s.baslangic, s.bitis)}`,
      kaldirAdresi: stokAdresi({ ...s, baslangic: null, bitis: null }),
    });
  }
  if (s.tur) {
    const etiket = HAREKET_TURLERI.find((t) => t.kod === s.tur)!.etiket;
    liste.push({ anahtar: "tur", etiket: `Tür: ${etiket}`, kaldirAdresi: stokAdresi({ ...s, tur: null }) });
  }
  if (s.yon) {
    liste.push({ anahtar: "yon", etiket: `Yön: ${s.yon === "GIRIS" ? "Giriş" : "Çıkış"}`, kaldirAdresi: stokAdresi({ ...s, yon: null }) });
  }
  return liste;
}

/** Sonuç boşken gösterilecek açıklamanın türü (spec §3.6). */
export function bosDurum(s: StokSuzgeci): "hic-kayit" | "suzgecli" {
  return s.baslangic || s.bitis || s.tur || s.yon ? "suzgecli" : "hic-kayit";
}
