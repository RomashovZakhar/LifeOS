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

Sheets поверх home · History · Session · `…`/`x` · programs/catalog in Symbol detail · A0: ВЫБРАТЬ ПРОГРАММУ / Пустая · day без ⋯ · C без +упражнение · UI «программа» (= template).

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
- Workout IA (2026-07-21): Symbol/detail = Программы + Каталог + rename/delete колонки; день без ⋯; A0 primary «ВЫБРАТЬ ПРОГРАММУ»; C без add exercise; UI «шаблон»→«программа».

V1 queue закрыта (08). Вне V1: sync, Notes, W6, system theme follow, import merge. Напоминания — отдельный пост-V1 пункт ниже.

### Import (2026-07-27)

Settings → Импорт данных: replace из LifeOS export JSON (`src/db/import.ts`), confirm перед wipe.

### Cold start → сегодня + Today (2026-08-03)

PWA reload / первый mount home: месяц=сегодня, selected=сегодня, scroll, открыть H2. Warm resume без изменений. Не форсить поверх settings/detail/workout/new.

---

## Post-V1 — H7 stats + trend chart (2026-07-27)

**Спека:** `analysis/10_detail_stats.md`  
**Эталон cards:** `analysis/screenshots/photo_26.png`

- time / count / distance / weight: Unit meta (где уместно) → 2×2 StatGrid → uPlot line+points → heatmap + list.
- completion: без chart/2×2 (только ЗАПИСИ).
- Pure aggregates: `src/lib/detailStats.ts`.

### Cold start → Today (2026-08-03)

PWA full load = СЕГОДНЯ + open H2 + scroll to today. Warm resume (no reload) keeps in-memory state. Skip forcing Today if `settings`/`detail`/`workout`/`new` query present.

---

## Post-V1 — напоминания (2026-09-27)

Настройки → Уведомления: текст, время, дни. Расписание в `settings.reminders`. Доставка закрытого приложения — Cloudflare Worker `push-worker/` (Web Push). Подписка телефона только в localStorage, не в экспорте.
