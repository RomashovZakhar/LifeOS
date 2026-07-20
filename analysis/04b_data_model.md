# 04b — Data model (LifeOS)

**Входы:** DATA.md, TECH.md, `04_information_architecture.md` (утверждён), 01–03  
**Дата:** 2026-07-19  
**Статус:** ✅ утверждён (2026-07-19) — одна итоговая модель; IA / PRODUCT / DATA согласованы

Пользователь не эксперт по схемам: агент сам прогнал критику (§1) и предлагает одну схему, в которой уверен (§10).

---

## 1. Самокритика → решения

| Риск | Плохой путь | Выбранный путь |
|------|-------------|----------------|
| Длительность и в `Entry`, и в `Session` разъедутся | Дублировать Habit Entry для портала | **Ячейка портала = presence** completed session (`x`). `durationSeconds` на сессии для UI/истории. Отдельного Entry у WorkoutPortal **нет** |
| Смена пунктов чеклиста ломает старые % | Считать % от «текущего» набора всегда | **Снимок дня** `ChecklistDay`: набор пунктов на этот день фиксируется; % только из снимка |
| `·` vs `0%` | Путать | `doneCount === 0` → UI `·`; иначе процент (как IA) |
| Cascade портала убивает справочник упражнений | Удалить Exercise/Template вместе с порталом | Cascade: **сессии** (+ их подходы). Каталог Exercise + Templates **живут** — пригодятся, если портал создадут снова |
| Даты и TZ | Хранить всё в UTC Date | Календарный день = строка **`YYYY-MM-DD` в локали устройства** на момент записи; не «день UTC» |
| localStorage на годы | Квота / тормоза | **IndexedDB** (+ обёртка Dexie или idb) |
| Count `0` vs нет записи | Nullable number | Нет строки Entry = `·`; Entry с `0` = валидно |
| Type сменить нельзя | Поле type editable | `type` immutable; смена = новый трекер |
| Вложенные массивы vs нормализация | Всё в одном JSON-blob | **Гибрид:** плоские object stores + индексы; подходы — вложенно в сессии (читаются всегда вместе) |

Эти решения считаю правильными для V1 offline-first. Если не согласен — правь до апрува.

---

## 2. Хранилище

| Решение | Выбор |
|---------|--------|
| Движок | **IndexedDB** |
| Доступ из кода | Dexie (предпочтительно) или `idb` — на implementation |
| Settings мелочь | Можно в том же IDB store `settings` (не localStorage), чтобы Export был одним дампом |
| Версия схемы | `schemaVersion: number` в settings; миграции на upgrade Dexie |
| Export | JSON-документ всех stores (обязателен по IA) |
| Import V1 | Опционально позже; Export достаточно для бэкапа вручную |

Почему не SQLite/wasm в V1: лишний вес; IDB хватает для объёма «годы × десятки колонок × сессии».

---

## 3. Идентификаторы и время

- **id:** UUID v4 (или ULID) — строки.  
- **date:** `YYYY-MM-DD` — календарный день пользователя.  
- **instants:** ISO-8601 UTC (`startedAt`, `createdAt`, …) для секундомера и аудита.  
- **Сетка / запрет future:** сравнивать `date` с «сегодня» в local TZ на клиенте (не поле БД).

---

## 4. Сущности

### 4.1 `settings` (singleton, id = `"app"`)

| Поле | Тип | Смысл |
|------|-----|--------|
| `schemaVersion` | number | Миграции |
| `theme` | `'dark' \| 'light'` | Appearance |
| `lastViewedMonth` | `YYYY-MM` | Restore UI |
| `lastSelectedDate` | `YYYY-MM-DD` | Restore UI |
| `locale` | `'ru'` | Зафиксировано V1 |

### 4.2 `trackers`

Колонки Habits home.

| Поле | Тип | Смысл |
|------|-----|--------|
| `id` | string | PK |
| `name` | string | Отображаемое имя |
| `symbol` | string | ≤5; unique среди trackers (case-insensitive) |
| `type` | TrackerType | **immutable** |
| `sortOrder` | number | Порядок колонок |
| `createdAt` | string ISO | |
| `config` | object | Зависит от type (см. ниже) |

**TrackerType:**

```text
completion | time | count | distance | weight | workout_portal | checklist
```

**config по type:**

| type | config |
|------|--------|
| `completion` | `{}` |
| `time` | `{ timeFormat: '24h' \| 'ampm' }` — default `'24h'` для RU |
| `count` | `{ unit?: string }` |
| `distance` | `{ unit: string }` — default `'km'` |
| `weight` | `{ unit: string }` — default `'kg'` |
| `workout_portal` | `{}` — **инвариант: ≤1** такой tracker |
| `checklist` | `{}` — пункты в `checklist_items` |

**Инварианты:**

- Не более одного `workout_portal`.  
- Notes отсутствует.  
- Удаление `workout_portal` → cascade §6.  
- Удаление `checklist` → cascade checklist_items + checklist_days.

### 4.3 `entries`

Записи **обычных** трекеров (не portal, не checklist %).

| Поле | Тип | Смысл |
|------|-----|--------|
| `id` | string | PK |
| `trackerId` | string | FK → trackers |
| `date` | `YYYY-MM-DD` | День |
| `value` | EntryValue | См. ниже |
| `updatedAt` | string ISO | |

**Уникальный индекс:** `(trackerId, date)` — одна запись на день.

**EntryValue (дискриминированный union):**

```ts
type EntryValue =
  | { kind: 'completion' }                         // факт наличия = сделано
  | { kind: 'time'; minutesOfDay: number; nextDay: boolean }  // 0..1439; nextDay как в эталоне
  | { kind: 'count'; value: number }               // number, включая 0
  | { kind: 'distance'; value: number }            // unit в tracker.config
  | { kind: 'weight'; value: number }
```

**Правила:**

- Нет row → `·` в UI.  
- Uncheck completion → **delete** row.  
- `kind` должен соответствовать `tracker.type` (проверка в write-path).  
- Для `workout_portal` / `checklist` rows в `entries` **не создаются**.

### 4.4 Checklist

#### `checklist_items` (текущее определение)

| Поле | Тип | Смысл |
|------|-----|--------|
| `id` | string | PK — стабильный id; после delete строки в старых `checklist_days.lines` могут ссылаться на уже несуществующий id — это ок |
| `trackerId` | string | FK checklist tracker |
| `title` | string | |
| `sortOrder` | number | Drag |

**Удаление пункта:** hard delete из `checklist_items`.  
**Не** каскадить в `checklist_days` — снимки и % прошлого не меняются (07).

#### `checklist_days` (снимок + прогресс дня)

| Поле | Тип | Смысл |
|------|-----|--------|
| `id` | string | PK |
| `trackerId` | string | |
| `date` | `YYYY-MM-DD` | |
| `lines` | ChecklistDayLine[] | Снимок |
| `updatedAt` | string ISO | |

```ts
type ChecklistDayLine = {
  itemId: string
  title: string      // копия на момент попадания в день (история читаема)
  checked: boolean
}
```

**Уникальный индекс:** `(trackerId, date)`.

**Жизненный цикл (важно):**

1. День ещё не открывали и ничего не отмечали → **нет** `checklist_days` → сетка `·`.  
2. Первое открытие дня / первая галочка → создать день: `lines` = все текущие items трекера (title скопировать), `checked: false`, затем выставить галочку.  
3. Пока `lines.every(l => !l.checked)` → UI сетки всё ещё `·` (IA).  
4. Хотя бы один `checked` → UI показывает `round(100 * done / lines.length)`.  
5. Позже в определение добавили пункт → при следующем открытии **сегодняшнего** дня: дописать новые lines; **прошлые** `checklist_days` не трогать.  
6. Пункт **удалили** (hard delete) → из определения пропал; **прошлые дни не трогаем**; у сегодня: убрать line если `!checked`, иначе оставить (факт «сделал»).  
7. Округление %: `Math.round` до целого — в 07.

Так история % не пересчитывается задним числом при смене набора.

### 4.5 Workouts

#### `exercises` (справочник)

| Поле | Тип | Смысл |
|------|-----|--------|
| `id` | string | PK |
| `name` | string | |
| `trackingMode` | `'weight_reps' \| 'reps_only' \| 'duration'` | immutable после первого set? **V1: immutable after create** (как type трекера) — проще |
| `createdAt` | string ISO | |
| `archivedAt` | string ISO \| null | мягкое скрытие из picker |

#### `workout_templates`

| Поле | Тип | Смысл |
|------|-----|--------|
| `id` | string | PK |
| `name` | string | |
| `exerciseIds` | string[] | Порядок |
| `updatedAt` | string ISO | |

Не привязаны к portal tracker id.

#### `workout_sessions`

| Поле | Тип | Смысл |
|------|-----|--------|
| `id` | string | PK |
| `date` | `YYYY-MM-DD` | **unique** — одна сессия на день |
| `status` | `'in_progress' \| 'completed'` | |
| `startedAt` | string ISO | Старт секундомера |
| `pausedAt` | string ISO \| null | null = тикает; иначе момент постановки на паузу |
| `pauseAccumulatedSeconds` | number | Сумма завершённых пауз (сек); default 0 |
| `endedAt` | string ISO \| null | |
| `durationSeconds` | number \| null | null пока in_progress; после finish = elapsed или ручной ввод; **редактируемо**; UI сессии / История (**не** глиф — там `…`/`x`) |
| `templateId` | string \| null | Откуда стартовали (для «Обновить шаблон?») |
| `exercises` | SessionExercise[] | Вложено |
| `updatedAt` | string ISO | |

```ts
type SessionExercise = {
  id: string
  exerciseId: string
  sortOrder: number
  sets: SessionSet[]
}

type SessionSet = {
  id: string
  sortOrder: number
  weightKg?: number      // weight_reps
  reps?: number          // weight_reps | reps_only
  durationSeconds?: number // duration mode
}
```

**Инварианты write-path:**

- Finish запрещён, если нет ни одного упражнения **или** нет ни одного set (строго: ≥1 exercise и ≥1 set суммарно — зафиксируем: **≥1 exercise с ≥1 set**).  
- Пока `in_progress`, в ячейке глиф `…` (не duration).  
- Таймер: `elapsed = floor((t - startedAt)/1000) - pauseAccumulatedSeconds`, где `t = pausedAt ?? now`. Пауза/resume и kill — см. `06_workout_module.md`.  
- После `completed`, правка `durationSeconds` не требует трогать Habit Entry.  
- «Прошлый раз»: последняя `completed` сессия с `date < current` (или `< today`), где есть `exerciseId`, взять sets этого SessionExercise.  
- «Обновить шаблон?» на finish: если `templateId` set **и** ids/порядок сессии ≠ `template.exerciseIds` → confirm → заменить на порядок `exercises[].exerciseId`.

**Проекция в Habits grid для `workout_portal`:**

```text
session = byDate(date)
if session?.status === 'completed' → 'x'
else if session?.status === 'in_progress' → '…'
else → ·
```

`durationSeconds` остаётся на сессии для W1 / Истории / правки — не глиф сетки.
---

## 5. Связи (схема)

```text
settings (1)

trackers 1──* entries              (только ordinary types)
trackers 1──* checklist_items      (type=checklist)
trackers 1──* checklist_days       (type=checklist)

exercises 1──* (referenced by) workout_templates.exerciseIds
exercises 1──* (referenced by) workout_sessions.exercises[].exerciseId

workout_templates 0..1 ──* workout_sessions (templateId)

workout_portal tracker ──presence── completed workout_sessions (glyph `x`)
                       └──duration── session.durationSeconds (UI / история)
         (логическая связь; без FK row в entries)
```

---

## 6. Cascade / delete

| Действие | Эффект |
|----------|--------|
| Delete ordinary tracker | Delete all its `entries` |
| Delete checklist tracker | Delete `checklist_items` + `checklist_days` этого tracker |
| Delete workout_portal tracker | Delete **all** `workout_sessions`; **не** удалять `exercises` / `workout_templates` |
| Delete checklist item | Hard delete item row; **не** трогать `checklist_days` |
| Delete / archive exercise | V1: только archive exercise (`archivedAt`); hard delete не нужен |

---

## 7. Derived UI (не хранить отдельно)

| UI | Откуда |
|----|--------|
| Month grid cell ordinary | `entries` by tracker+date |
| Month grid cell portal | `workout_sessions` projection |
| Month grid cell checklist | `checklist_days`: · если нет дня или done=0; else % |
| Today rows | trackers sorted + values as above |
| ENTRIES count на detail | count entries for tracker in range |
| Heatmap | presence of entry / checklist done>0 / session completed |

Не денормализовать % в `trackers` — дешёвый compute.

---

## 8. Export JSON (формат)

```json
{
  "exportedAt": "ISO",
  "schemaVersion": 1,
  "settings": {},
  "trackers": [],
  "entries": [],
  "checklist_items": [],
  "checklist_days": [],
  "exercises": [],
  "workout_templates": [],
  "workout_sessions": []
}
```

Один файл = полный бэкап. CSV не нужен в V1 (закрывает отложенный вопрос IA §13).

---

## 9. Миграции

- Стартуем с `schemaVersion: 1`.  
- Любое изменение stores → bump + функция migrate в Dexie `upgrade`.  
- Export всегда включает `schemaVersion` для будущих import.

---

## 10. Вердикт агента

**Уверенность: высокая для V1.**

Модель покрывает:

- все типы привычек без Notes;  
- `0` vs отсутствие;  
- portal без рассинхрона Entry/Session;  
- одну сессию/день, шаблоны, подходы трёх режимов, прошлый раз;  
- чеклист с эволюцией пунктов и живой историей %;  
- cascade портала;  
- годы в IndexedDB;  
- полный Export;  
- dark/light в settings.

Сознательные упрощения (ок для V1): нет multi-device sync; нет hard-delete exercise; нет отдельной таблицы sets (вложено в session).  
Дополнение 2026-07-19: пауза таймера — поля `pausedAt` + `pauseAccumulatedSeconds` (по решению 06).  
Дополнение 2026-07-19: checklist items — hard delete без `archivedAt`; снимки дней сохраняют историю % (07).

---

## 11. Согласование артефактов (сделано 2026-07-19)

| Файл | Правка |
|------|--------|
| `analysis/04_information_architecture.md` | Проекция длительности; снимок % + формула; cascade = только sessions |
| `docs/PRODUCT.md` | Morning → Checklist (с пометкой об истории имени) |
| `docs/DATA.md` | Статус: модель утверждена, ссылка на этот файл |

---

## 12. Утверждено

**Источник правды для persistence V1 — этот документ целиком (§2–§9).**

Пользователь утвердил 2026-07-19 вместе с синхронизацией IA / PRODUCT / DATA.

Краткие инварианты:

1. IndexedDB, `schemaVersion`, Export JSON всех stores.  
2. Ordinary trackers → `entries`; portal/checklist **не** пишут ordinary entries.  
3. Workout grid cell ← `…` in_progress / `x` completed (duration на сессии).  
4. Checklist % ← snapshot `checklist_days`; `·` если done=0.  
5. Delete portal → delete sessions; keep exercises + templates.  
6. Type / trackingMode immutable after create.  
7. One session per `YYYY-MM-DD`.
