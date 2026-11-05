/** Süzgeç panelindeki alan etiketi; `<legend>` gibi etiketsiz gruplar da aynı sınıfı kullanır. */
export const SUZGEC_ETIKETI = "mb-1 block font-medium text-slate-700";

/** Süzgeç panelinin etiketli alanı (Filtrele açılır paneli). */
export function SuzgecAlani({ id, etiket, children }: { id: string; etiket: string; children: React.ReactNode }) {
  return (
    <div className="text-sm">
      <label htmlFor={id} className={SUZGEC_ETIKETI}>
        {etiket}
      </label>
      {children}
    </div>
  );
}
