import Link from "next/link";
import { Panel, PanelBolumu as Bolum, PanelSatiri as Satir, Yok } from "@/components/panel/Panel";
import { Ikon } from "@/components/Ikon";
import { SonucGosterimi } from "@/components/Sonuc";
import { Tutar } from "@/components/Tutar";
import { buton } from "@/components/stil";
import { LinkButton, StatusBadge, StatusChip } from "@/components/ui";
import { bakiyeYonu } from "@/lib/doctor-cari";
import type { DoktorPaneliVerisi } from "@/lib/doktor-listesi/sorgu";
import { formatDate } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { sonucOlustur } from "@/lib/sonuc";
import { BRUT, SATIR_TABANI } from "@/lib/taban";
import { TIP } from "./[id]/CariHareketleri";
import { BAKIYE_ETIKETI } from "@/components/doktor/bakiye";
import { DurumRozetleri } from "@/components/doktor/DurumRozetleri";

/**
 * Cari listesinin yan paneli (spec Ü-18 §3.6): kimlik, cari özeti, son siparişler, son cari
 * hareketler ve devir geçmişi. Tutarlar detay sayfasıyla aynı fonksiyonlardandır; tam ekran
 * `/doctors/[id]`'dedir. Düzenle yalnız `YONETICI`'ye (X-13-2).
 */
export function DoktorPaneli({
  veri,
  kapatAdresi,
  yonetici,
}: {
  veri: DoktorPaneliVerisi;
  kapatAdresi: string;
  yonetici: boolean;
}) {
  const { doktor: d, risk } = veri;
  return (
    <Panel
      kapatAdresi={kapatAdresi}
      kayitId={d.id}
      baslik={<>{d.title ? `${d.title} ` : ""}{d.fullName}</>}
      ust={
        <>
          {d.accountClass === "BAYI" && <StatusChip ton="notr">Bayi</StatusChip>}
          <DurumRozetleri status={d.status} eksikFatura={veri.eksikFatura} risk={risk} />
        </>
      }
      altBilgi={
        <>
          <LinkButton href={`/doctors/${d.id}`} ikon="ileri">
            Tam detaya git
          </LinkButton>
          {yonetici && (
            <Link href={`/doctors/${d.id}/edit`} className={buton("ikincil")}>
              <Ikon ad="duzenle" />
              Düzenle
            </Link>
          )}
        </>
      }
    >
      <Bolum baslik="Kimlik ve iletişim">
        <dl className="divide-y divide-slate-100">
          <Satir ad="Klinik">{d.clinic ?? <Yok metin="—" />}</Satir>
          <Satir ad="Bölge / il">{[d.region, d.city].filter(Boolean).join(" · ") || <Yok metin="—" />}</Satir>
          <Satir ad="Telefon">
            <a href={`tel:${d.phoneNormalized}`} className="tabular-nums text-link hover:underline">
              {formatPhone(d.phoneNormalized)}
            </a>
          </Satir>
          <Satir ad="E-posta">{d.email ?? <Yok metin="—" />}</Satir>
          <Satir ad="Sorumlu satıcı">
            {d.accountClass === "BAYI" ? (
              <Yok metin="—" />
            ) : d.ownerSeller ? (
              d.ownerSeller.name
            ) : (
              <span className="font-medium text-critical">Sahipsiz</span>
            )}
          </Satir>
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

      <Bolum baslik="Son siparişler">
        {veri.siparisler.length === 0 ? (
          <Yok />
        ) : (
          <ul className="divide-y divide-slate-100">
            {veri.siparisler.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-sm">
                <span className="min-w-0">
                  <Link href={`/orders/${o.id}`} className="font-medium text-link hover:underline">
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

      <Bolum baslik="Son cari hareketler">
        {veri.hareketler.length === 0 ? (
          <Yok />
        ) : (
          <ul className="divide-y divide-slate-100">
            {veri.hareketler.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-sm">
                <span>
                  {TIP[h.type] ?? h.type}
                  <span className="ml-2 text-slate-500">
                    {formatDate(h.createdAt)} · {h.documentNo}
                  </span>
                </span>
                <span className="tabular-nums">
                  <span className="mr-1 text-xs text-slate-500">{h.direction === "BORC" ? "Borç" : "Alacak"}</span>
                  <Tutar deger={h.amount} taban={BRUT} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Bolum>

      <Bolum baslik="Devir geçmişi">
        {veri.devirler.length === 0 ? (
          <Yok />
        ) : (
          <ul className="divide-y divide-slate-100">
            {veri.devirler.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-1 py-1.5 text-sm">
                {v.from ?? "Sahipsiz"}
                <span className="text-slate-400">
                  <Ikon ad="ileri" />
                  <span className="sr-only">sonra</span>
                </span>
                {v.to ?? "Sahipsiz"}
                <span className="ml-2 text-slate-500">{formatDate(v.changedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Bolum>
    </Panel>
  );
}
