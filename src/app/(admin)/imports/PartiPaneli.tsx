import Link from "next/link";
import { YanPanel } from "@/components/YanPanel";
import { Ikon } from "@/components/Ikon";
import { IslemFormu } from "@/components/Sonuc";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { formatDateTime } from "@/lib/format";
import { VERI_TIPI_ADI } from "@/lib/ice-aktarim/adlar";
import type { PartiPaneli as Veri } from "@/lib/ice-aktarim-listesi/sorgu";
import { partiyiGeriAl } from "./actions";
import { PartiDurumRozeti } from "./PartiTablosu";

const BASLIK = "parti-paneli-baslik";

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
 * Partinin paneli (spec Ü-30 §3.4, X-12-2): parti bilgisi, yazdığı kayıtların dağılımı, geri alma durumu; geri
 * alınabilir partide gerekçeli geri alma formu (X-12: koşul partinin tamamına bakar, `partiGeriAl`).
 */
export function PartiPaneli({ veri: p, kapatAdresi }: { veri: Veri; kapatAdresi: string }) {
  return (
    <YanPanel kapatAdresi={kapatAdresi} baslikId={BASLIK} kayitId={p.id}>
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div className="min-w-0">
            <h2 id={BASLIK} className="text-base font-semibold text-slate-900">
              {p.batchNo}
            </h2>
            <div className="mt-2 text-sm">
              <PartiDurumRozeti geriAlindi={p.geriAlindi} />
            </div>
          </div>
          <Link href={kapatAdresi} scroll={false} className={buton("metin")}>
            <Ikon ad="vazgec" />
            Kapat
          </Link>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <Bolum baslik="Parti">
            <dl className="divide-y divide-slate-100">
              <Satir ad="Tür">{VERI_TIPI_ADI[p.dataType]}</Satir>
              <Satir ad="Dosya">{p.fileName ?? "—"}</Satir>
              <Satir ad="Yapan">
                {p.yapan} · {formatDateTime(p.createdAt)}
              </Satir>
            </dl>
          </Bolum>

          <Bolum baslik="Kayıtlar">
            {p.kayitlar.length === 0 ? (
              <p className="text-sm text-slate-500">Bağlı kayıt yok.</p>
            ) : (
              <dl className="divide-y divide-slate-100">
                {p.kayitlar.map((k) => (
                  <Satir key={k.ad} ad={k.ad}>
                    {k.adet}
                  </Satir>
                ))}
              </dl>
            )}
          </Bolum>

          <Bolum baslik="Geri alma">
            {p.geriAlma ? (
              <dl className="divide-y divide-slate-100">
                <Satir ad="Geri alan">{p.geriAlma.eden ?? "—"}</Satir>
                <Satir ad="Zaman">{formatDateTime(p.geriAlma.zaman)}</Satir>
                <Satir ad="Gerekçe">{p.geriAlma.gerekce ?? "—"}</Satir>
              </dl>
            ) : p.geriAlinabilir ? (
              <IslemFormu action={partiyiGeriAl.bind(null, p.id)} className="space-y-2">
                <input aria-label="Geri alma gerekçesi" name="reason" required placeholder="Gerekçe" className={`w-full ${KONTROL_TEK_SATIR}`} />
                <button type="submit" className={buton("olumsuz")}>
                  <Ikon ad="geriAl" />
                  Partiyi geri al
                </button>
              </IslemFormu>
            ) : (
              <p className="text-sm text-slate-500">Bu türün partisi geri alınmaz.</p>
            )}
          </Bolum>
        </div>
      </div>
    </YanPanel>
  );
}
