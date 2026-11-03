import Link from "next/link";
import { YanPanel } from "@/components/YanPanel";
import { Ikon } from "@/components/Ikon";
import { IslemFormu } from "@/components/Sonuc";
import { KONTROL_COK_SATIR, buton } from "@/components/stil";
import { StatusBadge, StatusChip } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { OnayPaneli as Veri } from "@/lib/onay-listesi/sorgu";
import { BEDELSIZ_SEBEP_ADI } from "@/lib/sozluk";
import { blokKarari } from "./actions";
import { BelgeBaglantisi, KararRozeti, kuralAdi } from "./OnayTablosu";

const BASLIK = "onay-paneli-baslik";

function Satir({ ad, children }: { ad: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-2 py-1.5 text-sm">
      <dt className="text-slate-500">{ad}</dt>
      <dd className="min-w-0 break-words text-slate-900">{children}</dd>
    </div>
  );
}

function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <section aria-label={baslik}>
      <h3 className="mb-1 text-xs font-medium uppercase text-slate-500">{baslik}</h3>
      {children}
    </section>
  );
}

/**
 * Onay talebinin paneli (spec Ü-25 §3.5, A-8-12): talep, karar bağlamı (negatif stokta kalan ve depo stoğu,
 * bedelsiz satırlar), aynı belgenin önceki kararları; açık talepte karar formu (not zorunlu, A-8).
 */
export function OnayPaneli({ veri, kapatAdresi }: { veri: Veri; kapatAdresi: string }) {
  const b = veri.blok;
  return (
    <YanPanel kapatAdresi={kapatAdresi} baslikId={BASLIK} kayitId={b.id}>
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div className="min-w-0">
            <h2 id={BASLIK} className="text-base font-semibold text-slate-900">
              {kuralAdi(b.ruleCode)} · {b.belge?.no ?? "belge bulunamadı"}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <KararRozeti karar={b.decision} />
              {veri.siparisDurumu && <StatusBadge status={veri.siparisDurumu} />}
            </div>
          </div>
          <Link href={kapatAdresi} scroll={false} className={buton("metin")}>
            <Ikon ad="vazgec" />
            Kapat
          </Link>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
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
                    <span className="text-slate-500">{formatDateTime(o.openedAt)}</span>
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
                  <textarea id={`not_${b.id}`} name="not" required rows={2} className={`w-full ${KONTROL_COK_SATIR}`} />
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
        </div>
      </div>
    </YanPanel>
  );
}
