import Link from "next/link";

import { ANA_MENU, type OzetSayfasi } from "@/components/menu";
import { formatSayi } from "@/lib/format";
import type { SeritKutusu } from "@/lib/sayfa-ozetleri";

/** Kutudaki sayının birimi; iş akışı sayısı sıfırdan büyükse uyarı tonundadır (bekleyen iş). */
const BIRIM: Record<OzetSayfasi, { birim: string; is?: true }> = {
  "/orders": { birim: "bekliyor", is: true },
  "/shipping": { birim: "kargolanacak", is: true },
  "/approvals": { birim: "karar bekliyor", is: true },
  "/stock": { birim: "kritik ürün", is: true },
  "/products": { birim: "aktif" },
  "/doctors": { birim: "aktif cari" },
  "/collections": { birim: "tahsilat" },
  "/price-lists": { birim: "liste" },
  "/users": { birim: "aktif" },
  "/reports": { birim: "aktif satıcı" },
  "/audit-logs": { birim: "kayıt bugün" },
  "/imports": { birim: "parti" },
  "/exports": { birim: "veri seti" },
};

/** Sayısı seçili aralıktan gelen kutular (diğerleri anlıktır). */
const DONEMLIK: Partial<Record<OzetSayfasi, string>> = { "/collections": "tahsilat", "/imports": "içe aktarım" };

/** "Tahsilat ve içe aktarım sayıları: bu ay" — yalnız görünen dönem kutuları; yoksa not yok. */
function donemNotuMetni(kutular: readonly SeritKutusu[], donemNotu: string): string | null {
  const adlar = kutular.flatMap((k) => DONEMLIK[k.sayfa] ?? []);
  if (adlar.length === 0) return null;
  const metin = `${adlar.join(" ve ")} ${adlar.length > 1 ? "sayıları" : "sayısı"}: ${donemNotu.toLocaleLowerCase("tr-TR")}`;
  return metin.charAt(0).toLocaleUpperCase("tr-TR") + metin.slice(1);
}

/**
 * Dashboard'un sayfa şeridi (kullanıcı kararı 27.10.2026): menüdeki her sayfa için ikon, ad ve tek
 * sayı; kutu sayfaya bağlantıdır. Sorgusu düşen kutu yalnız kendisi "Yüklenemedi" der (X-3).
 * Kutular `seritKutulari()`'ndan, rolün görebildiği sayfalar kadar gelir.
 */
export function SayfaSeridi({ kutular, donemNotu }: { kutular: readonly SeritKutusu[]; donemNotu: string }) {
  const menu = new Map(ANA_MENU.map((m) => [m.href, m]));
  const not = donemNotuMetni(kutular, donemNotu);
  return (
    <section aria-labelledby="sayfalar-baslik" className="mt-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 id="sayfalar-baslik" className="text-sm font-semibold text-slate-900">
          Sayfalar
        </h2>
        {not && <p className="text-xs text-slate-500">{not}</p>}
      </div>
      <div className="@container">
        <ul data-sayfa-seridi className="grid grid-cols-1 gap-2 @min-[480px]:grid-cols-2 @min-[784px]:grid-cols-3 @min-[1200px]:grid-cols-4">
          {kutular.map(({ sayfa, sonuc }) => {
            const m = menu.get(sayfa)!;
            const SayfaIkonu = m.icon;
            const b = BIRIM[sayfa];
            return (
              <li key={sayfa}>
                <Link
                  href={sayfa}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 dokunmatik:min-h-11"
                >
                  <SayfaIkonu aria-hidden="true" size={18} strokeWidth={1.75} className="shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{m.label}</span>
                  {sonuc.tamam ? (
                    <span
                      className={`whitespace-nowrap text-xs tabular-nums ${b.is && sonuc.deger > 0 ? "font-medium text-critical" : "text-slate-500"}`}
                    >
                      {formatSayi(sonuc.deger)} {b.birim}
                    </span>
                  ) : (
                    <span title={`Hata referansı: ${sonuc.referans}`} className="whitespace-nowrap text-xs text-negative">
                      Yüklenemedi
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
