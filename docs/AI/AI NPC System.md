# AI NPC System

AI-DND

           AI_NPC_SYSTEM.md

           Artificial Intelligence NPC System

           Version 0.1

           1. DESIGN    PHILOSOPHY

           NPCs are not:

              • dialogue trees;
              • chatbots;
              • quest dispensers.

           NPCs are simulated people.

           Every NPC:

              • thinks;
              • remembers;
              • learns;
              • fears;
              • lies;
              • changes;
              • survives.

           2. NPC  EXISTENCE

           NPCs exist independently of the player.

           NPCs continue living:

              • before meeting the player;
              • while interacting with the player;
              • after leaving the player.

           The player is not the center of their lives.

                                          1

<!-- Page 2 -->

3. NPC  STRUCTURE

           Every NPC consists of:

              • identity;
              • personality;
              • memory;
              • knowledge;
              • emotions;
              • goals;
              • relationships;
              • beliefs;
              • fears;
              • skills;
              • needs.

           4. IDENTITY

           Every NPC possesses:

              • name;
              • age;
              • gender;
              • race;
              • profession;
              • faction;
              • social status;
              • birthplace.

           5. PERSONALITY

           NPC personality uses traits.

           Examples:

              • brave;
              • cowardly;
              • greedy;
              • generous;
              • curious;
              • aggressive;
              • loyal;

                                          2

<!-- Page 3 -->

• selfish;
              • ambitious;
              • compassionate.

           Personality changes over time.

           6. NEEDS

           NPC needs include:

              • food;
              • sleep;
              • safety;
              • money;
              • social interaction;
              • purpose;
              • power;

              • belonging.
           Needs influence decisions.

           7. GOALS

           NPCs possess goals.

           Examples:

              • survive;
              • become rich;
              • protect family;
              • gain power;
              • seek revenge;
              • acquire knowledge;
              • escape danger.

           Goals change dynamically.

           8. FEARS

           Examples:

              • death;

                                          3

<!-- Page 4 -->

• pain;
              • monsters;
              • magic;
              • darkness;
              • poverty;
              • shame.

           Fear influences decisions.

           9. BELIEFS

           Examples:

              • religion;
              • morality;
              • politics;
              • traditions.

           NPCs act according to beliefs.

           10. EMOTIONS

           Basic emotions:

              • happiness;
              • sadness;
              • anger;
              • fear;
              • disgust;
              • surprise;
              • trust.

           Emotions affect behavior.

           11. MEMORY

           NPCs remember:

              • events;
              • conversations;
              • promises;
              • crimes;

                                          4

<!-- Page 5 -->

• kindness;
              • betrayal.

           Memory changes personality.

           12. KNOWLEDGE

           NPCs only know:

              • what they experienced;
              • what they learned;
              • what they were told.

           Knowledge may be false.

           13. DECISION     MAKING

           Decision flow:

           Situation ↓ Knowledge ↓ Memory ↓ Emotion ↓ Goals ↓ Personality ↓ Decision

           14. LYING

           NPCs may lie.

           Reasons:

              • fear;
              • greed;

              • manipulation;
              • survival;
              • loyalty.
           NPCs know they are lying.

                                          5

<!-- Page 6 -->

15. DECEPTION

           NPCs may:

              • hide information;
              • exaggerate;
              • manipulate;
              • pretend.

           16. MORALITY

           There is no universal morality.

           Examples:

           Bandit: murder acceptable.

           Priest: murder unacceptable.

           Soldier: depends on orders.

           17. TRUST

           Trust depends on:

              • history;
              • reputation;
              • personality;
              • rumors.

           18. HATRED

           Hatred may persist:

              • months;
              • years;
              • generations.

                                          6

<!-- Page 7 -->

19. LOVE

           NPCs may:

              • love;
              • marry;
              • grieve;
              • become obsessed.

           20. SOCIAL    NETWORKS

           Every NPC has:

              • family;
              • friends;
              • enemies;
              • acquaintances;
              • rivals.

           21. FAMILY

           Family members influence:

              • decisions;
              • emotions;
              • goals.

           22. FRIENDSHIP

           Friendship creates:

              • loyalty;
              • help;
              • sacrifice.

                                          7

<!-- Page 8 -->

23. ENEMIES

           Enemies create:

              • revenge;
              • fear;
              • hatred.

           24. PROFESSION

           Profession affects:

              • schedule;
              • knowledge;
              • skills;
              • relationships.

           25. DAILY   LIFE

           NPCs:

              • sleep;
              • eat;

              • work;
              • rest;
              • socialize.

           26. LEARNING

           NPCs learn.

           Examples:

              • player is dangerous;
              • road is unsafe;
              • village is starving.

                                          8

<!-- Page 9 -->

27. TRAUMA

           Trauma changes personality.

           Examples:

           After war:

              • fear;
              • aggression;
              • depression.

           28. MADNESS

           Possible effects:

              • paranoia;
              • hallucinations;
              • obsession;
              • violence.

           29. HONOR

           Some NPCs possess honor.

           Effects:

              • keep promises;
              • refuse betrayal;
              • prefer fair combat.

           30. GREED

           Greed influences:

              • trade;
              • loyalty;
              • crime.

                                          9

<!-- Page 10 -->

31. CURIOSITY

           Curious NPCs:

              • investigate;
              • explore;
              • ask questions.

           32. COURAGE

           Brave NPCs:

              • resist fear;
              • protect others;
              • fight stronger enemies.

           33. COMBAT     AI

           NPCs consider:

              • injuries;
              • fear;
              • allies;

              • terrain;
              • objectives.
           NPCs do not fight to the death by default.

           34. SURRENDER

           NPCs may:

              • surrender;
              • negotiate;
              • flee.

                                         10

<!-- Page 11 -->

35. REVENGE

           NPCs may pursue revenge.

           Targets:

              • player;
              • NPCs;
              • factions.

           36. AMBITION

           Ambitious NPCs seek:

              • power;
              • wealth;
              • status.

           37. SECRETS

           NPCs possess secrets.

           Examples:

              • crimes;
              • affairs;
              • conspiracies;
              • hidden treasures.

           38. RUMORS

           NPCs spread:

              • truth;

              • lies;
              • speculation.

                                         11

<!-- Page 12 -->

39. AI RESPONSE      PIPELINE

           Before speaking, AI evaluates:

              1. Who is speaking?
              2. What do I know?
              3. What do I remember?
              4. What do I want?
              5. What do I fear?
              6. What do I believe?
              7. Am I telling the truth?
              8. What are the consequences?

           40. PLAYER    INTERACTION

           NPCs react to:

              • appearance;
              • reputation;
              • race;
              • injuries;
              • behavior;
              • history.

           41. NPC   TO  NPC   INTERACTION

           NPCs interact without the player.

           Examples:

              • friendships;
              • conflicts;
              • marriages;
              • alliances;
              • crimes.

                                         12

<!-- Page 13 -->

42. DEATH

           NPC death changes:

              • relationships;
              • economy;
              • politics;
              • history.

           43. AI LIMITATIONS

           NPCs cannot:

              • know hidden information;
              • break game rules;
              • alter dice rolls;
              • invent world facts.

           44. AI FREEDOM

           NPCs can:

              • surprise the player;

              • refuse requests;
              • betray;
              • help;
              • change opinions.

           45. CORE   RULE

           NPCs must behave like people.

           Not like game mechanics.

                                         13
