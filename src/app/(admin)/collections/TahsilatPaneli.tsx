import Link from "next/link";
import { BAGLANTI } from "@/components/stil";
import { Panel, PanelBolumu as Bolum, PanelSatiri as Satir } from "@/components/panel/Panel";
import { Tutar } from "@/components/Tutar";
import { formatDateTime } from "@/lib/format";
import { formatla } from "@/lib/money";
import { BRUT } from "@/lib/taban";
import type { TahsilatPaneli as Veri } from "@/lib/tahsilat-listesi/sorgu";
import { TIP_ADI } from "@/lib/tahsilat-listesi/suzgec";
import { BAKIYE_ETIKETI } from "@/components/doktor/bakiye";
import { IptalFormu } from "./IptalFormu";
import { DurumRozeti } from "./TahsilatTablosu";

/**
 * Tahsilatın paneli (spec Ü-26 §3.5, A-11-3): belge, donmuş komisyon (yöntemin bugünkü oranı değil), carinin
 * güncel bakiyesi; iptal edilmişse iptal bilgisi, aktifse gerekçeli iptal formu.
 */
export function TahsilatPaneli({ veri: p, kapatAdresi }: { veri: Veri; kapatAdresi: string }) {
  return (
    <Panel
      kapatAdresi={kapatAdresi}
      kayitId={p.id}
      baslik={p.documentNo}
      ust={<DurumRozeti durum={p.status} />}
    >
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
    </Panel>
  );
}
