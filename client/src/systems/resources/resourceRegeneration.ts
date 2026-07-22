import type { GameSave } from "../save/saveSystem";

export type ResourceRegenerationMode = "normal" | "combat" | "rest" | "sleep";

export type ResourceRegenerationState = {
  lastProcessedGameMinute: number;
  manaBlockedUntilGameMinute?: number;
  staminaBlockedUntilGameMinute?: number;
  manaRemainder: number;
  staminaRemainder: number;
  healthRemainder: number;
};

export type ResourceRegenerationOptions = {
  mode?: ResourceRegenerationMode;
  skipHealthRecovery?: boolean;
};

export const RESOURCE_REGENERATION_CONFIG = {
  healthPerGameMinute: 1 / (6 * 60),
  manaPerGameMinute: 0.2,
  staminaPerGameMinute: 0.45,
  spendDelayMinutes: {
    mana: 5,
    stamina: 2,
  },
  modeMultiplier: {
    normal: 1,
    combat: 0.25,
    rest: 2.5,
    sleep: 4,
  } satisfies Record<ResourceRegenerationMode, number>,
};

export const CAMP_REST_HOURS = 8;

export function isActiveCombat(save: Pick<GameSave, "activeCombat">) {
  const phase = save.activeCombat?.phase;
  return Boolean(phase && phase !== "victory" && phase !== "defeat" && phase !== "finished");
}

export function hasActiveBleeding(save: Pick<GameSave, "activeCombat" | "player">) {
  const persistentBleeding = save.player.textCombat?.injuries.some((injury) => injury.type === "bleeding") ?? false;
  const playerCombatant = save.activeCombat
    ? Object.values(save.activeCombat.combatants).find((combatant) => combatant.side === "player")
    : undefined;

  return persistentBleeding || Boolean(playerCombatant?.statuses.some((status) => status.kind === "bleeding"));
}

export function getCampRestHealthRecovery(save: Pick<GameSave, "player">) {
  const currentHealth = Math.max(0, save.player.combat?.currentHealth ?? 0);
  const maxHealth = Math.max(0, save.player.combat?.maxHealth ?? currentHealth);
  const recovery = Math.max(3, Math.ceil(maxHealth * 0.3));
  const nextHealth = Math.min(maxHealth, currentHealth + recovery);

  return {
    currentHealth,
    maxHealth,
    recovery: Math.max(0, nextHealth - currentHealth),
    nextHealth,
  };
}

export function applyCampRestHealthRecovery(save: GameSave): GameSave {
  const recovery = getCampRestHealthRecovery(save);

  return {
    ...save,
    player: {
      ...save.player,
      combat: save.player.combat
        ? {
            ...save.player.combat,
            currentHealth: recovery.nextHealth,
          }
        : save.player.combat,
    },
  };
}

export function getGameMinute(save: Pick<GameSave, "currentDay" | "currentHour">) {
  const day = Number.isFinite(save.currentDay) ? Math.max(1, Math.floor(Number(save.currentDay))) : 1;
  const hour = Number.isFinite(save.currentHour) ? Math.max(0, Math.min(23, Math.floor(Number(save.currentHour)))) : 6;

  return ((day - 1) * 24 + hour) * 60;
}

export function normalizeResourceRegenerationState(
  value: unknown,
  currentGameMinute: number,
): ResourceRegenerationState {
  const source = value && typeof value === "object" ? value as Partial<ResourceRegenerationState> : {};
  const lastProcessedGameMinute = Number.isFinite(source.lastProcessedGameMinute)
    ? Math.max(0, Math.floor(Number(source.lastProcessedGameMinute)))
    : currentGameMinute;

  return {
    lastProcessedGameMinute,
    manaBlockedUntilGameMinute: Number.isFinite(source.manaBlockedUntilGameMinute)
      ? Math.max(0, Math.floor(Number(source.manaBlockedUntilGameMinute)))
      : undefined,
    staminaBlockedUntilGameMinute: Number.isFinite(source.staminaBlockedUntilGameMinute)
      ? Math.max(0, Math.floor(Number(source.staminaBlockedUntilGameMinute)))
      : undefined,
    manaRemainder: Number.isFinite(source.manaRemainder) ? Math.max(0, Number(source.manaRemainder)) : 0,
    staminaRemainder: Number.isFinite(source.staminaRemainder) ? Math.max(0, Number(source.staminaRemainder)) : 0,
    healthRemainder: Number.isFinite(source.healthRemainder) ? Math.max(0, Number(source.healthRemainder)) : 0,
  };
}

function getEffectiveElapsedMinutes(
  fromMinute: number,
  toMinute: number,
  blockedUntilMinute?: number,
) {
  if (toMinute <= fromMinute) {
    return 0;
  }

  return Math.max(0, toMinute - Math.max(fromMinute, blockedUntilMinute ?? fromMinute));
}

function applyIntegerGain(
  current: number,
  maximum: number,
  rawGain: number,
  remainder: number,
) {
  if (maximum <= 0 || current >= maximum) {
    return { value: Math.min(maximum, current), remainder: 0 };
  }

  const total = rawGain + remainder;
  const integerGain = Math.floor(total);
  const nextValue = Math.min(maximum, current + integerGain);

  return {
    value: nextValue,
    remainder: nextValue >= maximum ? 0 : total - integerGain,
  };
}

export function applyResourceRegeneration(
  save: GameSave,
  options: ResourceRegenerationOptions = {},
): GameSave {
  const currentGameMinute = getGameMinute(save);
  const state = normalizeResourceRegenerationState(save.resourceRegeneration, currentGameMinute);
  const elapsedMinutes = Math.max(0, currentGameMinute - state.lastProcessedGameMinute);

  if (elapsedMinutes <= 0) {
    return {
      ...save,
      resourceRegeneration: {
        ...state,
        lastProcessedGameMinute: currentGameMinute,
      },
    };
  }

  const mode = options.mode ?? "normal";
  const multiplier = RESOURCE_REGENERATION_CONFIG.modeMultiplier[mode];
  const magic = save.player.magic;
  const textCombat = save.player.textCombat;
  const combat = save.player.combat;
  const manaElapsed = getEffectiveElapsedMinutes(
    state.lastProcessedGameMinute,
    currentGameMinute,
    state.manaBlockedUntilGameMinute,
  );
  const staminaElapsed = getEffectiveElapsedMinutes(
    state.lastProcessedGameMinute,
    currentGameMinute,
    state.staminaBlockedUntilGameMinute,
  );
  const manaRate = magic
    ? RESOURCE_REGENERATION_CONFIG.manaPerGameMinute + Math.max(0, magic.manaRegeneration) / 60
    : 0;
  const manaResult = magic
    ? applyIntegerGain(
        magic.mana,
        magic.maxMana,
        manaElapsed * manaRate * multiplier,
        state.manaRemainder,
      )
    : { value: 0, remainder: 0 };
  const staminaResult = textCombat
    ? applyIntegerGain(
        textCombat.stamina,
        textCombat.maxStamina,
        staminaElapsed * RESOURCE_REGENERATION_CONFIG.staminaPerGameMinute * multiplier,
        state.staminaRemainder,
      )
    : { value: 0, remainder: 0 };
  const canRecoverHealth = Boolean(
    combat
      && combat.currentHealth > 0
      && combat.currentHealth < combat.maxHealth
      && !options.skipHealthRecovery
      && !isActiveCombat(save)
      && !hasActiveBleeding(save),
  );
  const healthResult = combat && canRecoverHealth
    ? applyIntegerGain(
        combat.currentHealth,
        combat.maxHealth,
        elapsedMinutes * RESOURCE_REGENERATION_CONFIG.healthPerGameMinute,
        state.healthRemainder,
      )
    : {
        value: combat?.currentHealth ?? 0,
        remainder: combat && combat.currentHealth >= combat.maxHealth ? 0 : state.healthRemainder,
      };

  return {
    ...save,
    resourceRegeneration: {
      ...state,
      lastProcessedGameMinute: currentGameMinute,
      manaRemainder: manaResult.remainder,
      staminaRemainder: staminaResult.remainder,
      healthRemainder: healthResult.remainder,
    },
    player: {
      ...save.player,
      magic: magic
        ? {
            ...magic,
            mana: manaResult.value,
          }
        : magic,
      textCombat: textCombat
        ? {
            ...textCombat,
            stamina: staminaResult.value,
          }
        : textCombat,
      combat: combat
        ? {
            ...combat,
            currentHealth: healthResult.value,
          }
        : combat,
    },
  };
}

export function markResourceSpent(save: GameSave, resource: "mana" | "stamina"): GameSave {
  const currentGameMinute = getGameMinute(save);
  const state = normalizeResourceRegenerationState(save.resourceRegeneration, currentGameMinute);

  return {
    ...save,
    resourceRegeneration: {
      ...state,
      lastProcessedGameMinute: currentGameMinute,
      ...(resource === "mana"
        ? { manaBlockedUntilGameMinute: currentGameMinute + RESOURCE_REGENERATION_CONFIG.spendDelayMinutes.mana }
        : { staminaBlockedUntilGameMinute: currentGameMinute + RESOURCE_REGENERATION_CONFIG.spendDelayMinutes.stamina }),
    },
  };
}
