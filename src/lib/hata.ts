import { Prisma } from "@/generated/prisma/client";

/**
 * Hata yüzeyi — X-3. İki tür hata vardır:
 *
 * - **İş hatası** (beklenen): transaction'ı geri almak için `IsHatasi` fırlatılır, action onu
 *   yakalayıp kullanıcıya mesaj olarak **döner** (X-4 §(2)). Mesaj sabit, kullanıcıya
 *   gösterilebilir metindir.
 * - **Teknik hata** (beklenmeyen): yakalanmaz ya da yakalanıp yeniden fırlatılır; hata sınırına
 *   (`error.tsx`) düşer, kullanıcı referans görür, ayrıntı yalnız log'dadır (`instrumentation.ts`).
 *
 * Bir `catch` teknik hatayı iş mesajına çeviremez (X-3 §(4), KABUL X-3-3).
 */

/** Transaction içinden fırlatılan, kullanıcıya gösterilebilir iş hatası. */
export class IsHatasi extends Error {
  constructor(mesaj: string) {
    super(mesaj);
    this.name = "IsHatasi";
  }
}

/** Benzersizlik kısıtı ihlali (Prisma P2002) — kullanıcı girdisinden doğan beklenen hata. */
export function benzersizIhlali(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

// --- Teknik hata logu (X-3 §(6)) ------------------------------------------------

export type TeknikHataGirdisi = {
  zaman: Date;
  /** Ekranda görünen referans (Next `digest`); yoksa `null`. */
  referans: string | null;
  /** İstek yolu; sorgu dizesi atılır (parametre değeri taşıyabilir). */
  yol: string;
  kullaniciId: string | null;
  hata: unknown;
};

/** Sorgu dizesini ve parçayı atar: `/doctors?q=Ayşe` → `/doctors`. */
export function rotaYalin(yol: string): string {
  return yol.split(/[?#]/, 1)[0] || "/";
}

/**
 * Stack'in yalnız çerçeve satırları (`at ...`). İlk satır `Sınıf: mesaj` biçimindedir ve
 * mesaj değer taşıyabilir (Prisma alan/değer, SQL) — yazılmaz.
 */
export function stackCerceveleri(hata: unknown): string[] {
  const stack = hata instanceof Error ? hata.stack ?? "" : "";
  return stack
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("at "));
}

function hataSinifi(hata: unknown): string {
  if (hata instanceof Prisma.PrismaClientKnownRequestError) return `${hata.name}:${hata.code}`;
  if (hata instanceof Error) return hata.name || hata.constructor.name;
  return typeof hata;
}

/** Container log'una yazılacak tek satır. Mesaj ve `meta` bilinçli olarak yoktur. */
export function teknikHataLogSatiri(g: TeknikHataGirdisi): string {
  return JSON.stringify({
    olay: "teknik_hata",
    zaman: g.zaman.toISOString(),
    referans: g.referans,
    rota: rotaYalin(g.yol),
    kullaniciId: g.kullaniciId,
    sinif: hataSinifi(g.hata),
    stack: stackCerceveleri(g.hata),
  });
}

/**
 * `console.error`'a giden `Error` nesnesinin log'a girebilecek hâli: sınıf ve stack çerçeveleri.
 * Next canlıda sunucu hatasını ham nesne olarak basar (mesaj, Prisma `meta`); o döküm bununla
 * değiştirilir (X-3 §(6)). Ayrıntılı satır zaten `onRequestError`'dan yazılmıştır.
 */
export function hataOzeti(hata: Error): string {
  return JSON.stringify({ olay: "hata_ozeti", sinif: hataSinifi(hata), stack: stackCerceveleri(hata) });
}

/** `console.error` argümanlarındaki `Error` nesnelerini özetle değiştirir; gerisine dokunmaz. */
export function logArgumanlariniArindir(argumanlar: unknown[]): unknown[] {
  return argumanlar.map((a) => (a instanceof Error ? hataOzeti(a) : a));
}

/** `Cookie` başlığından tek çerezin değerini okur. */
export function cerezDegeri(cookieBasligi: string | string[] | undefined, ad: string): string | null {
  const metin = Array.isArray(cookieBasligi) ? cookieBasligi.join("; ") : cookieBasligi ?? "";
  for (const parca of metin.split(";")) {
    const i = parca.indexOf("=");
    if (i > 0 && parca.slice(0, i).trim() === ad) return decodeURIComponent(parca.slice(i + 1).trim());
  }
  return null;
}
