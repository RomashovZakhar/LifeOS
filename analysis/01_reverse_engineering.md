# 01 — Reverse engineering

**Эталон:** Things take time (by Ghester)  
**Источник:** `analysis/screenshots/` (photo 01–25) + `INDEX.md`  
**Дата анализа:** 2026-07-19  
**Статус:** ✅ утверждён (2026-07-19; уточнения пользователя внесены в §15)

Не перепроектирование LifeOS. Только разбор эталона.  
То, что по `ANTI_GOALS.md` нельзя переносить в продукт, отмечено блоком **«Не для LifeOS»**.

---

## 1. Философия продукта (как читается из UI)

Эталон продаёт идею: жизнь складывается из маленьких повторяющихся действий; ценность — в накоплении следов во времени, а не в «закрытии задачи на сегодня».

Доказательства:

- Onboarding (01): цитата Van Gogh про series of small things; tagline «An app for tracking the small things.»
- Onboarding (02–03): «Track what matters.» → «See how they add up.» — акцент на сумме записей в сетке, не на streak/score.
- Основной экран — **месячная сетка дней × трекеры**: история видима сразу, Today — вторичный слой для быстрой отметки.
- Нет геймификации на видимых экранах: нет очков, бейджей, streak-счётчиков, социальных фич.

**Вероятный принцип:** документирование > мотивация через давление.

---

## 2. Философия UX

- **Спокойствие и тишина.** Много воздуха, мало декора, минимум иконок.
- **Данные на первом плане.** Главный экран — таблица/сетка значений, не дашборд виджетов.
- **Один акцентный цвет** (красный) для «сегодня / выбранный день» и деструктивных действий. Остальное — нейтральная серая шкала на чёрном.
- **Состояния без стыда.** Пустая ячейка = точка (·), не красный «пропуск». Пропуск не выделен как ошибка.
- **Мало текста-инструкции.** Формы короткие; helper-текст только там, где нужна граница (Symbol max 5, optional unit).

---

## 3. Философия взаимодействия

- **Одно касание, когда возможно.** Completion: чекбокс в Today → сразу `x` в сетке (10→11).
- **Значения с picker/stepper**, не свободный текст для Time/Count (14, 21).
- **Bottom sheet** для логирования поверх сетки — контекст месяца не теряется (14, 21–23).
- **Создание vs запись разделены:** `+` → New tracker; тап по Today-item / ячейке → track/update sheet.
- **Редактирование и удаление явные.** Update + trash → confirm DELETE ENTRY (22→23). Нет скрытых жестов на скриншотах.
- **Навигация по времени:** ↑ ↓ + TODAY (04, 09, 15) — ↑/↓ меняют месяц; TODAY прыгает к сегодняшнему дню *(уточнено пользователем)*.

---

## 4. Карта экранов (по INDEX)

| #     | Экран                            | Режим | Суть                                                           |
| ----- | -------------------------------- | ----- | -------------------------------------------------------------- |
| 01    | Onboarding — quote + brand       | Light | Цитата, бренд `ttt.`, Continue                                 |
| 02    | Onboarding — Today preview       | Light | Наклонённая карточка Today с разными типами                    |
| 03    | Onboarding — grid preview        | Light | Наклонённая сетка «See how they add up», Get started           |
| 04    | Main — empty month               | Dark  | Список дней без колонок трекеров, dock                         |
| 05    | Main — day selected, Today empty | Dark  | Split: сетка + пустой Today                                    |
| 06    | Settings                         | Dark  | **Эталон only** — Upgrade / iCloud / Rate                      |
| 07–08 | New tracker — Completion         | Dark  | Name, Symbol, Type chips; RU ввод                              |
| 09    | Main — 1 column                  | Dark  | Колонка ТРЕНИ, точки                                           |
| 10–11 | Main + Today Completion          | Dark  | Unchecked → checked + `x` в сетке                              |
| 12    | New tracker — Time               | Dark  | + Time format AM/PM \| 24-hour                                 |
| 13–15 | Main + Time log                  | Dark  | Sheet Wake → значение `07:40` в сетке                          |
| 16    | New tracker — Distance           | Dark  | Unit: Kilometers (picker)                                      |
| 17    | New tracker — Weight             | Dark  | Unit: Kilograms (picker)                                       |
| 18–19 | New tracker — Count              | Dark  | Unit free-text («чашек»)                                       |
| 20–21 | Main + Count log                 | Dark  | Stepper + keypad, UPDATE                                       |
| 22–23 | Sheet edit / delete              | Dark  | Trash → DELETE ENTRY                                           |
| 24–25 | Tracker detail                   | Dark  | Meta, range chips, ENTRIES, heatmap, history list, EDIT/DELETE |

---

## 5. Навигация и информационная архитектура

### 5.1 Главный каркас

Два режима главного экрана:

1. **Full-month grid** (04, 09, 15) — заголовок месяца, вертикальный список дней, колонки трекеров, нижний dock.
2. **Split: grid + Today** (05, 10, 11, 13, 20) — верх: урезанный/скроллируемый фрагмент сетки; низ: панель Today для выбранного дня.

Переход empty→split при выборе дня (04→05). Dock в split-режиме на скриншотах не виден (перекрыт Today / home indicator) — **неопределённость**: скрыт ли dock полностью или уезжает под панель.

### 5.2 Нижний dock (full-month)

Слева направо:

- ↑ (chevron up) — предыдущий месяц
- ↓ (chevron down) — следующий месяц
- **TODAY** (primary, светлая широкая кнопка)
- **+** (новый трекер)
- **…** (вероятно Settings — совпадает с переходом к 06)

### 5.3 Модалки / sheets

- **New tracker** — полноэкранная/почти полноэкранная форма, X закрыть, CREATE внизу.
- **Track / Update entry** — bottom sheet поверх сетки: дата, название трекера, контрол значения, primary CTA, опционально delete.
- **Settings** — отдельный экран со списками, X закрыть.
- **Tracker detail** — отдельный экран по трекеру. Вход: тап по **Symbol** колонки (заголовок привычки) на главном экране *(уточнено пользователем)*.

### 5.4 Иерархия информации (главный экран)

1. Месяц / год
2. Колонки Symbol трекеров
3. Дни + значения в ячейках
4. Today-список (когда открыт)
5. Chrome / dock

Акцент: **выбранный день** (красный бейдж числа + тёплая полоса строки).

---

## 6. Типы трекеров и модель значений

На форме New tracker (07+) шесть типов:

| Type           | Значение в сетке                            | UI записи                  | Параметры создания            |
| -------------- | ------------------------------------------- | -------------------------- | ----------------------------- |
| **Completion** | `x` / ·                                     | Чекбокс в Today (tap)      | —                             |
| **Time**       | `HH:MM` (напр. 07:40)                       | Wheel picker + «Next day»  | Time format: AM/PM \| 24-hour |
| **Distance**   | число + unit _(не залогировано на скринах)_ | **не видно**               | Unit picker (Kilometers)      |
| **Weight**     | число + unit _(не залогировано)_            | **не видно**               | Unit picker (Kilograms)       |
| **Count**      | число _(после лога)_                        | Stepper ± + numeric keypad | Unit: optional free text      |
| **Notes**      | **не видно**                                | **не видно**               | —                             |

**Notes:** в эталоне тип есть в chips, скринов записи нет. Для LifeOS пользователь **не хочет** Notes как формат привычки — в продукт не переносим; gap по UI записи закрываем как «не нужен».

Поля создания общие:

- **Name** — отображаемое имя (Today, detail)
- **Symbol** — короткий ярлык колонки, max 5, optional custom (плейсхолдер часто автоиз Name: EXC, ТРЕНИ, WAKE, КОФЕ)

Onboarding-превью (02–03) показывает те же семейства: Time (Wake), Completion (Read), Weight, Count (Caffeine), Distance (Run).

---

## 7. Язык дизайна

### 7.1 Тема

- **Основное приложение:** dark — почти pure black фон, поверхности dark gray.
- **Onboarding:** light — white / off-white; превью-карточки тёмные или светлые с тенью, слегка наклонены.
- Light mode _основного_ приложения на скриншотах **нет** (gap в INDEX).

### 7.2 Цвет

| Роль                                                     | Наблюдение                                                             |
| -------------------------------------------------------- | ---------------------------------------------------------------------- |
| Background                                               | Чёрный / near-black                                                    |
| Surface / cards / inputs                                 | Тёмно-серый (iOS-like `#1C1C1E`-семейство)                             |
| Primary text                                             | Белый                                                                  |
| Secondary / placeholders / helpers                       | Средне-серый                                                           |
| Accent «today/selected»                                  | Яркий красный на числе дня; календарная иконка «19 JUL» тоже с красным |
| Row selection                                            | Приглушённая золотисто-коричневая полоса по строке                     |
| Weekend banding                                          | Слегка более светлые полосы на Сб/Вс (09, 15)                          |
| Empty cell                                               | Тусклая точка `·`                                                      |
| Logged completion                                        | `x` / `×` светлый                                                      |
| Logged time                                              | Светлый / слегка розоватый текст значения                              |
| Primary CTA (CREATE / TRACK / UPDATE / TODAY / Continue) | Светлая (белая) кнопка, тёмный текст                                   |
| Destructive                                              | Красный текст/фон (DELETE, DELETE ENTRY, trash)                        |
| Onboarding CTA                                           | Чёрная pill, белый текст (инверсия dark-app CTA)                       |

Точные hex **не извлечены инструментально** — значения выше качественные.

### 7.3 Скругления

- Везде заметный radius: inputs, chips, cards, sheets, dock-кнопки, heatmap-ячейки.
- Primary CTA — stadium / сильно скруглённый прямоугольник.
- Close — круг с X.
- Checkbox Completion: скруглённый квадрат / круг с галочкой (в Today).
- Date badge «сегодня»: скруглённый квадрат/pill красный.

Радиусы выглядят как единая система «мягкого iOS», без острых углов.

### 7.4 Типографика

- **UI chrome / заголовки:** современный grotesk sans (похож на SF Pro) — July, Today, Settings, New tracker, имена трекеров.
- **Сетка дней / значения ячеек / onboarding-цитата:** более «табличный» / mono-like ритм (равная ширина цифр дней `01`…`19`, буквы дней недели).
- Иерархия размеров: Month title large → Today large → body → Symbol caps small → helper smallest.
- Month title: «July» ярче, «2026» приглушён.
- CTA labels часто **ALL CAPS**: CREATE, TRACK, UPDATE, TODAY, DELETE ENTRY, EDIT, DELETE.
- Type chip / meta badge: Caps (COMPLETION).

Смешение языков на UI: английский chrome (Today, Settings, Type names) + пользовательский контент RU («Тренировка», «Кофе», Symbol «ТРЕНИ»/«КОФЕ»). Weekday letters в сетке — **английские** S M T W T F S.

### 7.5 Интервалы и ритм

- Щедрые вертикальные отступы между секциями форм.
- Сетка: плотные строки дней (высокая плотность данных), контраст с «дышащими» формами/onboarding.
- Горизонтальные поля: inset от краёв ~safe area; карточки/списки inset-grouped (Settings).
- Today items — отдельные rounded rows с внутренним padding, не «голый» list separator.

Точная 4/8-pt сетка **не измерима** по скринам — **неопределённость**.

### 7.6 Иконография

Минимальная, функциональная:

- X close
- ↑ ↓
- -
- …
- checkbox / checkmark
- trash
- chevron `>` в Settings
- calendar mini «19 / JUL»
- padlock, heart, external-arrow **только в Settings эталона**
- логотип `///.` — бренд эталона

Нет иллюстративных иконок у типов трекеров на формах (только текст chips).

### 7.7 Тени / глубина

- Onboarding: мягкая тень у наклонённых карточек.
- Dark app: глубина через уровни серого и overlays sheets, не через многослойные shadows.
- Нет стекломорфизма, градиентных виджетов, glow.

---

## 8. Повторно используемые UI-паттерны

1. **Month day-list + multi-column value grid**
2. **Selected day**: red number badge + warm row wash
3. **Empty = · , filled = type-specific glyph/value**
4. **Today panel**: title + calendar chip + list of tracker rows
5. **Today row**: leading control (checkbox) + name + trailing value; done = dim + strikethrough
6. **Bottom dock**: icon cluster + primary TODAY + + + …
7. **Modal form**: title + circular X + stacked fields + bottom primary
8. **Type chips** (single-select, white border when selected)
9. **Conditional fields** by type (Time format / Unit)
10. **Bottom sheet logger**: TODAY • date · title · control · primary; edit mode + trash
11. **Destructive confirm**: full-width red DELETE ENTRY
12. **Inset grouped settings lists**
13. **Detail**: meta rows, range chips (Week/Month/Year/All-Time), big ENTRIES stat, heatmap History, entry list, EDIT | DELETE
14. **Onboarding**: quote/brand → tilted preview card → headline → page dots (`x`/`·`) → Continue/Get started

---

## 9. Шаблоны взаимодействия (flows)

### 9.1 Первый запуск (эталон)

01 → 02 → 03 → Get started → (пустой main 04).

**Не для LifeOS:** бренд, цитата, копирайт онбординга эталона (см. ANTI_GOALS). Паттерн «короткий light intro + tilted preview» — наблюдение, не требование копировать.

### 9.2 Создать трекер

`+` → New tracker → Name / Symbol / Type [+ conditional] → CREATE → колонка появляется на main (09).

### 9.3 Отметить Completion

Открыть день / Today → tap checkbox → checked + strikethrough + `x` в сетке (10→11). Снятие галочки на скринах **не показано**.

### 9.4 Записать Time

Tap Wake (unchecked) → sheet wheel → (Next day off) → TRACK → значение в сетке + checked в Today (14→15→20).

### 9.5 Записать / обновить Count

Tap Кофе → sheet stepper + keypad → UPDATE; в edit-режиме есть trash (21).

### 9.6 Удалить entry

Edit sheet → trash → DELETE ENTRY (22→23).

### 9.7 Деталь трекера

Экран 24–25: просмотр статистики и истории, EDIT / DELETE трекера целиком.  
**Вход:** тап по Symbol колонки на главном экране.

### 9.8 Settings

`…` (вероятно) → Settings.  
**Не для LifeOS из этого экрана:** Upgrade, iCloud Backup, Rate the App, Support как маркетинг, бренд footer «THINGS TAKE TIME / BY GHESTER», Replay Intro эталона.  
Потенциально релевантные _идеи_ категорий (не копировать as-is): Trackers, Appearance, Export Data — внутренности **не сняты**.

---

## 10. Анимация

На статичных скриншотах почти не видна.

Косвенно:

- Sheets / модалки — стандартный bottom-sheet / present.
- Onboarding cards — статичный tilt (не обязательно animated).
- Wheel picker / keyboard — системные.

**Неопределённость:** duration, spring, transitions между full-month и split-Today.

---

## 11. Доступность (что можно вывести)

- Крупные primary CTA, адекватный hit-area у dock.
- Высокий контраст белый/чёрный в dark UI.
- Красный акцент дня — сильный; риск для deuteranopia **не проверялся**.
- Dynamic Type / VoiceOver / Reduce Motion — **не видно**.
- Symbol max 5 помогает плотности, но длинные RU-имена живут в Today, не в колонке.

---

## 12. Вероятные принципы проектирования (синтез)

1. История важнее «сегодняшнего чеклиста» — сетка первична.
2. Тип значения диктует контрол записи, не наоборот.
3. Пустота нейтральна (·), не наказание.
4. Один акцент цвета; остальное — типографика и ритм.
5. Минимум chrome; иконки только для навигации/системных действий.
6. Primary action всегда одна и очевидная внизу формы/sheet.
7. Редактирование и удаление — отдельные явные шаги.
8. Расширяемость через новые колонки одного паттерна, не через новые «дома».

---

## 13. Не для LifeOS (из эталона)

По `ANTI_GOALS.md` и INDEX:

- Подписка / Upgrade / «unlimited access»
- iCloud Backup как обязательный path
- Rate the App, Support & Feedback (маркетинг), Terms как внешний маркетинг-блок
- Бренд `///.`, «Things take time», «BY GHESTER»
- Онбординг-копирайт и цитата эталона
- Replay Intro эталона

---

## 14. Gaps покрытия (нужно ли больше скринов?)

Уже в INDEX; подтверждено анализом:

| Gap                                     | Влияние на reverse                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| Light mode основного app                | Не знаем инверсию токенов                                                         |
| Appearance / Trackers settings insides  | Не знаем настройки порядка/видимости трекеров, темы                               |
| Notes entry UI                          | **Закрыто:** Notes не берём в LifeOS; скрины не нужны                             |
| Distance / Weight logging UI            | Создание есть, запись нет — вероятно похоже на Count (число + unit), **гипотеза**; не блокер шага 01 |
| Empty states beyond 04–05               | Частично есть                                                                     |
| Error / offline UI                      | Не видно (эталон native; у LifeOS offline обязателен отдельно)                    |
| Как открывается Tracker detail          | **Закрыто:** тап по Symbol колонки на main                                        |
| Точная семантика ↑ ↓                    | **Закрыто:** меняют месяц                                                         |
| Снятие Completion / multi-entry per day | Не видно                                                                          |
| Поведение «Next day» у Time             | Toggle виден, эффект не показан                                                   |

Для **этого шага** текущего набора **достаточно**. Уточнения пользователя внесены (см. §15).

---

## 15. Уточнения пользователя (2026-07-19)

| # | Вопрос | Ответ |
|---|--------|--------|
| 1 | Как открывается Tracker detail? | Тап сверху по **Symbol** привычки на главном экране |
| 2 | Что делают ↑ / ↓? | Меняют **месяц** |
| 3 | Notes / доп. скрины? | Notes как формат привычки **не нужен** в LifeOS → скрины не добавляем |
| 4 | Язык UI эталона (EN+RU) | Не уточнялся; для LifeOS решается на IA — не блокер шага 01 |

---

## 16. Неопределённости (сводка)

Явно не утверждается:

- Hex-токены и точная spacing-шкала
- Анимации и жесты (swipe-to-delete и т.п.)
- Light appearance основного UI
- UI записи Distance / Weight (Notes снят с scope LifeOS)
- Dock в split-режиме
- Полный список Unit для Distance/Weight
- Поведение Next day
- Есть ли несколько записей одного трекера в день

**Снято уточнениями:** вход в detail; семантика ↑↓; необходимость Notes.

Всё остальное в §§1–12 опирается на видимые 01–25 + ответы пользователя.

---

## 17. Краткий вердикт

Эталон — **тёмный, тихий, табличный трекер привычек/метрик**: месячная сетка как память, Today как быстрый ввод, типы значений через единую форму и typed sheets. Визуальный язык: black/gray + один red accent, rounded surfaces, caps CTA, mono-like day grid, минимум иконок. Геймификации и «стыда за пропуск» нет. Маркетинговый и брендовый слой Settings/onboarding к языку продукта не относится и в LifeOS не переносится.
