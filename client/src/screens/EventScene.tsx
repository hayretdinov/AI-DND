import { useEffect, useRef, useState } from "react";
import { SceneDialoguePanel, type SceneDialogueMessage } from "../components/SceneDialoguePanel";
import {
  appendDialogueMessages,
  appendAnarielMessage,
  applyAnarielToneDelta,
  analyzePlayerTone,
  getAnarielAiReply,
  getAnarielIntroInitialReply,
  getFallbackReplyKey,
  getIntroFallbackReplyKey,
} from "../systems/companions/anarielDialogue";
import {
  ANARIEL_ADVICE_PORTRAIT,
  getAnarielGateAdviceKey,
  getAnarielWorldAdviceKey,
  isAnarielActiveCompanion,
} from "../data/companions/anarielAdvice";
import { ANARIEL_INTRO_EVENT } from "../data/events";
import { cityMapDefinitions } from "../data/cityMap";
import { getLocationEventById } from "../data/locationEvents";
import { getNpcById } from "../data/npcs";
import { getTravelEventById } from "../data/travelEvents";
import { getLanguage, t, type TranslationKey } from "../i18n/i18n";
import { parseAiGameCommands } from "../systems/ai/aiCommandParser";
import {
  addItemToInventory,
  applyAiRewardCommands,
  canNpcRewardGold,
  getAllowedAnarielRewardIds,
  getAllowedNpcRewardIds,
  type AppliedItemReward,
} from "../systems/inventory/inventoryRewards";
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
  getMerchantQuestHint,
  getMerchantState,
  respondToTradeText,
  upsertMerchant,
} from "../systems/merchant/merchantSystem";
import {
  appendNpcDialogueMessages,
  applyNpcToneDelta,
  createInitialNpcState,
  getNpcAiReply,
  getNpcFallbackReplyKey,
  setNpcInstanceStatus,
} from "../systems/npc/npcDialogueSystem";
import { createNpcCombatState, resolvePlayerAttack, type PlayerAttackResult } from "../systems/combat/combatSystem";
import { createGameMasterNarration } from "../systems/gameMaster/gameMasterSystem";
import { parsePlayerIntent, type PlayerIntent } from "../systems/intent/playerIntentSystem";
import type { EventChoiceAction, EventInteractionMode, EventIntroStep } from "../types/eventScene";
import type { LocationEventDefinition, TravelEventDefinition } from "../types/events";
import type { InventoryItem } from "../types/inventory";
import type { MerchantDealSide } from "../types/merchant";
import type { NpcDefinition, NpcInstance, NpcRuntimeState } from "../types/npc";

type EventSceneProps = {
  onBackToMenu: () => void;
  onOpenCityMap: () => void;
  onOpenWorldMap: () => void;
};

type CombatLogEntry = {
  id: string;
  text: string;
  variant: "hit" | "miss" | "critical";
};

type DraggedTradeItem = {
  side: MerchantDealSide;
  itemInstanceId: string;
};

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

  if (npc.role === "guard") {
    return "npc.mood.suspicious";
  }

  if (npc.role === "bandit") {
    return "npc.mood.hostile";
  }

  return "npc.mood.beast";
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

function formatMerchantTradeText(key: TranslationKey, item: InventoryItem, price: number) {
  return formatTemplate(key, {
    item: getItemLabel(item),
    price,
    quantity: item.quantity,
  });
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
  if (!result.ok) {
    const keyByReason: Record<NonNullable<PlayerAttackResult["blockedReason"]>, TranslationKey> = {
      noWeapon: "combat.noWeapon",
      weaponNotEquipped: "combat.weaponNotEquipped",
      notTrained: "combat.notTrained",
    };

    return [
      {
        id: `combat-blocked-${Date.now()}`,
        text: t(keyByReason[result.blockedReason ?? "noWeapon"]),
        variant: "miss",
      },
    ];
  }

  const entries: CombatLogEntry[] = [
    {
      id: `combat-roll-${Date.now()}`,
      text: formatTemplate("combat.attackRoll", {
        roll: result.d20 ?? 0,
        bonus: (result.attackTotal ?? 0) - (result.d20 ?? 0),
        total: result.attackTotal ?? 0,
        armorClass: result.npcInstance.combat?.armorClass ?? 0,
      }),
      variant: result.hit ? (result.critical ? "critical" : "hit") : "miss",
    },
  ];

  if (!result.hit) {
    entries.push({
      id: `combat-miss-${Date.now()}`,
      text: t("combat.miss"),
      variant: "miss",
    });
  } else {
    entries.push({
      id: `combat-hit-${Date.now()}`,
      text: formatTemplate(result.critical ? "combat.criticalHit" : "combat.hit", {
        damage: result.damage ?? 0,
        enemy: enemyName,
      }),
      variant: result.critical ? "critical" : "hit",
    });
  }

  if (result.enemyDefeated) {
    entries.push({
      id: `combat-defeated-${Date.now()}`,
      text: formatTemplate("combat.enemyDefeated", { enemy: enemyName }),
      variant: "critical",
    });
  }

  if (result.enemyAttack) {
    entries.push({
      id: `combat-enemy-roll-${Date.now()}`,
      text: formatTemplate("combat.enemyAttack", {
        enemy: enemyName,
        roll: result.enemyAttack.d20,
        bonus: result.enemyAttack.attackTotal - result.enemyAttack.d20,
        total: result.enemyAttack.attackTotal,
      }),
      variant: result.enemyAttack.hit ? "hit" : "miss",
    });
    entries.push({
      id: `combat-enemy-result-${Date.now()}`,
      text: result.enemyAttack.hit
        ? formatTemplate("combat.playerHit", { damage: result.enemyAttack.damage })
        : t("combat.playerMissed"),
      variant: result.enemyAttack.hit ? "hit" : "miss",
    });

    if (result.enemyAttack.barelyStanding) {
      entries.push({
        id: `combat-barely-${Date.now()}`,
        text: t("combat.barelyStanding"),
        variant: "critical",
      });
    }
  }

  return entries;
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
  if (npc.role === "bandit") {
    return [
      t("thought.bandit.nervous"),
      save?.inventory?.equipment.mainHand ? t("thought.bandit.weaponReady") : t("thought.bandit.noWeapon"),
      t("thought.bandit.canNegotiate"),
      t("thought.bandit.canFlee"),
    ];
  }

  if (npc.role === "monster") {
    return [t("thought.monster.watch"), t("thought.monster.noTalk"), t("thought.bandit.canFlee")];
  }

  if (npc.role === "guard") {
    return [t("thought.guard.watches"), t("thought.guard.clothes"), t("thought.guard.askClothes")];
  }

  if (npc.role === "merchant") {
    return [t("thought.merchant.inventory"), t("thought.merchant.haggle"), t("thought.merchant.memory")];
  }

  if (npc.role === "ruler" || npc.role === "noble" || npc.role === "mage" || npc.role === "priest" || npc.role === "military" || npc.role === "scholar" || npc.role === "blacksmith") {
    return [t("thought.royalCourt.memory"), t("thought.royalCourt.knowledge"), t("thought.royalCourt.problem")];
  }

  if (npcInstance?.status === "dead") {
    return [t("thought.npc.dead")];
  }

  return [t("thought.npc.present"), t("event.hint.typeAction")];
}

function getAnarielIntroThoughts() {
  return [
    t("thought.anariel.afraid"),
    t("thought.anariel.chains"),
    t("thought.anariel.choice"),
  ];
}

export function EventScene({ onBackToMenu, onOpenCityMap, onOpenWorldMap }: EventSceneProps) {
  const loadedSave = loadGame();
  const dynamicEvent = getDynamicEvent(loadedSave);
  const activeNpcTemplateId = loadedSave?.activeEvent?.npcTemplateId ?? loadedSave?.activeEvent?.npcId ?? dynamicEvent?.npcId;
  const activeNpc = activeNpcTemplateId ? getNpcById(activeNpcTemplateId) : null;
  const [dialogueKey, setDialogueKey] = useState<TranslationKey>(
    dynamicEvent?.descriptionKey ?? ANARIEL_INTRO_EVENT.dialogueInitialKey,
  );
  const [interactionMode] = useState<EventInteractionMode>(ANARIEL_INTRO_EVENT.interactionMode);
  const [introStep, setIntroStep] = useState<EventIntroStep>("initial");
  const [companionAdviceIndex, setCompanionAdviceIndex] = useState(0);
  const [isCompanionPortraitMissing, setIsCompanionPortraitMissing] = useState(false);
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
  const hasRequestedInitialIntroGreeting = useRef(false);
  const currentChatSave = chatSave ?? loadedSave;
  const showAnarielCompanionPanel = isAnarielActiveCompanion(currentChatSave);
  const activeAnarielState = currentChatSave?.companions?.anariel;
  const isAnarielIntroEvent = currentChatSave?.activeEvent?.eventId === "anariel_intro" && activeAnarielState?.introEventSeen === false;
  const anarielDialogueHistory = activeAnarielState?.dialogueHistory ?? [];
  const isStandingStep = introStep === "standing";
  const introEvent = ANARIEL_INTRO_EVENT;
  const speakerImage = dynamicEvent
    ? activeNpc?.imageUrl ?? FALLBACK_NPC_IMAGE
    : isStandingStep
      ? introEvent.standingImage
      : introEvent.speakerImage;
  const choices = isStandingStep ? introEvent.standingChoices : introEvent.choices;
  const companionAdviceKey =
    dynamicEvent?.type === "bandit"
      ? "companion.anariel.banditAdvice"
      : dynamicEvent?.type === "beast"
        ? "companion.anariel.beastAdvice"
        : companionAdviceIndex === 0
          ? getAnarielGateAdviceKey()
          : getAnarielWorldAdviceKey(companionAdviceIndex - 1);
  const activeNpcInstanceId = currentChatSave?.activeEvent?.npcInstanceId ?? activeNpc?.id;
  const npcState = activeNpc ? getNpcInstance(currentChatSave, activeNpc, activeNpcInstanceId) : null;
  const isMerchantScene = dynamicEvent?.type === "merchant" && activeNpc?.role === "merchant";
  const isGateScene = dynamicEvent?.type === "gate" && activeNpc?.role === "guard";
  const dynamicLocationId = dynamicEvent && isLocationEvent(dynamicEvent) ? dynamicEvent.locationId : undefined;
  const dynamicCityId =
    dynamicLocationId === "western_great_city" || dynamicLocationId === "central_settlement"
      ? dynamicLocationId
      : undefined;
  const currentCityAccessStatus = dynamicCityId
    ? currentChatSave?.cityAccess?.[dynamicCityId]?.status
    : undefined;
  const merchantState = isMerchantScene && activeNpc ? getMerchantState(currentChatSave, activeNpc.id) : null;
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
      speaker: message.speaker === "player" ? "player" as const : "npc" as const,
      text: message.text,
      speakerName: message.speaker === "player" ? currentChatSave?.player.name ?? t("traveler") : activeNpc ? t(activeNpc.nameKey) : t("sceneDialogue.npc"),
    })),
    ...combatLog.map((entry) => ({
      id: entry.id,
      speaker: "npc" as const,
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
  const isNpcGone = npcState?.status === "gone" || npcState?.status === "escaped";
  const isNpcChatDisabled = Boolean(isNpcDead || isNpcGone || activeNpc?.role === "monster");
  const isRags = (currentChatSave?.player.currentOutfitStage ?? "rags") === "rags";

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

    void getAnarielIntroInitialReply(sourceSave).then((aiReply) => {
      const parsedReply = parseAiGameCommands(aiReply.usedFallback ? t("event.anarielIntro.aiInitialFallback1") : aiReply.text);
      const cleanReply = parsedReply.cleanText || t("event.anarielIntro.aiInitialFallback1");
      const nextAnariel = appendAnarielMessage(
        sourceAnariel,
        cleanReply,
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
      });

      saveGame(rewardResult.save);
      setChatSave(rewardResult.save);
      setRewardToast(getRewardToast(rewardResult.itemRewards, rewardResult.goldRewards));
      setAnarielChatNotice(aiReply.usedFallback ? t("companion.chat.aiUnavailable") : "");
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

    const addResult = addItemToInventory(sourceSave, "stale_bread", 1, "gate_ask_food");

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

  const handleDropTradeItem = () => {
    const sourceSave = currentChatSave;

    if (!sourceSave || !activeNpc || !npcState || !merchantState || !draggedTradeItem) {
      return;
    }

    const item = draggedTradeItem.side === "player_sells"
      ? sourceSave.inventory?.items.find((inventoryItem) => inventoryItem.id === draggedTradeItem.itemInstanceId)
      : merchantState.items.find((inventoryItem) => inventoryItem.id === draggedTradeItem.itemInstanceId);

    if (!item) {
      setDraggedTradeItem(null);
      return;
    }

    const nextMerchant = createMerchantDeal(merchantState, sourceSave.player, item, draggedTradeItem.side);
    const price = nextMerchant.activeDeal?.merchantOffer ?? 0;
    const playerLine = t(draggedTradeItem.side === "player_sells" ? "merchant.trade.playerOffersSell" : "merchant.trade.playerOffersBuy");
    const merchantLine = formatMerchantTradeText(
      draggedTradeItem.side === "player_sells" ? "merchant.trade.offerSell" : "merchant.trade.offerBuy",
      item,
      price,
    );
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

  const handleConfirmMerchantDeal = () => {
    const sourceSave = currentChatSave;

    if (!sourceSave || !activeNpc || !npcState || !merchantState || !activeMerchantDealItem) {
      return;
    }

    const result = confirmMerchantDeal(sourceSave, merchantState);

    if (!result.ok) {
      setNpcChatNotice(t("merchant.trade.failed"));
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

  const handleTravelChoice = (key: TranslationKey) => {
    setEventResultKey(key);
  };

  const askCompanionAdvice = () => {
    setCompanionAdviceIndex((currentIndex) => currentIndex + 1);
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
      const finalAnariel = appendDialogueMessages(updatedAnariel, playerText, narration.text);
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
    const saveForAi: GameSave = {
      ...sourceSave,
      companions: {
        ...sourceSave.companions,
        anariel: tonedAnariel,
      },
    };
    const fallbackReply = t(
      isAnarielIntroEvent
        ? getIntroFallbackReplyKey(sourceAnariel.dialogueHistory.length)
        : getFallbackReplyKey(sourceAnariel.dialogueHistory.length),
    );
    const aiReply = await getAnarielAiReply(saveForAi, playerText, isAnarielIntroEvent ? "intro_prisoner" : "companion");
    const parsedReply = parseAiGameCommands(aiReply.usedFallback ? fallbackReply : aiReply.text);
    const cleanReply = parsedReply.cleanText || fallbackReply;
    const finalAnariel = appendDialogueMessages(tonedAnariel, playerText, cleanReply);
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
    });

    saveGame(rewardResult.save);
    setChatSave(rewardResult.save);
    setRewardToast(getRewardToast(rewardResult.itemRewards, rewardResult.goldRewards));
    setAnarielChatNotice(
      aiReply.usedFallback
        ? t(aiReply.reason === "disabled" ? "companion.chat.aiDisabled" : "companion.chat.aiUnavailable")
        : "",
    );
    setIsAnarielThinking(false);
  };

  const handleSendNpcMessage = async () => {
    const playerText = npcChatInput.trim();
    const sourceSave = currentChatSave;

    if (!playerText || !sourceSave || !activeNpc || !npcState || isNpcThinking) {
      return;
    }

    if (isNpcDead || isNpcGone) {
      setNpcChatNotice(t(isNpcDead ? "npc.deadCannotTalk" : "npc.goneCannotTalk"));
      return;
    }

    setIsNpcThinking(true);
    setNpcChatInput("");

    const intent = parsePlayerIntent(playerText, {
      sceneId: "event_scene",
      eventId: sourceSave.activeEvent?.eventId,
      npcRole: activeNpc.role,
      language: getLanguage(),
    });

    if (intent.type === "attack") {
      handleCombatAttack(playerText, intent);
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
      const nextNpcState = appendNpcDialogueMessages(npcState, playerText, narration.text);
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
      setIsNpcThinking(false);
      return;
    }

    if (isGateScene && (intent.type === "request_city_entry" || intent.type === "show_document" || intent.type === "persuade" || intent.type === "negotiate" || intent.type === "bribe")) {
      const cityId = dynamicCityId;
      const allowed = Boolean(cityId) && (!isRags || intent.type === "show_document");
      const gateResultKey: TranslationKey = allowed ? "city.accessAllowed" : "city.accessDenied";
      const nextNpcState = appendNpcDialogueMessages(npcState, playerText, t(gateResultKey));
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
      setIsNpcThinking(false);
      return;
    }

    if (isMerchantScene && merchantState?.activeDeal) {
      const response = respondToTradeText(merchantState, sourceSave.player, playerText);
      const dealItem = activeMerchantDealItem;
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
      setIsNpcThinking(false);
      return;
    }

    if (intent.type === "ask_for_item" && intent.itemHint === "simple_clothes" && getAllowedNpcRewardIds(activeNpc).includes("simple_clothes")) {
      const addResult = addItemToInventory(sourceSave, "simple_clothes", 1, "scripted_event");
      const narrationText = t("event.intent.simpleClothesReceived");
      const nextNpcState = appendNpcDialogueMessages(npcState, playerText, narrationText);
      const nextSave: GameSave = {
        ...addResult.save,
        npcs: {
          ...(addResult.save.npcs ?? { instances: {} }),
          instances: {
            ...(addResult.save.npcs?.instances ?? {}),
            [nextNpcState.instanceId]: nextNpcState,
          },
        },
      };

      saveGame(nextSave);
      setChatSave(nextSave);
      setRewardToast(addResult.reward ? formatItemReward(addResult.reward) : "");
      setNpcChatNotice("");
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
      setIsNpcThinking(false);
      return;
    }

    const tonedNpc = applyNpcToneDelta(npcState, playerText);
    const fallbackReply = t(getNpcFallbackReplyKey(activeNpc, npcState.dialogueHistory.length) as TranslationKey);
    const aiReply = await getNpcAiReply(sourceSave, activeNpc, tonedNpc, playerText);
    const parsedReply = parseAiGameCommands(aiReply.usedFallback ? fallbackReply : aiReply.text);
    const cleanReply = parsedReply.cleanText || fallbackReply;
    const nextNpcState = appendNpcDialogueMessages(tonedNpc, playerText, cleanReply);
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
    });

    saveGame(rewardResult.save);
    setChatSave(rewardResult.save);
    setRewardToast(getRewardToast(rewardResult.itemRewards, rewardResult.goldRewards));
    setNpcChatNotice(aiReply.usedFallback ? t("npc.chat.aiUnavailable") : "");
    setIsNpcThinking(false);
  };

  const handleCombatAttack = (playerText?: string, intent?: PlayerIntent) => {
    const sourceSave = currentChatSave;

    if (!sourceSave || !activeNpc || !npcState || isNpcDead || isNpcGone) {
      return;
    }

    const result = resolvePlayerAttack(sourceSave, npcState, { type: "weapon" });
    const nextNpcState = result.npcInstance;
    const nextSave: GameSave = {
      ...result.save,
      npcs: {
        ...(result.save.npcs ?? { instances: {} }),
        templatesKnown: Array.from(new Set([...(sourceSave.npcs?.templatesKnown ?? []), activeNpc.id])),
        instances: {
          ...(result.save.npcs?.instances ?? {}),
          [nextNpcState.instanceId]: nextNpcState,
        },
      },
    };

    saveGame(nextSave);
    setChatSave(nextSave);
    setEventResultKey("");
    setCombatLog(getCombatLog(result, t(activeNpc.nameKey)));

    if (playerText && intent) {
      const narration = createGameMasterNarration({
        language: getLanguage(),
        sceneId: "event_scene",
        eventId: sourceSave.activeEvent?.eventId,
        playerState: nextSave.player,
        npcInstance: nextNpcState,
        intent,
        gameResult: {
          type: "combat.attack",
          success: result.ok,
          combat: result,
          enemyName: t(activeNpc.nameKey),
        },
      });
      const nextNpcDialogueState = appendNpcDialogueMessages(nextNpcState, playerText, narration.text);
      const saveWithDialogue: GameSave = {
        ...nextSave,
        npcs: {
          ...(nextSave.npcs ?? { instances: {} }),
          instances: {
            ...(nextSave.npcs?.instances ?? {}),
            [nextNpcDialogueState.instanceId]: nextNpcDialogueState,
          },
        },
      };

      saveGame(saveWithDialogue);
      setChatSave(saveWithDialogue);
    }

    if (result.enemyDefeated) {
      setIsNpcChatOpen(false);
      setNpcChatNotice(t("npc.deadCannotTalk"));
    }
  };

  if (dynamicEvent?.type === "necropolis") {
    return (
      <section className="event-scene event-scene--dynamic event-scene--necropolis" aria-labelledby="event-scene-title">
        <img className="event-scene-background" src={dynamicEvent.backgroundImage} alt="" />
        <div className="event-scene-vignette" aria-hidden="true" />

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

        {showAnarielCompanionPanel ? (
          <aside className="event-companion-advice">
            <strong>{t("companion.anariel.name")}</strong>
            <p>{t("companion.anariel.necropolisAdvice")}</p>
          </aside>
        ) : null}

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
      <section className={`event-scene event-scene--dynamic event-scene--${dynamicEvent.type}`} aria-labelledby="event-scene-title">
        <img className="event-scene-background" src={dynamicEvent.backgroundImage} alt="" />
        <div className="event-scene-vignette" aria-hidden="true" />

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

        {isMerchantScene && merchantState ? (
          <section className="merchant-trade-layout" aria-label={t("merchant.ui.tradePanel")}>
            <div className="merchant-inventory-panel">
              <header>
                <h2>{t("merchant.ui.playerInventory")}</h2>
                <span>{formatTemplate("merchant.ui.gold", { amount: currentChatSave?.inventory?.gold ?? 0 })}</span>
              </header>
              <div className="merchant-inventory-list">
                {(currentChatSave?.inventory?.items ?? []).length > 0 ? (
                  currentChatSave?.inventory?.items.map((item) => (
                    <button
                      className="merchant-trade-item"
                      draggable
                      key={item.id}
                      type="button"
                      onDragStart={() => setDraggedTradeItem({ side: "player_sells", itemInstanceId: item.id })}
                    >
                      <strong>{getItemLabel(item)}</strong>
                      <span>{formatTemplate("merchant.ui.itemMeta", { quantity: item.quantity, value: item.value })}</span>
                    </button>
                  ))
                ) : (
                  <p className="merchant-empty-text">{t("merchant.ui.empty")}</p>
                )}
              </div>
            </div>

            <div className="merchant-deal-panel">
              <header>
                <h2>{t("merchant.ui.deal")}</h2>
                <span>{t(getMerchantQuestHint(activeNpc.id, activeNpc.locationId) as TranslationKey)}</span>
              </header>
              <div
                className={`merchant-deal-dropzone${activeMerchantDeal ? " merchant-deal-dropzone--active" : ""}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDropTradeItem}
              >
                {activeMerchantDeal && activeMerchantDealItem ? (
                  <>
                    <small>{t(activeMerchantDeal.side === "player_sells" ? "merchant.ui.playerSells" : "merchant.ui.playerBuys")}</small>
                    <strong>{getItemLabel(activeMerchantDealItem)}</strong>
                    <span className="merchant-price">
                      {formatTemplate("merchant.ui.offer", { price: activeMerchantDeal.merchantOffer })}
                    </span>
                    <span>{t(`merchant.dealState.${activeMerchantDeal.dealState}` as TranslationKey)}</span>
                  </>
                ) : (
                  <>
                    <strong>{t("merchant.ui.noDeal")}</strong>
                    <span>{t("merchant.ui.dropHint")}</span>
                  </>
                )}
              </div>
              {activeMerchantDeal?.dealState === "accepted" ? (
                <div className="merchant-deal-actions">
                  <button className="merchant-confirm-button" type="button" onClick={handleConfirmMerchantDeal}>
                    {t("merchant.ui.confirm")}
                  </button>
                  <button className="merchant-refuse-button" type="button" onClick={handleRefuseMerchantDeal}>
                    {t("merchant.ui.refuse")}
                  </button>
                </div>
              ) : null}
            </div>

            <div className="merchant-inventory-panel merchant-inventory-panel--merchant">
              <header>
                <h2>{t("merchant.ui.merchantInventory")}</h2>
                <span>{formatTemplate("merchant.ui.gold", { amount: merchantState.gold })}</span>
              </header>
              <div className="merchant-inventory-list">
                {merchantState.items.length > 0 ? (
                  merchantState.items.map((item) => (
                    <button
                      className="merchant-trade-item"
                      draggable
                      key={item.id}
                      type="button"
                      onDragStart={() => setDraggedTradeItem({ side: "player_buys", itemInstanceId: item.id })}
                    >
                      <strong>{getItemLabel(item)}</strong>
                      <span>{formatTemplate("merchant.ui.itemMeta", { quantity: item.quantity, value: item.value })}</span>
                    </button>
                  ))
                ) : (
                  <p className="merchant-empty-text">{t("merchant.ui.empty")}</p>
                )}
              </div>
            </div>
          </section>
        ) : null}

        <section className="event-scene-dialogue-panel event-npc-panel scene-dialogue-panel--bottom-left scene-dialogue-panel--compact scene-dialogue-panel--transparent" aria-label={t("event.ui.dialoguePanel")}>
          <SceneDialoguePanel
            title={t("npc.chat.title")}
            speakerName={t(activeNpc.nameKey)}
            speakerRole={t(getNpcMoodKey(activeNpc))}
            speakerPortraitUrl={activeNpc.portraitUrl ?? speakerImage}
            messages={npcSceneMessages}
            emptyText={isNpcDead ? t("npc.deadCannotTalk") : isNpcGone ? t("npc.goneCannotTalk") : eventResultKey ? t(eventResultKey) : t(activeNpc.greetingKey)}
            value={npcChatInput}
            onChange={setNpcChatInput}
            onSend={() => {
              void handleSendNpcMessage();
            }}
            isThinking={isNpcThinking}
            thinkingText={activeNpc.role === "monster" ? t("sceneDialogue.thinkingMonster") : t("sceneDialogue.thinkingNpc")}
            notice={npcChatNotice || rewardToast}
            disabled={Boolean(isNpcDead || isNpcGone)}
            readOnly={Boolean(isNpcDead || isNpcGone)}
            stats={[
              { label: t("companion.relationship.relationship"), value: npcState?.relationship ?? 0 },
              { label: t("companion.relationship.trust"), value: npcState?.trust ?? 0 },
              { label: t("companion.relationship.fear"), value: npcState?.fear ?? 0 },
              { label: t("npc.relationship.hostility"), value: npcState?.hostility ?? 0 },
            ]}
          />
        </section>

        {showAnarielCompanionPanel ? (
          <aside className="event-companion-advice">
            <strong>{t("companion.anariel.name")}</strong>
            <p>{t(companionAdviceKey as TranslationKey)}</p>
          </aside>
        ) : null}

        <aside className="event-scene-interaction-panel event-status-panel" aria-label={t("event.ui.choicePanel")}>
          <section className="event-health-status" aria-label={t("event.status.health")}>
            <p>{formatHealthStatus(t("health.player"), currentChatSave?.player.combat?.currentHealth, currentChatSave?.player.combat?.maxHealth)}</p>
            <p>{formatHealthStatus(activeNpc ? t(activeNpc.nameKey) : t("sceneDialogue.npc"), npcState?.combat?.currentHealth, npcState?.combat?.maxHealth)}</p>
          </section>
          <section className="event-thought-panel" aria-label={t("event.status.thoughts")}>
            {getNpcThoughts(activeNpc, currentChatSave, npcState).map((thought) => (
              <p key={thought}>{thought}</p>
            ))}
          </section>
          <p className="event-scene-text-hint">{t("event.hint.typeAction")}</p>
          {currentChatSave?.activeEvent?.pendingTravelTargetId ? (
            <p className="event-travel-interruption">{t("event.travel.interrupted")}</p>
          ) : null}
          {isGateScene && currentCityAccessStatus === "allowed" ? (
            <button className="city-enter-button" type="button" onClick={handleEnterCity}>
              {t("city.enter")}
            </button>
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
            speakerPortraitUrl={speakerImage}
            messages={anarielSceneMessages}
            emptyText={isStandingStep ? t(event.dialogueStandingLineKey) : t("event.anarielIntro.aiInitialFallback1")}
            value={anarielChatInput}
            onChange={setAnarielChatInput}
            onSend={() => {
              void handleSendAnarielMessage();
            }}
            isThinking={isAnarielThinking}
            thinkingText={t("sceneDialogue.thinkingAnariel")}
            notice={anarielChatNotice}
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
