import type { Instrumentation } from "next";

/**
 * Canlıda `console.error`'a giden ham hata nesneleri sınıf + stack çerçevesine indirilir
 * (X-3 §(6)): Next sunucu hatasını mesajı ve Prisma `meta`'sıyla basar, bunu kapatan bir
 * ayarı yoktur. Geliştirmede dokunulmaz — ayrıntı geliştiricinin işidir.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;
  const { logArgumanlariniArindir } = await import("@/lib/hata");
  const ozgun = console.error.bind(console);
  console.error = (...argumanlar: unknown[]) => ozgun(...logArgumanlariniArindir(argumanlar));
}

/**
 * Teknik hata logu — X-3 §(6)/(7). Sunucuda yakalanan her hata container çıktısına tek JSON
 * satırı olarak yazılır: zaman, referans (`digest`, ekrandakiyle aynı), rota, kullanıcı
 * kimliği, hata sınıfı, stack çerçeveleri. Hata mesajı ve Prisma `meta` yazılmaz.
 * Harici izleme servisi yoktur (K-9 §A-1); referans veritabanında saklanmaz (X-3 §(3)).
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { cerezDegeri, teknikHataLogSatiri } = await import("@/lib/hata");

  const referans =
    typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : null;

  let kullaniciId: string | null = null;
  const { OTURUM_CEREZI, oturumKullaniciId } = await import("@/lib/oturum");
  const token = cerezDegeri(request.headers.cookie, OTURUM_CEREZI);
  if (token) {
    try {
      kullaniciId = await oturumKullaniciId(token);
    } catch {
      // Hata logu veritabanına bağlı kalamaz: DB çöktüyse satır kimliksiz yazılır.
    }
  }

  console.error(
    teknikHataLogSatiri({ zaman: new Date(), referans, yol: request.path, kullaniciId, hata: err })
  );
};
