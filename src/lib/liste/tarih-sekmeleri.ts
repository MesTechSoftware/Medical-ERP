import { gunEkle } from "@/lib/zaman";

/**
 * Liste ekranlarının tarih kısayolları (stok hareketleri, sevkiyatlar). Günler İstanbul günüdür
 * (`YYYY-AA-GG`); sayfa `yerelGunMetni(...)` verir. Saf modül.
 */

export type TarihAraligi = { baslangic: string | null; bitis: string | null };
export type TarihSekmesi = "Tümü" | "Bugün" | "Son 7 gün" | "Bu ay";

/** Takvim gününden `adet` gün önce; takvim günü UTC parçalarıyla taşınır, saat dilimine bakılmaz. */
export function gunOnce(metin: string, adet: number): string {
  const [yil, ay, g] = metin.split("-").map((p) => parseInt(p, 10));
  return gunEkle(new Date(Date.UTC(yil, ay - 1, g)), -adet).toISOString().slice(0, 10);
}

export function tarihSekmeleri(bugun: string): { etiket: TarihSekmesi; tarih: TarihAraligi }[] {
  return [
    { etiket: "Tümü", tarih: { baslangic: null, bitis: null } },
    { etiket: "Bugün", tarih: { baslangic: bugun, bitis: bugun } },
    { etiket: "Son 7 gün", tarih: { baslangic: gunOnce(bugun, 6), bitis: bugun } },
    { etiket: "Bu ay", tarih: { baslangic: `${bugun.slice(0, 8)}01`, bitis: bugun } },
  ];
}

/** Süzgecin tarihine uyan ilk sekme; ayın 1'inde "Bugün" ile "Bu ay" aynı aralıktır, yalnız ilki etkindir. */
export function etkinTarihSekmesi<E extends string>(sekmeler: readonly { etiket: E; tarih: TarihAraligi }[], s: TarihAraligi): E | null {
  return sekmeler.find((f) => f.tarih.baslangic === s.baslangic && f.tarih.bitis === s.bitis)?.etiket ?? null;
}
