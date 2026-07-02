# AI-DND Save and World State System

AI-DND

           SAVE_AND_WORLD_STATE_SYSTEM.md

           Persistent World State System

           Version 0.1

           1. DESIGN    PHILOSOPHY

           The game world never resets.

           The world remembers:

              • people;
              • events;
              • wars;
              • rumors;
              • promises;
              • deaths;
              • discoveries;
              • player actions.

           The save file is not a character save.

           The save file is a world save.

           2. SAVE  STRUCTURE

           The world state consists of:

           WORLD ├── Player ├── NPCs ├── Settlements ├── Factions ├── Economy ├── Diseases
           ├── Rumors ├── Wars ├── Quests ├── History ├── Weather ├── Trade ├── World Events
           ├── AI Memory └── Stone Sleep

                                          1

<!-- Page 2 -->

3. PLAYER   SAVE   DATA

           Player data includes:

              • identity;
              • attributes;
              • skills;
              • inventory;
              • reputation;
              • memories;
              • injuries;
              • diseases;
              • fears;
              • relationships;
              • location.

           4. NPC  SAVE   DATA

           Every NPC stores:

              • identity;
              • schedule;
              • memories;
              • opinions;
              • relationships;
              • injuries;
              • diseases;
              • goals;
              • emotions;
              • location.

           5. SETTLEMENT      DATA

           Settlements store:

              • population;
              • economy;
              • diseases;
              • reputation;
              • buildings;
              • factions;
              • food supply;

                                          2

<!-- Page 3 -->

• security.

           6. FACTION    DATA

           Factions store:

              • members;
              • territory;

              • economy;
              • enemies;
              • allies;
              • wars;
              • goals.

           7. RUMOR     DATABASE

           Rumors store:

              • source;
              • location;
              • confidence;
              • witnesses;
              • spread level;
              • age.

           8. HISTORY    DATABASE

           Historical events store:

              • date;
              • participants;
              • consequences;
              • importance.

           Examples:

              • wars;
              • disasters;
              • heroes;
              • crimes.

                                          3

<!-- Page 4 -->

9. WORLD    EVENTS

           Events store:

              • start date;
              • end date;
              • participants;
              • status;
              • consequences.

           Examples:

              • plague;
              • rebellion;
              • invasion.

           10. NPC   MEMORY      STORAGE

           Every memory contains:

              • event;
              • emotional impact;
              • participants;
              • confidence;
              • importance;
              • expiration.

           11. RELATIONSHIP       STORAGE

           Relationships store:

              • trust;
              • fear;
              • respect;
              • hatred;
              • gratitude;
              • attraction.

                                          4

<!-- Page 5 -->

12. QUEST    STORAGE

           Quests store:

              • creator;
              • participants;
              • objectives;
              • status;
              • consequences;
              • expiration.

           13. WORLD     TIMELINE

           The game stores:

              • year;
              • month;
              • day;
              • hour;
              • season.

           Nothing stops time.

           14. DEATH    REGISTRY

           The game stores:

              • who died;
              • when;
              • where;
              • why;
              • witnesses.

           Dead NPCs remain in history forever.

           15. BIRTH   REGISTRY

           The game stores:

              • births;

                                          5

<!-- Page 6 -->

• parents;
              • settlements;
              • inheritance.

           16. STONE    SLEEP  STORAGE

           Store:

              • sleep start;
              • sleep end;
              • elapsed world time;
              • generated events.

           17. WAR   STORAGE

           Wars store:

              • factions;
              • casualties;
              • territory;
              • economy;
              • leaders.

           18. ECONOMIC      STORAGE

           Store:

              • prices;
              • shortages;
              • production;
              • trade routes.

           19. HEALTH    STORAGE

           Store:

              • diseases;
              • epidemics;

                                          6

<!-- Page 7 -->

• injuries;
              • mortality.

           20. WEATHER     STORAGE

           Store:

              • climate;

              • season;
              • storms;
              • disasters.

           21. MONSTER      STORAGE

           Store:

              • populations;
              • migration;
              • territories;
              • nests.

           22. PLAYER    HISTORY

           Store:

              • promises;
              • crimes;
              • victories;
              • defeats;
              • discoveries.

           23. LEGEND    STORAGE

           Store:

              • rumors;
              • myths;
              • titles;

                                          7

<!-- Page 8 -->

• historical reputation.

           24. MEMORY      OPTIMIZATION

           Important events:

           never deleted.

           Minor events:

           compressed.

           Irrelevant events:

           removed.

           25. SIMULATION      LEVELS

           Near player:

           full simulation.

           Far regions:

           abstract simulation.

           26. SAVE   FREQUENCY

           Automatic saves occur:

              • after combat;
              • after dialogue;
              • after travel;
              • after sleep;
              • after world events.

                                          8

<!-- Page 9 -->

27. BACKUP     SYSTEM

           The game keeps:

              • current save;
              • previous save;
              • emergency save.

           28. WORLD     CONSISTENCY

           Every saved fact must remain consistent.

           Example:

           Dead NPC:

           cannot appear alive.

           Destroyed village:

           cannot continue normal activity.

           29. AI ACCESS

           AI systems receive:

              • only relevant data;
              • only known information;
              • only accessible memories.

           30. CORE   RULE

           The save file is not a save.

           It is the memory of the world.

                                          9
