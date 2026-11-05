import Link from "next/link";
import { YanPanel } from "@/components/YanPanel";
import { Ikon } from "@/components/Ikon";
import { buton } from "@/components/stil";

/**
 * Liste ekranlarının yan paneli (X-18 §(9) kabuğu `YanPanel`): başlık, rozet satırı, Kapat, kaydırılan
 * gövde ve isteğe bağlı alt bilgi. Bütün paneller aynı iskeleti buradan alır; içerik `PanelBolumu` ve
 * `PanelSatiri` ile kurulur. Sayfada tek panel açık olduğundan başlık kimliği sabittir.
 */
export const PANEL_BASLIGI = "yan-panel-baslik";

export function Panel({
  kapatAdresi,
  kayitId,
  baslik,
  ozet,
  ust,
  altBilgi,
  children,
}: {
  kapatAdresi: string;
  /** Açan satırın `data-kayit` değeri — panel kapanınca odak oraya döner. */
  kayitId: string;
  baslik: React.ReactNode;
  /** Başlığın altındaki tek cümlelik açıklama. */
  ozet?: React.ReactNode;
  /** Başlığın altındaki rozet satırı. */
  ust?: React.ReactNode;
  altBilgi?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <YanPanel kapatAdresi={kapatAdresi} baslikId={PANEL_BASLIGI} kayitId={kayitId}>
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div className="min-w-0">
            <h2 id={PANEL_BASLIGI} className="text-base font-semibold text-slate-900">
              {baslik}
            </h2>
            {ozet && <p className="mt-1 text-sm text-slate-600">{ozet}</p>}
            {ust && <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">{ust}</div>}
          </div>
          <Link href={kapatAdresi} scroll={false} className={buton("metin")}>
            <Ikon ad="vazgec" />
            Kapat
          </Link>
        </header>

        {children && <div className="flex-1 space-y-5 overflow-y-auto p-4">{children}</div>}

        {altBilgi && <footer className="flex flex-wrap items-center gap-3 border-t border-slate-200 p-4">{altBilgi}</footer>}
      </div>
    </YanPanel>
  );
}

export function PanelBolumu({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <section aria-label={baslik}>
      <h3 className="mb-1 text-xs font-medium uppercase text-slate-500">{baslik}</h3>
      {children}
    </section>
  );
}

/** Etiket sütununun genişliği; Tailwind sınıfları derlemede görünsün diye sabit tablodan. */
const ETIKET = {
  dar: "grid-cols-[7rem_minmax(0,1fr)]",
  orta: "grid-cols-[8rem_minmax(0,1fr)]",
  genis: "grid-cols-[9rem_minmax(0,1fr)]",
} as const;

/** `<dl>` içindeki etiket–değer satırı. */
export function PanelSatiri({
  ad,
  etiket = "orta",
  children,
}: {
  ad: string;
  etiket?: keyof typeof ETIKET;
  children: React.ReactNode;
}) {
  return (
    <div className={`grid ${ETIKET[etiket]} gap-2 py-1.5 text-sm`}>
      <dt className="text-slate-500">{ad}</dt>
      <dd className="min-w-0 break-words text-slate-900">{children}</dd>
    </div>
  );
}

/** Boş değerin soluk yer tutucusu. */
export function Yok({ metin = "kayıt yok" }: { metin?: string }) {
  return <span className="text-slate-400">{metin}</span>;
}
