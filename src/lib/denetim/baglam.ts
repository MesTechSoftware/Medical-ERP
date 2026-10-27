import { headers } from "next/headers";

import { istekYontemi, istemciAdresi, sayfaYolu } from "@/lib/denetim/baglam-ayristir";

/**
 * Denetim kaydının istek bağlamı (KARARLAR X-18 §(3), ADR-011 §8): IP, oturum numarası, yöntem ve
 * sayfa yolu. Yazıcı otuzdan fazla noktadan istek nesnesi olmadan çağrılır; bağlam Next'in istek
 * deposundan okunur.
 */

export type IstekBaglami = {
  ipAddress: string | null;
  sessionId: string | null;
  requestMethod: string | null;
  endpoint: string | null;
};

const ISTEK_DISI: IstekBaglami = { ipAddress: null, sessionId: null, requestMethod: null, endpoint: null };

/** İstek dışında (seed, test, betik) bağlam boştur; başka her hata yükselir (X-3: sessiz hata yok). */
async function istekBasliklari(): Promise<Awaited<ReturnType<typeof headers>> | null> {
  try {
    return await headers();
  } catch (e) {
    if (e instanceof Error && e.message.includes("outside a request scope")) return null;
    throw e;
  }
}

export async function istekBaglami(): Promise<IstekBaglami> {
  const h = await istekBasliklari();
  if (!h) return ISTEK_DISI;
  // Oturum modülü veritabanı istemcisini yükler; burada yüklenir ki yazıcıyı (`audit.ts`) içe aktaran
  // saf modüllerin birim testleri veritabanısız koşsun. İstek başına önbellekli (`cache()`): yetki
  // denetimi zaten okuduğu için sorgu atmaz.
  const { getSession } = await import("@/lib/session");
  const oturum = await getSession();
  return {
    ipAddress: istemciAdresi(h.get("x-forwarded-for")),
    sessionId: oturum?.oturumId ?? null,
    requestMethod: istekYontemi(h.get("next-action")),
    endpoint: sayfaYolu(h.get("referer")),
  };
}
