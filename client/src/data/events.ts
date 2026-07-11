import type { EventSceneDefinition } from "../types/eventScene";

export const ANARIEL_INTRO_EVENT: EventSceneDefinition = {
  id: "anariel_intro",
  titleKey: "event.anarielIntro.sceneTitle",
  locationTitleKey: "event.anarielIntro.locationTitle",
  locationSubtitleKey: "event.anarielIntro.locationSubtitle",
  timeLabel: "21:34",
  speakerNameKey: "event.anarielIntro.speaker",
  dialogueInitialKey: "event.anarielIntro.dialogueInitial",
  dialogueStandingKey: "event.anarielIntro.dialogueStanding",
  dialogueStandingLineKey: "event.anarielIntro.dialogueStandingLine",
  backgroundImage: "/assets/backgrounds/events/anariel-intro-prison.png",
  speakerImage: "/assets/companions/anariel/anariel-prisoner-floor-fear.png",
  standingImage: "/assets/companions/anariel/anariel_chained_standing_fear.png",
  interactionMode: "choices",
  choices: [
    {
      id: "help",
      labelKey: "event.anarielIntro.choiceHelp",
      action: "rescue_anariel",
    },
    {
      id: "ask",
      labelKey: "event.anarielIntro.choiceAsk",
      action: "ask_anariel",
    },
    {
      id: "ignore",
      labelKey: "event.anarielIntro.choiceIgnore",
      action: "ignore_anariel",
    },
    {
      id: "inspect_chains",
      labelKey: "event.anarielIntro.choiceInspectChains",
      action: "inspect_chains",
    },
  ],
  standingChoices: [
    {
      id: "take_with_you",
      labelKey: "event.anarielIntro.choiceTakeWithYou",
      action: "take_anariel",
    },
    {
      id: "start_journey_together",
      labelKey: "event.anarielIntro.choiceStartJourneyTogether",
      action: "start_journey_together",
    },
  ],
};
