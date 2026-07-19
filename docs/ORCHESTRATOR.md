# Orchestrator

Правила работы агента над LifeOS. Читать в начале каждой сессии вместе с `README.md`.

## Read order (every session)

1. `README.md`
2. `docs/VISION.md`
3. `docs/PRODUCT.md`
4. `docs/ANTI_GOALS.md`
5. `docs/TECH.md`
6. `docs/DATA.md`
7. `docs/DESIGN_PROCESS.md`
8. Этот файл
9. Актуальный `prompts/NN_*.md`
10. Уже утверждённые артефакты в `analysis/` (не переизобретать)

Скриншоты эталона: `analysis/screenshots/` + `analysis/screenshots/INDEX.md`.

## Pipeline

| Step | Prompt | Artifact (write here) | Gate |
|------|--------|------------------------|------|
| 00 | `prompts/00_start.md` | — (проверка готовности) | Ready to run 01 |
| 01 | `prompts/01_reverse_engineering.md` | `analysis/01_reverse_engineering.md` | User OK |
| 02 | `prompts/02_component_catalog.md` | `analysis/02_component_catalog.md` | User OK |
| 03 | `prompts/03_design_system.md` | `analysis/03_design_system.md` | User OK |
| 04 | `prompts/04_information_architecture.md` | `analysis/04_information_architecture.md` | User OK |
| 04b | `prompts/04b_data_model.md` | `analysis/04b_data_model.md` | User picks variant |
| 05 | `prompts/05_habits_module.md` | `analysis/05_habits_module.md` | User OK |
| 06 | `prompts/06_workout_module.md` | `analysis/06_workout_module.md` | User OK |
| 07 | `prompts/07_morning_module.md` | `analysis/07_morning_module.md` *(Checklist)* | User OK |
| 08 | `prompts/08_consistency.md` | `analysis/08_consistency.md` | User OK |
| 09 | `prompts/09_implementation.md` | код в репо + короткие заметки по экрану в `analysis/09_implementation_log.md` | User OK per screen |

Не перескакивать шаги. Не писать код до закрытия шага 08.

## V1 modules (all required)

- **Habits** — обязательный полноценный модуль
- **Workouts** — обязательный полноценный модуль
- **Checklist** *(ex-Morning)* — обязательный полноценный модуль

Все три входят в первую версию. Язык один; корень — Habits-сетка, Workouts/Checklist через порталы (`04`). Промпт 07 может ещё называться morning — продуктово Checklist.

Habits — не «просто эталон без проектирования». Эталон даёт язык; модуль Habits для LifeOS всё равно проектируется и описывается в `analysis/05_habits_module.md`.

## Hard rules

1. Один шаг = один промпт = один артефакт (кроме 09).
2. После каждого шага — стоп и ожидание одобрения пользователя.
3. Не уверен в продукте, UX или данных — спроси. Не додумывай молча.
4. Не тащить из эталона: подписку, Upgrade, iCloud, Rate, Support, маркетинг, чужой бренд.
5. Не нарушать `ANTI_GOALS.md`.
6. Offline обязателен с первой рабочей сборки (см. `TECH.md`).
7. Артефакты пишутся в `analysis/`, не только в чат. Чат — для вопросов и апрува.

## When stuck

Остановиться. Сформулировать вопрос. Дождаться ответа. Затем продолжить тот же шаг.
