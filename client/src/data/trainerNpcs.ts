import type { TranslationKey } from "../i18n/i18n";
import type { NpcDefinition } from "../types/npc";
import type { TrainerDefinition } from "../systems/trainers/trainerTypes";

const TRAINER_ASSET_PATH = "/assets/npcs/trainers/";
const ROYAL_COURT_ASSET_PATH = "/assets/npcs/royal_court/";

export const TRAINER_NPC_IDS = [
  "edgar_swordmaster",
  "iara_archer",
  "arkel_magister",
  "high_mage_elyrion",
  "archmage_tarvis",
  "general_vargas",
  "lord_commander_cedric",
] as const;

export type TrainerNpcId = typeof TRAINER_NPC_IDS[number];

type TrainerNpcProfile = {
  id: TrainerNpcId;
  nameKey: TranslationKey;
  titleKey: TranslationKey;
  locationId: "central_settlement" | "western_great_city";
  interiorLocationId: string;
  imageUrl: string;
  faction: string;
  profession: string;
  systemPrompt: string;
};

export const trainerDefinitions: Record<TrainerNpcId, TrainerDefinition> = {
  edgar_swordmaster: {
    id: "edgar_swordmaster",
    specialization: "meleeTrainer",
    branch: "melee",
    tiers: ["basic", "intermediate", "advanced", "expert", "master"],
    guideItemId: "melee_combat_beginner_guide",
    freeBasic: true,
    basicRequiresService: false,
  },
  iara_archer: {
    id: "iara_archer",
    specialization: "bowTrainer",
    branch: "archery",
    tiers: ["basic", "intermediate", "advanced", "expert", "master"],
    guideItemId: "archery_basics_guide",
    freeBasic: true,
    basicRequiresService: false,
  },
  arkel_magister: {
    id: "arkel_magister",
    specialization: "magicTrainer",
    branch: "magic",
    tiers: ["basic"],
    guideItemId: "magic_apprentice_guide",
    freeBasic: true,
    basicRequiresService: false,
  },
  high_mage_elyrion: {
    id: "high_mage_elyrion",
    specialization: "magicTrainer",
    branch: "magic",
    tiers: ["expert", "master"],
    guideItemId: "magic_apprentice_guide",
    freeBasic: false,
    basicRequiresService: false,
  },
  archmage_tarvis: {
    id: "archmage_tarvis",
    specialization: "magicTrainer",
    branch: "magic",
    tiers: ["intermediate", "advanced"],
    guideItemId: "magic_apprentice_guide",
    freeBasic: false,
    basicRequiresService: false,
  },
  general_vargas: {
    id: "general_vargas",
    specialization: "meleeTrainer",
    branch: "melee",
    tiers: ["intermediate", "advanced", "expert", "master"],
    guideItemId: "melee_combat_beginner_guide",
    freeBasic: false,
    basicRequiresService: false,
  },
  lord_commander_cedric: {
    id: "lord_commander_cedric",
    specialization: "meleeTrainer",
    branch: "melee",
    tiers: ["master"],
    guideItemId: "melee_combat_beginner_guide",
    freeBasic: false,
    basicRequiresService: false,
  },
};

export const trainerNpcProfiles: Record<TrainerNpcId, TrainerNpcProfile> = {
  edgar_swordmaster: {
    id: "edgar_swordmaster",
    nameKey: "npc.trainer.edgar.name",
    titleKey: "npc.trainer.edgar.title",
    locationId: "central_settlement",
    interiorLocationId: "central_training_yard",
    imageUrl: `${TRAINER_ASSET_PATH}edgar_swordmaster.png`,
    faction: "Central Settlement Militia",
    profession: "swordmaster",
    systemPrompt: "Edgar is a stern beginner-friendly melee mentor. He teaches blade basics through master-level melee discipline and refuses shortcuts.",
  },
  iara_archer: {
    id: "iara_archer",
    nameKey: "npc.trainer.iara.name",
    titleKey: "npc.trainer.iara.title",
    locationId: "central_settlement",
    interiorLocationId: "central_archery_range",
    imageUrl: `${TRAINER_ASSET_PATH}iara_archer.png`,
    faction: "Forest Wardens",
    profession: "archer",
    systemPrompt: "Iara is a precise archer mentor. She teaches bows, range discipline, cover, breathing, and target selection.",
  },
  arkel_magister: {
    id: "arkel_magister",
    nameKey: "npc.trainer.arkel.name",
    titleKey: "npc.trainer.arkel.title",
    locationId: "central_settlement",
    interiorLocationId: "central_mage_hut",
    imageUrl: `${TRAINER_ASSET_PATH}arkel_magister.png`,
    faction: "Wandering Circle",
    profession: "magister",
    systemPrompt: "Arkel is a modest rural magister. He teaches only safe basic magic and gives the first magical guide.",
  },
  high_mage_elyrion: {
    id: "high_mage_elyrion",
    nameKey: "npc.highMageElyrion.name",
    titleKey: "npc.highMageElyrion.title",
    locationId: "western_great_city",
    interiorLocationId: "circle_of_archons_tower",
    imageUrl: `${ROYAL_COURT_ASSET_PATH}high_mage_elyrion.png`,
    faction: "Circle of Archons",
    profession: "high_mage",
    systemPrompt: "Elyrion teaches only high-tier magic to proven students.",
  },
  archmage_tarvis: {
    id: "archmage_tarvis",
    nameKey: "npc.archmageTarvis.name",
    titleKey: "npc.archmageTarvis.title",
    locationId: "western_great_city",
    interiorLocationId: "private_arcane_study",
    imageUrl: `${ROYAL_COURT_ASSET_PATH}archmage_tarvis.png`,
    faction: "Circle of Archons",
    profession: "archmage",
    systemPrompt: "Tarvis teaches intermediate and advanced magic, but will not teach total novices.",
  },
  general_vargas: {
    id: "general_vargas",
    nameKey: "npc.generalVargas.name",
    titleKey: "npc.generalVargas.title",
    locationId: "western_great_city",
    interiorLocationId: "military_headquarters",
    imageUrl: `${ROYAL_COURT_ASSET_PATH}general_vargas.png`,
    faction: "Royal Army",
    profession: "general",
    systemPrompt: "Vargas continues melee training for soldiers who already know the basics.",
  },
  lord_commander_cedric: {
    id: "lord_commander_cedric",
    nameKey: "npc.lordCommanderCedric.name",
    titleKey: "npc.lordCommanderCedric.title",
    locationId: "western_great_city",
    interiorLocationId: "royal_guard_headquarters",
    imageUrl: `${ROYAL_COURT_ASSET_PATH}lord_commander_cedric.png`,
    faction: "Royal Guard",
    profession: "lord_commander",
    systemPrompt: "Cedric teaches only the highest master-level melee discipline.",
  },
};

export const centralTrainerNpcTemplates: NpcDefinition[] = (["edgar_swordmaster", "iara_archer", "arkel_magister"] as TrainerNpcId[]).map((id) => {
  const profile = trainerNpcProfiles[id];

  return {
    id,
    nameKey: profile.nameKey,
    titleKey: profile.titleKey,
    role: "trainer",
    locationId: profile.locationId,
    interiorLocationId: profile.interiorLocationId,
    stableInstanceId: id,
    persistent: true,
    faction: profile.faction,
    profession: profile.profession,
    socialStatus: "trainer",
    imageUrl: profile.imageUrl,
    portraitUrl: profile.imageUrl,
    greetingKey: "npc.trainer.greeting",
    defaultMood: "neutral",
    canUseAiDialogue: true,
    systemPrompt: `${profile.systemPrompt}\nTraining definition: ${JSON.stringify(trainerDefinitions[id])}`,
  };
});

export function getTrainerDefinition(npcId: string) {
  return trainerDefinitions[npcId as TrainerNpcId];
}

export function getTrainerEventId(npcId: string) {
  return `trainer_${npcId}`;
}
