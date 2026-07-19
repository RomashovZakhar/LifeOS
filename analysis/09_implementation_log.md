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

**Статус:** ⏳ на ревью (2026-07-20)

### Сделано

| Экран | Поведение |
|-------|-----------|
| H7 Detail | Symbol ordinary → meta, range chips (fill), ЗАПИСИ, heatmap (~17 нед), список по месяцам, ИЗМЕНИТЬ / УДАЛИТЬ |
| H7 Edit | NewTrackerSheet в edit: type locked, СОХРАНИТЬ |
| H7 Delete | confirm sheet → cascade entries → home |
| H7 entry | tap heatmap cell / history row → тот же entry sheet |
| Guards | portal → `/workout`; checklist → `/` (ждёт Phase 2 C1) |
| H8 Settings | Оформление › · Экспорт + toast «Файл готов» |
| H9 Appearance | Тёмная / Светлая → settings.theme |

### Проверить на ревью

1. Detail vs `photo_24`/`25` (heatmap, chips fill, actions).  
2. Range меняет count + list; heatmap — последние ~4 мес.  
3. ИЗМЕНИТЬ / УДАЛИТЬ cascade.  
4. Settings → Appearance; Export toast.  
5. Checklist/portal Symbol не открывают ordinary detail.

### Следующее после approve

Phase 2 Checklist (C1/C2) · Phase 3 Workouts · H6b.
