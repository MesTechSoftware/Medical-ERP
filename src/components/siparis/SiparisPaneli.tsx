import Link from "next/link";
import { YanPanel } from "@/components/YanPanel";
import { Ikon } from "@/components/Ikon";
import { OnayEtiketi } from "@/components/OnayEtiketi";
import { buton } from "@/components/stil";
import { Tutar } from "@/components/Tutar";
import { LinkButton, StatusChip } from "@/components/ui";
import { formatDate, formatDateTime, formatGun } from "@/lib/format";
import type { SiparisPaneli as Veri } from "@/lib/siparis-listesi/sorgu";
import type { SiparisYolu } from "@/lib/siparis-listesi/suzgec";
import { SATIR_TABANI, tabanli } from "@/lib/taban";
import { DurumRozeti } from "./SiparisTablosu";

const BASLIK = "siparis-paneli-baslik";
const BAGLANTI = "text-link underline decoration-link/40 underline-offset-4 hover:decoration-link";

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
 * Siparişin yan paneli (spec Ü-23 §3.5, 11-A): özet, kalemler (sevk / kalan / iade — A-3-2), tutarlar
 * (`siparisToplami` ile aynı yol), sevkiyatlar, iadeler. İşlem düğmesi yoktur; işlemler detay sayfasındadır.
 * Siparişlerim'de (Ü-31) satıcı satırı yoktur (kendi siparişi); cari adı Doktorlarım panelini açar (Ü-32).
 */
export function SiparisPaneli({ veri, kapatAdresi, yol }: { veri: Veri; kapatAdresi: string; yol: SiparisYolu }) {
  const o = veri.siparis;
  const yonetici = yol === "/orders";
  return (
    <YanPanel kapatAdresi={kapatAdresi} baslikId={BASLIK} kayitId={o.id}>
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div className="min-w-0">
            <h2 id={BASLIK} className="text-base font-semibold text-slate-900">
              {o.documentNo}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <DurumRozeti stage={o.stage} status={o.status} />
              <OnayEtiketi durum={o.onay} />
            </div>
          </div>
          <Link href={kapatAdresi} scroll={false} className={buton("metin")}>
            <Ikon ad="vazgec" />
            Kapat
          </Link>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <Bolum baslik="Özet">
            <dl className="divide-y divide-slate-100">
              <Satir ad="Tarih">{formatDateTime(o.orderDate)}</Satir>
              <Satir ad="Cari">
                {/* Satıcıda Doktorlarım paneli — yalnız cari bugün de onun portföyündeyse (devir sonrası panel açılmazdı). */}
                {yonetici || o.cariSaticida ? (
                  <Link href={`${yonetici ? "/doctors" : "/my-doctors"}?detay=${o.cari.id}`} className={BAGLANTI}>
                    {o.cari.fullName}
                  </Link>
                ) : (
                  o.cari.fullName
                )}
                {o.cari.clinic && <span className="block text-xs text-slate-500">{o.cari.clinic}</span>}
              </Satir>
              {yonetici && <Satir ad="Satıcı">{o.satici ?? "—"}</Satir>}
              <Satir ad="Vade">{o.paymentTermDays} gün</Satir>
            </dl>
          </Bolum>

          <Bolum baslik="Kalemler">
            <div className="tablo-kutusu">
              <table className="veri-tablosu">
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th className="sayi">Adet</th>
                    <th className="sayi">Sevk</th>
                    <th className="sayi">Kalan</th>
                    <th className="sayi">İade</th>
                    <th className="sayi">{tabanli("Birim fiyat", SATIR_TABANI.matrah)}</th>
                    <th className="sayi">{tabanli("Tutar", SATIR_TABANI.matrah)}</th>
                  </tr>
                </thead>
                <tbody>
                  {veri.kalemler.map((k) => (
                    <tr key={k.id}>
                      <td>
                        <div className="font-medium text-slate-900">{k.urun}</div>
                        <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
                          {k.kod}
                          {k.bedelsiz && <StatusChip ton="notr">Bedelsiz</StatusChip>}
                        </div>
                      </td>
                      <td className="sayi">{k.adet}</td>
                      <td className="sayi">{k.sevk}</td>
                      <td className="sayi">{k.kalan}</td>
                      <td className="sayi">{k.iade}</td>
                      <td className="sayi">{k.bedelsiz ? "—" : <Tutar deger={k.birimFiyat} taban={SATIR_TABANI.matrah} baslikta />}</td>
                      <td className="sayi">{k.bedelsiz ? "—" : <Tutar deger={k.matrah} taban={SATIR_TABANI.matrah} baslikta />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Bolum>

          <Bolum baslik="Tutarlar">
            <dl className="divide-y divide-slate-100">
              <Satir ad="Ara toplam">
                <Tutar deger={veri.tutar.matrah} taban={SATIR_TABANI.matrah} />
              </Satir>
              <Satir ad="KDV">
                <Tutar deger={veri.tutar.kdvTutar} taban={SATIR_TABANI.kdvTutar} />
              </Satir>
              <Satir ad="Genel toplam">
                <span className="font-semibold">
                  <Tutar deger={veri.tutar.toplam} taban={SATIR_TABANI.toplam} />
                </span>
              </Satir>
            </dl>
          </Bolum>

          <Bolum baslik="Sevkiyatlar">
            {veri.sevkiyatlar.length === 0 ? (
              <p className="text-sm text-slate-400">Henüz sevkiyat yok.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {veri.sevkiyatlar.map((v) => (
                  <li key={v.id} className="py-1.5 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-slate-900">{v.documentNo}</span>
                      <span className="text-slate-500">
                        {v.shippedOn ? formatGun(v.shippedOn) : "—"} · {v.adet} adet
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {v.firma ?? "Firma yok"}
                      {v.takipNo && (
                        <>
                          {" · Takip: "}
                          {v.takipLinki ? (
                            <a href={v.takipLinki} target="_blank" rel="noopener noreferrer" className={BAGLANTI}>
                              {v.takipNo}
                            </a>
                          ) : (
                            v.takipNo
                          )}
                        </>
                      )}
                      {v.irsaliyeNo && ` · İrsaliye: ${v.irsaliyeNo}`}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Bolum>

          {veri.iadeler.length > 0 && (
            <Bolum baslik="İadeler">
              <ul className="divide-y divide-slate-100">
                {veri.iadeler.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-sm">
                    <span className="font-medium text-slate-900">{r.documentNo}</span>
                    <span className="text-slate-500">
                      {formatDate(r.createdAt)} · {r.adet} adet
                    </span>
                  </li>
                ))}
              </ul>
            </Bolum>
          )}
        </div>

        <footer className="flex flex-wrap gap-3 border-t border-slate-200 p-4">
          <LinkButton href={`${yol}/${o.id}`} ikon="detay">
            Tam detay
          </LinkButton>
        </footer>
      </div>
    </YanPanel>
  );
}
