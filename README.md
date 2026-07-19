# LifeOS

Персональное offline-first PWA (Vue) для одного пользователя: спокойное документирование жизни.

**V1:** Habits · Workouts · Checklist *(ex-Morning)*

## Start here

1. Прочитай `docs/ORCHESTRATOR.md` — порядок шагов, куда писать артефакты, правила стопа.
2. Затем: `docs/VISION.md` → `PRODUCT.md` → `ANTI_GOALS.md` → `TECH.md` → `DATA.md` → `DESIGN_PROCESS.md`.
3. Эталон: `analysis/screenshots/` + `INDEX.md`.
4. Запускай промпты по порядку из `prompts/`, начиная с `00_start.md`.

## Repo map

```text
README.md                 ← ты здесь
docs/                     ← продукт, техника, оркестратор
prompts/                  ← шаги вайбкодинга (00 → 09)
analysis/                 ← выходы шагов + скриншоты эталона
  screenshots/
  01_….md … 08_….md       ← появятся по мере работы
```

## Pipeline (short)

`00 start` → reverse → components → design system → IA → **data model** → habits → workout → checklist → consistency → **implementation**

Код только после шага 08. Offline и установка на iOS Home Screen — требования V1 (`docs/TECH.md`).

## Dev (после шага 08)

```bash
npm install
npm run dev
```

Лог реализации: `analysis/09_implementation_log.md`.

## Language

Документация и промпты — на русском (допустимы английские UI-термины из эталона). Язык интерфейса LifeOS уточняется на шагах IA / модулей, если ещё не зафиксирован.
