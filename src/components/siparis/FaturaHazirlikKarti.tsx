import KopyalaDugmesi from "@/components/siparis/KopyalaDugmesi";
import { Tutar } from "@/components/Tutar";
import { SATIR_TABANI, tabanli } from "@/lib/taban";
import { SonucGosterimi } from "@/components/Sonuc";
import { sonucOlustur } from "@/lib/sonuc";
import type { FaturaKarti, FaturaKolonu } from "@/lib/disa-aktarim";

const MUHATAP: { kod: FaturaKolonu; etiket: string }[] = [
  { kod: "FATURA_UNVANI", etiket: "Fatura unvanı" },
  { kod: "VKN_TCKN", etiket: "VKN / TCKN" },
  { kod: "VERGI_DAIRESI", etiket: "Vergi dairesi" },
  { kod: "FATURA_ADRESI", etiket: "Fatura adresi" },
  { kod: "FATURA_ILCE", etiket: "İlçe" },
  { kod: "FATURA_IL", etiket: "İl" },
];

/**
 * Fatura Hazırlık Kartı (K-4 §(6)-k): sevkiyat başına salt okunur özet. Veri `faturaHazirlik`'ten gelir;
 * dosya üretmez, `ExportLog`'a yazmaz. Yönetici sipariş detayındadır; satıcı sayfasında yoktur.
 */
export default function FaturaHazirlikKarti({ belgeNo, karti }: { belgeNo: string; karti: FaturaKarti }) {
  const { veri } = karti;
  const i = (kod: FaturaKolonu) => veri.kolonlar.findIndex((c) => c.kod === kod);
  const ilk = veri.satirlar[0];
  const bildirimler = [karti.eksikFaturaBilgisi, karti.geriyeDonuk].filter((b) => b !== null);
  return (
    <section data-fatura-karti={belgeNo} className="mt-3 rounded-lg border border-slate-200 p-3 text-sm">
      <h3 className="mb-2 font-semibold text-slate-900">Fatura Hazırlık — {belgeNo}</h3>
      {!ilk ? (
        <p className="text-slate-500">Bu sevkiyat fatura hazırlığına girmiyor.</p>
      ) : (
        <>
          <SonucGosterimi sonuc={bildirimler.length > 0 ? sonucOlustur(bildirimler) : null} />
          <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {MUHATAP.map(({ kod, etiket }) => {
              const deger = ilk[i(kod)];
              return (
                <div key={kod} className="flex items-center justify-between gap-2">
                  <div>
                    <dt className="text-xs text-slate-500">{etiket}</dt>
                    <dd className="text-slate-900">{deger ?? "—"}</dd>
                  </div>
                  {deger && <KopyalaDugmesi deger={deger} etiket={etiket} />}
                </div>
              );
            })}
          </dl>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="py-1 pr-3">Ürün</th>
                  <th className="py-1 pr-3 text-right">Miktar</th>
                  <th className="py-1 pr-3 text-right">KDV %</th>
                  <th className="py-1 pr-3 text-right">{tabanli("Tutar", SATIR_TABANI.matrah)}</th>
                  <th className="py-1 pr-3 text-right">{tabanli("KDV", SATIR_TABANI.kdvTutar)}</th>
                  <th className="py-1 text-right">{tabanli("Toplam", SATIR_TABANI.toplam)}</th>
                </tr>
              </thead>
              <tbody>
                {veri.satirlar.map((r, n) => (
                  <tr key={n} className="border-t border-slate-100">
                    <td className="py-1 pr-3">{r[i("URUN_ADI")]}</td>
                    <td className="py-1 pr-3 text-right">{r[i("MIKTAR")]}</td>
                    <td className="py-1 pr-3 text-right">{r[i("KDV_ORANI")]}</td>
                    <td className="py-1 pr-3 text-right"><Tutar deger={r[i("MATRAH")]} taban={SATIR_TABANI.matrah} baslikta /></td>
                    <td className="py-1 pr-3 text-right"><Tutar deger={r[i("KDV_TUTARI")]} taban={SATIR_TABANI.kdvTutar} baslikta /></td>
                    <td className="py-1 text-right"><Tutar deger={r[i("TOPLAM")]} taban={SATIR_TABANI.toplam} baslikta /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul data-kdv-kirilimi className="mt-2 space-y-0.5 text-slate-700">
            {karti.kdvKirilimi.map((k) => (
              <li key={k.oran}>
                KDV %{k.oran} — {tabanli("matrah", SATIR_TABANI.matrah)}: <Tutar deger={k.matrah} taban={SATIR_TABANI.matrah} baslikta /> · {tabanli("KDV", SATIR_TABANI.kdvTutar)}:{" "}
                <Tutar deger={k.kdv} taban={SATIR_TABANI.kdvTutar} baslikta />
              </li>
            ))}
            <li className="font-medium">
              {tabanli("Toplam", SATIR_TABANI.toplam)}: <Tutar deger={karti.toplam.toplam} taban={SATIR_TABANI.toplam} baslikta />
            </li>
          </ul>
          {karti.bedelsizSatir > 0 && (
            <p data-bedelsiz-notu className="mt-2 text-slate-600">
              Bu sevkiyatta {karti.bedelsizSatir} bedelsiz satır var; tutarı sıfırdır, yukarıdaki satırlara ve toplama girmez.
            </p>
          )}
        </>
      )}
      <p className="mt-2 text-xs text-slate-500">Bilgi amaçlıdır — mali belge değildir.</p>
    </section>
  );
}
