# 09 — Implementation log

**Старт:** 2026-07-19  
**Порядок:** по `analysis/08_consistency.md`  
**UI bar:** дизайнер; сверяться со `analysis/screenshots/` самостоятельно

---

## Phase 0 — Foundation

**Статус:** ✅ утверждён

---

## Phase 1.1 — H0 / H1 MonthGrid

**Статус:** ✅ утверждён

---

## Phase 1.2 — H3 New tracker

**Статус:** ✅ утверждён (2026-07-19)

---

## Phase 1.3 — H2 Today + entry sheets

**Статус:** ✅ утверждён (2026-07-20)

---

## Phase 1.4 — H7 Detail + H8/H9 Settings

**Статус:** ✅ утверждён (2026-07-20)

---

## Phase 2 — Checklist (C1/C2)

**Статус:** ✅ утверждён (2026-07-20)

---

## Phase 3 — Workouts

**Статус:** ✅ утверждён (2026-07-20)

Sheets поверх home · History · Session · `…`/`x` · templates · update template? при отличии · B tap timer → finish with duration.

---

## Phase 4 — Hardening

**Статус:** ✅ утверждён (2026-07-20)

ViewState restore · timer kill/resume · cascades · symbol/portal write-path · in_progress glyph · manual finish duration.

### Deploy

GitHub Pages (`/LifeOS/`): workflow `.github/workflows/deploy-pages.yml`. URL после включения Pages: `https://RomashovZakhar.github.io/LifeOS/`.

### Post-V1 polish (2026-07-21)

- Settings → sheets (root / Трекеры / Оформление); `/settings*` → query redirect.
- Outer viewport scroll locked; only MonthGrid `.grid-scroll` scrolls (dock fixed).
- iOS PWA height: standalone uses `100vh`/`100lvh` + `position:fixed; inset:0` (not dvh/visualViewport — WebKit #254868); safe-area on dock.
- Sheet dismiss не перехватывает `.wheel` (time / duration).
- Dock: safe-bottom padding on `.bottom` (not empty shell gap).
- Settings → Трекеры: Sortable reorder колонок.
- Сетка: selected day скроллится к середине видимой зоны.

V1 queue закрыта (08). Вне V1: import, sync, push, Notes, W6, system theme follow.
