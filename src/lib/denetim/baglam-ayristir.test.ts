import { describe, expect, it } from "vitest";

import { istekYontemi, istemciAdresi, sayfaYolu } from "@/lib/denetim/baglam-ayristir";

// X-18-3: istek bağlamı başlıklardan ayrıştırılır (ADR-011 §8).

describe("istemciAdresi — x-forwarded-for'un en sağdaki girdisi", () => {
  it.each([
    ["10.0.0.12", "10.0.0.12"],
    ["9.9.9.9, 10.0.0.1", "10.0.0.1"],
    [" ::1 ", "::1"],
    ["::ffff:127.0.0.1", "::ffff:127.0.0.1"],
    ["9.9.9.9, 10.0.0.1, ", "10.0.0.1"],
  ])("%j → %s", (xff, ip) => expect(istemciAdresi(xff)).toBe(ip));

  it.each([null, "", "abc", "10.0.0.1, bilinmeyen", "<script>"])("geçersiz başlık (%j) boş kalır", (xff) =>
    expect(istemciAdresi(xff)).toBeNull()
  );
});

describe("sayfaYolu — Referer'ın yolu, sorgu dizesi olmadan", () => {
  it("yol kalır, sorgu dizesi ve parça atılır", () => {
    expect(sayfaYolu("http://localhost:3000/collections?aralik=ay#ust")).toBe("/collections");
    expect(sayfaYolu("https://anka.example/orders/ck123")).toBe("/orders/ck123");
  });

  it("geçersiz ya da eksik başlık boş kalır", () => {
    expect(sayfaYolu(null)).toBeNull();
    expect(sayfaYolu("")).toBeNull();
    expect(sayfaYolu("bir adres değil")).toBeNull();
  });

  it("çok uzun yol 200 karakterde kesilir", () => {
    expect(sayfaYolu(`http://x/${"a".repeat(500)}`)).toHaveLength(200);
  });
});

describe("istekYontemi", () => {
  it("server action başlığı varsa POST, yoksa boş", () => {
    expect(istekYontemi("7f3a9c")).toBe("POST");
    expect(istekYontemi(null)).toBeNull();
    expect(istekYontemi("")).toBeNull();
  });
});
