# AI-DND Project Status

Дата обновления: 2026-07-03

## 1. Текущая структура проекта

Фактически в рабочей папке сейчас есть:

```text
AI-DND/
├── docs/
│   ├── AI/
│   ├── GameDesign/
│   ├── Systems/
│   ├── Technical/
│   └── PDF_CONVERSION_REPORT.md
└── tools/
    └── convert-docs-pdf-to-md/
        └── convert_docs_pdf_to_md.py
```

На текущий момент в корне все базовые папки подготовлены. Не найдены:

- `README.md`
- корневой `package.json`
- `.git`

То есть проект сейчас находится на стадии подготовленной документационной базы и минимального frontend skeleton. Backend, production database, AI integration, полноценные игровые системы, общие типы, игровые данные и тестовая инфраструктура еще не созданы.

## 2. Найденные документы

Всего найдено 32 Markdown-файла в `docs`, включая отчет о конвертации PDF и статусные документы проекта.

### Technical

- `docs/Technical/AI-DND Codex Rules.md`
- `docs/Technical/AI-DND Technical Architecture.md`

### GameDesign

- `docs/GameDesign/AI-DND Project Vision.md`
- `docs/GameDesign/AI-DND World Bible.md`
- `docs/GameDesign/AI-DND Gameplay Design Document.md`
- `docs/GameDesign/AI-DND Combat System Design.md`
- `docs/GameDesign/AI-DND Character System Design.md`

### Systems

- `docs/Systems/AI-DND Crafting System.md`
- `docs/Systems/AI-DND Economy System.md`
- `docs/Systems/AI-DND Faction System.md`
- `docs/Systems/AI-DND Injury, Poison and Disease System.md`
- `docs/Systems/AI-DND Inventory System.md`
- `docs/Systems/AI-DND Living World Health System.md`
- `docs/Systems/AI-DND Magic System Design Document.md`
- `docs/Systems/AI-DND Medicine and Healing System.md`
- `docs/Systems/AI-DND QUEST SYSTEM.md`
- `docs/Systems/AI-DND Rumor and Legend System.md`
- `docs/Systems/AI-DND Save and World State System.md`
- `docs/Systems/AI-DND Stone Sleep System.md`
- `docs/Systems/AI-DND UI-UX System.md`
- `docs/Systems/AI-DND World Map System.md`
- `docs/Systems/AI-DND World Simulation System.md`
- `docs/Systems/Hybrid Time System.md`

### AI

- `docs/AI/AI Dungeon Master System.md`
- `docs/AI/AI NPC System.md`
- `docs/AI/AI-DND Character Thought System Design.md`
- `docs/AI/AI-DND Knowledge System.md`
- `docs/AI/AI-DND NPC Memory System.md`
- `docs/AI/AI-DND Player Intent System.md`

### Conversion

- `docs/PDF_CONVERSION_REPORT.md`
- `docs/PROJECT_STATUS.md`
- `docs/PROJECT_BIBLE.md`

Примечание: в документах внутри PDF упоминаются имена вроде `CODEX_RULES.md`, `TECHNICAL_ARCHITECTURE.md`, `00_ProjectVision.md`, `02_Gameplay.md`, `UI_UX_SYSTEM.md`, `Thought_System.md`. Фактически после конвертации эти документы существуют под PDF-именами, перечисленными выше.

## 3. Уже описанные системы

Документация уже описывает:

- базовую философию проекта: single-player dark fantasy RPG, свободный текстовый ввод, D20, живой мир, игрок не является избранным;
- правило результата: игрок описывает намерение, движок считает результат, AI только описывает последствия;
- техническую архитектуру: сначала React + Vite frontend, затем локальные игровые системы, потом data-driven world, backend и только после этого AI;
- правила Codex: не менять дизайн, lore и игровые правила без разрешения, не добавлять backend или AI раньше времени;
- основной gameplay loop: travel -> encounter -> dialogue/combat/exploration -> consequence -> reward/loss -> growth -> travel;
- карту мира и travel system: маршруты, опасность, погода, случайные события, открытия, переходы в event scenes;
- UI/UX: dark fantasy, parchment/wood/iron/candlelight, no quest markers, no dialogue buttons, no health bars, мысли персонажа вместо UI-подсказок;
- Character Thought System: мысли как immersive hints, зависящие от знаний, страха, травм, навыков, ситуации и настроек;
- Player Intent System: свободный ввод, распознавание намерений, разбор сложных действий, validation через правила, естественный провал невозможных действий;
- RuleValidator/DiceSystem как обязательные будущие core systems, хотя отдельного реализованного кода пока нет;
- character system: происхождение, атрибуты, skills, LP, учителя, репутация, страхи, травмы, здоровье, знания;
- combat system: D20, инициатива, body targeting, damage types, injuries, bleeding, fractures, morale, surrender, escape;
- injury/poison/disease и medicine/healing: последствия ранений, лечение по уровням, болезни, инфекции, scars, permanent injuries;
- inventory/equipment: physical inventory, вес, объем, slots, ownership, stolen property, quality, durability, item history;
- magic: опасная магия, школы, mana, corruption, rituals, components, forbidden magic;
- quests: quests as world problems, not checklists; journal as clues/memories, not objective list;
- world bible/lore: Elyrion, Valgar, Ashen Valley, Fracture, Black Crystal, factions, races, religions, monsters;
- economy: supply/demand, production, caravans, shortages, famine, dynamic prices, property, black market;
- factions: living organizations, leadership, territory, wars, succession, alliances, membership, betrayal;
- crafting: professions, teachers, tools, recipes, experimentation, workshops, item signatures, legendary crafting;
- rumor/reputation/legend: witnesses, distorted stories, personal/local/faction reputation, myths, titles;
- save/world state: save as memory of the world, not only player state; future storage for NPCs, rumors, history, factions, economy, Stone Sleep;
- Stone Sleep and Hybrid Time: offline progression, time compression, awakening summary, player absence consequences;
- world simulation and living world health: NPC schedules, weather, seasons, economy, war, disease, migration, death, history;
- AI-DM, AI NPC, knowledge and memory systems: future AI behavior boundaries, NPC knowledge limits, memory, relationships, dialogue and consequence context.

## 4. Чего не хватает для первого playable prototype

Первый playable prototype по документации должен быть frontend-only, без backend и без AI.

Сейчас не хватает:

- развития текущего React + Vite + TypeScript skeleton в полноценный playable prototype;
- полноценного игрового flow поверх созданных placeholder-экранов;
- завершенного экрана создания персонажа;
- рабочей глобальной карты;
- простого travel prototype на mock data;
- event scene screen;
- свободного dialogue/input panel;
- thought panel;
- базовых status/inventory/journal mockups;
- локальных mock data для locations, events, NPC, items, player;
- localStorage save/load;
- расширенной навигации между сценами;
- полировки базового визуального стиля UI согласно `AI-DND UI-UX System.md`;
- начальных pure systems для следующего этапа: `DiceSystem`, mock `IntentSystem`, `RuleValidator`, `TravelSystem`;
- тестовой инфраструктуры для pure systems.

Не нужно для первого playable prototype:

- backend;
- database;
- AI server;
- AI NPC dialogue;
- AI Dungeon Master;
- полноценная world simulation;
- production persistence;
- локальная LLM-интеграция.

## 5. Следующий безопасный шаг

Следующий безопасный шаг: создать только Phase 1 frontend scaffold по документации.

Рекомендуемый минимальный scope следующей задачи:

- создать `client/` с React + Vite + TypeScript;
- добавить базовую структуру `client/src/` по `AI-DND Technical Architecture.md`;
- сделать первый экран `MainMenuScene`;
- подготовить пустые/минимальные сцены для `CharacterCreationScene`, `WorldMapScene`, `EventScene`;
- использовать только local mock data;
- не добавлять backend;
- не добавлять AI;
- не менять игровые правила;
- не реализовывать сложные combat/world/economy systems раньше Phase 2.

Безопасный acceptance для следующего шага:

- приложение запускается локально;
- открывается main menu;
- можно перейти к character creation;
- можно перейти к mock world map;
- код остается frontend-only;
- структура соответствует технической архитектуре.

## 6. Команды для проверки проекта

Текущее состояние проекта: подготовлена документационная база и создан минимальный frontend skeleton в `client/`. Корневой `package.json` пока отсутствует; frontend-команды выполняются из папки `client/`.

Проверить список Markdown-документов:

```powershell
rg --files .\docs -g "*.md"
```

Проверить список PDF-документов:

```powershell
Get-ChildItem -Path .\docs -Recurse -Filter *.pdf
```

Повторить конвертацию PDF в Markdown:

```powershell
& 'C:\Users\hayre\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' .\tools\convert-docs-pdf-to-md\convert_docs_pdf_to_md.py
```

Проверить, что для каждого PDF есть рядом Markdown-файл:

```powershell
$pdfs = Get-ChildItem -Path .\docs -Recurse -Filter *.pdf
$missing = $pdfs | Where-Object { -not (Test-Path ([System.IO.Path]::ChangeExtension($_.FullName, '.md'))) }
$missing
```

После создания frontend-прототипа ожидаемые команды проверки должны быть добавлены в `client/package.json`, например:

```powershell
cd client
npm run dev
npm run build
npm test
```

## Project structure preparation

Дата подготовки структуры: 2026-07-02

### Папки, которые уже существовали

- `docs/` - документация проекта, PDF-источники, Markdown-конвертации, статусные документы.
- `tools/` - вспомогательные инструменты проекта, включая конвертацию PDF-документов в Markdown.

### Папки, которые были созданы

- `client/` - frontend workspace для React + Vite + TypeScript prototype. Изначально был создан только `README.md`; затем добавлен минимальный frontend skeleton, описанный в разделе `Frontend skeleton`.
- `server/` - будущий backend workspace. Создан только `README.md`; backend не добавлялся.
- `shared/` - будущий workspace для общих типов, схем, констант и утилит. Создан только `README.md`.
- `data/` - будущий workspace для data-driven контента: items, skills, locations, NPCs, factions, quests, events, lore. Создан только `README.md`.
- `assets/` - будущий workspace для визуальных и аудио-ресурсов. Создан только `README.md`.

### Что можно делать следующим шагом

Следующий безопасный шаг - развить минимальный Phase 1 frontend skeleton в `client/` по технической архитектуре:

- character creation flow;
- mock world map interactions;
- event scene shell;
- dialogue input;
- thought panel;
- local mock data;
- `localStorage` save.

Backend, AI integration, production database и игровые системы Phase 2 пока не добавлять.

## Frontend skeleton

Дата создания frontend skeleton: 2026-07-02

### Что создано

В `client/` создан минимальный React + Vite + TypeScript skeleton для Phase 1 frontend prototype:

- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.node.json`
- `index.html`
- `src/main.tsx`
- `src/App.tsx`
- `src/styles/global.css`

Созданы папки:

- `src/screens/`
- `src/components/`
- `src/systems/`
- `src/types/`
- `src/data/`
- `src/state/`
- `src/assets/`

Созданы placeholder-экраны:

- `MainMenu`
- `CharacterCreation`
- `WorldMap`
- `EventScene`
- `Inventory`
- `Journal`
- `Settings`

### Что реализовано

- `App.tsx` переключает экраны через локальное состояние без роутера.
- `MainMenu` показывает название `AI-DND` и кнопки `New Game`, `Continue`, `Settings`.
- `New Game` открывает `CharacterCreation`.
- `Continue` открывает `WorldMap`.
- `Settings` открывает `Settings`.
- Остальные экраны имеют кнопку `Back to Menu`.
- Добавлены базовые dark fantasy стили: темный фон, пергаментные панели, деревянно-железные кнопки, читаемый текст.

### Что не добавлялось

- Backend не добавлялся.
- AI integration не добавлялась.
- База данных не добавлялась.
- Боевая система не добавлялась.
- LM Studio не подключался.
- Игровая логика не создавалась.
- UI-библиотеки не использовались.

### Проверка

В `client/` выполнены:

```powershell
npm install
npm run build
npm run dev -- --host 127.0.0.1
```

Результат:

- `npm install` успешно установил зависимости.
- `npm run build` успешно собрал production build.
- `npm run dev -- --host 127.0.0.1` успешно поднял Vite dev server на `http://127.0.0.1:5173/`; после проверки процесс был остановлен.

Примечание: `npm install` сообщил о 2 audit vulnerabilities в установленных npm-пакетах. Автоматическое исправление через `npm audit fix --force` не выполнялось, чтобы не менять зависимости с breaking changes без отдельной задачи.

### Следующий безопасный шаг

Следующий безопасный шаг - развить Phase 1 frontend prototype без backend и AI:

- уточнить визуальный layout `MainMenu`;
- добавить простой placeholder flow `CharacterCreation -> WorldMap`;
- подготовить mock data только для экранов;
- добавить `localStorage` save/load только после согласования минимальной структуры save.
## Character creation MVP

Дата обновления: 2026-07-02

### Что реализовано

- Экран `CharacterCreation` стал рабочим MVP-экраном создания персонажа.
- Добавлены поля `character name` и `origin` со стартовыми происхождениями: `prisoner`, `deserter`, `hunter`, `scholar`, `outcast`.
- Добавлены базовые характеристики: `strength`, `dexterity`, `constitution`, `intelligence`, `wisdom`, `charisma`.
- Реализовано распределение 12 очков поверх базового значения 8, с минимумом 8 и максимумом 16 на старте.
- Рассчитываются стартовые параметры: `health`, `stamina`, `armorClass`.
- После `Start Journey` создается объект `player`, сохраняется в `localStorage` под ключом `ai-dnd-save`, затем открывается `WorldMap`.
- `MainMenu` показывает `Continue` активной только при наличии сохранения.
- `WorldMap` показывает имя, происхождение и стартовые параметры сохраненного персонажа; при отсутствии сохранения показывает сообщение и возврат в меню.

### Добавленные файлы

- `client/src/types/player.ts` - типы `PlayerCharacter`, `PlayerOrigin`, `Attributes`, `DerivedStats`.
- `client/src/systems/save/saveSystem.ts` - простой helper для `saveGame`, `loadGame`, `hasSave`, `deleteSave`.

### Что не добавлялось

- Backend не добавлялся.
- AI integration не добавлялась.
- Боевая система не добавлялась.
- Инвентарь и карта с логикой путешествия не добавлялись.
- UI-библиотеки не использовались.

### Проверка

В `client/` выполнено:

```powershell
npm run build
```

Результат: production build успешно собран.

Для ручной проверки экрана:

```powershell
npm run dev
```

## Localization RU/EN

Дата обновления: 2026-07-03

### Что реализовано

- Добавлена простая frontend-система локализации без сторонних библиотек.
- Поддерживаются языки `ru` и `en`.
- Русский язык используется по умолчанию, если язык еще не выбран.
- Выбранный язык сохраняется в `localStorage` под ключом `ai-dnd-language`.
- Добавлены словари переводов для текущих UI-текстов.
- `MainMenu` получил компактный переключатель языка.
- `Settings` получил переключатель языка `Русский` / `English`.
- При переключении языка интерфейс обновляется без перезагрузки страницы.
- Текущие экраны используют `t(key)` для видимых UI-текстов.

### Добавленные файлы

- `client/src/i18n/languages.ts`
- `client/src/i18n/translations/ru.ts`
- `client/src/i18n/translations/en.ts`
- `client/src/i18n/i18n.ts`
- `client/src/components/LanguageSwitch.tsx`

### Что не добавлялось

- Backend не добавлялся.
- AI integration не добавлялась.
- База данных не добавлялась.
- Боевая система не добавлялась.
- UI-библиотеки и i18n-библиотеки не использовались.

### Проверка

В `client/` выполнено:

```powershell
npm run build
npm run dev -- --host 127.0.0.1
```

Результат:

- production build успешно собран;
- Vite dev server успешно запущен на `http://127.0.0.1:5173/` и после проверки остановлен.

## Main menu logo banner

Update date: 2026-07-04

- Main menu logo banner added. Language switcher removed from MainMenu and kept only in Settings.

## CharacterCreation visuals

Update date: 2026-07-04

- CharacterCreation visuals updated: bottom panel replaced, origin icons added.
- Fixed CharacterCreation bottom panel: removed old outer panel wrapper and kept only the custom uploaded panel image.
- CharacterCreation updated: attribute point allocation added, character name moved above character preview, stats panel made scrollable.
- CharacterCreation visuals fixed: bottom panel width restored, origin icons removed from old button frames, character name input repositioned.

## WorldMap MVP

Update date: 2026-07-05

- WorldMap MVP implemented: connected map nodes, route-only travel, player marker movement, location info panel, and save persistence for current location.

## Companion System planned

A new Companion System has been planned and documented in `docs/Systems/COMPANION_SYSTEM.md`.

The first major companion is Anariel, an elf woman who may join the player early in the game. The system includes companion guidance, camp conversations, travel energy, relationship values, optional romance, companion agency, and a future tragic story arc.

This system is documentation-only for now. No frontend, backend, AI integration, combat logic, or save changes have been implemented yet.

## Anariel assets added

Update date: 2026-07-09

- Anariel companion images added to `assets/companions/anariel/` and renamed according to the companion asset schema.
- `docs/ASSET_MANIFEST.md` created/updated with the Anariel companion asset table.
- `docs/Systems/COMPANION_SYSTEM.md` updated with real Anariel visual asset paths.
- Game code unchanged: no frontend, backend, AI, save, combat, or event logic was modified.

## World Map visual interface connected

Update date: 2026-07-10

- The main world map image is connected as the `WorldMap` background.
- Location icons render above the map by each node `iconType`.
- World map UI panels are connected where assets exist and keep CSS fallback styling.
- Existing route selection, Travel, Camp / Rest entry, save/load, and RU/EN localization logic are preserved.
- Production build passes with `npm.cmd run build` from `client/`.
- Next step: polish routes and EventScene arrival.

## World Map road alignment

Update date: 2026-07-10

- Map node coordinates are aligned to the circular points already drawn on the world map image.
- Routes now follow adjacent visible road points instead of direct lines across terrain.
- Added intermediate `road_point` and `danger_point` nodes for the western, central, northern, southern, eastern, marsh, and volcanic road chains.
- The UI no longer draws a custom route network over the map; it highlights existing points and available neighbors instead.
- Production build passes with `npm.cmd run build` from `client/`.

## World Map fullscreen pan and zoom

Update date: 2026-07-10

- WorldMap now uses a fullscreen `world-map-viewport` with a movable/scalable `world-map-canvas`.
- Mouse drag pans the map and wheel input zooms between `1` and `3`.
- Added small zoom in, zoom out, and reset controls over the map.
- Location icons and road point markers were reduced so they do not cover the painted map roads.
- Existing Travel, Travel Energy display, Camp / Rest entry, save/load, and RU/EN text remain in place.

## World Map pathfinding fix

Update date: 2026-07-10

- Added BFS pathfinding through intermediate world map nodes with `findPathBetweenNodes`.
- Added `getTravelPathCost`, `getTravelPathDangerLevel`, and `validateWorldMapData` helpers.
- Routes are validated for missing node ids, invalid coordinates, invalid costs, invalid travel time, and missing start node.
- Travel now distinguishes missing paths from insufficient travel energy.
- Production build passes with `npm.cmd run build` from `client/`.

## World Map point selection fix

Update date: 2026-07-10

- Map nodes now stop pointer/click propagation so marker clicks do not start drag-pan.
- Nodes support click and keyboard selection with Enter/Space.
- Current, selected, available, and unavailable states have explicit visible styling.
- Road points keep a small visible marker with a larger clickable hit area for debugging and travel.
- Production build passes with `npm.cmd run build` from `client/`.

## World Map road point marker added

Update date: 2026-07-10

- Added `road_point_marker.png` to `client/public/assets/world-map/icons/`.
- `road_point` nodes now use the dedicated `road_point` icon type.
- Road point markers render as smaller clickable map icons.
- Unavailable icons are more visible, while selected, current, and available states remain prominent.

## World Map player portrait marker

Update date: 2026-07-10

- The selected character portrait is saved as `player.portraitUrl`.
- WorldMap shows the saved portrait inside the top-left character frame.
- The current player position on the map uses the same portrait in a circular marker.
- The marker stays inside `world-map-canvas` and moves with the current location during Travel.
- Old saves without `portraitUrl` are normalized with a safe fallback portrait path.
- Missing or failed portrait images fall back to the character initial.

## World Map portrait, clean UI panels, and slow travel fix

Update date: 2026-07-10

- Removed extra CSS backplates from WorldMap panels while keeping the decorative PNG panel assets.
- Removed extra CSS backplates from WorldMap UI icon buttons and zoom controls.
- Fixed the selected hero portrait in the top-left WorldMap frame and on the circular map marker.
- Travel Energy is now stored in save data and spent on successful Travel using path `energyCost`.
- Travel now uses a walking delay based on path `travelTimeHours`, clamped between 800ms and 1500ms.
- Added a TODO hook for future mounts, vehicles, ships, portals, and other travel speed modifiers.
- Fullscreen map, pan, zoom, point selection, and route pathfinding remain in place.
