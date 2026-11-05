import Link from "next/link";
import { YanPanel } from "@/components/YanPanel";
import { Ikon } from "@/components/Ikon";
import { SonucGosterimi } from "@/components/Sonuc";
import { Tutar } from "@/components/Tutar";
import { buton } from "@/components/stil";
import { StatusBadge, StatusChip } from "@/components/ui";
import { BAKIYE_ETIKETI } from "@/components/doktor/bakiye";
import { DurumRozetleri } from "@/components/doktor/DurumRozetleri";
import { bakiyeYonu } from "@/lib/doctor-cari";
import type { SaticiDoktorPaneli } from "@/lib/doktor-listesi/sorgu";
import { formatDate } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { sonucOlustur } from "@/lib/sonuc";
import { BRUT, SATIR_TABANI } from "@/lib/taban";

const BASLIK = "doktor-paneli-baslik";
const BAGLANTI = "font-medium text-link hover:underline";

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

const Yok = ({ metin = "kayıt yok" }: { metin?: string }) => <span className="text-slate-400">{metin}</span>;

/**
 * Doktorlarım yan paneli (spec Ü-32 §3.4): kimlik ve iletişim, cari özeti (bakiye K-2 biçiminde, açık sipariş,
 * risk / limit — X-6 §(6), A-12), vadesi geçmiş hareket uyarısı (tutar değil, varlık — X-6 §(7)), satıcının bu
 * doktora girdiği son siparişler (Siparişlerim panelini açar). Düzenle altta.
 */
export function DoktorPaneli({ veri, kapatAdresi }: { veri: SaticiDoktorPaneli; kapatAdresi: string }) {
  const { doktor: d, risk } = veri;
  return (
    <YanPanel kapatAdresi={kapatAdresi} baslikId={BASLIK} kayitId={d.id}>
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div className="min-w-0">
            <h2 id={BASLIK} className="text-base font-semibold text-slate-900">
              {d.title ? `${d.title} ` : ""}
              {d.fullName}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <DurumRozetleri status={d.status} eksikFatura={veri.eksikFatura} risk={risk} />
            </div>
          </div>
          <Link href={kapatAdresi} scroll={false} className={buton("metin")}>
            <Ikon ad="vazgec" />
            Kapat
          </Link>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <Bolum baslik="Kimlik ve iletişim">
            <dl className="divide-y divide-slate-100">
              <Satir ad="Uzmanlık">{d.specialty ?? <Yok metin="—" />}</Satir>
              <Satir ad="Klinik">{d.clinic ?? <Yok metin="—" />}</Satir>
              <Satir ad="Bölge / il">{[d.region, d.city].filter(Boolean).join(" · ") || <Yok metin="—" />}</Satir>
              <Satir ad="Telefon">
                <a href={`tel:${d.phoneNormalized}`} className="tabular-nums text-link hover:underline">
                  {formatPhone(d.phoneNormalized)}
                </a>
              </Satir>
              <Satir ad="E-posta">{d.email ?? <Yok metin="—" />}</Satir>
            </dl>
          </Bolum>

          <Bolum baslik="Cari özeti">
            <dl className="divide-y divide-slate-100">
              {/* K-2: çıplak negatif gösterilmez; tutar mutlak değer, yön etikette. */}
              <Satir ad="Bakiye">
                <Tutar deger={risk.bakiye.abs()} taban={BRUT} />
                <span className="block text-xs text-slate-500">{BAKIYE_ETIKETI[bakiyeYonu(risk.bakiye)]}</span>
              </Satir>
              <Satir ad="Açık sipariş">
                <Tutar deger={risk.acikSiparis} taban={BRUT} />
              </Satir>
              <Satir ad="Risk / limit">
                <Tutar deger={risk.risk} taban={BRUT} />
                <span className="text-slate-500"> / </span>
                {risk.krediLimiti === null ? "Limitsiz" : <Tutar deger={risk.krediLimiti} taban={BRUT} />}
              </Satir>
            </dl>
            {veri.vadeUyarisi && (
              <div className="mt-2">
                <SonucGosterimi sonuc={sonucOlustur([veri.vadeUyarisi])} />
              </div>
            )}
          </Bolum>

          <Bolum baslik="Son siparişlerim">
            {veri.siparisler.length === 0 ? (
              <Yok />
            ) : (
              <ul className="divide-y divide-slate-100">
                {veri.siparisler.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-sm">
                    <span className="min-w-0">
                      <Link href={`/my-orders?detay=${o.id}`} className={BAGLANTI}>
                        {o.documentNo}
                      </Link>
                      <span className="ml-2 text-slate-500">{formatDate(o.orderDate)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {o.stage === "TEKLIF" && <StatusChip ton="notr">Teklif</StatusChip>}
                      <StatusBadge status={o.status} />
                      <span className="tabular-nums">
                        <Tutar deger={o.toplam} taban={SATIR_TABANI.toplam} />
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Bolum>
        </div>

        <footer className="flex flex-wrap items-center gap-3 border-t border-slate-200 p-4">
          <Link href={`/my-doctors/${d.id}/edit`} className={buton("ikincil")}>
            <Ikon ad="duzenle" />
            Düzenle
          </Link>
        </footer>
      </div>
    </YanPanel>
  );
}
