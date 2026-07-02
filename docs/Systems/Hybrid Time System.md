# Hybrid Time System

AI-DND

           HYBRID_TIME_SYSTEM.md

           Hybrid World Time Simulation

           Version 0.1

           1. DESIGN    PHILOSOPHY

           Time never stops.

           However, time does not always flow at the same speed.

           The world exists in three simulation states:

              • Active Time
              • Background Time
              • Stone Sleep Time

           2. ACTIVE   TIME

           Active Time occurs while the player is online.

           Simulation quality:

           MAXIMUM.

           The world simulates:

              • NPC behavior;
              • combat;
              • dialogue;
              • economy;
              • weather;
              • rumors;
              • diseases;
              • local events.

                                          1

<!-- Page 2 -->

3. BACKGROUND        TIME

           Background Time occurs when the player is online but far away.

           Simulation quality:

           MEDIUM.

           The world simulates:

              • economics;
              • travel;
              • wars;
              • diseases;
              • migration;
              • politics.

           Details are abstracted.

           4. STONE   SLEEP   TIME

           Stone Sleep Time occurs when the player is offline.

           Simulation quality:

           ADAPTIVE.

           The world continues to evolve.

           5. TIME  COMPRESSION

           Real time and game time differ.

           Examples:

           1 real minute: 1 game minute.

           1 real hour: 2 game hours.

           1 real day: 1-3 game days.

                                          2

<!-- Page 3 -->

1 real week: 3-10 game days.

           1 real month: 2-6 game weeks.

           6. LOCAL   TIME

           Areas near the player simulate:

              • full AI;
              • full schedules;
              • full interactions.

           7. DISTANT    TIME

           Areas far away simulate:

              • statistics;
              • probabilities;
              • summaries.

           8. NPC  SIMULATION

           Nearby NPC:

           full simulation.

           Far NPC:

           abstract simulation.

           Example:

           Instead of:

           "NPC walked 1427 steps."

           Store:

           "NPC traveled from village to city."

                                          3

<!-- Page 4 -->

9. WAR   SIMULATION

           Wars simulate using:

              • armies;
              • resources;
              • morale;
              • logistics.

           Individual soldiers are not simulated.

           10. ECONOMIC      SIMULATION

           Economy updates:

              • prices;

              • shortages;
              • trade routes;
              • production.

           11. DISEASE    SIMULATION

           Diseases continue spreading.

           Factors:

              • population;
              • climate;
              • trade;

              • medicine.

           12. MONSTER      SIMULATION

           Monsters:

              • migrate;
              • reproduce;
              • hunt;
              • die.

                                          4

<!-- Page 5 -->

13. PLAYER    ABSENCE

           During Stone Sleep:

              • the player cannot act;
              • the world continues.

           14. PLAYER    RETURN

           Upon awakening:

           the simulation produces:

              • world changes;
              • rumors;
              • personal consequences.

           15. EVENT   IMPORTANCE

           Events have priority.

           LOW  PRIORITY

           Examples:

              • weather;
              • trade.

           Simulated statistically.

           MEDIUM  PRIORITY

           Examples:

              • crime;
              • disease;
              • politics.

           Simulated with detail.

                                          5

<!-- Page 6 -->

HIGH PRIORITY

           Examples:

              • wars;
              • deaths;
              • major quests.
           Simulated fully.

           16. NPC   DEATH

           NPCs may die while the player sleeps.

           Examples:

              • age;
              • disease;
              • combat;
              • accidents.

           17. PLAYER    CONNECTIONS

           Important NPCs receive:

           high simulation priority.

           Examples:

              • friends;
              • teachers;
              • enemies;
              • companions.

           18. MEMORY      PRESERVATION

           Important memories are never removed.

                                          6

<!-- Page 7 -->

Examples:

              • betrayal;
              • love;
              • war;
              • trauma.

           19. QUEST    SIMULATION

           Quests progress naturally.

           Example:

           Rescue quest.

           Player absent:

           Victim may die.

           20. FAMILY    SIMULATION

           Families continue living.

           Examples:

              • marriage;
              • children;
              • death;
              • migration.

           21. CITY  SIMULATION

           Cities continue:

              • building;
              • trading;
              • fighting;
              • recovering.

                                          7

<!-- Page 8 -->

22. WORLD     EVENTS

           Events continue:

              • invasions;
              • epidemics;
              • rebellions;
              • disasters.

           23. HISTORY    CREATION

           Historical records continue.

           Examples:

           "The famine of year 842."

           "The plague of Ashford."

           "The disappearance of King Edric."

           24. PLAYER    LEGEND

           The player's legend changes while absent.

           Rumors continue spreading.

           25. PERFORMANCE        SYSTEM

           Simulation complexity adjusts dynamically.

           Near player: 100%.

           Far away: 10%.

           Offline: adaptive.

                                          8

<!-- Page 9 -->

26. WORLD     CONSISTENCY

           The world must remain believable.

           Example:

           A city cannot disappear overnight without cause.

           27. AI-DM   RESPONSIBILITY

           AI-DM determines:

              • event significance;
              • simulation priority;
              • consequence generation.

           28. STONE    SLEEP  LIMITS

           Stone Sleep cannot:

              • destroy the game world;
              • create impossible events;
              • invalidate player progress.

           29. CORE   QUESTION

           When simulating the world, always ask:

           "What would logically happen?"

           Never ask:

           "What would be convenient?"

           30. CORE   RULE

           The player pauses.

                                          9

<!-- Page 10 -->

The world never does.

                                         10
