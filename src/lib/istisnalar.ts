import type { Role } from "@/generated/prisma/enums";
import { EKSIK_FATURA_BILGISI } from "@/lib/cari";
import { prisma } from "@/lib/db";
import { SAHIPSIZ_DOKTOR } from "@/lib/sahiplik";
import { stokDurumu } from "@/lib/stok-durumu";
import { onayKosulu } from "@/lib/onay-listesi/sorgu";
import { BOS_SUZGEC, ESKI_ONAY_SAATI, onayAdresi } from "@/lib/onay-listesi/suzgec";

/** Karar bekleyen onay bloğunun istisna sayıldığı yaş, saat (brief §3.1). */
export { ESKI_ONAY_SAATI } from "@/lib/onay-listesi/suzgec";

export type IstisnaKodu = "tukenen" | "kritik" | "eskiOnay" | "faturaEksik" | "sahipsiz";

export type Istisna = {
  kod: IstisnaKodu;
  ton: "hata" | "uyari";
  adet: number;
  /** Sayısız açıklama ("ürün kritik stokta"); sayıyı gösteren bileşen `adet`'ten yazar. */
  metin: string;
  href: string;
  eylem: string;
};

/**
 * Dashboard istisnaları (brief §3.1, §4.3): rolün görebildiği, adedi sıfırdan büyük istisnalar,
 * önem sırasıyla (hata → uyarı). Bant ve "Dikkat gerektirenler" bu tek listeyi okur. Kaynaklar
 * mevcut tanımlardır: stok `stokDurumu()`; doktor süzgeçleri `EKSIK_FATURA_BILGISI` ve
 * `SAHIPSIZ_DOKTOR` — sayı, bağlantı verdiği listeninkiyle aynıdır; onay bekleyen blok
 * `decision: null`. Onay ekranı yöneticinindir: OPERASYON onay istisnasını görmez. Kişi adı yoktur.
 */
export async function istisnalar(rol: Role, stoklar: readonly { stok: number }[], an: Date): Promise<Istisna[]> {
  const [eskiOnay, faturaEksik, sahipsiz] = await Promise.all([
    // Onay ekranının `eski` süzgeciyle aynı koşul (tek `where` üreticisi, A-8-11).
    rol === "YONETICI" ? prisma.approvalBlock.count({ where: onayKosulu({ ...BOS_SUZGEC, eski: true }, an) }) : 0,
    prisma.doctor.count({ where: EKSIK_FATURA_BILGISI }),
    prisma.doctor.count({ where: SAHIPSIZ_DOKTOR }),
  ]);
  const tukenen = stoklar.filter((s) => stokDurumu(s.stok)?.ton === "hata").length;
  const kritik = stoklar.filter((s) => stokDurumu(s.stok)?.ton === "uyari").length;
  const liste: Istisna[] = [
    { kod: "tukenen", ton: "hata", adet: tukenen, metin: "ürün tükendi", href: "/stock", eylem: "Stok girişi" },
    { kod: "kritik", ton: "uyari", adet: kritik, metin: "ürün kritik stokta", href: "/stock", eylem: "Stok girişi" },
    {
      kod: "eskiOnay",
      ton: "uyari",
      adet: eskiOnay,
      metin: `onay ${ESKI_ONAY_SAATI} saatten uzun süredir bekliyor`,
      // Onay ekranının "24 saatten eski" süzgeci: aynı koşul, sayı = satır (A-8-11).
      href: onayAdresi({ ...BOS_SUZGEC, eski: true }),
      eylem: "Onaylara git",
    },
    {
      kod: "faturaEksik",
      ton: "uyari",
      adet: faturaEksik,
      metin: "carinin fatura bilgisi eksik",
      href: "/doctors?fatura=eksik",
      eylem: "Listeyi aç",
    },
    {
      kod: "sahipsiz",
      ton: "uyari",
      adet: sahipsiz,
      metin: "doktorun satıcısı yok",
      href: "/doctors?sahip=yok",
      eylem: "Listeyi aç",
    },
  ];
  return liste.filter((i) => i.adet > 0);
}
