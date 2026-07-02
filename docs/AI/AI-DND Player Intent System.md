# AI-DND Player Intent System

AI-DND

           PLAYER_INTENT_SYSTEM.md

           Player Intent Recognition System

           Version 0.1

           1. DESIGN    PHILOSOPHY

           The player may attempt anything.

           The player is never restricted by:

              • buttons;
              • dialogue trees;
              • predefined actions.

           The game interprets intentions.

           The world determines outcomes.

           2. CORE   RULE

           The player describes:

           "What I want to do."

           The game determines:

           "What actually happens."

           3. INPUT   PIPELINE

           Player Text ↓ Language Analysis ↓ Intent Detection ↓ Context Analysis ↓ Rule Validation ↓ Action
           Construction ↓ Dice Resolution ↓ World Consequences ↓ AI Narration

                                          1

<!-- Page 2 -->

4. PLAYER   INPUT

           Examples:

           "I attack him."

           "I attack his left arm."

           "I draw my sword."

           "I pretend to surrender."

           "I search the room."

           "I threaten him."

           "I run."

           "I hide."

           "I pray."

           5. PRIMARY     INTENT   TYPES

           Major categories:

              • Combat
              • Dialogue
              • Social
              • Exploration
              • Survival
              • Magic
              • Criminal
              • Crafting
              • Travel

           6. COMBAT     INTENTS

           Examples:

              • attack

                                          2

<!-- Page 3 -->

• defend
              • block
              • dodge
              • retreat
              • surrender
              • disarm
              • grapple
              • feint

           7. SOCIAL   INTENTS

           Examples:

              • persuade
              • intimidate
              • deceive
              • negotiate
              • flirt
              • threaten
              • apologize

           8. EXPLORATION       INTENTS

           Examples:

              • search
              • observe
              • investigate
              • track
              • examine
              • listen

           9. SURVIVAL    INTENTS

           Examples:

              • rest
              • eat
              • hunt
              • cook
              • camp

                                          3

<!-- Page 4 -->

• heal

           10. MAGIC    INTENTS

           Examples:

              • cast
              • channel

              • identify
              • dispel
              • enchant

           11. CRIMINAL     INTENTS

           Examples:

              • steal
              • lockpick
              • hide
              • sabotage
              • smuggle

           12. COMPOUND        ACTIONS

           Players may perform multiple actions.

           Example:

           "I throw sand in his face and run."

           Parsed:

           Action 1: Throw sand.

           Action 2: Escape.

                                          4

<!-- Page 5 -->

13. IMPLICIT    INTENTS

           Example:

           Player:

           "I slowly put my hand near my sword."

           Detected:

              • preparation;
              • intimidation;
              • possible attack.

           14. EMOTIONAL       INTENTS

           Example:

           "I beg him not to kill me."

           Detected:

              • fear;
              • persuasion;
              • surrender.

           15. BODY    TARGETING

           Example:

           "I attack his right leg."

           Detected:

           Action: Attack.

           Target: Right leg.

           Validation required.

                                          5

<!-- Page 6 -->

16. EQUIPMENT       VALIDATION

           Example:

           "I attack with my sword."

           Check:

           Does player possess sword?

           If not:

           Action fails naturally.

           17. SKILL  VALIDATION

           Example:

           "I perform a feint."

           Check:

           Has player learned feints?

           If not:

           Attempt degrades naturally.

           18. PHYSICAL     VALIDATION

           Example:

           "I jump five meters."

           Check:

           Is it physically possible?

           If not:

           Attempt partially fails.

                                          6

<!-- Page 7 -->

19. KNOWLEDGE       VALIDATION

           Example:

           "I cast fireball."

           Check:

           Does player know fire magic?

           If not:

           No spell occurs.

           20. CONTEXT     ANALYSIS

           Example:

           Input:

           "I attack."

           Questions:

              • with what?
              • whom?
              • from where?
              • under what conditions?

           21. ENVIRONMENT        ANALYSIS

           Example:

           Player:

           "I hide."

           Check:

              • darkness?

                                          7

<!-- Page 8 -->

• objects?
              • weather?
              • visibility?

           22. SOCIAL    ANALYSIS

           Example:

           "I threaten him."

           Check:

              • reputation;
              • strength;
              • fear;
              • personality.

           23. RISK  ANALYSIS

           The system estimates:

              • danger;
              • probability;
              • consequences.

           24. HIDDEN     PLAYER   KNOWLEDGE

           Example:

           Player:

           "I search for magical traps."

           Check:

           Does player know magic?

                                          8

<!-- Page 9 -->

25. IMPOSSIBLE      ACTIONS

           The system never says:

           "Action unavailable."

           Instead:

           The world explains failure.

           26. EXAMPLE

           Player:

           "I strike his eyes."

           Validation:

              • no training;
              • impossible precision.

           Result:

           Attack redirects naturally.

           27. DICE  GENERATION

           The system determines:

              • required checks;
              • modifiers;
              • difficulty.

           The engine rolls dice.

           28. ACTION    DECOMPOSITION

           Example:

           "I grab the chair, throw it at him and run."

                                          9

<!-- Page 10 -->

Action 1: Grab.

           Action 2: Throw.

           Action 3: Escape.

           29. LONG    ACTIONS

           Examples:

              • surgery;
              • crafting;
              • rituals;
              • investigations.

           These become multi-stage processes.

           30. NPC   INTERPRETATION

           NPCs react to:

              • action;
              • intention;
              • emotion;
              • reputation.

           31. MISUNDERSTANDING

           NPCs may misunderstand.

           Example:

           Player attempts joke.

           NPC perceives insult.

                                         10

<!-- Page 11 -->

32. PLAYER    MISTAKES

           Players may fail due to:

              • fear;
              • injuries;
              • intoxication;
              • fatigue.

           33. THOUGHT      SYSTEM    INTEGRATION

           Character thoughts suggest:

              • possible actions;
              • risks;
              • opportunities.

           Thoughts never limit actions.

           34. AI-DM   INTEGRATION

           AI-DM receives:

              • parsed intent;
              • validation results;
              • dice outcomes.

           35. AI NPC   INTEGRATION

           NPC receives:

              • player action;
              • emotional tone;
              • consequences.

                                         11

<!-- Page 12 -->

36. LEARNING      SYSTEM

           The parser learns:

              • player habits;
              • preferred styles;
              • favorite strategies.

           37. ACCESSIBILITY

           Optional assistance:

              • action suggestions;
              • thought hints;
              • examples.

           38. IMMERSION

           The player never sees:

              • parser;
              • probabilities;
              • internal rules.

           39. CORE   QUESTION

           The parser asks:

           "What is the player trying to achieve?"

           Not:

           "What command did the player enter?"

           40. CORE   RULE

           The player may attempt anything.

                                         12

<!-- Page 13 -->

The world decides what happens next.

                                         13
