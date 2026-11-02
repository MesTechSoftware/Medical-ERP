"use client";

import Form from "next/form";
import { Fragment, startTransition, useState } from "react";
import { sekmeIciBaglantiTiklamasi } from "@/components/liste/AcilirPanel";

type Ozellikler = Omit<React.ComponentProps<"form">, "action" | "method" | "onClick" | "onSubmit"> & {
  action: string;
  /** Sunucunun uyguladığı süzgecin adresi (ör. `stokAdresi(suzgec)`); değişince form yeniden kurulur. */
  anahtar: string;
};

/**
 * Liste süzgeçlerinin GET formu: `next/form` istemci tarafında gezer — sayfa yeniden yüklenmez, kaydırma
 * yerinde kalır; hedef hep parametreli olduğundan önceden yükleme yapılmaz. JS'siz düz GET formudur.
 *
 * Alanlar denetimsizdir (`defaultValue`); React yumuşak gezinmede onları güncellemez. Form bu yüzden
 * yeniden kurulur: uygulanan süzgeç değişince (sekme, süzgeç etiketi, geri) ve her gönderimde ya da
 * içindeki bağlantıda (Temizle, Tüm zamanlar) — aynı adrese varılsa bile alanlar sunucunun uyguladığı
 * değeri gösterir. Sayaç gezinmeyle aynı geçişte artar; form yeni değerler gelince bir kez kurulur.
 * Anahtar sarmalayıcıdadır: `next/form` string `action`lı `<Form>`a `key` verilmesini desteklemez.
 */
export function SuzgecFormu({ action, anahtar, ...ozellikler }: Ozellikler) {
  const [kurulum, setKurulum] = useState(0);
  const yenidenKur = () => startTransition(() => setKurulum((k) => k + 1));
  return (
    <Fragment key={`${anahtar}#${kurulum}`}>
      <Form
        {...ozellikler}
        action={action}
        prefetch={false}
        scroll={false}
        onSubmit={yenidenKur}
        onClick={(e) => {
          if (sekmeIciBaglantiTiklamasi(e)) yenidenKur();
        }}
      />
    </Fragment>
  );
}
