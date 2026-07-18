import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { t, type TranslationKey } from "../i18n/i18n";
import { createDefaultInventoryState } from "../data/inventoryMockData";
import {
  ATTRIBUTE_KEYS,
  BASE_ATTRIBUTES,
  STARTING_STAT_MAX,
  STARTING_STAT_MIN,
  calculateFinalAttributes,
  createEmptyAttributeAllocation,
  getRaceDefinition,
  getSpentAttributePoints,
  getStartingAttributePointTotal,
  RACIAL_STATS_SCHEMA_VERSION,
  type AttributeAllocation,
} from "../data/raceDefinitions";
import {
  addUniqueInventoryItem,
  CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID,
  MAGIC_APPRENTICE_GUIDE_ITEM_ID,
  MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID,
} from "../systems/inventory/readableItems";
import { createDefaultMagicState } from "../systems/magic";
import { saveGame } from "../systems/save/saveSystem";
import type {
  Attributes,
  DerivedStats,
  PlayerAppearance,
  PlayerClass,
  PlayerGender,
  PlayerOrigin,
  PlayerOutfitStage,
  PlayerRace,
} from "../types/player";

type CharacterCreationProps = {
  onBackToMenu: () => void;
  onStartJourney: () => void;
};

type CreationStep = "race" | "gender" | "class" | "background" | "equipment";
type BackgroundChoice = "outcast" | "mercenary" | "mageApprentice";
type EquipmentChoice = PlayerOutfitStage;
type EquipmentVisual = "starting" | "clothing" | "armor";

type SelectorOption<T extends string> = {
  id: T;
  label: string;
  icon?: string;
  symbol?: string;
};

const STEPS: Array<SelectorOption<CreationStep>> = [
  { id: "race", label: "Раса", icon: "/assets/ui/icons/character-creation/race-selection-icon.png" },
  { id: "gender", label: "Пол", symbol: "⚥" },
  { id: "class", label: "Класс", symbol: "⚔" },
  { id: "background", label: "Предыстория", symbol: "✦" },
  { id: "equipment", label: "Снаряжение", symbol: "♜" },
];

const RACE_OPTIONS: Array<SelectorOption<PlayerRace>> = [
  { id: "human", label: "Человек", icon: "/assets/ui/buttons/race-selection/race-human-button.png" },
  { id: "elf", label: "Эльф", icon: "/assets/ui/buttons/race-selection/race-elf-button.png" },
  { id: "dwarf", label: "Дворф", icon: "/assets/ui/buttons/race-selection/race-dwarf-button.png" },
  { id: "orc", label: "Орк", icon: "/assets/ui/buttons/race-selection/race-orc-button.png" },
];

const GENDER_OPTIONS: Array<SelectorOption<PlayerGender>> = [
  { id: "male", label: "Мужской", icon: "/assets/ui/buttons/gender-selection/gender-male-button.png" },
  { id: "female", label: "Женский", icon: "/assets/ui/buttons/gender-selection/gender-female-button.png" },
];

const CLASS_OPTIONS: Array<SelectorOption<PlayerClass>> = [
  { id: "warrior", label: "Воин", icon: "/assets/ui/buttons/class-selection/class-warrior-button.png" },
  { id: "rogue", label: "Разбойник", icon: "/assets/ui/buttons/class-selection/class-rogue-button.png" },
  { id: "mage", label: "Маг", icon: "/assets/ui/buttons/class-selection/class-mage-button.png" },
];

const BACKGROUND_OPTIONS: Array<SelectorOption<BackgroundChoice>> = [
  { id: "outcast", label: "Изгнанник", icon: "/assets/icons/origin-outcast.png", symbol: "✧" },
  { id: "mercenary", label: "Наёмник", icon: "/assets/icons/origin-mercenary.png", symbol: "⚑" },
  { id: "mageApprentice", label: "Ученик мага", icon: "/assets/icons/origin-mage-apprentice.png", symbol: "✹" },
];

const EQUIPMENT_OPTIONS: Array<SelectorOption<EquipmentChoice>> = [
  { id: "rags", label: "Лахмотья", symbol: "I" },
  { id: "clothes", label: "Обычная одежда", symbol: "II" },
  { id: "armor", label: "Доспех", symbol: "III" },
];

const STARTING_OUTFIT_STAGE: PlayerOutfitStage = "rags";

const OUTFIT_STAGE_LABEL_KEYS: Record<PlayerOutfitStage, TranslationKey> = {
  rags: "characterCreation.outfitRags",
  clothes: "characterCreation.outfitClothes",
  armor: "characterCreation.outfitArmor",
};

const OUTFIT_STAGE_DESCRIPTION_KEYS: Record<PlayerOutfitStage, TranslationKey> = {
  rags: "characterCreation.outfitRagsDescription",
  clothes: "characterCreation.outfitClothesDescription",
  armor: "characterCreation.outfitArmorDescription",
};

const ATTRIBUTE_NAMES: Array<keyof Attributes> = ATTRIBUTE_KEYS;

const ATTRIBUTE_META: Record<
  keyof Attributes,
  { label: string; icon: string }
> = {
  strength: {
    label: "Сила",
    icon: "/assets/ui/icons/attributes/attribute-strength-icon.png",
  },
  dexterity: {
    label: "Ловкость",
    icon: "/assets/ui/icons/attributes/attribute-dexterity-icon.png",
  },
  constitution: {
    label: "Выносливость",
    icon: "/assets/ui/icons/attributes/attribute-vitality-icon.png",
  },
  intelligence: {
    label: "Интеллект",
    icon: "/assets/ui/icons/attributes/attribute-intelligence-icon.png",
  },
  wisdom: {
    label: "Мудрость",
    icon: "/assets/ui/icons/attributes/attribute-wisdom-icon.png",
  },
  charisma: {
    label: "Харизма",
    icon: "/assets/ui/icons/attributes/attribute-charisma-icon.png",
  },
};

const CLASS_DESCRIPTION: Record<PlayerClass, string> = {
  warrior: "Воин держит строй, принимает удар и отвечает простой силой стали.",
  rogue: "Разбойник выбирает тень, быстрый удар и путь, который никто не охраняет.",
  mage: "Маг ищет запретные знаки, старые имена и силу, которую опасно произносить вслух.",
};

const BACKGROUND_DESCRIPTION: Record<BackgroundChoice, string> = {
  outcast: "Изгнанник начинает путь без дома, но с редким даром выживать.",
  mercenary: "Наёмник видел кровь и цену обещаний ещё до первой настоящей легенды.",
  mageApprentice: "Ученик мага знает слишком мало, чтобы быть мудрым, и достаточно, чтобы быть опасным.",
};

const EQUIPMENT_DESCRIPTION: Record<EquipmentChoice, string> = {
  rags: "Лёгкие лохмотья не защищают, но не мешают двигаться.",
  clothes: "Простая одежда путника, пережившая пыль, холод и дождь.",
  armor: "Грубый доспех даёт уверенность тем, кто ждёт первого удара.",
};

const ORIGIN_BY_BACKGROUND: Record<BackgroundChoice, PlayerOrigin> = {
  outcast: "outcast",
  mercenary: "deserter",
  mageApprentice: "scholar",
};

const APPEARANCE_BY_EQUIPMENT: Record<EquipmentChoice, PlayerAppearance> = {
  rags: "wanderer",
  clothes: "ash",
  armor: "iron",
};

const CHARACTER_VISUAL_BY_EQUIPMENT: Record<EquipmentChoice, EquipmentVisual> = {
  rags: "starting",
  clothes: "clothing",
  armor: "armor",
};

function getModifier(value: number) {
  return Math.floor((value - 10) / 2);
}

function getDerivedStats(attributes: Attributes): DerivedStats {
  return {
    health: 10 + getModifier(attributes.constitution) * 2,
    stamina: 10 + getModifier(attributes.strength) + getModifier(attributes.constitution),
    armorClass: 10 + getModifier(attributes.dexterity),
  };
}

function createCharacterId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `player-${Date.now()}`;
}

function getCharacterImage(
  race: PlayerRace,
  gender: PlayerGender,
  equipment: EquipmentChoice,
) {
  const visual = CHARACTER_VISUAL_BY_EQUIPMENT[equipment];

  return `/assets/characters/player/${race}/${gender}/${race}-${gender}-${visual}.png`;
}

export function CharacterCreation({ onBackToMenu, onStartJourney }: CharacterCreationProps) {
  const [activeStep, setActiveStep] = useState<CreationStep>("race");
  const [pendingStep, setPendingStep] = useState<CreationStep | null>(null);
  const [characterName, setCharacterName] = useState("");
  const [race, setRace] = useState<PlayerRace>("human");
  const [gender, setGender] = useState<PlayerGender>("male");
  const [characterClass, setCharacterClass] = useState<PlayerClass>("warrior");
  const [background, setBackground] = useState<BackgroundChoice>("outcast");
  const [previewOutfitStage, setPreviewOutfitStage] =
    useState<PlayerOutfitStage>(STARTING_OUTFIT_STAGE);
  const [allocatedAttributes, setAllocatedAttributes] = useState<AttributeAllocation>(() => createEmptyAttributeAllocation());

  const selectedRaceDefinition = getRaceDefinition(race);
  const attributes = useMemo(
    () => calculateFinalAttributes(BASE_ATTRIBUTES, allocatedAttributes, race),
    [allocatedAttributes, race],
  );
  const derivedStats = useMemo(() => getDerivedStats(attributes), [attributes]);
  const trimmedCharacterName = characterName.trim();
  const isNameMissing = trimmedCharacterName.length === 0;
  const isNameTooShort = trimmedCharacterName.length > 0 && trimmedCharacterName.length < 2;
  const canStartJourney = trimmedCharacterName.length >= 2;
  const selectedRace = RACE_OPTIONS.find((option) => option.id === race) ?? RACE_OPTIONS[0];
  const selectedClass =
    CLASS_OPTIONS.find((option) => option.id === characterClass) ?? CLASS_OPTIONS[0];
  const selectedGender = GENDER_OPTIONS.find((option) => option.id === gender) ?? GENDER_OPTIONS[0];
  const selectedBackground =
    BACKGROUND_OPTIONS.find((option) => option.id === background) ?? BACKGROUND_OPTIONS[0];
  const selectedEquipment =
    EQUIPMENT_OPTIONS.find((option) => option.id === previewOutfitStage) ?? EQUIPMENT_OPTIONS[0];
  const visualStep = pendingStep ?? activeStep;
  const isRotatingStepRing = pendingStep !== null;
  const activeStepIndex = Math.max(
    0,
    STEPS.findIndex((step) => step.id === visualStep),
  );
  const ringStyle = {
    "--active-step-angle": `${activeStepIndex * -72}deg`,
    "--active-step-counter-angle": `${activeStepIndex * 72}deg`,
    "--ring-outer-angle": `${activeStepIndex * -72}deg`,
    "--ring-inner-angle": `${activeStepIndex * 72}deg`,
  } as CSSProperties;

  useEffect(() => {
    if (!pendingStep) {
      return;
    }

    const rotationTimer = window.setTimeout(() => {
      setActiveStep(pendingStep);
      setPendingStep(null);
    }, 580);

    return () => window.clearTimeout(rotationTimer);
  }, [pendingStep]);

  const totalAttributePoints = getStartingAttributePointTotal(race);
  const spentPoints = getSpentAttributePoints(allocatedAttributes);
  const remainingPoints = totalAttributePoints - spentPoints;

  const changeAttribute = (attribute: keyof Attributes, direction: -1 | 1) => {
    setAllocatedAttributes((currentAllocation) => {
      const currentValue = currentAllocation[attribute];
      const currentSpentPoints = getSpentAttributePoints(currentAllocation);
      const finalValue = BASE_ATTRIBUTES[attribute] + currentValue + selectedRaceDefinition.statModifiers[attribute];

      if (direction > 0) {
        if (finalValue >= STARTING_STAT_MAX || currentSpentPoints >= totalAttributePoints) {
          return currentAllocation;
        }
      } else if (currentValue <= 0 || finalValue <= STARTING_STAT_MIN) {
        return currentAllocation;
      }

      return {
        ...currentAllocation,
        [attribute]: currentValue + direction,
      };
    });
  };

  const selectorOptions = useMemo(() => {
    switch (activeStep) {
      case "race":
        return RACE_OPTIONS;
      case "gender":
        return GENDER_OPTIONS;
      case "class":
        return CLASS_OPTIONS;
      case "background":
        return BACKGROUND_OPTIONS;
      case "equipment":
        return EQUIPMENT_OPTIONS;
    }
  }, [activeStep]);

  const selectedOptionId = {
    race,
    gender,
    class: characterClass,
    background,
    equipment: previewOutfitStage,
  }[activeStep];

  const selectorTitle = {
    race: selectedRace.label,
    gender: selectedGender.label,
    class: selectedClass.label,
    background: selectedBackground.label,
    equipment: selectedEquipment.label,
  }[activeStep];

  const chooseOption = (id: string) => {
    if (activeStep === "race") {
      setRace(id as PlayerRace);
    }

    if (activeStep === "gender") {
      setGender(id as PlayerGender);
    }

    if (activeStep === "class") {
      setCharacterClass(id as PlayerClass);
    }

    if (activeStep === "background") {
      setBackground(id as BackgroundChoice);
    }

    if (activeStep === "equipment") {
      setPreviewOutfitStage(id as PlayerOutfitStage);
    }
  };

  const chooseStep = (step: CreationStep) => {
    if (step === visualStep) {
      return;
    }

    setPendingStep(step);
  };

  const startJourney = () => {
    if (!canStartJourney) {
      return;
    }

    const startingOutfitStage = STARTING_OUTFIT_STAGE;
    const portraitUrl = getCharacterImage(race, gender, startingOutfitStage);

    const nextSave = {
      player: {
        id: createCharacterId(),
        name: trimmedCharacterName,
        origin: ORIGIN_BY_BACKGROUND[background],
        race,
        gender,
        characterClass,
        appearance: APPEARANCE_BY_EQUIPMENT[startingOutfitStage],
        currentOutfitStage: startingOutfitStage,
        unlockedOutfitStages: [startingOutfitStage],
        portraitUrl,
        baseAttributes: BASE_ATTRIBUTES,
        allocatedAttributes,
        racialModifiers: selectedRaceDefinition.statModifiers,
        statsSchemaVersion: RACIAL_STATS_SCHEMA_VERSION,
        attributes,
        derivedStats,
        magic: createDefaultMagicState(characterClass),
        createdAt: new Date().toISOString(),
      },
      inventory: createDefaultInventoryState(),
    };

    const saveWithMeleeGuide = addUniqueInventoryItem(nextSave, MELEE_COMBAT_BEGINNER_GUIDE_ITEM_ID, "starting_character");
    const saveWithCrossbowGuide = addUniqueInventoryItem(saveWithMeleeGuide, CROSSBOW_AND_BOLTS_GUIDE_ITEM_ID, "starting_character");
    const saveWithClassGuides =
      characterClass === "mage" || background === "mageApprentice"
        ? addUniqueInventoryItem(saveWithCrossbowGuide, MAGIC_APPRENTICE_GUIDE_ITEM_ID, "starting_mage")
        : saveWithCrossbowGuide;

    saveGame(saveWithClassGuides);

    onStartJourney();
  };

  return (
    <section className="character-creation-scene" aria-labelledby="character-creation-title">
      <button className="creation-back-button" type="button" onClick={onBackToMenu}>
        Назад
      </button>

      <aside className="creation-step-nav" aria-label="Этапы создания персонажа" style={ringStyle}>
        <div className="creation-step-ring" aria-hidden="true">
          <img
            className="creation-step-ring__outer"
            src="/assets/ui/character-creation/character-creation-ring-outer.png"
            alt=""
          />
          <img
            className="creation-step-ring__inner"
            src="/assets/ui/character-creation/character-creation-ring-inner.png"
            alt=""
          />
        </div>
        {STEPS.map((step, index) => (
          <button
            className={`creation-step creation-step--slot-${index} ${!isRotatingStepRing && activeStep === step.id ? "creation-step--active" : ""}`}
            key={step.id}
            style={ringStyle}
            type="button"
            onClick={() => chooseStep(step.id)}
          >
            <span className="creation-step__icon">
              {step.icon ? <img alt="" src={step.icon} /> : step.symbol}
            </span>
            <span className="creation-step__label">{step.label}</span>
          </button>
        ))}
      </aside>

      <main className="creation-character-stage" aria-label="Предпросмотр персонажа">
        <label className="creation-name-field creation-name-field--stage" htmlFor="character-name">
          <span>Имя персонажа</span>
          <input
            id="character-name"
            value={characterName}
            onChange={(event) => setCharacterName(event.target.value)}
            maxLength={32}
            placeholder="Имя персонажа"
          />
        </label>
        <div className="creation-character-stage__light" aria-hidden="true" />
        <img
          className={`creation-character-image creation-character-image--${race}`}
          src={getCharacterImage(race, gender, previewOutfitStage)}
          alt={`${selectedRace.label}, ${selectedGender.label}`}
        />
        <div className="creation-character-stage__pedestal" aria-hidden="true" />
      </main>

      <aside className="creation-reference-panel" aria-label="Информация о персонаже">
        <div className="creation-reference-panel__inner">
          <div className="creation-character-title">
            <h1 id="character-creation-title">{trimmedCharacterName || selectedRace.label}</h1>
            <span>Создание персонажа</span>
          </div>

          <section
            className="character-appearance-preview"
            aria-label={t("characterCreation.appearancePreview")}
          >
            <h2>{t("characterCreation.appearancePreview")}</h2>
            <div
              className="character-outfit-tabs"
              role="tablist"
              aria-label={t("characterCreation.outfitStage")}
            >
              {EQUIPMENT_OPTIONS.map((option) => {
                const isActive = previewOutfitStage === option.id;

                return (
                  <button
                    className={`character-outfit-tab ${isActive ? "character-outfit-tab--active" : ""}`}
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setPreviewOutfitStage(option.id)}
                  >
                    <span className="character-outfit-stage-label">
                      {t(OUTFIT_STAGE_LABEL_KEYS[option.id])}
                    </span>
                    {option.id !== STARTING_OUTFIT_STAGE ? (
                      <span className="character-outfit-stage-locked">
                        {t("characterCreation.unlockedLater")}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p className="character-outfit-description">
              {t(OUTFIT_STAGE_DESCRIPTION_KEYS[previewOutfitStage])}
            </p>
            <p className="character-outfit-preview-note">
              {t("characterCreation.outfitPreviewOnly")}
            </p>
          </section>

          <div className="creation-point-summary">
            <span>Очки характеристик</span>
            <strong>{remainingPoints}</strong>
          </div>

          <div className="creation-attribute-list">
            {ATTRIBUTE_NAMES.map((attribute) => (
              <div className="creation-attribute-row" key={attribute}>
                <img src={ATTRIBUTE_META[attribute].icon} alt="" />
                <div className="creation-attribute-row__body">
                  <div className="creation-attribute-row__header">
                    <span>{ATTRIBUTE_META[attribute].label}</span>
                    <div className="creation-attribute-row__controls">
                      <button
                        className="creation-attribute-button"
                        type="button"
                        onClick={() => changeAttribute(attribute, -1)}
                        disabled={allocatedAttributes[attribute] <= 0 || attributes[attribute] <= STARTING_STAT_MIN}
                        aria-label={`Уменьшить ${ATTRIBUTE_META[attribute].label}`}
                      >
                        -
                      </button>
                      <strong>{attributes[attribute]}</strong>
                      <button
                        className="creation-attribute-button"
                        type="button"
                        onClick={() => changeAttribute(attribute, 1)}
                        disabled={
                          attributes[attribute] >= STARTING_STAT_MAX || remainingPoints <= 0
                        }
                        aria-label={`Увеличить ${ATTRIBUTE_META[attribute].label}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="creation-attribute-row__bar">
                    <span
                      style={{
                        width: `${(attributes[attribute] / STARTING_STAT_MAX) * 100}%`,
                      }}
                    />
                  </div>
                  <small className="creation-attribute-row__modifier">
                    {t("characterCreation.racialModifier")}: {selectedRaceDefinition.statModifiers[attribute] >= 0 ? "+" : ""}
                    {selectedRaceDefinition.statModifiers[attribute]}
                  </small>
                </div>
              </div>
            ))}
          </div>

          <div className="creation-description">
            <p>{t(selectedRaceDefinition.descriptionKey)}</p>
            <p>{CLASS_DESCRIPTION[characterClass]}</p>
            <p>{BACKGROUND_DESCRIPTION[background]}</p>
          </div>

          <div className="creation-derived-stats">
            <strong className="creation-derived-stats__title">Производные параметры</strong>
            <span>Здоровье {derivedStats.health}</span>
            <span>Запас сил {derivedStats.stamina}</span>
            <span>Броня {derivedStats.armorClass}</span>
          </div>

          <div className="creation-warnings" role="status" aria-live="polite">
            {isNameMissing ? <span>Введите имя персонажа.</span> : null}
            {isNameTooShort ? <span>Имя должно быть не короче 2 символов.</span> : null}
            {remainingPoints > 0 ? <span>Осталось распределить очки: {remainingPoints}.</span> : null}
          </div>

          <div className="creation-panel-slots" aria-hidden="true">
            <span>{selectedRace.label[0]}</span>
            <span>{selectedClass.label[0]}</span>
            <span>{selectedBackground.label[0]}</span>
            <span>{selectedEquipment.label[0]}</span>
          </div>
        </div>
      </aside>

      <section className="creation-bottom-selector" data-active-step={activeStep} aria-label="Выбор параметра">
        <div className="creation-bottom-selector__title">{selectorTitle}</div>
        <div className="creation-option-row">
          {selectorOptions.map((option) => (
            <button
              className={`creation-option ${selectedOptionId === option.id ? "creation-option--active" : ""}`}
              key={option.id}
              type="button"
              onClick={() => chooseOption(option.id)}
            >
              <span className="creation-option__icon">
                {option.icon ? <img src={option.icon} alt="" /> : option.symbol}
              </span>
              <span className="creation-option__label">{option.label}</span>
            </button>
          ))}
        </div>
      </section>

      <button
        className="creation-confirm-button"
        type="button"
        onClick={startJourney}
        disabled={!canStartJourney}
      >
        СОЗДАТЬ
      </button>
    </section>
  );
}
