"use client";

import { useId, useMemo, useState } from "react";
import { KONTROL_TEK_SATIR } from "@/components/stil";

export type SecimSecenegi = {
  id: string;
  /** Listede ve kutuda görünen metin. */
  etiket: string;
  /** Aramanın baktığı ek metin (kod, klinik…); boşsa yalnız etiket. */
  arama?: string;
  /** Etiketin altında küçük ikinci satır (stok, fiyat…). */
  ayrinti?: string;
};

const SINIR = 30;

const norm = (s: string) => s.toLocaleLowerCase("tr").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

/**
 * Aramalı seçim (A-10 aramalı doktor/ürün seçimi): yüzlerce seçenekte yazarak daraltılır. Kutuya yazılan
 * her sözcük etiket ya da `arama` metninde geçmelidir (büyük/küçük harf ve aksan duyarsız); en fazla
 * {@link SINIR} sonuç gösterilir. Seçim `name` adlı gizli alana yazılır; boş seçim gönderilmez.
 */
export function AramaliSecim({
  id,
  etiket,
  secenekler,
  deger,
  onSec,
  name,
  yerTutucu = "Yazarak arayın…",
}: {
  id: string;
  etiket: string;
  secenekler: readonly SecimSecenegi[];
  deger: string;
  onSec: (id: string) => void;
  name?: string;
  yerTutucu?: string;
}) {
  const liste = useId();
  const [acik, setAcik] = useState(false);
  const [sorgu, setSorgu] = useState("");
  const [vurgu, setVurgu] = useState(0);
  const secili = secenekler.find((s) => s.id === deger);

  const sonuc = useMemo(() => {
    const parcalar = norm(sorgu).split(/\s+/).filter(Boolean);
    const uyan = secenekler.filter((s) => {
      const metin = norm(`${s.etiket} ${s.arama ?? ""}`);
      return parcalar.every((p) => metin.includes(p));
    });
    return { gosterilen: uyan.slice(0, SINIR), toplam: uyan.length };
  }, [secenekler, sorgu]);

  function sec(s: SecimSecenegi) {
    onSec(s.id);
    setSorgu("");
    setAcik(false);
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-600">
        {etiket}
      </label>
      {name && <input type="hidden" name={name} value={deger} />}
      <input
        id={id}
        role="combobox"
        aria-expanded={acik}
        aria-controls={liste}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={secili ? secili.etiket : yerTutucu}
        value={acik ? sorgu : (secili?.etiket ?? "")}
        onFocus={() => setAcik(true)}
        onBlur={() => setAcik(false)}
        onChange={(e) => {
          setSorgu(e.target.value);
          setVurgu(0);
          setAcik(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setAcik(true);
            setVurgu((v) => Math.min(v + 1, sonuc.gosterilen.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setVurgu((v) => Math.max(v - 1, 0));
          } else if (e.key === "Enter" && acik) {
            e.preventDefault();
            const s = sonuc.gosterilen[vurgu];
            if (s) sec(s);
          } else if (e.key === "Escape") {
            setAcik(false);
          }
        }}
        className={`w-full ${KONTROL_TEK_SATIR}`}
      />
      {acik && (
        <ul
          id={liste}
          role="listbox"
          aria-label={etiket}
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg"
        >
          {sonuc.gosterilen.length === 0 && <li className="px-3 py-2 text-slate-500">Eşleşen kayıt yok</li>}
          {sonuc.gosterilen.map((s, i) => (
            <li
              key={s.id}
              role="option"
              aria-selected={s.id === deger}
              // onMouseDown: tıklama kutunun blur'ünden önce seçimi yazar.
              onMouseDown={(e) => {
                e.preventDefault();
                sec(s);
              }}
              onMouseEnter={() => setVurgu(i)}
              className={`cursor-pointer px-3 py-2 dokunmatik:min-h-11 ${i === vurgu ? "bg-slate-100" : ""}`}
            >
              <span className="text-slate-900">{s.etiket}</span>
              {s.ayrinti && <span className="block text-xs text-slate-500">{s.ayrinti}</span>}
            </li>
          ))}
          {sonuc.toplam > SINIR && (
            <li className="px-3 py-1 text-xs text-slate-500">
              {sonuc.toplam - SINIR} kayıt daha var — aramayı daraltın
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
