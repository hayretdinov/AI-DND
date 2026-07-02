# AI-DND World Simulation System

AI-DND

           WORLD_SIMULATION_SYSTEM.md

           Living World Simulation System

           Version 0.1

           1. DESIGN    PHILOSOPHY

           The world exists independently from the player.

           The player does not activate the world.

           The player enters an already living world.

           The world continues to change:

              • with the player;
              • without the player;
              • despite the player.

           2. WORLD    SIMULATION       LAYERS

           The world consists of several simulation layers.

           Individual Layer

           Simulation of:

              • NPCs;
              • creatures;
              • companions.

                                          1

<!-- Page 2 -->

Settlement Layer

           Simulation of:

              • villages;
              • towns;

              • cities;
              • camps.

           Regional Layer

           Simulation of:

              • economics;
              • wars;
              • diseases;
              • weather.

           Global Layer

           Simulation of:

              • factions;
              • trade routes;
              • migrations;
              • major events.

           3. TIME  SYSTEM

           Time exists continuously.

           Units:

              • minute;
              • hour;
              • day;
              • week;
              • month;
              • year.

           The world updates regardless of player actions.

                                          2

<!-- Page 3 -->

4. DAILY   SCHEDULES

           Every NPC has:

              • sleep time;
              • work time;
              • meal time;
              • social time;
              • personal time.

           Example:

           Blacksmith:

           06:00 Wake up

           07:00 Breakfast

           08:00 Work

           13:00 Lunch

           14:00 Work

           20:00 Tavern

           22:00 Sleep

           5. WEATHER     SYSTEM

           Weather affects:

              • travel;
              • combat;
              • economy;
              • health;
              • agriculture.

           Examples:

              • rain;
              • storms;
              • snow;

                                          3

<!-- Page 4 -->

• fog;
              • drought.

           6. SEASONS

           Seasons change:

              • environment;

              • prices;
              • diseases;
              • travel speed;
              • wildlife.

           7. ECONOMY

           The economy is simulated.

           Examples:

              • production;
              • consumption;
              • shortages;

              • inflation;
              • trade.

           8. RESOURCES

           Resources include:

              • food;
              • wood;
              • iron;
              • coal;
              • herbs;
              • black crystal.

           Resource shortages affect society.

                                          4

<!-- Page 5 -->

9. FOOD   SYSTEM

           Settlements require food.

           Without food:

              • prices rise;
              • starvation begins;
              • migration occurs;
              • riots happen.

           10. TRADE    ROUTES

           Trade routes transport:

              • food;
              • weapons;
              • medicine;
              • luxury goods.

           Routes may be:

              • protected;
              • attacked;
              • destroyed.

           11. CARAVANS

           Caravans:

              • travel;
              • trade;
              • disappear;
              • get robbed.

           The player may:

              • escort;
              • rob;
              • protect;
              • ignore.

                                          5

<!-- Page 6 -->

12. WAR

           Wars occur dynamically.

           Effects:

              • deaths;
              • shortages;
              • refugees;
              • economic collapse.

           13. FACTIONS

           Factions possess:

              • goals;
              • enemies;
              • allies;
              • resources;
              • territory.

           Factions act independently.

           14. SETTLEMENT      DEVELOPMENT

           Settlements evolve.

           Examples:

           Village:

           Population: 100

           After prosperity:

           Population: 300

           New buildings:

              • market
              • walls

                                          6

<!-- Page 7 -->

• barracks

           15. SETTLEMENT      DECLINE

           Settlements may collapse.

           Reasons:

              • war;
              • famine;
              • disease;
              • monsters;
              • economics.

           16. DISEASE    SPREAD

           Diseases spread through:

              • people;
              • trade;
              • animals;
              • water.

           Effects:

              • death;
              • panic;
              • migration.

           17. MIGRATION

           NPCs relocate.

           Reasons:

              • war;
              • famine;
              • opportunity;
              • fear.

                                          7

<!-- Page 8 -->

18. CRIME

           Crime changes dynamically.

           Examples:

              • theft;
              • smuggling;
              • murder;
              • corruption.

           Crime influences society.

           19. WILDLIFE

           Animals:

              • migrate;
              • reproduce;
              • hunt;
              • die.

           Examples:

              • wolves;
              • deer;
              • bears.

           20. MONSTERS

           Monster populations change.

           Examples:

           Too many wolves:

              • fewer deer;
              • more attacks.

           Dragon appears:

              • migration;

                                          8

<!-- Page 9 -->

• fear;
              • economic collapse.

           21. AGING

           NPCs age.

           Effects:

              • appearance;
              • health;
              • memory;
              • status.

           22. BIRTH

           Children are born.

           Effects:

              • population growth;
              • inheritance;
              • social change.

           23. DEATH

           NPCs die.

           Reasons:

              • age;
              • disease;

              • combat;
              • accidents;
              • murder.
           Death changes the world.

                                          9

<!-- Page 10 -->

24. SUCCESSION

           When leaders die:

              • heirs inherit;
              • civil wars begin;
              • factions change.

           25. CULTURE

           Settlements develop culture.

           Examples:

              • traditions;
              • religion;
              • cuisine;
              • clothing.

           26. RUMOR     NETWORK

           Information spreads.

           Speed depends on:

              • roads;
              • merchants;
              • politics;
              • witnesses.

           27. PLAYER    IMPACT

           The player may:

              • save settlements;
              • destroy settlements;
              • change wars;
              • change economies;
              • alter history.

                                         10

<!-- Page 11 -->

28. HISTORY

           The world remembers.

           Examples:

              • wars;
              • disasters;

              • heroes;
              • crimes.
           Books may be written.

           Songs may be composed.

           29. WORLD     EVENTS

           Examples:

              • plague;
              • rebellion;
              • invasion;
              • famine;
              • discovery;
              • prophecy.

           30. SIMULATION      DISTANCE

           Not all regions simulate equally.

           Close to player: high simulation.

           Far from player: abstract simulation.

           This preserves performance.

                                         11

<!-- Page 12 -->

31. AI NPC   INTEGRATION

           NPCs react to:

              • economy;
              • weather;
              • rumors;
              • war;
              • disease;
              • politics.

           32. PLAYER    ABSENCE

           If the player ignores problems:

           the world still changes.

           Example:

           Village requests help.

           Player refuses.

           One month later:

           Village no longer exists.

           33. SAVE   SYSTEM

           The world state persists.

           Nothing resets.

           34. CORE   RULE

           The player lives inside the world.

           The world does not live for the player.

                                         12
