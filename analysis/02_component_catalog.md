# 02 — Component catalog

**Источник:** `analysis/01_reverse_engineering.md` (утверждён) + `analysis/screenshots/` (01–25)  
**Дата:** 2026-07-19  
**Статус:** ✅ утверждён (2026-07-19)  

Только компоненты, **реально видимые** на скриншотах. Ничего не изобретено.  
Где состояний не хватает — § «Нужны скрины» в конце и пометки **[нет скрина]** у компонента.

**Не для LifeOS (содержимое):** Upgrade-баннер, бренд-footer Settings, onboarding-копирайт/логотип эталона. Сами *паттерны* shell (close, grouped list, CTA) — переиспользуемые.

---

## Индекс

| ID | Компонент | Экраны | Для LifeOS |
|----|-----------|--------|------------|
| C01 | CloseButton | 06–08, 12, 14, 16–19, 21–25 | да |
| C02 | IconButton | 04, 09, 15 (dock) | да |
| C03 | PrimaryButton | 01–04, 07–08, 12, 14–19, 21–22 | да |
| C04 | SecondaryButton | 24–25 (EDIT) | да |
| C05 | DestructiveButton | 24–25 (DELETE) | да |
| C06 | DestructiveConfirmButton | 23 (DELETE ENTRY) | да |
| C07 | LabeledTextField | 07–08, 12, 16–19 | да |
| C08 | HelperText | 07–08, 12, 16–19 | да |
| C09 | ChipSelect | 07–08, 12, 16–19 (Type / Time format); 24–25 (range) | да |
| C10 | UnitPickerField | 16–17 | да |
| C11 | ToggleRow | 14, 22–23 | да |
| C12 | Checkbox | 02, 10–11, 13, 20 | да |
| C13 | TypeBadge | 24 | да |
| C14 | MonthYearTitle | 04–05, 09–15, 20 | да |
| C15 | GridColumnHeader | 09–15, 20 | да |
| C16 | DayLabel | 03–05, 09–15, 20 | да |
| C17 | SelectedDayBadge | 04–05, 09–15, 20 | да |
| C18 | GridValueCell | 03, 09–15, 20 | да |
| C19 | MonthGrid | 04–05, 09–15, 20 | да (составной) |
| C20 | BottomDock | 04, 09, 15 | да |
| C21 | MiniCalendarBadge | 02, 05, 10–11, 13, 20 | да |
| C22 | TodayPanel | 05, 10–11, 13, 20 | да |
| C23 | TodayRow | 02, 10–11, 13, 20 | да |
| C24 | EntrySheetShell | 14, 21–23 | да |
| C25 | TimeWheelPicker | 14, 22–23 | да |
| C26 | CountStepper | 21 | да |
| C27 | NumericKeypad | 21 | да |
| C28 | SheetActionBar | 21–22 | да |
| C29 | ModalFormShell | 07–08, 12, 16–19 | да |
| C30 | MetaRow | 24 | да |
| C31 | StatCard | 24–25 | да |
| C32 | HistoryHeatmap | 24–25 | да |
| C33 | HistoryEntryRow | 25 | да |
| C34 | DetailActionBar | 24–25 | да |
| C35 | SettingsGroup + SettingsRow | 06 | паттерн да; пункты эталона — нет |
| C36 | UpgradeBanner | 06 | **нет** |
| C37 | BrandFooter | 06 | **нет** |
| C38 | OnboardingPageDots | 01–03 | паттерн опционален |
| C39 | TiltedPreviewCard | 02–03 | паттерн опционален |
| C40 | OnboardingPrimaryButton | 01–03 | вариант C03 (инверсия) |

---

## Примитивы

### C01 — CloseButton

- **Назначение:** закрыть модалку / экран.
- **Анатомия:** круглый hit-target + глиф `X` по центру; фон surface (тёмно-серый).
- **Иерархия:** обычно top-trailing относительно title.
- **Варианты:** один визуальный размер на всех экранах.
- **Состояния:** default. Pressed / disabled — **[нет скрина]**.
- **Интервалы:** отступ от safe-area / края sheet; рядом с title не пересекается.
- **Взаимодействие:** tap → dismiss.
- **Доступность:** круглая зона ≥ визуального круга; label подразумевается «Close».
- **Reuse:** Settings, New tracker, Entry sheet, Tracker detail.

### C02 — IconButton

- **Назначение:** вторичное действие-иконка (навигация месяца, add, more).
- **Анатомия:** squircle / rounded-square surface + монохромный глиф (`↑` `↓` `+` `…`).
- **Иерархия:** в BottomDock; равный вес кроме PrimaryButton.
- **Варианты по глифу:** prev-month, next-month, add-tracker, more/settings.
- **Состояния:** default. Pressed / disabled — **[нет скрина]**.
- **Интервалы:** равный gap между соседними IconButton в dock; высота ряда согласована с TODAY.
- **Взаимодействие:** tap. ↑/↓ → смена месяца; `+` → New tracker; `…` → Settings (по связи экранов).
- **Доступность:** квадратная hit-area; нужен accessible name (не только глиф).
- **Reuse:** только BottomDock на видимых экранах.

### C03 — PrimaryButton

- **Назначение:** главное подтверждение действия на экране/sheet.
- **Анатомия:** широкая светлая (белая) кнопка, label ALL CAPS тёмным, сильное скругление (stadium / large radius).
- **Иерархия:** низ экрана / низ sheet; визуально сильнее всего.
- **Варианты по label (одна форма):** `CONTINUE`, `GET STARTED` (onboarding light — см. C40 инверсия), `TODAY`, `CREATE`, `TRACK`, `UPDATE`.
- **Состояния:** default. Disabled / loading — **[нет скрина]**.
- **Интервалы:** full-width с боковыми inset; над home indicator; в SheetActionBar — справа от trash.
- **Взаимодействие:** tap → commit.
- **Доступность:** крупная высота; высокий контраст.
- **Reuse:** формы, sheets, dock (TODAY), onboarding (через C40).

### C04 — SecondaryButton

- **Назначение:** недеструктивное вторичное действие на detail.
- **Анатомия:** широкая тёмно-серая кнопка, белый ALL CAPS (`EDIT`).
- **Иерархия:** в паре с C05, слева.
- **Варианты:** только EDIT на 24–25.
- **Состояния:** default. **[нет скрина]** pressed/disabled.
- **Интервалы:** ~½ ширины ряда с gap до DELETE.
- **Взаимодействие:** tap → edit tracker (**результат не снят**).
- **Reuse:** DetailActionBar.

### C05 — DestructiveButton

- **Назначение:** удалить трекер целиком.
- **Анатомия:** тёмно-красный фон, ярко-красный ALL CAPS (`DELETE`).
- **Иерархия:** справа в DetailActionBar.
- **Состояния:** default. Confirm-step после tap — **[нет скрина]** (в отличие от entry delete на 23).
- **Reuse:** DetailActionBar.

### C06 — DestructiveConfirmButton

- **Назначение:** явное подтверждение удаления **записи** (entry).
- **Анатомия:** full-width красная кнопка; слева trash-иконка + текст `DELETE ENTRY` (белый).
- **Иерархия:** заменяет SheetActionBar primary на шаге confirm (23).
- **Состояния:** видно только confirm-state. Как возвращаются назад без удаления — **[нет скрина]** (кроме X close).
- **Взаимодействие:** tap → delete entry.
- **Reuse:** flow удаления entry из sheet.

### C07 — LabeledTextField

- **Назначение:** текстовый ввод с лейблом.
- **Анатомия:** label сверху → rounded rect field (surface) → value или placeholder.
- **Иерархия:** секции формы сверху вниз (Name, затем Symbol, иногда Unit free-text).
- **Варианты:**
  - placeholder (серый): «Exercise», «EXC», «Cups, reps, etc.»
  - filled: «Тренировка», «Кофе», «Wake up», «WAKE», «чашек»
  - Symbol: max 5 (ограничение в helper)
- **Состояния:** empty+placeholder; filled; focused с caret (08). Error / disabled — **[нет скрина]**.
- **Интервалы:** щедрый vertical gap между полями; field full-width inset.
- **Взаимодействие:** tap → keyboard (системная, 08).
- **Reuse:** New tracker form.

### C08 — HelperText

- **Назначение:** пояснение ограничений поля.
- **Анатомия:** одна строка мелким серым под field.
- **Варианты (видимые тексты):**
  - «Optional custom name for the grid. Max 5 characters.»
  - «e.g. 22:30» (под Time format)
  - «Optional custom unit.»
- **Состояния:** только static.
- **Reuse:** под Symbol / Unit / Time format.

### C09 — ChipSelect

- **Назначение:** single-select среди текстовых опций.
- **Анатомия:** wrap-ряд pill-chips; selected = тонкая **белая обводка**; unselected = surface без яркой обводки (или едва заметная).
- **Иерархия:** под section label (`Type`, `Time format`); на detail — ряд range без отдельного «Type»-style label над каждым.
- **Варианты контекста:**
  1. **Type:** Completion, Distance, Weight, Time, Count, Notes *(Notes в эталоне есть; в LifeOS не берём — см. 01)*
  2. **Time format:** AM/PM | 24-hour
  3. **Range (detail):** Week | Month | Year | All-Time — selected = **заливка белым + тёмный текст** (инверсия относительно Type chips)
- **Важно:** Type chips и Range chips — **разный selected-стиль**. Это два визуальных варианта одного семейства «выбор из pills», не идентичные токены.
- **Состояния:** selected / unselected. Multi-select и disabled — **[нет скрина]**.
- **Интервалы:** chips в 1–2 ряда с небольшим gap; range — одна горизонтальная линия.
- **Взаимодействие:** tap → смена выбора; Type меняет условные поля формы.
- **Reuse:** формы создания; фильтр периода на detail.

### C10 — UnitPickerField

- **Назначение:** выбор единицы из предустановленного списка.
- **Анатомия:** label `Unit` → rounded field с текущим значением + dual-chevron (↑↓) trailing.
- **Варианты значений на скринах:** `Kilometers`, `Kilograms`.
- **Состояния:** closed с value. Открытый picker / список опций — **[нет скрина]**.
- **Отличие от C07:** не free-text; индикатор picker.
- **Reuse:** Distance / Weight create. Count использует free-text Unit (C07), не этот контрол.

### C11 — ToggleRow

- **Назначение:** boolean-опция в sheet.
- **Анатомия:** label слева (`Next day`) + iOS-like switch справа.
- **Состояния:** **off** виден (14, 22–23). **On** — **[нет скрина]**. Эффект Next day на значение — не показан.
- **Reuse:** только Time entry sheet на видимых экранах.

### C12 — Checkbox

- **Назначение:** completion / done в Today row (и onboarding preview).
- **Анатомия:** leading control: пустой outline (unchecked) или с checkmark (checked).
- **Состояния:** unchecked (10, 13, 20 Кофе); checked (11, 13 Тренировка, 20 Wake/Тренировка). Uncheck обратно — **[нет скрина]**.
- **Взаимодействие:** для Completion — tap сразу логирует `x` в сетку. Для Time/Count checked появляется после записи через sheet (не обязательно тот же tap-only path).
- **Reuse:** TodayRow; onboarding preview card.

### C13 — TypeBadge

- **Назначение:** показать тип трекера в meta detail.
- **Анатомия:** маленькая gray pill, caps текст (`COMPLETION`).
- **Состояния:** только static display.
- **Reuse:** MetaRow Type. Не путать с ChipSelect (не интерактивен на 24).

---

## Главный экран — сетка и dock

### C14 — MonthYearTitle

- **Назначение:** текущий месяц контекста.
- **Анатомия:** `Month` (яркий) + `Year` (приглушённый) в одной строке, large title, top-leading.
- **Состояния:** один вид. Смена месяца через dock ↑↓ обновляет текст (логика из 01).
- **Reuse:** main во всех режимах.

### C15 — GridColumnHeader

- **Назначение:** Symbol трекера над колонкой; вход в detail.
- **Анатомия:** мелкий caps/uppercase серый текст над колонкой значений (`ТРЕНИ`, `WAKE`, `КОФЕ`).
- **Иерархия:** над GridValueCell; tap target — header.
- **Взаимодействие:** tap → Tracker detail (уточнено в 01).
- **Состояния:** 1 / 2 / 3 колонки видны; больше — **[нет скрина]** (горизонтальный скролл?).
- **Reuse:** MonthGrid.

### C16 — DayLabel

- **Назначение:** идентификация дня в строке сетки.
- **Анатомия:** двузначный номер (`01`…`19`) + однобуквенный weekday (`S M T W T F S`), tabular/mono-like.
- **Варианты:** ordinary (серый); selected day number заменён/обёрнут C17.
- **Weekend banding:** Сб/Вс — чуть более светлая полоса строки (09, 15).
- **Reuse:** MonthGrid; onboarding grid preview.

### C17 — SelectedDayBadge

- **Назначение:** красный badge — **только календарное сегодня**. Selected в full-month grid без badge и без accent wash (05 / 09); wash/контекст выбора — зона Today (H2), не строка месяца.
- **Анатомия:** красный rounded square/pill вокруг номера **сегодня**.
- **Состояния:** selected с row wash (05, 10–11, 13, 20); на full-month 04/15 — red badge на «сегодня», wash слабее или иной (**вариативность между экранами**).
- **Reuse:** MonthGrid.

### C18 — GridValueCell

- **Назначение:** значение трекера в день.
- **Анатомия:** ячейка на пересечении day × column.
- **Варианты значений (видимые):**
  - empty: `·`
  - Completion logged: `x` / `×`
  - Time logged: `07:40` (светлый / слегка розоватый)
  - Count logged на 20 в ячейке Кофе ещё `·` до записи — после UPDATE отдельного кадра сетки с числом **нет** (21 показывает sheet, не результат в grid) → post-count cell **[нет скрина]**
- **Distance/Weight cell** — **[нет скрина]**.
- **Взаимодействие:** тап по ячейке vs только через Today — **не разведено скринами** (логирование видно через Today → sheet).
- **Reuse:** MonthGrid.

### C19 — MonthGrid *(составной)*

- **Назначение:** память месяца — дни × трекеры.
- **Анатомия:** optional rounded surface-container → row of C15 headers → scrollable rows (C16 + N× C18); C17 на активной строке.
- **Варианты layout:**
  - **Empty columns** (04): только дни, без headers трекеров
  - **1–3 columns** (09, 13, 15, 20)
  - **Full-month** vs **compressed** над Today panel (05+)
- **Состояния:** empty data; partial fills; scroll (scrollbar на 04).
- **Интервалы:** плотные строки; контраст с «воздушными» формами.
- **Reuse:** главный экран; onboarding preview (C39) цитирует тот же язык.

### C20 — BottomDock

- **Назначение:** первичная навигация main в full-month режиме.
- **Анатомия:** горизонтальный ряд: C02↑ · C02↓ · C03 TODAY · C02+ · C02…
- **Иерархия:** над home indicator; floating над контентом.
- **Состояния:** виден на 04, 09, 15. В split+Today (05, 10…) dock **не виден** — скрыт или перекрыт: **[нет скрина]** явного правила.
- **Взаимодействие:** см. C02/C03.
- **Reuse:** main full-month.

---

## Today

### C21 — MiniCalendarBadge

- **Назначение:** компактная дата выбранного дня у заголовка Today.
- **Анатомия:** mini calendar tile — число (красным) + месяц caps (`JUL`) под/в блоке.
- **Reuse:** TodayPanel header; onboarding Today card.

### C22 — TodayPanel

- **Назначение:** быстрый ввод/обзор трекеров выбранного дня.
- **Анатомия:** title `Today` (large) + C21 trailing → список C23 (или пусто, 05).
- **Варианты:** empty (05); 1–3 rows (10–11, 13, 20).
- **Иерархия:** нижняя половина split-layout; поверх/ниже урезанного MonthGrid.
- **Взаимодействие:** появление при выборе дня (04→05). Закрытие панели — **[нет скрина]**.
- **Reuse:** main split.

### C23 — TodayRow

- **Назначение:** один трекер в Today.
- **Анатомия:** rounded surface row: leading C12 → Name → optional trailing value (`07:40`, onboarding: `7:30 AM`, `70.2 kg`, `2 cups`, `6.5 km`).
- **Состояния:**
  - pending: яркое имя, empty checkbox
  - done: dim + strikethrough + checked (+ value если тип с значением)
- **Взаимодействие:** tap → для Completion мгновенный toggle; для Time/Count открывает Entry sheet (14, 21).
- **Reuse:** TodayPanel; onboarding preview.

---

## Entry sheet (логирование)

### C24 — EntrySheetShell

- **Назначение:** контейнер записи/редактирования значения поверх сетки.
- **Анатомия:** bottom sheet (surface): top-leading `TODAY • 19 JUL` (small caps/gray) → title Name large → C01 close → body control → footer actions.
- **Варианты body:** Time (C25+C11) | Count (C26+C27). Distance/Weight/Notes body — **[нет скрина]** (Notes вне scope LifeOS).
- **Состояния:** create/track (`TRACK`, без trash на 14) vs edit (`UPDATE` + trash, 21–22) vs delete-confirm (C06, 23).
- **Reuse:** все typed entry flows.

### C25 — TimeWheelPicker

- **Назначение:** выбор времени.
- **Анатомия:** два барабана hour | minute; selected row в rounded highlight bar; соседние значения fade.
- **Состояния:** значение 07:40 на скринах. AM/PM колонка при формате AM/PM — **[нет скрина]** (в create выбран 24-hour).
- **Reuse:** Time entry sheet.

### C26 — CountStepper

- **Назначение:** изменить count ±1 и показать unit.
- **Анатомия:** card: unit label caps (`ЧАШЕК`) → large number → trailing/leading `−` `+` в rounded squares.
- **Состояния:** value `2` на 21. Zero / empty — **[нет скрина]**.
- **Reuse:** Count entry sheet.

### C27 — NumericKeypad

- **Назначение:** прямой ввод числа.
- **Анатомия:** сетка 1–9; низ: `0` + backspace. Без десятичной точки на 21.
- **Reuse:** Count sheet (под stepper). Нужна ли точка для Distance/Weight — **[нет скрина]**.

### C28 — SheetActionBar

- **Назначение:** footer sheet в edit/update.
- **Анатомия:** leading trash IconButton (red-tinted square) + trailing wide C03 (`UPDATE`). На track-first (14): только C03 `TRACK` без trash.
- **Взаимодействие:** trash → C06 confirm (22→23).
- **Reuse:** entry sheets.

---

## New tracker form

### C29 — ModalFormShell

- **Назначение:** каркас создания трекера.
- **Анатомия:** title `New tracker` centered + C01 → scrollable stack fields → sticky/bottom C03 `CREATE`.
- **Состав полей (видимый):** C07 Name, C07 Symbol + C08, C09 Type, условно C09 Time format | C10 Unit | C07 Unit free-text.
- **Состояния:** Completion без unit (07); Time + format (12); Distance/Weight + picker unit (16–17); Count + free unit (18–19). Keyboard open (08) поднимает/сжимает layout.
- **Reuse:** только create flow на скринах (edit form трекера после EDIT — **[нет скрина]**).

---

## Tracker detail

### C30 — MetaRow

- **Назначение:** свойства трекера.
- **Анатомия:** label leading (`Symbol` / `Type` / `Created`) + value trailing (текст или C13).
- **Reuse:** detail header block.

### C31 — StatCard

- **Назначение:** агрегат за выбранный range.
- **Анатомия:** large rounded card; small caps label `ENTRIES` top-leading; huge number value.
- **Состояния:** `1` при Week. Другие ranges / нули — **[нет скрина]** (chips есть, контент не переключён на кадрах).
- **Reuse:** detail.

### C32 — HistoryHeatmap

- **Назначение:** визуальная история вкладов по дням.
- **Анатомия:** grid мелких rounded cells; month labels under (`APR MAY JUN JUL`); empty = dark cell; filled = white cell.
- **Состояния:** empty vs filled. Интенсивность >1 уровня — **не видно** (только on/off). Tap по cell — **[нет скрина]**.
- **Reuse:** detail History.

### C33 — HistoryEntryRow

- **Назначение:** строка конкретной записи в списке истории.
- **Анатомия:** section header (`July` + `1 ENTRY`) → row: leading checkmark icon + date text (`SUN 19 JUL`).
- **Варианты для Time/Count values в списке — [нет скрина]** (только Completion-like check).
- **Reuse:** detail below heatmap (25).

### C34 — DetailActionBar

- **Назначение:** edit / delete трекера.
- **Анатомия:** C04 | C05 side-by-side bottom.
- **Reuse:** detail.

---

## Settings & onboarding (эталон)

### C35 — SettingsGroup + SettingsRow

- **Назначение:** grouped list настроек (inset grouped).
- **Анатомия:** rounded group card; rows с separators; row = title + optional trailing (chevron / lock / heart / external arrow).
- **Варианты trailing:** chevron (drill-in), icons (status/external).
- **Содержимое эталона не для LifeOS** (Upgrade-adjacent, Rate, iCloud lock и т.д.) — паттерн списка переиспользуем.
- **Внутренности Trackers / Appearance — [нет скрина]**.

### C36 — UpgradeBanner — **не для LifeOS**

Title + subtitle + white `Upgrade` pill. Не каталогизировать в дизайн-систему продукта.

### C37 — BrandFooter — **не для LifeOS**

Logo `///.` + app name + «BY GHESTER».

### C38 — OnboardingPageDots

- **Назначение:** прогресс онбординга.
- **Анатомия:** ряд маркеров; активный/`done` как `x`, будущий как `·` (01–03).
- **Reuse:** только onboarding эталона; копирайт/бренд не переносить.

### C39 — TiltedPreviewCard

- **Назначение:** маркетинговый preview UI на light onboarding.
- **Анатомия:** карточка с лёгким rotate + shadow; внутри язык Today (02) или MonthGrid (03).
- **Reuse:** опциональный паттерн; контент эталона не копировать.

### C40 — OnboardingPrimaryButton

Инверсия C03 на light: чёрная pill, белый label (`Continue`, `Get started`).

---

## Иерархия сборки (как экраны собираются)

```text
Main (full-month)
├── MonthYearTitle
├── MonthGrid [ColumnHeaders + DayRows(DayLabel, SelectedDayBadge?, GridValueCells)]
└── BottomDock [IconButtons + PrimaryButton TODAY]

Main (split)
├── MonthYearTitle
├── MonthGrid (compressed)
└── TodayPanel [MiniCalendarBadge + TodayRows[Checkbox, name, value?]]

New tracker
└── ModalFormShell [LabeledTextFields, HelperText, ChipSelect, UnitPicker?, PrimaryButton]

Entry sheet
└── EntrySheetShell
    ├── TimeWheelPicker + ToggleRow  |  CountStepper + NumericKeypad
    └── SheetActionBar | DestructiveConfirmButton

Tracker detail
├── CloseButton + title
├── MetaRows (+ TypeBadge)
├── ChipSelect (range)
├── StatCard
├── HistoryHeatmap
├── HistoryEntryRow(s)
└── DetailActionBar
```

---

## Gaps состояний (без новых скринов)

**Решение пользователя (2026-07-19):** дополнительные скрины не предоставляем. Недостающее поведение додумаем позже на шагах design system / модулей / implementation — многие решения очевидны из видимого паттерна.

Отложенные пункты (не блокеры):

1. BottomDock в split+Today
2. Ячейка сетки после Count/Distance/Weight
3. Distance/Weight entry UI
4. Toggle «Next day» = on
5. Disabled / error состояния controls
6. Range chips → разный StatCard/Heatmap
7. Edit tracker после EDIT
8. Uncheck Completion
9. >3 колонок на main
10. UnitPicker открытый список

---

## Краткие правила повторного использования (из наблюдаемого)

1. Сначала расширять существующий компонент вариантом, не плодить новый.
2. Primary = светлая caps CTA; destructive = красный; secondary = gray fill.
3. Пустая данные-ячейка всегда `·`, не иконка «ошибка».
4. Логирование значений — sheet; Completion может быть zero-sheet.
5. Close всегда C01-круг.
6. Type-chips (обводка) ≠ Range-chips (заливка) — не смешивать selected-токены.
