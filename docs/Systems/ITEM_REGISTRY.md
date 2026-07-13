# MVP Item Registry

## Rules

- AI cannot give items outside `client/src/data/itemRegistry.ts`.
- AI cannot promise items outside the current NPC/event `allowedItemRewards`.
- Game Engine applies all item rewards through inventory systems.
- Items must have gameplay interaction: use, equip, read, convert to gold, craft/trade value, or future contextual use.
- Starting inventory is empty. `currentOutfitStage = "rags"` is appearance state, not an inventory item.
- Safe AI markers are stripped before dialogue display or save: `[[GIVE_ITEM:itemId:quantity]]`, `[[REWARD_GOLD:amount]]`.
- Item quantities are clamped to `1..5` for AI rewards, gold rewards to `1..50`.

## Item List

| # | Item ID | RU name | EN name | Category | Use/equip behavior | whoCanGive / restrictions |
|---:|---|---|---|---|---|---|
| 1 | `stale_bread` | Черствый хлеб | Stale Bread | consumable | Use: restoreEnergy +5; MVP may restoreHealth +1 in UI fallback; quantity -1 | guard, merchant, civilian, bandit |
| 2 | `healing_herb` | Лечебная трава | Healing Herb | medicine | Use: restoreHealth +3; quantity -1 | healer, herbalist, merchant, forest_event |
| 3 | `bandage` | Бинт | Bandage | medicine | Use: stopBleeding; MVP restoresHealth +1 if injury system is absent; quantity -1 | guard, healer, merchant, traveler |
| 4 | `small_health_potion` | Малое зелье лечения | Small Healing Potion | medicine | Use: restoreHealth +6; quantity -1 | healer, merchant, rare_guard_reward |
| 5 | `rusty_key` | Ржавый ключ | Rusty Key | quest | Quest/context item, not directly usable in MVP | guard, bandit, prisoner, quest_npc |
| 6 | `torn_note` | Оборванная записка | Torn Note | document | Use/read: shows note text placeholder | prisoner, bandit, civilian, quest_npc |
| 7 | `sealed_letter` | Запечатанное письмо | Sealed Letter | document | Use/read: "Письмо запечатано." | guard, merchant, quest_npc, civilian |
| 8 | `small_coin_pouch` | Маленький кошелек | Small Coin Pouch | misc | Use: convertToGold +5; quantity -1 | guard, merchant, bandit, civilian |
| 9 | `lockpick` | Отмычка | Lockpick | tool | Use: lockpick context; without lock shows "Здесь нечего вскрывать." | bandit, thief, merchant |
| 10 | `torch` | Факел | Torch | tool | Use: lightSource message; quantity -1 | guard, merchant, traveler |
| 11 | `leather_scrap` | Кожаный обрывок | Leather Scrap | material | Crafting/trade material; not directly usable | hunter, bandit, merchant, forest_event |
| 12 | `simple_clothes` | Простая одежда | Simple Clothes | clothing | Equip: body/chest; `currentOutfitStage = "clothes"` | guard, merchant, civilian |
| 13 | `old_cloak` | Старый плащ | Old Cloak | clothing | Equip: cloak | traveler, merchant, civilian |
| 14 | `rusty_sword` | Ржавый меч | Rusty Sword | weapon | Equip: primaryWeapon/mainHand; `1d6` slashing, strength | bandit only if defeated/disarmed/intimidated; merchant later |
| 15 | `wooden_club` | Деревянная дубина | Wooden Club | weapon | Equip: primaryWeapon/mainHand; `1d4` bludgeoning, strength | bandit, peasant, guard, civilian |
| 16 | `rusty_axe` | Ржавый топор | Rusty Axe | weapon | Equip: primaryWeapon/mainHand; `1d6` slashing, strength | bandit, woodcutter, merchant |
| 17 | `old_dagger` | Старый кинжал | Old Dagger | weapon | Equip: primaryWeapon/mainHand; `1d4` piercing, dexterity | bandit, thief, merchant |
| 18 | `cracked_wooden_shield` | Треснувший деревянный щит | Cracked Wooden Shield | shield | Equip: shield/offHand; armorValue +1 | guard, bandit, merchant; bandit only if defeated/disarmed |
| 19 | `old_amulet` | Старый амулет | Old Amulet | accessory | Equip: amulet; no magic effect yet, quest/memory use later | quest_npc, prisoner, traveler |
| 20 | `mana_potion_small` | Малое зелье маны | Small Mana Potion | consumable | Use: restoreMana +5 if mana exists; otherwise shows no magic knowledge text | mage, alchemist, merchant |

## Reward Allowlists

- Anariel intro: empty. She is chained and cannot give food, clothes, weapons, potions, or gold.
- Guard: `stale_bread`, `bandage`, `torch`, `small_coin_pouch`, `simple_clothes`, `sealed_letter`; contextual `wooden_club`, `cracked_wooden_shield`, `rusty_key`.
- Bandit: `stale_bread`, `small_coin_pouch`, `lockpick`, `leather_scrap`, `wooden_club`, `old_dagger`, `rusty_axe`; `rusty_sword` and `cracked_wooden_shield` only if defeated/disarmed/intimidated.
- Merchant: `stale_bread`, `healing_herb`, `bandage`, `small_health_potion`, `small_coin_pouch`, `lockpick`, `torch`, `leather_scrap`, `simple_clothes`, `old_cloak`, `rusty_axe`, `old_dagger`, `cracked_wooden_shield`; `mana_potion_small` only for mage/alchemist merchant.
- Civilian: `stale_bread`, `small_coin_pouch`, `simple_clothes`, `old_cloak`, `torn_note`, `sealed_letter`, `wooden_club`.
- Healer/herbalist: `healing_herb`, `bandage`, `small_health_potion`.
- Monster: empty.
- Mage/alchemist: `mana_potion_small`, `healing_herb`, `small_health_potion`, `sealed_letter`; `old_amulet` only in quest context.
