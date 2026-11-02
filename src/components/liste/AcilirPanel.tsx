"use client";

/** Bağlantıya bu sekmede gezinen düz tıklama mı (yeni sekme/pencere açan değiştirici tuşlar hariç)? */
export function sekmeIciBaglantiTiklamasi(e: React.MouseEvent): boolean {
  // `defaultPrevented` bakılmaz: Next `Link` istemci gezinmesi için her tıklamada onu çağırır.
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  return e.target instanceof Element && e.target.closest("a") !== null;
}

/**
 * Liste ekranlarının açılır paneli (Filtrele, Sütunlar): içindeki form gönderilince ya da bir bağlantıya
 * tıklanınca kapanır. İstemci gezinmesinde sayfa yeniden kurulmaz; aynı adrese varan bir eylemden
 * (değişmemiş süzgeçle Uygula, süzgeçsizken Temizle) sonra panel açık kalırdı.
 */
export function AcilirPanel(ozellikler: Omit<React.ComponentProps<"details">, "onSubmit" | "onClick">) {
  return (
    <details
      {...ozellikler}
      onSubmit={(e) => (e.currentTarget.open = false)}
      onClick={(e) => {
        if (sekmeIciBaglantiTiklamasi(e)) e.currentTarget.open = false;
      }}
    />
  );
}
