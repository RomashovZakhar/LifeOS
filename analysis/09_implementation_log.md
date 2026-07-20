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

Включая polish: detail sheet + sticky header, heatmap contrast/width, MonthGrid day-rail (без наезда символов), Time wheel ближе к центру (Apple-like).

---

## Phase 2 — Checklist (C1/C2)

**Статус:** ⏳ на ревью (2026-07-20)

### Сделано

| Экран | Поведение |
|-------|-----------|
| Home | Cell / Today → C2 day sheet; Symbol → C1 device (`?detail=`); `%` / `·` уже в сетке |
| C1 Device | Meta, range chips, ДНИ (done>0), heatmap, история «19 июл · 60%», пункты drag/rename/delete, + Пункт, ИЗМЕНИТЬ / УДАЛИТЬ cascade |
| C2 Day | ensureDay + merge today; toggle autosave; done=0 → только дата; future locked; empty → «Сначала добавьте пункты» |
| Data | `checklist.ts`: hard delete items (дни не трогаем); snapshot % |

### Проверить на ревью

1. Symbol чеклиста → C1; ячейка/Today → C2 (не Completion).  
2. + пункты → сегодня отметить → сетка `N%`; uncheck all → `·`.  
3. Удалить пункт → прошлые дни/% целы; сегодня merge.  
4. Drag порядка; история + heatmap → C2.  
5. Удалить колонку → cascade items+days.

### Следующее после approve

Phase 3 Workouts · H6b.
