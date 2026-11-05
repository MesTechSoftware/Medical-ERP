import Link from "next/link";
import { Panel, PanelBolumu as Bolum, PanelSatiri as Satir, Yok } from "@/components/panel/Panel";
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

const BAGLANTI = "font-medium text-link hover:underline";

/**
 * Doktorlarım yan paneli (spec Ü-32 §3.4): kimlik ve iletişim, cari özeti (bakiye K-2 biçiminde, açık sipariş,
 * risk / limit — X-6 §(6), A-12), vadesi geçmiş hareket uyarısı (tutar değil, varlık — X-6 §(7)), satıcının bu
 * doktora girdiği son siparişler (Siparişlerim panelini açar). Düzenle altta.
 */
export function DoktorPaneli({ veri, kapatAdresi }: { veri: SaticiDoktorPaneli; kapatAdresi: string }) {
  const { doktor: d, risk } = veri;
  return (
    <Panel
      kapatAdresi={kapatAdresi}
      kayitId={d.id}
      baslik={<>{d.title ? `${d.title} ` : ""}{d.fullName}</>}
      ust={<DurumRozetleri status={d.status} eksikFatura={false} risk={risk} />}
      altBilgi={
        <Link href={`/my-doctors/${d.id}/edit`} className={buton("ikincil")}>
          <Ikon ad="duzenle" />
          Düzenle
        </Link>
      }
    >
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
        <p className="mb-1 text-xs text-slate-500">
          Bu doktora sizin girdiğiniz siparişler. Listedeki sipariş sayısı ve son sipariş, devirden önceki siparişleri de kapsar.
        </p>
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
    </Panel>
  );
}
