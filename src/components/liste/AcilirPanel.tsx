"use client";

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
        if (e.target instanceof Element && e.target.closest("a")) e.currentTarget.open = false;
      }}
    />
  );
}
