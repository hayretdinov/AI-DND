# AI-DND Project Bible

## Canonical Ardania Lore

The canonical world lore is stored at `docs/lore/ARDANIA_WORLD_LORE.md`.

NPC dialogue must respect Ardania canon through the Lore Keeper flow. AI-enabled NPCs receive only the lore they can plausibly know by role, profession, faction, location, education, and personal memory. Ordinary NPCs do not receive secret lore. Rumors, beliefs, and hearsay must not be presented as verified facts.

Current flow:

```text
Player text -> NPC prompt builder -> Lore Keeper context -> Local AI -> Lore validation -> NPC memory -> UI
```

NPCs must remain inside Ardania and must not mention AI, prompts, APIs, computers, internet, or the real modern world.

## Magic Word System

Player magic is text-driven and deterministic. Magical words typed in scene chat are parsed by the local Magic Word System, validated against `player.magic`, resolved with d20 and mana costs, then shown in chat as Game Master narration. AI/NPC systems must not decide spell success, mana, damage, effects, word learning, or formula knowledge.

Pure formulas are valid actions when they pass routing safety gates. `Игнис Ланца Хостис` canonicalizes to `ignis + lancea + hostis` and resolves as `fire_lance` through the normal magic/combat turn flow. Questions, lessons, history, negation, and trade mentions of magic words must not cast spells.

## Text Melee Combat System

Melee combat can be driven by free text in NPC scene chat. Detailed player phrases are parsed into intent, weapon, attack type, body zone, power, tempo, movement, stance, distance, and warnings. The deterministic combat engine validates equipment/training/stamina/distance, rolls d20, applies damage and injuries, updates saves, and then passes only the resolved result to Game Master narration. AI/NPC systems must not decide melee success, damage, disarm, knockdown, death, or limb loss. Text melee weapon categories are resolved by code, not AI: unarmed, sword, dagger, knife, club, mace, axe, spear, staff, hammer, shield, and improvised attacks use `meleeWeaponConfig.ts`, RuleValidator, and DiceSystem.

## Turn Based Combat State

Active combat uses `GameSave.activeCombat` as the authoritative turn state. It stores phase, round, initiative order, active combatant, participants, action ids, and debug log. Player actions are resolved by local combat systems first; then living enemies automatically receive their turn through the same deterministic combat layer. Game Master narration must describe results only and must not create mechanics, damage, death, or extra attacks.

Краткий главный документ проекта для Codex. Перед разработкой читать этот файл вместе с актуальной задачей. Если этот файл конфликтует с полной документацией в `docs`, полная документация имеет приоритет.

## 1. Что такое AI-DND

AI-DND - single-player dark fantasy RPG с tabletop D20-механиками, живыми NPC, свободным текстовым вводом, глобальной картой, путешествиями, событиями, диалогами, тактическим боем и последствиями.

Формат игры:

- браузерная RPG;
- сначала frontend prototype;
- основное взаимодействие через свободный текст;
- игрок описывает намерения, а не выбирает готовые варианты;
- мир существует независимо от игрока;
- игрок не избранный герой, а обычный человек, который зарабатывает силу, знания, репутацию и влияние.

Основной игровой цикл:

```text
Travel -> Encounter -> Dialogue / Combat / Exploration -> Consequence -> Reward / Loss -> Character Growth -> Travel
```

Игрок в игре:

- создает персонажа без выбора "класса" или судьбы;
- путешествует по глобальной карте;
- выбирает направление, маршрут, темп и подготовку;
- попадает в события;
- говорит, исследует, торгуется, угрожает, сражается, убегает, сдается или пробует другое действие свободным текстом;
- получает последствия, записи в журнале, изменения репутации, травмы, слухи и изменения мира.

## 2. Главные правила проекта

- Игрок пишет действия свободным текстом.
- Интерфейс не должен ограничивать воображение игрока.
- Игровой движок рассчитывает реальные результаты.
- AI только описывает последствия, говорит за NPC, помогает с атмосферой, диалогом, сценой и нарративным текстом.
- AI не бросает кубики.
- AI не решает попадание, урон, смерть, создание предметов, успех квестов или изменения состояния мира.
- NPC знают только то, что могли бы знать реалистично.
- Последствия постоянны: мир, NPC, фракции, экономика, слухи и история помнят события.
- Квесты - это проблемы мира, а не checklist-миссии.
- Журнал хранит наблюдения, слухи, обещания, разговоры и память, а не список задач.

Правильная цепочка результата:

```text
Player Text -> Intent System -> Rule Validator -> Game System -> Dice System -> Result Object -> AI Narration -> UI
```

## 3. Игровой цикл MVP

Минимальный playable prototype должен покрыть:

1. Создание персонажа.
2. Глобальную карту.
3. Выбор маршрута или направления.
4. Путешествие.
5. Событие.
6. Диалог, исследование или бой.
7. Последствия.
8. Журнал.
9. Сохранение в `localStorage`.

Для первого прототипа использовать mock data. Backend, база данных и AI не нужны.

## 4. Боевая система

Бой должен быть опасным, тактическим, медленным, реалистичным и story-driven. Он не должен быть arcade/action combat.

Базовые правила:

- все важные боевые проверки используют D20;
- attack roll считается игровым движком;
- damage roll считается игровым движком;
- AI не управляет правилами боя и не определяет результат;
- AI только описывает уже рассчитанный результат;
- защита учитывает armor, shield, dodge, parry, cover и body part armor;
- в документации боевой порог называется `Defense Value`; для MVP можно использовать термин `Armor Class` как UI/кодовый эквивалент защитного порога, не меняя смысл правил.

Базовая формула атаки из документации:

```text
D20 + Skill + Attribute + Weapon Bonus + Situation Modifiers vs Defense Value
```

Части тела:

- Head;
- Torso;
- Left Arm;
- Right Arm;
- Left Leg;
- Right Leg.

Доступ к целям зависит от обучения:

- beginner/novice: надежно доступен только удар в torso;
- student: torso и arms;
- experienced: torso, arms и legs;
- master: все части тела;
- legend: advanced targeting.

Codex не должен делать бой набором кнопок и не должен рассчитывать боевые правила внутри UI-компонентов.

## 5. Свободный ввод действий

Игрок может попытаться сделать любое действие.

Примеры:

- "I slowly draw my sword."
- "I try to convince the guard."
- "I attack his left arm."
- "I throw sand in his face and run."
- "I search for magical traps."

Система должна:

- определить намерение игрока;
- разобрать сложные или составные действия;
- учесть контекст, экипировку, навыки, травмы, усталость, знания, окружение и физическую возможность;
- передать действие в Rule Validator;
- вернуть структурированный результат.

Невозможные действия не показываются как техническая ошибка.

Нельзя писать игроку:

```text
ERROR: ACTION NOT AVAILABLE
```

Нужно описывать естественный результат попытки: действие не удалось, получилось частично, было неверно понято, привело к риску или превратилось в другое правдоподобное последствие.

## 6. Thought System

Thought System заменяет современные UI-подсказки внутриигровыми мыслями персонажа.

Мысли:

- являются immersive hints;
- не являются командами;
- не ограничивают свободу игрока;
- зависят от intelligence, wisdom, experience, training, reputation, injuries, fear, environment и current situation;
- могут отражать состояние тела, страх, травмы, болезнь, усталость, знания, навыки, врага и окружение.

Хорошо:

- "This road seems dangerous."
- "He seems nervous."
- "My arm hurts."
- "Perhaps negotiation is possible."

Плохо:

- "Press X."
- "Choose option 1."
- "Available action: negotiate."
- "Click here to intimidate."

Thoughts inspire actions, but never define the only available actions.

## 7. World / Lore

Жанр и тон:

- dark fantasy;
- суровый Gothic-like мир;
- medieval realism;
- древний, опасный, загадочный и несправедливый мир;
- нет чисто добрых или чисто злых фракций;
- каждый NPC и каждая фракция знают только часть правды.

Мир:

- Elyrion - название мира;
- Valgar - северный континент;
- Ashen Valley / Долина Пепла - основной регион игры;
- The Fracture / Предел - магическая катастрофа и барьер вокруг долины;
- Black Crystal - редкое и ценное вещество, хранящее магическую энергию.

Основные фракции из документации:

- The Iron Legion - военная организация, контролирует большую часть шахт, ценит порядок, дисциплину и выживание.
- The Circle of Archons - магический орден, ищет знания и изучает Fracture.
- The Free Clans - охотники, разведчики, торговцы и контрабандисты, ценят свободу и независимость.
- The Cult of Silence - религиозный культ, связанный с тайной Fracture.
- The Ash Brotherhood - бывшие заключенные и изгнанники, строящие собственную силу.

Codex не должен добавлять новые фракции, современную технологию, sci-fi объяснения или lore-элементы без явной команды.

## 8. Stone Sleep

Stone Sleep - часть lore, а не просто техническая offline-прогрессия.

Когда игрок выходит:

- персонаж входит в Stone Sleep;
- в древнем языке такие люди называются Mor'Talari;
- персонаж падает без сознания, превращается в камень, не стареет, не кровоточит, не чувствует боли, не нуждается в еде и воде;
- мир продолжает жить.

Во время отсутствия игрока:

- продолжаются войны, болезни, торговля, слухи, конфликты, смерти, рождения, экономические сдвиги и изменения поселений;
- важные NPC, обещания, квесты и связи могут получить последствия;
- time compression не должен уничтожать мир или обесценивать прогресс игрока.

При возвращении:

- персонаж пробуждается;
- мир обновлен;
- NPC помнят отсутствие;
- игрок получает атмосферную сводку того, что изменилось и почему.

## 9. UI / UX правила

Стиль:

- dark fantasy;
- parchment;
- iron;
- wood;
- candlelight;
- readable text;
- old maps, notes, worn materials, medieval manuscript feeling.

Не использовать:

- minimap;
- quest markers;
- floating damage numbers;
- exclamation marks over NPCs;
- glowing objective paths;
- objective arrows;
- modern MMO interfaces;
- mobile-game style;
- bright arcade colors;
- neon buttons;
- main dialogue buttons as the primary interaction.

UI должен ощущаться как часть мира. Игрок должен помнить мир, а не интерфейс.

## 10. Технические правила

Порядок разработки:

1. Frontend prototype.
2. Core game systems.
3. Data-driven world.
4. Backend.
5. AI integration.

Для текущего MVP:

- использовать TypeScript, React, Vite;
- frontend first;
- backend позже, только после playable frontend prototype;
- AI integration позже, только после IntentSystem, RuleValidator, DiceSystem и basic EventScene;
- игра должна работать без AI;
- использовать mock data и mock services;
- `localStorage` разрешен для MVP-сохранений;
- UI не содержит core game logic;
- game systems возвращают structured result objects;
- narration происходит отдельно.

AI позже:

- не использовать OpenAI API для игровых NPC;
- не использовать external paid AI APIs по умолчанию;
- позже использовать локальный LM Studio endpoint / OpenAI-compatible local API / local model only;
- AI не должен быть обязательным для базовой игровой логики.

## 11. Запреты для Codex

Codex не должен:

- переписывать проект с нуля;
- менять геймдизайн без явной команды;
- переписывать lore;
- менять combat rules без явной команды;
- удалять документы;
- удалять PDF;
- заменять свободный ввод кнопками;
- делать dialogue buttons главным способом взаимодействия;
- создавать хаотичные папки;
- создавать одну гигантскую `App.tsx`;
- hardcode-ить весь gameplay в UI-компоненты;
- подключать backend раньше времени;
- подключать AI раньше времени;
- делать AI ответственным за правила;
- пропускать RuleValidator;
- пропускать DiceSystem;
- игнорировать body part system;
- игнорировать Stone Sleep;
- игнорировать world persistence;
- добавлять multiplayer/MMORPG;
- добавлять Unity, Unreal или Phaser без явного одобрения;
- добавлять лишние библиотеки без необходимости;
- использовать JavaScript-файлы, если можно использовать TypeScript.

## 12. Безопасный MVP-вариант при противоречиях

Если документы или задача конфликтуют, выбирать более безопасный MVP-вариант:

- frontend-only раньше backend;
- mock data раньше production data;
- localStorage раньше database;
- no AI раньше AI integration;
- Defense Value из combat-документации можно назвать Armor Class только как защитный порог MVP, без изменения формулы боя;
- свободный текст важнее кнопок;
- RuleValidator и DiceSystem важнее AI narration;
- документация важнее кода;
- пользователь утверждает изменения дизайна.

Финальное правило: Codex implements. Documentation defines. The user approves.

## Companion System

Anariel has a planned visual progression with dedicated assets stored in `assets/companions/anariel/`: prisoner in chains, standing in chains, relieved in chains, traveling in rags, traveling in normal clothes, and traveling in armor.

## Effective Attributes And Non-Sapient Combat

Runtime systems must consume `resolveEffectivePlayerStats`; they must not recompute racial or equipment bonuses independently. Combat and social outcomes belong to deterministic game systems, while AI may narrate only the resolved result. Non-sapient creatures do not use NPC dialogue, but they share the same free-text combat input and turn engine. The swamp skeleton uses the existing map, event scene, persistent NPC state, and inventory loot path.
