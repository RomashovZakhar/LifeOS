# 03 — Design system

**Основа:** эталон Things take time → язык LifeOS  
**Входы:** `01_reverse_engineering.md`, `02_component_catalog.md`, скрины 01–25  
**Дата:** 2026-07-19  
**Статус:** ✅ утверждён (2026-07-19; решения §17: dark+light, sans+mono, accent `#FA373B`)

## Достоверность токенов


| Уровень          | Значение                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------ |
| **A — высокая**  | Стабильно видно на многих экранах; структура роли ясна                                     |
| **B — средняя**  | Hex/размер сняты с JPEG-скринов (± сжатие, антиалиас) или однозначно выводятся из паттерна |
| **C — гипотеза** | Логичное продолжение системы; на скринах не измерено / не показано                         |


Имена токенов — **предложение для LifeOS** (не заявлено эталоном).  
Hex ниже с пометкой B — **рабочие стартовые значения**, не «пиксель-perfect брендбук».

---

## 1. Design principles

1. **Тишина важнее декора.** Нет градиентов, стекломорфизма, glow, лишних теней (ANTI_GOALS + эталон dark UI).
2. **Данные > chrome.** Сетка и значения несут смысл; UI-обвязка минимальна.
3. **Один акцент.** Красный эталона (`#FA373B`) — «сегодня / выбор / опасность» в **обеих** темах. Не плодить вторую акцентную палитру.
4. **Пустота нейтральна.** Empty = `·`, не ошибка и не стыд.
5. **Одно primary-действие** на поверхность (экран / sheet / form).
6. **Сначала вариант существующего компонента**, потом новый (каталог 02).
7. **Плотность там, где история; воздух там, где ввод.** Grid плотный; формы и sheets дышат.
8. **Mobile-first, one hand.** Крупные CTA, dock внизу, sheets снизу.

---

## 2. Theme

| Тема | Где видно в эталоне | LifeOS V1 |
|------|---------------------|-----------|
| **Dark (OLED black)** | Main, forms, sheets, detail, settings | **Обязательна** |
| **Light** | Onboarding 01–03 (частичный прецедент) | **Обязательна** |

**Решение пользователя (2026-07-19):** V1 поддерживает **обе** схемы — dark + light (переключение Appearance).

- Dark — полная реконструкция по основным экранам эталона (A/B).
- Light для *основного* app на скринах нет → светлая палитра приложения **реконструируется зеркально** от dark + ориентиры onboarding (`#F5F5F5` bg, инверсия CTA) — уровень **C** для surface-шкалы light, уточняется на implementation.
- Токены — одни semantic-имена; значения меняются от `[data-theme="dark|light"]` / `prefers-color-scheme` + ручной override.

Accent **общий** для обеих тем (красный эталона) — см. §3 и §17.

---

## 3. Color tokens

### 3.1 Core (dark) — роли


| Token                        | Роль                                                               | Старт hex (B)                        | Док.                                 |
| ---------------------------- | ------------------------------------------------------------------ | ------------------------------------ | ------------------------------------ |
| `color.bg`                   | Экранный фон                                                       | `#000000`                            | A/B — чистый чёрный на main          |
| `color.surface`              | Карточки, inputs, chips unselected, dock icon btn, settings groups | `#171717` … `#262626`                | B — два уровня surface               |
| `color.surface.raised`       | Today row, input fill, secondary btn                               | `#262626`                            | B                                    |
| `color.surface.sunken`       | Sheet/grid container чуть отличный от bg                           | `#121212`                            | B                                    |
| `color.text.primary`         | Заголовки, имена, значения                                         | `#FFFFFF` / `#FAFAFA`                | A                                    |
| `color.text.secondary`       | Year в title, helpers, placeholders, Symbol headers, meta labels   | ~`#8E8E93`–`#A0A0A0`                 | B/C — точный hex не стабилен на JPEG |
| `color.text.disabled` / done | Strikethrough Today done                                           | primary @ ~50–60% opacity            | B                                    |
| `color.accent`               | **Today** day badge (только календарное сегодня); mini calendar day | **`#FA373B`** (рабочий якорь; сэмпл ~`rgb(250,55,59)`, рядом `#FC3E40`) | **Зафиксировано** — красный эталона (§17) |
| `color.accent.soft`          | Row wash выбранного дня                                            | `#1B1910` (тёплый dirty olive/brown) | B                                    |
| `color.border.selected`      | Type chip selected ring                                            | `#FFFFFF` thin                       | A                                    |
| `color.cta.bg`               | Primary button (dark theme)                                        | `#F5F5F5` / `#FAFAFA`                | B                                    |
| `color.cta.fg`               | Primary label                                                      | `#000000` / `#171717`                | B                                    |
| `color.danger.bg`            | DELETE btn fill / trash well                                       | `#391D1B` (приглушённый)             | B                                    |
| `color.danger.fg`            | DELETE text                                                        | яркий red ~ accent family            | B                                    |
| `color.danger.solid`         | DELETE ENTRY full button                                           | `#FF463A`                            | B                                    |
| `color.heatmap.empty`        | Heatmap cell off                                                   | ~ surface dark                       | B                                    |
| `color.heatmap.filled`       | Heatmap cell on                                                    | `#FAFAFA`                            | B                                    |
| `color.overlay`              | Затемнение за sheet                                                | bg @ opacity (не измерено)           | C                                    |
| `color.grid.empty`           | Glyph `·`                                                          | secondary @ low opacity              | A                                    |
| `color.grid.completion`      | `x`                                                                | text.primary                         | A                                    |
| `color.grid.time`            | Time value в ячейке                                                | primary или слегка warm/pink         | C — на JPEG не поймано надёжно       |


### 3.2 Surface scale (предложение)

Чтобы не плодить случайные серые:

```text
bg           #000000
surface-1    #121212   // grid well
surface-2    #171717   // dock icons, some cards, sheet?
surface-3    #262626   // inputs, today rows, edit btn
```

**Достоверность B** — значения из сэмплов; эталон может использовать системные iOS labels.

### 3.3 Light (полная схема V1)

**Решение:** light — равноправная тема, не только onboarding.

Ориентиры эталона: onboarding bg `#F5F5F5`, CTA инверсия `#171717` / белый текст. Surface-шкала основного light UI — **C** (зеркальная реконструкция).

| Token | Dark | Light (старт) | Док. |
|-------|------|---------------|------|
| `color.bg` | `#000000` | `#F5F5F5` | B (light из onboarding) |
| `color.surface.sunken` / surface-1 | `#121212` | `#EEEEEE` | C |
| `color.surface` / surface-2 | `#171717` | `#E8E8E8` | C |
| `color.surface.raised` / surface-3 | `#262626` | `#FFFFFF` | C |
| `color.text.primary` | `#FFFFFF` | `#000000` | B |
| `color.text.secondary` | gray | `#6C6C70`–`#8E8E93` | C |
| `color.accent` | `#FA373B` | **`#FA373B`** (тот же) | зафиксировано |
| `color.accent.soft` | `#1B1910` | тёплый wash на светлом (напр. `#F0E6D8` @ низкая opacity) | C |
| `color.border.selected` | `#FFFFFF` | `#000000` | C (инверсия кольца) |
| `color.cta.bg` | `#FAFAFA` | `#171717` | B |
| `color.cta.fg` | `#171717` | `#FFFFFF` | B |
| `color.danger.*` | как §3.1 | те же red family (контраст проверить на light) | B/C |
| `color.heatmap.empty` | surface dark | surface light gray | C |
| `color.heatmap.filled` | `#FAFAFA` | `#171717` | C |
| `color.overlay` | black @ opacity | black @ lighter opacity | C |

**Правило:** не вводить второй акцент для light. Weekend banding / row wash — пересчитать контраст, не копировать dark hex as-is.

### 3.4 Чего нет (намеренно)

- Градиенты, бренд-фиолетовый, «success green» для completion
- Отдельный цвет «пропуска» / streak
- Цветные иконки типов трекеров

---

## 4. Typography

### 4.1 Families

**Решение пользователя (2026-07-19):** два семейства — **system (sans)** + **явный mono**.

| Role | Что это | LifeOS | Где |
|------|---------|--------|-----|
| **`font.sans` (system)** | Обычный гротеск: **без засечек, не моноширинный** (SF Pro / system-ui). Не serif. | `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif` | Chrome UI: заголовки экранов, Today names, формы, settings, кнопки, sheet titles |
| **`font.mono` (explicit)** | Явный моноширинный шрифт (подключить в PWA) | Кандидаты на implementation: `ui-monospace`, `"SF Mono"`, `Menlo`, или веб-файл (IBM Plex Mono / JetBrains Mono — выбрать один при коде) | MonthGrid: дни, weekday letters, ячейки значений; Symbol headers; heatmap labels; крупные stat-цифры — по желанию |

**Уточнение терминов:** да — «system» = proportional sans-serif UI font, не mono и не с засечками. «Mono» = отдельный monospaced face для «журнальной» сетки.

```text
font.sans  → UI chrome, prose-like labels
font.mono  → data grid & tabular artefacts
```

Не использовать serif в V1.

### 4.2 Scale (роли, не пиксели)


| Token          | Использование                                                | Относительный размер                 | Док. |
| -------------- | ------------------------------------------------------------ | ------------------------------------ | ---- |
| `type.display` | Month name, Today, detail title, sheet title                 | крупнейший                           | A    |
| `type.title`   | Modal titles (`New tracker`, `Settings`)                     | large                                | A    |
| `type.body`    | Today row name, form values, settings rows                   | medium                               | A    |
| `type.caption` | Symbol headers, meta labels, `TODAY • 19 JUL`, ENTRIES label | small caps / uppercase часто         | A    |
| `type.helper`  | Helper under fields                                          | smallest, secondary                  | A    |
| `type.stat`    | ENTRIES number                                               | display+                             | A    |
| `type.grid`    | Day numbers, cell values                                     | compact, dense; **`font.mono`**      | A    |
| `type.cta`     | Button labels                                                | medium, **UPPERCASE**; **`font.sans`** | A    |


Точные px/rem — **C** до реализации (измерение со скрина нестабильно из‑за screenshot scale).

### 4.3 Style rules

- Month title: `July` primary + `2026` secondary; display на **`font.sans`**
- Grid / cell values / day labels: **`font.mono`**
- CTA / destructive actions: **UPPERCASE**, **`font.sans`**
- Type badge / chip labels: Title Case или caps (`COMPLETION`) — в эталоне смешанно; для LifeOS зафиксировать одно правило на шаге модулей
- Symbol: max 5 characters, uppercase-friendly; предпочтительно **`font.mono`** в header колонки

---

## 5. Spacing tokens

**База:** вероятная 4-pt / 8-pt система (C), потому что iOS-like UI; **не измерено**.


| Token     | Предложение | Где проявляется                         | Док.                 |
| --------- | ----------- | --------------------------------------- | -------------------- |
| `space.1` | 4           | микро-gap chips                         | C                    |
| `space.2` | 8           | gap icon buttons в dock; chip gap       | C                    |
| `space.3` | 12          | padding внутри compact controls         | C                    |
| `space.4` | 16          | screen horizontal inset (safe + margin) | B (визуально ~16–20) |
| `space.5` | 20–24       | padding Today row / input               | B/C                  |
| `space.6` | 32          | section gaps в формах                   | B                    |
| `space.7` | 40–48       | крупные вертикальные паузы onboarding   | B                    |


**Ритм:**

- **Dense:** MonthGrid row height — минимальный комфортный tap (~44pt hit желателен, C для a11y)
- **Airy:** New tracker sections, detail blocks

`safe-area-inset-`* обязательны (TECH) — не токен эталона, но правило LifeOS (A для продукта).

---

## 6. Radius tokens


| Token         | Предложение | Применение                              | Док. |
| ------------- | ----------- | --------------------------------------- | ---- |
| `radius.sm`   | ~8          | heatmap cells, мелкие controls          | C    |
| `radius.md`   | ~12         | inputs, chips, today rows, icon buttons | B    |
| `radius.lg`   | ~16–20      | cards (stat, settings group), sheet top | B    |
| `radius.pill` | 999         | Primary CTA stadium; some chips         | A    |
| `radius.full` | 9999        | CloseButton circle                      | A    |


Острых углов нет (A).

---

## 7. Elevation & depth


| Уровень           | Как сделано в эталоне    | Token idea                 | Док.                                          |
| ----------------- | ------------------------ | -------------------------- | --------------------------------------------- |
| 0 Base            | `color.bg`               | —                          | A                                             |
| 1 Surface         | Более светлый gray fill  | surface-                   | A                                             |
| 2 Overlay sheet   | Sheet поверх dimmed grid | `overlay` + surface        | A                                             |
| 3 Onboarding card | Мягкая shadow + tilt     | **только marketing light** | A для эталона; **не тащить** в dark LifeOS UI |


**Правило LifeOS:** в dark UI глубина = **слои заливки**, не multi-shadow / blur / glass (A + ANTI_GOALS).

Hairline separators внутри Settings groups — да (A). Внешние card shadows в dark — нет (A).

---

## 8. Motion

На скринах почти не видно (A = «unknown»).


| Паттерн          | Вероятное поведение               | Док.                                  |
| ---------------- | --------------------------------- | ------------------------------------- |
| Sheet present    | Spring/ease from bottom           | C                                     |
| Modal form       | Full-screen cover / push          | C                                     |
| Month change ↑↓  | Instant swap или лёгкий crossfade | C                                     |
| Completion check | Мгновенный state change (10→11)   | B — без заметной celebration-анимации |
| Heatmap / stats  | Без анимации на кадрах            | C                                     |


**Принцип LifeOS (из VISION/ANTI_GOALS, не из эталона):** motion для присутствия и иерархии, не для дофамина; без bounce-конфетти. Конкретику — на implementation / consistency.

---

## 9. Icons

### 9.1 Правила

- Только **функциональные** глифы; не иллюстрации типов трекеров (A)
- Монохром; danger-исключение для trash (A)
- Stroke-стиль системный / SF Symbols-like (B)
- Не добавлять иконку, если хватает текста (chips Type — текст only) (A)

### 9.2 Набор, видимый в эталоне (для LifeOS)


| Glyph                 | Использование          |
| --------------------- | ---------------------- |
| `x` close             | C01                    |
| `chevron.up` / `down` | месяц                  |
| `plus`                | новый трекер           |
| `ellipsis`            | settings/more          |
| `checkmark`           | checkbox / history     |
| `trash`               | delete entry / confirm |
| `chevron.right`       | settings drill-in      |
| `delete.left`         | keypad backspace       |
| `minus` / `plus`      | stepper                |


**Не переносить:** lock, heart, external-link в маркетинговом смысле; бренд-логотип эталона.

Mini calendar badge — **композитный** контрол (число+месяц), не «иконка из набора».

---

## 10. Grid (data grid, не CSS grid page)

Это **главный визуальный объект** системы.


| Правило                                                              | Док.  |
| -------------------------------------------------------------------- | ----- |
| Ось Y = дни месяца, ось X = трекеры (Symbol columns)                 | A     |
| Day label: `DD` + weekday letter                                     | A     |
| Empty cell glyph: middle dot `·`                                     | A     |
| Completion: `x`; Time: `HH:MM`; Count: number (+ unit в Today/sheet) | A / B |
| Today: `color.accent` badge на числе (только в текущем месяце); selected в full-month **без** badge и без accent wash (05 / 09) | A / уточнение 05 |
| Weekend rows: subtle banding (lighter strip)                         | B     |
| Column header = Symbol; tap → detail                                 | A     |
| Плотность > декоративность                                           | A     |


Горизонтальный скролл при многих колонках — **C** (на скринах ≤3).

---

## 11. Layout

### 11.1 App shell (main)

```text
┌─────────────────────────┐
│ MonthYearTitle          │
│ MonthGrid (flex)        │
│                         │
│ BottomDock              │  ← full-month
└─────────────────────────┘

┌─────────────────────────┐
│ MonthYearTitle          │
│ MonthGrid (compressed)  │
├─────────────────────────┤
│ TodayPanel              │  ← split
└─────────────────────────┘
```

Dock в split — **отложено** (02 gaps). **Гипотеза C:** Today занимает нижнюю зону; dock скрыт или под панелью.

### 11.2 Modal / sheet

- Forms: top bar (title + close) → content → primary bottom
- Entry sheet: grab/sheet surface ~50–80% высоты; context date + title; control; action bar
- Detail: scroll content + pinned DetailActionBar

### 11.3 Insets

- Горизонтальный inset ~`space.4`
- Bottom CTA выше home indicator
- Ширина контента = viewport минус insets (phone)

### 11.4 Breakpoints


| Breakpoint                    | V1                       | Док.                        |
| ----------------------------- | ------------------------ | --------------------------- |
| `phone` (~390 logical CSS px) | **единственный целевой** | A для продукта (PWA iPhone) |
| `tablet` / `desktop`          | вне V1                   | A (TECH/PRODUCT mobile)     |


Не проектировать desktop layout сейчас. При большом viewport — центрированная колонка max-width ~430 (C), без многоколоночного dashboard.

---

## 12. Component rules (связка с каталогом 02)


| Правило                                                                    | Компоненты                          |
| -------------------------------------------------------------------------- | ----------------------------------- |
| Primary = light fill + dark uppercase label (dark theme)                   | C03                                 |
| Secondary = surface-3 + white label                                        | C04                                 |
| Destructive = danger fill + danger text; confirm = solid danger full-width | C05, C06                            |
| Close always circular surface + X                                          | C01                                 |
| IconButton = surface squircle, equal size in dock                          | C02                                 |
| Type ChipSelect selected = **white ring**, not fill                        | C09 type                            |
| Range ChipSelect selected = **white fill + dark text**                     | C09 range — **не смешивать** с type |
| One ChipSelect mode per context                                            | C09                                 |
| Text fields: label above, helper below, no floating label                  | C07/C08                             |
| Today done = checkbox on + dim + strikethrough                             | C23                                 |
| Sheets: one primary CTA; trash only in edit                                | C24/C28                             |
| Don’t invent new entry controls — extend Time / Count patterns             | C25–C27                             |
| Settings = inset grouped lists; no Upgrade/Rate/brand                      | C35 без C36/C37                     |


Disabled / error — не зафиксированы; при реализации: снизить opacity CTA, helper danger-text — **C**, согласовать при появлении нужды.

---

## 13. Naming conventions

### 13.1 Tokens

```text
color.{role}.{variant?}     color.text.secondary
space.{n}                   space.4
radius.{sm|md|lg|pill|full}
type.{role}                 type.display
elevation via color only    (no shadow.1 в dark)
motion.{name}               motion.sheet (позже)
```

### 13.2 Components (из 02)

`PascalCase` id уже в каталоге (`PrimaryButton`, `MonthGrid`).  
Файлы Vue позже: `PrimaryButton.vue` и т.д.

### 13.3 CSS variables (предложение)

```css
/* semantic — значения зависят от темы */
[data-theme="dark"] {
  --color-bg: #000000;
  --color-surface-2: #171717;
  --color-text-primary: #ffffff;
  --color-cta-bg: #fafafa;
  --color-cta-fg: #171717;
}
[data-theme="light"] {
  --color-bg: #f5f5f5;
  --color-surface-2: #e8e8e8;
  --color-text-primary: #000000;
  --color-cta-bg: #171717;
  --color-cta-fg: #ffffff;
}
:root {
  --color-accent: #fa373b; /* общий для тем */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, monospace; /* уточнить пакет при коде */
  --radius-md: 12px;
  --space-4: 16px;
}
```

### 13.4 Semantic vs raw

Предпочитать semantic (`--color-cta-bg`) над raw gray в компонентах.

---

## 14. Content & writing (визуальный слой)

Не полный tone of voice — только то, что влияет на UI:

- Кнопки действий — короткие глаголы UPPERCASE
- Пустые ячейки без copy («пропущено» и т.п.)
- Helper — одно предложение, про ограничение
- Язык UI LifeOS — **ещё не зафиксирован** (01 §15); токены не зависят от языка

---

## 15. Accessibility baseline (выводимое)


| Тема                | Правило                                                          | Док.                  |
| ------------------- | ---------------------------------------------------------------- | --------------------- |
| Contrast            | White on black CTA/text — высокий                                | A                     |
| Hit targets         | Dock icons / CTA крупные                                         | B                     |
| Accent-only meaning | День кодируется и позицией, и badge; не полагаться только на red | C — улучшить в LifeOS |
| Motion              | Не обязателен для понимания state                                | B                     |
| Dynamic Type        | Не видно в эталоне                                               | C                     |


---

## 16. Что сознательно не копируем в DS LifeOS

- Бренд, логотип, onboarding-цитаты эталона
- Upgrade / Rate / iCloud lock patterns
- Tilted preview cards как обязательный паттерн приложения
- Notes как тип (решение пользователя)
- Light *marketing* onboarding aesthetic как единственный язык app (light тема — полноценный app chrome, не «рекламная обложка»)

---

## 17. Решения пользователя (2026-07-19)

| # | Вопрос | Решение |
|---|--------|---------|
| 1 | Тема V1 | **Dark + light** — обе схемы обязательны |
| 2 | Шрифты | **`font.sans` (system)** = proportional grotesk без засечек, не mono; **`font.mono`** = явный monospace для сетки/данных. Конкретный mono-файл — на implementation |
| 3 | Accent | **Красный эталона**, якорь `#FA373B` (общий для dark и light) |

Отложено до implementation (без новых скринов): точная light surface-шкала, выбор mono webfont, spacing px, motion, dock-in-split.

---

## 18. Краткая шпаргалка

```text
themes: dark + light · accent #FA373B both
fonts: sans (system UI) + mono (grid/data)
dark: bg #000 · surfaces #121–262 · CTA light pill
light: bg #F5F5F5 · CTA dark pill · same accent
radius soft → pill · depth via fills · icons functional only
dense MonthGrid (mono) · airy forms (sans) · empty is ·
phone-first · extend before inventing
```

