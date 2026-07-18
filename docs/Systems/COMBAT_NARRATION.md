# Combat Narration

## 2026-07-17 Turn Flow

- Combat narration now follows the resolved turn cycle: player action narration first, then automatic enemy action narration when the enemy is alive and able to act.
- The Game Master receives already-resolved mechanical results. It must not add damage, invent extra attacks, kill a living target, or revive a defeated target.
- Player-facing combat chat still hides d20 rolls, armor class, bonuses, formulas, numeric damage, and numeric HP.
- Technical values remain available in resolver results and combat log `debugData`.
- Invalid or unrecognized combat input is narrated as an invalid action and does not advance the turn or trigger an enemy action.
- Pure magic formulas such as `Игнис Ланца Хостис` are narrated only after the local magic resolver validates known words, spends mana, and applies hit/miss and HP changes.
- Text melee narration receives resolved category-aware results from `resolveTextCombatAction`. It must narrate sword, spear, shield, hammer, unarmed, shove, and grapple outcomes from resolver hints without adding extra damage or extra enemy turns.

Combat resolution still keeps numeric data internally: rolls, totals, difficulty, damage, stamina, ammunition and injuries remain available on resolver results and combat log `debugData`.

Player-facing combat text must not show technical numbers such as:

- d20 rolls
- armor class / difficulty class
- damage numbers
- attack totals
- formulas or dice notation
- numeric bonuses

Visible melee, ranged and magic narration is formatted through:

- `client/src/systems/combat/text/combatNarrationContext.ts`
- `client/src/systems/combat/ranged/rangedNarrationContext.ts`
- `client/src/systems/magic/magicMessages.ts`

When adding new combat output, keep exact resolver details in debug/internal objects and expose only narrative outcome text to the dialogue and combat log UI.

Non-sapient enemies, including the swamp skeleton, never generate human dialogue. Their actions and results are described by the existing Game Master narration path.
