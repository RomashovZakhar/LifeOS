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

**Статус:** ⏳ на ревью (2026-07-20) · polish iteration

### Сделано

| ID | Поведение |
|----|-----------|
| Home | Symbol → История; Cell/Today → сессия; completed → `x` в сетке |
| History | Stat тренировки + время; heatmap; список дней; ИЗМЕНИТЬ/УДАЛИТЬ |
| W1 | A0 hint; B «Отменить» если 0 упражнений; C без «+ Упражнение» (⋯) |
| W2 | Крупные inputs кг/повт; duration wheels мин/сек |
| Catalog | ⋯ → rename / archive / create |
| H6b | Edit duration `M:SS` |

### Проверить на ревью

1. Symbol → история (не сессия); ячейка → день.  
2. Heatmap / список → открывает сессию дня.  
3. Случайный Начать → Отменить (пусто) → A0.  
4. C: нет «+ Упражнение» на экране; есть в ⋯.  
5. Duration exercise: wheels → `40:00`; weight/reps — крупные поля.  
6. Finish → `x` в сетке; длительность — в сессии / Истории.

### Следующее после approve

Phase 4 Hardening · W6 progress per-exercise не в V1.
