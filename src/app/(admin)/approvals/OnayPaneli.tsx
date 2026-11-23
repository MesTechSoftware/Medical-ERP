import { Panel, PanelBolumu as Bolum, PanelSatiri as Satir } from "@/components/panel/Panel";
import { Ikon } from "@/components/Ikon";
import { IslemFormu } from "@/components/Sonuc";
import { KONTROL_COK_SATIR, buton } from "@/components/stil";
import { StatusBadge, StatusChip } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { OnayPaneli as Veri } from "@/lib/onay-listesi/sorgu";
import { BEDELSIZ_SEBEP_ADI } from "@/lib/sozluk";
import { blokKarari } from "./actions";
import { BelgeBaglantisi, KararRozeti, kuralAdi } from "./OnayTablosu";
import { GEREKCE_AZAMI } from "@/lib/sonuc";

/**
 * Onay talebinin paneli (spec Ü-25 §3.5, A-8-12): talep, karar bağlamı (negatif stokta kalan ve depo stoğu,
 * bedelsiz satırlar), aynı belgenin önceki kararları; açık talepte karar formu (not zorunlu, A-8).
 */
export function OnayPaneli({ veri, kapatAdresi }: { veri: Veri; kapatAdresi: string }) {
  const b = veri.blok;
  return (
    <Panel
      kapatAdresi={kapatAdresi}
      kayitId={b.id}
      baslik={<>{kuralAdi(b.ruleCode)} · {b.belge?.no ?? "belge bulunamadı"}</>}
      ust={
        <>
          <KararRozeti karar={b.decision} />
          {veri.siparisDurumu && <StatusBadge status={veri.siparisDurumu} />}
        </>
      }
    >
      <Bolum baslik="Talep">
        <dl className="divide-y divide-slate-100">
          <Satir ad="Belge">
            <BelgeBaglantisi belge={b.belge} />
          </Satir>
          <Satir ad="Cari">{b.cari ?? "—"}</Satir>
          <Satir ad="Açan">
            {b.acan ?? "—"} · {formatDateTime(b.openedAt)}
          </Satir>
          <Satir ad="Gerekçe">{b.openReason}</Satir>
        </dl>
      </Bolum>

      {veri.negatifStok && (
        <Bolum baslik="Stok durumu">
          <div className="tablo-kutusu">
            <table className="veri-tablosu">
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th className="sayi">Sevk edilecek</th>
                  <th className="sayi">Depo stoğu</th>
                </tr>
              </thead>
              <tbody>
                {veri.negatifStok.map((k, i) => (
                  <tr key={i}>
                    <td>
                      <div className="font-medium text-slate-900">{k.urun}</div>
                      <div className="text-xs text-slate-500">{k.kod}</div>
                    </td>
                    <td className="sayi">{k.kalan}</td>
                    <td className="sayi">
                      <span className="inline-flex items-center gap-1">
                        {k.depo}
                        {k.yetmiyor && <StatusChip ton="hata">yetmiyor</StatusChip>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Bolum>
      )}

      {veri.bedelsiz && (
        <Bolum baslik="Bedelsiz satırlar">
          <ul className="divide-y divide-slate-100 text-sm">
            {veri.bedelsiz.map((k, i) => (
              <li key={i} className="py-1.5">
                <span className="font-medium text-slate-900">{k.urun}</span>
                <span className="ml-2 text-slate-500">
                  {k.adet} adet · {BEDELSIZ_SEBEP_ADI[k.sebep]}
                  {k.not ? ` · ${k.not}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Bolum>
      )}

      {veri.oncekiler.length > 0 && (
        <Bolum baslik="Önceki kararlar">
          <ul className="divide-y divide-slate-100 text-sm">
            {veri.oncekiler.map((o) => (
              <li key={o.id} className="flex flex-wrap items-baseline gap-2 py-1.5">
                {o.decidedAt && <span className="text-slate-500">{formatDateTime(o.decidedAt)}</span>}
                <span>{kuralAdi(o.ruleCode)}</span>
                <KararRozeti karar={o.decision} />
                {o.kararVeren && <span className="text-slate-500">{o.kararVeren}</span>}
                {o.decisionNote && <span className="text-slate-700">“{o.decisionNote}”</span>}
              </li>
            ))}
          </ul>
        </Bolum>
      )}

      {b.decision === null ? (
        <Bolum baslik="Karar">
          <div data-blok-id={b.id}>
            <IslemFormu action={blokKarari.bind(null, b.id)} className="space-y-2">
              <label htmlFor={`not_${b.id}`} className="block text-xs text-slate-500">
                Karar notu
              </label>
              <textarea id={`not_${b.id}`} name="not" required maxLength={GEREKCE_AZAMI} rows={2} className={`w-full ${KONTROL_COK_SATIR}`} />
              <div className="flex gap-2">
                <button type="submit" name="karar" value="ONAY" className={buton("birincil")}>
                  <Ikon ad="onayla" />
                  Onayla
                </button>
                <button type="submit" name="karar" value="RED" className={buton("olumsuz-cerceve")}>
                  <Ikon ad="reddet" />
                  Reddet
                </button>
              </div>
            </IslemFormu>
          </div>
        </Bolum>
      ) : (
        <Bolum baslik="Karar">
          <dl className="divide-y divide-slate-100">
            <Satir ad="Karar">
              <KararRozeti karar={b.decision} />
            </Satir>
            <Satir ad="Veren">{b.kararVeren ?? "—"}</Satir>
            <Satir ad="Zaman">{b.decidedAt ? formatDateTime(b.decidedAt) : "—"}</Satir>
            <Satir ad="Not">{b.decisionNote ?? "—"}</Satir>
          </dl>
        </Bolum>
      )}
    </Panel>
  );
}
