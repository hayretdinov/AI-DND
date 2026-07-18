# Player Intent System

Update date: 2026-07-14

The player writes free text. The intent system recognizes the gameplay meaning and passes structured actions to the Game Engine. AI does not decide whether the action succeeds.

Implemented combat intents:

- `attack`
- `attack_with_equipped_weapon`
- `unarmed_attack`
- `kick`
- `shove`
- `grapple`
- `throw_object`
- `improvised_attack`
- `defend`
- `dodge`
- `retreat`
- `flee`

Important behavior:

- Generic attack is `auto`: weapon if equipped, otherwise unarmed.
- Specific weapon phrases stay specific and can be blocked if the weapon is missing.
- Unarmed phrases such as "бью кулаком", "ударяю", "punch" resolve as unarmed actions.
- Stone/object phrases such as "бросаю камень" resolve as thrown object actions and require a valid environment object.
- Retreat and flee remain text actions resolved by local game logic.

Debug log:

- `[Intent] parsed`

