/**
 * Dışa aktarım ekranının dönem kısayolları (spec Ü-29 §4, D-5-3). Günler İstanbul takvim günüdür (`YYYY-AA-GG`;
 * sayfa `yerelGunMetni(...)` verir); bitiş günü dahildir. "Bu ay" ve "Bu yıl" bugünle biter. Saf modül.
 */

export type DonemKisayolu = { etiket: "Bu ay" | "Geçen ay" | "Bu yıl" | "Geçen yıl"; baslangic: string; bitis: string };

const iki = (n: number) => String(n).padStart(2, "0");
/** Ayın son günü: bir sonraki ayın 0. günü (UTC parçalarıyla; saat dilimine bakılmaz). */
const ayinSonu = (yil: number, ay: number) => new Date(Date.UTC(yil, ay, 0)).getUTCDate();

export function donemKisayollari(bugun: string): DonemKisayolu[] {
  const yil = parseInt(bugun.slice(0, 4), 10);
  const ay = parseInt(bugun.slice(5, 7), 10);
  const [gYil, gAy] = ay === 1 ? [yil - 1, 12] : [yil, ay - 1];
  return [
    { etiket: "Bu ay", baslangic: `${yil}-${iki(ay)}-01`, bitis: bugun },
    { etiket: "Geçen ay", baslangic: `${gYil}-${iki(gAy)}-01`, bitis: `${gYil}-${iki(gAy)}-${iki(ayinSonu(gYil, gAy))}` },
    { etiket: "Bu yıl", baslangic: `${yil}-01-01`, bitis: bugun },
    { etiket: "Geçen yıl", baslangic: `${yil - 1}-01-01`, bitis: `${yil - 1}-12-31` },
  ];
}
