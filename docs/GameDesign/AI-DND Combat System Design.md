# AI-DND Combat System Design

AI-DND

           03_COMBAT.md

           Combat System Design Document

           Version 0.1

           1. COMBAT     PHILOSOPHY

           Combat is:

              • dangerous;
              • realistic;
              • tactical;
              • unpredictable;
              • story-driven.

           Combat is NOT:

              • arcade;
              • action-oriented;
              • fast-paced.

           Every fight should matter.

           2. COMBAT     FLOW

           Combat sequence:

           Encounter ↓ Dialogue ↓ Escalation ↓ Initiative ↓ Combat Round ↓ Consequences ↓ End of Combat

           3. COMBAT     VIEW

           The player does not control movement.

           Combat is presented as:

                                          1

<!-- Page 2 -->

Cinematic First-Person Encounter

           The player sees:

              • enemy;
              • environment;

              • injuries;
              • equipment;
              • emotions.
           The player does not see themselves.

           4. PLAYER   INPUT

           The player writes actions.

           Examples:

           "I attack."

           "I attack his torso."

           "I try to hit his right arm."

           "I kick his knee."

           "I attempt to disarm him."

           "I retreat."

           "I surrender."

           5. ACTION    PARSING

           Player Input ↓ Intent Parser ↓ Action Type ↓ Rule Validation ↓ Dice Roll ↓ Result ↓ AI Narration

           6. DICE  SYSTEM

           All combat uses D20.

                                          2

<!-- Page 3 -->

Formula:

           D20

           + Skill

           + Attribute

           + Weapon Bonus

           + Situation Modifiers

           versus

           Defense Value

           7. INITIATIVE

           Initiative formula:

           D20

           + Reflex

           + Agility

           + Experience

           Higher result acts first.

           8. BODY   TARGETING

           Body zones:

              • Head
              • Torso
              • Left Arm
              • Right Arm
              • Left Leg
              • Right Leg

                                          3

<!-- Page 4 -->

9. BODY   TARGET    ACCESS

           Untrained:

              • random target

           Novice:

              • torso only

           Student:

              • torso
              • arms

           Experienced:

              • torso
              • arms
              • legs

           Master:

              • all body parts

           Legend:

              • advanced targeting

           10. DAMAGE     TYPES

           Physical:

              • slashing
              • piercing
              • crushing

           Elemental:

              • fire
              • frost
              • lightning
              • acid

                                          4

<!-- Page 5 -->

Magical:

              • holy
              • shadow
              • spirit
              • arcane

           11. WEAPON      FAMILIES

           Weapons:

              • one-handed swords
              • two-handed swords
              • axes
              • maces
              • hammers
              • daggers
              • spears
              • bows
              • crossbows
              • staves

           Each weapon family is trained separately.

           12. WEAPON      MASTERY

           Levels:

           Untrained ↓ Novice ↓ Student ↓ Experienced ↓ Master ↓ Legend

           13. LEARNING      SYSTEM

           Combat skills are learned only through teachers.

           Examples:

           Sword Master:

              • sword skills

                                          5

<!-- Page 6 -->

Hunter:

              • bows

           Mercenary:

              • axes

           Assassin:

              • daggers

           Knight:

              • heavy weapons

           14. CRITICAL    HITS

           Critical success:

           Natural 20.

           Possible effects:

              • instant kill
              • fracture
              • disarm
              • bleeding
              • stun

           15. CRITICAL    FAILURE

           Natural 1.

           Possible effects:

              • miss
              • stumble
              • weapon drop
              • self injury
              • fall

                                          6

<!-- Page 7 -->

16. ARM   INJURIES

           Effects:

              • lower accuracy
              • slower attacks
              • weapon drop
              • inability to attack

           17. LEG  INJURIES

           Effects:

              • limping
              • slower travel
              • falling
              • inability to escape

           18. HEAD   INJURIES

           Effects:

              • confusion

              • dizziness
              • fear
              • unconsciousness

           19. TORSO    INJURIES

           Effects:

              • bleeding
              • reduced stamina
              • pain
              • death

                                          7

<!-- Page 8 -->

20. BLEEDING

           Levels:

           Light Medium Heavy Fatal

           Effects:

              • HP loss
              • weakness
              • unconsciousness

              • death

           21. FRACTURES

           Possible fractures:

              • arm
              • leg
              • ribs
              • skull

           Healing:

              • days
              • weeks
              • months

           22. PAIN   SYSTEM

           Pain levels:

           None ↓ Mild ↓ Moderate ↓ Severe ↓ Agony

           Effects:

              • accuracy penalty
              • panic
              • unconsciousness

                                          8

<!-- Page 9 -->

23. FEAR   SYSTEM

           Fear sources:

              • monsters
              • dragons
              • magic
              • injury
              • death

           Effects:

              • hesitation
              • surrender
              • fleeing
              • panic

           24. MORALE

           NPCs have morale.

           Low morale causes:

              • retreat
              • surrender
              • negotiation
              • panic

           25. STAMINA

           Actions consume stamina.

           Examples:

           Attack: 10

           Heavy attack: 20

           Dodge: 15

           Block: 10

                                          9

<!-- Page 10 -->

Run: 5

           26. DEFENSE

           Defense methods:

              • armor
              • shield

              • dodge
              • parry
              • cover

           27. ARMOR

           Armor protects body parts independently.

           Example:

           Helmet:

              • protects head
           Chestplate:

              • protects torso

           Greaves:

              • protect legs

           28. SHIELDS

           Shields:

              • block attacks
              • absorb damage
              • break

                                         10

<!-- Page 11 -->

29. DUAL   WIELDING

           Requirements:

              • training
              • dexterity
              • experience

           30. RANGED     COMBAT

           Factors:

              • distance
              • weather
              • movement
              • visibility
              • injuries

           31. MAGIC    COMBAT

           Magic uses:

           D20

           + Magic Skill

           + Willpower

           + Spell Modifier

           32. UNARMED      COMBAT

           Possible actions:

              • punch
              • kick
              • grapple
              • choke
              • throw

                                         11

<!-- Page 12 -->

33. GRAPPLING

           Possible actions:

              • restrain
              • disarm
              • choke
              • throw
              • pin

           34. SURRENDER

           Combat may end with surrender.

           Results:

              • robbery
              • capture
              • slavery
              • imprisonment
              • release

           35. ESCAPE

           Escape depends on:

              • injuries
              • terrain
              • speed
              • fear

           36. DEATH

           Death is not always immediate.

           Possible states:

           Healthy ↓ Wounded ↓ Critical ↓ Unconscious ↓ Dead

                                         12

<!-- Page 13 -->

37. PLAYER    DEFEAT

           Possible outcomes:

              • robbery
              • captivity
              • slavery
              • rescue
              • permanent injury
              • death

           38. NPC   DEATH

           NPC death is permanent.

           Consequences affect:

              • economy
              • quests
              • factions
              • training
              • politics

           39. AI NARRATION

           The AI never determines results.

           The AI only describes them.

           Example:

           System:

           Hit. Right leg. 14 damage. Fracture.

           AI:

           "Your strike lands with a sickening crack. The bandit's leg buckles beneath him, and he collapses into the
           mud."

                                         13

<!-- Page 14 -->

40. CORE   RULE

           Combat must create stories, not statistics.

                                         14
