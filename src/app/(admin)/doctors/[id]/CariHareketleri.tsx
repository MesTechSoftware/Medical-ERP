import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { BRUT, tabanli } from "@/lib/taban";
import { Card, EmptyRow } from "@/components/ui";
import { IslemFormu } from "@/components/Sonuc";
import { Tutar } from "@/components/Tutar";
import { changeDueDate } from "../../collections/actions";
import { addVadeFarki, reverseLedgerEntry } from "../actions";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";

const TIP: Record<string, string> = {
  SEVKIYAT: "Sevkiyat",
  IADE: "İade",
  TAHSILAT: "Tahsilat",
  ACILIS: "Açılış",
  VADE_FARKI: "Vade farkı",
  TERS_KAYIT: "Ters kayıt",
};
const KUTU = `w-full ${KONTROL_TEK_SATIR}`;
const DUGME = buton("birincil");

/**
 * Cari hareketler (X-11) — son 50. Yönetici: borç hareketinde vade değişikliği (X-15 §(1)), elle vade
 * farkı (A-7) ve açılış/vade farkı hareketinin ters kaydı (X-16 §(10)). Tutar pozitif, yön kolonda (K-2).
 */
export default async function CariHareketleri({ doktorId, yonetici }: { doktorId: string; yonetici: boolean }) {
  const hareketler = await prisma.ledgerEntry.findMany({
    where: { doctorId: doktorId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 50,
    include: { reversal: { select: { id: true } } },
  });
  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-slate-900">Cari Hareketler</h2>
      <div className="tablo-kutusu">
        <table className="veri-tablosu">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Tip</th>
              <th className="oncelik-dusuk">Belge No</th>
              <th className="sayi">{tabanli("Borç", BRUT)}</th>
              <th className="sayi">{tabanli("Alacak", BRUT)}</th>
              <th>Vade</th>
              {yonetici && <th></th>}
            </tr>
          </thead>
          <tbody>
            {hareketler.length === 0 && <EmptyRow colSpan={yonetici ? 7 : 6} text="Cari hareket yok." />}
            {hareketler.map((h) => (
              <tr key={h.id} data-hareket-id={h.id} className="align-top">
                <td className="whitespace-nowrap text-slate-500">{formatDate(h.createdAt)}</td>
                <td>
                  {TIP[h.type] ?? h.type}
                  {h.reversal && <span className="ml-1 text-xs text-slate-400">(çevrildi)</span>}
                </td>
                <td className="whitespace-nowrap text-slate-500 oncelik-dusuk">{h.documentNo}</td>
                <td className="sayi">
                  {h.direction === "BORC" ? <Tutar deger={h.amount} taban={BRUT} baslikta /> : ""}
                </td>
                <td className="sayi">
                  {h.direction === "ALACAK" ? <Tutar deger={h.amount} taban={BRUT} baslikta /> : ""}
                </td>
                <td className="whitespace-nowrap text-slate-500">{h.dueDate ? formatDate(h.dueDate) : "—"}</td>
                {yonetici && (
                  <td>
                    {h.direction === "BORC" && h.type !== "TERS_KAYIT" && (
                      <details>
                        <summary className="cursor-pointer text-xs text-slate-600">Vade değiştir</summary>
                        <IslemFormu action={changeDueDate} className="mt-2 w-48 space-y-2" basariMetni="Vade değişti.">
                          <input type="hidden" name="ledgerEntryId" value={h.id} />
                          <input aria-label="Yeni vade" type="date" name="newDueDate" required className={KUTU} />
                          <input aria-label="Vade gerekçesi" name="reason" required placeholder="Gerekçe" className={KUTU} />
                          <button type="submit" className={DUGME}>
                            Kaydet
                          </button>
                        </IslemFormu>
                      </details>
                    )}
                    {(h.type === "ACILIS" || h.type === "VADE_FARKI") && !h.reversal && (
                      <details>
                        <summary className="cursor-pointer text-xs text-negative">Ters kayıt</summary>
                        <IslemFormu action={reverseLedgerEntry.bind(null, h.id)} className="mt-2 w-48 space-y-2">
                          <input aria-label="Ters kayıt gerekçesi" name="reason" required placeholder="Gerekçe" className={KUTU} />
                          <button type="submit" className={DUGME}>
                            Çevir
                          </button>
                        </IslemFormu>
                      </details>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {yonetici && (
        <details className="mt-4 rounded-lg border border-slate-200 p-3">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">Vade farkı ekle</summary>
          <p className="mt-2 text-xs text-slate-500">Elle girilir, otomatik hesaplanmaz; KDV kırılımı yoktur. Satış sayılmaz.</p>
          <IslemFormu action={addVadeFarki.bind(null, doktorId)} className="mt-3 grid gap-3 sm:grid-cols-4" basariMetni="Vade farkı kaydedildi.">
            <div>
              <label htmlFor="vdf-tutar" className="mb-1 block text-xs text-slate-500">
                {tabanli("Tutar", BRUT)}
              </label>
              <input id="vdf-tutar" name="amount" required className={KUTU} />
            </div>
            <div>
              <label htmlFor="vdf-vade" className="mb-1 block text-xs text-slate-500">
                Vade
              </label>
              <input id="vdf-vade" name="dueDate" type="date" required className={KUTU} />
            </div>
            <div>
              <label htmlFor="vdf-gerekce" className="mb-1 block text-xs text-slate-500">
                Gerekçe
              </label>
              <input id="vdf-gerekce" name="reason" required className={KUTU} />
            </div>
            <div className="flex items-end">
              <button type="submit" className={DUGME}>
                Kaydet
              </button>
            </div>
          </IslemFormu>
        </details>
      )}
    </Card>
  );
}
