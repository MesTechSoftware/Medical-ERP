import Link from "next/link";
import { YanPanel } from "@/components/YanPanel";
import { Ikon } from "@/components/Ikon";
import { buton } from "@/components/stil";
import { Tutar } from "@/components/Tutar";
import { formatDateTime } from "@/lib/format";
import { formatla } from "@/lib/money";
import { BRUT } from "@/lib/taban";
import type { TahsilatPaneli as Veri } from "@/lib/tahsilat-listesi/sorgu";
import { TIP_ADI } from "@/lib/tahsilat-listesi/suzgec";
import { BAKIYE_ETIKETI } from "@/components/doktor/bakiye";
import { IptalFormu } from "./IptalFormu";
import { DurumRozeti } from "./TahsilatTablosu";

const BASLIK = "tahsilat-paneli-baslik";
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
 * Tahsilatın paneli (spec Ü-26 §3.5, A-11-3): belge, donmuş komisyon (yöntemin bugünkü oranı değil), carinin
 * güncel bakiyesi; iptal edilmişse iptal bilgisi, aktifse gerekçeli iptal formu.
 */
export function TahsilatPaneli({ veri: p, kapatAdresi }: { veri: Veri; kapatAdresi: string }) {
  return (
    <YanPanel kapatAdresi={kapatAdresi} baslikId={BASLIK} kayitId={p.id}>
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div className="min-w-0">
            <h2 id={BASLIK} className="text-base font-semibold text-slate-900">
              {p.documentNo}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <DurumRozeti durum={p.status} />
            </div>
          </div>
          <Link href={kapatAdresi} scroll={false} className={buton("metin")}>
            <Ikon ad="vazgec" />
            Kapat
          </Link>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <Bolum baslik="Tahsilat">
            <dl className="divide-y divide-slate-100">
              <Satir ad="Cari">
                <Link href={`/doctors/${p.doktorId}`} className={BAGLANTI}>
                  {p.doktor}
                </Link>
              </Satir>
              <Satir ad="Tarih">{formatDateTime(p.paidAt)}</Satir>
              <Satir ad="Tutar">
                <Tutar deger={p.amount} taban={BRUT} />
              </Satir>
              <Satir ad="Yöntem">
                {p.yontem} · {TIP_ADI[p.tip]}
              </Satir>
              <Satir ad="Referans">{p.referenceNo ?? "—"}</Satir>
              <Satir ad="Açıklama">{p.note ?? "—"}</Satir>
              <Satir ad="Kaydeden">
                {p.kaydeden ?? "—"} · {formatDateTime(p.createdAt)}
              </Satir>
            </dl>
          </Bolum>

          {!p.commissionAmount.isZero() && (
            <Bolum baslik="Komisyon">
              <dl className="divide-y divide-slate-100">
                <Satir ad="Oran">{formatla(p.commissionRate, "oran")}</Satir>
                <Satir ad="Tutar">
                  <Tutar deger={p.commissionAmount} taban={BRUT} />
                </Satir>
              </dl>
              <p className="mt-1 text-xs text-slate-500">Kayıt anındaki oran; cariye dokunmaz.</p>
            </Bolum>
          )}

          <Bolum baslik="Cari">
            <dl className="divide-y divide-slate-100">
              <Satir ad="Güncel bakiye">
                <Tutar deger={p.bakiye.bakiye.abs()} taban={BRUT} />
                <span className="block text-xs text-slate-500">{BAKIYE_ETIKETI[p.bakiye.yon]}</span>
              </Satir>
            </dl>
            <Link href={`/doctors/${p.doktorId}`} className={`mt-1 inline-block text-sm ${BAGLANTI}`}>
              Cari hareketleri
            </Link>
          </Bolum>

          <Bolum baslik="İptal">
            {p.iptal ? (
              <dl className="divide-y divide-slate-100">
                <Satir ad="İptal eden">{p.iptal.eden ?? "—"}</Satir>
                <Satir ad="Zaman">{p.iptal.zaman ? formatDateTime(p.iptal.zaman) : "—"}</Satir>
                <Satir ad="Gerekçe">{p.iptal.gerekce ?? "—"}</Satir>
              </dl>
            ) : (
              <IptalFormu paymentId={p.id} />
            )}
          </Bolum>
        </div>
      </div>
    </YanPanel>
  );
}
