"use client";

import { useFormStatus } from "react-dom";
import { alanHatasi, type SonucDurumu } from "@/components/Sonuc";

const KUTU = "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1";
const NORMAL = "border-slate-300 focus:border-slate-500 focus:ring-slate-500";
const HATALI = "border-red-500 focus:border-red-600 focus:ring-red-600";

/** `SERT` bildirimi alanın altında, alan işaretli (X-4 §(4)). */
function AlanHatasi({ name, hata }: { name: string; hata?: string }) {
  if (!hata) return null;
  return (
    <p id={`${name}-hata`} className="mt-1 text-xs text-red-600">
      {hata}
    </p>
  );
}

function hataNitelikleri(name: string, hata?: string) {
  return hata ? { "aria-invalid": true, "aria-describedby": `${name}-hata` } : {};
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
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
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
        className={`${KUTU} ${hata ? HATALI : NORMAL}`}
      />
      <AlanHatasi name={name} hata={hata} />
    </div>
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
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        {...hataNitelikleri(name, hata)}
        className={`${KUTU} bg-white ${hata ? HATALI : NORMAL}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <AlanHatasi name={name} hata={hata} />
    </div>
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
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={2}
        {...hataNitelikleri(name, hata)}
        className={`${KUTU} ${hata ? HATALI : NORMAL}`}
      />
      <AlanHatasi name={name} hata={hata} />
    </div>
  );
}

export function SubmitButton({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
    >
      {pending ? "Kaydediliyor..." : children}
    </button>
  );
}
