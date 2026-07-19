# Screenshot Index — Reference App (Things take time)

Эталон для reverse engineering. Не копировать бренд, подписку и маркетинговые экраны в LifeOS — только язык дизайна и паттерны взаимодействия.

Тема: в основном dark mode. Onboarding (01–03) — light.

| # | File | Screen | Notes |
|---|------|--------|-------|
| 01 | `photo_1_2026-07-19_18-50-14.jpg` | Onboarding — quote + brand | Light. Цитата, логотип `///.`, CTA Continue |
| 02 | `photo_2_2026-07-19_18-50-14.jpg` | Onboarding — Today preview | Light. Карточка Today с разными типами трекеров |
| 03 | `photo_3_2026-07-19_18-50-14.jpg` | Onboarding — grid preview | Light. Наклонённая сетка «See how they add up» |
| 04 | `photo_4_2026-07-19_18-50-14.jpg` | Main — empty month grid | Dark. Список дней, dock: ↑ ↓ TODAY + … |
| 05 | `photo_5_2026-07-19_18-50-14.jpg` | Main — day selected, Today empty | Dark. Выделение дня, пустая панель Today |
| 06 | `photo_6_2026-07-19_18-50-14.jpg` | Settings | Dark. **Эталон только.** Upgrade / iCloud / Rate — не для LifeOS |
| 07 | `photo_7_2026-07-19_18-50-14.jpg` | New tracker — Completion | Dark. Name, Symbol, Type chips |
| 08 | `photo_8_2026-07-19_18-50-14.jpg` | New tracker — typing (RU) | Dark. Клавиатура, Name «Тренировка» |
| 09 | `photo_9_2026-07-19_18-50-14.jpg` | Main — single column ТРЕНИ | Dark. Одна колонка трекера |
| 10 | `photo_10_2026-07-19_18-50-14.jpg` | Main + Today — unchecked | Dark. Тренировка не отмечена |
| 11 | `photo_11_2026-07-19_18-50-14.jpg` | Main + Today — checked | Dark. Completion → `x` в сетке |
| 12 | `photo_12_2026-07-19_18-50-14.jpg` | New tracker — Time | Dark. Time format: AM/PM / 24-hour |
| 13 | `photo_13_2026-07-19_18-50-14.jpg` | Main — two columns + Today | Dark. ТРЕНИ + WAKE |
| 14 | `photo_14_2026-07-19_18-50-14.jpg` | Sheet — track Wake (time) | Dark. Wheel picker, Next day, TRACK |
| 15 | `photo_15_2026-07-19_18-50-14.jpg` | Main — logged values | Dark. `x` + время `07:40` в сетке |
| 16 | `photo_16_2026-07-19_18-50-14.jpg` | New tracker — Distance | Dark. Unit: Kilometers |
| 17 | `photo_17_2026-07-19_18-50-14.jpg` | New tracker — Weight | Dark. Unit: Kilograms |
| 18 | `photo_18_2026-07-19_18-50-14.jpg` | New tracker — Count | Dark. Unit placeholder |
| 19 | `photo_19_2026-07-19_18-50-14.jpg` | New tracker — Count filled | Dark. «Кофе» / «чашек» |
| 20 | `photo_20_2026-07-19_18-50-14.jpg` | Main — three columns + Today | Dark. ТРЕНИ, WAKE, КОФЕ |
| 21 | `photo_21_2026-07-19_18-50-14.jpg` | Sheet — track Count | Dark. Stepper + keypad, UPDATE |
| 22 | `photo_22_2026-07-19_18-50-14.jpg` | Sheet — edit Wake | Dark. Wheel + delete icon + UPDATE |
| 23 | `photo_23_2026-07-19_18-50-14.jpg` | Sheet — delete Wake entry | Dark. DELETE ENTRY |
| 24 | `photo_24_2026-07-19_18-50-14.jpg` | Tracker detail | Dark. Meta, Week/Month/Year, heatmap, EDIT/DELETE |
| 25 | `photo_25_2026-07-19_18-50-14.jpg` | Tracker detail — history list | Dark. ENTRIES + History list |

## Coverage gaps (ask if needed)

- Light mode основного приложения (не onboarding)
- Appearance / Trackers settings internals
- Notes-type entry UI
- Empty states beyond photo 04–05
- Error / offline indicators (эталон может не показывать)

## How to use

На шаге `01` анализировать все файлы из этой папки. Опираться на INDEX, а не на порядок имён в Finder.
