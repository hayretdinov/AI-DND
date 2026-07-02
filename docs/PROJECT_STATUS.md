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
