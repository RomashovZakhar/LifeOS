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

| Область | Содержание |
|---------|------------|
| Home | MonthGrid, выбор дня, Today, dock |
| Обычные типы | Completion, Time, Count, Distance, Weight — CRUD записей и трекеров |
| New tracker | Все Type chips, включая порталы |
| Detail | Только обычные трекеры |
| Settings | Appearance, Export |
| Жесты порталов на home | Symbol / ячейка / Today → вход в 06/07; отображение ячеек |
| Правила | Future lock, empty, offline UX на home |

### Не входит (ссылки)

| Область | Куда |
|---------|------|
| Сессия, шаблоны, подходы, секундомер | 06 |
| Устройство чеклиста, день пунктов, drag | 07 |
| Токены/компоненты | 02–03 |

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

**Выделение дня:** красный badge на числе + soft row wash (03).  
**Сегодня** в текущем месяце всегда с accent badge, даже если выбран другой день.  
**Выбранный день** ≠ сегодня: wash на выбранном; сегодня сохраняет accent на числе.

**Ячейки (отображение):**

| Тип колонки | Пусто | Есть данные |
|-------------|-------|-------------|
| Completion | `·` | `×` |
| Time | `·` | `HH:MM` (24h) |
| Count | `·` | число (`0` показывается) |
| Distance / Weight | `·` | число (unit — в Today/sheet, в узкой ячейке только число) |
| Workout portal | `·` | длительность **`H:MM`** из `durationSeconds` (напр. `1:15`); см. §8 |
| Checklist | `·` если done=0 или нет дня | `N%` (напр. `60%`) |

**Взаимодействия сетки:**

| Жест | Обычный | Workout portal | Checklist |
|------|---------|----------------|-----------|
| Tap Symbol | → Detail (H7) | → Workouts (06), date = selected/today context | → Device (07) |
| Tap day label | Select day → открыть Today (H2) | то же | то же |
| Tap cell (день ≤ сегодня) | Select day + действие лога (§5) | → сессия дня (06) | → день чеклиста (07) |
| Tap cell (future) | Select day + Today **read-only** (§7) | Select + read-only hint | то же |

**↑ / ↓:** предыдущий / следующий месяц. Selected day: тот же номер, иначе clamp к последнему дню месяца; если ушли с «сегодняшнего» месяца — selected = min(номер, lastDay).

**СЕГОДНЯ:** месяц = текущий; selected = сегодня; открыть Today.

**`+`:** New tracker (H3).

**`…`:** Settings (H8).

**Empty (H0):** как эталон photo_4 — только список дней + dock; **без** подписей, captions и empty-illustrations.

**Много колонок:** горизонтальный scroll блока headers+cells; колонка дней sticky left.

**Dock в split (H2):** **скрыт**, пока открыт Today (решение 05; эталон так выглядит). Закрытие Today (§4) возвращает dock.

---

### H2 — Home: Today panel

Открывается при выборе дня (tap day / cell / СЕГОДНЯ).

```text
Сегодня | «19 июл» mini calendar   [или дата выбранного дня, не только «сегодня»]
Заголовок: если date === today → «Сегодня»; иначе «19 июля» (без слова Сегодня)
Rows…
```

**Заголовок панели:**  
- `date === today` → «Сегодня»  
- иначе → полная дата («19 июля») — чтобы не врать. Mini badge всегда отражает выбранный день.

**Строка Today по типу:**

| Тип | Leading | Title | Trailing | Tap |
|-----|---------|-------|----------|-----|
| Completion | Checkbox | name | — | Toggle (§5.1) |
| Time | Checkbox-look или пустой leading как эталон | name | время или пусто | Sheet Time |
| Count / Dist / Weight | то же | name | value + unit | Sheet numeric |
| Workout portal | **не** checkbox | name | длительность или «›» | → 06 сессия / edit |
| Checklist | **не** checkbox | name | `%` или пусто | → 07 день |

Done-стиль (dim + strikethrough): только для ordinary с записью (completion checked / value types с entry). Portal/checklist — без strikethrough «задачи».

**Закрытие Today (утверждено):**

1. **Обязательно:** tap **вне** панели Today (по области сетки / dimmed chrome выше) → панель закрывается, dock возвращается — как в эталоне.  
2. **Желательно (V1):** swipe down по панели Today с лёгкой spring/ease-анимацией dismiss (motion спокойный, без дофамина — 03).  
3. Не требуем отдельную кнопку-свернуть и не завязываемся на повторный tap по дню как единственный способ.

**Future day Today:** список виден; tap по ordinary/portal/checklist показывает короткий ненавязчивый toast/caption «Нельзя отметить будущий день» — без alert-стыда; взаимодействие не пишет в store.

---

### H3 — New tracker

```text
Новый трекер                          ✕
Имя
Symbol (+ helper: до 5 символов, для сетки)
Тип  [chips]
…conditional fields…
СОЗДАТЬ
```

**Type chips (RU labels):**

| Chip | type | Conditional |
|------|------|-------------|
| Завершение | completion | — |
| Время | time | Формат: «24 часа» (default) / «AM/PM» |
| Число | count | Unit optional text |
| Дистанция | distance | Unit picker: км (default), мили |
| Вес | weight | Unit picker: кг (default), фунты |
| Тренировка | workout_portal | Если уже есть portal → chip **disabled** + helper «Уже добавлена» |
| Чеклист | checklist | — |

Notes — нет.

**Имя:** обязательно, trim; placeholder по типу (напр. «Зарядка», «Кофе»).  
**Symbol:** max 5; default = авто из Name (транслит/обрезка RU→верхний регистр, эвристика на 09); unique case-insensitive среди trackers. Collision → inline error «Такой символ уже есть», CREATE disabled.  
**СОЗДАТЬ:** пишет tracker, `sortOrder = max+1`, закрывает форму, колонка справа.

После create checklist/workout — **не** обязательный онбординг; пользователь сам зайдёт в Symbol.

---

### H4 — Sheet: Time

Как эталон: `СЕГОДНЯ • 19 ИЮЛ` / дата; title = name; wheel HH:MM; toggle «Следующий день»; TRACK или ОБНОВИТЬ; в edit — trash → DELETE ENTRY confirm.

**nextDay:** хранить в EntryValue (04b); UI как эталон.

---

### H5 — Sheet: Count

Stepper ±, unit label, keypad, ОБНОВИТЬ / ОТСЛЕДИТЬ; trash в edit.  
`0` валиден. Удаление entry — trash → подтверждение.

---

### H6 — Sheet: Distance / Weight

Тот же каркас, что Count; unit из config (не редактируется в sheet).  
Десятичная точка на keypad — **да** (обоснование: кг/км). Count — целые по умолчанию; точка для count **нет** (целые чашки).

---

### H6b — Sheet: длительность портала (Habits-side)

Только если есть `completed` session на этот день.  
Reuse: два барабана часы/минуты **длительности** (не время суток) или число минут — **решение: H:MM wheel duration**, primary ОБНОВИТЬ → `session.durationSeconds`.  
Нет trash «удалить длительность» отдельно: удаление сессии — в 06.  
Если session `in_progress` / отсутствует — этот sheet не открывать; вести в 06.

---

### H7 — Tracker detail (ordinary only)

Вход: Symbol обычного трекера.

```text
Name                                          ✕
Symbol / Тип (badge) / Создано
[ Неделя | Месяц | Год | Всё время ]
ENTRIES  {count}
History heatmap
Список записей по периоду
РЕДАКТИРОВАТЬ | УДАЛИТЬ
```

**Range chips** — стиль fill selected (03).  
**Heatmap / list** — наличие entry в день.  
**РЕДАКТИРОВАТЬ** → форма как New tracker, но **без смены Type** (type readonly/disabled). Name, Symbol, unit/format editable.  
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

| Действие | Эффект |
|----------|--------|
| Unchecked → tap | Create entry `{kind:'completion'}`; cell `×`; Today checked + strikethrough |
| Checked → tap | Delete entry; cell `·` |
| Future | no-op + hint |

### 5.2 Time / Count / Distance / Weight

| Состояние | Tap Today/cell |
|-----------|----------------|
| Нет entry | Sheet create → TRACK/СОХРАНИТЬ |
| Есть entry | Sheet edit → ОБНОВИТЬ / DELETE ENTRY |
| Future | hint |

### 5.3 Порядок колонок

V1: порядок = `sortOrder` при создании (append).  
**Reorder колонок** — не в 05 (нет экрана Trackers internals). Можно добавить позже без ломания модели.

---

## 5. Стыковка с Workouts и Checklist (без поглощения)

Habits **владеет** home chrome и отображением всех колонок.

| Колонка | Habits делает | Habits не делает |
|---------|---------------|------------------|
| Workout portal | Показать длительность; жесты входа; New type; delete portal (cascade sessions via 04b) | UI подходов, шаблонов, секундомера |
| Checklist | Показать %; жесты входа; New type | Пункты, drag, день чеклиста |

После возврата из 06/07 home **сразу** отражает новые duration/%(reactive store).

---

## 6. Create / Edit / Delete (сводка)

| Сущность | Create | Edit | Delete |
|----------|--------|------|--------|
| Ordinary tracker | H3 | H7 EDIT (no type) | H7 DELETE confirm |
| Workout portal | H3 (once) | Name/Symbol — меню **⋯ в Workouts (06)** | Удаление — **⋯ в Workouts (06)** + confirm; cascade sessions (04b). Не через H7 / не случайно с home |
| Checklist tracker | H3 | Device 07 | Device 07 |
| Entry | sheets / checkbox | sheets | DELETE ENTRY / uncheck |

---

## 7. История и обзор

- Home grid = главный обзор во времени.  
- H7 detail = один ordinary tracker (week/month/year/all + heatmap + list).  
- Portal/checklist history — в 06/07, не дублировать H7.

---

## 8. Форматы отображения (решения 05)

| Величина | Формат |
|----------|--------|
| Clock time (привычка Время) | `HH:MM` 24h default; ampm если config |
| Workout duration в сетке | Из секунд: `h:mm` если h<10 иначе `hh:mm` (напр. `1:05`, `12:00`); >24ч — `Nh` + минуты упрощённо `N:MM` hours total (редкость) |
| Checklist | `0–100` + `%`, без десятичных |
| Count | as integer; Distance/Weight — до 2 знаков, trim trailing zeros |
| Месяц в title | русское имя месяца |

---

## 9. Empty / edge / offline

| Case | Поведение |
|------|-----------|
| Нет трекеров | H0 = photo_4 style, без copy |
| Нет записей в месяце | все `·` — норма |
| Future log | запрет + hint |
| Symbol collision | block create |
| Second workout type | chip disabled |
| Sheet kill app | discard |
| Offline | полный CRUD; без offline-banner |
| First launch never cached | системная ошибка load — вне Habits UX |
| Пустой Name create | CREATE disabled |
| Toggle Today закрытие | см. H2 |
| Выбран future + СЕГОДНЯ | прыжок на today |

---

## 10. Progressive disclosure

1. Пустая сетка → `+`.  
2. Один Completion → повседневный ритм эталона.  
3. Value types → sheets.  
4. Detail по Symbol — когда нужна история.  
5. Portal types — когда нужны тренировки/чеклисты.  
6. Settings редко.

---

## 11. Решения по уточнениям (2026-07-19)

| ID | Тема | Решение |
|----|------|---------|
| Q1 | Дни недели | **Одна буква** + **weekend banding** строк (эталон photo_4 / photo_9) |
| Q2 | Portal rename/delete | В модуле **Workouts (06)** через ⋯; не с home detail |
| Q3 | Empty H0 | Как photo_4: **без** подписей |
| Q4 | Закрытие Today | Tap **вне** панели (как эталон); плюс **swipe down** с анимацией |

Блокеров для апрува 05 нет.

---

## 12. Копирайт (RU) — ключи

| EN эталон | LifeOS |
|-----------|--------|
| Today | Сегодня |
| TODAY | СЕГОДНЯ |
| New tracker | Новый трекер |
| CREATE | СОЗДАТЬ |
| TRACK / UPDATE | ОТСЛЕДИТЬ / ОБНОВИТЬ |
| DELETE ENTRY | УДАЛИТЬ ЗАПИСЬ |
| EDIT / DELETE | ИЗМЕНИТЬ / УДАЛИТЬ |
| Settings | Настройки |
| Appearance | Оформление |
| Export Data | Экспорт данных |
| Next day | Следующий день |
| Week/Month/Year/All-Time | Неделя / Месяц / Год / Всё время |
| ENTRIES | ЗАПИСИ |
| History | История |
| Type names | см. H3 |

---

## 13. Шпаргалка

```text
Home grid = LifeOS root · RU · mono cells · 1-letter days · weekend bands
Ordinary: checkbox/sheets/detail · no future writes · 0 is value
Portal columns: display only + navigation · duration H:MM · %
+ creates all types · workout chip once · portal edit/delete in 06
Settings: theme + export JSON
H0 empty like photo_4 · no captions
Today closes: tap outside + swipe down · dock hidden while open
```
