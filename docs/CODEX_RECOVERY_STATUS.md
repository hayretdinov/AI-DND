# Codex Recovery Status

## 2026-07-18 Effective Attributes, Monster Input, And Swamp Skeleton

- Added one effective attribute resolver and connected it to melee, unarmed, ranged, initiative, HP/stamina, magic, carry capacity, inventory display, merchant reactions, and structured social checks.
- Social outcomes are engine-owned, saved in NPC memory, and passed to NPC AI without exposing rolls or difficulty in visible text.
- Fixed the monster input regression caused by `EventScene` setting the shared `SceneDialoguePanel` to both disabled and read-only for every living monster.
- Added the existing skeleton asset as a unique persistent encounter beside the swamp graveyard, with sword combat/loot and no monster meat.
- Added compile-time fixtures for attributes, social checks, input phases, and skeleton registration/loot.
- Verification: `npm.cmd run build` passed; only the existing Vite chunk-size warning remains. No separate lint or test scripts exist.

## 2026-07-18 Combat Thought Hints

- Added deterministic combat hint generation in `client/src/systems/combat/combatThoughtHints.ts`.
- Reused the existing `event-thought-panel` in `EventScene`; no new combat hint panel was introduced.
- Hint examples insert text into the existing NPC chat input only and do not auto-send.
- Context is built from active combat, fallback save combat state, equipment, ranged weapon state, ammo, magic words/formulas, distance, cover, and post-combat status.
- Added RU/EN translation keys and inline text styling for examples.
- Added compile-time generator fixtures covering weapon, defense, movement, magic, ranged, turn order, and post-combat cases.
- Added docs: `docs/Systems/COMBAT_THOUGHT_HINTS.md`; updated `docs/PROJECT_STATUS.md`.
- Verification: `npm.cmd run build` in `client` passed on 2026-07-18; Vite reported only the existing chunk-size warning.

## 2026-07-17 Post Combat Defeat And Loot

- Added visible enemy HP/life state to the event HUD.
- Split intelligent NPC defeat from death: 0 HP now creates a defeated living NPC unless the enemy is a monster.
- Added post-combat intents for execution, corpse search, demand, bind, release, leave, and loot transfer.
- Dead NPCs no longer answer as NPCs; Game Master narration handles further corpse actions.
- Corpse loot is generated from NPC profile/equipment and moved through the existing inventory item structure.
- `npm run build` passed in `client`.

## 2026-07-17 Text Melee Combat Completion
- Completed: text melee now uses `meleeWeaponConfig.ts` as a shared category table for unarmed, sword, dagger, knife, club, mace, axe, spear, staff, hammer, shield, and improvised attacks.
- Completed: explicit unarmed, kick, shove, and grapple no longer inherit the equipped weapon from the character.
- Completed: weapon phrases for spear, knife, hammer, shield, and unarmed actions route through melee validation instead of the old single equipped-weapon fallback.
- Completed: stamina and distance penalties are category-aware.
- Completed: shove and grapple resolve through the same deterministic attack path without applying normal weapon damage; successful grapple stores a short `grappled` text-combat status.
- Completed: explicit magic casting remains above ranged/melee routing, preserving the `Игнис Ланца Хостис` path.
- Added docs: `docs/Systems/MELEE_COMBAT.md`; updated routing, turn combat, magic, narration, status, and bible docs.
- Verification: `npm.cmd run build` in `client` passed on 2026-07-17; Vite reported only the existing chunk-size warning.

## 2026-07-17 Magic Word Combat Formula Routing
- Completed: `chatIntentRouter` routes pure formulas like `Игнис Ланца Хостис` to the existing `magic` resolver path without requiring a verb.
- Completed: `magicParser` normalizes lowercase, quotes, punctuation, and `Произношу:` intro text while keeping canonical ids and blocking unknown formula words.
- Completed: routing safety keeps questions, historical/teaching mentions, negation, and trade wording from casting spells.
- Completed: Arkel basic magic training teaches `hostis`, records known formula `fire_lance`, and gives starter mana when magic is unlocked through training.
- Completed: `fire_lance` validation/resolution coverage confirms mana spend and NPC HP mutation through `resolveSpell`.
- Added docs: `docs/Systems/MAGIC_WORD_COMBAT.md`; updated magic, routing, trainer, combat, narration, status, and bible docs.
- Verification: `npm.cmd run build` in `client` passed on 2026-07-17; Vite reported only the existing chunk-size warning.

## 2026-07-17 Turn Based Combat Recovery
- Completed: added `CombatState`, common combatant state, action result/log types, phases, turn order, and applied action id tracking to `client/src/types/combat.ts`.
- Completed: `GameSave.activeCombat` is normalized by `saveSystem` and old saves without active combat still load.
- Completed: enemy damage is no longer hidden inside text melee player resolution or legacy `resolvePlayerAttack`.
- Completed: `resolveEnemyTurn` now applies real player HP loss with `Math.max(0, currentHp - damage)`.
- Completed: `EventScene` now runs player action narration followed by automatic enemy turn narration for magic, ranged, text melee, and legacy combat paths.
- Completed: invalid combat input does not create a new combat turn or trigger a free enemy action.
- Added docs: `docs/Systems/TURN_BASED_COMBAT.md`; updated `docs/Systems/COMBAT_NARRATION.md`.
- Verification: `npm.cmd run build` in `client` passed on 2026-07-17; preview smoke-check returned HTTP 200.

## 2026-07-16 Resource Regen and Trainer Request Gate
- Completed: added `client/src/systems/resources/resourceRegeneration.ts` with game-time based mana/stamina recovery, modes, spend delays, clamping, and save-safe normalization.
- Completed: `saveGame` and `loadGame` normalization process `resourceRegeneration`; old saves initialize at current game time without offline grants.
- Completed: camp rest uses sleep-mode regeneration; normal save/time changes use normal-mode regeneration.
- Completed: spell resolution marks mana as recently spent; melee and ranged combat resolvers mark stamina as recently spent.
- Completed: trainer and blacksmith panels are gated behind saved accepted agreements in `player.trainerProgression.trainerAgreements`.
- Completed: `chatIntentRouter` now returns `trainingRequest` for training requests; `EventScene` handles it before combat routing.
- Completed: negated training requests save refusal and do not open the action panel.
- Documentation: added `docs/Systems/RESOURCE_REGENERATION.md`; updated `docs/Systems/TRAINER_NPC_SYSTEM.md`, `docs/Systems/CHAT_INTENT_ROUTING.md`, and `docs/PROJECT_STATUS.md`.
- Verification: root package file is absent; `npm.cmd run build` in `client` passed on 2026-07-16.

## 2026-07-15 Top HUD and Trader Tabs Continuation
- Completed: added shared top status HUD component with health, mana, stamina, distance, cover, relationship, trust, fear, and hostility in a fixed order.
- Completed: dynamic NPC and merchant scenes now render the top status row and no longer pass those values into `SceneDialoguePanel.stats`.
- Completed: merchant scenes use the shared top HUD instead of the old merchant-specific status bar.
- Completed: merchant item selection is now one right-side panel with Buy/Sell tabs.
- Completed: Buy mode uses merchant stock and Sell mode uses player inventory while preserving existing merchant trade handlers and save state.
- Completed: switching trade tabs clears the current active merchant deal.
- Completed: deal confirmation remains inside the shared dialogue action area after merchant acceptance; the transparent deal zone no longer contains separate confirm/refuse buttons.
- Verification: root and server package files are absent; client has only `dev`, `build`, and `preview` scripts.
- Verification: `npm` was blocked by PowerShell execution policy, so `npm.cmd run build` was used and passed.
- Verification: `npm.cmd run preview -- --host 127.0.0.1 --port 4173` served the app; `Invoke-WebRequest` returned HTTP 200; preview processes were stopped.
- Documentation: added `docs/Systems/TOP_STATUS_HUD.md`, added `docs/Systems/TRADER_UI.md`, and updated `docs/PROJECT_STATUS.md`.

## 2026-07-15 Current Continuation
- Completed: merchant conversation now uses the common `SceneDialoguePanel` classes without `merchant-dialogue-panel` or merchant-only dialogue positioning.
- Completed: visible melee, ranged and magic narration no longer exposes d20 rolls, armor/difficulty class, damage numbers, dice formulas, totals, or numeric bonuses.
- Completed: combat resolver details remain internal on resolver results and combat log `debugData`.
- Completed: starting racial stat definitions were added for the existing UI races only: human, elf, dwarf, orc.
- Completed: old saves are normalized with `baseAttributes`, `allocatedAttributes`, `racialModifiers`, `statsSchemaVersion`, and final `attributes`.
- Verification: `npm.cmd run build` in `client` passed on 2026-07-15.

## Последняя проверка
- Дата: 2026-07-15
- Текущий этап: завершено, требуется ручная проверка пользователем
- Последний полностью завершённый этап: аудит Git, создание recovery-журнала, расширение `chatIntentRouter`, подключение `meleePreparation` в `EventScene`, локализация и CSS-правки торговца, `npm.cmd run build`, `npm.cmd run preview` smoke-check
- `git status`: рабочее дерево грязное; изменены 36 отслеживаемых файлов, есть удаление `client/src/data/companions/anarielAdvice.ts`, много новых ассетов, систем и документов; commit/push не выполнялись
- Обнаруженные изменённые файлы: `client/src/App.tsx`, `client/src/screens/EventScene.tsx`, `client/src/systems/merchant/merchantSystem.ts`, `client/src/systems/intent/playerIntentSystem.ts`, `client/src/styles/global.css`, `client/src/i18n/translations/en.ts`, `client/src/i18n/translations/ru.ts`, связанные combat/save/inventory/npc/docs файлы
- Найденные новые файлы: `client/src/systems/intent/chatIntentRouter.ts`, `client/src/systems/intent/chatIntentRouter.test.ts`, `docs/Systems/CHAT_INTENT_ROUTING.md`, новые combat/magic/smithing/trainer/lore системы и ассеты
- Состояние торговца: компонент найден в реальном `EventScene`; покупка/продажа исправлены в движке и UI; build и preview smoke-check прошли
- Состояние маршрутизации чата: классификатор найден, подключён в `EventScene`, покрывает торговлю, обучение, историю, отрицания, подготовку дальнего и ближнего оружия, атаки, стрельбу и магию
- Состояние тестов: отдельного `test` script нет; compile-time fixtures приняты `tsc --noEmit` внутри build
- Состояние сборки: `npm.cmd run build` в `client` прошёл успешно после доработки торгового диалога
- Состояние runtime: `npm.cmd run preview -- --host 127.0.0.1 --port 4173` запустился, `Invoke-WebRequest` вернул HTTP 200, preview остановлен

## Торговец
- [x] Компонент найден
- [x] Покупка работает
- [x] Продажа работает
- [x] Торговец виден
- [x] Диалог увеличен
- [x] Прозрачность исправлена
- [x] Тесты проходят
- [x] История диалога читается
- [x] Поле ввода видно
- [x] Можно печатать
- [x] Enter отправляет
- [x] Shift+Enter создаёт строку
- [x] Hotkeys не мешают вводу
- [ ] Покупка не ломает чат
- [ ] Продажа не ломает чат
- [x] Runtime проверен

## Маршрутизация чата
- [x] Упоминание оружия не запускает бой
- [x] Торговый контекст работает
- [x] Обучающий контекст работает
- [x] Отрицания работают
- [x] Подготовка оружия отделена от атаки
- [x] Ближняя атака работает
- [x] Стрельба работает
- [x] Магия работает
- [x] Интеграционные тесты проходят

## Текущие ошибки
- `npm.cmd run build` прошёл успешно; предупреждение Vite только о размере chunk больше 500 kB.
- Runtime через `preview` проверен HTTP smoke-check: 200 OK.
- В проекте нет `typecheck`, `lint` или `test` scripts; доступен только `client` build.
- Поиск WIP нашёл старые документационные `mock/placeholder/TODO` и тестовые `throw new Error`; конфликтных маркеров Git не найдено.

## Следующий шаг
- Работа завершена. Требуется ручная проверка пользователем.
