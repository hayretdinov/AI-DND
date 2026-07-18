# Attribute Influence

## Authoritative Runtime Values

`resolveEffectivePlayerStats` in `client/src/systems/player/effectivePlayerStats.ts` is the single runtime resolver. Persisted `player.attributes` already contains base allocation and the racial modifier exactly once. The resolver adds equipped `attributeBonuses`, active magic effects, and injury penalties without mutating the saved creation values.

Old saves continue to normalize `baseAttributes`, `allocatedAttributes`, `racialModifiers`, and `attributes` in `saveSystem`. Effective values are derived after loading and are not stored as a second stat set.

## Effects

- Strength: melee and unarmed attack/damage, shove/grapple formulas, stamina, and carry capacity.
- Dexterity: initiative, armor class/evasion contribution, light weapon attacks, and ranged accuracy/damage.
- Constitution: maximum HP and maximum stamina. Existing HP and stamina retain their percentage when a maximum changes.
- Intelligence: known-spell success, control, damage, and healing modifiers. It never teaches unknown words or bypasses `knownWordIds`.
- Wisdom: insight checks.
- Charisma: persuasion, deception, verbal intimidation, negotiations, gate reactions, and merchant prices/concessions.

The inventory character panel also displays these resolved values, so UI and gameplay use the same source.

## Social Checks

`socialCheckSystem.ts` resolves persuasion, deception, intimidation, insight, and knowledge before an NPC response. Difficulty includes relationship, trust, fear where relevant, hostility, and scene modifiers. Physical intimidation may use Strength; ordinary social pressure uses Charisma. Dead targets and non-sapient monsters reject human social checks.

Only the structured outcome is stored in NPC memory and passed to the prompt. Rolls, modifiers, and difficulty remain internal and are not rendered to the player.

## Verification

Compile-time fixtures cover effective equipment/effect/injury modifiers, Constitution HP differences, fixed-roll Charisma comparisons, NPC attitude factors, physical intimidation, blocked targets, and race bonus non-duplication. `npm.cmd run build` runs `tsc --noEmit` over these fixtures.
