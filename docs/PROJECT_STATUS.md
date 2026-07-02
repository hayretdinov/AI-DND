# AI-DND Project Status

Дата обновления: 2026-07-02

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

На текущий момент не найдены:

- `client/`
- `server/`
- `shared/`
- `data/`
- `assets/`
- `README.md`
- `package.json`
- `.git`

То есть проект сейчас находится на стадии подготовленной документационной базы. Игровое приложение, frontend, backend, общие типы, игровые данные и тестовая инфраструктура еще не созданы.

## 2. Найденные документы

Всего найдено 30 Markdown-файлов в `docs`, включая отчет о конвертации PDF.

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

- React + Vite + TypeScript frontend в `client/`;
- базового запуска проекта через `package.json`;
- главного меню;
- экрана создания персонажа;
- экрана глобальной карты;
- простого travel prototype на mock data;
- event scene screen;
- свободного dialogue/input panel;
- thought panel;
- базовых status/inventory/journal mockups;
- локальных mock data для locations, events, NPC, items, player;
- localStorage save/load;
- минимальной навигации между сценами;
- базового визуального стиля UI согласно `AI-DND UI-UX System.md`;
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

Текущее состояние проекта документационное. `package.json` пока отсутствует, поэтому `npm install`, `npm run dev`, `npm test` сейчас запускать нечего.

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

- `client/` - будущий frontend workspace для React + Vite + TypeScript prototype. Создан только `README.md`, игровой код не создавался.
- `server/` - будущий backend workspace. Создан только `README.md`; backend не добавлялся.
- `shared/` - будущий workspace для общих типов, схем, констант и утилит. Создан только `README.md`.
- `data/` - будущий workspace для data-driven контента: items, skills, locations, NPCs, factions, quests, events, lore. Создан только `README.md`.
- `assets/` - будущий workspace для визуальных и аудио-ресурсов. Создан только `README.md`.

### Что можно делать следующим шагом

Следующий безопасный шаг - создать минимальный Phase 1 frontend prototype в `client/` по технической архитектуре:

- React + Vite + TypeScript scaffold;
- базовая структура `client/src/`;
- main menu;
- character creation screen;
- mock world map;
- event scene shell;
- dialogue input;
- thought panel;
- local mock data;
- `localStorage` save.

Backend, AI integration, production database и игровые системы Phase 2 пока не добавлять.
