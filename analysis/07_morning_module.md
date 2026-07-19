# 07 — Checklist module (LifeOS)

**Файл по оркестратору:** `07_morning_module.md` *(продуктово — Checklist, ex-Morning)*  
**Входы:** 01–06, 04b (утверждены); PRODUCT, VISION, ANTI_GOALS  
**Дата:** 2026-07-19  
**Статус:** ✅ утверждён (2026-07-19; Q1–Q3 в §11; hard delete + sheet)  
**Язык UI:** русский  

Именованный чеклист с % в сетке Habits. Не «только утро», не стрики, не давление.

---

## 1. Scope

### Входит


| ID  | Экран               | Вход                                |
| --- | ------------------- | ----------------------------------- |
| C1  | Устройство чеклиста | Tap Symbol колонки                  |
| C2  | День чеклиста       | Tap ячейки / Today-строки           |
| —   | Create колонки      | Habits H3 type «Чеклист» (уже в 05) |


### Не входит

- Внутренности Workouts / ordinary habit sheets  
- Геймификация, «не пропусти утро», напоминания-push  
- Пункты не boolean (числа/время внутри пункта) — только да/нет

---

## 2. Принципы

1. Язык эталона: detail-каркас, Today-rows, danger delete, drag как в Workouts W1.
2. Symbol = **устройство** (определение + история колонки).
3. Ячейка / Today = **день** (галочки → %).
4. История % живёт в снимках `checklist_days` (04b); смена пунктов не переписывает прошлое.
5. Сетка: `·` при `done === 0`; иначе `Math.round(100 * done / lines.length)%`.
6. Future day — без записи.
7. Спокойствие: 0% / пустой день не стыдят.

---

## 3. Вход и навигация


| Жест Habits      | Экран       | Контекст          |
| ---------------- | ----------- | ----------------- |
| Symbol           | C1 Device   | trackerId         |
| Cell / Today row | C2 Day      | trackerId + date  |
| ✕ / back         | Habits home | тот же месяц/день |


Route-дух: `/t/:trackerId` (device); C2 — overlay sheet.  
**Решение 07:** C2 — **bottom sheet** (как entry sheets привычек); ✕ / tap вне / swipe down → dismiss (жесты как Today в 05).  
Из C1 (история) → C2 sheet; close sheet → обратно на C1. С home → close sheet → home.

---

## 4. Экраны

### C1 — Устройство чеклиста

```text
✕
{Name}
Symbol · Чеклист · Создано {date}

[ Неделя | Месяц | Год | Всё время ]     ← как H7 range chips

Сводка
  ЗАПИСИ с прогрессом     {count дней где done>0}
  или средний % за период — V1: только count дней с done>0 (как ENTRIES)

History
  heatmap (день «закрашен» если done>0)
  список дней: «19 июл · 60%»  → tap → C2(date)

Пункты
  ≡  Вода          [удалить]
  ≡  Зарядка
  ≡  Медитация
  [+ Пункт]

ИЗМЕНИТЬ          УДАЛИТЬ
```

**ИЗМЕНИТЬ** → форма Name + Symbol (type readonly «Чеклист»), как H7 edit без смены type.  
**УДАЛИТЬ** → confirm («Удалится чеклист и история дней») → cascade tracker + items + days (04b).

**Пункты (определение):**

| Жест | Эффект |
|------|--------|
| Drag ≡ | `sortOrder` |
| Tap title | inline rename / sheet rename |
| Swipe или ⋯ | **Удалить** пункт из определения (hard delete) + confirm |
| + Пункт | sheet: название → create item, append sortOrder |

**Удаление пункта:** строка удаляется из `checklist_items`.  
**`checklist_days` не трогаем** — прошлые снимки и % остаются.  
На **сегодняшнем** снимке: при следующем merge/open убрать line этого itemId, если `!checked`; если `checked` — оставить в снимке дня (факт «сделал»), но пункта больше нет в C1.  
Пустой список пунктов: «Добавьте пункты»; heatmap пустой ок.

**Heatmap / list:** день с `checklist_days` и `done>0`; дни только с `·` логикой не светятся. Tap дня в списке → C2.

**Range chips:** фильтр history/heatmap; определение пунктов всегда fully shown ниже (не зависит от range).

---

### C2 — День чеклиста (bottom sheet)

```text
{Name}                              ✕
{19 июля}          ← при done>0 можно «19 июля · 60%»; при done=0 — только дата

lines:
  ☑  Вода
  ☐  Зарядка
  ☐  Медитация

(empty: нет пунктов в определении и нет day — «Сначала добавьте пункты»)
```

#### Открытие дня (`ensureDay`)

1. Если `date > today` → read-only; нет record → hint «Нельзя отметить будущий день».  
2. Если нет `checklist_days`:  
   - взять все текущие `checklist_items` трекера,  
   - создать day: `lines = [{itemId, title, checked:false}, …]` по `sortOrder`,  
   - если items пусты — **не создавать** day; empty + путь в C1.  
3. Если day есть и `date === today`: merge — для каждого item без line дописать `{checked:false}`; lines чьих itemId больше нет в определении и `!checked` — убрать; lines удалённых itemId с `checked` — **оставить** (история дня).  
4. Если day есть и `date < today`: **не merge** — снимок as-is (в т.ч. пункты, которых уже нет в определении).

#### Toggle пункта

| Условие | Эффект |
|---------|--------|
| Future | no-op + hint |
| date ≤ today | flip `checked`; autosave; пересчёт % |
| Uncheck последнего | done=0 → сетка `·`; day в IDB остаётся |

**UI:** checkbox + title; checked → dim + strikethrough.  
**Autosave**, без СОХРАНИТЬ.  
**Header:** done=0 → **только дата** (без «0%»); сетка Habits при done=0 всегда `·`.

---

## 5. Отображение в Habits (напоминание)


| Место     | Значение                                                            |
| --------- | ------------------------------------------------------------------- |
| Cell      | `·` / `N%`                                                          |
| Today row | name + trailing `%` или пусто; tap → C2; **не** Completion checkbox |


Несколько checklist-колонок — независимые trackerId.

---

## 6. Create / Edit / Delete


| Сущность           | Create                   | Edit            | Delete             |
| ------------------ | ------------------------ | --------------- | ------------------ |
| Checklist tracker  | Habits H3                | C1 ИЗМЕНИТЬ     | C1 УДАЛИТЬ cascade |
| Item (определение) | C1 + Пункт               | rename          | **hard delete** (снимки дней не трогаем) |
| Day / lines        | ensureDay on open/toggle | toggle autosave | вместе с tracker   |


---

## 7. Empty / edge


| Case                     | Поведение                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| Новая колонка, 0 пунктов | C1 empty items; C2 → «добавьте пункты»                                                                    |
| Все пункты удалены       | C1 пуст; старые дни со снимками/% ок                                                                      |
| Удалили пункт с checked сегодня | line остаётся в сегодняшнем снимке до uncheck/merge-правил; % не пересчитывается задним числом на прошлых днях |
| Первый check             | создать day + % в сетке                                                                                   |
| Uncheck all              | сетка `·`, day остаётся                                                                                   |
| Future                   | read-only                                                                                                 |
| Rename item              | новые дни / merge сегодня берут новый title; прошлые снимки — старый title в line                         |
| Drag order               | только активные в C1; на C2 порядок = order lines в снимке (при create = sortOrder; merge append в конец) |
| Два чеклиста             | полностью раздельно                                                                                       |
| Offline                  | полный CRUD                                                                                               |
| Kill mid-toggle          | последнее успешное IDB write; как Habits                                                                  |


---

## 8. Progressive disclosure

1. Создал «Чеклист» на home → Symbol → + пункты.
2. Сегодня → ячейка/Today → галочки.
3. История на C1 — когда любопытно.
4. Нет онбординга «утро».

---

## 9. Стыковка


| Модуль   | Связь                             |
| -------- | --------------------------------- |
| Habits   | Колонка, %, жесты; create type    |
| Workouts | Нет общих данных                  |
| 04b      | items hard delete; days snapshots; без archivedAt у checklist items |


---

## 10. Копирайт (RU)


| Ключ                 | Текст                            |
| -------------------- | -------------------------------- |
| Type                 | Чеклист                          |
| Items section        | Пункты                           |
| Add item             | Пункт                            |
| Delete item          | Удалить пункт                    |
| Edit / Delete column | ИЗМЕНИТЬ / УДАЛИТЬ               |
| Entries-like         | ДНИ С ПРОГРЕССОМ (или «ДНИ»)     |
| History              | История                          |
| Empty items          | Добавьте пункты                  |
| Future               | Нельзя отметить будущий день     |
| Range                | Неделя / Месяц / Год / Всё время |
| Delete confirm       | Удалить чеклист и историю?       |


---

## 11. Решения по уточнениям (2026-07-19)

| ID | Тема | Решение |
|----|------|---------|
| Q1 | C2 UI | **Bottom sheet** |
| Q2 | Удаление пункта | **Hard delete** из определения; `checklist_days` не трогаем → старые % целы |
| Q3 | Header C2 при done=0 | **Только дата** |

Блокеров для апрува 07 нет. Согласовано с правкой 04b (убран `archivedAt` у checklist items).

---

## 12. Шпаргалка

```text
Symbol → device (items drag, history, edit/delete column)
Cell/Today → day sheet · checks · autosave · snapshot
Grid · then N% · no shame · no streaks · not morning-only
Future locked · hard delete items · past snapshots keep % · cascade delete column
```

