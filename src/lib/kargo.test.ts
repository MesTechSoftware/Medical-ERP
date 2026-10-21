import { describe, expect, it } from "vitest";
import { takipLinki } from "@/lib/kargo";

// D-3-1 — takip linki şablondan.
describe("takipLinki (D-3-1)", () => {
  it("{takip_no} numarayla doldurulur ve kodlanır; şablon ya da numara yoksa link yok", () => {
    expect(takipLinki("https://kargo.example/izle?no={takip_no}", "TR 123")).toBe("https://kargo.example/izle?no=TR%20123");
    expect(takipLinki(null, "TR1")).toBeNull();
    expect(takipLinki("https://kargo.example/", "TR1")).toBeNull();
    expect(takipLinki("https://kargo.example/{takip_no}", "")).toBeNull();
  });
});
