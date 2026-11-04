import type { AuditActionType, AuditModule } from "@/generated/prisma/enums";
import { AUDIT_ACTION_LABELS, ISLEM_SINIFI, ISLEM_TURU_ETIKETI, MODUL_ETIKETI, type AuditAction } from "@/lib/denetim/olaylar";
import { aralikEtiketi, gun, ilk, kimlik, secenek, type Parametreler } from "@/lib/liste/parametreler";
import { gunOnce } from "@/lib/liste/tarih-sekmeleri";

/**
 * Denetim listesinin süzgeci ve imleci (KARARLAR X-18 §(9)); adres çubuğunda durur. Geçersiz değer
 * yok sayılır. Saf modül: gün metni `zaman.ts`'te aralığa çevrilir (E-1).
 */

/** Kullanıcı süzgecinde aktörsüz kayıtlar (başarısız giriş, seed). */
export const SISTEM = "sistem";

export type DenetimSuzgeci = {
  /** İstanbul günü `YYYY-AA-GG`. */
  baslangic: string | null;
  bitis: string | null;
  /** Kullanıcı kimliği ya da `SISTEM`. */
  kullanici: string | null;
  modul: AuditModule | null;
  tur: AuditActionType | null;
  olay: AuditAction | null;
};

/** `once`: bu sıranın öncesi (daha eski); `sonra`: sonrası (daha yeni). */
export type Imlec = { yon: "once" | "sonra"; seq: number } | null;

export const BOS_SUZGEC: DenetimSuzgeci = { baslangic: null, bitis: null, kullanici: null, modul: null, tur: null, olay: null };

const MODULLER: readonly AuditModule[] = ["SATIS", "STOK", "FINANS", "CARI", "URUN_FIYAT", "ICE_AKTARIM", "KULLANICI"];
const TURLER: readonly AuditActionType[] = ["EKLEME", "GUNCELLEME", "SILME", "OTURUM"];

/** `seq` kolonu 32 bit tamsayıdır; aralık dışı imleç yok sayılır. */
const SEQ_AZAMI = 2_147_483_647;

function seq(metin: string | null): number | null {
  if (metin === null || !/^[1-9]\d{0,9}$/.test(metin)) return null;
  const n = parseInt(metin, 10);
  return n <= SEQ_AZAMI ? n : null;
}

export function suzgecCoz(p: Parametreler): { suzgec: DenetimSuzgeci; imlec: Imlec; kayit: string | null } {
  const kullanici = ilk(p, "kullanici");
  const once = seq(ilk(p, "once"));
  const sonra = seq(ilk(p, "sonra"));
  const kayit = ilk(p, "kayit");
  return {
    suzgec: {
      baslangic: gun(ilk(p, "baslangic")),
      bitis: gun(ilk(p, "bitis")),
      kullanici: kimlik(kullanici),
      modul: secenek(ilk(p, "modul"), MODULLER),
      tur: secenek(ilk(p, "tur"), TURLER),
      olay: secenek(ilk(p, "olay"), Object.keys(ISLEM_SINIFI) as AuditAction[]),
    },
    imlec: once !== null ? { yon: "once", seq: once } : sonra !== null ? { yon: "sonra", seq: sonra } : null,
    kayit: kimlik(kayit),
  };
}

/** Süzgeci koruyan liste adresi; imleç ve kayıt isteğe bağlı. */
export function denetimAdresi(s: DenetimSuzgeci, ek: { once?: number; sonra?: number; kayit?: string } = {}): string {
  const p = new URLSearchParams();
  for (const [ad, deger] of Object.entries(s)) if (deger !== null) p.set(ad, deger);
  if (ek.once !== undefined) p.set("once", String(ek.once));
  if (ek.sonra !== undefined) p.set("sonra", String(ek.sonra));
  if (ek.kayit !== undefined) p.set("kayit", ek.kayit);
  const q = p.toString();
  return q ? `/audit-logs?${q}` : "/audit-logs";
}

// --- Ekran yardımcıları (spec Ü-28) ---------------------------------------------------------

type Tarih = Pick<DenetimSuzgeci, "baslangic" | "bitis">;

export { tarihSekmeleri as hizliSekmeler, etkinTarihSekmesi as etkinSekme } from "@/lib/liste/tarih-sekmeleri";

/** Tarih sekmesinin adresi: tarihleri yazar, öbür süzgeçleri korur; imleç ve kayıt düşer. */
export function tarihSekmesiAdresi(s: DenetimSuzgeci, tarih: Tarih): string {
  return denetimAdresi({ ...s, ...tarih });
}

export type DenetimKarti = "bugun" | "yediGun" | "basarisiz" | "silme";

/** KPI kartlarının süzgeçleri (X-18-8): kartın adresi de sayısı da bundan türer — kart = açtığı süzgecin satırı. */
export function kartSuzgecleri(bugun: string): Record<DenetimKarti, DenetimSuzgeci> {
  const bugunku = { ...BOS_SUZGEC, baslangic: bugun, bitis: bugun };
  return {
    bugun: bugunku,
    yediGun: { ...BOS_SUZGEC, baslangic: gunOnce(bugun, 6), bitis: bugun },
    basarisiz: { ...bugunku, olay: "AUTH_LOGIN_FAILURE" },
    silme: { ...bugunku, tur: "SILME" },
  };
}

export function kartAdresleri(bugun: string): Record<DenetimKarti, string> {
  const k = kartSuzgecleri(bugun);
  return { bugun: denetimAdresi(k.bugun), yediGun: denetimAdresi(k.yediGun), basarisiz: denetimAdresi(k.basarisiz), silme: denetimAdresi(k.silme) };
}

/** Etkin süzgeç etiketleri, her biri o alanı düşüren imleçsiz adresle; adı bilinmeyen kullanıcı da süzer, "(bilinmiyor)" etiketlenir. */
export function etkinSuzgecler(
  s: DenetimSuzgeci,
  kullaniciAdi: (id: string) => string | undefined
): { anahtar: string; etiket: string; kaldirAdresi: string }[] {
  const liste: { anahtar: string; etiket: string; kaldirAdresi: string }[] = [];
  const ekle = (anahtar: string, etiket: string, ek: Partial<DenetimSuzgeci>) => liste.push({ anahtar, etiket, kaldirAdresi: denetimAdresi({ ...s, ...ek }) });
  if (s.baslangic || s.bitis) ekle("tarih", `Tarih: ${aralikEtiketi(s.baslangic, s.bitis)}`, { baslangic: null, bitis: null });
  if (s.kullanici) {
    const ad = s.kullanici === SISTEM ? "Sistem / anonim" : (kullaniciAdi(s.kullanici) ?? "(bilinmiyor)");
    ekle("kullanici", `Kullanıcı: ${ad}`, { kullanici: null });
  }
  if (s.modul) ekle("modul", `Modül: ${MODUL_ETIKETI[s.modul]}`, { modul: null });
  if (s.tur) ekle("tur", `Tür: ${ISLEM_TURU_ETIKETI[s.tur]}`, { tur: null });
  if (s.olay) ekle("olay", `Olay: ${AUDIT_ACTION_LABELS[s.olay] ?? s.olay}`, { olay: null });
  return liste;
}

export function bosDurum(s: DenetimSuzgeci): "hic-kayit" | "suzgecli" {
  return Object.values(s).some((d) => d !== null) ? "suzgecli" : "hic-kayit";
}
