"use client";

import { useFormStatus } from "react-dom";
import { Ikon, type IkonAdi } from "@/components/Ikon";
import { alanHatasi, type SonucDurumu } from "@/components/Sonuc";
import { KONTROL_COK_SATIR, KONTROL_TEK_SATIR, buton } from "@/components/stil";

/** `SERT` bildirimi alanın altında, alan işaretli (X-4 §(4)). */
function AlanHatasi({ name, hata }: { name: string; hata?: string }) {
  if (!hata) return null;
  return (
    <p id={`${name}-hata`} className="mt-1 text-xs text-negative">
      {hata}
    </p>
  );
}

function hataNitelikleri(name: string, hata?: string) {
  return hata ? { "aria-invalid": true, "aria-describedby": `${name}-hata` } : {};
}

/**
 * Etiket + alan satırı (ADR-009). Fareli masaüstünde ve alan kutusu en az 440 px ise etiket
 * alanın solunda aynı satırdadır (1280 px'te iki kolonlu formun kolonu ~470 px); dar kutuda
 * ve dokunmatikte üste geçer.
 */
function AlanSatiri({
  name,
  label,
  hata,
  children,
}: {
  name: string;
  label: string;
  hata?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="@container">
      <div className="fare:@min-[440px]:grid fare:@min-[440px]:grid-cols-[10rem_minmax(0,1fr)] fare:@min-[440px]:items-start fare:@min-[440px]:gap-x-3">
        <label
          htmlFor={name}
          className="mb-1 block text-sm font-medium text-slate-700 fare:@min-[440px]:mb-0 fare:@min-[440px]:py-1.5"
        >
          {label}
        </label>
        <div className="min-w-0">
          {children}
          <AlanHatasi name={name} hata={hata} />
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
  step,
  min,
  sonuc,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  placeholder?: string;
  step?: string;
  min?: string;
  sonuc?: SonucDurumu;
}) {
  const hata = alanHatasi(sonuc, name);
  return (
    <AlanSatiri name={name} label={label} hata={hata}>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        step={step}
        min={min}
        {...hataNitelikleri(name, hata)}
        className={`w-full ${KONTROL_TEK_SATIR}`}
      />
    </AlanSatiri>
  );
}

export function SelectField({
  label,
  name,
  defaultValue,
  required,
  options,
  sonuc,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  options: { value: string; label: string }[];
  sonuc?: SonucDurumu;
}) {
  const hata = alanHatasi(sonuc, name);
  return (
    <AlanSatiri name={name} label={label} hata={hata}>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        {...hataNitelikleri(name, hata)}
        className={`w-full ${KONTROL_TEK_SATIR}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </AlanSatiri>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
  sonuc,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  sonuc?: SonucDurumu;
}) {
  const hata = alanHatasi(sonuc, name);
  return (
    <AlanSatiri name={name} label={label} hata={hata}>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={2}
        {...hataNitelikleri(name, hata)}
        className={`w-full ${KONTROL_COK_SATIR}`}
      />
    </AlanSatiri>
  );
}

/** Buton içi bekleme göstergesi (< 1 sn işlemler). Dönen yükleyici linear döner — tek istisna. */
export function Donen() {
  return (
    <span
      aria-hidden="true"
      className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}

/**
 * Birincil form butonu: beklerken pasif ve dönen gösterge ikonun yerinde (çift gönderim engeli);
 * telefonda tam genişlik.
 */
export function SubmitButton({
  children,
  ikon,
  disabled,
}: {
  children: React.ReactNode;
  ikon: IkonAdi;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={buton("birincil", { form: true })}
    >
      {pending ? <Donen /> : <Ikon ad={ikon} />}
      {pending ? "Kaydediliyor..." : children}
    </button>
  );
}
