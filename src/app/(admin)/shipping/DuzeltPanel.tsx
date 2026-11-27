import { Panel } from "@/components/panel/Panel";
import { Ikon } from "@/components/Ikon";
import { IslemFormu } from "@/components/Sonuc";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { IRSALIYE_SINIRI } from "@/lib/sevkiyat-duzelt";
import { updateShipmentTracking } from "./actions";

/**
 * Sevkiyat takip/irsaliye düzeltme paneli (D-3-3): yalnız firma, takip no ve harici irsaliye no. Pasif firma
 * seçenek olarak yalnız sevkiyatta zaten kayıtlıysa görünür.
 */
export function DuzeltPanel({
  sevkiyat,
  firmalar,
  kapatAdresi,
}: {
  sevkiyat: { id: string; documentNo: string; carrierId: string | null; trackingNumber: string | null; externalDispatchNo: string | null };
  firmalar: readonly { id: string; name: string; isActive: boolean }[];
  kapatAdresi: string;
}) {
  const secenekler = firmalar.filter((f) => f.isActive || f.id === sevkiyat.carrierId);
  return (
    <Panel kapatAdresi={kapatAdresi} kayitId={sevkiyat.id} baslik={<>Takip düzelt · {sevkiyat.documentNo}</>}>
      <IslemFormu action={updateShipmentTracking.bind(null, sevkiyat.id, kapatAdresi)} className="space-y-3">
        <div>
          <label htmlFor="duzelt-firma" className="mb-1 block text-xs text-slate-500">
            Kargo Firması
          </label>
          <select id="duzelt-firma" name="carrierId" defaultValue={sevkiyat.carrierId ?? ""} className={`w-full ${KONTROL_TEK_SATIR}`}>
            <option value="">Seçiniz...</option>
            {secenekler.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.isActive ? "" : " (pasif)"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="duzelt-takip" className="mb-1 block text-xs text-slate-500">
            Takip Numarası
          </label>
          <input id="duzelt-takip" name="trackingNumber" defaultValue={sevkiyat.trackingNumber ?? ""} className={`w-full ${KONTROL_TEK_SATIR}`} />
        </div>
        <div>
          <label htmlFor="duzelt-irsaliye" className="mb-1 block text-xs text-slate-500">
            İrsaliye No (isteğe bağlı)
          </label>
          <input
            id="duzelt-irsaliye"
            name="externalDispatchNo"
            maxLength={IRSALIYE_SINIRI}
            defaultValue={sevkiyat.externalDispatchNo ?? ""}
            className={`w-full ${KONTROL_TEK_SATIR}`}
          />
        </div>
        <button type="submit" className={buton("birincil")}>
          <Ikon ad="onayla" />
          Kaydet
        </button>
      </IslemFormu>
    </Panel>
  );
}
