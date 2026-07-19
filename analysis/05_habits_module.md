# 05 — Habits module (LifeOS)

**Входы:** 01–04, 04b (утверждены); PRODUCT, VISION, ANTI_GOALS  
**Дата:** 2026-07-19  
**Статус:** ✅ утверждён (2026-07-19; Q1–Q4 в §11)  
**Язык UI:** русский

Habits — **корень** приложения (не «клон эталона без спеки»).  
Workouts / Checklist здесь только как **колонки-порталы и жесты входа**; их внутренние экраны — шаги 06 / 07.

---

## 1. Scope модуля

### Входит в 05

| Область                | Содержание                                                          |
| ---------------------- | ------------------------------------------------------------------- |
| Home                   | MonthGrid, выбор дня, Today, dock                                   |
| Обычные типы           | Completion, Time, Count, Distance, Weight — CRUD записей и трекеров |
| New tracker            | Все Type chips, включая порталы                                     |
| Detail                 | Только обычные трекеры                                              |
| Settings               | Appearance, Export                                                  |
| Жесты порталов на home | Symbol / ячейка / Today → вход в 06/07; отображение ячеек           |
| Правила                | Future lock, empty, offline UX на home                              |

### Не входит (ссылки)

| Область                                 | Куда  |
| --------------------------------------- | ----- |
| Сессия, шаблоны, подходы, секундомер    | 06    |
| Устройство чеклиста, день пунктов, drag | 07    |
| Токены/компоненты                       | 02–03 |

---

## 2. Принципы UX (Habits)

1. Язык эталона: сетка первична, Today — быстрый ввод, sheets — значения.
2. Пустота = `·`, без стыда и streak.
3. Один primary CTA на поверхность.
4. ≤ 3 тапа до записи обычной привычки.
5. Future days видны, **запись запрещена**.
6. Sheet без UPDATE = ничего не сохранилось.
7. Dark / light из settings; `font.sans` + `font.mono` на сетке (03).

---

## 3. Экраны

### H0 / H1 — Home: MonthGrid

**Состояния:** нет колонок (H0) / есть колонки (H1).

**Анатомия:**

```text
MonthYearTitle     «Июль» + «2026» (месяц — genitive/ru label; см. §11)
[ Symbol headers → horizontal scroll if needed; day column sticky ]
MonthGrid rows: DD + буква дня · cells…
BottomDock (full-month): ↑  ↓  СЕГОДНЯ  +  …
```

**Буквы дней недели (RU):** одна буква, mono — **П В С Ч П С В** (как эталон S M T W T F S).  
**Weekend banding (эталон photo_4 / photo_9):** строки сб/вс — чуть более светлый фон, чем будни. За счёт этого одна буква читается уверенно (Пн≠Пт по позиции в неделе + полосы выходных).

**Выделение дня (full-month grid):**

- **Сегодня** (календарная дата устройства): красный accent badge на числе — **только в текущем месяце**.
- **Выбранный день:** в сетке full-month **без** badge и **без** accent row wash (решение 09). Selection хранится в state (для СЕГОДНЯ / Today panel / логов); визуальный контекст выбора — на H2 Today, не «красная строка» в месяце.
- Чужой месяц после ↑/↓: тот же day-of-month в state, без красного chrome.

**Ячейки (отображение):**

| Тип колонки       | Пусто                       | Есть данные                                                                                  |
| ----------------- | --------------------------- | -------------------------------------------------------------------------------------------- |
| Completion        | `·`                         | `×`                                                                                          |
| Time              | `·`                         | по `config.timeFormat`: `22:30` (24h) или `10:30 PM` (ampm); везде одинаково (сетка + Today) |
| Count             | `·`                         | число (`0` показывается)                                                                     |
| Distance / Weight | `·`                         | `value` с **1** знаком + unit lowercase (`75.0 kg`, `2.4 km`) — **и в сетке, и в Today**     |
| Workout portal    | `·`                         | длительность **`H:MM`** из `durationSeconds` (напр. `1:15`); см. §8                          |
| Checklist         | `·` если done=0 или нет дня | `N%` (напр. `60%`)                                                                           |

**Взаимодействия сетки (утверждено 2026-07-20):**

| Жест                                   | Обычный                                                                           | Workout portal                                 | Checklist            |
| -------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------- |
| Tap Symbol                             | → Detail (H7)                                                                     | → Workouts (06), date = selected/today context | → Device (07)        |
| Tap **day label** (число слева)        | Select day → открыть **Today (H2)**                                               | то же                                          | то же                |
| Tap **cell** привычки (день ≤ сегодня) | Select day + открыть **entry sheet** H4–H6 для этой колонки (не мгновенный write) | → сессия дня (06)                              | → день чеклиста (07) |
| Tap cell (future)                      | Select day + Today read-only / hint (§7); sheet не пишет                          | Select + hint                                  | то же                |

**Важно:** day label ≠ cell. СЕГОДНЯ и tap по дате слева → Today со списком. Tap по ячейке колонки → sheet одной привычки (`photo_14` / `21`–`23`).

**↑ / ↓:** предыдущий / следующий месяц. Selected day: тот же номер, иначе clamp к последнему дню месяца; если ушли с «сегодняшнего» месяца — selected = min(номер, lastDay).

**СЕГОДНЯ:** месяц = текущий; selected = сегодня; открыть Today (H2).

**`+`:** New tracker (H3).

**`…`:** Settings (H8).

**Empty (H0):** как эталон photo_4 — только список дней + dock; **без** подписей, captions и empty-illustrations.

**Колонки трекеров (композиция, 09):** зона справа от дней делится поровну — 1 по центру всей ширины, 2 → ½, 3 → ⅓… Мин. ширина колонки 64px; если `n × 64` не влезает — горизонтальный scroll; колонка дней sticky left.

**Dock в split (H2):** **скрыт**, пока открыт Today (решение 05; эталон так выглядит). Закрытие Today (§4) возвращает dock.

---

### H2 — Home: Today panel

**Открывается:** tap **day label** (число слева) · кнопка **СЕГОДНЯ**.  
**Не** открывается одним только tap по cell (cell → entry sheet).

```text
Сегодня | «19 июл» mini calendar
Заголовок: date === today → «Сегодня»; иначе «19 июля»
Rows…
```

**Заголовок панели:**

- `date === today` → «Сегодня»
- иначе → полная дата («19 июля»). Mini badge всегда отражает выбранный день.

**Строка Today по типу:**

| Тип                   | Leading            | Title | Trailing             | Tap                                              |
| --------------------- | ------------------ | ----- | -------------------- | ------------------------------------------------ |
| Completion            | Checkbox           | name  | —                    | **Toggle сразу** (§5.1) — как эталон photo_10/11 |
| Time                  | leading как эталон | name  | время или пусто      | → Sheet Time (H4)                                |
| Count / Dist / Weight | то же              | name  | value + unit         | → Sheet numeric (H5/H6)                          |
| Workout portal        | **не** checkbox    | name  | длительность или «›» | → 06 сессия / edit                               |
| Checklist             | **не** checkbox    | name  | `%` или пусто        | → 07 день                                        |

Done-стиль (dim + strikethrough): только ordinary с записью. Portal/checklist — без strikethrough.

**Появление:** плавный выезд снизу (ease, без дофамина).  
**Закрытие Today (обязательно):**

1. Swipe down по панели Today.
2. Tap **вне** Today (область сетки выше) → dock возвращается.
3. Отдельная кнопка-свернуть не обязательна.

**Future day Today:** список виден; tap не пишет; hint «Нельзя отметить будущий день».

---

### H3 — New tracker

**UI (09):** bottom sheet поверх Habits home (не отдельный full-page route).  
`+` открывает sheet; ✕ / backdrop / после СОЗДАТЬ — закрывает. Route `/habits/new` → redirect `/?new=1`.

```text
[sheet]
Новый трекер                          ✕
Имя
Symbol (+ helper: до 5 символов, для сетки) — текст secondary/серый
Тип  [chips: больше padding, radius md не pill]
…conditional fields…
СОЗДАТЬ
```

**Type chips (RU labels):**

| Chip       | type           | Conditional                                                                     |
| ---------- | -------------- | ------------------------------------------------------------------------------- |
| Завершение | completion     | —                                                                               |
| Время      | time           | Формат: «24 часа» (default) / «AM/PM»; helper: `напр. 22:30` / `напр. 10:30 PM` |
| Число      | count          | Unit optional text                                                              |
| Дистанция  | distance       | Unit picker: км (default), мили                                                 |
| Вес        | weight         | Unit picker: кг (default), фунты                                                |
| Тренировка | workout_portal | Если уже есть portal → chip **disabled** + helper «Уже добавлена»               |
| Чеклист    | checklist      | —                                                                               |

Notes — нет.

**Имя:** обязательно, trim; placeholder по типу (напр. «Зарядка», «Кофе»).  
**Symbol:** max 5; default = авто из Name (транслит/обрезка RU→верхний регистр, эвристика на 09); unique case-insensitive среди trackers. Collision → inline error «Такой символ уже есть», CREATE disabled.  
**СОЗДАТЬ:** пишет tracker, `sortOrder = max+1`, закрывает форму, колонка справа.

После create checklist/workout — **не** обязательный онбординг; пользователь сам зайдёт в Symbol.

---

### H4–H6 — Entry sheets (общий каркас)

**Эталон:** `photo_14`, `21`, `22`, `23`.  
**Вход:** tap **cell** в сетке (привычка × день) **или** tap строки в Today (кроме Completion — там toggle).

```text
[sheet, выезд снизу]
СЕГОДНЯ • 19 ИЮЛ     (или дата)              ✕
{Полное имя привычки}

…тело по типу…

ОТСЛЕДИТЬ  |  ОБНОВИТЬ   (create / edit)
```

**Общие правила sheets (2026-07-20):**

1. Плавный open/close (slide up / down).
2. Закрытие: **swipe down** · ✕ · tap backdrop (если есть). Правило для **всех** sheets, включая Today и New tracker.
3. Future day → не писать; hint.
4. Копирайт primary (черновик): **ОТСЛЕДИТЬ** / **ОБНОВИТЬ**; DELETE ENTRY → **УДАЛИТЬ ЗАПИСЬ**. Можно править позже.

#### H4a — Completion confirm (только из **ячейки** сетки)

Не мгновенный toggle с сетки (случайно легко нажать). Низкий sheet:

```text
СЕГОДНЯ • 19 ИЮЛ                         ✕
{Имя привычки}

ОТСЛЕДИТЬ     ← create: ставит ×
```

- Create: ОТСЛЕДИТЬ → создать completion entry.
- Edit (ячейка уже `×`): тот же каркас; primary **ОБНОВИТЬ** не нужен — показать **УДАЛИТЬ ЗАПИСЬ** (danger) или toggle-смысл «снять» через delete confirm (`photo_23` дух).
- Из **Today**: по-прежнему checkbox toggle без этого sheet (эталон).

#### H4 — Sheet: Time

`photo_14` / `22`: дата-meta · name · wheel HH:MM · «Следующий день» · ОТСЛЕДИТЬ / ОБНОВИТЬ; в edit — trash → УДАЛИТЬ ЗАПИСЬ confirm.  
**nextDay** в EntryValue (04b).

#### H5 — Sheet: Count

`photo_21`: stepper ± · unit · keypad · ОТСЛЕДИТЬ / ОБНОВИТЬ; trash в edit.  
`0` валиден.

#### H6 — Sheet: Distance / Weight

Как Count; unit из config (в sheet не меняется).  
Десятичная точка — да. Count — целые (точки нет).

---

### H6b — Sheet: длительность портала (Habits-side)

Только если есть `completed` session на этот день.  
Reuse: два барабана часы/минуты **длительности** (не время суток) или число минут — **решение: H:MM wheel duration**, primary ОБНОВИТЬ → `session.durationSeconds`.  
Нет trash «удалить длительность» отдельно: удаление сессии — в 06.  
Если session `in_progress` / отсутствует — этот sheet не открывать; вести в 06.

---

### H7 — Tracker detail (ordinary only)

Вход: Symbol обычного трекера.  
**UI:** bottom sheet ~90vh, фон `surface-2` (серый, не OLED black); поверх Habits home. Закрытие: swipe / ✕ / backdrop.

```text
Name                                          ✕
Symbol / Тип (badge) / Создано
[ Неделя | Месяц | Год | Всё время ]
ENTRIES  {count}
History heatmap
Список записей по периоду
ИЗМЕНИТЬ | УДАЛИТЬ
```

**Range chips** — стиль fill selected (03); текст вертикально по центру.  
**Range bounds:** week = 7 дней; month = с 1-го числа; year = 365 дней; **all = все записи ≤ сегодня** (не резать по `createdAt`).  
**Heatmap / list** — наличие entry в день.  
**ИЗМЕНИТЬ** → форма как New tracker, но **без смены Type** (type readonly/disabled). Name, Symbol, unit/format editable.  
**УДАЛИТЬ** → confirm → cascade entries (04b).

Workout portal / checklist Symbol **не** открывают H7.

---

### H8 — Settings

```text
Настройки                                 ✕
Оформление          ›
Экспорт данных
— спокойный footer без бренда эталона —
```

Без Upgrade / iCloud / Rate / Support marketing / Replay intro эталона.

**Экспорт:** tap → сформировать JSON (04b) → Share sheet iOS / download. Успех — короткий toast «Файл готов». Ошибка — спокойный текст.

---

### H9 — Appearance

```text
Оформление
○ Тёмная
○ Светлая
```

Сразу пишет `settings.theme`. System follow — **не в V1** (явный выбор).

---

## 4. Взаимодействия записи (ordinary)

### 5.1 Completion

| Место         | Действие        | Эффект                                                                |
| ------------- | --------------- | --------------------------------------------------------------------- |
| **Today** row | Unchecked → tap | Create entry; cell `×`; done-стиль                                    |
| **Today** row | Checked → tap   | Delete entry; cell `·`                                                |
| **Grid cell** | Tap             | Открыть H4a confirm sheet → ОТСЛЕДИТЬ / удалить (не мгновенный write) |
| Future        | tap             | no-op + hint                                                          |

### 5.2 Time / Count / Distance / Weight

| Состояние  | Tap Today/cell                       |
| ---------- | ------------------------------------ |
| Нет entry  | Sheet create → TRACK/СОХРАНИТЬ       |
| Есть entry | Sheet edit → ОБНОВИТЬ / DELETE ENTRY |
| Future     | hint                                 |

### 5.3 Порядок колонок

V1: порядок = `sortOrder` при создании (append).  
**Reorder колонок** — не в 05 (нет экрана Trackers internals). Можно добавить позже без ломания модели.

---

## 5. Стыковка с Workouts и Checklist (без поглощения)

Habits **владеет** home chrome и отображением всех колонок.

| Колонка        | Habits делает                                                                          | Habits не делает                   |
| -------------- | -------------------------------------------------------------------------------------- | ---------------------------------- |
| Workout portal | Показать длительность; жесты входа; New type; delete portal (cascade sessions via 04b) | UI подходов, шаблонов, секундомера |
| Checklist      | Показать %; жесты входа; New type                                                      | Пункты, drag, день чеклиста        |

После возврата из 06/07 home **сразу** отражает новые duration/%(reactive store).

---

## 6. Create / Edit / Delete (сводка)

| Сущность          | Create            | Edit                                     | Delete                                                                                               |
| ----------------- | ----------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Ordinary tracker  | H3                | H7 EDIT (no type)                        | H7 DELETE confirm                                                                                    |
| Workout portal    | H3 (once)         | Name/Symbol — меню **⋯ в Workouts (06)** | Удаление — **⋯ в Workouts (06)** + confirm; cascade sessions (04b). Не через H7 / не случайно с home |
| Checklist tracker | H3                | Device 07                                | Device 07                                                                                            |
| Entry             | sheets / checkbox | sheets                                   | DELETE ENTRY / uncheck                                                                               |

---

## 7. История и обзор

- Home grid = главный обзор во времени.
- H7 detail = один ordinary tracker (week/month/year/all + heatmap + list).
- Portal/checklist history — в 06/07, не дублировать H7.

---

## 8. Форматы отображения (решения 05)

| Величина                    | Формат                                                                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Clock time (привычка Время) | `24h` → `HH:MM` (`07:40`); `ampm` → `h:MM AM/PM` (`10:30 PM`, `12:00 AM`/`12:00 PM`). Хранение — `minutesOfDay`; wheel sheet всегда 00–23 |
| Workout duration в сетке    | Из секунд: `h:mm` если h<10 иначе `hh:mm` (напр. `1:05`, `12:00`); >24ч — `Nh` + минуты упрощённо `N:MM` hours total (редкость)           |
| Checklist                   | `0–100` + `%`, без десятичных                                                                                                             |
| Count                       | integer                                                                                                                                   |
| Distance / Weight           | всегда **1** знак после точки + unit lowercase из config (`75.0 kg`, `2.4 km`, `mi`/`lb`) — сетка и Today                                 |
| Месяц в title               | русское имя месяца                                                                                                                        |

---

## 9. Empty / edge / offline

| Case                      | Поведение                             |
| ------------------------- | ------------------------------------- |
| Нет трекеров              | H0 = photo_4 style, без copy          |
| Нет записей в месяце      | все `·` — норма                       |
| Future log                | запрет + hint                         |
| Symbol collision          | block create                          |
| Second workout type       | chip disabled                         |
| Sheet kill app            | discard                               |
| Offline                   | полный CRUD; без offline-banner       |
| First launch never cached | системная ошибка load — вне Habits UX |
| Пустой Name create        | CREATE disabled                       |
| Toggle Today закрытие     | см. H2                                |
| Выбран future + СЕГОДНЯ   | прыжок на today                       |

---

## 10. Progressive disclosure

1. Пустая сетка → `+`.
2. Один Completion → повседневный ритм эталона.
3. Value types → sheets.
4. Detail по Symbol — когда нужна история.
5. Portal types — когда нужны тренировки/чеклисты.
6. Settings редко.

---

## 11. Решения по уточнениям

### 2026-07-19

| ID  | Тема                 | Решение                                                               |
| --- | -------------------- | --------------------------------------------------------------------- |
| Q1  | Дни недели           | **Одна буква** + **weekend banding** строк (эталон photo_4 / photo_9) |
| Q2  | Portal rename/delete | В модуле **Workouts (06)** через ⋯; не с home detail                  |
| Q3  | Empty H0             | Как photo_4: **без** подписей                                         |
| Q4  | Закрытие Today       | Tap **вне** панели (как эталон); плюс **swipe down** с анимацией      |

### 2026-07-20 (entry sheets + жесты)

| ID  | Тема               | Решение                                                                        |
| --- | ------------------ | ------------------------------------------------------------------------------ |
| Q5  | Day label vs cell  | Label / СЕГОДНЯ → **Today**; cell → **entry sheet**                            |
| Q6  | Completion с сетки | Не мгновенный toggle; **H4a** confirm + ОТСЛЕДИТЬ. В Today — toggle как эталон |
| Q7  | Time/Count/…       | Sheets `photo_14`/`21`–`23`; значение → затем ОТСЛЕДИТЬ                        |
| Q8  | Motion             | Все sheets + Today: плавный выезд                                              |
| Q9  | Dismiss            | **Любой** sheet/Today: swipe down (+ ✕ / backdrop)                             |
| Q10 | Копирайт           | Черновик ОТСЛЕДИТЬ/ОБНОВИТЬ; правки UI позже ок                                |

Блокеров для апрува 05 нет.

---

## 12. Копирайт (RU) — ключи

| EN эталон                | LifeOS                           |
| ------------------------ | -------------------------------- |
| Today                    | Сегодня                          |
| TODAY                    | СЕГОДНЯ                          |
| New tracker              | Новый трекер                     |
| CREATE                   | СОЗДАТЬ                          |
| TRACK / UPDATE           | ОТСЛЕДИТЬ / ОБНОВИТЬ             |
| DELETE ENTRY             | УДАЛИТЬ ЗАПИСЬ                   |
| EDIT / DELETE            | ИЗМЕНИТЬ / УДАЛИТЬ               |
| Settings                 | Настройки                        |
| Appearance               | Оформление                       |
| Export Data              | Экспорт данных                   |
| Next day                 | Следующий день                   |
| Week/Month/Year/All-Time | Неделя / Месяц / Год / Всё время |
| ENTRIES                  | ЗАПИСИ                           |
| History                  | История                          |
| Type names               | см. H3                           |

---

## 13. Шпаргалка

```text
Home grid = LifeOS root · RU · mono cells · 1-letter days · weekend bands
Day label / СЕГОДНЯ → Today · cell → entry sheet (Completion confirm H4a)
Today Completion = toggle · Time/Count sheets photo_14/21
All sheets: slide + swipe down dismiss
Portal columns: duration H:MM · % · navigate 06/07
+ sheet · Settings theme + export
```
