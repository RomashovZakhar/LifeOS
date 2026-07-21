# 04 — Information architecture (LifeOS)

**Входы:** PRODUCT, VISION, ANTI_GOALS, TECH, DATA; analysis 01–03; решения пользователя 2026-07-19  
**Дата:** 2026-07-19  
**Статус:** ✅ утверждён (2026-07-19; hub + portals; уточнения под 04b — проекция длительности, снимок %, cascade)

Не новый язык дизайна. **Корень = Habits-сетка эталона**; Workouts и Checklist — полноценные вложенные модули с входом через Symbol (тот же жест, что detail у обычной привычки).

> **Именование:** в PRODUCT и docs — **Checklist** (раньше Morning). Любое имя колонки, не только «утро». Промпт/файл шага 07 могут ещё называться `morning` — продуктово это Checklist.

---

## 1. Цели IA

1. Один дом (Habits-grid), три возможности V1: обычные привычки, тренировки, чеклисты — без ощущения трёх разных приложений в таббаре.
2. Тот же язык: MonthGrid, Today, sheets, detail-pattern, dock; модули расширяют, не ломают.
3. ≤ 3 тапа до типичной записи; offline = полный CRUD; спокойные empty states.
4. Порталы **опциональны**: пользователь может не создавать workout/checklist колонки — модули всё равно есть в продукте, вход появляется с колонкой.
5. Не Notion / Todoist / Strong-bloat / Health / Habitica (ANTI_GOALS). Workouts — полноценный, но узкий scope.

---

## 2. Ментальная модель (утверждено)

```text
LifeOS
└── Habits home (MonthGrid + Today + dock)     ← единственный «корень»
    ├── Tracker (обычный)     → тип Completion|Time|Count|Distance|Weight
    │     tap Symbol          → Tracker detail (эталон)
    │     tap day / Today     → log / checkbox / sheet
    │
    ├── Tracker (workout portal)  → тип WorkoutPortal  [max 1 на app]
    │     ячейка дня          → `…` in_progress / `x` completed / иначе ·
    │     длительность        → на сессии / в Истории (не глиф сетки)
    │     tap Symbol          → модуль Workouts (день из выбранной строки)
    │     tap day / Today     → НЕ Completion; вход в сессию дня / edit длительности сессии
    │     значение в сетке    → ТОЛЬКО длительность (нет отдельной Habit Entry; источник = Session)
    │
    └── Tracker (checklist)   → тип Checklist  [N штук, любое Name/Symbol]
          ячейка дня          → · пока 0 отмеченных; иначе процент (напр. 60%)
          tap Symbol          → устройство чеклиста (пункты, порядок, история, edit/delete)
          tap day / Today     → день: галочки пунктов да/нет
```

**Общие примитивы (уточнит 04b):** Tracker, Entry, Day, TrackerType, WorkoutSession, Exercise, Set, ChecklistItem, ChecklistDayProgress, WorkoutTemplate, …

| Возможность | Где живёт | Не является |
|-------------|-----------|-------------|
| **Habits** | Корень; обычные типы эталона **без Notes** | Контейнер для всего без границ |
| **Workouts** | За порталом; сессии, упражнения, подходы, шаблоны | Strong: соцсеть, программы на месяцы, суперсеты, Health sync |
| **Checklist** (ex-Morning) | За checklist-колонкой; именованный ритуал/список с % | Стрики, только-утро, давление «не пропусти» |

---

## 3. Навигация (утверждено: hub + portals)

### 3.1 Отвергнуто

| ID | Почему нет |
|----|------------|
| N1 Module strip Habits\|Workouts\|Morning | Три «дома», лишний chrome |
| N3 Три отдельных root | Три приложения |
| N4 Все колонки всех модулей как равные сущности без порталов | Размывает Workouts UX; не даёт глубины сессии |

### 3.2 Утверждено: N-portal (вариант пользователя)

- Формат навигации эталона сохранён.
- Особые **типы** колонок = точки входа во вложенные модули.
- Имена **не хардкодятся** («Тренировка» / «Утро» — лишь примеры Name).
- **Ровно один** WorkoutPortal на приложение; Checklist — сколько угодно.

### 3.3 Жесты на главной

| Цель | Жест |
|------|------|
| Обычная привычка — история/edit | Tap Symbol → detail |
| Обычная привычка — запись дня | Tap Today row / (по типу) sheet или checkbox |
| Войти в Workouts | Tap Symbol workout-портала |
| Открыть сессию/день тренировки с сетки | Tap ячейки или Today-строки портала → сессия этого дня (не toggle Completion) |
| Устройство чеклиста | Tap Symbol checklist |
| Отметить пункты дня | Tap ячейки / Today checklist → дневной чеклист |
| Новый трекер | Dock `+` → New tracker (типы см. §5) |
| Месяц / сегодня / settings | ↑ ↓ TODAY … как в эталоне |

### 3.4 Маршруты (предложение)

| Route | Экран |
|-------|--------|
| `/` | Habits home (default) |
| `/t/:trackerId` | Detail обычного трекера **или** устройство checklist |
| `/workout` | Workouts module (контекст дня — state/query) |
| `/workout/templates` | Список шаблонов |
| `/settings` | → `/?settings=1` (sheet) |
| `/settings/appearance` | → `/?settings=appearance` |
| `/settings/trackers` | → `/?settings=trackers` |
| `/habits/new` | New tracker |

Sheet логирования привычки — overlay на home. Точные path — на implementation; дух выше.

---

## 4. Карта экранов V1

### 4.1 Habits home (shared chrome эталона)

| ID | Экран | Примечание |
|----|-------|------------|
| H0 | Empty home | Нет колонок; дни + dock; спокойный empty |
| H1 | Full month grid | Обычные + порталы как колонки |
| H2 | Split + Today | Today: обычные строки + порталы (без Completion-tap на workout) |
| H3 | New tracker | Types: см. §5 |
| H4–H6 | Entry sheets | Time / Count / Distance·Weight (Count-pattern) |
| H7 | Tracker detail | Только **обычные** типы |
| H8 | Settings | Appearance, Export (обязательно), без Upgrade/iCloud/Rate/brand |
| H9 | Appearance | Dark / Light |

### 4.2 Checklist (вложенный)

| ID | Экран | Вход |
|----|-------|------|
| C1 | Устройство чеклиста | Symbol: имя, Symbol, список пунктов, drag-порядок, add/remove пунктов, history/% ranges по аналогии detail, EDIT/DELETE колонки |
| C2 | День чеклиста | Ячейка/Today: пункты да/нет за выбранный день; % пересчитывается |

### 4.3 Workouts (вложенный)

| ID | Экран | Примечание |
|----|-------|------------|
| W1 | День / сессия | Контекст даты; Начать / Закончить; секундомер между ними; список упражнений сессии |
| W2 | Упражнение в сессии | Подходы; «прошлый раз» = последняя сессия этого упражнения |
| W3 | Добавить упражнение | Из справочника / новое имя |
| W4 | Шаблоны | Список; старт из шаблона опционален |
| W5 | Редактор шаблона | Состав упражнений шаблона |
| W6 | ~~detail упражнения~~ | **Out of V1** (06): отдельный progress-экран не делаем; достаточно «Прошлый раз» на W2 |

---

## 5. Типы трекеров на New tracker

| Type (UI, RU) | Колонок | Ячейка | Notes |
|---------------|---------|--------|-------|
| Завершение (Completion) | N | `x` / · | Как эталон |
| Время (Time) | N | `HH:MM` | Формат 24h по умолчанию для RU — уточнить на 05 |
| Число (Count) | N | число; **`0` = валидное значение**; · только если entry нет | Unit optional |
| Дистанция (Distance) | N | число + unit | Entry UI = расширение Count |
| Вес (Weight) | N | число + unit | То же |
| **Тренировка (WorkoutPortal)** | **max 1** | **только длительность** | Если уже есть — chip/Type **disabled** |
| **Чеклист (Checklist)** | N | · → потом `%` | Любое Name |
| Notes | — | — | **Нет в LifeOS** |

Type после создания **immutable** (менять нельзя).

---

## 6. Правила модулей (детально)

### 6.1 Habits (обычные)

- Язык эталона: grid, Today, sheets, detail.
- Нет лога в **будущие** дни (дни в сетке видны, запись запрещена) — как эталон.
- Count: явное `0` сохраняется; отсутствие записи = `·`.
- Черновик sheet при убийстве PWA **не** восстанавливается (нет UPDATE — нет данных).
- Uncheck Completion → удаляет entry (зафиксировать на 05; симметрия).

### 6.2 Workout portal ↔ Workouts

| Правило | Решение |
|---------|---------|
| Длительность в сетке | **Нет.** `in_progress` → `…`; `completed` → `x`. `durationSeconds` — сессия / История (04b) |
| Ручной Completion | **Запрещён** на портале |
| Секундомер | «Начать» → tick → «Закончить» → пишется `durationSeconds` на сессии → ячейка читает его |
| Finish без упражнений | **Запрещён** |
| Редактирование длительности | Правка `durationSeconds` сессии (забыли Закончить) — UI на портале/сессии |
| Сессий на день | **Одна** |
| Удаление портала | **Cascade сессий**; каталог упражнений и шаблоны **сохраняются** (04b) |
| Вход | Symbol → модуль; ячейка/Today → сессия дня (не checkbox) |

### 6.3 Workouts — scope V1

**Есть:**

- Справочник упражнений: **название + способ учёта** (`weight_reps` | `reps_only` | `duration`).
- Сессия дня: список упражнений; подходы по способу учёта.
- «Прошлый раз» при вводе: значения **последней сессии** этого упражнения.
- Шаблоны: набор упражнений; старт = **пустая сессия** или **из шаблона**.
- Правка текущей сессии (add/remove упражнения, подходы) **не меняет** шаблон сама по себе.
- На **finish**: вопрос «Обновить шаблон?» только если старт из шаблона **и** состав упражнений изменился (06).
- Прогресс без дашбордов Health: через прошлый раз + историю в потоке упражнения.

**Нет в V1:**

- Поля упражнения «на потом» (группы мышц, видео, инвентарь…).
- Несколько сессий в день.
- Соцсеть, программы на недели, суперсеты как сущность, Apple Health, геймификация.
- UI «как Strong» ради сложности — оставляем необходимый минимум.

**Happy path:**

1. Habits → Symbol портала (или ячейка сегодня).  
2. Начать → (опционально шаблон) → упражнения → подходы.  
3. Закончить → длительность в сетке Habits; опционально обновить шаблон.

### 6.4 Checklist

| Правило | Решение |
|---------|---------|
| Имя | Любое (не привязано к утру) |
| Пункты | Только да/нет |
| Порядок | Важен; **drag** для изменения |
| Набор во времени | Можно менять пункты; **история дневных % не ломается** (снимок прогресса дня / стабильные item id — модель в 04b) |
| Ячейка | `·` пока `doneCount === 0`; иначе процент |
| Symbol | Устройство чеклиста (+ история) |
| День | Галочки пунктов |
| Стыд / стрики | Нет |
| История при смене набора | **Снимок дня** `checklist_days` (04b): прошлые дни не пересчитываются от нового определения |

**Формула % (утверждено в 04b):** `Math.round(100 * done / lines.length)` по снимку дня; при `done === 0` в сетке `·`.

---

## 7. Что переиспользуем из эталона

| Паттерн | Применение |
|---------|------------|
| MonthGrid, · / values, selected day | Habits home |
| Today panel + rows | Обычные + checklist day entry; portal row ≠ Completion |
| Dock ↑ ↓ TODAY + … | Home |
| New tracker form + Type chips | + WorkoutPortal / Checklist |
| Entry sheets Time/Count | Обычные типы; длительность портала может reuse Time sheet |
| Tracker detail | Обычные типы; checklist device **расширяет** тот же каркас (meta + list + danger actions) |
| Settings inset grouped | Без маркетинга эталона |
| ChipSelect / danger / close | Везде |
| Symbol → «глубже» | Обычный detail **или** portal module **или** checklist device |

**Новое (обосновано):** экраны сессии/шаблонов Workouts и дневной чеклист — нельзя выразить одной ячейкой Completion без потери смысла модуля. Визуально остаются dark/light токены, caps CTA, sheets, lists эталона.

---

## 8. User flows (сводка)

### 8.1 Первая установка

1. Install PWA (один раз с сетью) → `/` Habits empty.  
2. По желанию создать обычные трекеры и/или порталы.  
3. Default модуль/экран = **Habits**.

### 8.2 Обычная привычка

`+` → тип → CREATE → колонка → день (не future) → Today/sheet → значение в сетке → Symbol → detail.

### 8.3 Тренировка

Создать Type «Тренировка» (если ещё нет) → Symbol → Workouts → Начать [шаблон?] → работа → Закончить (≥1 упражнение) → длительность в колонке → позже можно править время.

### 8.4 Чеклист

`+` → Чеклист → Symbol → добавить пункты, drag → в день отмечать → в сетке %.

### 8.5 Settings

`…` → Appearance (dark/light) → **Export Data** (обязательно) → прочее без Rate/Upgrade/iCloud.

---

## 9. Offline & Home Screen

| Состояние | Поведение |
|-----------|-----------|
| Offline после cache | Полный CRUD локально; без тревожных баннеров |
| Первый заход без сети | Нужен один online load shell — единственный hard fail |
| Standalone | In-app back/close; safe areas; theme-color под dark/light |
| Restore | last month, selected day, theme; open sheets не восстанавливаем |
| Sync | Нет → нет conflict UI |
| Секундомер | Крутить локально; при kill app — политика на 06 (пауза/сброс); длительность всё равно editable |

---

## 10. Corner cases (матрица)

### 10.1 Пустоты

| Case | UI |
|------|-----|
| Нет трекеров | Empty grid дней |
| Нет порталов | Просто нет колонок; Workouts/Checklist не навязывать |
| Checklist 0 пунктов | Device empty; день / % — edge: не показывать 0% как стыд; · или «добавьте пункты» |
| Workout без портала | Модуль недоступен с home (нет Symbol); создание через Type |

### 10.2 Время

| Case | Правило |
|------|---------|
| Future day | Виден; **лог запрещён** (привычки, чеклист, старт тренировки) |
| TODAY / TZ | Локальные даты устройства |
| Забыли Закончить | Редактируемая длительность; политика «висящей» сессии — 06 |
| Одна сессия/день | Повторный Начать — продолжить существующую или блок — 06 (предложение: открыть ту же) |

### 10.3 Данные

| Case | Правило |
|------|---------|
| Второй WorkoutPortal | Type disabled |
| Delete WorkoutPortal | Cascade |
| Delete Checklist | Cascade пунктов/дневных прогрессов колонки |
| Change Type | Запрещено |
| Count 0 | Хранить 0 |
| Sheet kill | Discard |
| Много колонок | Horizontal scroll; day labels sticky |
| Symbol collision в home | Уникальность Symbol среди колонок home — 05 |
| Шаблон vs сессия | Правка сессии ≠ шаблон; update только на finish confirm |

### 10.4 Запреты UX

Нет streak, badges, «ты пропустил», spam offline, marketing settings, Notes, лог в будущем, ручной `x` на workout-портале без сессии.

---

## 11. Progressive disclosure

1. Empty Habits → `+`.  
2. Обычные колонки без порталов — полноценный трекер жизни.  
3. Workout/Checklist — когда пользователь выбирает Type.  
4. Шаблоны тренировок — когда надоело собирать сессию с нуля.  
5. Detail / device / история — по Symbol, не обязательны для ежедневного лога.

---

## 12. Реестр решений пользователя (2026-07-19)

| # | Тема | Решение |
|---|------|---------|
| 1 | Навигация | Hub = Habits; Workouts/Checklist через Symbol / portal types |
| 2 | Имена порталов | Не хардкодить; свободные Name/Symbol |
| 3 | Workout → Habits grid | Ячейка = **presence** completed (`x`), не Habit Entry и не duration |
| 4 | Morning | Обобщить в **Checklist** (не только утро) |
| 5 | Кол-во порталов | 1× WorkoutPortal + N× Checklist |
| 6 | Future days | Лог **нельзя** |
| 7 | Count 0 | Валидное **значение**; · = нет entry |
| 8 | Sheet draft | Не хранить без UPDATE |
| 9 | Порталы обязательны? | Нет, пользователь может не создавать |
| 10 | Default screen | Habits |
| 11 | UI language | **Русский** (mono с кириллицей при выборе шрифта) |
| 12 | Export | **Обязателен** |
| 13 | Change Type | **Запрещён** |
| 14 | Manual Completion на portal | **Нет** |
| 15 | Finish без упражнений | **Запрещён** |
| 16 | Старт сессии | Пустая **или** из шаблона |
| 17 | Обновить шаблон? | Только на **finish**, и только при отличии состава |
| 18 | Types | Отдельные; повторный WorkoutPortal → disabled |
| 19 | Delete portal | **Cascade сессий**; exercises/templates остаются |
| 20 | Упражнение V1 | Имя + способ учёта (вес×reps / reps / время) |
| 21 | Прошлый раз | Последняя сессия |
| 22 | Шаблоны | Нужны |
| 23 | Сессий/день | Одна |
| 24 | Checklist items | Только да/нет; drag; набор меняется, история жива |
| 25 | Checklist UI | Symbol = устройство; день = галочки; · затем % |
| 26 | Theme | Dark + light (из 03) |

---

## 13. Отложено (не блокер апрува 04)

| Тема | Куда |
|------|------|
| Точный формат длительности в ячейке (`75` vs `01:15`) | 05 / 06 |
| Снимок % / формула | ✅ в 04b |
| Висящая сессия / пауза таймера | ✅ в 06 (+ поля в 04b) |
| Экран-за-экраном Workouts/Checklist | 06 / 07 |
| Export JSON | ✅ в 04b (CSV не нужен V1) |
| Конкретный mono webfont (кириллица) | 03 implementation / 09 |
| Повторный «Начать» при открытой сессии | 06 |

---

## 14. Вне scope V1

- Backend, auth, sync, multi-device  
- Push / reminders как давление  
- Notes type  
- Strong-bloat, Health, social, streaks  
- Desktop layout  
- Несколько WorkoutPortal  
- Несколько сессий в день  
- Онбординг-цитаты эталона  

---

## 15. Согласование с PRODUCT / следующими шагами

- V1 по-прежнему включает **три возможности**: Habits + Workouts + Checklist(Morning).  
- Они не обязаны висеть тремя табами: порталы опциональны, код/дизайн модулей — в релизе.  
- **05 Habits** — home, обычные типы, New tracker incl. portal types, settings/export, жесты порталов.  
- **06 Workouts** — сессия, упражнения, подходы, шаблоны, секундомер, связь с длительностью.  
- **07 Checklist** — device + day + %, drag, эволюция набора.  
- **04b** — сущности под эту IA.

---

## 16. Шпаргалка

```text
Habits grid = home
WorkoutPortal (1) → Workouts · cell = `…`/`x` · duration on session · no Entry
Checklist (N) → device on Symbol · day snapshot · · then %
Templates + one session/day · finish asks update template?
RU · Export JSON · dark/light · no future logs · type locked · cascade sessions only
```
