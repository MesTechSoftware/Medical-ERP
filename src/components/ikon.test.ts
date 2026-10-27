import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it } from "vitest";

import ConfirmSubmit from "@/components/ConfirmSubmit";
import { Ikon } from "@/components/Ikon";
import { SubmitButton } from "@/components/form";
import { LinkButton } from "@/components/ui";

// ADR-009 — buton ikonları: ikon + metin; ikon dekoratiftir, erişilebilir ad metindir.
describe("Ikon", () => {
  it("dekoratiftir (aria-hidden); boyutu yazı boyuna göredir", () => {
    const h = renderToStaticMarkup(createElement(Ikon, { ad: "duzenle" }));
    expect(h).toMatch(/^<svg\b/);
    expect(h).toContain('aria-hidden="true"');
    expect(h).toContain("lucide-pencil");
    expect(h).toContain("size-[1.15em]");
  });
});

describe("ikonlu buton bileşenleri — ikon metnin önünde, ad metinden", () => {
  it("SubmitButton", () => {
    const h = renderToStaticMarkup(createElement(SubmitButton, { ikon: "kaydet" } as ComponentProps<typeof SubmitButton>, "Kaydet"));
    expect(h).toMatch(/^<button[^>]*><svg[^>]*lucide-save[^>]*>[\s\S]*<\/svg>Kaydet<\/button>$/);
  });

  it("LinkButton", () => {
    const h = renderToStaticMarkup(createElement(LinkButton, { href: "/products/new", ikon: "yeni" } as ComponentProps<typeof LinkButton>, "Yeni Ürün"));
    expect(h).toMatch(/^<a[^>]*><svg[^>]*lucide-plus[^>]*>[\s\S]*<\/svg>Yeni Ürün<\/a>$/);
  });

  it("ConfirmSubmit", () => {
    const h = renderToStaticMarkup(createElement(ConfirmSubmit, { confirmText: "Silinsin mi?", ikon: "sil" } as ComponentProps<typeof ConfirmSubmit>, "Sil"));
    expect(h).toMatch(/^<button[^>]*><svg[^>]*lucide-trash-2[^>]*>[\s\S]*<\/svg>Sil<\/button>$/);
  });
});
