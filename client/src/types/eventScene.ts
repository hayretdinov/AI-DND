import type { TranslationKey } from "../i18n/i18n";

export type EventInteractionMode = "choices" | "companion";

export type EventIntroStep = "initial" | "standing";

export type EventChoiceAction =
  | "rescue_anariel"
  | "ask_anariel"
  | "ignore_anariel"
  | "inspect_chains"
  | "take_anariel"
  | "start_journey_together";

export type EventChoice = {
  id: string;
  labelKey: TranslationKey;
  action: EventChoiceAction;
};

export type EventSceneDefinition = {
  id: string;
  titleKey: TranslationKey;
  locationTitleKey: TranslationKey;
  locationSubtitleKey: TranslationKey;
  timeLabel: string;
  speakerNameKey: TranslationKey;
  dialogueInitialKey: TranslationKey;
  dialogueStandingKey: TranslationKey;
  dialogueStandingLineKey: TranslationKey;
  backgroundImage: string;
  speakerImage: string;
  standingImage: string;
  interactionMode: EventInteractionMode;
  choices: EventChoice[];
  standingChoices: EventChoice[];
};
