import { useEffect, useRef, useState } from "react";
import {
  ContextGuideButton,
  ContextGuideSidePanel,
} from "../components/MagicGuideAccess";
import { SceneDialoguePanel, type SceneDialogueMessage } from "../components/SceneDialoguePanel";
import { TopStatusBar, type TopStatusIndicatorData } from "../components/TopStatusHud";
import {
  appendDialogueMessages,
  appendAnarielMessage,
  applyAnarielToneDelta,
  analyzePlayerTone,
  getFallbackReplyKey,
  getIntroFallbackReplyKey,
} from "../systems/companions/anarielDialogue";
import { getAnarielImageForCurrentState, isAnarielActiveCompanion } from "../data/companions/anarielVisuals";
import { ANARIEL_INTRO_EVENT } from "../data/events";
import { cityMapDefinitions } from "../data/cityMap";
import { getItemTemplateById } from "../data/itemRegistry";
import { getLocationEventById } from "../data/locationEvents";
import { getNpcById } from "../data/npcs";
import { getSceneAssetDefinition } from "../data/sceneAssets";
import { getTravelEventById } from "../data/travelEvents";
import { getLanguage, t, type TranslationKey } from "../i18n/i18n";
import { requestAIDialogue } from "../services/aiClient";
import { getAIStatus } from "../services/aiStatus";
import { parseAiGameCommands } from "../systems/ai/aiCommandParser";
import { sanitizeAiResponseForWorld } from "../systems/ai/inWorldResponseSanitizer";
import {
  addItemToInventory,
  applyAiRewardCommands,
  canNpcRewardGold,
  getAllowedAnarielRewardIds,
  getAllowedNpcRewardIds,
  type AppliedItemReward,
} from "../systems/inventory/inventoryRewards";
import {
  ARCHERY_BASICS_GUIDE_ITEM_ID,
  CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID,
  getContextGuideItem,
  MAGIC_APPRENTICE_GUIDE_ITEM_ID,
  markGuideRead,
  MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID,
  type ContextGuideId,
} from "../systems/inventory/readableItems";
import {
  addPlayerGold,
  loadGame,
  saveGame,
  type AnarielCompanionState,
  type GameSave,
} from "../systems/save/saveSystem";
import {
  confirmMerchantDeal,
  createMerchantDeal,
  getApproximateMerchantPrice,
  getMerchantQuestHint,
  getMerchantState,
  respondToTradeText,
  upsertMerchant,
} from "../systems/merchant/merchantSystem";
import {
  acceptTrainerAgreement,
  applyTrainerTraining,
  getTrainerStatus,
  hasAcceptedTrainerAgreement,
  refuseTrainerAgreement,
} from "../systems/trainers/trainerSystem";
import {
  applyBlacksmithTraining,
  applySmithingClick,
  getSmithingProgression,
  smithingStageGoals,
  startSmithingJob,
} from "../systems/smithing/smithingSystem";
import {
  appendNpcDialogueMessages,
  appendNpcGameMasterMessages,
  applyNpcToneDelta,
  createInitialNpcState,
  getNpcFallbackReplyKey,
  setNpcInstanceStatus,
} from "../systems/npc/npcDialogueSystem";
import {
  ensureCombatState,
  createNpcCombatState,
  resolveEnemyTurn,
  resolvePlayerAttack,
  syncCombatStateAfterPlayerAction,
  type EnemyAttackResult,
  type PlayerAttackResult,
} from "../systems/combat/combatSystem";
import {
  classifyPostCombatIntent,
  ensureNpcLoot,
  getNpcLifeState,
  getPostCombatPhaseForNpc,
  isNpcDialogueAllowedAfterCombat,
  isPostCombatNpcStatus,
  markNpcExecutedAfterCombat,
  resolvePlayerDefeatAfterCombat,
  takeAllNpcLoot,
  takeNpcLootItem,
} from "../systems/combat/postCombatSystem";
import { createGameMasterNarration } from "../systems/gameMaster/gameMasterSystem";
import { classifyChatMessage } from "../systems/intent/chatIntentRouter";
import { parsePlayerIntent, type PlayerIntent } from "../systems/intent/playerIntentSystem";
import { getSocialCheckType, resolveSocialCheck } from "../systems/npc/socialCheckSystem";
import { getCombatInputPolicy } from "../systems/combat/combatInputPolicy";
import {
  formatMagicResolutionMessage,
  parseMagicFormula,
  resolveSpell,
  validateMagicFormula,
} from "../systems/magic";
import {
  formatTextCombatNarration,
  getTextCombatLog,
  parseTextCombatAction,
  resolveTextCombatAction,
} from "../systems/combat/text";
import {
  formatRangedCombatNarration,
  getRangedCombatLog,
  parseRangedCombatAction,
  resolveRangedCombatAction,
} from "../systems/combat/ranged";
import {
  generateCombatThoughtHints,
  type CombatHintContext,
  type CombatThoughtHint,
} from "../systems/combat/combatThoughtHints";
import {
  getEquippedRangedWeapon,
  getRangedWeaponCategory,
  getWeaponState,
  normalizePlayerRangedCombatState,
} from "../systems/combat/ranged/rangedWeaponState";
import type { EventChoiceAction, EventInteractionMode, EventIntroStep } from "../types/eventScene";
import type { CombatActionOutcome, CombatActionType, CombatState, CombatantState, PlayerAttackAction, PostCombatPhase } from "../types/combat";
import type { LocationEventDefinition, TravelEventDefinition } from "../types/events";
import type { InventoryItem } from "../types/inventory";
import type { MerchantDealSide } from "../types/merchant";
import type { InventoryReturnTarget } from "../types/navigation";
import type { NpcDefinition, NpcInstance, NpcRuntimeState } from "../types/npc";

type EventSceneProps = {
  onBackToMenu: () => void;
  onOpenCityMap: () => void;
  onOpenWorldMap: () => void;
  onOpenSwampMap: () => void;
  onOpenInventory: (source: InventoryReturnTarget) => void;
  onOpenJournal: () => void;
  onOpenSettings: () => void;
};

type CombatLogEntry = {
  id: string;
  text: string;
  variant: "hit" | "miss" | "critical";
  debugData?: Record<string, unknown>;
};

type DraggedTradeItem = {
  side: MerchantDealSide;
  itemInstanceId: string;
};

type TradeMode = "buy" | "sell";

const sidebarItems = [
  { key: "event.ui.sidebarQuest", glyph: "Q" },
  { key: "event.ui.sidebarBag", glyph: "B" },
  { key: "event.ui.sidebarMap", glyph: "M" },
] as const;

const FALLBACK_NPC_IMAGE = "/assets/npcs/road_bandit.png";

function getDialogueKey(action: EventChoiceAction): TranslationKey {
  if (action === "ask_anariel") {
    return "event.anarielIntro.dialogueAsk";
  }

  if (action === "inspect_chains") {
    return "event.anarielIntro.dialogueInspectChains";
  }

  return ANARIEL_INTRO_EVENT.dialogueInitialKey;
}

function getUpdatedAnarielState(
  status: AnarielCompanionState["status"],
  currentState?: AnarielCompanionState,
): AnarielCompanionState {
  const isRescued = status === "rescued" || status === "companion";
  const currentRelationship = currentState?.relationship ?? 0;
  const currentTrust = currentState?.trust ?? 0;
  const currentFear = currentState?.fear ?? 0;
  const currentRespect = currentState?.respect ?? 0;
  const clamp = (value: number) => Math.min(100, Math.max(0, value));

  return {
    met: true,
    status,
    isTravellingWithPlayer: isRescued,
    introEventSeen: true,
    relationship: clamp(currentRelationship + (isRescued ? 10 : -15)),
    trust: clamp(currentTrust + (isRescued ? 10 : -10)),
    fear: clamp(currentFear + (isRescued ? -5 : 5)),
    respect: clamp(currentRespect + (isRescued ? 3 : 0)),
    lastDialogueSummary: currentState?.lastDialogueSummary,
    dialogueHistory: currentState?.dialogueHistory ?? [],
  };
}

function createLegacyNpcInstance(template: NpcDefinition, instanceId: string, currentState?: NpcRuntimeState): NpcInstance {
  const currentRuntimeState = currentState ?? createInitialNpcState(instanceId);

  return {
    ...currentRuntimeState,
    npcId: instanceId,
    instanceId,
    templateId: template.id,
    role: template.role,
    status: "alive",
    combat: createNpcCombatState(template.id, template.role),
    createdAt: new Date(0).toISOString(),
  };
}

function getNpcInstance(save: GameSave | null, npc: NpcDefinition, instanceId?: string): NpcInstance {
  const resolvedInstanceId = instanceId ?? npc.id;
  const currentInstance = save?.npcs?.instances?.[resolvedInstanceId];

  if (currentInstance) {
    return currentInstance;
  }

  return createLegacyNpcInstance(npc, resolvedInstanceId);
}

function getDynamicEvent(save: GameSave | null) {
  const activeEvent = save?.activeEvent;

  if (!activeEvent || activeEvent.eventId === "anariel_intro") {
    return null;
  }

  return getLocationEventById(activeEvent.eventId) ?? getTravelEventById(activeEvent.eventId) ?? null;
}

function isLocationEvent(event: LocationEventDefinition | TravelEventDefinition): event is LocationEventDefinition {
  return event.type === "gate" || event.type === "merchant" || event.type === "npc";
}

function getNpcMoodKey(npc: NpcDefinition): TranslationKey {
  if (npc.role === "merchant") {
    return "npc.mood.merchant";
  }

  if (npc.role === "ruler" || npc.role === "noble") {
    return "npc.mood.court";
  }

  if (npc.role === "mage") {
    return "npc.mood.arcane";
  }

  if (npc.role === "priest") {
    return "npc.mood.devout";
  }

  if (npc.role === "military") {
    return "npc.mood.military";
  }

  if (npc.role === "scholar") {
    return "npc.mood.scholar";
  }

  if (npc.role === "blacksmith") {
    return "npc.mood.blacksmith";
  }

  if (npc.role === "trainer") {
    return "npc.mood.trainer";
  }

  if (npc.role === "guard") {
    return "npc.mood.suspicious";
  }

  if (npc.role === "bandit") {
    return "npc.mood.hostile";
  }

  return "npc.mood.beast";
}

function getEventNpcImage(npc: NpcDefinition | null, npcState: NpcInstance | null) {
  if (!npc) {
    return FALLBACK_NPC_IMAGE;
  }

  if (npc.id === "swamp_cult_catcher" || npc.id === "swamp_cultist_blade") {
    if (npcState?.status === "dead" || npcState?.status === "defeated" || npcState?.status === "unconscious") {
      return "/assets/npcs/swamp/cultist_defeated.png";
    }

    return npc.imageUrl ?? FALLBACK_NPC_IMAGE;
  }

  if (npc.id !== "swamp_witch_morveyna") {
    if (npc.id === "hooded_bandit_01") {
      if (npcState?.status === "dead" || npcState?.status === "defeated" || npcState?.status === "unconscious") {
        return "/assets/npcs/bandits/hooded_bandit_defeated.png";
      }

      if (npcState?.combat && !npcState.combat.isDefeated && npcState.combat.currentHealth < npcState.combat.maxHealth) {
        return "/assets/npcs/bandits/hooded_bandit_combat.png";
      }

      return "/assets/npcs/bandits/hooded_bandit_dialogue.png";
    }

    return npc.imageUrl ?? FALLBACK_NPC_IMAGE;
  }

  if (npcState?.status === "dead" || npcState?.status === "defeated" || npcState?.status === "unconscious") {
    return "/assets/npcs/swamp/morveyna_defeated.png";
  }

  if (npcState?.combat && !npcState.combat.isDefeated && npcState.combat.currentHealth < npcState.combat.maxHealth) {
    return "/assets/npcs/swamp/morveyna_combat.png";
  }

  if ((npcState?.relationship ?? 0) >= 60 || (npcState?.trust ?? 0) >= 70) {
    return "/assets/npcs/swamp/morveyna_friendly.png";
  }

  return npc.imageUrl ?? "/assets/npcs/swamp/morveyna.png";
}

function formatGoldReward(amount: number) {
  return t("event.reward.goldReceived").replace("{amount}", String(amount));
}

function formatItemReward(reward: AppliedItemReward) {
  return t("event.reward.itemReceived")
    .replace("{item}", t(reward.itemNameKey as TranslationKey))
    .replace("{quantity}", String(reward.quantity));
}

function getItemLabel(item: InventoryItem) {
  return t(item.nameKey as TranslationKey);
}

function getItemIconLabel(item: InventoryItem) {
  const label = getItemLabel(item).trim();

  if (label) {
    return label.slice(0, 1).toUpperCase();
  }

  return "?";
}

function getInventoryWeight(items: InventoryItem[]) {
  return items.reduce((total, item) => total + item.weight * item.quantity, 0);
}

function formatGameTime(hour?: number) {
  const safeHour = Number.isFinite(hour) ? Math.max(0, Math.min(23, Math.floor(hour ?? 0))) : 10;

  return `${String(safeHour).padStart(2, "0")}:15`;
}

function formatMerchantTradeText(key: TranslationKey, item: InventoryItem, price: number) {
  return formatTemplate(key, {
    item: getItemLabel(item),
    price,
    quantity: item.quantity,
  });
}

function formatApproximateMerchantPrice(price: number) {
  const range = getApproximateMerchantPrice(price);

  return formatTemplate("merchant.approximatePrice", {
    priceText: `${range.low}-${range.high}`,
  });
}

function getMerchantFailureKey(reason?: string): TranslationKey {
  const keys: Record<string, TranslationKey> = {
    notAccepted: "merchant.error.selectItem",
    noInventory: "merchant.error.unavailable",
    itemUnavailable: "merchant.error.itemUnavailable",
    invalidQuantity: "merchant.error.invalidQuantity",
    insufficientGold: "merchant.error.insufficientGold",
    cannotBuy: "merchant.error.insufficientGold",
    cannotPay: "merchant.error.merchantCannotPay",
    noSpace: "merchant.error.noSpace",
    questItem: "merchant.error.questItem",
  };

  return reason ? keys[reason] ?? "merchant.trade.failed" : "merchant.trade.failed";
}

function getRewardToast(itemRewards: AppliedItemReward[], goldRewards: number[]) {
  if (itemRewards.length > 0) {
    return formatItemReward(itemRewards[0]);
  }

  if (goldRewards.length > 0) {
    return formatGoldReward(goldRewards[0]);
  }

  return "";
}

function formatTemplate(key: TranslationKey, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [token, value]) => text.replace(`{${token}}`, String(value)),
    t(key),
  );
}

function getCombatLog(result: PlayerAttackResult, enemyName: string): CombatLogEntry[] {
  const debugData = {
    d20: result.d20,
    attackTotal: result.attackTotal,
    damage: result.damage,
    critical: result.critical,
    actionType: result.actionType,
    enemyAttack: result.enemyAttack,
  };

  if (!result.ok) {
    const keyByReason: Record<NonNullable<PlayerAttackResult["blockedReason"]>, TranslationKey> = {
      noWeapon: "combat.noWeapon",
      weaponNotEquipped: "combat.weaponNotEquipped",
      notTrained: "combat.notTrained",
      noObjectToThrow: "combat.noObjectToThrow",
      invalidAction: "combat.invalidAction",
    };

    return [
      {
        id: `combat-blocked-${Date.now()}`,
        text: t(keyByReason[result.blockedReason ?? "noWeapon"]),
        variant: "miss",
        debugData,
      },
    ];
  }

  const isManeuver = result.actionType === "shove" || result.actionType === "grapple";
  const resultKey = result.hit
    ? result.critical
      ? "combat.narration.melee.critical"
      : isManeuver
        ? "combat.narration.melee.maneuver"
        : "combat.narration.melee.hit"
    : "combat.narration.melee.miss";
  const entries: CombatLogEntry[] = [
    {
      id: `combat-result-${Date.now()}`,
      text: t(resultKey),
      variant: result.hit ? (result.critical ? "critical" : "hit") : "miss",
      debugData,
    },
  ];

  if (result.enemyDefeated) {
    entries.push({
      id: `combat-defeated-${Date.now()}`,
      text: formatTemplate("combat.narration.melee.defeated", { enemy: enemyName }),
      variant: "critical",
      debugData,
    });
  }

  if (result.enemyAttack) {
    entries.push({
      id: `combat-enemy-result-${Date.now()}`,
      text: t(result.enemyAttack.hit ? "combat.narration.enemy.hit" : "combat.narration.enemy.miss"),
      variant: result.enemyAttack.hit ? "hit" : "miss",
      debugData,
    });

    if (result.enemyAttack.playerDefeated) {
      entries.push({
        id: `combat-barely-${Date.now()}`,
        text: t("combat.defeat"),
        variant: "critical",
        debugData,
      });
    }
  }

  return entries;
}

function getPlayerActionOutcome(result: { ok: boolean; hit?: boolean; critical?: boolean; fumble?: boolean }): CombatActionOutcome {
  if (!result.ok) {
    return "invalid";
  }

  if (result.critical) {
    return "criticalSuccess";
  }

  if (result.fumble) {
    return "criticalFailure";
  }

  return result.hit ? "success" : "miss";
}

function getCombatActionTypeFromRoute(route: "legacy" | "melee" | "ranged" | "magic", result?: { parsedAction?: { intent?: string } }): CombatActionType {
  if (route === "magic") {
    return "magic";
  }

  if (route === "ranged") {
    const intent = result?.parsedAction?.intent;
    return intent === "reload" || intent === "cockWeapon" || intent === "loadAmmo" || intent === "changeAmmo" ? "reload" : "rangedAttack";
  }

  if (route === "melee") {
    const intent = result?.parsedAction?.intent;
    return intent === "defend" || intent === "block" || intent === "parry" || intent === "dodge" || intent === "guard" ? "defend" : "meleeAttack";
  }

  return "meleeAttack";
}

function shouldSpendCombatTurn(result: { ok: boolean; validation?: { ok: boolean }; damage?: number; hit?: boolean; enemyDefeated?: boolean }, actionType: CombatActionType) {
  if (!result.ok) {
    return false;
  }

  return actionType !== "wait";
}

function formatEnemyTurnNarration(enemyName: string, enemyAttack?: EnemyAttackResult) {
  if (!enemyAttack) {
    return formatTemplate("combat.enemyTurn.skipped", { enemy: enemyName });
  }

  if (enemyAttack.playerDefeated) {
    return `${t(enemyAttack.hit ? "combat.narration.enemy.hit" : "combat.narration.enemy.miss")} ${t("combat.defeat")}`;
  }

  return t(enemyAttack.hit ? "combat.narration.enemy.hit" : "combat.narration.enemy.miss");
}

function appendGameMasterOnlyMessage<T extends NpcRuntimeState>(state: T, narrationText: string): T {
  return {
    ...state,
    met: true,
    dialogueHistory: [
      ...state.dialogueHistory,
      {
        id: `gm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        speaker: "game_master",
        text: narrationText,
        createdAt: new Date().toISOString(),
      },
    ].slice(-40),
  };
}

function appendEnemyTurnIfNeeded(params: {
  save: GameSave;
  npcState: NpcInstance;
  playerText: string;
  playerNarration: string;
  activeCombat: CombatState | null;
  enemyName: string;
  context: string;
  shouldRunEnemyTurn: boolean;
}): { save: GameSave; npcState: NpcInstance; enemyAttack: ReturnType<typeof resolveEnemyTurn>["enemyAttack"] | undefined } {
  const playerDialogueState = appendNpcGameMasterMessages(params.npcState, params.playerText, params.playerNarration);

  if (!params.shouldRunEnemyTurn || !params.activeCombat) {
    return {
      save: {
        ...params.save,
        activeCombat: params.activeCombat ?? params.save.activeCombat ?? null,
      },
      npcState: playerDialogueState,
      enemyAttack: undefined,
    };
  }

  const enemyTurn = resolveEnemyTurn(params.save, playerDialogueState, params.activeCombat);
  const enemyAttack = enemyTurn.enemyAttack;

  if (!enemyAttack) {
    return {
      save: {
        ...enemyTurn.save,
        activeCombat: enemyTurn.combatState,
      },
      npcState: playerDialogueState,
      enemyAttack: undefined,
    };
  }

  const enemyNarration = formatEnemyTurnNarration(params.enemyName, enemyAttack);
  const sanitizedEnemyNarration = sanitizeAiResponseForWorld({
    text: enemyNarration,
    speakerId: "game_master",
    speakerRole: "game_master",
    language: getLanguage(),
    context: params.context,
  });
  const narratedNpcState = appendGameMasterOnlyMessage(playerDialogueState, sanitizedEnemyNarration.cleanText);

  if (enemyAttack.playerDefeated) {
    const defeatResult = resolvePlayerDefeatAfterCombat(enemyTurn.save, narratedNpcState);
    const defeatMessage = formatTemplate(defeatResult.messageKey, {
      count: defeatResult.stolenItems.length,
      gold: defeatResult.stolenGold,
    });
    const nextNpcState = appendGameMasterOnlyMessage(defeatResult.npcInstance, defeatMessage);

    return {
      save: {
        ...defeatResult.save,
        activeCombat: {
          ...enemyTurn.combatState,
          phase: (defeatResult.outcome === "executed" ? "finished" : "defeat") as CombatState["phase"],
          postCombatPhase: "playerDefeated" as PostCombatPhase,
          finishedAt: Date.now(),
        },
      },
      npcState: nextNpcState,
      enemyAttack,
    };
  }

  const nextNpcState = narratedNpcState;

  return {
    save: {
      ...enemyTurn.save,
      activeCombat: enemyAttack.playerDefeated
        ? { ...enemyTurn.combatState, postCombatPhase: "playerDefeated" as PostCombatPhase }
        : enemyTurn.combatState,
    },
    npcState: nextNpcState,
    enemyAttack,
  };
}

function getHealthCondition(current: number, max: number) {
  if (current <= 0) {
    return t("health.dead");
  }

  const ratio = current / Math.max(1, max);

  if (ratio <= 0.25) {
    return t("health.barelyStanding");
  }

  if (ratio <= 0.5) {
    return t("health.badlyWounded");
  }

  if (ratio < 1) {
    return t("health.wounded");
  }

  return t("health.healthy");
}

function formatHealthStatus(label: string, current?: number, max?: number) {
  if (!Number.isFinite(current) || !Number.isFinite(max)) {
    return `${label}: --`;
  }

  return `${label}: ${current}/${max} — ${getHealthCondition(Number(current), Number(max))}`;
}

function getNpcThoughts(npc: NpcDefinition, save: GameSave | null, npcInstance: NpcInstance | null) {
  if (npcInstance?.status === "dead") {
    return [t("thought.npc.dead")];
  }

  if (npcInstance && isPostCombatNpcStatus(npcInstance.status)) {
    return [t("postCombat.npcDefeatedAlive"), t("postCombat.searchAlive")];
  }

  if (npc.role === "bandit") {
    return [
      t("thought.bandit.nervous"),
      save?.inventory?.equipment.mainHand ? t("thought.bandit.weaponReady") : t("thought.bandit.noWeapon"),
      ...(save?.inventory?.equipment.mainHand
        ? []
        : [t("thought.combat.unarmedOptions"), t("thought.combat.stonesNearby"), t("thought.combat.canShove")]),
      t("thought.bandit.canNegotiate"),
      t("thought.bandit.canFlee"),
    ];
  }

  if (npc.role === "monster") {
    return [
      t("thought.monster.watch"),
      t("thought.monster.noTalk"),
      ...(save?.inventory?.equipment.mainHand ? [] : [t("thought.combat.unarmedOptions"), t("thought.combat.stonesNearby")]),
      t("thought.bandit.canFlee"),
    ];
  }

  if (npc.role === "guard") {
    return [t("thought.guard.watches"), t("thought.guard.clothes"), t("thought.guard.askClothes")];
  }

  if (npc.role === "merchant") {
    return [t("thought.merchant.inventory"), t("thought.merchant.haggle"), t("thought.merchant.memory")];
  }

  if (npc.role === "trainer") {
    return [t("thought.trainer.training"), t("thought.trainer.guides"), t("thought.trainer.costs")];
  }

  if (npc.role === "ruler" || npc.role === "noble" || npc.role === "mage" || npc.role === "priest" || npc.role === "military" || npc.role === "scholar" || npc.role === "blacksmith") {
    return [t("thought.royalCourt.memory"), t("thought.royalCourt.knowledge"), t("thought.royalCourt.problem")];
  }

  return [t("thought.npc.present"), t("event.hint.typeAction")];
}

function findEquippedItem(save: GameSave | null, slotIds: string[]) {
  const equipment = save?.inventory?.equipment;
  const items = save?.inventory?.items ?? [];
  const equippedId = slotIds.map((slotId) => equipment?.[slotId as keyof typeof equipment]).find(Boolean);

  if (!equippedId) {
    return undefined;
  }

  return items.find((item) => item.id === equippedId || item.instanceId === equippedId);
}

function hasRangedAmmo(save: GameSave | null, weaponType?: string) {
  const inventory = save?.inventory?.items ?? [];
  const ammoTemplateIds = weaponType?.includes("Crossbow")
    ? ["common_crossbow_bolt", "armor_piercing_bolt", "broadhead_bolt", "fire_bolt", "poison_bolt"]
    : ["simple_arrows", "armor_piercing_arrows"];

  return inventory.some((item) => ammoTemplateIds.includes(item.templateId) && item.quantity > 0);
}

function createFallbackCombatant(
  save: GameSave | null,
  npcInstance: NpcInstance | null,
  side: "player" | "enemy",
): CombatantState | undefined {
  if (side === "player") {
    const player = save?.player;

    if (!player) {
      return undefined;
    }

    const maxHp = player.combat?.maxHealth ?? player.derivedStats?.health ?? 1;
    const currentHp = player.combat?.currentHealth ?? maxHp;
    const maxMana = player.magic?.maxMana ?? 0;
    const currentMana = player.magic?.mana ?? 0;
    const maxStamina = player.textCombat?.maxStamina ?? player.derivedStats?.stamina ?? 0;
    const currentStamina = player.textCombat?.stamina ?? maxStamina;

    return {
      id: player.id,
      side: "player",
      entityType: "player",
      currentHp,
      maxHp,
      currentMana,
      maxMana,
      currentStamina,
      maxStamina,
      armorClass: player.combat?.armorClass ?? player.derivedStats?.armorClass ?? 10,
      initiative: player.combat?.initiative ?? 0,
      dexterityModifier: 0,
      alive: currentHp > 0,
      conscious: currentHp > 0,
      canAct: currentHp > 0,
      lifeState: currentHp > 0 ? "active" : "defeated",
      distance: player.textCombat?.distance,
      cover: player.textCombat?.ranged?.cover,
      statuses: [],
    };
  }

  if (!npcInstance?.combat) {
    return undefined;
  }

  return {
    id: npcInstance.instanceId,
    side: "enemy",
    entityType: npcInstance.role === "monster" ? "monster" : "npc",
    templateId: npcInstance.templateId,
    instanceId: npcInstance.instanceId,
    currentHp: npcInstance.combat.currentHealth,
    maxHp: npcInstance.combat.maxHealth,
    currentMana: 0,
    maxMana: 0,
    currentStamina: 0,
    maxStamina: 0,
    armorClass: npcInstance.combat.armorClass,
    initiative: 0,
    dexterityModifier: 0,
    alive: npcInstance.status !== "dead" && npcInstance.combat.currentHealth > 0,
    conscious: npcInstance.status === "alive" && npcInstance.combat.currentHealth > 0,
    canAct: npcInstance.status === "alive" && npcInstance.combat.currentHealth > 0,
    lifeState: getNpcLifeState(npcInstance),
    distance: npcInstance.textCombat?.distance,
    statuses: [],
  };
}

function buildCombatThoughtHintContext(save: GameSave | null, npcInstance: NpcInstance | null): CombatHintContext | null {
  const activeCombat = save?.activeCombat;
  const playerCombatant = save?.player.id
    ? activeCombat?.combatants[save.player.id] ?? createFallbackCombatant(save, npcInstance, "player")
    : createFallbackCombatant(save, npcInstance, "player");
  const enemyCombatant = npcInstance?.instanceId
    ? activeCombat?.combatants[npcInstance.instanceId] ?? createFallbackCombatant(save, npcInstance, "enemy")
    : createFallbackCombatant(save, npcInstance, "enemy");

  if (!save || !playerCombatant || (!enemyCombatant && !activeCombat?.postCombatPhase)) {
    return null;
  }

  const rangedWeapon = getEquippedRangedWeapon(save);
  const mainWeapon = findEquippedItem(save, ["mainHand", "primaryWeapon", "secondaryWeapon"]);
  const equippedWeapon = rangedWeapon ?? mainWeapon;
  const rangedWeaponCategory = getRangedWeaponCategory(rangedWeapon);
  const equippedRangedWeapons = rangedWeapon ? [rangedWeapon] : [];
  const rangedState = normalizePlayerRangedCombatState(save.player.textCombat?.ranged, equippedRangedWeapons);
  const weaponState = rangedWeapon ? getWeaponState(rangedState, rangedWeapon) : undefined;
  const magic = save.player.magic;

  return {
    phase: activeCombat?.phase ?? "awaitingPlayerAction",
    player: playerCombatant,
    target: enemyCombatant,
    equippedWeapon,
    offhandItem: findEquippedItem(save, ["shield", "offHand"]),
    knownMagicWordIds: magic?.knownWords.map((word) => word.wordId) ?? [],
    availableFormulaIds: magic?.knownSpellFormulas.map((formula) => formula.spellId) ?? [],
    distance: save.player.textCombat?.distance ?? playerCombatant.distance ?? enemyCombatant?.distance,
    cover: save.player.textCombat?.ranged?.cover ?? playerCombatant.cover,
    postCombatState: activeCombat?.postCombatPhase === "none"
      ? undefined
      : activeCombat?.postCombatPhase ?? npcInstance?.status,
    activeCombatantId: activeCombat?.activeCombatantId,
    rangedWeaponLoaded: weaponState ? weaponState.loaded && weaponState.cocked && !weaponState.jammed : undefined,
    hasAmmo: rangedWeaponCategory ? hasRangedAmmo(save, rangedWeaponCategory) : undefined,
  };
}

function getCombatThoughtHints(save: GameSave | null, npcInstance: NpcInstance | null) {
  const context = buildCombatThoughtHintContext(save, npcInstance);

  return context ? generateCombatThoughtHints(context) : [];
}

function getAnarielIntroThoughts() {
  return [
    t("thought.anariel.afraid"),
    t("thought.anariel.chains"),
    t("thought.anariel.choice"),
  ];
}

const COMBAT_INTENT_TYPES = new Set<PlayerIntent["type"]>([
  "attack",
  "attack_with_equipped_weapon",
  "unarmed_attack",
  "kick",
  "shove",
  "grapple",
  "throw_object",
  "improvised_attack",
]);

function isCombatIntent(intent: PlayerIntent) {
  return COMBAT_INTENT_TYPES.has(intent.type);
}

function isTextCombatScene(npc: NpcDefinition, npcInstance: NpcInstance | null) {
  return Boolean(npcInstance?.combat || npc.role === "bandit" || npc.role === "monster" || npc.role === "guard");
}

function hasThrowableEnvironmentObject(event: ReturnType<typeof getDynamicEvent>, objectHint?: PlayerAttackAction["objectHint"]) {
  if (objectHint === "stone") {
    return event?.type === "bandit" || event?.type === "beast" || event?.type === "necropolis";
  }

  return event?.type === "bandit" || event?.type === "beast" || event?.type === "merchant" || event?.type === "necropolis";
}

function getCombatActionForIntent(
  intent: PlayerIntent,
  event: ReturnType<typeof getDynamicEvent>,
): PlayerAttackAction {
  if (intent.type === "attack_with_equipped_weapon") {
    return { type: "weapon" };
  }

  if (intent.type === "unarmed_attack" || intent.type === "kick" || intent.type === "shove" || intent.type === "grapple") {
    if (intent.type === "unarmed_attack") {
      return { type: "unarmed" };
    }

    return { type: intent.type };
  }

  if (intent.type === "throw_object") {
    const objectHint = intent.objectHint ?? "stone";

    return {
      type: "throw_object",
      objectHint,
      objectAvailable: hasThrowableEnvironmentObject(event, objectHint),
    };
  }

  if (intent.type === "improvised_attack") {
    const objectHint = intent.objectHint ?? "item";

    return {
      type: "improvised",
      objectHint,
      objectAvailable: hasThrowableEnvironmentObject(event, objectHint),
    };
  }

  return { type: "auto" };
}

function formatStatusRatio(current?: number, max?: number) {
  const safeCurrent = Number.isFinite(current) ? Number(current) : 0;
  const safeMax = Number.isFinite(max) ? Number(max) : 0;

  return `${safeCurrent}/${safeMax}`;
}

function getTopStatusIndicators(save: GameSave | null, npcState: NpcInstance | null, npcDefinition: NpcDefinition | null): TopStatusIndicatorData[] {
  const textCombat = save?.player.textCombat;
  const magic = save?.player.magic;
  const combat = save?.player.combat;
  const emptyValue = t("hud.empty");
  const enemyCombat = npcState?.combat;
  const enemyHealthValue = enemyCombat
    ? `${Math.max(0, enemyCombat.currentHealth)}/${enemyCombat.maxHealth} · ${t(`postCombat.lifeState.${getNpcLifeState(npcState)}` as TranslationKey)}`
    : emptyValue;

  return [
    {
      id: "health",
      label: t("hud.health"),
      value: formatStatusRatio(combat?.currentHealth, combat?.maxHealth),
      icon: "HP",
    },
    {
      id: "enemyHealth",
      label: npcDefinition ? t(npcDefinition.nameKey) : t("hud.enemyHealth"),
      value: enemyHealthValue,
      icon: "EN",
    },
    {
      id: "mana",
      label: t("hud.mana"),
      value: formatStatusRatio(magic?.mana, magic?.maxMana),
      icon: "MP",
    },
    {
      id: "stamina",
      label: t("hud.stamina"),
      value: textCombat ? formatStatusRatio(textCombat.stamina, textCombat.maxStamina) : emptyValue,
      icon: "ST",
    },
    {
      id: "distance",
      label: t("hud.distance"),
      value: textCombat ? t(`textCombat.distance.${textCombat.distance}` as TranslationKey) : emptyValue,
      icon: "D",
    },
    {
      id: "cover",
      label: t("hud.cover"),
      value: textCombat?.ranged ? t(`rangedCombat.cover.${textCombat.ranged.cover}` as TranslationKey) : emptyValue,
      icon: "C",
    },
    {
      id: "relationship",
      label: t("hud.relationship"),
      value: npcState?.relationship ?? 0,
      icon: "R",
    },
    {
      id: "trust",
      label: t("hud.trust"),
      value: npcState?.trust ?? 0,
      icon: "T",
    },
    {
      id: "fear",
      label: t("hud.fear"),
      value: npcState?.fear ?? 0,
      icon: "F",
    },
    {
      id: "hostility",
      label: t("hud.hostility"),
      value: npcState?.hostility ?? 0,
      icon: "H",
    },
  ];
}

export function EventScene({ onBackToMenu, onOpenCityMap, onOpenWorldMap, onOpenSwampMap, onOpenInventory, onOpenJournal, onOpenSettings }: EventSceneProps) {
  const loadedSave = loadGame();
  const aiStatus = getAIStatus();
  const aiMockNotice = aiStatus.mode === "backend"
    ? `${t("ai.status.backendLabel")}: ${t("ai.backendMockWarning")}`
    : aiStatus.mode === "mock"
      ? `${t("ai.status.mockLabel")}: ${t("ai.mockWarning")}`
      : "";
  const dynamicEvent = getDynamicEvent(loadedSave);
  const activeNpcTemplateId = loadedSave?.activeEvent?.npcTemplateId ?? loadedSave?.activeEvent?.npcId ?? dynamicEvent?.npcId;
  const activeNpc = activeNpcTemplateId ? getNpcById(activeNpcTemplateId) : null;
  const [dialogueKey, setDialogueKey] = useState<TranslationKey>(
    dynamicEvent?.descriptionKey ?? ANARIEL_INTRO_EVENT.dialogueInitialKey,
  );
  const [interactionMode] = useState<EventInteractionMode>(ANARIEL_INTRO_EVENT.interactionMode);
  const [introStep, setIntroStep] = useState<EventIntroStep>("initial");
  const [chatSave, setChatSave] = useState<GameSave | null>(() => loadedSave);
  const [isAnarielChatOpen, setIsAnarielChatOpen] = useState(false);
  const [anarielChatInput, setAnarielChatInput] = useState("");
  const [isAnarielThinking, setIsAnarielThinking] = useState(false);
  const [anarielChatNotice, setAnarielChatNotice] = useState("");
  const [isNpcChatOpen, setIsNpcChatOpen] = useState(false);
  const [npcChatInput, setNpcChatInput] = useState("");
  const [isNpcThinking, setIsNpcThinking] = useState(false);
  const [npcChatNotice, setNpcChatNotice] = useState("");
  const [eventResultKey, setEventResultKey] = useState<TranslationKey | "">("");
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [rewardToast, setRewardToast] = useState("");
  const [draggedTradeItem, setDraggedTradeItem] = useState<DraggedTradeItem | null>(null);
  const [tradeMode, setTradeMode] = useState<TradeMode>("buy");
  const [openGuideId, setOpenGuideId] = useState<ContextGuideId | null>(null);
  const hasRequestedInitialIntroGreeting = useRef(false);
  const currentChatSave = chatSave ?? loadedSave;
  const showAnarielCompanionPanel = isAnarielActiveCompanion(currentChatSave);
  const activeAnarielState = currentChatSave?.companions?.anariel;
  const isAnarielIntroEvent = currentChatSave?.activeEvent?.eventId === "anariel_intro" && activeAnarielState?.introEventSeen === false;
  const anarielDialogueHistory = activeAnarielState?.dialogueHistory ?? [];
  const isStandingStep = introStep === "standing";
  const introEvent = ANARIEL_INTRO_EVENT;
  const activeNpcInstanceId = currentChatSave?.activeEvent?.npcInstanceId ?? activeNpc?.id;
  const npcState = activeNpc ? getNpcInstance(currentChatSave, activeNpc, activeNpcInstanceId) : null;
  const speakerImage = dynamicEvent
    ? getEventNpcImage(activeNpc ?? null, npcState)
    : isStandingStep
      ? introEvent.standingImage
      : introEvent.speakerImage;
  const anarielPortraitImage = isAnarielIntroEvent
    ? speakerImage
    : getAnarielImageForCurrentState(currentChatSave);
  const choices = isStandingStep ? introEvent.standingChoices : introEvent.choices;
  const isMerchantScene = dynamicEvent?.type === "merchant" && activeNpc?.role === "merchant";
  const isGateScene = dynamicEvent?.type === "gate" && activeNpc?.role === "guard";
  const sceneMode = isMerchantScene ? "merchant" : isGateScene ? "gate" : "dialogue";
  const sceneLocationId = dynamicEvent && isLocationEvent(dynamicEvent) ? dynamicEvent.locationId : undefined;
  const sceneAssetDefinition = getSceneAssetDefinition(activeNpcInstanceId, sceneLocationId, sceneMode);
  const dynamicLocationId = dynamicEvent && isLocationEvent(dynamicEvent) ? dynamicEvent.locationId : undefined;
  const dynamicCityId =
    dynamicLocationId === "western_great_city" || dynamicLocationId === "central_settlement"
      ? dynamicLocationId
      : undefined;
  const currentCityAccessStatus = dynamicCityId
    ? currentChatSave?.cityAccess?.[dynamicCityId]?.status
    : undefined;
  const canEnterCity = Boolean(isGateScene && dynamicCityId && currentCityAccessStatus === "allowed");
  const merchantState = isMerchantScene && activeNpc ? getMerchantState(currentChatSave, activeNpc.id) : null;
  const trainerStatus = activeNpc ? getTrainerStatus(currentChatSave, activeNpc.id) : { trainer: undefined, nextTier: undefined, learnedTiers: [], cost: undefined };
  const isBlacksmithScene = dynamicEvent?.type === "npc" && activeNpc?.role === "blacksmith";
  const trainingActionsUnlocked = Boolean(activeNpc && hasAcceptedTrainerAgreement(currentChatSave, activeNpc.id));
  const smithingStatus = getSmithingProgression(currentChatSave);
  const activeMerchantDeal = merchantState?.activeDeal;
  const activeMerchantDealItem = activeMerchantDeal
    ? activeMerchantDeal.side === "player_sells"
      ? currentChatSave?.inventory?.items.find((item) => item.id === activeMerchantDeal.itemInstanceId)
      : merchantState?.items.find((item) => item.id === activeMerchantDeal.itemInstanceId)
    : undefined;
  const npcHistory = npcState?.dialogueHistory ?? [];
  const npcSceneMessages: SceneDialogueMessage[] = [
    ...npcHistory.map((message) => ({
      id: message.id,
      speaker: message.speaker,
      text: message.text,
      speakerName:
        message.speaker === "player"
          ? currentChatSave?.player.name ?? t("traveler")
          : message.speaker === "game_master"
            ? t("gameMaster.narration")
            : message.speaker === "combat"
              ? t("sceneDialogue.combatLog")
              : message.speaker === "system"
                ? t("sceneDialogue.system")
                : activeNpc
                  ? t(activeNpc.nameKey)
                  : t("sceneDialogue.npc"),
    })),
    ...combatLog.map((entry) => ({
      id: entry.id,
      speaker: "combat" as const,
      text: entry.text,
      speakerName: t("sceneDialogue.combatLog"),
    })),
  ];
  const anarielSceneMessages: SceneDialogueMessage[] = anarielDialogueHistory.map((message) => ({
    id: message.id,
    speaker: message.speaker === "player" ? "player" : "npc",
    text: message.text,
    speakerName: message.speaker === "player" ? currentChatSave?.player.name ?? t("traveler") : t("companion.anariel.name"),
  }));
  const isNpcDead = npcState?.status === "dead";
  const isNpcDefeatedAlive = Boolean(npcState && isPostCombatNpcStatus(npcState.status));
  const isNpcGone = npcState?.status === "gone" || npcState?.status === "escaped";
  const isPlayerDead = currentChatSave?.player.lifeState === "dead" || (currentChatSave?.player.combat?.currentHealth ?? 1) <= 0;
  const isPlayerDefeated = !isPlayerDead && (
    currentChatSave?.player.lifeState === "defeated" ||
    currentChatSave?.player.lifeState === "robbed" ||
    currentChatSave?.activeCombat?.postCombatPhase === "playerDefeated"
  );
  const sceneCombat = currentChatSave?.activeCombat?.combatants[npcState?.instanceId ?? ""]
    ? currentChatSave.activeCombat
    : null;
  const combatInputPolicy = getCombatInputPolicy({
    hasCombatScene: Boolean(activeNpc && isTextCombatScene(activeNpc, npcState)),
    canUseNpcDialogue: Boolean(activeNpc?.canUseAiDialogue && !isNpcDead && !isNpcGone),
    targetActive: Boolean(npcState && npcState.status === "alive" && !npcState.combat?.isDefeated),
    playerCanAct: Boolean(currentChatSave && !isPlayerDead && !isPlayerDefeated),
    combatPhase: sceneCombat?.phase,
    activeCombatantId: sceneCombat?.activeCombatantId,
    playerId: currentChatSave?.player.id,
  });
  const isRags = (currentChatSave?.player.currentOutfitStage ?? "rags") === "rags";
  const playerInventoryItems = currentChatSave?.inventory?.items ?? [];
  const playerGold = currentChatSave?.inventory?.gold ?? 0;
  const playerWeight = getInventoryWeight(playerInventoryItems);
  const playerMaxWeight = currentChatSave?.inventory?.maxCarryWeight ?? 70;
  const equippedItemIds = new Set(Object.values(currentChatSave?.inventory?.equipment ?? {}).filter(Boolean));
  const topStatusIndicators = getTopStatusIndicators(currentChatSave, npcState, activeNpc ?? null);
  const combatThoughtHints = getCombatThoughtHints(currentChatSave, npcState);
  const visibleTradeItems = tradeMode === "buy" ? merchantState?.items ?? [] : playerInventoryItems;
  const visibleTradeSide: MerchantDealSide = tradeMode === "buy" ? "player_buys" : "player_sells";
  const visibleTradeTitle = tradeMode === "buy" ? t("merchant.ui.merchantInventory") : t("merchant.ui.playerInventory");
  const visibleTradeGold = tradeMode === "buy" ? merchantState?.gold ?? 0 : playerGold;
  const visibleTradeEmptyKey: TranslationKey = tradeMode === "buy" ? "merchant.ui.noMerchantGoods" : "merchant.ui.noSellableItems";

  useEffect(() => {
    if (openGuideId && !getContextGuideItem(currentChatSave, openGuideId)) {
      setOpenGuideId(null);
    }
  }, [currentChatSave, openGuideId]);

  useEffect(() => {
    setOpenGuideId(null);
  }, [currentChatSave?.activeEvent?.eventId, currentChatSave?.activeEvent?.npcInstanceId]);

  const handleMarkGuideRead = (guideId: ContextGuideId) => {
    if (!currentChatSave) {
      return;
    }

    const nextSave = markGuideRead(currentChatSave, guideId);

    if (nextSave !== currentChatSave) {
      saveGame(nextSave);
      setChatSave(nextSave);
    }
  };

  const renderGuideHeaderActions = () => (
    <>
      <ContextGuideButton
        guideId={MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID}
        save={currentChatSave}
        isOpen={openGuideId === MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID}
        onToggle={() =>
          setOpenGuideId((currentGuideId) =>
            currentGuideId === MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID ? null : MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID,
          )
        }
      />
      <ContextGuideButton
        guideId={ARCHERY_BASICS_GUIDE_ITEM_ID}
        save={currentChatSave}
        isOpen={openGuideId === ARCHERY_BASICS_GUIDE_ITEM_ID}
        onToggle={() =>
          setOpenGuideId((currentGuideId) =>
            currentGuideId === ARCHERY_BASICS_GUIDE_ITEM_ID ? null : ARCHERY_BASICS_GUIDE_ITEM_ID,
          )
        }
      />
      <ContextGuideButton
        guideId={CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID}
        save={currentChatSave}
        isOpen={openGuideId === CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID}
        onToggle={() =>
          setOpenGuideId((currentGuideId) =>
            currentGuideId === CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID ? null : CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID,
          )
        }
      />
      <ContextGuideButton
        guideId={MAGIC_APPRENTICE_GUIDE_ITEM_ID}
        save={currentChatSave}
        isOpen={openGuideId === MAGIC_APPRENTICE_GUIDE_ITEM_ID}
        onToggle={() =>
          setOpenGuideId((currentGuideId) =>
            currentGuideId === MAGIC_APPRENTICE_GUIDE_ITEM_ID ? null : MAGIC_APPRENTICE_GUIDE_ITEM_ID,
          )
        }
      />
    </>
  );

  const renderGuidePanels = () => (
    <div className="magic-guide-access">
      <ContextGuideSidePanel
        guideId={MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID}
        save={currentChatSave}
        isOpen={openGuideId === MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID}
        onClose={() => setOpenGuideId(null)}
        onMarkRead={handleMarkGuideRead}
      />
      <ContextGuideSidePanel
        guideId={ARCHERY_BASICS_GUIDE_ITEM_ID}
        save={currentChatSave}
        isOpen={openGuideId === ARCHERY_BASICS_GUIDE_ITEM_ID}
        onClose={() => setOpenGuideId(null)}
        onMarkRead={handleMarkGuideRead}
      />
      <ContextGuideSidePanel
        guideId={CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID}
        save={currentChatSave}
        isOpen={openGuideId === CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID}
        onClose={() => setOpenGuideId(null)}
        onMarkRead={handleMarkGuideRead}
      />
      <ContextGuideSidePanel
        guideId={MAGIC_APPRENTICE_GUIDE_ITEM_ID}
        save={currentChatSave}
        isOpen={openGuideId === MAGIC_APPRENTICE_GUIDE_ITEM_ID}
        onClose={() => setOpenGuideId(null)}
        onMarkRead={handleMarkGuideRead}
      />
    </div>
  );

  const insertThoughtSuggestion = (hint: CombatThoughtHint) => {
    const example = hint.exampleKey ? t(hint.exampleKey as TranslationKey) : hint.exampleCommand;

    if (!example) {
      return;
    }

    setNpcChatInput(example);
  };

  const renderThoughtPanel = () => {
    if (combatThoughtHints.length > 0) {
      return combatThoughtHints.map((hint) => {
        const example = hint.exampleKey ? t(hint.exampleKey as TranslationKey) : hint.exampleCommand;

        return (
          <p className="event-thought-hint" key={hint.id}>
            <span>{t(hint.textKey as TranslationKey)}</span>
            {example ? (
              <button
                className="event-thought-hint__example"
                type="button"
                onClick={() => insertThoughtSuggestion(hint)}
                aria-label={formatTemplate("thought.combatHint.insertAria", { command: example })}
              >
                {example}
              </button>
            ) : null}
          </p>
        );
      });
    }

    return activeNpc
      ? getNpcThoughts(activeNpc, currentChatSave, npcState).map((thought) => <p key={thought}>{thought}</p>)
      : null;
  };

  const renderNpcLootPanel = () => {
    const loot = npcState?.loot;

    if (!loot?.searched || (!loot.items.length && loot.gold <= 0)) {
      return null;
    }

    return (
      <aside className="post-combat-loot-panel" aria-label={t("postCombat.loot.title")}>
        <header>
          <h2>{t("postCombat.loot.title")}</h2>
          <button className="merchant-confirm-button" type="button" onClick={handleTakeAllNpcLoot} disabled={loot.items.length === 0}>
            {t("postCombat.loot.takeAll")}
          </button>
        </header>
        <div className="post-combat-loot-grid">
          {loot.items.map((item) => (
            <button className="merchant-item-card post-combat-loot-item" type="button" key={item.id} onClick={() => handleTakeNpcLootItem(item.id)}>
              <span className="merchant-item-icon" aria-hidden="true">
                {item.iconUrl ? (
                  <img
                    src={item.iconUrl}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                    }}
                  />
                ) : null}
                <span>{getItemIconLabel(item)}</span>
              </span>
              <strong>{getItemLabel(item)}</strong>
              <span>{formatTemplate("merchant.ui.itemMetaDetailed", { quantity: item.quantity, value: item.value, weight: item.weight })}</span>
            </button>
          ))}
        </div>
      </aside>
    );
  };
  const merchantCanConfirmDeal = activeMerchantDeal?.dealState === "accepted";
  const trainerCanTrain = Boolean(trainingActionsUnlocked && trainerStatus.trainer && trainerStatus.nextTier && !isNpcDead && !isNpcGone);
  const shouldShowTrainerActions = Boolean(trainingActionsUnlocked && trainerStatus.trainer);
  const shouldShowBlacksmithActions = Boolean(trainingActionsUnlocked && isBlacksmithScene);
  const smithingJob = smithingStatus.currentJob;
  const smithingStageGoal = smithingJob ? smithingStageGoals[smithingJob.stage] : 0;

  useEffect(() => {
    if (!activeNpc || !npcState) {
      return;
    }

    console.info("[NPC] Using instance", {
      instanceId: npcState.instanceId,
      templateId: npcState.templateId,
      status: npcState.status,
    });
  }, [activeNpc?.id, npcState?.instanceId, npcState?.status]);

  useEffect(() => {
    if (!dynamicEvent) {
      return;
    }

    console.info("[SceneAssets] resolved", {
      npcInstanceId: activeNpcInstanceId,
      locationId: sceneLocationId,
      sceneMode,
      backgroundUrl: sceneAssetDefinition?.backgroundUrl ?? dynamicEvent.backgroundImage,
    });
  }, [activeNpcInstanceId, dynamicEvent?.id, sceneAssetDefinition?.backgroundUrl, sceneLocationId, sceneMode]);

  useEffect(() => {
    console.info("[CityGate] enter button state", {
      cityId: dynamicCityId,
      sceneMode,
      accessStatus: currentCityAccessStatus,
      canEnterCity,
    });
  }, [dynamicCityId, sceneMode, currentCityAccessStatus, canEnterCity]);

  useEffect(() => {
    if (currentChatSave?.activeEvent?.eventId !== "anariel_intro") {
      return;
    }

    console.info("[AnarielIntro] open", {
      introEventSeen: activeAnarielState?.introEventSeen,
      status: activeAnarielState?.status,
    });

    if (activeAnarielState?.introEventSeen) {
      console.warn("[AnarielIntro] blocked duplicate intro");
      onOpenWorldMap();
    }
  }, [activeAnarielState?.introEventSeen, activeAnarielState?.status, currentChatSave?.activeEvent?.eventId, onOpenWorldMap]);

  useEffect(() => {
    const sourceSave = currentChatSave;
    const sourceAnariel = sourceSave?.companions?.anariel;

    if (
      !isAnarielIntroEvent ||
      !sourceSave ||
      !sourceAnariel ||
      sourceAnariel.dialogueHistory.length > 0 ||
      hasRequestedInitialIntroGreeting.current
    ) {
      return;
    }

    hasRequestedInitialIntroGreeting.current = true;
    setIsAnarielChatOpen(true);
    setIsAnarielThinking(true);
    console.info("[AnarielIntro] initial AI greeting requested");

    const language = getLanguage();
    const initialGreetingPrompt = language === "en"
      ? "The player meets Anariel for the first time. Say a short opening line as Anariel."
      : "Игрок впервые встретил Анариэль. Скажи короткую стартовую реплику от лица Анариэль.";

    void requestAIDialogue({
      actorId: "anariel",
      actorName: t("companion.anariel.name"),
      actorRole: "companion",
      locationId: sourceSave.activeEvent?.eventId,
      playerText: initialGreetingPrompt,
      recentMessages: [],
      gameContext: {
        language,
        scene: "anariel_intro",
        requestType: "initial_greeting",
      },
    }).then((aiReply) => {
      const parsedReply = parseAiGameCommands(aiReply.text);
      const cleanReply = parsedReply.cleanText || t("event.anarielIntro.aiInitialFallback1");
      const sanitizedReply = sanitizeAiResponseForWorld({
        text: cleanReply,
        speakerId: "anariel",
        speakerRole: "companion",
        language: getLanguage(),
        context: "anariel_intro",
      });
      const nextAnariel = appendAnarielMessage(
        sourceAnariel,
        sanitizedReply.cleanText,
      );
      const nextSaveWithDialogue: GameSave = {
        ...sourceSave,
        companions: {
          ...sourceSave.companions,
          anariel: nextAnariel,
        },
      };
      const rewardResult = applyAiRewardCommands(nextSaveWithDialogue, parsedReply.commands, {
        allowedItemIds: getAllowedAnarielRewardIds(true),
        canRewardGold: false,
        source: "anariel_intro_ai",
        authorizedTransfers: [],
      });

      saveGame(rewardResult.save);
      setChatSave(rewardResult.save);
      setRewardToast(getRewardToast(rewardResult.itemRewards, rewardResult.goldRewards));
      setAnarielChatNotice("");
      setIsAnarielThinking(false);
    });
  }, [activeAnarielState?.dialogueHistory.length, currentChatSave, isAnarielIntroEvent]);

  const finishIntro = (status: AnarielCompanionState["status"]) => {
    const save = loadGame();

    if (save) {
      const nextAnarielState = getUpdatedAnarielState(status, save.companions?.anariel);

      saveGame({
        ...save,
        activeEvent: null,
        companions: {
          ...save.companions,
          anariel: nextAnarielState,
        },
      });

      console.info("[AnarielIntro] completed", {
        status: nextAnarielState.status,
        isTravellingWithPlayer: nextAnarielState.isTravellingWithPlayer,
      });
    }

    onOpenWorldMap();
  };

  const returnToWorldMap = () => {
    const save = loadGame();
    const shouldReturnToCityMap = save?.activeEvent?.returnTo === "cityMap";
    const shouldReturnToSwampMap = save?.activeEvent?.returnTo === "swampMap";

    if (save) {
      const pendingTravelTargetId = save.activeEvent?.pendingTravelTargetId;
      if (pendingTravelTargetId) {
        console.info("[TravelEvent] continue", { targetId: pendingTravelTargetId });
      }

      let nextSave: GameSave = {
        ...save,
        activeEvent: null,
        currentLocationId: pendingTravelTargetId ?? save.currentLocationId,
      };

      const activeEvent = save.activeEvent;
      const activeInstanceId = activeEvent?.npcInstanceId;
      const activeInstance = activeInstanceId ? save.npcs?.instances?.[activeInstanceId] : undefined;
      const currentDynamicEvent = getDynamicEvent(save);

      if (activeInstanceId && activeInstance && activeInstance.status === "alive" && currentDynamicEvent && !isLocationEvent(currentDynamicEvent)) {
        nextSave = {
          ...nextSave,
          npcs: {
            ...(nextSave.npcs ?? { instances: {} }),
            instances: {
              ...(nextSave.npcs?.instances ?? {}),
              [activeInstanceId]: setNpcInstanceStatus(activeInstance, "gone"),
            },
          },
        };
      }

      saveGame(nextSave);
    }

    if (shouldReturnToCityMap) {
      onOpenCityMap();
      return;
    }

    if (shouldReturnToSwampMap) {
      onOpenSwampMap();
      return;
    }

    onOpenWorldMap();
  };

  const chooseAction = (action: EventChoiceAction) => {
    if (action === "rescue_anariel") {
      setIntroStep("standing");
      setDialogueKey(introEvent.dialogueStandingKey);
      return;
    }

    if (action === "take_anariel" || action === "start_journey_together") {
      finishIntro("rescued");
      return;
    }

    if (action === "ignore_anariel") {
      finishIntro("ignored");
      return;
    }

    setDialogueKey(getDialogueKey(action));
  };

  const handleGateAttempt = () => {
    setEventResultKey(isRags ? "event.gate.deniedRags" : "event.gate.allowedStub");
  };

  const handleOfferGateHelp = () => {
    const sourceSave = loadGame() ?? currentChatSave;

    if (!sourceSave) {
      return;
    }

    const nextSave = addPlayerGold(sourceSave, 5, "gate_offer_help");

    saveGame(nextSave);
    setChatSave(nextSave);
    setEventResultKey("event.gate.offerHelpResult");
    setRewardToast(formatGoldReward(5));
  };

  const handleAskGateFood = () => {
    const sourceSave = loadGame() ?? currentChatSave;

    if (!sourceSave) {
      return;
    }

    const addResult = addItemToInventory(sourceSave, "stale_bread", 1, "gate_ask_food", {
      itemId: "stale_bread",
      quantity: 1,
      sourceNpcId: activeNpc?.id,
      eventId: sourceSave.activeEvent?.eventId,
      reason: "scripted_story",
      authorized: true,
    });

    saveGame(addResult.save);
    setChatSave(addResult.save);
    setEventResultKey("event.gate.askFoodResult");
    setRewardToast(addResult.reward ? formatItemReward(addResult.reward) : "");
  };

  const handleEnterCity = () => {
    const sourceSave = loadGame() ?? currentChatSave;
    const cityId = dynamicCityId;

    if (!sourceSave || !cityId) {
      return;
    }
    const cityDefinition = cityMapDefinitions[cityId];

    saveGame({
      ...sourceSave,
      activeEvent: null,
      cityState: {
        ...(sourceSave.cityState ?? { discoveredLocationIds: [] }),
        currentCityId: cityId,
        currentCityLocationId: cityDefinition.defaultLocationId,
        discoveredLocationIds: Array.from(
          new Set([...(sourceSave.cityState?.discoveredLocationIds ?? []), cityDefinition.defaultLocationId]),
        ),
      },
      navigationReturnContext: {
        screen: "cityMap",
        cityId,
        locationId: cityDefinition.defaultLocationId,
      },
    });
    onOpenCityMap();
  };

  const saveNpcState = (sourceSave: GameSave, nextNpcState: NpcInstance, activeCombatPhase?: CombatState["postCombatPhase"]) => {
    const nextSave: GameSave = {
      ...sourceSave,
      activeCombat: sourceSave.activeCombat && activeCombatPhase
        ? {
            ...sourceSave.activeCombat,
            postCombatPhase: activeCombatPhase,
          }
        : sourceSave.activeCombat,
      npcs: {
        ...(sourceSave.npcs ?? { instances: {} }),
        templatesKnown: activeNpc
          ? Array.from(new Set([...(sourceSave.npcs?.templatesKnown ?? []), activeNpc.id]))
          : sourceSave.npcs?.templatesKnown,
        instances: {
          ...(sourceSave.npcs?.instances ?? {}),
          [nextNpcState.instanceId]: nextNpcState,
        },
      },
    };

    saveGame(nextSave);
    setChatSave(nextSave);
    setNpcChatInput("");
    setNpcChatNotice("");
    setRewardToast("");
    setCombatLog([]);
    setEventResultKey("");

    return nextSave;
  };

  const appendPostCombatGameMaster = (
    sourceSave: GameSave,
    sourceNpcState: NpcInstance,
    playerText: string,
    messageKey: TranslationKey,
    values: Record<string, string | number> = {},
    phase: CombatState["postCombatPhase"] = getPostCombatPhaseForNpc(sourceNpcState),
  ) => {
    const message = Object.keys(values).length > 0 ? formatTemplate(messageKey, values) : t(messageKey);
    const nextNpcState = appendNpcGameMasterMessages(sourceNpcState, playerText, message);
    saveNpcState(sourceSave, nextNpcState, phase);
    setIsNpcThinking(false);

    return nextNpcState;
  };

  const handleTakeNpcLootItem = (itemInstanceId: string) => {
    const sourceSave = currentChatSave;

    if (!sourceSave || !npcState) {
      return;
    }

    const result = takeNpcLootItem(sourceSave, npcState, itemInstanceId);
    saveGame(result.save);
    setChatSave(result.save);
    setNpcChatNotice(
      result.blockedItems.length > 0
        ? t("postCombat.loot.tooHeavy")
        : result.transferredItems.length > 0
          ? formatTemplate("postCombat.loot.taken", { item: getItemLabel(result.transferredItems[0]) })
          : "",
    );
  };

  const handleTakeAllNpcLoot = () => {
    const sourceSave = currentChatSave;

    if (!sourceSave || !npcState) {
      return;
    }

    const result = takeAllNpcLoot(sourceSave, npcState);
    saveGame(result.save);
    setChatSave(result.save);
    setNpcChatNotice(
      result.blockedItems.length > 0
        ? t("postCombat.loot.someTooHeavy")
        : formatTemplate("postCombat.loot.takenAll", { count: result.transferredItems.length }),
    );
  };

  const handlePostCombatMessage = (playerText: string) => {
    const sourceSave = currentChatSave;

    if (!sourceSave || !activeNpc || !npcState) {
      return false;
    }

    const intent = classifyPostCombatIntent(playerText);
    const playerDead = sourceSave.player.lifeState === "dead" || (sourceSave.player.combat?.currentHealth ?? 1) <= 0;
    const playerDefeated =
      !playerDead &&
      (sourceSave.player.lifeState === "defeated" ||
        sourceSave.player.lifeState === "robbed" ||
        sourceSave.activeCombat?.postCombatPhase === "playerDefeated");
    const postCombatPhase = getPostCombatPhaseForNpc(npcState, playerDefeated || playerDead);

    if (postCombatPhase === "none") {
      return false;
    }

    if (playerDead) {
      appendPostCombatGameMaster(sourceSave, npcState, playerText, "gameOver.description", {}, "playerDefeated");
      return true;
    }

    if (intent === "leave") {
      appendPostCombatGameMaster(sourceSave, npcState, playerText, "postCombat.leave", {}, "exit");
      window.setTimeout(returnToWorldMap, 250);
      return true;
    }

    if (intent === "execute") {
      if (npcState.status === "dead") {
        appendPostCombatGameMaster(sourceSave, npcState, playerText, "postCombat.alreadyDead", {}, "enemyDead");
        return true;
      }

      if (isPostCombatNpcStatus(npcState.status)) {
        const executedNpc = markNpcExecutedAfterCombat(npcState);
        appendPostCombatGameMaster(sourceSave, executedNpc, playerText, "postCombat.executed", {}, "enemyDead");
        return true;
      }
    }

    if (intent === "searchCorpse") {
      if (npcState.status !== "dead") {
        appendPostCombatGameMaster(sourceSave, npcState, playerText, "postCombat.searchAlive", {}, postCombatPhase);
        return true;
      }

      const searchedNpc = ensureNpcLoot(npcState, true, sourceSave);
      appendPostCombatGameMaster(sourceSave, searchedNpc, playerText, "postCombat.loot.opened", {}, "loot");
      return true;
    }

    if (intent === "takeAllLoot") {
      if (npcState.status !== "dead") {
        appendPostCombatGameMaster(sourceSave, npcState, playerText, "postCombat.searchAlive", {}, postCombatPhase);
        return true;
      }

      const result = takeAllNpcLoot(sourceSave, ensureNpcLoot(npcState, true, sourceSave));
      const nextNpcState = appendNpcGameMasterMessages(
        result.npcInstance,
        playerText,
        formatTemplate("postCombat.loot.takenAll", { count: result.transferredItems.length }),
      );
      const nextSave = saveNpcState(result.save, nextNpcState, "loot");
      saveGame(nextSave);
      setIsNpcThinking(false);
      return true;
    }

    if (intent === "demandItem" && isPostCombatNpcStatus(npcState.status)) {
      const npcWithLoot = ensureNpcLoot(npcState, false, sourceSave);
      const offeredItem = npcWithLoot.loot?.items[0];

      if (!offeredItem) {
        appendPostCombatGameMaster(sourceSave, npcWithLoot, playerText, "postCombat.demand.empty", {}, postCombatPhase);
        return true;
      }

      const result = takeNpcLootItem(sourceSave, npcWithLoot, offeredItem.id);
      const nextNpcState = appendNpcDialogueMessages(
        {
          ...result.npcInstance,
          status: "surrendered" as const,
          postCombatMemory: {
            ...(result.npcInstance.postCombatMemory ?? {}),
            surrenderedItemIds: [...(result.npcInstance.postCombatMemory?.surrenderedItemIds ?? []), offeredItem.templateId],
            updatedAt: new Date().toISOString(),
          },
        },
        playerText,
        formatTemplate("postCombat.demand.given", { item: getItemLabel(offeredItem) }),
      );
      saveNpcState(result.save, nextNpcState, "dialogue");
      setIsNpcThinking(false);
      return true;
    }

    if (intent === "release" && isPostCombatNpcStatus(npcState.status)) {
      const releasedNpc = appendNpcGameMasterMessages(
        {
          ...npcState,
          status: "gone" as const,
          postCombatMemory: {
            ...(npcState.postCombatMemory ?? {}),
            wasSpared: true,
            updatedAt: new Date().toISOString(),
          },
        },
        playerText,
        t("postCombat.released"),
      );
      saveNpcState(sourceSave, releasedNpc, "exit");
      setIsNpcThinking(false);
      return true;
    }

    if (intent === "bind" && isPostCombatNpcStatus(npcState.status)) {
      const boundNpc = appendNpcGameMasterMessages(
        {
          ...npcState,
          status: "surrendered" as const,
          postCombatMemory: {
            ...(npcState.postCombatMemory ?? {}),
            updatedAt: new Date().toISOString(),
          },
        },
        playerText,
        t("postCombat.bound"),
      );
      saveNpcState(sourceSave, boundNpc, "dialogue");
      setIsNpcThinking(false);
      return true;
    }

    if (npcState.status === "dead") {
      appendPostCombatGameMaster(sourceSave, npcState, playerText, "postCombat.deadGmOnly", {}, "enemyDead");
      return true;
    }

    if (activeNpc.role === "monster") {
      appendPostCombatGameMaster(sourceSave, npcState, playerText, "postCombat.monsterNoDialogue", {}, postCombatPhase);
      return true;
    }

    return !isNpcDialogueAllowedAfterCombat(npcState) ? false : false;
  };

  const beginMerchantDeal = (tradeItem: DraggedTradeItem | null) => {
    const sourceSave = currentChatSave;

    if (!sourceSave || !activeNpc || !npcState || !merchantState || !tradeItem) {
      return;
    }

    const item = tradeItem.side === "player_sells"
      ? sourceSave.inventory?.items.find((inventoryItem) => inventoryItem.id === tradeItem.itemInstanceId)
      : merchantState.items.find((inventoryItem) => inventoryItem.id === tradeItem.itemInstanceId);

    if (!item) {
      setDraggedTradeItem(null);
      setNpcChatNotice(t("merchant.error.itemUnavailable"));
      return;
    }

    if (tradeItem.side === "player_sells" && (item.isQuestItem || item.questItem)) {
      setNpcChatNotice(t("merchant.error.questItem"));
      return;
    }

    const nextMerchant = createMerchantDeal(merchantState, sourceSave.player, item, tradeItem.side, 1, sourceSave.inventory);
    const price = nextMerchant.activeDeal?.merchantOffer ?? 0;
    const playerLine = t(tradeItem.side === "player_sells" ? "merchant.trade.playerOffersSell" : "merchant.trade.playerOffersBuy");
    const merchantLine = formatMerchantTradeText(
      tradeItem.side === "player_sells" ? "merchant.trade.offerSell" : "merchant.trade.offerBuy",
      item,
      price,
    );
    console.info("[MerchantBargain] state", {
      merchantId: merchantState.merchantId,
      side: tradeItem.side,
      itemId: item.templateId,
      quantity: 1,
      approximatePrice: getApproximateMerchantPrice(price),
      relationship: merchantState.relationship,
      trust: merchantState.trust,
    });
    const nextNpcState = appendNpcDialogueMessages(npcState, playerLine, merchantLine);
    const nextSave = upsertMerchant({
      ...sourceSave,
      npcs: {
        ...(sourceSave.npcs ?? { instances: {} }),
        templatesKnown: Array.from(new Set([...(sourceSave.npcs?.templatesKnown ?? []), activeNpc.id])),
        instances: {
          ...(sourceSave.npcs?.instances ?? {}),
          [nextNpcState.instanceId]: nextNpcState,
        },
      },
    }, nextMerchant);

    saveGame(nextSave);
    setChatSave(nextSave);
    setDraggedTradeItem(null);
    setNpcChatNotice("");
  };

  const handleDropTradeItem = () => {
    beginMerchantDeal(draggedTradeItem);
  };

  const handleSelectTradeItem = (side: MerchantDealSide, itemInstanceId: string) => {
    beginMerchantDeal({ side, itemInstanceId });
  };

  const handleChangeTradeMode = (nextMode: TradeMode) => {
    setTradeMode(nextMode);
    setDraggedTradeItem(null);

    if (!currentChatSave || !merchantState?.activeDeal) {
      return;
    }

    const nextSave = upsertMerchant(currentChatSave, {
      ...merchantState,
      activeDeal: undefined,
    });

    saveGame(nextSave);
    setChatSave(nextSave);
    setNpcChatNotice("");
  };

  const handleConfirmMerchantDeal = () => {
    const sourceSave = currentChatSave;

    if (!sourceSave || !activeNpc || !npcState || !merchantState || !activeMerchantDealItem) {
      return;
    }

    const result = confirmMerchantDeal(sourceSave, merchantState);

    if (!result.ok) {
      setNpcChatNotice(t(getMerchantFailureKey(result.reason)));
      return;
    }

    const nextNpcState = appendNpcDialogueMessages(
      npcState,
      t("merchant.ui.confirm"),
      formatMerchantTradeText("merchant.trade.completed", activeMerchantDealItem, merchantState.activeDeal?.merchantOffer ?? 0),
    );
    const nextSave = upsertMerchant({
      ...result.save,
      npcs: {
        ...(result.save.npcs ?? { instances: {} }),
        templatesKnown: Array.from(new Set([...(sourceSave.npcs?.templatesKnown ?? []), activeNpc.id])),
        instances: {
          ...(result.save.npcs?.instances ?? {}),
          [nextNpcState.instanceId]: nextNpcState,
        },
      },
    }, result.merchant);

    saveGame(nextSave);
    setChatSave(nextSave);
    setNpcChatNotice("");
  };

  const handleRefuseMerchantDeal = () => {
    const sourceSave = currentChatSave;

    if (!sourceSave || !activeNpc || !npcState || !merchantState) {
      return;
    }

    const nextMerchant = {
      ...merchantState,
      activeDeal: undefined,
      tradeHistory: [
        ...merchantState.tradeHistory,
        {
          id: `trade_refuse_${Date.now()}`,
          type: "refuse" as const,
          itemId: merchantState.activeDeal?.itemId,
          quantity: merchantState.activeDeal?.quantity,
          price: merchantState.activeDeal?.merchantOffer,
          note: "Player refused merchant deal.",
          createdAt: new Date().toISOString(),
        },
      ].slice(-30),
    };
    const nextNpcState = appendNpcDialogueMessages(npcState, t("merchant.ui.refuse"), t("merchant.trade.cancelled"));
    const nextSave = upsertMerchant({
      ...sourceSave,
      npcs: {
        ...(sourceSave.npcs ?? { instances: {} }),
        instances: {
          ...(sourceSave.npcs?.instances ?? {}),
          [nextNpcState.instanceId]: nextNpcState,
        },
      },
    }, nextMerchant);

    saveGame(nextSave);
    setChatSave(nextSave);
    setNpcChatNotice("");
  };

  const handleTrainerTraining = () => {
    const sourceSave = currentChatSave;

    if (!sourceSave || !activeNpc || !npcState || !trainerStatus.trainer) {
      return;
    }

    const result = applyTrainerTraining(sourceSave, activeNpc.id);
    const tierLabel = result.tier ? t(`trainer.tier.${result.tier}` as TranslationKey) : "";
    const costText = result.ok && result.cost
      ? formatTemplate("trainer.status.cost", { gold: result.cost.gold, skillPoints: result.cost.skillPoints })
      : "";
    const narration = `${t(result.messageKey as TranslationKey)}${tierLabel ? ` ${formatTemplate("trainer.status.completedTier", { tier: tierLabel })}` : ""}${costText ? ` ${costText}` : ""}`;
    const nextNpcState = appendNpcGameMasterMessages(npcState, t("trainer.action.train"), narration);
    const nextSave: GameSave = {
      ...result.save,
      npcs: {
        ...(result.save.npcs ?? { instances: {} }),
        templatesKnown: Array.from(new Set([...(result.save.npcs?.templatesKnown ?? []), activeNpc.id])),
        instances: {
          ...(result.save.npcs?.instances ?? {}),
          [nextNpcState.instanceId]: nextNpcState,
        },
      },
    };

    saveGame(nextSave);
    setChatSave(nextSave);
    setNpcChatNotice(result.ok ? "" : narration);
  };

  const applyBlacksmithResult = (
    sourceSave: GameSave,
    actionText: string,
    resultSave: GameSave,
    message: string,
  ) => {
    if (!activeNpc || !npcState) {
      return;
    }

    const nextNpcState = appendNpcGameMasterMessages(npcState, actionText, message);
    const nextSave: GameSave = {
      ...resultSave,
      npcs: {
        ...(resultSave.npcs ?? { instances: {} }),
        templatesKnown: Array.from(new Set([...(sourceSave.npcs?.templatesKnown ?? []), activeNpc.id])),
        instances: {
          ...(resultSave.npcs?.instances ?? {}),
          [nextNpcState.instanceId]: nextNpcState,
        },
      },
    };

    saveGame(nextSave);
    setChatSave(nextSave);
    setNpcChatNotice("");
  };

  const handleBlacksmithTraining = () => {
    const sourceSave = currentChatSave;

    if (!sourceSave || !activeNpc || !npcState || !isBlacksmithScene) {
      return;
    }

    const result = applyBlacksmithTraining(sourceSave, activeNpc.id);
    const message = t(result.messageKey as TranslationKey);
    applyBlacksmithResult(sourceSave, t("smithing.action.train"), result.save, message);
  };

  const handleStartSmithingJob = () => {
    const sourceSave = currentChatSave;

    if (!sourceSave || !activeNpc || !npcState || !isBlacksmithScene) {
      return;
    }

    const result = startSmithingJob(sourceSave);
    const message = t(result.messageKey as TranslationKey);
    applyBlacksmithResult(sourceSave, t("smithing.action.start"), result.save, message);
  };

  const handleSmithingClick = () => {
    const sourceSave = currentChatSave;

    if (!sourceSave || !activeNpc || !npcState || !isBlacksmithScene) {
      return;
    }

    const result = applySmithingClick(sourceSave);
    const rewardTemplate = result.rewardItemId ? getItemTemplateById(result.rewardItemId) : null;
    const rewardText = rewardTemplate
      ? ` ${formatTemplate("smithing.message.reward", { item: t(rewardTemplate.nameKey as TranslationKey) })}`
      : "";
    const message = `${t(result.messageKey as TranslationKey)}${rewardText}`;

    applyBlacksmithResult(sourceSave, t("smithing.action.work"), result.save, message);
  };

  const handleTrainingRequest = (playerText: string, isNegated: boolean) => {
    const sourceSave = currentChatSave;

    if (!sourceSave || !activeNpc || !npcState) {
      return false;
    }

    const discipline = trainerStatus.trainer?.branch ?? (isBlacksmithScene ? "smithing" : undefined);

    if (!discipline) {
      return false;
    }

    const resultSave = isNegated
      ? refuseTrainerAgreement(sourceSave, activeNpc.id, discipline)
      : acceptTrainerAgreement(sourceSave, activeNpc.id, discipline);
    const messageKey: TranslationKey = isNegated
      ? "trainer.message.requestDeclined"
      : isBlacksmithScene
        ? "trainer.message.blacksmithAgreed"
        : "trainer.message.trainerAgreed";
    const nextNpcState = appendNpcDialogueMessages(npcState, playerText, t(messageKey));
    const nextSave: GameSave = {
      ...resultSave,
      npcs: {
        ...(resultSave.npcs ?? { instances: {} }),
        templatesKnown: Array.from(new Set([...(resultSave.npcs?.templatesKnown ?? []), activeNpc.id])),
        instances: {
          ...(resultSave.npcs?.instances ?? {}),
          [nextNpcState.instanceId]: nextNpcState,
        },
      },
    };

    saveGame(nextSave);
    setChatSave(nextSave);
    setEventResultKey("");
    setRewardToast("");
    setNpcChatNotice("");
    setCombatLog([]);
    setNpcChatInput("");
    setIsNpcThinking(false);

    return true;
  };

  const handleTravelChoice = (key: TranslationKey) => {
    setEventResultKey(key);
  };

  const handleSendAnarielMessage = async () => {
    const playerText = anarielChatInput.trim();
    const sourceSave = currentChatSave;
    const sourceAnariel = sourceSave?.companions?.anariel;

    if (!playerText || !sourceSave || !sourceAnariel || (!showAnarielCompanionPanel && !isAnarielIntroEvent) || isAnarielThinking) {
      return;
    }

    setIsAnarielThinking(true);
    setAnarielChatInput("");

    const intent = parsePlayerIntent(playerText, {
      sceneId: "event_scene",
      eventId: sourceSave.activeEvent?.eventId,
      language: getLanguage(),
    });

    if (isAnarielIntroEvent && (intent.type === "free_companion" || intent.type === "leave_companion")) {
      const status = intent.type === "free_companion" ? "companion" : "ignored";
      const updatedAnariel = getUpdatedAnarielState(status, sourceAnariel);
      const narration = createGameMasterNarration({
        language: getLanguage(),
        sceneId: "event_scene",
        eventId: "anariel_intro",
        playerState: sourceSave.player,
        intent,
        gameResult: {
          type: intent.type === "free_companion" ? "anariel.free" : "anariel.leave",
          success: true,
          text: "",
        },
      });
      const sanitizedNarration = sanitizeAiResponseForWorld({
        text: narration.text,
        speakerId: "game_master",
        speakerRole: "game_master",
        language: getLanguage(),
        context: "anariel_intro",
      });
      const finalAnariel = appendDialogueMessages(updatedAnariel, playerText, sanitizedNarration.cleanText);
      const nextSave: GameSave = {
        ...sourceSave,
        companions: {
          ...sourceSave.companions,
          anariel: finalAnariel,
        },
      };

      saveGame(nextSave);
      setChatSave(nextSave);
      setAnarielChatNotice("");
      setIsAnarielThinking(false);

      window.setTimeout(() => {
        saveGame({ ...nextSave, activeEvent: null });
        onOpenWorldMap();
      }, 900);
      return;
    }

    const tonedAnariel = applyAnarielToneDelta(sourceAnariel, analyzePlayerTone(playerText));
    const fallbackReply = t(
      isAnarielIntroEvent
        ? getIntroFallbackReplyKey(sourceAnariel.dialogueHistory.length)
        : getFallbackReplyKey(sourceAnariel.dialogueHistory.length),
    );
    const aiReply = await requestAIDialogue({
      actorId: "anariel",
      actorName: t("companion.anariel.name"),
      actorRole: "companion",
      locationId: sourceSave.activeEvent?.eventId,
      playerText,
      gameContext: {
        language: getLanguage(),
        scene: isAnarielIntroEvent ? "anariel_intro" : "anariel_companion",
      },
    });
    const parsedReply = parseAiGameCommands(aiReply.text);
    const cleanReply = parsedReply.cleanText || fallbackReply;
    const sanitizedReply = sanitizeAiResponseForWorld({
      text: cleanReply,
      speakerId: "anariel",
      speakerRole: "companion",
      language: getLanguage(),
      context: isAnarielIntroEvent ? "anariel_intro" : "anariel_companion",
    });
    const finalAnariel = appendDialogueMessages(tonedAnariel, playerText, sanitizedReply.cleanText);
    const nextSaveWithDialogue: GameSave = {
      ...sourceSave,
      companions: {
        ...sourceSave.companions,
        anariel: finalAnariel,
      },
    };
    const rewardResult = applyAiRewardCommands(nextSaveWithDialogue, parsedReply.commands, {
      allowedItemIds: getAllowedAnarielRewardIds(isAnarielIntroEvent),
      canRewardGold: false,
      source: isAnarielIntroEvent ? "anariel_intro_ai" : "anariel_ai",
      authorizedTransfers: [],
    });

    saveGame(rewardResult.save);
    setChatSave(rewardResult.save);
    setRewardToast(getRewardToast(rewardResult.itemRewards, rewardResult.goldRewards));
    setAnarielChatNotice("");
    setIsAnarielThinking(false);
  };

  const handleSendNpcMessage = async () => {
    const playerText = npcChatInput.trim();
    const sourceSave = currentChatSave;

    if (!playerText || !sourceSave || !activeNpc || !npcState || isNpcThinking) {
      return;
    }

    if (isNpcGone) {
      setNpcChatNotice(t("npc.goneCannotTalk"));
      return;
    }

    if (handlePostCombatMessage(playerText)) {
      return;
    }

    setIsNpcThinking(true);

    const chatClassification = classifyChatMessage(playerText, {
      npcRole: activeNpc.role,
      activeTrade: Boolean(isMerchantScene && merchantState?.activeDeal),
    });

    console.info("[ChatRoute] classified", {
      route: chatClassification.route,
      confidence: chatClassification.confidence,
      detectedIntent: chatClassification.detectedIntent,
      detectedWeapon: chatClassification.detectedWeapon,
      negated: chatClassification.negated,
      warnings: chatClassification.warnings,
    });

    if (chatClassification.route === "trainingRequest" || chatClassification.route === "training") {
      if (handleTrainingRequest(playerText, chatClassification.negated)) {
        return;
      }
    }

    if (
      chatClassification.route === "worldAction" ||
      chatClassification.route === "rangedPreparation" ||
      chatClassification.route === "meleePreparation" ||
      chatClassification.route === "startCombat"
    ) {
      const routeMessageKey: TranslationKey =
        chatClassification.route === "rangedPreparation"
          ? chatClassification.detectedIntent === "aimWeapon"
            ? "chat.route.aimWeapon"
            : "chat.route.reloadWeapon"
          : chatClassification.route === "startCombat"
            ? "chat.route.startCombat"
            : chatClassification.detectedIntent === "sheatheWeapon"
              ? "chat.route.sheatheWeapon"
              : "chat.route.drawWeapon";
      const nextNpcState = appendNpcGameMasterMessages(npcState, playerText, t(routeMessageKey));
      const nextSave: GameSave = {
        ...sourceSave,
        npcs: {
          ...(sourceSave.npcs ?? { instances: {} }),
          templatesKnown: Array.from(new Set([...(sourceSave.npcs?.templatesKnown ?? []), activeNpc.id])),
          instances: {
            ...(sourceSave.npcs?.instances ?? {}),
            [nextNpcState.instanceId]: nextNpcState,
          },
        },
      };

      saveGame(nextSave);
      setChatSave(nextSave);
      setEventResultKey("");
      setRewardToast("");
      setNpcChatNotice("");
      setCombatLog([]);
      setNpcChatInput("");
      setIsNpcThinking(false);
      return;
    }

    const parsedMagicFormula = chatClassification.route === "magic" ? parseMagicFormula(playerText) : null;

    if (parsedMagicFormula) {
      const validation = validateMagicFormula(sourceSave, parsedMagicFormula, {
        inCombat: Boolean(npcState.combat && (activeNpc.role === "bandit" || activeNpc.role === "monster")),
        hasTarget: Boolean(npcState && npcState.status === "alive"),
        canSpeak: true,
        canGesture: true,
      });
      const resolution = resolveSpell(sourceSave, validation, { npcInstance: npcState });
      const resolvedNpcState = resolution.npcInstance ?? npcState;
      const narrationText = formatMagicResolutionMessage(resolution.result);
      const sanitizedNarration = sanitizeAiResponseForWorld({
        text: narrationText,
        speakerId: "game_master",
        speakerRole: "game_master",
        language: getLanguage(),
        context: sourceSave.activeEvent?.eventId ?? "magic_combat",
      });
      const combatState = ensureCombatState(sourceSave, npcState);
      const magicOutcome: CombatActionOutcome = !validation.ok
        ? "invalid"
        : resolution.result.critical
          ? "criticalSuccess"
          : resolution.result.fumble
            ? "criticalFailure"
            : resolution.result.ok
              ? "success"
              : "miss";
      const actionId = `player_magic_${Date.now()}_${sourceSave.player.id}`;
      const combatAfterPlayer = validation.ok
        ? syncCombatStateAfterPlayerAction(combatState, resolution.save, resolvedNpcState, {
            actionId,
            actionType: "magic",
            outcome: magicOutcome,
            targetDefeated: resolvedNpcState.combat?.isDefeated,
            debug: {
              spellId: resolution.result.validation.ok ? resolution.result.validation.spell.id : undefined,
              roll: resolution.result.roll,
              manaSpent: resolution.result.manaSpent,
              damage: resolution.result.damage,
              healing: resolution.result.healing,
            },
          })
        : combatState;
      const turnResolution = appendEnemyTurnIfNeeded({
        save: resolution.save,
        npcState: resolvedNpcState,
        playerText,
        playerNarration: sanitizedNarration.cleanText,
        activeCombat: validation.ok ? combatAfterPlayer : null,
        enemyName: t(activeNpc.nameKey),
        context: sourceSave.activeEvent?.eventId ?? "magic_combat",
        shouldRunEnemyTurn: validation.ok && isTextCombatScene(activeNpc, resolvedNpcState) && resolvedNpcState.status === "alive" && !resolvedNpcState.combat?.isDefeated,
      });
      const nextNpcState = turnResolution.npcState;
      const nextSave: GameSave = {
        ...turnResolution.save,
        npcs: {
          ...(turnResolution.save.npcs ?? { instances: {} }),
          templatesKnown: Array.from(new Set([...(sourceSave.npcs?.templatesKnown ?? []), activeNpc.id])),
          instances: {
            ...(turnResolution.save.npcs?.instances ?? {}),
            [nextNpcState.instanceId]: nextNpcState,
          },
        },
      };

      console.info("[Magic] resolved player formula", {
        formula: parsedMagicFormula.formulaText,
        ok: resolution.result.ok,
        spellId: resolution.result.validation.ok ? resolution.result.validation.spell.id : undefined,
        roll: resolution.result.roll,
        manaSpent: resolution.result.manaSpent,
        damage: resolution.result.damage,
        healing: resolution.result.healing,
      });

      saveGame(nextSave, { mode: "combat" });
      setChatSave(nextSave);
      setEventResultKey("");
      setRewardToast("");
      setNpcChatNotice("");
      setCombatLog([]);
      setNpcChatInput("");
      setIsNpcThinking(false);

      if (nextNpcState.status === "dead") {
        setIsNpcChatOpen(false);
        setNpcChatNotice(t("npc.deadCannotTalk"));
      } else if (isPostCombatNpcStatus(nextNpcState.status)) {
        setNpcChatNotice(t("postCombat.npcDefeatedAlive"));
      }

      return;
    }

    const parsedRangedCombatAction = parseRangedCombatAction(playerText, sourceSave.player.id, npcState.instanceId);

    if (chatClassification.route === "rangedCombat" && isTextCombatScene(activeNpc, npcState) && parsedRangedCombatAction.intent !== "unknown" && parsedRangedCombatAction.confidence >= 0.35) {
      const result = resolveRangedCombatAction(sourceSave, npcState, parsedRangedCombatAction);
      const nextNpcState = result.npcInstance;
      const narrationText = formatRangedCombatNarration(result, t(activeNpc.nameKey));
      const sanitizedNarration = sanitizeAiResponseForWorld({
        text: narrationText,
        speakerId: "game_master",
        speakerRole: "game_master",
        language: getLanguage(),
        context: sourceSave.activeEvent?.eventId ?? "ranged_combat",
      });
      const combatState = ensureCombatState(sourceSave, npcState);
      const actionType = getCombatActionTypeFromRoute("ranged", result);
      const actionId = `player_ranged_${Date.now()}_${sourceSave.player.id}`;
      const combatAfterPlayer = result.ok
        ? syncCombatStateAfterPlayerAction(combatState, result.save, nextNpcState, {
            actionId,
            actionType,
            outcome: getPlayerActionOutcome(result),
            targetDefeated: result.enemyDefeated,
            debug: {
              intent: result.parsedAction.intent,
              d20: result.d20,
              attackTotal: result.attackTotal,
              difficultyClass: result.difficultyClass,
              damage: result.damage,
              staminaSpent: result.staminaSpent,
              ammunitionSpent: result.ammunitionSpent,
            },
          })
        : null;
      const turnResolution = appendEnemyTurnIfNeeded({
        save: result.save,
        npcState: nextNpcState,
        playerText,
        playerNarration: sanitizedNarration.cleanText,
        activeCombat: combatAfterPlayer,
        enemyName: t(activeNpc.nameKey),
        context: sourceSave.activeEvent?.eventId ?? "ranged_combat",
        shouldRunEnemyTurn: shouldSpendCombatTurn(result, actionType) && nextNpcState.status === "alive" && !result.enemyDefeated,
      });
      const nextNpcDialogueState = turnResolution.npcState;
      const nextSave: GameSave = {
        ...turnResolution.save,
        npcs: {
          ...(turnResolution.save.npcs ?? { instances: {} }),
          templatesKnown: Array.from(new Set([...(sourceSave.npcs?.templatesKnown ?? []), activeNpc.id])),
          instances: {
            ...(turnResolution.save.npcs?.instances ?? {}),
            [nextNpcDialogueState.instanceId]: nextNpcDialogueState,
          },
        },
      };

      console.info("[RangedCombat] player action", {
        intent: result.parsedAction.intent,
        weaponCategory: result.validation.ok ? result.validation.weaponCategory : undefined,
        shotType: result.parsedAction.shotType,
        targetZone: result.parsedAction.targetZone,
        distance: result.distance,
        roll: result.d20,
        total: result.attackTotal,
        dc: result.difficultyClass,
        hit: result.hit,
        damage: result.damage,
        staminaSpent: result.staminaSpent,
        ammunitionSpent: result.ammunitionSpent,
        warnings: result.parsedAction.warnings,
      });

      saveGame(nextSave, { mode: "combat" });
      setChatSave(nextSave);
      setEventResultKey("");
      setRewardToast("");
      setNpcChatNotice("");
      setCombatLog(getRangedCombatLog(result));
      setNpcChatInput("");
      setIsNpcThinking(false);

      if (result.enemyDefeated) {
        if (nextNpcDialogueState.status === "dead") {
          setIsNpcChatOpen(false);
          setNpcChatNotice(t("npc.deadCannotTalk"));
        } else {
          setNpcChatNotice(t("postCombat.npcDefeatedAlive"));
        }
      }

      return;
    }

    const parsedTextCombatAction = parseTextCombatAction(playerText, sourceSave.player.id, npcState.instanceId);

    if (chatClassification.route === "meleeCombat" && isTextCombatScene(activeNpc, npcState) && parsedTextCombatAction.intent !== "unknown" && parsedTextCombatAction.confidence >= 0.35) {
      const result = resolveTextCombatAction(sourceSave, npcState, parsedTextCombatAction);
      const nextNpcState = result.npcInstance;
      const narrationText = formatTextCombatNarration(result, t(activeNpc.nameKey));
      const sanitizedNarration = sanitizeAiResponseForWorld({
        text: narrationText,
        speakerId: "game_master",
        speakerRole: "game_master",
        language: getLanguage(),
        context: sourceSave.activeEvent?.eventId ?? "text_combat",
      });
      const combatState = ensureCombatState(sourceSave, npcState);
      const actionType = getCombatActionTypeFromRoute("melee", result);
      const actionId = `player_melee_${Date.now()}_${sourceSave.player.id}`;
      const combatAfterPlayer = result.ok
        ? syncCombatStateAfterPlayerAction(combatState, result.save, nextNpcState, {
            actionId,
            actionType,
            outcome: getPlayerActionOutcome(result),
            targetDefeated: result.enemyDefeated,
            debug: {
              intent: result.parsedAction.intent,
              attackType: result.parsedAction.attackType,
              d20: result.d20,
              attackTotal: result.attackTotal,
              difficultyClass: result.difficultyClass,
              damage: result.damage,
              staminaSpent: result.staminaSpent,
            },
          })
        : null;
      const turnResolution = appendEnemyTurnIfNeeded({
        save: result.save,
        npcState: nextNpcState,
        playerText,
        playerNarration: sanitizedNarration.cleanText,
        activeCombat: combatAfterPlayer,
        enemyName: t(activeNpc.nameKey),
        context: sourceSave.activeEvent?.eventId ?? "text_combat",
        shouldRunEnemyTurn: shouldSpendCombatTurn(result, actionType) && nextNpcState.status === "alive" && !result.enemyDefeated,
      });
      const nextNpcDialogueState = turnResolution.npcState;
      const nextSave: GameSave = {
        ...turnResolution.save,
        npcs: {
          ...(turnResolution.save.npcs ?? { instances: {} }),
          templatesKnown: Array.from(new Set([...(sourceSave.npcs?.templatesKnown ?? []), activeNpc.id])),
          instances: {
            ...(turnResolution.save.npcs?.instances ?? {}),
            [nextNpcDialogueState.instanceId]: nextNpcDialogueState,
          },
        },
      };

      console.info("[TextCombat] player action", {
        intent: result.parsedAction.intent,
        attackType: result.parsedAction.attackType,
        targetZone: result.parsedAction.targetZone,
        distance: result.distance,
        roll: result.d20,
        total: result.attackTotal,
        dc: result.difficultyClass,
        hit: result.hit,
        damage: result.damage,
        staminaSpent: result.staminaSpent,
        warnings: result.parsedAction.warnings,
      });

      saveGame(nextSave, { mode: "combat" });
      setChatSave(nextSave);
      setEventResultKey("");
      setRewardToast("");
      setNpcChatNotice("");
      setCombatLog(getTextCombatLog(result));
      setNpcChatInput("");
      setIsNpcThinking(false);

      if (result.enemyDefeated) {
        if (nextNpcDialogueState.status === "dead") {
          setIsNpcChatOpen(false);
          setNpcChatNotice(t("npc.deadCannotTalk"));
        } else {
          setNpcChatNotice(t("postCombat.npcDefeatedAlive"));
        }
      }

      return;
    }

    const intent = parsePlayerIntent(playerText, {
      sceneId: "event_scene",
      eventId: sourceSave.activeEvent?.eventId,
      npcRole: activeNpc.role,
      language: getLanguage(),
    });

    if ((chatClassification.route === "meleeCombat" || chatClassification.route === "rangedCombat") && isCombatIntent(intent)) {
      handleCombatAttack(playerText, intent);
      setNpcChatInput("");
      setIsNpcThinking(false);
      return;
    }

    if (intent.type === "retreat" || intent.type === "flee") {
      const narration = createGameMasterNarration({
        language: getLanguage(),
        sceneId: "event_scene",
        eventId: sourceSave.activeEvent?.eventId,
        playerState: sourceSave.player,
        npcInstance: npcState,
        intent,
        gameResult: {
          type: "event.retreat",
          success: true,
          text: t("event.intent.retreatResult"),
        },
      });
      const sanitizedNarration = sanitizeAiResponseForWorld({
        text: narration.text,
        speakerId: "game_master",
        speakerRole: "game_master",
        language: getLanguage(),
        context: sourceSave.activeEvent?.eventId ?? "event_scene",
      });
      const nextNpcState = appendNpcGameMasterMessages(npcState, playerText, sanitizedNarration.cleanText);
      const nextSave: GameSave = {
        ...sourceSave,
        npcs: {
          ...(sourceSave.npcs ?? { instances: {} }),
          instances: {
            ...(sourceSave.npcs?.instances ?? {}),
            [nextNpcState.instanceId]: nextNpcState,
          },
        },
      };

      saveGame(nextSave);
      setChatSave(nextSave);
      setNpcChatNotice("");
      setNpcChatInput("");
      setIsNpcThinking(false);
      return;
    }

    if (isGateScene && (intent.type === "request_city_entry" || intent.type === "show_document" || intent.type === "persuade" || intent.type === "negotiate" || intent.type === "bribe")) {
      const cityId = dynamicCityId;
      const socialType = getSocialCheckType(intent);
      const socialResolution = socialType
        ? resolveSocialCheck(sourceSave, npcState, socialType, playerText, { difficultyModifier: isRags ? 2 : 0 })
        : null;
      const allowedByStatus = !isRags && intent.type === "request_city_entry";
      const allowed = Boolean(cityId) && (
        intent.type === "show_document" ||
        allowedByStatus ||
        socialResolution?.result.outcome === "success" ||
        socialResolution?.result.outcome === "criticalSuccess"
      );
      const gateResultKey: TranslationKey = allowed ? "city.accessAllowed" : "city.accessDenied";
      const nextNpcState = appendNpcDialogueMessages(socialResolution?.npc ?? npcState, playerText, t(gateResultKey));
      const nextSave: GameSave = {
        ...sourceSave,
        cityAccess: cityId
          ? {
              ...(sourceSave.cityAccess ?? {}),
              [cityId]: {
                status: allowed ? "allowed" : "denied",
                grantedByNpcId: allowed ? activeNpc.id : undefined,
                grantedAtGameTime: allowed ? `day-${sourceSave.currentDay ?? 1}-hour-${sourceSave.currentHour ?? 6}` : undefined,
                revokedReason: allowed ? undefined : "gate_guard_refusal",
              },
            }
          : sourceSave.cityAccess,
        npcs: {
          ...(sourceSave.npcs ?? { instances: {} }),
          instances: {
            ...(sourceSave.npcs?.instances ?? {}),
            [nextNpcState.instanceId]: nextNpcState,
          },
        },
      };

      saveGame(nextSave);
      setChatSave(nextSave);
      setEventResultKey(gateResultKey);
      setNpcChatNotice("");
      setNpcChatInput("");
      setIsNpcThinking(false);
      return;
    }

    if (isMerchantScene && merchantState?.activeDeal) {
      const response = respondToTradeText(merchantState, sourceSave.player, playerText, sourceSave.inventory);
      const dealItem = activeMerchantDealItem;
      console.info("[MerchantBargain] state", {
        merchantId: merchantState.merchantId,
        dealState: response.merchant.activeDeal?.dealState ?? "none",
        merchantOffer: response.merchant.activeDeal?.merchantOffer,
        playerCounterOffer: response.merchant.activeDeal?.playerCounterOffer,
        relationship: response.merchant.relationship,
        trust: response.merchant.trust,
      });
      const merchantLine = response.text && dealItem
        ? formatMerchantTradeText(response.text as TranslationKey, dealItem, response.merchant.activeDeal?.merchantOffer ?? merchantState.activeDeal.merchantOffer)
        : t("merchant.trade.awaiting");
      const nextNpcState = appendNpcDialogueMessages(npcState, playerText, merchantLine);
      const nextSave = upsertMerchant({
        ...sourceSave,
        npcs: {
          ...(sourceSave.npcs ?? { instances: {} }),
          templatesKnown: Array.from(new Set([...(sourceSave.npcs?.templatesKnown ?? []), activeNpc.id])),
          instances: {
            ...(sourceSave.npcs?.instances ?? {}),
            [nextNpcState.instanceId]: nextNpcState,
          },
        },
      }, response.merchant);

      saveGame(nextSave);
      setChatSave(nextSave);
      setNpcChatNotice("");
      setNpcChatInput("");
      setIsNpcThinking(false);
      return;
    }

    if (intent.type === "ask_for_item" && intent.itemHint === "simple_clothes" && getAllowedNpcRewardIds(activeNpc).includes("simple_clothes")) {
      const narrationText = t("event.intent.simpleClothesTradeOffer");
      const nextNpcState = appendNpcDialogueMessages(npcState, playerText, narrationText);
      const nextSave: GameSave = {
        ...sourceSave,
        npcs: {
          ...(sourceSave.npcs ?? { instances: {} }),
          instances: {
            ...(sourceSave.npcs?.instances ?? {}),
            [nextNpcState.instanceId]: nextNpcState,
          },
        },
      };

      saveGame(nextSave);
      setChatSave(nextSave);
      setRewardToast("");
      setNpcChatNotice("");
      setNpcChatInput("");
      setIsNpcThinking(false);
      return;
    }

    if (intent.type === "ask_for_item" && intent.itemHint === "rusty_sword" && activeNpc.role === "guard") {
      const nextNpcState = appendNpcDialogueMessages(npcState, playerText, t("event.intent.guardRefusesSword"));
      const nextSave: GameSave = {
        ...sourceSave,
        npcs: {
          ...(sourceSave.npcs ?? { instances: {} }),
          instances: {
            ...(sourceSave.npcs?.instances ?? {}),
            [nextNpcState.instanceId]: nextNpcState,
          },
        },
      };

      saveGame(nextSave);
      setChatSave(nextSave);
      setNpcChatNotice("");
      setNpcChatInput("");
      setIsNpcThinking(false);
      return;
    }

    const tonedNpc = applyNpcToneDelta(npcState, playerText);
    const socialType = getSocialCheckType(intent);
    const socialResolution = socialType ? resolveSocialCheck(sourceSave, tonedNpc, socialType, playerText) : null;
    const resolvedNpc = socialResolution?.npc ?? tonedNpc;
    const fallbackReply = t(getNpcFallbackReplyKey(activeNpc, npcState.dialogueHistory.length) as TranslationKey);
    let aiReply: Awaited<ReturnType<typeof requestAIDialogue>>;

    try {
      aiReply = await requestAIDialogue({
        actorId: activeNpc.id,
        actorName: t(activeNpc.nameKey),
        actorRole: "npc",
        locationId: sourceSave.activeEvent?.eventId,
        playerText,
        gameContext: {
          language: getLanguage(),
          npcRole: activeNpc.role,
          relationship: resolvedNpc.relationship,
          trust: resolvedNpc.trust,
          hostility: resolvedNpc.hostility,
        },
      });
    } catch (error) {
      console.error("[NpcChat] failed to get AI reply", error);
      setNpcChatNotice(t("dialogue.sendError"));
      setIsNpcThinking(false);
      return;
    }

    const parsedReply = parseAiGameCommands(aiReply.text);
    const cleanReply = parsedReply.cleanText || fallbackReply;
    const sanitizedReply = sanitizeAiResponseForWorld({
      text: cleanReply,
      speakerId: activeNpc.id,
      speakerRole: activeNpc.role,
      language: getLanguage(),
      context: sourceSave.activeEvent?.eventId ?? "npc_dialogue",
    });
    const nextNpcState = appendNpcDialogueMessages(resolvedNpc, playerText, sanitizedReply.cleanText);
    const nextSaveWithDialogue: GameSave = {
      ...sourceSave,
      npcs: {
        ...(sourceSave.npcs ?? { instances: {} }),
        templatesKnown: Array.from(new Set([...(sourceSave.npcs?.templatesKnown ?? []), activeNpc.id])),
        instances: {
          ...(sourceSave.npcs?.instances ?? {}),
          [nextNpcState.instanceId]: nextNpcState,
        },
      },
    };
    const rewardResult = applyAiRewardCommands(nextSaveWithDialogue, parsedReply.commands, {
      allowedItemIds: getAllowedNpcRewardIds(activeNpc),
      canRewardGold: canNpcRewardGold(activeNpc),
      source: "npc_ai",
      authorizedTransfers: [],
    });

    saveGame(rewardResult.save);
    setChatSave(rewardResult.save);
    setRewardToast(getRewardToast(rewardResult.itemRewards, rewardResult.goldRewards));
    setNpcChatNotice(socialResolution ? t(socialResolution.result.messageKey) : "");
    setNpcChatInput("");
    setIsNpcThinking(false);
  };

  const handleCombatAttack = (playerText?: string, intent?: PlayerIntent) => {
    const sourceSave = currentChatSave;

    if (!sourceSave || !activeNpc || !npcState || isNpcDead || isNpcGone) {
      return;
    }

    const combatAction = intent ? getCombatActionForIntent(intent, dynamicEvent) : { type: "auto" as const };
    const result = resolvePlayerAttack(sourceSave, npcState, combatAction);
    const nextNpcState = result.npcInstance;

    console.info("[Combat] player action", {
      intentType: intent?.type ?? "manual",
      actionType: result.actionType,
      roll: result.d20,
      total: result.attackTotal,
      success: result.ok && result.hit,
      damage: result.damage,
    });

    const combatState = ensureCombatState(sourceSave, npcState);
    const actionId = `player_legacy_${Date.now()}_${sourceSave.player.id}`;
    const combatAfterPlayer = result.ok
      ? syncCombatStateAfterPlayerAction(combatState, result.save, nextNpcState, {
          actionId,
          actionType: "meleeAttack",
          outcome: getPlayerActionOutcome(result),
          targetDefeated: result.enemyDefeated,
          debug: {
            d20: result.d20,
            attackTotal: result.attackTotal,
            damage: result.damage,
            actionType: result.actionType,
          },
        })
      : null;
    const narration = playerText && intent
      ? createGameMasterNarration({
          language: getLanguage(),
          sceneId: "event_scene",
          eventId: sourceSave.activeEvent?.eventId,
          playerState: result.save.player,
          npcInstance: nextNpcState,
          intent,
          gameResult: {
            type: "combat.attack",
            success: result.ok,
            combat: result,
            enemyName: t(activeNpc.nameKey),
          },
        })
      : {
          text: result.ok
            ? t(result.hit ? "combat.narration.melee.hit" : "combat.narration.melee.miss")
            : t("combat.invalidAction"),
          tone: "combat" as const,
        };

    console.info("[GameMaster] narration source", {
      source: "template",
      tone: narration.tone,
    });

    const sanitizedNarration = sanitizeAiResponseForWorld({
      text: narration.text,
      speakerId: "game_master",
      speakerRole: "game_master",
      language: getLanguage(),
      context: sourceSave.activeEvent?.eventId ?? "combat",
    });
    const turnResolution = appendEnemyTurnIfNeeded({
      save: result.save,
      npcState: nextNpcState,
      playerText: playerText ?? t(`combat.action.attack` as TranslationKey),
      playerNarration: sanitizedNarration.cleanText,
      activeCombat: combatAfterPlayer,
      enemyName: t(activeNpc.nameKey),
      context: sourceSave.activeEvent?.eventId ?? "combat",
      shouldRunEnemyTurn: result.ok && nextNpcState.status === "alive" && !result.enemyDefeated,
    });
    const nextNpcDialogueState = turnResolution.npcState;
    const nextSave: GameSave = {
      ...turnResolution.save,
      npcs: {
        ...(turnResolution.save.npcs ?? { instances: {} }),
        templatesKnown: Array.from(new Set([...(sourceSave.npcs?.templatesKnown ?? []), activeNpc.id])),
        instances: {
          ...(turnResolution.save.npcs?.instances ?? {}),
          [nextNpcDialogueState.instanceId]: nextNpcDialogueState,
        },
      },
    };

    if (turnResolution.enemyAttack) {
      console.info("[Combat] enemy action", {
        actionType: "enemyTurn",
        roll: turnResolution.enemyAttack.d20,
        total: turnResolution.enemyAttack.attackTotal,
        success: turnResolution.enemyAttack.hit,
        damage: turnResolution.enemyAttack.damage,
      });
    }

    saveGame(nextSave);
    setChatSave(nextSave);
    setEventResultKey("");
    setCombatLog(getCombatLog({ ...result, enemyAttack: turnResolution.enemyAttack }, t(activeNpc.nameKey)));

    if (result.enemyDefeated) {
      if (nextNpcDialogueState.status === "dead") {
        setIsNpcChatOpen(false);
        setNpcChatNotice(t("npc.deadCannotTalk"));
      } else {
        setNpcChatNotice(t("postCombat.npcDefeatedAlive"));
      }
    }
  };

  if (dynamicEvent?.type === "necropolis") {
    return (
      <section className="event-scene event-scene--dynamic event-scene--necropolis" aria-labelledby="event-scene-title">
        <img className="event-scene-background" src={sceneAssetDefinition?.backgroundUrl ?? dynamicEvent.backgroundImage} alt="" />
        <div className="event-scene-vignette" aria-hidden="true" />
        {renderGuidePanels()}

        <header className="event-scene-header">
          <div className="event-scene-header-title">
            <span aria-hidden="true" />
            <h1 id="event-scene-title">{t(dynamicEvent.titleKey)}</h1>
            <span aria-hidden="true" />
          </div>
        </header>

        <aside className="event-scene-location-panel" aria-label={t("event.ui.locationPanel")}>
          <div className="event-scene-location-panel__sigil" aria-hidden="true">x</div>
          <div>
            <h2>{t(dynamicEvent.locationTitleKey)}</h2>
            <p>{t(dynamicEvent.locationSubtitleKey)}</p>
          </div>
          <time>--:--</time>
          <button className="event-scene-close-button" type="button" onClick={returnToWorldMap} aria-label={t("event.ui.close")}>
            x
          </button>
        </aside>

        <section className="event-scene-dialogue-panel event-npc-panel" aria-label={t("event.ui.dialoguePanel")}>
          <div className="event-scene-speaker-portrait">
            <span>N</span>
          </div>
          <div className="event-scene-dialogue-body">
            <h2 className="event-scene-speaker-name">{t(dynamicEvent.titleKey)}</h2>
            <div className="event-scene-dialogue-divider" aria-hidden="true" />
            <p className="event-scene-dialogue-text">{t(dynamicEvent.descriptionKey)}</p>
            {eventResultKey ? (
              <p className="event-scene-dialogue-text event-scene-dialogue-text--response">{t(eventResultKey)}</p>
            ) : null}
          </div>
        </section>

        <aside className="event-scene-interaction-panel event-status-panel" aria-label={t("event.ui.choicePanel")}>
          <section className="event-thought-panel" aria-label={t("event.status.thoughts")}>
            <p>{t("thought.necropolis.silence")}</p>
            <p>{t("thought.necropolis.listen")}</p>
            <p>{t("event.hint.typeAction")}</p>
          </section>
        </aside>
      </section>
    );
  }

  if (dynamicEvent && activeNpc) {
    return (
      <section className={`event-scene event-scene--dynamic event-scene--${dynamicEvent.type}${isMerchantScene ? " event-scene--merchant-scene" : ""}`} aria-labelledby="event-scene-title">
        <img className="event-scene-background" src={sceneAssetDefinition?.backgroundUrl ?? dynamicEvent.backgroundImage} alt="" />
        <div className="event-scene-vignette" aria-hidden="true" />
        {renderGuidePanels()}

        <header className="event-scene-header">
          <div className="event-scene-header-title">
            <span aria-hidden="true" />
            <h1 id="event-scene-title">{t(dynamicEvent.titleKey)}</h1>
            <span aria-hidden="true" />
          </div>
        </header>

        <aside className="event-scene-location-panel" aria-label={t("event.ui.locationPanel")}>
          <div className="event-scene-location-panel__sigil" aria-hidden="true">✦</div>
          <div>
            <h2>{t(dynamicEvent.locationTitleKey)}</h2>
            <p>{t(dynamicEvent.locationSubtitleKey)}</p>
          </div>
          <time>--:--</time>
          <button className="event-scene-close-button" type="button" onClick={returnToWorldMap} aria-label={t("event.ui.close")}>
            x
          </button>
        </aside>

        <aside className="event-scene-sidebar" aria-label={t("event.ui.sidebar")}>
          {sidebarItems.map((item) => (
            <button className="event-scene-sidebar-button" key={item.key} type="button" disabled>
              <span>{item.glyph}</span>
              <small>{t(item.key)}</small>
            </button>
          ))}
        </aside>

        <div className="event-scene-character event-scene-character--npc event-npc-figure event-npc-figure--large" aria-hidden="true">
          <img src={speakerImage} alt="" />
        </div>

        {activeNpc ? <TopStatusBar indicators={topStatusIndicators} ariaLabel={t("hud.ariaLabel")} /> : null}

        {isMerchantScene && merchantState ? (
          <section className="merchant-trade-layout merchant-scene-main" aria-label={t("merchant.ui.tradePanel")}>
            <div className="merchant-center-stage">
              <div className="merchant-character-figure" aria-hidden="true">
                <img src={speakerImage} alt="" />
              </div>
            <div className="merchant-deal-panel merchant-trade-zone">
              <header>
                <h2>{t("merchant.tradeZone")}</h2>
                <span>{t(getMerchantQuestHint(activeNpc.id, activeNpc.locationId) as TranslationKey)}</span>
              </header>
              <div
                className={`merchant-deal-dropzone merchant-trade-content${activeMerchantDeal ? " merchant-deal-dropzone--active merchant-trade-content--active" : ""}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDropTradeItem}
              >
                {activeMerchantDeal && activeMerchantDealItem ? (
                  <>
                    <small>{t(activeMerchantDeal.side === "player_sells" ? "merchant.ui.playerSells" : "merchant.ui.playerBuys")}</small>
                    <strong>{getItemLabel(activeMerchantDealItem)}</strong>
                    <span className="merchant-price">
                      {formatApproximateMerchantPrice(activeMerchantDeal.merchantOffer)}
                    </span>
                    <span>{formatTemplate("merchant.ui.dealQuantity", { quantity: activeMerchantDeal.quantity })}</span>
                    <span>{t(`merchant.dealState.${activeMerchantDeal.dealState}` as TranslationKey)}</span>
                  </>
                ) : (
                  <>
                    <strong>{t("merchant.ui.noDeal")}</strong>
                    <span>{t("merchant.ui.dropHint")}</span>
                  </>
                )}
              </div>
            </div>
            </div>

            <div className="merchant-inventory-panel merchant-tabbed-panel">
              <div className="merchant-trade-tabs" role="tablist" aria-label={t("merchant.ui.tradeTabs")}>
                <button
                  className={tradeMode === "buy" ? "merchant-trade-tab merchant-trade-tab--active" : "merchant-trade-tab"}
                  type="button"
                  role="tab"
                  aria-selected={tradeMode === "buy"}
                  onClick={() => handleChangeTradeMode("buy")}
                >
                  {t("merchant.tab.buy")}
                </button>
                <button
                  className={tradeMode === "sell" ? "merchant-trade-tab merchant-trade-tab--active" : "merchant-trade-tab"}
                  type="button"
                  role="tab"
                  aria-selected={tradeMode === "sell"}
                  onClick={() => handleChangeTradeMode("sell")}
                >
                  {t("merchant.tab.sell")}
                </button>
              </div>
              <header>
                <h2>{visibleTradeTitle}</h2>
                <span>{formatTemplate("merchant.ui.gold", { amount: visibleTradeGold })}</span>
              </header>
              <div className="merchant-inventory-list merchant-item-grid">
                {visibleTradeItems.length > 0 ? (
                  visibleTradeItems.map((item) => (
                    <button
                      className={`merchant-trade-item merchant-item-card${activeMerchantDeal?.side === visibleTradeSide && activeMerchantDeal.itemInstanceId === item.id ? " merchant-item-card--selected" : ""}`}
                      draggable
                      key={item.id}
                      title={`${getItemLabel(item)} · ${formatTemplate("merchant.ui.itemTooltip", {
                        quantity: item.quantity,
                        value: item.value,
                        weight: item.weight,
                        condition: item.condition ?? "intact",
                      })}`}
                      type="button"
                      onClick={() => handleSelectTradeItem(visibleTradeSide, item.id)}
                      onDragStart={() => setDraggedTradeItem({ side: visibleTradeSide, itemInstanceId: item.id })}
                      disabled={tradeMode === "sell" && Boolean(item.isQuestItem || item.questItem)}
                    >
                      <span className="merchant-item-icon" aria-hidden="true">
                        {item.iconUrl ? (
                          <img
                            src={item.iconUrl}
                            alt=""
                            onError={(event) => {
                              event.currentTarget.hidden = true;
                            }}
                          />
                        ) : null}
                        <span>{getItemIconLabel(item)}</span>
                      </span>
                      <strong>{getItemLabel(item)}</strong>
                      <span>
                        {formatTemplate("merchant.ui.itemMetaDetailed", { quantity: item.quantity, value: item.value, weight: item.weight })}
                        {tradeMode === "sell" && equippedItemIds.has(item.id) ? ` · ${t("inventoryEquipped")}` : ""}
                      </span>
                      <span className="merchant-item-price">
                        {formatTemplate(tradeMode === "buy" ? "merchant.ui.buyPrice" : "merchant.ui.sellValue", { price: item.value })}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="merchant-empty-text">{t(visibleTradeEmptyKey)}</p>
                )}
              </div>
              <footer className="merchant-panel-summary">
                <span>{formatTemplate("merchant.weightSummary", { current: playerWeight.toFixed(1), max: playerMaxWeight.toFixed(1) })}</span>
                <span>{formatTemplate("merchant.goldSummary", { amount: playerGold })}</span>
              </footer>
            </div>
          </section>
        ) : null}

        {isMerchantScene && merchantState ? (
          <nav className="merchant-bottom-navigation" aria-label={t("city.navigation")}>
            <button type="button" onClick={() => onOpenInventory("merchantScene")}>
              <img src="/assets/world-map/ui/inventory_icon.png" alt="" />
              <span>{t("inventoryTitle")}</span>
            </button>
            <button type="button" onClick={onOpenCityMap}>
              <span aria-hidden="true">M</span>
              <span>{t("city.cityMap")}</span>
            </button>
            <button type="button" onClick={onOpenWorldMap}>
              <span aria-hidden="true">W</span>
              <span>{t("city.worldMap")}</span>
            </button>
            <button type="button" onClick={onOpenJournal}>
              <img src="/assets/world-map/ui/messages_icon.png" alt="" />
              <span>{t("journalTitle")}</span>
            </button>
            <button type="button" onClick={onOpenSettings}>
              <img src="/assets/world-map/ui/settings_icon.png" alt="" />
              <span>{t("settingsTitle")}</span>
            </button>
          </nav>
        ) : null}

        <section className="event-scene-dialogue-panel event-npc-panel scene-dialogue-panel--bottom-left scene-dialogue-panel--compact scene-dialogue-panel--transparent" aria-label={t("event.ui.dialoguePanel")}>
          <SceneDialoguePanel
            title={t("npc.chat.title")}
            speakerName={t(activeNpc.nameKey)}
            speakerRole={t(getNpcMoodKey(activeNpc))}
            speakerPortraitUrl={activeNpc.portraitUrl ?? speakerImage}
            messages={npcSceneMessages}
            emptyText={isNpcDead ? t("postCombat.deadGmOnly") : isNpcDefeatedAlive ? t("postCombat.npcDefeatedAlive") : isNpcGone ? t("npc.goneCannotTalk") : eventResultKey ? t(eventResultKey) : t(activeNpc.greetingKey)}
            value={npcChatInput}
            onChange={setNpcChatInput}
            onSend={handleSendNpcMessage}
            headerActions={renderGuideHeaderActions()}
            isThinking={isNpcThinking}
            thinkingText={activeNpc.role === "monster" ? t("sceneDialogue.thinkingMonster") : t("sceneDialogue.thinkingNpc")}
            notice={npcChatNotice || rewardToast || aiMockNotice}
            disabled={combatInputPolicy.disabled}
            readOnly={combatInputPolicy.readOnly}
            inputPlaceholder={combatInputPolicy.waitingForEnemy ? t("combat.waitForEnemyTurn") : combatInputPolicy.canUseCombatInput ? t("combat.inputPlaceholder") : t("ai.inputPlaceholder")}
            actions={
              <>
              {isPlayerDefeated ? (
                <button
                  className="merchant-confirm-button"
                  type="button"
                  onClick={() => {
                    if (currentChatSave && npcState) {
                      appendPostCombatGameMaster(currentChatSave, npcState, t("postCombat.leaveButton"), "postCombat.leave", {}, "exit");
                      window.setTimeout(returnToWorldMap, 250);
                    }
                  }}
                >
                  {t("postCombat.leaveButton")}
                </button>
              ) : null}
              {isPlayerDead ? (
                <button className="merchant-refuse-button" type="button" onClick={onBackToMenu}>
                  {t("gameOver.newGameOnly")}
                </button>
              ) : null}
              {isMerchantScene && merchantCanConfirmDeal ? (
                <>
                  <button className="merchant-confirm-button merchant-confirm-trade" type="button" onClick={handleConfirmMerchantDeal}>
                    {t("merchant.confirmTrade")}
                  </button>
                  <button className="merchant-refuse-button merchant-decline-trade" type="button" onClick={handleRefuseMerchantDeal}>
                    {t("merchant.decline")}
                  </button>
                </>
              ) : null}
              {shouldShowTrainerActions ? (
                <button className="merchant-confirm-button" type="button" onClick={handleTrainerTraining} disabled={!trainerCanTrain}>
                  {trainerStatus.nextTier
                    ? `${t("trainer.action.train")} - ${t(`trainer.tier.${trainerStatus.nextTier}` as TranslationKey)}`
                    : t("trainer.action.noTraining")}
                </button>
              ) : null}
              {shouldShowBlacksmithActions ? (
                <div className="smithing-mini-game" aria-label={t("smithing.ui.title")}>
                  <div className="smithing-mini-game__status">
                    <strong>{t("smithing.ui.title")}</strong>
                    <span>
                      {smithingStatus.hasBasicTraining
                        ? formatTemplate("smithing.ui.completedJobs", { count: smithingStatus.completedJobs })
                        : t("smithing.ui.locked")}
                    </span>
                  </div>
                  {!smithingStatus.hasBasicTraining ? (
                    <button className="merchant-confirm-button" type="button" onClick={handleBlacksmithTraining}>
                      {t("smithing.action.train")}
                    </button>
                  ) : smithingJob ? (
                    <>
                      <div className="smithing-mini-game__progress">
                        <span>{t(`smithing.stage.${smithingJob.stage}` as TranslationKey)}</span>
                        <meter min={0} max={smithingStageGoal} value={smithingJob.progress}>
                          {smithingJob.progress}/{smithingStageGoal}
                        </meter>
                        <span>{smithingJob.progress}/{smithingStageGoal}</span>
                      </div>
                      <button className="merchant-confirm-button" type="button" onClick={handleSmithingClick}>
                        {t(`smithing.action.${smithingJob.stage}` as TranslationKey)}
                      </button>
                    </>
                  ) : (
                    <button className="merchant-confirm-button" type="button" onClick={handleStartSmithingJob}>
                      {t("smithing.action.start")}
                    </button>
                  )}
                </div>
              ) : null}
              </>
            }
          />
        </section>

        {renderNpcLootPanel()}

        {canEnterCity ? (
          <nav className="event-context-actions" aria-label={t("city.navigation")}>
            <button className="city-enter-button" type="button" onClick={handleEnterCity}>
              {t("city.enter")}
            </button>
          </nav>
        ) : null}

        <aside className="event-scene-interaction-panel event-status-panel" aria-label={t("event.ui.choicePanel")}>
          <section className="event-thought-panel" aria-label={t("event.status.thoughts")}>
            {renderThoughtPanel()}
          </section>
          <p className="event-scene-text-hint">{t("event.hint.typeAction")}</p>
          {currentChatSave?.activeEvent?.pendingTravelTargetId ? (
            <p className="event-travel-interruption">{t("event.travel.interrupted")}</p>
          ) : null}
        </aside>
      </section>
    );
  }

  if (!isAnarielIntroEvent) {
    return null;
  }

  const event = ANARIEL_INTRO_EVENT;

  return (
    <section className={`event-scene event-scene--${introStep}`} aria-labelledby="event-scene-title">
      <img className="event-scene-background" src={event.backgroundImage} alt="" />
      <div className="event-scene-vignette" aria-hidden="true" />
      {renderGuidePanels()}

      <header className="event-scene-header">
        <div className="event-scene-header-title">
          <span aria-hidden="true" />
          <h1 id="event-scene-title">{t(event.titleKey)}</h1>
          <span aria-hidden="true" />
        </div>
      </header>

      <aside className="event-scene-location-panel" aria-label={t("event.ui.locationPanel")}>
        <div className="event-scene-location-panel__sigil" aria-hidden="true">✦</div>
        <div>
          <h2>{t(event.locationTitleKey)}</h2>
          <p>{t(event.locationSubtitleKey)}</p>
        </div>
        <time>{event.timeLabel}</time>
        <button className="event-scene-close-button" type="button" onClick={onBackToMenu} aria-label={t("event.ui.close")}>
          x
        </button>
      </aside>

      <aside className="event-scene-sidebar" aria-label={t("event.ui.sidebar")}>
        {sidebarItems.map((item) => (
          <button className="event-scene-sidebar-button" key={item.key} type="button" disabled>
            <span>{item.glyph}</span>
            <small>{t(item.key)}</small>
          </button>
        ))}
      </aside>

      <div className="event-scene-character event-npc-figure event-npc-figure--large" aria-hidden="true">
        <img src={speakerImage} alt="" />
      </div>

      <section className="event-scene-dialogue-panel scene-dialogue-panel--bottom-left scene-dialogue-panel--compact scene-dialogue-panel--transparent" aria-label={t("event.ui.dialoguePanel")}>
        {activeAnarielState ? (
          <SceneDialoguePanel
            title={t("companion.chat.title")}
            speakerName={t("companion.anariel.name")}
            speakerRole={t("event.anarielIntro.speakerRole")}
            speakerPortraitUrl={anarielPortraitImage}
            messages={anarielSceneMessages}
            emptyText={isStandingStep ? t(event.dialogueStandingLineKey) : t("event.anarielIntro.aiInitialFallback1")}
            value={anarielChatInput}
            onChange={setAnarielChatInput}
            onSend={() => {
              void handleSendAnarielMessage();
            }}
            headerActions={renderGuideHeaderActions()}
            isThinking={isAnarielThinking}
            thinkingText={t("sceneDialogue.thinkingAnariel")}
            notice={anarielChatNotice || aiMockNotice}
            inputPlaceholder={t("ai.inputPlaceholder")}
            stats={[
              { label: t("companion.relationship.relationship"), value: activeAnarielState.relationship },
              { label: t("companion.relationship.trust"), value: activeAnarielState.trust },
              { label: t("companion.relationship.fear"), value: activeAnarielState.fear },
              { label: t("companion.relationship.respect"), value: activeAnarielState.respect },
            ]}
          />
        ) : (
          <>
            <div className="event-scene-speaker-portrait">
              <img src={speakerImage} alt="" />
              <span>{t(event.speakerNameKey).slice(0, 1)}</span>
            </div>
            <div className="event-scene-dialogue-body">
              <h2 className="event-scene-speaker-name">{t(event.speakerNameKey)}</h2>
              <div className="event-scene-dialogue-divider" aria-hidden="true" />
              <p className="event-scene-dialogue-text">{t("event.anarielIntro.sceneHint")}</p>
              {isStandingStep ? (
                <p className="event-scene-dialogue-text event-scene-dialogue-text--response">
                  {t(event.dialogueStandingLineKey)}
                </p>
              ) : null}
              <p className="event-scene-footer-hint">
                <kbd>Space</kbd>
                <span>{t("event.ui.continue")}</span>
              </p>
            </div>
          </>
        )}
      </section>

      <aside className={`event-scene-interaction-panel event-status-panel event-scene-interaction-panel--${interactionMode}`} aria-label={t("event.ui.choicePanel")}>
        <section className="event-health-status" aria-label={t("event.status.health")}>
          <p>{formatHealthStatus(t("health.player"), currentChatSave?.player.combat?.currentHealth, currentChatSave?.player.combat?.maxHealth)}</p>
        </section>
        <section className="event-thought-panel" aria-label={t("event.status.thoughts")}>
          {getAnarielIntroThoughts().map((thought) => (
            <p key={thought}>{thought}</p>
          ))}
        </section>
        <p className="event-scene-text-hint">{t("event.hint.typeAction")}</p>
        {rewardToast ? <p className="event-reward-toast">{rewardToast}</p> : null}
        <p className="event-scene-footer-hint event-scene-footer-hint--close">
          <kbd>Esc</kbd>
          <span>{t("event.ui.close")}</span>
        </p>
      </aside>
    </section>
  );
}
