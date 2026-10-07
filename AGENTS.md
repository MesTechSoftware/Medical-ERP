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
| `docs/KARARLAR.md` | Ticari/kapsam kararlarının ana kitabı (4485 satır) | *Neden* böyle sorusunda — **grep'le, baştan sona okuma** |
| `docs/KABUL_KRITERLERI.md` | Doğrulanabilir davranış cümleleri — numara karar kimliğinden (`A-3-1`); karar içermez | 1B'de bir işe başlarken (kriter testten önce yazılır) |
| `docs/FAZ1_UYGULAMA_KAPSAMI.md` | Faz 1'in commit commit iş dökümü | Faz 1 kodu yazarken |
| `docs/IS_AKISI_OZETI.md` | İş mantığı, iş diliyle (kod değil) | Domain'i anlamak için |
| `docs/adr/` | Mimari "**nasıl**" kararları (ADR-001…005) | Mimariye dokunmadan önce |
| `docs/MEVCUT_SISTEM_DURUMU.md` · `docs/DENETIM_BULGULARI.md` · `docs/TRACEABILITY.md` | Denetim kayıtları — **dondurulmuş** | Tarihsel referans |
| `docs/arsiv/` | Yürürlükten kalkmış belgeler — `PRD_V2.md` dahil (C10, X-7); `FR-*`/`RULE-*` numaraları oradadır | Normalde **okuma** |

Karar/plan ayrımı: *ne* ve *neden* → `KARARLAR.md`; *nasıl* → `docs/adr/`; *sıra ve iş dökümü* →
plan dosyaları. Plan dosyası karar üretemez (`YOL_HARITASI.md` §7.1-A).
