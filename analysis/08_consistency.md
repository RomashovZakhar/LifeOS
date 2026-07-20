# 08 — Consistency check (LifeOS)

**Входы:** analysis 01–07, 04b; docs/*  
**Дата:** 2026-07-19  
**Статус:** ✅ утверждён (2026-07-19; R1–R3 применены; Go)  

Проверка перед кодом. Код не писать, пока этот документ не утверждён.

---

## 1. Вердикт

| Вопрос | Ответ |
|--------|--------|
| Три модуля — одно приложение? | **Да** — один Habits-дом, порталы, общий язык sheets/detail/dock |
| IA ↔ 04b ↔ 05/06/07 согласованы? | **Да** по ядру; мелкие doc-расхождения ниже |
| Offline покрыт? | **Да** — полный локальный CRUD; нет sync/conflict UI |
| Антицели? | **Чисты** — нет streaks / Upgrade / Strong-bloat / Notes |
| Performance PRODUCT реалистичен? | **Да** для типичных путей; тренировка длиннее ≤3 тапов — осознанное исключение |
| **Go / No-go** | **Go** после правок §3 (минорные, до старта 09) |

---

## 2. Findings

### 2.1 Согласовано (ок, не трогать)

| Тема | Где сходится |
|------|----------------|
| Hub + portals, 1× WorkoutPortal, N× Checklist | IA, 05, 06, 07 |
| Ячейка workout = `…` in_progress / `x` completed; нет Entry | IA, 04b, 05, 06 |
| Checklist % = снимок `checklist_days`; `done===0` → `·` | IA, 04b, 07 |
| Hard delete checklist item; дни не каскадятся | 04b (working tree), 07 |
| Cascade portal → sessions only; exercises/templates живут | IA, 04b, 05, 06 |
| Future lock на лог/старт | IA, 05, 06, 07 |
| Type / trackingMode immutable | 04b, 05, 06 |
| Одна сессия / день; finish ≥1 exercise с ≥1 valid set | 04b, 06 |
| Пауза таймера: `pausedAt` + `pauseAccumulatedSeconds` | 04b, 06 |
| Portal rename/delete — в Workouts ⋯, не H7 | 05, 06 |
| C2 = bottom sheet; C1 = device/detail-каркас | 07 ≈ IA/05 паттерны |
| W1–W5 = tall/nested sheets поверх home (`/?workout=`) | 06 (sheet shell 2026-07-20) |
| Settings: theme + Export JSON; без marketing эталона | IA, 05, ANTI_GOALS |
| UI язык RU | IA, 05–07, settings.locale |
| Notes type отсутствует | везде |

### 2.2 Проблемы / риски

| ID | Severity | Finding |
|----|----------|---------|
| F1 | **Fix** | В `05` wireframe H7: «РЕДАКТИРОВАТЬ», в таблице копирайта и в `07`: **«ИЗМЕНИТЬ»**. Нужен один термин. |
| F2 | **Fix** | В `06` W4: «Карточки/rows» — слово «карточки» конфликтует с ANTI_GOALS / правилом «default: no cards». Имеются в виду **rows** (Settings/list эталона). |
| F3 | **Fix** | IA §4.3 всё ещё перечисляет **W6** как опциональный экран; `06` зафиксировал: отдельный progress-экран **не делаем**. Список экранов V1 должен это отражать. |
| F4 | **Process** | В git working tree: правки `04b` (hard delete items), статус `06` → утверждён, новый `07` — **не закоммичены**. Для 09 источником правды считать текущие файлы; перед реализацией лучше зафиксировать коммитом. |
| F5 | **Watch** | Light-тема в `03` — уровень C (зеркальная реконструкция). Риск визуального дрейфа на 09; не блочит Go. |
| F6 | **Watch** | Mono + кириллица в сетке — выбор webfont на 09 (отложено в IA §13). |
| F7 | **Watch** | PRODUCT «большинство ≤ 3 тапа»: Completion/checklist toggle/open sheet — ок; полный workout Start→sets→Finish длиннее — **норма для модуля**, не раздувать UI ради «уложиться в 3». |
| F8 | **Watch** | Сессия `in_progress` → ячейка Habits `…`; `completed` → `x` (04b). |
| F9 | **Info** | Два входа edit duration: Habits **H6b** и Workouts **W1-C**. Не противоречие — один компонент/одна запись в IDB на 09. |
| F10 | **Info** | Новые поверхности Workouts (W1–W5) и Checklist day — обоснованы в IA §7; визуально остаются токены/sheets/lists эталона. Лишних «дашбордов» нет. |

### 2.3 Антицели — контроль

| Риск | Статус |
|------|--------|
| Streaks / shame / «не пропусти» | Нет в 05–07 |
| Upgrade / iCloud / Rate / brand footer | Явно исключены в 05 H8 |
| Strong-like (программы, суперсеты, Health, plate calc) | Вне scope 06 |
| Notion/Todoist-шум, градиенты, glass | Design system + модули не вводят |
| Геймификация / badges достижений | Нет (day badge = только календарное сегодня; selected в grid без красной строки) |
| 0% как стыд в сетке | Запрещён; `·` |

### 2.4 Offline

| Сценарий | Покрытие |
|----------|----------|
| Открыть app без сети (после cache) | TECH + IA §9; shell SW |
| CRUD привычек / чеклиста / сессий | 05–07 + IDB 04b |
| Секундомер / пауза / kill | 06 + поля 04b |
| Export без сети | Локальный JSON dump (05 H8) |
| Первый визит без сети | Hard fail shell — единственный; не product-bug |

---

## 3. Recommended fixes (до кода)

Сделано 2026-07-19:

| # | Файл | Правка | Статус |
|---|------|--------|--------|
| R1 | `05_habits_module.md` | H7: **ИЗМЕНИТЬ** | ✅ |
| R2 | `06_workout_module.md` | W4: список rows, не карточки | ✅ |
| R3 | `04_information_architecture.md` | W6 out of V1 | ✅ |
| R4 | git | Коммит analysis 04b/06/07/08 + правки | ✅ с этим коммитом |

**Не требуется до кода:** менять схему 04b, перепроектировать модули, добавлять sync/import.

---

## 4. Screen build order (для шага 09)

Один экран (или вертикальный срез) → self-review → апрув.  
Приоритет: **offline shell + данные + корень Habits**, затем Checklist, затем Workouts.

### Phase 0 — Foundation

| Order | ID | Что | Зачем первым |
|------|-----|-----|----------------|
| 0.1 | — | Vite/Vue/TS, tokens 03, themes dark/light, safe areas | Визуальный каркас |
| 0.2 | — | PWA manifest + SW; app shell offline | TECH с первой сборки |
| 0.3 | — | Dexie/IDB stores по 04b; settings singleton; Export helper | Persistence |
| 0.4 | — | Router дух IA (`/`, `/t/:id`, `/workout`, `/settings`, `/habits/new`) | Навигация |

### Phase 1 — Habits home (ordinary)

| Order | ID | Экран |
|------|-----|--------|
| 1 | H0 / H1 | MonthGrid empty + с колонками; dock; месяц; selected day; weekend bands |
| 2 | H3 | New tracker (все types; workout chip once; Symbol unique) |
| 3 | H2 | Today panel; day label / СЕГОДНЯ; swipe dismiss + slide |
| 4 | — | Completion toggle **только в Today** |
| 5 | H4a / H4 | Cell → Completion confirm + Time sheet (`photo_14`) |
| 6 | H5 / H6 | Count + Distance/Weight sheets (`photo_21`) |
| 7 | H7 | Ordinary tracker detail (range, heatmap, edit/delete) |
| 8 | H8 / H9 | Settings + Appearance + Export |

*После Phase 1 приложение уже полезно как трекер привычек offline.*

### Phase 2 — Checklist

| Order | ID | Экран |
|------|-----|--------|
| 9 | — | Home: checklist cell `%` / Today row (без Completion) |
| 10 | C1 | Device: items drag, history, edit/delete column |
| 11 | C2 | Day bottom sheet: ensureDay, toggle autosave, merge today |

### Phase 3 — Workouts

| Order | ID | Экран |
|------|-----|--------|
| 12 | — | Home: workout cell `x`; жесты входа |
| 13 | W1 | Session A0/A1/B/C; Start/Finish; timer+pause; drag exercises; ⋯ portal |
| 14 | W2 | Sets by mode; last time; autosave |
| 15 | W3 | Add exercise + create catalog item |
| 16 | W4 / W5 | Templates list + editor; start from template; update-on-finish |
| 17 | H6b | Edit duration с Habits (shared с W1-C) |

### Phase 4 — Hardening

| Order | Что |
|------|-----|
| 18 | Restore `lastViewedMonth` / `lastSelectedDate`; kill/resume timer |
| 19 | Cascade deletes end-to-end; Symbol collision; second portal disabled |
| 20 | iOS Home Screen + Airplane Mode smoke (PRODUCT/TECH) |
| — | **W6** — не делать в V1 |

### Вне V1 (не ставить в очередь)

Import, sync, push, Notes, column reorder UI, exercise progress screen, system theme follow, второй WorkoutPortal, multi-session/day.

---

## 5. Go / No-go

### **Go**

Блокеров архитектуры/данных нет. Модули читаются как одно приложение на языке эталона. Offline и антицели выдержаны.

**Условие старта 09:** применить R1–R3 (или явно принять отклонения в апруве этого файла). R4 желателен.

### No-go если…

- откатить hard delete checklist items без обновления 07/04b;  
- вернуть отдельный Habit Entry для длительности портала;  
- начать код до апрува этого 08.

---

## 6. Шпаргалка для 09

```text
One home · three capabilities · portals optional
IDB truth · Export JSON · no sync
· then value · no shame · no streaks
Checklist snapshots · Workout `…`/`x`
Build: foundation → Habits ordinary → Checklist → Workouts → harden
W6 out · fix ИЗМЕНИТЬ · rows not cards · commit analysis first
```

