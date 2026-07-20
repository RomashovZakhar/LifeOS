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

**Статус:** ⏳ на ревью (2026-07-20) · UI: sheets поверх home

### Сделано

| ID | Поведение |
|----|-----------|
| Home | Duration `M:SS` для completed; Symbol/cell/Today → `/?workout=date` sheet |
| W1 | Tall sheet A0/A1/B/C; Start / Finish; timer+pause; drag; ⋯; update-template |
| W4/W5 | Nested sheets: подходы, каталог, шаблоны, редактор |
| Catalog | ⋯ → Каталог: rename / archive / create; W3 без archive UI |
| H6b | Edit duration sheet с W1-C |
| Routes | `/workout*` → redirect на `/?workout=` |

### Проверить на ревью

1. Portal → sheet (не full page); swipe/✕/backdrop → home.  
2. Начать → + упражнение → подходы → Закончить → `M:SS` в сетке.  
3. Nested: W2/W3/templates поверх W1; закрытие nested не рвёт сессию.  
4. **Delete confirm** поверх nested (упражнение / шаблон / сессия / портал) — кнопки кликабельны.  
5. Пауза / длительность `M:SS`; из шаблона; drag; future locked.  
6. ⋯ rename/delete portal; delete session → `·`.  
7. ⋯ Каталог → rename / УБРАТЬ (archive) → нет в W3; прошлые сессии ок.

### Следующее после approve

Phase 4 Hardening · W6 не в V1.
