import { useMemo, useState } from "react";
import { FantasyButton } from "../components/FantasyButton";
import { ScreenPanel } from "../components/ScreenPanel";
import { t, type TranslationKey } from "../i18n/i18n";
import { saveGame } from "../systems/save/saveSystem";
import type { Attributes, DerivedStats, PlayerOrigin } from "../types/player";

type CharacterCreationProps = {
  onBackToMenu: () => void;
  onStartJourney: () => void;
};

const ATTRIBUTE_NAMES: Array<keyof Attributes> = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

const ORIGINS: PlayerOrigin[] = ["prisoner", "deserter", "hunter", "scholar", "outcast"];
const ATTRIBUTE_LABEL_KEYS: Record<keyof Attributes, TranslationKey> = {
  strength: "strength",
  dexterity: "dexterity",
  constitution: "constitution",
  intelligence: "intelligence",
  wisdom: "wisdom",
  charisma: "charisma",
};
const ORIGIN_LABEL_KEYS: Record<PlayerOrigin, TranslationKey> = {
  prisoner: "originPrisoner",
  deserter: "originDeserter",
  hunter: "originHunter",
  scholar: "originScholar",
  outcast: "originOutcast",
};
const BASE_ATTRIBUTE_VALUE = 8;
const MAX_ATTRIBUTE_VALUE = 16;
const TOTAL_POINTS = 12;

const INITIAL_ATTRIBUTES: Attributes = {
  strength: BASE_ATTRIBUTE_VALUE,
  dexterity: BASE_ATTRIBUTE_VALUE,
  constitution: BASE_ATTRIBUTE_VALUE,
  intelligence: BASE_ATTRIBUTE_VALUE,
  wisdom: BASE_ATTRIBUTE_VALUE,
  charisma: BASE_ATTRIBUTE_VALUE,
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

export function CharacterCreation({ onBackToMenu, onStartJourney }: CharacterCreationProps) {
  const [characterName, setCharacterName] = useState("");
  const [origin, setOrigin] = useState<PlayerOrigin>("prisoner");
  const [attributes, setAttributes] = useState<Attributes>(INITIAL_ATTRIBUTES);

  const spentPoints = ATTRIBUTE_NAMES.reduce(
    (total, attribute) => total + attributes[attribute] - BASE_ATTRIBUTE_VALUE,
    0,
  );
  const remainingPoints = TOTAL_POINTS - spentPoints;
  const derivedStats = useMemo(() => getDerivedStats(attributes), [attributes]);
  const canStartJourney = characterName.trim().length > 0;

  const changeAttribute = (attribute: keyof Attributes, delta: number) => {
    const nextValue = attributes[attribute] + delta;

    if (nextValue < BASE_ATTRIBUTE_VALUE || nextValue > MAX_ATTRIBUTE_VALUE) {
      return;
    }

    if (delta > 0 && remainingPoints <= 0) {
      return;
    }

    setAttributes((current) => ({
      ...current,
      [attribute]: nextValue,
    }));
  };

  const startJourney = () => {
    if (!canStartJourney) {
      return;
    }

    saveGame({
      player: {
        id: createCharacterId(),
        name: characterName.trim(),
        origin,
        attributes,
        derivedStats,
        createdAt: new Date().toISOString(),
      },
    });

    onStartJourney();
  };

  return (
    <ScreenPanel
      title={t("characterCreationTitle")}
      subtitle={t("characterCreationSubtitle")}
      onBackToMenu={onBackToMenu}
    >
      <div className="character-form">
        <label className="form-field" htmlFor="character-name">
          <span>{t("characterName")}</span>
          <input
            id="character-name"
            value={characterName}
            onChange={(event) => setCharacterName(event.target.value)}
            maxLength={32}
            placeholder={t("characterNamePlaceholder")}
          />
        </label>

        <fieldset className="origin-field">
          <legend>{t("origin")}</legend>
          <div className="origin-grid">
            {ORIGINS.map((originOption) => (
              <label
                className={`origin-option ${origin === originOption ? "origin-option--selected" : ""}`}
                key={originOption}
              >
                <input
                  type="radio"
                  name="origin"
                  value={originOption}
                  checked={origin === originOption}
                  onChange={() => setOrigin(originOption)}
                />
                <span>{t(ORIGIN_LABEL_KEYS[originOption])}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <section className="attribute-section" aria-labelledby="attribute-heading">
          <div className="section-heading">
            <h2 id="attribute-heading">{t("attributes")}</h2>
            <p>
              {t("remainingPoints")}: {remainingPoints}
            </p>
          </div>

          <div className="attribute-list">
            {ATTRIBUTE_NAMES.map((attribute) => (
              <div className="attribute-row" key={attribute}>
                <div>
                  <span className="attribute-row__name">{t(ATTRIBUTE_LABEL_KEYS[attribute])}</span>
                  <span className="attribute-row__modifier">
                    {t("modifier")} {getModifier(attributes[attribute]) >= 0 ? "+" : ""}
                    {getModifier(attributes[attribute])}
                  </span>
                </div>

                <div className="attribute-controls">
                  <FantasyButton
                    type="button"
                    onClick={() => changeAttribute(attribute, -1)}
                    disabled={attributes[attribute] <= BASE_ATTRIBUTE_VALUE}
                    aria-label={`${t("decreaseAttribute")}: ${t(ATTRIBUTE_LABEL_KEYS[attribute])}`}
                  >
                    -
                  </FantasyButton>
                  <strong>{attributes[attribute]}</strong>
                  <FantasyButton
                    type="button"
                    onClick={() => changeAttribute(attribute, 1)}
                    disabled={remainingPoints <= 0 || attributes[attribute] >= MAX_ATTRIBUTE_VALUE}
                    aria-label={`${t("increaseAttribute")}: ${t(ATTRIBUTE_LABEL_KEYS[attribute])}`}
                  >
                    +
                  </FantasyButton>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="derived-stats" aria-label={t("startingParameters")}>
          <div className="stat-pill">
            <span>{t("health")}</span>
            <strong>{derivedStats.health}</strong>
          </div>
          <div className="stat-pill">
            <span>{t("stamina")}</span>
            <strong>{derivedStats.stamina}</strong>
          </div>
          <div className="stat-pill">
            <span>{t("armorClass")}</span>
            <strong>{derivedStats.armorClass}</strong>
          </div>
        </section>

        <FantasyButton
          type="button"
          variant="primary"
          onClick={startJourney}
          disabled={!canStartJourney}
        >
          {t("startJourney")}
        </FantasyButton>
      </div>
    </ScreenPanel>
  );
}
