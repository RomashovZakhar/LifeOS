# 08 — Consistency check

Дизайн и данные для V1 собраны. Перед кодом — проверка согласованности.

## Вход

Все утверждённые файлы:

- `analysis/01_reverse_engineering.md`
- `analysis/02_component_catalog.md`
- `analysis/03_design_system.md`
- `analysis/04_information_architecture.md`
- `analysis/04b_data_model.md` (секция «Утверждено» должна быть заполнена)
- `analysis/05_habits_module.md`
- `analysis/06_workout_module.md`
- `analysis/07_morning_module.md`
- `docs/*`

## Проверить

1. Три модуля выглядят и ведут себя как одно приложение.
2. Нет лишних новых UI-паттернов без обоснования.
3. Нет противоречий между IA, модулями и data model.
4. Offline-сценарии покрыты (открытие, запись, просмотр без сети).
5. Нет утечек антицелей (геймификация, дашборд-шум, «как Strong» и т.д.).
6. Performance targets из `PRODUCT.md` реалистичны для описанных flows.
7. Список экранов V1 для реализации — полный и приоритезированный.

## Выход

`analysis/08_consistency.md`

Структура:

- Findings (проблемы / риски)
- Recommended fixes (до кода)
- Screen build order для шага 09
- Go / No-go

Если No-go — не переходить к реализации; предложи, какие analysis-файлы поправить.

Стоп. Жди одобрения.
