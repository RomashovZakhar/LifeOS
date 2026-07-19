# Tech Constraints

## Stack

- Vue 3
- Vite
- TypeScript предпочтителен
- Pinia — если нужен общий клиентский state
- Vue Router — если маршруты оправданы IA

Не добавлять UI-kit «из коробки» (Vuetify, Quasar и т.п.), если это ломает визуальный язык эталона. Стили — свои токены из design system.

## What “PWA” means here

1. Установка на iPhone через **Add to Home Screen** (standalone, без chrome Safari).
2. **Полноценный offline**: приложение открывается и работает без сети после первой загрузки; данные читаются и пишутся локально.

## Offline (required)

- Service Worker обязателен (Vite PWA / Workbox или эквивалент).
- App shell и статика кэшируются.
- Все данные V1 живут на устройстве. Без сети CRUD должен работать.
- Синхронизация с сервером в V1 не требуется.
- Выбор хранилища (localStorage vs IndexedDB) — на шаге data model; для объёма «годы записей» предпочтителен IndexedDB.

## iOS Home Screen

- Web App Manifest: `display: standalone` (или `fullscreen`, если обосновано).
- Apple meta: `apple-mobile-web-app-capable`, status bar style, icon 180×180.
- Safe areas: `env(safe-area-inset-*)`.
- Theme / background color согласованы с UI (в т.ч. OLED black, если dark).
- Проверка: установить на iPhone, открыть offline (Airplane Mode), пройти основные сценарии.

## Product performance targets

См. `PRODUCT.md`: cold start ощущается < 1s; типичные действия быстрые; большинство путей ≤ 3 тапа.

## Out of scope for V1 engineering

- Backend / auth / multi-user
- Push notifications
- iCloud / cloud backup
- App Store native wrapper (если не запрошено отдельно)
