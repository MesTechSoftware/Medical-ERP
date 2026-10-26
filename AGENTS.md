<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Doküman haritası

Bütün proje dokümanları **`docs/`** altındadır (18.09.2026'da kök dizinden taşındı). Metinlerde
yolsuz geçen `KARARLAR.md` gibi atıflar `docs/KARARLAR.md` demektir.

| Dosya | Ne için | Ne zaman oku |
|---|---|---|
| `docs/YOL_HARITASI.md` | **Ana plan** — faz sırası, belge rejimi, çıkış kriterleri | **Önce bunu.** Her yeni işin başlangıcı |
| `docs/PROJE_DURUMU.md` | Sistemin bugünkü fiili durumu | "Şu an ne var?" sorusunda |
| `docs/KARARLAR.md` | Ticari/kapsam kararlarının ana kitabı (~5100 satır, 13.10.2026) | *Neden* böyle sorusunda — **grep'le, baştan sona okuma** |
| `docs/KABUL_KRITERLERI.md` | Doğrulanabilir davranış cümleleri — numara karar kimliğinden (`A-3-1`); karar içermez | 1B'de bir işe başlarken (kriter testten önce yazılır) |
| `docs/FAZ1_UYGULAMA_KAPSAMI.md` | Faz 1'in commit commit iş dökümü | Faz 1 kodu yazarken |
| `docs/IS_AKISI_OZETI.md` | İş mantığı, iş diliyle (kod değil) | Domain'i anlamak için |
| `docs/SOZLESME_EKI.md` | C-1 teyit/bilgilendirme metni — sözleşme eki taslağı; karar içermez | Canlıya geçiş ön koşullarında |
| `docs/adr/` | Mimari "**nasıl**" kararları (ADR-001…006 ve 008…010; **007 numarası boş** — taslak yazılmadı, yeniden kullanılmaz). Dizin: `docs/adr/README.md` §4 | Mimariye dokunmadan önce |
| `docs/TRACEABILITY.md` | İzlenebilirlik matrisi (kriter × kod × test × karar) — **üretilmiş**, elle düzenlenmez: `npm run izlenebilirlik` | Bir kriterin kodunu/testini ararken |
| `docs/MEVCUT_SISTEM_DURUMU.md` · `docs/DENETIM_BULGULARI.md` · `docs/arsiv/TRACEABILITY_PRD_V2.md` | Denetim kayıtları — **dondurulmuş** | Tarihsel referans |
| `docs/arsiv/` | Yürürlükten kalkmış belgeler — `PRD_V2.md` dahil (C10, X-7); `FR-*`/`RULE-*` numaraları oradadır · `KARAR_ONERISI_2026-09-19.md` (X-16/X-17/ADR-006 önerisi; kabul kriteri taslakları 1B madde 7'de girdi olarak okunur) | Normalde **okuma** |

Karar/plan ayrımı: *ne* ve *neden* → `KARARLAR.md`; *nasıl* → `docs/adr/`; *sıra ve iş dökümü* →
plan dosyaları. Plan dosyası karar üretemez (`YOL_HARITASI.md` §7.1-A).
