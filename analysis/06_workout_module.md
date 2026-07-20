# 06 — Workout module (LifeOS)

**Входы:** 01–05, 04b (утверждены); PRODUCT, ANTI_GOALS  
**Дата:** 2026-07-19  
**Статус:** ✅ утверждён (2026-07-19; Q1–Q4 в §10; пауза в 04b; sheet shell 2026-07-20)  
**Язык UI:** русский  

Полноценный модуль тренировок за колонкой-порталом Habits.  
Не Strong / не Apple Health: сессия дня, подходы, шаблоны, «прошлый раз», секундомер → длительность на сессии; в сетке Habits — presence `x`.

---

## 1. Scope

### Входит

| Область | Содержание |
|---------|------------|
| Вход с Habits | Symbol / ячейка / Today-строка портала |
| W1 Сессия дня | Начать / Закончить, таймер, список упражнений |
| W2 Упражнение | Подходы по режиму учёта + прошлый раз |
| W3 Добавить упражнение | Каталог / новое |
| W4–W5 Шаблоны | Список + редактор; старт из шаблона |
| Portal ⋯ | Rename / delete портала (из 05) |
| Длительность | После finish; правка на W1 (и H6b из Habits) |
| Kill / resume таймера | Политика ниже |
| История упражнения | Минимальная (§ W6) |

### Не входит V1

Суперсеты, rest-timer как продукт, программы на недели, графики Progressive Overload, Health, соцсеть, RPE, видео, несколько сессий/день, второй portal.

---

## 2. Принципы

1. Тот же visual language: dark/light, sheets, caps CTA, close ✕, danger delete (03/05).  
2. Одна сессия на `YYYY-MM-DD`.  
3. Сетка Habits проецирует **наличие** completed-сессии (`x`), не длительность. `durationSeconds` — в сессии / Истории.  
4. Правка сессии ≠ авто-правка шаблона; «Обновить шаблон?» только на finish.  
5. Finish ≥ 1 упражнение **и** ≥ 1 подход суммарно (04b).  
6. Future date — только просмотр пустого/запрет старта (как Habits).  
7. Спокойствие: нет «ты пропустил тренировку».

---

## 3. Вход и контекст даты

| Жест с Habits | Открывается |
|---------------|-------------|
| Tap Symbol портала | **История колонки** (stat / heatmap / список); tap дня → W1 |
| Tap ячейки / Today portal | W1 для **этой** даты |

Route-дух: `/?workout=YYYY-MM-DD` (сессия); `/?detail=:portalId` (история).  
Legacy `/workout?date=` → redirect на `/?workout=`.  
Back/✕ / swipe / backdrop → Habits home.

**UI shell (2026-07-20):** W1–W5 — **bottom sheets** поверх home.  
**История портала (2026-07-20):** Symbol → sheet как H7/C1 (не сессия дня).

**B «Отменить»:** если `exercises.length === 0` → secondary «Отменить» → delete session → A0.  
**C:** без «+ Упражнение» на основном экране (есть в ⋯).  
**W2 duration sets:** ввод через wheels мин/сек (`M:SS`), не сырые секунды.  
**W2 weight/reps:** крупные inputs без ряда ±.

---

## 4. Экраны

### W1 — Сессия дня (главный)

```text
✕                         ⋯
{Имя портала} · 19 июля
[ таймер 0:00:00 | длительность 21:34 ]

состояние A: нет сессии / future
состояние B: in_progress
состояние C: completed

список упражнений сессии
  Жим лёжа          3× …     ›
  Присед            2× …     ›

[+ Упражнение]

primary CTA внизу — зависит от состояния
```

#### Состояния W1

| State | Условие | Header meta | Primary CTA | Secondary |
|-------|---------|-------------|-------------|-----------|
| **A0** Empty today/past | Нет session, date ≤ today | — | **НАЧАТЬ ТРЕНИРОВКУ** | Текст-ссылка «Из шаблона» если есть ≥1 template |
| **A1** Future | date > today | — | CTA disabled / скрыт | «Нельзя начать в будущем» caption спокойный |
| **B** In progress | status=in_progress | Timer `H:MM:SS` + **Пауза / Продолжить** | **ЗАКОНЧИТЬ** (disabled если нет ≥1 set) | «+ Упражнение»; нельзя второй Начать |
| **C** Completed | status=completed | Показана длительность (tap → edit duration sheet) | нет «Начать» | правка подходов; **+ Упражнение** только в ⋯; **Удалить тренировку** |

**«НАЧАТЬ ТРЕНИРОВКУ» (пустая):**  
создать session: `status=in_progress`, `startedAt=now`, `pausedAt=null`, `pauseAccumulatedSeconds=0`, `templateId=null`, `exercises=[]`.

**«Из шаблона»:** → picker W4-select → session с exercises из template: на каждое упражнение **1 пустой set** + placeholder UI из прошлого раза (если есть) + `templateId`.

**Повторный Начать при existing in_progress:** не создавать новую — показать эту (B).  
**Начать при existing completed:** не создавать; остаёмся в C. Отдельного «начать заново» нет без delete.

**ЗАКОНЧИТЬ:**

1. Validate: ≥1 exercise с ≥1 set с валидными полями (см. §5).  
2. Если сейчас на паузе — сначала «закрыть» паузу в accumulated (как Resume math), затем:  
   `endedAt=now`, `durationSeconds = elapsedSeconds()` (формула ниже), `pausedAt=null`.  
3. `status=completed`.  
4. Если `templateId != null` → modal: **«Обновить шаблон?»**  
   - **ДА** → `template.exerciseIds = session.exercises.map(e => e.exerciseId)` в порядке sortOrder.  
   - **НЕТ** → ничего.  
   - Шаблон удалили mid-workout → skip modal.  
5. Habits cell → `x` (completed).

**Таймер (B) — с паузой (утверждено):**

Поля (04b): `startedAt`, `pausedAt: ISO | null`, `pauseAccumulatedSeconds: number`.

```text
elapsedSeconds():
  if pausedAt != null
    → floor((pausedAt - startedAt)/1000) - pauseAccumulatedSeconds
  else
    → floor((now - startedAt)/1000) - pauseAccumulatedSeconds
```

| Действие | Эффект |
|----------|--------|
| **Пауза** | `pausedAt = now` (если ещё не на паузе) |
| **Продолжить** | `pauseAccumulatedSeconds += floor((now - pausedAt)/1000)`; `pausedAt = null` |
| UI | Кнопка рядом с таймером: «Пауза» / «Продолжить»; на паузе таймер не тикает, возможен спокойный caption «Пауза» |

**Kill app:**

- Если **не** на паузе → по возврату тикает дальше от wall-clock (время шло).  
- Если **на паузе** → остаётся на паузе (`pausedAt` сохранён), elapsed заморожен.  
- Раздутую длительность после finish всегда можно править.

Session в IDB; draft sheets подходов не нужны (autosave на W2).

**Edit duration (C):** sheet как Habits H6b → `durationSeconds`.

**Список упражнений:** tap → W2; удаление упражнения из сессии; **drag** reorder на W1 (утверждено).

**+ Упражнение** → W3 (только date ≤ today и не future; в C и B можно).

**⋯ меню (W1):**

- Изменить название колонки (portal name)  
- Изменить символ (portal symbol, max 5, unique)  
- Шаблоны → W4  
- **Каталог упражнений** → список active; rename; archive (`archivedAt`); create  
- Удалить колонку тренировки → confirm («Удалятся все тренировки») → cascade sessions, portal tracker; exercises/templates остаются  
- Удалить тренировку этого дня (если session есть) → confirm → delete session → A0; сетка `·`

**Каталог упражнений (sheet):**

```text
Каталог                            ✕
[ поиск ]
  Жим лёжа          вес×повт    ✕
  …
[+ Новое упражнение]
```

- Tap строки → rename (режим учёта immutable)  
- ✕ → confirm «Убрать из каталога?» → `archivedAt`; убрать id из всех `template.exerciseIds`; сессии не трогать  
- W3 / W5 picker показывают только `!archivedAt`  
- W2 «УДАЛИТЬ УПРАЖНЕНИЕ» — только из сессии, не из каталога  

### W2 — Упражнение в сессии

```text
✕
{Название упражнения}
Режим: вес×повторы | повторы | время   (readonly badge)

Прошлый раз
  60×8 · 60×8 · 60×6     (или «Нет данных»)

Подходы
  1  [вес]  [повторы]     или по режиму
  2  …
  + Добавить подход

УДАЛИТЬ УПРАЖНЕНИЕ (danger text) — из сессии, не из каталога
```

**Прошлый раз:** последняя `completed` session с `date < currentSession.date`, содержащая `exerciseId`; показать sets в одну/две строки compact. Если нет — «Нет данных».

**Режимы ввода set (04b):**

| trackingMode | Поля set | Валидный set |
|--------------|----------|--------------|
| `weight_reps` | weightKg, reps | оба заданы, reps ≥ 0, weight ≥ 0 (0 вес допустим) |
| `reps_only` | reps | reps ≥ 0 |
| `duration` | durationSeconds | > 0 |

Ввод: stepper/keypad в духе Count sheet (reuse), не полный Strong plate calculator.

**+ Подход:** новая строка; placeholder = значения последнего подхода этой сессии или прошлого раза.

**Удалить подход:** swipe или ✕ на строке; нельзя finish если станет 0 sets globally — валидация на ЗАКОНЧИТЬ.

**Back / уход с экрана:** **autosave** sets в session (без кнопки СОХРАНИТЬ) — утверждено.

---

### W3 — Добавить упражнение

```text
Добавить упражнение              ✕
[ поиск ]

Список exercises (не archived)
  Жим лёжа          вес×повт
  Планка            время

— или —
[+ Новое упражнение]
```

**Новое упражнение** → mini form / sheet:

- Название (обязательно)  
- Способ учёта chips: **Вес и повторы** / **Повторы** / **Время** — immutable после create  
- СОЗДАТЬ → add to catalog + append to session  

Tap существующего → append to session (если уже есть в сессии — не дублировать; toast «Уже в тренировке» / focus existing).

---

### W4 — Шаблоны (список)

```text
Шаблоны                           ✕
Пусто: «Нет шаблонов» + создать

Список (rows, не карточки):
  Зал A     5 упражнений     ›
  …

[+ Новый шаблон]
```

Вход: из W1 «Из шаблона» (select mode) или ⋯ → Шаблоны (manage mode).

**Select mode:** tap template → start session from it → W1-B.  
**Manage mode:** tap → W5; swipe delete template (не трогает sessions).

---

### W5 — Редактор шаблона

```text
✕
Название шаблона
Упражнения (drag order)
  Жим …
  Присед …
[+ Упражнение]  → тот же picker, что W3, но пишет в template.exerciseIds
УДАЛИТЬ ШАБЛОН
```

Не содержит sets — только состав и порядок exerciseIds.

---

### W6 — История упражнения (минимум)

Вход: в W3 long-press / ⋯ на exercise «История» **или** tap на блоке «Прошлый раз» → expand.

**V1 минимум:** не отдельный тяжёлый экран — достаточно «Прошлый раз» на W2.  
**Опционально лёгкий:** sheet со списком последних N дат + sets (read-only).  
**Решение 06:** отдельный полноценный progress-экран **не делаем**; «Прошлый раз» на W2 достаточно. Long-press history — nice-to-have после V1.

---

## 5. Валидации

| Действие | Правило |
|----------|---------|
| Finish | ≥1 SessionExercise и суммарно ≥1 valid set |
| Start future | запрет |
| Second session same day | невозможно (unique date) |
| Empty finish | CTA ЗАКОНЧИТЬ disabled + helper |
| Portal symbol edit | max 5, unique, как Habits |
| Delete portal | confirm + cascade all sessions |

---

## 6. Empty / edge

| Case | UI |
|------|-----|
| Первый заход, нет exercises | W1-A0; + Упражнение → создать первое |
| Нет шаблонов | «Из шаблона» скрыт; W4 empty |
| Kill mid-workout | Resume B; если была пауза — остаётся на паузе; иначе wall-clock |
| Forgot finish (hours later) | Finish → большая duration → edit duration |
| Delete all sets then finish | blocked |
| Template deleted while in_progress | finish без modal update |
| Archive exercise | скрыт из W3; старые sessions хранят snapshot через exerciseId+name resolve: если archived, показывать name всё равно |
| Нет portal (не создан) | модуль недоступен с home — ок |
| Completed + add exercise next day | обычный новый день A0 |

**Имя упражнения в session:** при отображении брать актуальное `exercises.name`; если hard-missing — «Удалено». Archive не hard-missing.

---

## 7. Progressive disclosure

1. Создал portal на Habits → зашёл → Начать → + упражнение → подходы → Закончить.  
2. Повторяющийся день → «Из шаблона».  
3. Rename portal / templates — через ⋯ когда понадобится.  
4. Нет обязательного тура.

---

## 8. Стыковка

| С | Как |
|---|-----|
| Habits grid | presence `x` для completed; жесты входа из 05 |
| Habits H6b | тот же edit duration, что W1-C |
| Checklist | нет связи данных |
| 04b | sessions, exercises, templates без изменений модели |

---

## 9. Копирайт (RU)

| Ключ | Текст |
|------|-------|
| Start | НАЧАТЬ ТРЕНИРОВКУ |
| Finish | ЗАКОНЧИТЬ |
| Pause / Resume | Пауза / Продолжить |
| From template | Из шаблона |
| Update template? | Обновить шаблон? |
| Yes / No | ДА / НЕТ |
| Add exercise | Упражнение |
| Add set | Подход |
| Last time | Прошлый раз |
| No data | Нет данных |
| Modes | Вес и повторы / Повторы / Время |
| Templates | Шаблоны |
| Delete session | Удалить тренировку |
| Delete portal | Удалить колонку тренировки |
| Future | Нельзя начать в будущем |
| Already in session | Уже в тренировке |

---

## 10. Решения по уточнениям (2026-07-19)

| ID | Тема | Решение |
|----|------|---------|
| Q1 | Пауза таймера | **Есть:** Пауза / Продолжить; поля в 04b |
| Q2 | Autosave подходов | **Да**, без СОХРАНИТЬ |
| Q3 | Prefill из шаблона | 1 пустой set + placeholder из прошлого раза |
| Q4 | Reorder | **Drag** на W1 |

Блокеров для апрува 06 нет.

---

## 11. Шпаргалка

```text
W1 day session · Start/Finish · timer with pause · one session/day
W2 sets by mode · last time · autosave
Templates optional · 1 empty set/exercise · update template? on finish
Drag reorder · ⋯ portal rename/delete · cascade sessions
Habits cell = completed duration only · no Strong bloat
```
