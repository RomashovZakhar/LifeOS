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

Sheets поверх home · History (Symbol) · Session (Cell/Today) · `…`/`x` · templates/catalog · update template? только при отличии состава · B tap timer → finish with duration.

---

## Phase 4 — Hardening

**Статус:** ⏳ на ревью (2026-07-20)

Большая часть 18–19 уже в коде Phases 1–3; дожаты write-path инварианты.

### Сделано / проверено в коде

| Order | Что | Статус |
|------|-----|--------|
| 18 | `lastViewedMonth` / `lastSelectedDate` restore + write-back | ✅ |
| 18 | Timer kill/resume: wall-clock + pause fields (нет auto-pause on blur) | ✅ |
| 19 | Cascade deletes (ordinary / checklist / portal→sessions) | ✅ |
| 19 | Symbol collision UI + **write-path** `create`/`update` | ✅ |
| 19 | ≤1 workout_portal UI + **write-path**; helper «Уже добавлена» | ✅ |
| 20 | PWA / Apple meta / standalone | ✅ infra |
| — | B: tap timer → задать длительность + завершить; grid `…` in_progress | ✅ |
| — | W6 | не в V1 |

### Проверить на ревью (ты)

1. Перезагрузка → месяц/день как до ухода.  
2. In-progress тренировка: закрыть вкладку / убить PWA → вернуться: таймер тикает (если не на паузе) или стоит (если пауза).  
3. Удалить portal / checklist / ordinary → данные каскадом уходят как в 04b.  
4. Дубликат Symbol → блок; второй «Тренировка» → chip disabled.  
5. **Smoke на устройстве (20):** iPhone → Add to Home Screen → Airplane Mode → home / checklist / workout CRUD.  
6. In-progress → сетка `…`; tap таймер → `45:00` → completed + `45:00` (не wall-clock).

### Следующее после approve

V1 queue закрыта (08). Вне V1: import, sync, push, Notes, column reorder, W6, system theme follow.
