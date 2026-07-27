# 10 — H7 Detail: stats grid + trend chart

**Статус:** спека принята (2026-07-27)  
**Эталон UI:** `analysis/screenshots/photo_26.png` (вес: meta + range + 2×2 cards; **без** графика в эталоне — график = расширение LifeOS)  
**Код:** `TrackerDetailSheet`, `DetailStatGrid`, `DetailTrendChart`, `lib/detailStats.ts`  
**Связь:** H7 в `05_habits_module.md`; C31 / C41 в `02_component_catalog.md`

---

## 1. Цель

Для ordinary-трекеров с **числовым смыслом** (не completion) показать за выбранный range:

1. **2×2 StatCards** (среднее / записи / мин|раньше / макс|позже);
2. спокойный **линейный тренд** (линия + точки);
3. сохранить существующие **heatmap + список + EDIT/DELETE**.

Completion остаётся как Phase 1.4: одна карточка ЗАПИСИ + heatmap + list — **без** графика и **без** 2×2.

---

## 2. Когда что показывать

| `tracker.type` | Meta Unit | Chart | 2×2 grid | Single ENTRIES | Heatmap | List |
| -------------- | --------- | ----- | -------- | -------------- | ------- | ---- |
| `completion`   | нет       | нет   | нет      | да             | да      | да   |
| `time`         | нет       | да    | да       | нет (в grid)   | да      | да   |
| `count`        | если `config.unit` непустой | да | да | нет | да | да |
| `distance`     | да        | да    | да       | нет            | да      | да   |
| `weight`       | да        | да    | да       | нет            | да      | да   |

**Range chips** общие для всех типов (как сейчас).  
**Агрегаты и точки графика** считаются только по `entries` внутри `boundsForRange` (включительно), `date ≤ today`.  
Пустые дни **не** входят в среднее / min / max / точки.

---

## 3. Компоновка H7

### 3.1 Completion (без изменений смысла)

```text
Name                                          ✕
Symbol / Тип / Создано
[ Неделя | Месяц | Год | Всё время ]
ЗАПИСИ  {count}          ← одна StatCard на всю ширину
История
  Heatmap
  Список по периоду
ИЗМЕНИТЬ | УДАЛИТЬ
```

### 3.2 time / count / distance / weight

```text
Name                                          ✕
Symbol / Тип / [Unit] / Создано
[ Неделя | Месяц | Год | Всё время ]
2×2 StatCards
Trend chart (line + points)
История
  Heatmap
  Список по периоду
ИЗМЕНИТЬ | УДАЛИТЬ
```

Порядок сверху вниз **фиксирован**: chips → grid → chart → History.  
Не прятать heatmap «потому что есть график»: heatmap = ритм дней, chart = величина, list = edit.

---

## 4. Meta: Unit row

Показывать строку **Unit** (label слева, badge справа), если есть отображаемая единица:

| Тип      | Условие                         | Badge text (RU, caps)                          |
| -------- | ------------------------------- | ---------------------------------------------- |
| weight   | всегда                          | `kg` → `КИЛОГРАММЫ`; `lb` → `ФУНТЫ`            |
| distance | всегда                          | `km` → `КИЛОМЕТРЫ`; `mi` → `МИЛИ`              |
| count    | `config.unit` trim непустой     | unit as-is, uppercase (`ЧАШЕК`)                |
| time / completion | —                        | строки нет                                     |

Default storage units как в create: weight `kg`, distance `km`.  
В значениях карточек/списка unit остаётся **lowercase** (`kg`, `km`) — как §8 в `05`.

---

## 5. Диапазон (без изменений API)

Использовать существующий `boundsForRange` / `DetailRange` (`lib/detailRange.ts`):

| Chip       | `from` … `to`                                      |
| ---------- | -------------------------------------------------- |
| Неделя     | today−6 … today                                    |
| Месяц      | 1-е число текущего месяца … today                  |
| Год        | today−364 … today                                  |
| Всё время  | `0001-01-01` … today (не резать по `createdAt`)    |

Смена chip → пересчёт chart + grid + list. Heatmap по-прежнему показывает ~17 недель до today (не клипается range chips) — **как сейчас**; не менять в этой задаче.

---

## 6. Извлечение числового ряда

Одна запись на день (`trackerId+date` unique). Для stats/chart строится массив точек `{ date, y }` только из ranged entries нужного `kind`.

### 6.1 Numeric kinds

| type     | entry `kind` | `y`                                      |
| -------- | ------------ | ---------------------------------------- |
| count    | `count`      | `value` (number)                         |
| distance | `distance`   | `value`                                  |
| weight   | `weight`     | `value`                                  |
| time     | `time`       | **effective minutes** = `minutesOfDay + (nextDay ? 1440 : 0)` |

Сортировка точек: по `date` ascending.

### 6.2 Игнор

- completion entries → не участвуют в chart/grid (UI другой).  
- entry другого `kind` (corrupt) → skip.  
- `date > today` → не должно попадать в bounds; если попало — skip.

---

## 7. 2×2 StatCards

### 7.1 Общий вид (C31)

Карточка: `surface-3`, `radius.lg` (~16), padding ~18×16.  
Label: small caps, secondary, letter-spacing.  
Value: large mono/primary (`type.stat` или чуть меньше в grid, ~1.75–2.25rem чтобы 2×2 влезал).  
Optional subline: дата у min/max — caption secondary (`ВС 19 ИЮЛ` = `formatHistoryDayRu`).  
Optional unit suffix на value: secondary, меньше основного числа.

Сетка: 2 колонки, gap ~10px; margin-top после chart ~16px.

### 7.2 Раскладка ячеек

```text
[ TL ] [ TR ]
[ BL ] [ BR ]
```

| type               | TL                         | TR        | BL                                      | BR                                      |
| ------------------ | -------------------------- | --------- | --------------------------------------- | --------------------------------------- |
| weight / distance  | СРЕДНЕЕ · `{n.1}` + unit   | ЗАПИСИ · N | МИН · `{n.1}` + unit + дата            | МАКС · `{n.1}` + unit + дата            |
| count              | СРЕДНЕЕ · integer (+ unit) | ЗАПИСИ · N | МИН · integer (+ unit) + дата          | МАКС · integer (+ unit) + дата          |
| time               | СРЕДНЕЕ · clock            | ЗАПИСИ · N | РАНЬШЕ · clock + дата                  | ПОЗЖЕ · clock + дата                    |

**Нет суммы** в grid (в т.ч. для count) — единый паттерн среднее/записи/крайности.

### 7.3 Формулы

Пусть `ys` = массив `y` точек, `N = ys.length`.

- **ЗАПИСИ** = `N`.  
- **СРЕДНЕЕ (numeric)** = `sum(ys) / N`; weight/distance → `toFixed(1)`; count → `Math.round`.  
- **МИН / МАКС** = argmin / argmax по `y`; при равенстве — **более ранняя** `date` (стабильность).  
- **СРЕДНЕЕ (time)** = `round(sum(effective) / N)`; display clock = `formatClockTime(mean % 1440, timeFormat)` (без отдельного «next day» бейджа на карточке).  
- **РАНЬШЕ / ПОЗЖЕ** = min / max по **effective** minutes; display = `formatClockTime(minutesOfDay, timeFormat)` из исходной entry (не effective).

### 7.4 Empty / мало данных

| N | Grid |
| - | ---- |
| 0 | Показать 4 карточки с value `—` (em dash), без subline даты; ЗАПИСИ = `0` |
| 1 | Среднее = это значение; мин = макс = эта же точка (одна дата на BL и BR) |
| ≥2 | полный расчёт |

Не прятать весь grid при N=0 — сохраняем layout эталона.

### 7.5 Labels (RU caps)

`СРЕДНЕЕ` · `ЗАПИСИ` · `МИН` · `МАКС` · `РАНЬШЕ` · `ПОЗЖЕ`

---

## 8. Trend chart (C41)

### 8.1 Библиотека

**uPlot** (dependency). Причины: маленький бандл, canvas, легко выключить chrome, кастом цвета из CSS tokens.

Не использовать Chart.js / ECharts в V1 этой фичи.

### 8.2 Вид

- Линия 1–1.5px, цвет `var(--color-text-primary)`.  
- Точки: заполненные круги ~3–4px (viz size ~6), тот же цвет.  
- Фон прозрачный / sheet surface.  
- Сетка: тонкие горизонтальные линии secondary @ low opacity; без вертикальной.  
- **Без** легенды, title, toolbar, zoom UI.  
- Высота ~160–180px; width = container (ResizeObserver).  
- Тема dark/light: читать computed styles tokens при mount/update.  
- **Подписи осей:** `var(--font-mono)` (IBM Plex Mono), ~11px, secondary.  
- **X ticks:** день месяца; **без дублей** одного календарного дня (пустая строка, если день = предыдущему tick).  
- **Gutters:** компактные — Y `size` ~36, padding без лишнего слева; plot ближе к краю sheet.

### 8.3 Данные

- X = timestamp noon local для `date` (как в `detailRange` parse) **или** ordinal index — предпочтение **time scale** по date, чтобы Week/Month читались.  
- Y = `y` из §6.  
- Соединять точки **по порядку дат** без вставки `null` за пропуски дней (редкие логи веса = непрерывная ломаная по фактам).  
- N = 0: блок chart с коротким secondary text «Недостаточно данных» (без осей).  
- N = 1: одна точка, без линии (uPlot ок).  
- N ≥ 2: line + points.

### 8.4 Оси / формат

- **X:** редкие ticks (auto uPlot); формат короткой даты допустим (`D MMM` / день). Не обязательно идеально — главное не шуметь.  
- **Y numeric:** weight/distance — 1 decimal; count — integer.  
- **Y time:** ticks как clock (`HH:MM` / ampm по tracker); domain = min(y)…max(y) с небольшим pad. Effective minutes могут быть >1439 — форматтер: если `y ≥ 1440`, показывать clock от `y % 1440` (опционально без «+1d» на оси в V1).

### 8.5 Interaction

- Tap/click ближайшей точки → `emit('select-date', date)` → тот же `openEntry(date)`, что heatmap/list.  
- Hover/tooltip на desktop: опционально тонкий; на touch достаточно tap.  
- Не открывать future dates.

### 8.6 Accessibility

Chart декоративен относительно цифр в grid + list. `aria-hidden` на canvas ok; рядом sr-only краткое «График за период» допустимо. Не дублировать все точки в a11y tree.

---

## 9. History block (без регрессий)

- Заголовок **История**.  
- `HistoryHeatmap`: filled = любой entry за день (все ordinary types); tap → entry sheet.  
- List: группировка по месяцу; для non-completion trailing value через `cellTextForTracker`.  
- List фильтруется **range**; heatmap — как сейчас (fixed window).

---

## 10. Файлы / границы

| Путь | Роль |
| ---- | ---- |
| `analysis/10_detail_stats.md` | эта спека |
| `src/lib/detailStats.ts` | points + aggregates pure functions |
| `src/components/habits/DetailStatGrid.vue` | 2×2 UI |
| `src/components/habits/DetailTrendChart.vue` | uPlot wrapper |
| `src/components/habits/TrackerDetailSheet.vue` | compose by type |
| `src/lib/trackerLabels.ts` (или cellDisplay) | unit badge label |
| `package.json` | `uplot` dependency |

Тесты: не обязательны в V1; функции в `detailStats` должны быть чистыми и проверяемыми вручную.

---

## 11. Вне scope

- Stats/chart для workout portal / checklist device (свои экраны).  
- Сумма / streak / покрытие % для completion.  
- Интенсивность heatmap по величине.  
- Сглаживание / moving average / цель веса.  
- Экспорт графика.  
- Смена heatmap window по range chips.

---

## 12. Acceptance checklist

- [x] Weight/distance/count/time: meta Unit (где применимо), chart, 2×2, heatmap, list.
- [x] Completion: только ЗАПИСИ + heatmap + list (нет chart/2×2).
- [x] Range chips пересчитывают chart + grid + list.
- [x] Min/max показывают дату (`formatHistoryDayRu`).
- [x] Форматы чисел/времени совпадают с сеткой/Today (§8 в 05).
- [x] Tap точки графика открывает entry sheet.
- [x] N=0: `—` в карточках, placeholder у chart.
- [ ] Dark и light читаемы (токены) — проверить вручную в UI.
- [ ] Нет регрессии EDIT/DELETE / edit sheets — проверить вручную.
