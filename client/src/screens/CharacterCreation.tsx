import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { saveGame } from "../systems/save/saveSystem";
import type {
  Attributes,
  DerivedStats,
  PlayerAppearance,
  PlayerClass,
  PlayerGender,
  PlayerOrigin,
  PlayerRace,
} from "../types/player";

type CharacterCreationProps = {
  onBackToMenu: () => void;
  onStartJourney: () => void;
};

type CreationStep = "race" | "gender" | "class" | "background" | "equipment";
type BackgroundChoice = "outcast" | "mercenary" | "mageApprentice";
type EquipmentChoice = "rags" | "commonClothes" | "armor";
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
  { id: "commonClothes", label: "Обычная одежда", symbol: "II" },
  { id: "armor", label: "Доспех", symbol: "III" },
];

const ATTRIBUTE_NAMES: Array<keyof Attributes> = [
  "strength",
  "constitution",
  "dexterity",
  "intelligence",
  "wisdom",
  "charisma",
];

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

const RACE_DESCRIPTION: Record<PlayerRace, string> = {
  human: "Люди быстро приспосабливаются к дорогам, клятвам и любой войне, где нужно выжить.",
  elf: "Эльфы слышат древний шёпот мира и видят путь там, где остальные замечают только тьму.",
  dwarf: "Дворфы крепки, упрямы и помнят каждую обиду дольше, чем живут человеческие королевства.",
  orc: "Орки выносливы, суровы и привыкли побеждать там, где слабые уже отступили.",
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
  commonClothes: "Простая одежда путника, пережившая пыль, холод и дождь.",
  armor: "Грубый доспех даёт уверенность тем, кто ждёт первого удара.",
};

const BASE_ATTRIBUTE_VALUE = 8;
const TOTAL_POINTS = 12;
const MAX_ATTRIBUTE_VALUE = 16;

const INITIAL_ATTRIBUTES: Attributes = {
  strength: BASE_ATTRIBUTE_VALUE,
  dexterity: BASE_ATTRIBUTE_VALUE,
  constitution: BASE_ATTRIBUTE_VALUE,
  intelligence: BASE_ATTRIBUTE_VALUE,
  wisdom: BASE_ATTRIBUTE_VALUE,
  charisma: BASE_ATTRIBUTE_VALUE,
};

const ORIGIN_BY_BACKGROUND: Record<BackgroundChoice, PlayerOrigin> = {
  outcast: "outcast",
  mercenary: "deserter",
  mageApprentice: "scholar",
};

const APPEARANCE_BY_EQUIPMENT: Record<EquipmentChoice, PlayerAppearance> = {
  rags: "wanderer",
  commonClothes: "ash",
  armor: "iron",
};

const CHARACTER_VISUAL_BY_EQUIPMENT: Record<EquipmentChoice, EquipmentVisual> = {
  rags: "starting",
  commonClothes: "clothing",
  armor: "armor",
};

function getModifier(value: number) {
  return Math.floor((value - 10) / 2);
}

function getDerivedStats(attributes: Attributes): DerivedStats {
  return {
    health: 10 + getModifier(attributes.constitution),
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
  const [equipment, setEquipment] = useState<EquipmentChoice>("rags");
  const [attributes, setAttributes] = useState<Attributes>(INITIAL_ATTRIBUTES);

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
    EQUIPMENT_OPTIONS.find((option) => option.id === equipment) ?? EQUIPMENT_OPTIONS[0];
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

  const spentPoints = ATTRIBUTE_NAMES.reduce(
    (total, attribute) => total + attributes[attribute] - BASE_ATTRIBUTE_VALUE,
    0,
  );
  const remainingPoints = TOTAL_POINTS - spentPoints;

  const changeAttribute = (attribute: keyof Attributes, direction: -1 | 1) => {
    setAttributes((currentAttributes) => {
      const currentValue = currentAttributes[attribute];
      const currentSpentPoints = ATTRIBUTE_NAMES.reduce(
        (total, currentAttribute) =>
          total + currentAttributes[currentAttribute] - BASE_ATTRIBUTE_VALUE,
        0,
      );

      if (direction > 0) {
        if (currentValue >= MAX_ATTRIBUTE_VALUE || currentSpentPoints >= TOTAL_POINTS) {
          return currentAttributes;
        }
      } else if (currentValue <= BASE_ATTRIBUTE_VALUE) {
        return currentAttributes;
      }

      return {
        ...currentAttributes,
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
    equipment,
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
      setEquipment(id as EquipmentChoice);
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

    const portraitUrl = getCharacterImage(race, gender, equipment);

    saveGame({
      player: {
        id: createCharacterId(),
        name: trimmedCharacterName,
        origin: ORIGIN_BY_BACKGROUND[background],
        race,
        gender,
        characterClass,
        appearance: APPEARANCE_BY_EQUIPMENT[equipment],
        portraitUrl,
        attributes,
        derivedStats,
        createdAt: new Date().toISOString(),
      },
    });

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
          src={getCharacterImage(race, gender, equipment)}
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
                        disabled={attributes[attribute] <= BASE_ATTRIBUTE_VALUE}
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
                          attributes[attribute] >= MAX_ATTRIBUTE_VALUE || remainingPoints <= 0
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
                        width: `${(attributes[attribute] / MAX_ATTRIBUTE_VALUE) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="creation-description">
            <p>{RACE_DESCRIPTION[race]}</p>
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
