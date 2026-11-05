import { Panel, PanelBolumu as Bolum, PanelSatiri as Satir } from "@/components/panel/Panel";
import { Ikon } from "@/components/Ikon";
import { IslemFormu } from "@/components/Sonuc";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { formatDateTime } from "@/lib/format";
import { VERI_TIPI_ADI } from "@/lib/ice-aktarim/adlar";
import type { PartiPaneli as Veri } from "@/lib/ice-aktarim-listesi/sorgu";
import { partiyiGeriAl } from "./actions";
import { PartiDurumRozeti } from "./PartiTablosu";

/**
 * Partinin paneli (spec Ü-30 §3.4, X-12-2): parti bilgisi, yazdığı kayıtların dağılımı, geri alma durumu; geri
 * alınabilir partide gerekçeli geri alma formu (X-12: koşul partinin tamamına bakar, `partiGeriAl`).
 */
export function PartiPaneli({ veri: p, kapatAdresi }: { veri: Veri; kapatAdresi: string }) {
  return (
    <Panel
      kapatAdresi={kapatAdresi}
      kayitId={p.id}
      baslik={p.batchNo}
      ust={<PartiDurumRozeti geriAlindi={p.geriAlindi} />}
    >
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
    </Panel>
  );
}
