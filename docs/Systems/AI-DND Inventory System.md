# AI-DND Inventory System

AI-DND

           INVENTORY_SYSTEM.md

           Inventory and Equipment System

           Version 0.1

           1. DESIGN    PHILOSOPHY

           Inventory is not an infinite container.

           The player carries physical objects.

           Every item has:

              • weight;
              • size;
              • condition;
              • value;

              • origin;
              • ownership.
           Inventory management should create meaningful decisions.

           2. INVENTORY      TYPES

           The player possesses several inventories.

           Body Equipment

           Equipped items.

           Backpack

           Main storage.

                                          1

<!-- Page 2 -->

Belt

           Quick-access items.

           Pockets

           Small items only.

           Mount Inventory

           Animal storage.

           Home  Storage

           Permanent storage.

           3. EQUIPMENT      SLOTS

           Character equipment slots:

              • head;
              • face;
              • neck;
              • torso;
              • cloak;

              • gloves;
              • belt;
              • pants;
              • boots;
              • left ring;
              • right ring;
              • amulet;
              • primary weapon;
              • secondary weapon;
              • shield;
              • ranged weapon;
              • ammunition.

                                          2

<!-- Page 3 -->

4. ITEM  CATEGORIES

           Weapons

           Examples:

              • swords;
              • axes;
              • maces;
              • daggers;
              • spears;
              • bows;
              • crossbows;
              • staffs.

           Armor

           Examples:

              • cloth;
              • leather;
              • chainmail;
              • plate.

           Accessories

           Examples:

              • rings;
              • amulets;
              • talismans.

           Consumables

           Examples:

              • food;
              • potions;
              • medicine;

              • alcohol.

                                          3

<!-- Page 4 -->

Materials

           Examples:

              • ore;
              • wood;
              • leather;
              • herbs;
              • crystals.

           Documents

           Examples:

              • letters;
              • maps;
              • books;
              • contracts.

           Quest Items

           Examples:

              • relics;
              • keys;
              • artifacts.

           5. WEIGHT    SYSTEM

           Every item has weight.

           Examples:

           Sword: 2.5 kg

           Apple: 0.2 kg

           Armor: 18 kg

                                          4

<!-- Page 5 -->

Weight affects:

              • stamina;
              • travel speed;
              • combat;
              • fatigue.

           6. VOLUME     SYSTEM

           Items occupy physical space.

           Examples:

           Ring: very small.

           Sword: large.

           Armor: very large.

           7. CARRYING     CAPACITY

           Formula:

           Strength

           + Training

           + Equipment

           determines carrying capacity.

           8. OVERLOAD

           Effects of overload:

              • slower movement;
              • increased fatigue;
              • combat penalties;
              • injury risk.

                                          5

<!-- Page 6 -->

9. ITEM  QUALITY

           Quality levels:

           Broken ↓ Poor ↓ Common ↓ Good ↓ Excellent ↓ Masterwork ↓ Legendary

           10. ITEM   CONDITION

           Items degrade.

           Examples:

              • rust;
              • cracks;
              • dullness;
              • wear.

           Condition affects performance.

           11. DURABILITY

           Weapons:

              • lose sharpness;
              • break.

           Armor:

              • deforms;
              • cracks.

           Tools:

              • wear out.

           12. REPAIR

           Repair methods:

              • blacksmith;

                                          6

<!-- Page 7 -->

• craftsman;
              • self-repair;
              • magic.

           13. ITEM   OWNERSHIP

           Every item may have an owner.

           Examples:

              • player;
              • NPC;
              • faction;
              • settlement.

           Stolen items may be recognized.

           14. STOLEN    PROPERTY

           Effects:

              • guards investigate;
              • merchants refuse purchase;
              • owners seek revenge.

           15. FOOD    SYSTEM

           Food properties:

              • nutrition;
              • freshness;
              • quality;
              • disease risk.

           16. SPOILAGE

           Food spoils over time.

           Examples:

                                          7

<!-- Page 8 -->

Fresh ↓ Old ↓ Spoiled ↓ Rotten

           17. DRINKS

           Examples:

              • water;

              • beer;
              • wine;
              • spirits.
           Effects:

              • hydration;
              • morale;
              • intoxication.

           18. MEDICINE

           Medicine properties:

              • healing;
              • poison treatment;
              • disease treatment;
              • side effects.

           19. POISONS

           Poisons may be:

              • applied;
              • consumed;
              • inhaled.

           20. BOOKS

           Books contain:

              • knowledge;

                                          8

<!-- Page 9 -->

• lore;
              • skills;
              • maps.

           Books may be:

              • false;
              • outdated;
              • incomplete.

           21. MAPS

           Maps reveal:

              • regions;
              • roads;
              • secrets.
           Map quality varies.

           22. KEYS

           Keys may:

              • break;
              • be copied;
              • be forged.

           23. CONTAINERS

           Examples:

              • bags;
              • chests;
              • barrels;
              • crates.
           Containers have:

              • weight;
              • volume;

                                          9

<!-- Page 10 -->

• ownership.

           24. HIDDEN     ITEMS

           Items may be:

              • concealed;
              • smuggled;

              • hidden.
           Detection depends on:

              • perception;
              • search quality.

           25. WEAPON      ATTRIBUTES

           Weapons possess:

              • damage type;
              • weight;
              • balance;
              • reach;
              • durability.

           26. ARMOR     ATTRIBUTES

           Armor possesses:

              • protection;
              • weight;
              • mobility penalty;
              • durability.

           27. ARTIFACTS

           Artifacts may possess:

              • unique abilities;

                                         10

<!-- Page 11 -->

• curses;
              • history;
              • intelligence.

           28. CURSED    ITEMS

           Possible effects:

              • addiction;
              • madness;
              • corruption;
              • power.

           29. ITEM   HISTORY

           Important items store history.

           Examples:

              • creator;
              • owners;
              • battles;

              • legends.

           30. ECONOMIC      VALUE

           Item value depends on:

              • rarity;
              • demand;
              • location;
              • politics;
              • quality.

           31. STACKING

           Only certain items stack.

                                         11

<!-- Page 12 -->

Examples:

              • arrows;
              • coins;
              • herbs.

           Equipment never stacks.

           32. QUICK    ACCESS

           Quick slots:

              • weapon;
              • medicine;

              • potion;
              • torch.

           33. INVENTORY      SEARCH

           Players may search inventory by:

              • category;
              • weight;
              • value;
              • rarity.

           34. THOUGHT      SYSTEM    INTEGRATION

           Examples:

           • My sword is damaged. • I have little food left. • This medicine may help. • Carrying this armor is
           exhausting.

           35. NPC   REACTION

           NPCs react to:

              • equipment;
              • wealth;

                                         12

<!-- Page 13 -->

• stolen items;
              • legendary artifacts.

           36. AI INTEGRATION

           AI systems know:

              • what the player carries;

              • what the player lacks;
              • item condition;
              • ownership.

           37. DEATH    AND   ITEMS

           After death:

              • items remain;
              • items may be stolen;
              • items may become historical artifacts.

           38. STONE    SLEEP  INTEGRATION

           During Stone Sleep:

              • food spoils;
              • items age;
              • equipment deteriorates.

           39. IMMERSION       RULE

           The player should feel:

           "I carry possessions."

           Not:

           "I manage database entries."

                                         13

<!-- Page 14 -->

40. CORE   RULE

           Items are not statistics.

           Items are part of the world's history.

                                         14
