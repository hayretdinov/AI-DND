import { getItemTemplateById } from "../../data/itemRegistry";
import { createDefaultInventoryState } from "../../data/inventoryMockData";
import type { CombatantLifeState, PostCombatPhase } from "../../types/combat";
import type { InventoryItem } from "../../types/inventory";
import type { NpcInstance, NpcLootState, NpcPostCombatMemory, NpcRole, NpcStatus } from "../../types/npc";
import type { PlayerCharacter } from "../../types/player";
import type { GameSave } from "../save/saveSystem";
import { getPlayerCarryCapacity } from "../player/effectivePlayerStats";

export type PostCombatIntent =
  | "execute"
  | "searchCorpse"
  | "takeAllLoot"
  | "demandItem"
  | "release"
  | "bind"
  | "leave"
  | "dialogue"
  | "unknown";

export type LootTransferResult = {
  save: GameSave;
  npcInstance: NpcInstance;
  transferredItems: InventoryItem[];
  blockedItems: InventoryItem[];
};

export type PlayerDefeatOutcome = "robbed" | "executed" | "left";

export type PlayerDefeatResolution = {
  save: GameSave;
  npcInstance: NpcInstance;
  outcome: PlayerDefeatOutcome;
  stolenItems: InventoryItem[];
  stolenGold: number;
  messageKey: "postCombat.playerRobbed" | "postCombat.playerExecuted" | "postCombat.playerSpared";
};

const INTELLIGENT_ROLES = new Set<NpcRole>([
  "guard",
  "bandit",
  "merchant",
  "civilian",
  "companion",
  "ruler",
  "mage",
  "priest",
  "military",
  "noble",
  "scholar",
  "blacksmith",
  "trainer",
]);

const LOOT_BY_TEMPLATE_ID: Record<string, Array<{ itemId: string; quantity?: number }>> = {
  skeleton_warrior_01: [
    { itemId: "rusty_sword" },
  ],
  orc_bandit_archer: [
    { itemId: "simple_bow" },
    { itemId: "simple_arrows", quantity: 8 },
    { itemId: "old_dagger" },
  ],
  orc_bandit_milka: [
    { itemId: "simple_bow" },
    { itemId: "simple_arrows", quantity: 6 },
    { itemId: "old_dagger" },
  ],
  bandit_erik: [
    { itemId: "old_dagger" },
    { itemId: "small_coin_pouch" },
    { itemId: "lockpick" },
  ],
  hooded_bandit_01: [
    { itemId: "light_bow" },
    { itemId: "simple_arrows", quantity: 5 },
    { itemId: "old_dagger" },
    { itemId: "small_coin_pouch" },
  ],
  road_bandit_01: [
    { itemId: "rusty_sword" },
    { itemId: "old_dagger" },
    { itemId: "small_coin_pouch" },
  ],
  bandit_swordsman_01: [
    { itemId: "iron_sword" },
    { itemId: "cracked_wooden_shield" },
    { itemId: "leather_scrap" },
  ],
  swamp_cult_catcher: [
    { itemId: "iron_sword" },
    { itemId: "old_dagger" },
  ],
  swamp_cultist_blade: [
    { itemId: "iron_sword" },
    { itemId: "old_dagger" },
  ],
};

const LOOT_BY_ROLE: Partial<Record<NpcRole, Array<{ itemId: string; quantity?: number }>>> = {
  guard: [{ itemId: "wooden_club" }, { itemId: "cracked_wooden_shield" }],
  bandit: [{ itemId: "old_dagger" }, { itemId: "stale_bread" }],
  blacksmith: [{ itemId: "iron_mace" }, { itemId: "leather_scrap" }],
  monster: [{ itemId: "monster_meat" }],
};

const EXTRA_BUTCHERING_LOOT_BY_TEMPLATE_ID: Record<string, Array<{ itemId: string; quantity?: number }>> = {
  forest_beast_01: [{ itemId: "rat_claws" }],
  fire_serpent_01: [{ itemId: "snake_scales" }],
  swamp_serpent: [{ itemId: "snake_scales" }],
  swamp_giant_toad: [{ itemId: "monster_meat" }],
  swamp_water_horror: [{ itemId: "leather_scrap" }],
};

function nowIso() {
  return new Date().toISOString();
}

export function isIntelligentNpc(role: NpcRole) {
  return INTELLIGENT_ROLES.has(role);
}

export function isPostCombatNpcStatus(status: NpcStatus) {
  return status === "defeated" || status === "unconscious" || status === "surrendered";
}

export function isNpcDialogueAllowedAfterCombat(npc: NpcInstance) {
  return isIntelligentNpc(npc.role) && isPostCombatNpcStatus(npc.status);
}

export function getNpcLifeState(npc: NpcInstance): CombatantLifeState {
  if (npc.status === "dead") {
    return "dead";
  }

  if (npc.status === "surrendered") {
    return "surrendered";
  }

  if (npc.status === "unconscious") {
    return "unconscious";
  }

  if (npc.status === "defeated" || npc.combat?.isDefeated || (npc.combat?.currentHealth ?? 1) <= 0) {
    return npc.role === "monster" ? "dead" : "defeated";
  }

  if (npc.combat && npc.combat.currentHealth < npc.combat.maxHealth) {
    return "wounded";
  }

  return "active";
}

export function getPostCombatPhaseForNpc(npc: NpcInstance, playerDefeated = false): PostCombatPhase {
  if (playerDefeated) {
    return "playerDefeated";
  }

  if (npc.status === "dead") {
    return npc.role === "monster" ? "monsterDefeated" : "enemyDead";
  }

  if (isPostCombatNpcStatus(npc.status)) {
    return npc.role === "monster" ? "monsterDefeated" : "npcDefeatedAlive";
  }

  return "none";
}

export function markNpcDefeatedAfterCombat(npc: NpcInstance, defeatedBy = "player"): NpcInstance {
  const defeatedAt = nowIso();
  const lifeState: CombatantLifeState = npc.role === "monster" ? "dead" : "defeated";
  const status: NpcStatus = npc.role === "monster" ? "dead" : "defeated";
  const lastOutcome: NpcPostCombatMemory["lastOutcome"] = npc.role === "monster" ? "monsterDefeated" : "npcDefeatedAlive";

  return {
    ...npc,
    status,
    postCombatMemory: {
      ...(npc.postCombatMemory ?? {}),
      lastOutcome,
      defeatedBy,
      updatedAt: defeatedAt,
    },
    combat: npc.combat
      ? {
          ...npc.combat,
          currentHealth: 0,
          isDefeated: true,
          lifeState,
          defeatedBy,
          defeatedAt,
        }
      : npc.combat,
  };
}

export function markNpcExecutedAfterCombat(npc: NpcInstance): NpcInstance {
  const updatedAt = nowIso();

  return {
    ...npc,
    status: "dead",
    postCombatMemory: {
      ...(npc.postCombatMemory ?? {}),
      lastOutcome: npc.role === "monster" ? "monsterDefeated" : "enemyDead",
      wasExecuted: true,
      updatedAt,
    },
    combat: npc.combat
      ? {
          ...npc.combat,
          currentHealth: 0,
          isDefeated: true,
          lifeState: "dead",
          defeatedAt: npc.combat.defeatedAt ?? updatedAt,
        }
      : npc.combat,
  };
}

export function rememberPlayerDefeated(npc: NpcInstance): NpcInstance {
  return {
    ...npc,
    postCombatMemory: {
      ...(npc.postCombatMemory ?? {}),
      lastOutcome: "playerDefeated",
      defeatedPlayer: true,
      updatedAt: nowIso(),
    },
  };
}

function hasButcheringSkill(save?: GameSave) {
  const player = save?.player as PlayerCharacter & {
    skills?: Record<string, boolean | undefined>;
    survival?: Record<string, boolean | undefined>;
  };

  return Boolean(
    player?.skills?.butchering ||
      player?.skills?.skinning ||
      player?.survival?.butchering ||
      player?.survival?.skinning,
  );
}

export function classifyPostCombatIntent(text: string): PostCombatIntent {
  const normalized = text.toLowerCase();

  if (/добива|казн|убиваю|перерез/.test(normalized)) {
    return "execute";
  }

  if (/заб(рать|ираю).*вс[её]|заб(рать|ираю).*вещ/.test(normalized)) {
    return "takeAllLoot";
  }

  if (/обыск|осмотр.*тел|тело|карман/.test(normalized)) {
    return "searchCorpse";
  }

  if (/отдай|требую|оружие|снаряжен|кошел|золото|покажи.*что.*у.*теб/.test(normalized)) {
    return "demandItem";
  }

  if (/связыва|связать/.test(normalized)) {
    return "bind";
  }

  if (/отпуска|пощад/.test(normalized)) {
    return "release";
  }

  if (/уйти|ухожу/.test(normalized)) {
    return "leave";
  }

  if (/добива|казн|убиваю|перерез|finish\s+off|execute|kill\s+him|kill\s+her/.test(normalized)) {
    return "execute";
  }

  if (/забрать\s+все|забираю\s+все|take\s+all|loot\s+all/.test(normalized)) {
    return "takeAllLoot";
  }

  if (/обыск|осмотр.*тел|тело|карман|search|loot|corpse|body/.test(normalized)) {
    return "searchCorpse";
  }

  if (/отдай|требую|оружие|снаряжен|кошел|золото|give|demand|hand\s+over/.test(normalized)) {
    return "demandItem";
  }

  if (/связыва|связать|bind|tie/.test(normalized)) {
    return "bind";
  }

  if (/отпуска|пощад|spare|release|mercy/.test(normalized)) {
    return "release";
  }

  if (/уйти|ухожу|leave|go\s+away/.test(normalized)) {
    return "leave";
  }

  if (normalized.trim().length > 0) {
    return "dialogue";
  }

  return "unknown";
}

function createLootItem(npc: NpcInstance, itemId: string, quantity = 1): InventoryItem | null {
  const template = getItemTemplateById(itemId);

  if (!template) {
    return null;
  }

  const instanceId = `${npc.instanceId}_${itemId}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

  return {
    ...template,
    id: instanceId,
    instanceId,
    itemId: template.itemId,
    templateId: template.templateId,
    quantity,
    condition: template.defaultQuality === "poor" ? "worn" : "intact",
    quality: template.defaultQuality ?? "common",
    origin: `loot:${npc.instanceId}`,
    owner: npc.instanceId,
    createdAt: nowIso(),
  };
}

export function generateNpcLoot(npc: NpcInstance, save?: GameSave): NpcLootState {
  const configuredLoot = LOOT_BY_TEMPLATE_ID[npc.templateId] ?? LOOT_BY_ROLE[npc.role] ?? [];
  const butcheringLoot = npc.role === "monster" && hasButcheringSkill(save)
    ? EXTRA_BUTCHERING_LOOT_BY_TEMPLATE_ID[npc.templateId] ?? []
    : [];
  const items = configuredLoot
    .concat(butcheringLoot)
    .map((entry) => createLootItem(npc, entry.itemId, entry.quantity ?? 1))
    .filter((item): item is InventoryItem => Boolean(item));

  return {
    generated: true,
    searched: false,
    items,
    gold: npc.templateId === "bandit_erik" || npc.templateId === "road_bandit_01" ? 3 : 0,
    generatedAt: nowIso(),
  };
}

export function ensureNpcLoot(npc: NpcInstance, searched = false, save?: GameSave): NpcInstance {
  if (npc.loot?.generated) {
    return {
      ...npc,
      loot: {
        ...npc.loot,
        searched: npc.loot.searched || searched,
      },
    };
  }

  return {
    ...npc,
    loot: {
      ...generateNpcLoot(npc, save),
      searched,
    },
  };
}

function getInventoryWeight(items: InventoryItem[]) {
  return items.reduce((total, item) => total + item.weight * item.quantity, 0);
}

function canCarryItem(save: GameSave, item: InventoryItem) {
  const inventory = save.inventory ?? createDefaultInventoryState();
  return getInventoryWeight(inventory.items) + item.weight * item.quantity <= getPlayerCarryCapacity(save.player, inventory);
}

function addLootToPlayerInventory(save: GameSave, item: InventoryItem): GameSave {
  const inventory = save.inventory ?? createDefaultInventoryState();
  const template = getItemTemplateById(item.templateId);

  if (template?.stackable) {
    const maxStack = template.maxStack ?? 99;
    let remainingQuantity = item.quantity;
    const items = inventory.items.map((inventoryItem) => {
      if (
        inventoryItem.templateId !== item.templateId ||
        inventoryItem.quantity >= maxStack ||
        remainingQuantity <= 0
      ) {
        return inventoryItem;
      }

      const addedQuantity = Math.min(maxStack - inventoryItem.quantity, remainingQuantity);
      remainingQuantity -= addedQuantity;
      return { ...inventoryItem, quantity: inventoryItem.quantity + addedQuantity };
    });

    while (remainingQuantity > 0) {
      const stackQuantity = Math.min(maxStack, remainingQuantity);
      const instanceId = `${item.templateId}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
      items.push({
        ...item,
        id: instanceId,
        instanceId,
        quantity: stackQuantity,
        owner: "player",
        origin: item.origin ?? "loot",
        createdAt: nowIso(),
      });
      remainingQuantity -= stackQuantity;
    }

    return {
      ...save,
      inventory: {
        ...inventory,
        items,
      },
    };
  }

  const instanceId = `${item.templateId}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const playerItem: InventoryItem = {
    ...item,
    id: instanceId,
    instanceId,
    owner: "player",
    origin: item.origin ?? "loot",
    createdAt: nowIso(),
  };

  return {
    ...save,
    inventory: {
      ...inventory,
      items: [...inventory.items, playerItem],
    },
  };
}

function upsertNpc(save: GameSave, npc: NpcInstance): GameSave {
  return {
    ...save,
    npcs: {
      ...(save.npcs ?? { instances: {} }),
      instances: {
        ...(save.npcs?.instances ?? {}),
        [npc.instanceId]: npc,
      },
    },
  };
}

export function takeNpcLootItem(save: GameSave, npc: NpcInstance, itemInstanceId: string): LootTransferResult {
  const npcWithLoot = ensureNpcLoot(npc, true, save);
  const loot = npcWithLoot.loot ?? generateNpcLoot(npcWithLoot, save);
  const item = loot.items.find((candidate) => candidate.id === itemInstanceId);

  if (!item || !canCarryItem(save, item)) {
    const nextNpc = { ...npcWithLoot, loot };
    return {
      save: upsertNpc(save, nextNpc),
      npcInstance: nextNpc,
      transferredItems: [],
      blockedItems: item ? [item] : [],
    };
  }

  const nextLoot = {
    ...loot,
    searched: true,
    items: loot.items.filter((candidate) => candidate.id !== itemInstanceId),
  };
  const nextNpc = {
    ...npcWithLoot,
    postCombatMemory: {
      ...(npcWithLoot.postCombatMemory ?? {}),
      wasLooted: true,
      updatedAt: nowIso(),
    },
    loot: nextLoot,
  };

  return {
    save: upsertNpc(addLootToPlayerInventory(save, item), nextNpc),
    npcInstance: nextNpc,
    transferredItems: [item],
    blockedItems: [],
  };
}

export function takeAllNpcLoot(save: GameSave, npc: NpcInstance): LootTransferResult {
  let workingSave = save;
  let workingNpc = ensureNpcLoot(npc, true, save);
  const transferredItems: InventoryItem[] = [];
  const blockedItems: InventoryItem[] = [];

  for (const item of [...(workingNpc.loot?.items ?? [])]) {
    const result = takeNpcLootItem(workingSave, workingNpc, item.id);
    workingSave = result.save;
    workingNpc = result.npcInstance;
    transferredItems.push(...result.transferredItems);
    blockedItems.push(...result.blockedItems);
  }

  return {
    save: workingSave,
    npcInstance: workingNpc,
    transferredItems,
    blockedItems,
  };
}

function isStealablePlayerItem(item: InventoryItem) {
  return !item.isQuestItem && !item.questItem && !item.cannotBeStolen;
}

function cloneStolenItemForNpc(npc: NpcInstance, item: InventoryItem): InventoryItem {
  const instanceId = `${npc.instanceId}_stolen_${item.templateId}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

  return {
    ...item,
    id: instanceId,
    instanceId,
    owner: npc.instanceId,
    origin: `stolen:${npc.instanceId}`,
    createdAt: nowIso(),
  };
}

function addStolenItemsToNpcLoot(npc: NpcInstance, stolenItems: InventoryItem[], stolenGold: number): NpcInstance {
  const loot = npc.loot?.generated ? npc.loot : generateNpcLoot(npc);

  return {
    ...npc,
    loot: {
      ...loot,
      generated: true,
      items: [...loot.items, ...stolenItems.map((item) => cloneStolenItemForNpc(npc, item))],
      gold: (loot.gold ?? 0) + stolenGold,
      generatedAt: loot.generatedAt ?? nowIso(),
    },
    postCombatMemory: {
      ...(npc.postCombatMemory ?? {}),
      lastOutcome: "playerDefeated",
      defeatedPlayer: true,
      wasLooted: true,
      updatedAt: nowIso(),
    },
  };
}

function shouldEnemyExecutePlayer(npc: NpcInstance) {
  if (!isIntelligentNpc(npc.role)) {
    return true;
  }

  return (npc.hostility ?? 0) >= 95 || (npc.relationship ?? 0) <= -90 || Boolean(npc.postCombatMemory?.wasExecuted);
}

export function resolvePlayerDefeatAfterCombat(save: GameSave, npc: NpcInstance): PlayerDefeatResolution {
  if (shouldEnemyExecutePlayer(npc)) {
    const executedSave: GameSave = {
      ...save,
      player: {
        ...save.player,
        lifeState: "dead",
        combat: save.player.combat
          ? {
              ...save.player.combat,
              currentHealth: 0,
            }
          : save.player.combat,
      },
    };
    const nextNpc = rememberPlayerDefeated(npc);

    return {
      save: upsertNpc(executedSave, nextNpc),
      npcInstance: nextNpc,
      outcome: "executed",
      stolenItems: [],
      stolenGold: 0,
      messageKey: "postCombat.playerExecuted",
    };
  }

  const inventory = save.inventory ?? createDefaultInventoryState();
  const stolenItems = inventory.items.filter(isStealablePlayerItem);
  const stolenItemIds = new Set(stolenItems.map((item) => item.id));
  const nextEquipment = { ...inventory.equipment };

  for (const slotId of Object.keys(nextEquipment) as Array<keyof typeof nextEquipment>) {
    const equippedItemId = nextEquipment[slotId];

    if (equippedItemId && stolenItemIds.has(equippedItemId)) {
      delete nextEquipment[slotId];
    }
  }

  const stolenGold = Math.max(0, Math.floor(inventory.gold));
  const nextNpc = addStolenItemsToNpcLoot(rememberPlayerDefeated(npc), stolenItems, stolenGold);
  const robbedSave: GameSave = {
    ...save,
    inventory: {
      ...inventory,
      gold: 0,
      equipment: nextEquipment,
      items: inventory.items.filter((item) => !stolenItemIds.has(item.id)),
    },
    player: {
      ...save.player,
      lifeState: stolenItems.length > 0 || stolenGold > 0 ? "robbed" : "defeated",
      combat: save.player.combat
        ? {
            ...save.player.combat,
            currentHealth: Math.max(1, save.player.combat.currentHealth),
          }
        : save.player.combat,
    },
  };

  return {
    save: upsertNpc(robbedSave, nextNpc),
    npcInstance: nextNpc,
    outcome: stolenItems.length > 0 || stolenGold > 0 ? "robbed" : "left",
    stolenItems,
    stolenGold,
    messageKey: stolenItems.length > 0 || stolenGold > 0 ? "postCombat.playerRobbed" : "postCombat.playerSpared",
  };
}
