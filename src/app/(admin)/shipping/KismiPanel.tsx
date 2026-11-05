import { Panel } from "@/components/panel/Panel";
import { Ikon } from "@/components/Ikon";
import { IslemFormu } from "@/components/Sonuc";
import { OnayEtiketi } from "@/components/OnayEtiketi";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { Tutar } from "@/components/Tutar";
import { formatDate } from "@/lib/format";
import type { BekleyenSatir } from "@/lib/kargo-listesi/sorgu";
import { SATIR_TABANI } from "@/lib/taban";
import { shipOrder } from "./actions";

/**
 * Kısmi sevk paneli (spec Ü-24 §3.4, 12-A): bugünkü kart formu — kalem başına miktar (varsayılan kalan; 0 bu
 * sevkiyatta gönderilmez, A-3), firma, takip, irsaliye. Gerekçe diyaloğu `IslemFormu`'ndadır (A-8).
 */
export function KismiPanel({
  r,
  firmalar,
  kapatAdresi,
}: {
  r: BekleyenSatir;
  firmalar: readonly { id: string; name: string }[];
  kapatAdresi: string;
}) {
  return (
    <Panel
      kapatAdresi={kapatAdresi}
      kayitId={r.id}
      baslik={<>Kısmi sevk · {r.documentNo}</>}
    >
      <div data-sevk-karti={r.id} className="rounded-lg border border-slate-200 p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-medium text-slate-900">{r.cari.fullName}</span>
            <span className="ml-2 text-sm text-slate-500">
              {[r.cari.clinic, r.satici].filter(Boolean).join(" · ")} · {formatDate(r.orderDate)}
            </span>
          </div>
          <span className="flex items-center gap-2 text-sm font-medium tabular-nums text-slate-900">
            <OnayEtiketi durum={r.onay} />
            <Tutar deger={r.toplam} taban={SATIR_TABANI.toplam} />
          </span>
        </div>
        <IslemFormu action={shipOrder.bind(null, r.id)} className="flex flex-wrap items-end gap-2">
          <div className="w-full space-y-1">
            {r.kalemler.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 text-sm">
                <label htmlFor={`miktar_${i.id}`} className="text-slate-700">
                  {i.urun}
                  <span className="ml-1 text-xs text-slate-400">
                    {i.kod} · kalan {i.kalan}/{i.adet}
                  </span>
                </label>
                <input
                  id={`miktar_${i.id}`}
                  name={`miktar_${i.id}`}
                  type="number"
                  min={0}
                  max={i.kalan}
                  defaultValue={i.kalan}
                  className={`w-20 sayi ${KONTROL_TEK_SATIR}`}
                />
              </div>
            ))}
          </div>
          <div className="min-w-[160px] flex-1">
            <label htmlFor="kismi-firma" className="mb-1 block text-xs text-slate-500">
              Kargo Firması
            </label>
            <select id="kismi-firma" name="carrierId" defaultValue="" className={`w-full ${KONTROL_TEK_SATIR}`}>
              <option value="">Seçiniz...</option>
              {firmalar.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px] flex-1">
            <label htmlFor="kismi-takip" className="mb-1 block text-xs text-slate-500">
              Takip Numarası
            </label>
            <input id="kismi-takip" name="trackingNumber" placeholder="Örn: TR123456789" className={`w-full ${KONTROL_TEK_SATIR}`} />
          </div>
          <div className="min-w-[160px] flex-1">
            <label htmlFor="kismi-irsaliye" className="mb-1 block text-xs text-slate-500">
              İrsaliye No (isteğe bağlı)
            </label>
            <input id="kismi-irsaliye" name="externalDispatchNo" maxLength={32} className={`w-full ${KONTROL_TEK_SATIR}`} />
          </div>
          <button type="submit" className={buton("birincil")}>
            <Ikon ad="kargola" />
            Kargola
          </button>
        </IslemFormu>
      </div>
    </Panel>
  );
}
