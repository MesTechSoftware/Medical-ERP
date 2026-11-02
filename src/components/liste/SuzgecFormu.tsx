"use client";

import Form from "next/form";
import { sekmeIciBaglantiTiklamasi } from "@/components/liste/AcilirPanel";

type Ozellikler = Omit<React.ComponentProps<"form">, "action" | "method" | "onClick"> & { action: string };

/**
 * Liste süzgeçlerinin GET formu: `next/form` istemci tarafında gezer — sayfa yeniden yüklenmez, kaydırma
 * yerinde kalır; hedef hep parametreli olduğundan önceden yükleme yapılmaz. JS'siz düz GET formudur.
 * Form, çağıran yerde süzgeç alanlarının ham değeriyle anahtarlanır (`sorguMetni`); aynı adrese giden
 * bir bağlantı (Temizle, Tüm zamanlar) onu yeniden kurmaz, bu yüzden tıklamada alanlar sunucunun
 * uyguladığı değerlere döner.
 */
export function SuzgecFormu({ action, ...ozellikler }: Ozellikler) {
  return (
    <Form
      {...ozellikler}
      action={action}
      prefetch={false}
      scroll={false}
      onClick={(e) => {
        if (sekmeIciBaglantiTiklamasi(e)) e.currentTarget.reset();
      }}
    />
  );
}
