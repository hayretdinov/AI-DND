# AI-DND Project Status

## Combat Thought Hints

Update date: 2026-07-18

- Added deterministic combat suggestions to the existing event `Thoughts` panel instead of creating a new panel.
- Hints are text-only helper examples; clicking an example inserts it into the current dialogue input without sending or resolving the action.
- Context uses combat phase, active turn, player/target combatants, equipped weapon, shield/offhand item, distance, cover, magic knowledge, ranged weapon readiness, ammo, and post-combat state.
- Hints avoid impossible suggestions such as melee attacks from medium distance, spear thrusts while too close, unloaded crossbow shots, ranged shots without ammo, and magic without enough mana/known formula.
- Added generator fixtures covering sword, dagger, spear distance, unarmed, shield, distance, magic, crossbow, turn order, and post-combat behavior.
- Added docs: `docs/Systems/COMBAT_THOUGHT_HINTS.md`.
- Build passes: `npm.cmd run build` in `client` completed successfully on 2026-07-18.

## Magic Word Combat Formula Routing

Update date: 2026-07-17

- Pure formulas such as `Игнис Ланца Хостис` now route to `magic` without requiring a verb.
- Parser normalization accepts lowercase, quotes, punctuation, and `Произношу:` intro text while storing canonical ids `ignis + lancea + hostis`.
- Questions, teaching/history mentions, negation, and trade wording remain non-cast routes.
- Arkel's basic magic lesson unlocks `hostis`, starter mana for trained non-mages, and known formula `fire_lance`.
- `fire_lance` continues through the existing `validateMagicFormula` and `resolveSpell` path, spending mana and applying NPC HP changes before the standard enemy turn.
- Added docs: `docs/Systems/MAGIC_WORD_COMBAT.md`; updated magic, routing, trainer, combat, narration, recovery, status, and bible docs.
- Build passes: `npm.cmd run build` in `client` completed successfully on 2026-07-17.

## Turn Based Combat State

Update date: 2026-07-17

- Added authoritative `activeCombat` save state with phase, round, stable turn order, active combatant, combatants, action deduplication, and debug log.
- Existing melee, ranged, magic, and legacy combat routes now synchronize player results into the same turn state.
- Enemy turns now run automatically after valid player combat actions while the enemy is alive and able to act.
- Enemy attacks apply real player HP loss down to 0 instead of clamping the player to 1 HP.
- Removed the hidden immediate counterattack from text melee and legacy player attack resolution.
- Invalid or unrecognized combat actions do not advance the queue and do not grant a free enemy turn.
- Added compile-time self-test fixture for turn combat state and enemy turn flow.
- Added docs: `docs/Systems/TURN_BASED_COMBAT.md`; updated combat narration and recovery docs.
- Build passes: `npm.cmd run build` in `client` completed successfully on 2026-07-17; preview smoke-check returned HTTP 200.

## Resource Regeneration and Training Request Gate

Update date: 2026-07-16

- Added game-time based mana and stamina regeneration through `client/src/systems/resources/resourceRegeneration.ts`.
- Regeneration uses `currentDay/currentHour`, stores `resourceRegeneration.lastProcessedGameMinute`, clamps to maximum values, preserves fractional gains, and does not use render-frame timers or real offline time.
- Camp rest saves with the `sleep` regeneration mode; ordinary travel/save normalization uses the normal mode.
- Magic spending now marks mana regeneration as delayed; melee and ranged combat spending now marks stamina regeneration as delayed.
- Trainer and blacksmith action panels no longer appear automatically on first conversation.
- Chat learning phrases now route as `trainingRequest`; `EventScene` opens trainer/blacksmith actions only after an accepted per-NPC agreement saved in `player.trainerProgression.trainerAgreements`.
- Negated or refused training requests save a refusal and keep the action panel hidden.
- Added docs: `docs/Systems/RESOURCE_REGENERATION.md`; updated trainer and chat routing docs.
- Build passes: `npm.cmd run build` in `client` completed successfully on 2026-07-16.

## Top Status HUD and Tabbed Trader UI

Update date: 2026-07-15

- Added a shared `TopStatusBar` / `StatusIndicator` component for the main event indicators.
- Dynamic NPC and merchant scenes now show health, mana, stamina, distance, cover, relationship, trust, fear, and hostility in one top row.
- Removed the status values from the dialogue header stats so the same numbers are not duplicated inside the chat panel.
- Merchant scenes now use the same top HUD instead of the old merchant-only status bar.
- The visible merchant item selector is now a single right-side panel with `Купить` and `Продать` tabs.
- Buy mode shows merchant stock and creates `player_buys` deals; sell mode shows player inventory and creates `player_sells` deals.
- Switching trade tabs clears the current active deal to avoid stale selected items.
- The deal area remains transparent and no longer contains separate confirm/refuse buttons; accepted deals are confirmed inside the shared dialogue panel action area.
- Added docs: `docs/Systems/TOP_STATUS_HUD.md` and `docs/Systems/TRADER_UI.md`.
- Build passes: `npm.cmd run build` in `client` completed successfully on 2026-07-15; preview smoke-check returned HTTP 200.

## Shared Trader Dialogue, Hidden Combat Numbers, and Racial Stats

Update date: 2026-07-15

- Merchant scenes now use the common dialogue component and shared dialogue styling without a merchant-only dialogue panel class.
- Melee, ranged, and magic player-facing narration no longer shows roll totals, difficulty values, damage numbers, dice formulas, or numeric bonuses.
- Combat numeric data remains available internally through resolver results and combat log `debugData`.
- Added racial stat definitions for the existing character creation races: Human, Elf, Dwarf, and Orc.
- Character creation stores base attributes, allocated points, race modifiers, final attributes, and a stats schema version.
- Save normalization migrates old characters into the racial stat schema while preserving existing save loading.
- Added docs: `docs/Systems/COMBAT_NARRATION.md` and `docs/Systems/RACIAL_STATS_SYSTEM.md`.
- Build passes: `npm.cmd run build` in `client` completed successfully on 2026-07-15.

## Trader Dialogue UI

Update date: 2026-07-15

- Merchant scenes now keep the shared `SceneDialoguePanel` but add a merchant-only lower full-width layout so trade panels no longer overlap the chat composer.
- Merchant dialogue history uses a flexible scroll region, preserves manual scroll position when the player reads old messages, and wraps long text safely.
- The textarea blocks blank messages, supports Enter to send, Shift+Enter for new lines, and IME composition without premature send.
- Sending is protected against duplicate submit attempts, focus returns to the textarea after send, and AI reply errors preserve the typed text.
- Editable targets are ignored by global guide hotkeys, so typing inside the textarea is not intercepted by scene keyboard handlers.
- Added compile-time dialogue input fixtures and documented the UI in `docs/Systems/TRADER_DIALOGUE_UI.md`.
- Build passes with `npm.cmd run build` from `client/`; preview smoke-check returned HTTP 200 on `http://127.0.0.1:4173/`.

## Trainer NPC System

Update date: 2026-07-15

- Added persistent trainer definitions for Master Sword Edgar, Archer Iara, Magister Arkel, High Mage Elyrion, Archmage Tarvis, General Vargas, and Lord Commander Cedric.
- Added supplied trainer images under `client/public/assets/npcs/trainers/`.
- Added Central Settlement map placements for the training yard, archery range, and magister hut.
- Western Great City mentor NPC markers for Elyrion, Tarvis, Vargas, and Cedric now open as available trainer scenes.
- Added `player.trainerProgression` save normalization with learned tiers, skill points, spent points, free basic lessons, and guide tracking.
- Training actions appear inside the shared dialogue panel and update combat training, magic words, gold, skill points, and guide items through local game systems.
- Added `archery_basics_guide` as a readable guide item and documented the trainer system in `docs/Systems/TRAINER_NPC_SYSTEM.md`.

## Magic Word System

Update date: 2026-07-15

- Added `client/src/systems/magic/` with types, dictionary, spell definitions, parser, validator, resolver, progression, messages, effects, and self-test fixtures.
- Added `player.magic` state and save migration for old saves without magic.
- Mage character creation now grants starting words and formulas.
- NPC scene chat now detects typed magical formulas and resolves them locally before AI dialogue.
- Inventory now shows a compact grimoire and mana potions restore mana for magic-capable characters.
- NPC prompts explicitly forbid AI from deciding magic outcomes.
- Added `docs/Systems/MAGIC_WORD_SYSTEM.md`.

## Dialogue, Merchant, Inventory, and AI Sanitizer Hardening

Update date: 2026-07-14

- Removed the remaining visual Anariel advice/hint UI while preserving normal companion dialogue, memory, location context, camp presence, and visual progression.
- Added a shared transparent dialogue background token and enlarged the merchant dialogue panel.
- Added missing merchant and combat localization keys for approximate pricing, closed negotiations, insulting offers, and hidden combat result labels.
- Item icons now keep a visible fallback when image files are absent. The five known missing assets are documented in `docs/Systems/INVENTORY_SYSTEM.md`.
- Added authorized item transfer reasons and blocked unauthorised `[[GIVE_ITEM:...]]` grants.
- Scripted requests for simple clothes now produce a buy/barter/work offer instead of a free item.
- Added `inWorldResponseSanitizer` and routed Anariel, NPC, and Game Master text through it before UI and memory writes.
- Local AI technical errors are kept out of player-facing dialogue notices.

## Ardania Lore Keeper Integration

Update date: 2026-07-14

- Preserved the attached canonical lore file at `docs/lore/ARDANIA_WORLD_LORE.md`.
- Added client-safe structured lore entries in `client/src/data/ardaniaLore.ts`; secret lore is not passed into ordinary client-side NPC prompts.
- Added `LoreKeeperService`, `ArdanianLoreRepository`, `NpcLoreProfileBuilder`, and `LoreResponseValidator`.
- AI-enabled NPC prompts now include Ardania canon context selected by NPC role, profession, faction, and knowledge level.
- NPC responses are validated against metaknowledge, modern terms, and prompt-injection echoes before being shown.
- NPC runtime memory can store player-provided rumors as `RUMOR`, not `FACT`.
- Added a local typed EventBus for lore and NPC dialogue events.
- Added compile-time self-test fixtures for common, scholarly, secret, modern-term, prompt-injection, and learned-rumor scenarios.
- Added `docs/LORE_SYSTEM.md`.

## Gate Entry, Unarmed Combat, and Dialogue Role Split

Update date: 2026-07-14

- Restored the gate `Enter` / `Пройти` action as a separate `event-context-actions` UI layer above the dialogue panel.
- The city entry button now depends on saved `cityAccess[cityId].status === "allowed"`, not on Local AI, the last NPC reply, or transient dialogue state.
- Expanded player intent parsing for weapon attacks, unarmed attacks, kicks, shoves, grapples, thrown objects, improvised attacks, dodge, retreat, and flee.
- Generic attack falls back to unarmed when no weapon is equipped; specific weapon attacks remain blocked if the weapon is missing.
- Added local improvised/thrown-object validation for nearby stones and debris.
- Combat with bandits and monsters resolves fully without Local AI: rolls, hit/miss, damage, defeat, and enemy counterattack are calculated by the Game Engine.
- Lower scene dialogue now separates `player`, `npc`, `game_master`, `combat`, and `system` messages.
- Added debug logs for intent parsing, combat player action, combat enemy action, Game Master narration source, and city enter button state.
- Added system docs: `docs/Systems/COMBAT_SYSTEM.md`, `docs/Systems/PLAYER_INTENT_SYSTEM.md`, `docs/Systems/AI_DUNGEON_MASTER_SYSTEM.md`, and `docs/Systems/CITY_MAP_SYSTEM.md`.

## Merchant Scene and NPC Local Knowledge

- Added the supplied merchant stall background at `client/public/assets/locations/merchant_stall.png`.
- Added a dedicated Central Settlement merchant background at `client/public/assets/backgrounds/merchants/central_settlement_merchant_background.png`.
- Added `client/src/data/sceneAssets.ts` so scene backgrounds are resolved by NPC/event identity and scene mode.
- Central Settlement merchant now uses the new dedicated background; Western Great City merchant keeps `merchant_stall.png`.
- Central Settlement gate guard now uses `client/public/assets/locations/central_settlement.png` instead of a merchant stall.
- Merchant events now use the stall background instead of generic city backgrounds.
- Reworked merchant UI inside `EventScene`: merchant goods are on the left, merchant/stall and trade zone are centered, player inventory is on the right.
- The trade footer is fixed inside the center trade zone. The `Trade` / `Confirm Trade` button is always visible and becomes enabled only after the engine marks the deal accepted.
- Raised the trade zone, shifted the merchant figure slightly right, aligned bottom navigation to the right, and moved Anariel's merchant hint into the upper-left area of the center stage.
- Item grids and dialogue messages own their scroll areas; the scene root remains `100dvh` with hidden overflow to prevent overlap at small heights.
- Added bottom merchant navigation for Inventory, City Map, World Map, Journal, and Settings using existing UI assets where available.
- Added `worldEntityRegistry` and `npcKnowledgeSystem` for settlement-limited NPC knowledge.
- Local AI prompts now receive compact known NPC/location lists instead of broad world access.
- Optional AI mention markers `[[MENTION_NPC:...]]` and `[[MENTION_LOCATION:...]]` are validated and stripped before UI display.
- Added docs: `docs/Systems/MERCHANT_SYSTEM.md` and `docs/Systems/NPC_KNOWLEDGE_SYSTEM.md`.
- Build passes: `npm.cmd run build` in `client` completed successfully on 2026-07-14.

Дата обновления: 2026-07-03

## Western Great City Map and Gate Flow

- Added the supplied Western Great City map asset at `client/public/assets/maps/western_great_city_map.png`.
- Added the supplied Central Settlement map asset at `client/public/assets/maps/central_settlement_map.png`.
- Added `CityMapScene` with data-driven city locations, player position, unavailable places, NPC markers, and city navigation.
- WorldMap city entry now opens the gate guard first for the Western Great City, central settlement, and southern city instead of jumping directly to merchants.
- Gate entry is resolved by local game logic through typed intent; the guard dialogue only reports the result, and the `Enter` button appears after `cityAccess[cityId].status === "allowed"`.
- Added safe save migration for `cityAccess`, `cityState`, and `navigationReturnContext`.
- Added city placements for the royal court NPCs, blacksmith, and stable `city_merchant_main` merchant alias.
- Added Central Settlement city map data for the elder house, common house, town hall, blacksmith, altar, market square, tavern, warehouse, artisan houses, resident houses, and north/south gates.
- Added the central settlement merchant placement on the market square using the existing persistent merchant state.
- City map NPC selection opens the shared `EventScene`; merchant selection reuses the existing merchant trade layout and returns to the city map.
- Build passes: `npm.cmd run build` in `client` completed successfully on 2026-07-13.

## Text-driven Game Master and Engine MVP

- Добавлен локальный `GameMasterSystem`: он получает готовый `GameActionResult` от игровых систем и превращает его только в атмосферное описание, не бросая кубики, не считая урон и не меняя save напрямую.
- Добавлен `PlayerIntentSystem`: player input в EventScene проходит через распознавание typed intent для RU/EN действий.
- Action buttons removed from EventScene default flow: intro Анариэль и random NPC/monster сцены используют нижний свободный текстовый ввод, а правая панель показывает мысли, здоровье и подсказку.
- Anariel intro free/leave works through typed intent: `free_companion` и `leave_companion` обновляют состояние Анариэль и после narration возвращают игрока на WorldMap.
- Combat starts through typed attack intent: игрок пишет атаку в диалоге, после чего `CombatSystem` выполняет проверку оружия, бросок, hit/miss, damage и enemy counterattack.
- Game Engine calculates dice, hit/miss, damage and consequences; AI/Game Master only narrates already resolved outcomes.
- Starting inventory is empty: `createDefaultInventoryState()` теперь возвращает пустой список items и пустое equipment.
- Strict itemRegistry MVP path added: NPC rewards проходят через `itemRegistry` и `allowedItemRewards`; неизвестные или запрещенные AI markers игнорируются.
- AI cannot give items outside `allowedItemRewards`: guard, bandit, merchant, civilian, monster and Anariel intro have explicit reward allowlists.
- NPC/monster visuals enlarged through `event-npc-figure--large`.
- Dialogue panel made smaller and more transparent with `scene-dialogue-panel--compact` and `scene-dialogue-panel--transparent`.
- Build passes: `npm.cmd run build` in `client` completed successfully on 2026-07-13.

## Strict Item Registry MVP

- Starting inventory is empty: no sword, bread, pouch, key, potion, clothes, or test items are granted at New Game.
- Added 20 strict item templates in `client/src/data/itemRegistry.ts`.
- AI item rewards are validated against `itemRegistry` and context `allowedItemRewards`.
- `[[GIVE_ITEM:itemId:quantity]]` and `[[REWARD_GOLD:amount]]` markers are parsed, clamped, removed from UI text, and never saved raw in dialogue history.
- Items can be used/equipped/read/converted to gold through Inventory UI.
- `simple_clothes` equips to body/chest and changes `currentOutfitStage` to `clothes`.
- Weapons equip to primary weapon/main hand; shield equips to shield/off-hand compatibility slot; old amulet equips to amulet.
- Dead NPCs, monsters, and Anariel intro have empty item reward access.
- The item registry is documented in `docs/Systems/ITEM_REGISTRY.md`.
- Build passes: `npm.cmd run build` in `client` completed successfully on 2026-07-13.

## Merchant Trading MVP

- Added three merchant NPCs: central settlement, southern city, and western city.
- Merchant scenes reuse `EventScene`: player inventory on the left, merchant stock on the right, deal area in the center, and the standard bottom dialogue panel.
- Dragging an item into the deal area creates an offer only. The trade is completed only after the merchant accepts and the player presses Confirm.
- `MerchantSystem` owns prices, active deal state, merchant gold, inventory movement, trade history, relationship, haggling, quests, and save persistence.
- Merchant AI can discuss the calculated offer in character, but cannot create items, change the final engine price, or complete a trade by text.
- Merchant stock is limited to existing `itemRegistry` ids.
- Build passes: `npm.cmd run build` in `client` completed successfully on 2026-07-13.

## Royal Court and High-Rank NPC Registry

- Added 10 persistent royal-court/high-rank NPCs and one Western Great City blacksmith.
- Each new NPC uses a stable `templateId === instanceId` and separate save memory under `save.npcs.instances`.
- Added profile data for traits, goals, fears, knowledge restrictions, relationships, and quest seeds.
- Added EventScene location events using the shared EventScene instead of separate scene copies.
- Added dev-only `window.__AI_DND_DEBUG__.openNpc(npcId)` for testing these NPCs.
- Copied the 10 supplied NPC portraits into `client/public/assets/npcs/royal_court/`.
- Prepared `/assets/npcs/royal_court/blacksmith.png` as the blacksmith path; no blacksmith image was supplied in this task.

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

## World Map step-by-step travel

Update date: 2026-07-10

- Travel now follows the full path returned by `findPathBetweenNodes`, including intermediate road points.
- The hero stops visually and logically on each intermediate node before continuing.
- Energy and game time are spent per segment instead of once at the final destination.
- If energy runs out mid-route, the hero remains on the last reached node and travel stops.
- Walking movement now uses a per-segment delay clamped between 900ms and 1800ms.
- The existing TODO for future mounts, vehicles, ships, portals, and other travel modifiers remains in place.
- The map marker portrait is larger and cropped toward the hero's head.

## World Map travel polish

Update date: 2026-07-10

- Energy warnings now distinguish no energy for the first segment from partial energy for a longer route.
- Travel remains available when the hero has enough energy for at least the first segment.
- Removed the no-op `selectedNodeId` assignment after step-by-step travel.
- Old saves are safely written back after migration of portrait, travel energy, and world time fields.

## World Map slow segmented travel arrow

Update date: 2026-07-10

- Walking travel is slower: each segment uses `segmentTravelTimeHours * 700`, clamped between 1800ms and 3200ms, with a 2200ms fallback.
- Added `activeTravelSegment` for the current `fromId -> toId` travel step.
- While travelling, the map renders a dashed arrow only to the next point, inside `world-map-canvas`.
- The arrow updates after each reached point and disappears after arrival or an energy stop.
- The top-left hero portrait uses layered portrait, fallback, and frame elements so a missing image shows the character initial instead of an empty frame.
- Fullscreen map, pan, zoom, point selection, routes, and step-by-step energy spending remain in place.

## World Map walking speed slowed

Update date: 2026-07-11

- Minimum visual delay for each walking segment is now 15 seconds.
- The player marker animation now uses the same segment duration, so the hero visibly moves along the current arrow instead of jumping early.
- Every intermediate point still requires its own segment delay before the hero advances.
- The dashed travel arrow remains active on the current segment while the delay runs.
- Added explicit walking delay constants for future mounts, vehicles, ships, and portals.
- Fullscreen map, pan, zoom, point selection, routes, activeTravelSegment, and per-segment energy spending remain in place.

## World Map node editor

Update date: 2026-07-11

- Added a manual WorldMap node coordinate editor overlay for development.
- Clicking the map in editor mode captures x/y as percentages of the transformed map canvas.
- Developers can select a node and preview its position without changing `worldMap.ts` or save data.
- Coordinates and node patch snippets can be copied through the clipboard, with a textarea fallback.
- The editor shows connected nodes and route count for the selected node.
- Lightweight validation reports duplicate node ids, missing route endpoints, missing coordinates, and coordinates outside 0-100.
- Build passes with `npm.cmd run build` from `client/`.

## 2026-07-18 Attribute And Monster Combat Update

- Effective player attributes now drive combat, resources, magic, carrying, commerce, and social outcomes through one resolver.
- Living monsters accept free-text combat commands through the shared dialogue input on the player's turn.
- A persistent sword-wielding skeleton encounter was added beside the swamp graveyard using the existing asset.
- TypeScript fixtures and production build pass; the project has no separate lint/test scripts.

## Branding assets added

Update date: 2026-07-11

- Added the game logo asset to `client/public/assets/branding/game_logo.png`.
- Added `client/public/favicon.png` and connected it from `client/index.html`.
- MainMenu now uses the branding logo while keeping the text fallback.
- Build passes with `npm.cmd run build` from `client/`.

## Inventory screen redesigned from reference

Update date: 2026-07-11

- Inventory screen was redesigned from the new dark fantasy reference.
- Added a top inventory navigation bar with resources and utility buttons.
- Added a left character stats panel with attributes, secondary stats, and carry weight.
- Added a central character equipment layout with a paper-doll figure and surrounding equipment slots.
- Added a right inventory grid panel with category tabs, selected item details, sorting, and action buttons.
- Added local mock inventory data and local state for select, use, equip/unequip, drop, and drop all actions.
- Dark gothic styling, bronze accents, rarity frames, and responsive layout are in place.
- Build passes with `npm.cmd run build` from `client/`.

## Inventory polish

Update date: 2026-07-11

- Added dark fantasy item tooltips with category, rarity, description, weight, value, quantity, slot, bonuses, and comparison.
- Added comparison for equippable items against the currently equipped item in the same slot.
- Improved action buttons: quest items block use/drop, consumables decrement, equip toggles, and drop/drop all update stacks.
- Categories now support all, equipped, backpack, weapons, armor, consumables, materials, quest, and misc filters.
- Sorting now supports recent, name, weight, value, quantity, and rarity.
- Added legendary rarity support and stronger rarity frame/glow styles.
- Improved gothic panels, equipment slots, chest-like item cells, selected glow, and overloaded load warning.
- Build passes with `npm.cmd run build` from `client/`.

## Inventory save integration

Update date: 2026-07-11

- Inventory items, quantities, gold, max carry weight, and equipment slots are now stored in the game save.
- Old saves safely migrate missing inventory data, legacy categories, and legacy equipment slot names without resetting player progress.
- Use, Equip, Unequip, Drop, and Drop All actions persist through `saveGame`.
- Carry weight is recalculated from saved item stacks.
- The Inventory top Map button now returns the player to the WorldMap screen.
- Build passes with `npm.cmd run build` from `client/`.

## Event scene redesign and Anariel intro scene

Update date: 2026-07-11

- EventScene was redesigned into a fullscreen dark fantasy event layout based on the new reference.
- Added title, location, sidebar, dialogue, speaker portrait, and right interaction choice panels.
- The Anariel intro scene now uses the prison background and existing Anariel prisoner asset as a full story scene.
- Choices mode is implemented for rescue, ask, ignore, and inspect chains.
- Rescue and ignore choices save Anariel companion state and return the player to WorldMap.
- Future companion panel architecture is prepared with `interactionMode: "choices" | "companion"`.
- New character creation now starts at the necropolis intro before opening WorldMap.
- Build passes with `npm.cmd run build` from `client/`.

## Anariel intro second step

Update date: 2026-07-11

- Choosing to free Anariel no longer sends the player directly to WorldMap.
- The intro now switches to a second step where Anariel is standing, still chained, afraid, and weak.
- The second step uses `client/public/assets/companions/anariel/anariel_chained_standing_fear.png` without editing or compression.
- Final choices let the player take Anariel with them or start the journey together.
- Anariel companion state is saved only after the final second-step choice: `met`, `rescued`, `isTravellingWithPlayer`, `introEventSeen`, and relationship are updated.
- A TODO remains for replacing the choice panel with a future companion dialogue/advice panel after Anariel becomes an active companion.

## World Map simplified to major locations

Update date: 2026-07-11

- Intermediate road points were removed from `worldMapNodes` and `worldMapRoutes`.
- WorldMap now contains only the 12 major location nodes and direct routes between them.
- Travel, pathfinding, animated player marker, per-segment energy spending, and the dashed arrow now operate between major locations.
- The road point marker asset was removed and marked as removed in `docs/ASSET_MANIFEST.md`.
- Node editor now lists only the remaining major location nodes because road point nodes no longer exist.
- Enter events are limited to remaining nodes with `enterEventId`.
- Old saves with removed `road_*` current locations migrate to the nearest logical major location and are written back through the existing save normalization.

## Character outfit preview and wide map panels

Update date: 2026-07-11

- CharacterCreation now has a three-stage outfit preview: rags, simple clothes, and armor.
- Outfit preview changes only the displayed character image; new characters still start in `currentOutfitStage: "rags"`.
- New saves store `currentOutfitStage: "rags"` and `unlockedOutfitStages: ["rags"]`.
- Old saves safely migrate missing outfit fields during save normalization.
- WorldMap top and bottom PNG panels now stretch almost across the full viewport with `background-size: 100% 100%`.
- No new image assets were added and existing map, character, Anariel, travel, pan/zoom, and node editor behavior were kept intact.
- Build passes with `npm.cmd run build` from `client/`.

## Inventory companion visual

Update date: 2026-07-11

- Inventory now shows Anariel behind the player character when she is travelling with the player.
- The display condition uses `companions.anariel.isTravellingWithPlayer`, with `rescued` and `companion` status support for compatibility.
- If Anariel was ignored or is not travelling with the player, no companion visual or label is rendered.
- Inventory companion image selection is prepared around `player.currentOutfitStage`.
- Public Anariel travel assets were copied from the existing source assets without editing.
- A fallback path uses the rags travel image first, then a dark fantasy silhouette if the image cannot load.
- Build passes with `npm.cmd run build` from `client/`.

## Anariel companion advice MVP

Update date: 2026-07-11

- If Anariel is travelling with the player, WorldMap now shows a small companion advice panel.
- The `Ask for advice` button cycles through predefined mock advice lines without AI or backend calls.
- EventScene is prepared for `companion` panel mode while keeping Anariel intro choices intact.
- A location gate advice line is available for future gate/location events through the shared Anariel advice data.
- If Anariel was ignored or is not travelling with the player, the WorldMap companion panel is not rendered.
- A TODO is in place for using the same advice system in a future CampScene.
- Build passes with `npm.cmd run build` from `client/`.

## Anariel AI companion dialogue MVP

Update date: 2026-07-11

- Added a dark fantasy dialogue modal for talking with Anariel from the companion panel.
- Dialogue is available only when Anariel is travelling with the player.
- The MVP uses a local OpenAI-compatible LM Studio endpoint at `http://127.0.0.1:1234/v1`.
- If Local AI is disabled or unavailable, Anariel uses deterministic fallback replies.
- Dialogue history is stored in save data and trimmed to the latest 20 messages.
- Relationship, trust, fear, and respect update through a simple deterministic tone analysis.
- Settings now include Local AI base URL, model ID, and enable/disable controls.
- Build passes with `npm.cmd run build` from `client/`.

## AI NPC and random travel events MVP

Update date: 2026-07-12

- Added the first reusable NPC definitions for gate guards, bandits, and monsters.
- Added location and NPC visual assets under `client/public/assets/locations/` and `client/public/assets/npcs/`.
- City/castle gate events now open from WorldMap and use NPC dialogue through the existing local AI client / LM Studio Vite proxy.
- Gate access denies entry while `player.currentOutfitStage === "rags"` and shows an allowed stub for better clothing.
- Added random travel event roll for road ambush and forest beast encounters.
- Bandit NPC chat can use Local AI; monsters currently use atmospheric fallback reactions.
- NPC dialogue state is stored in save data under `npcs` and safely migrates old saves.
- `travelEvents.seenEventIds` and `activeEvent` are safely normalized in save data.
- Anariel advice can appear in random travel events when she is travelling with the player.
- Build passes with `npm.cmd run build` from `client/`.

## Travel interruption events and gold rewards

Update date: 2026-07-12

- Random WorldMap travel events now roll at travel start and trigger during movement instead of before animation.
- When a travel event triggers, movement stops, EventScene opens automatically, and Continue journey returns the hero to the pending target in the current MVP flow.
- The Enter location action is disabled while the hero is travelling, so enter events and road events stay separate.
- Player coins use `save.inventory.gold` as the single source of truth and are shown on the WorldMap top panel.
- Gate scripted help can award gold, and eligible NPC AI replies can issue a hidden `[[REWARD_GOLD:n]]` command that is stripped before display.

## Camp rest scene MVP

Update date: 2026-07-12

- Added a working Camp button on WorldMap that opens a dedicated CampScene.
- CampScene uses the night camp background under `client/public/assets/locations/player_camp.png`.
- Rest until dawn restores travel energy to max and safely saves the updated state.
- Rest advances world time by 8 hours with day rollover.
- If Anariel is travelling with the player, she appears in camp and can be talked to through the existing Anariel AI dialogue flow.
- If Anariel is not travelling with the player, the camp still works in solo rest mode.
- Returning to WorldMap refreshes the save-backed UI state.

## NPC instance memory fix

Update date: 2026-07-12

- NPC save data now separates reusable templates from per-encounter instances under `npcs.instances`.
- Legacy flat `npcs` save data migrates safely into instance records while preserving existing keys.
- Random travel encounters create a fresh NPC instance for each bandit/beast encounter, so new random NPCs start with empty memory.
- Permanent location NPCs keep stable instance ids, so guard memory remains persistent.
- EventScene uses `npcInstanceId` for dialogue history and runtime status while keeping template data for name, portrait, prompt, and fallback text.
- Bandit encounters now include a fight choice that marks the active NPC instance as dead and disables further chat.
- Dead or gone NPCs show localized unavailable-chat messages.

## Inline scene dialogue panel

Update date: 2026-07-12

- Removed the separate modal for CampScene companion dialogue.
- Camp dialogue now lives in the bottom scene panel through a reusable `SceneDialoguePanel` component.
- The active speaker is shown directly in the scene and inside the dialogue header with portrait, name, and role.
- Enter sends a message, while Shift+Enter keeps multiline input behavior.
- New player/NPC/Anariel messages automatically scroll the chat history to the bottom.
- Existing Anariel dialogue history from `save.companions.anariel.dialogueHistory` is reused, so camp conversations persist after returning to WorldMap.
- EventScene NPC and companion dialogue now use the same inline panel instead of popup chat windows, preparing the shared architecture for future scene NPC conversations.
- Build passes with `npm.cmd run build` from `client/`.

## Inventory-based combat MVP

Update date: 2026-07-12

- Added a first local combat resolver for random EventScene encounters; AI dialogue does not decide hit, miss, or damage.
- Player weapon attacks now require an equipped trained weapon in `mainHand` or `offHand`.
- The default rusty sword is a one-handed sword with `1d6` slashing Strength damage, and the default player training includes one-handed swords.
- Combat uses d20 attack rolls, simple dice formulas such as `1d6` and `2d4+1`, critical hits, misses, enemy HP, and defeated NPC state.
- Enemy counterattacks reduce player combat HP but clamp the MVP at 1 HP instead of triggering game over.
- Save normalization safely adds player combat stats, training, weapon fields, and NPC combat state without resetting existing progress.
- Inventory now shows weapon fields and a compact weapon training panel.
- Build passes with `npm.cmd run build` from `client/`.

## Anariel intro AI and one-time event fix

Update date: 2026-07-12

- Anariel intro is now opened only by the new character creation flow through `activeEvent.eventId = "anariel_intro"`.
- Continue Game no longer forces saves with `introEventSeen === false` back into the intro scene.
- `anariel_intro` is no longer attached to the necropolis WorldMap node as an enter event.
- Re-entering the necropolis now opens the normal `necropolis_gate` location event.
- The intro scene uses the inline dialogue panel and requests Anariel's first greeting through Local AI with prisoner-specific prompt context.
- Intro fallback lines keep the scene playable when Local AI is disabled or unavailable.
- Intro dialogue history is saved in `save.companions.anariel.dialogueHistory` and remains available after rescue.
- Completing rescue or leaving sets `introEventSeen = true`, clears `activeEvent`, and prevents duplicate intro playback.
- Build passes with `npm.cmd run build` from `client/`.

## AI language, travel events, inline dialogue, and safe item rewards

Update date: 2026-07-13

- Local AI prompts for Anariel and NPCs now explicitly follow the current game language, so RU UI requests Russian replies and EN UI requests English replies.
- Random WorldMap travel events keep the existing roll and mid-movement trigger flow and now log `roll`, `pending`, `triggered`, and `continue` stages.
- EventScene conversations for Anariel and NPCs now render in the lower-left scene dialogue panel, while the right panel remains dedicated to action choices.
- Added `client/src/data/itemRegistry.ts` for safe item ids and registered the newly supplied item assets under `client/public/assets/items/`.
- Added hidden AI command parsing for `[[GIVE_ITEM:itemId:quantity]]` and `[[REWARD_GOLD:amount]]`; markers are stripped before dialogue is shown or saved.
- AI item rewards are validated against actor-specific allow lists before inventory changes, so unknown or disallowed items are ignored with a console warning.
- Added a scripted gate test choice, Ask for food / Попросить еды, that grants `stale_bread` through the same inventory reward helper and persists it in save data.
- Build passes with `npm.cmd run build` from `client/`.
# Text Melee Combat

- Added deterministic text melee combat parsing and resolution for NPC chat combat scenes.
- Added stamina, distance, stance, body-zone targeting, injuries, and AI boundary rules for melee outcomes.
- Old combat commands remain routed through the legacy fallback resolver.
# Text Melee Combat Completion

Update date: 2026-07-17

- Added category-aware melee weapon configuration for unarmed, sword, dagger, knife, club, mace, axe, spear, staff, hammer, shield, and improvised attacks.
- Text melee validation now resolves the requested equipped weapon category instead of blindly using the first equipped weapon.
- Unarmed, kick, shove, and grapple actions no longer inherit equipped weapon damage.
- Shove and grapple use deterministic resolution without normal weapon damage; grapple can apply a short text-combat status.
- Explicit magic casting still routes before ranged and melee combat, preserving `Игнис Ланца Хостис`.
- Build passes with `npm.cmd run build` from `client/`.

## Pre-deployment audit

Update date: 2026-07-18

- Verified the expected project and frontend structure, localization, save system, and standalone prototype isolation.
- Checked the repository for environment files, private-key files, and common secret signatures; none were found.
- `npm.cmd install` completed successfully in `client/` and reported 3 dependency vulnerabilities (2 moderate, 1 high).
- `npm.cmd run build` completed successfully and generated `client/dist`.
- The development server started successfully for a short check and was stopped afterward.
- Current status: `READY_FOR_DEPLOYMENT_PREPARATION`.
- Full report: `docs/PROJECT_AUDIT.md`.

## Deployment preparation

Update date: 2026-07-18

- Frontend prepared for static deployment from `client`.
- Added root `vercel.json` with Vite build settings and SPA rewrite.
- Added root `netlify.toml` with the `client` base directory and SPA fallback.
- Added the Russian deployment guide at `docs/DEPLOYMENT.md`.
- Backend, AI, database, accounts, and server saves are not implemented for this deployment stage.
- Next step: push the project to GitHub and connect the repository to Vercel or Netlify.

## Frontend deployed to Vercel

Update date: 2026-07-18

- Frontend successfully deployed to Vercel.
- Production URL: https://ai-dnd-blue.vercel.app
- Deployment URL: https://ai-dnd-git-main-hayretdinov1.vercel.app
- Backend, AI, accounts, and server saves are not available yet.
- Next step: first tester checklist and AI-ready frontend layer.
