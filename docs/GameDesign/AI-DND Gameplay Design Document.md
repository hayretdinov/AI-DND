# AI-DND Gameplay Design Document

AI-DND

           02_GAMEPLAY.md

           Gameplay Design Document

           Version 0.1

           1. CORE   GAMEPLAY      PHILOSOPHY

           The game is NOT:

              • an action RPG;
              • an MMORPG;
              • a hack-and-slash game;
              • a visual novel.

           The game is:

           A Living Narrative RPG

           The player interacts with:

              • the world;
              • AI characters;
              • events;
              • consequences.
           The player's choices define the story.

           2. GAMEPLAY     LOOP

           Main gameplay cycle:

           Travel ↓ Encounter ↓ Dialogue / Combat / Exploration ↓ Consequence ↓ Reward / Loss ↓ Character
           Growth ↓ Travel

                                          1

<!-- Page 2 -->

3. PLAYER   VIEW

           The game has two primary views:

           Global World Map

           Used for:

              • traveling;
              • exploration;
              • discovering locations;
              • random encounters.

           Event Scene

           Used for:

              • dialogue;
              • combat;
              • interaction;
              • story events.

           The player does not freely walk inside scenes.

           The player experiences events directly.

           4. GLOBAL    MAP

           The player controls:

              • destination;
              • route;
              • pace.

           The character automatically travels.

           Examples:

           Travel to:

              • village;
              • mine;

                                          2

<!-- Page 3 -->

• ruins;
              • castle;
              • forest;
              • dungeon.

           5. TRAVEL   SPEED

           Travel speed depends on:

              • equipment weight;
              • weather;
              • injuries;
              • terrain;
              • mounts;
              • fatigue.

           6. RANDOM      EVENTS

           During travel, random checks occur.

           Possible events:

              • bandits;
              • monsters;
              • merchants;
              • travelers;
              • accidents;
              • ruins;
              • weather events;
              • faction patrols;
              • supernatural encounters.

           7. EVENT   SCENES

           When an event occurs:

           Global Map ↓ Scene Generation ↓ Player Interaction ↓ Result ↓ Return to Map

                                          3

<!-- Page 4 -->

Examples:

              • wolf attack;
              • robbery;
              • dialogue;
              • investigation;
              • treasure discovery.

           8. PLAYER   INPUT    SYSTEM

           The player never selects predefined dialogue options.

           The player always types intentions.

           Example:

           "I slowly draw my sword."

           "I try to negotiate."

           "I hide behind the cart."

           "I attack his left arm."

           "I attempt to escape."

           9. PLAYER   INTENT    SYSTEM

           The system processes:

           Player Text ↓ Intent Parser ↓ Action Classification ↓ Rule Validation ↓ Game Logic ↓ Dice Roll ↓ AI
           Narration

           10. IMPOSSIBLE      ACTIONS

           Players can attempt anything.

           Examples:

           "I fly."

                                          4

<!-- Page 5 -->

"I cast fireball."

           "I strike his eye."

           The system checks:

              • equipment;
              • skills;
              • training;

              • physical possibility.
           The player is never shown:

           ERROR: ACTION NOT AVAILABLE.

           Instead, AI explains failure naturally.

           11. CHARACTER      PROGRESSION

           The player does not gain abilities automatically.

           Abilities are unlocked through:

              • teachers;
              • practice;

              • experience;
              • discoveries.

           12. EXPERIENCE      SYSTEM

           The player gains:

           Learning Points (LP)

           Sources:

              • quests;
              • discoveries;
              • combat;
              • survival;
              • training.

                                          5

<!-- Page 6 -->

LP are spent with teachers.

           13. TEACHERS

           Teachers unlock abilities.

           Examples:

           Sword Master:

              • sword techniques.

           Hunter:

              • bows.
           Mage:

              • magic.
           Blacksmith:

              • crafting.
           Thief:

              • stealth.

           14. SKILL  LEVELS

           Skill progression:

           Untrained ↓ Novice ↓ Student ↓ Experienced ↓ Master ↓ Legend

           Players see words, not numbers.

           15. COMBAT     ACCESS

           Examples:

           Sword Skill:

                                          6

<!-- Page 7 -->

Untrained:

              • cannot fight effectively.

           Novice:

              • torso attacks.

           Student:

              • arm attacks.

           Experienced:

              • leg attacks.

           Master:

              • head attacks.
           Legend:

              • advanced techniques.

           16. REPUTATION

           Every action affects reputation.

           Examples:

              • murder;
              • theft;

              • helping;
              • lying;
              • trading;
              • training.
           Reputation is:

              • local;
              • faction-based;
              • personal.

                                          7

<!-- Page 8 -->

17. NPC   MEMORY

           NPCs remember:

              • conversations;
              • promises;
              • crimes;
              • gifts;
              • fights;
              • favors;
              • insults.

           NPC memory can persist for years.

           18. INFORMATION        SYSTEM

           Players discover information through:

              • rumors;
              • books;
              • observation;
              • conversations;
              • exploration.
           No quest markers.

           No teacher icons.

           No glowing objectives.

           19. QUEST    SYSTEM

           Quests are not traditional.

           Instead:

           NPC Goal ↓ NPC Problem ↓ Player Interaction ↓ Dynamic Quest

           Examples:

           "Find my son."

                                          8

<!-- Page 9 -->

"Deliver supplies."

           "Kill the beast."

           "Spy on someone."

           20. FAILURE    SYSTEM

           Failure is not game over.

           Failure creates consequences.

           Examples:

           Failed persuasion:

              • combat.

           Failed theft:

              • prison.

           Failed combat:

              • injury.

           Failed quest:

              • reputation loss.

           21. INJURY   SYSTEM

           Body parts can be injured.

           Examples:

           Head:

              • confusion.

           Arm:

              • weaker attacks.

                                          9

<!-- Page 10 -->

Leg:

              • slower movement.

           Torso:

              • bleeding.

           22. DEATH    SYSTEM

           Death is permanent for NPCs.

           Player death consequences depend on:

              • location;
              • enemy;
              • circumstances.

           Possible outcomes:

              • rescue;
              • robbery;
              • imprisonment;
              • injury;
              • death.

           23. SAVE   SYSTEM

           There is no manual save philosophy.

           The game automatically saves after:

              • dialogue;
              • combat;
              • travel;
              • training;
              • quests;
              • trading.

                                         10

<!-- Page 11 -->

24. PLAYER    FREEDOM

           The player may attempt:

              • persuasion;
              • intimidation;
              • lying;
              • theft;
              • murder;
              • escape;
              • diplomacy;
              • investigation;
              • sabotage;
              • bribery.

           The game never asks:

           "What option do you choose?"

           Instead it asks:

           "What do you do?"

           25. CORE   DESIGN    RULE

           Player imagination should always be larger than the interface.

           The interface exists to support imagination, not to limit it.

                                         11
