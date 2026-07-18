import type { NpcDefinition } from "../../types/npc";
import type { NpcLoreProfile } from "./loreTypes";

const ROLE_PROFESSIONAL_TAGS: Record<NpcDefinition["role"], string[]> = {
  guard: ["law", "roads", "danger"],
  bandit: ["roads", "danger", "trade"],
  monster: [],
  merchant: ["trade", "roads", "merchant"],
  civilian: ["common"],
  companion: ["common"],
  ruler: ["politics", "empire", "history"],
  mage: ["magic", "barrier", "history"],
  priest: ["religion", "temple", "undead"],
  military: ["military", "roads", "danger"],
  noble: ["politics", "empire", "history"],
  scholar: ["history", "magic", "barrier", "prophecy"],
  blacksmith: ["smithing", "military", "trade"],
  trainer: ["training", "military", "magic", "roads"],
};

const SCHOLARLY_ROLES = new Set<NpcDefinition["role"]>(["mage", "priest", "scholar", "ruler", "noble"]);

export class NpcLoreProfileBuilder {
  /** Build the allowed lore access profile for a single NPC. */
  build(npc: NpcDefinition): NpcLoreProfile {
    const professionalTags = new Set<string>(ROLE_PROFESSIONAL_TAGS[npc.role]);

    if (npc.profession) {
      professionalTags.add(npc.profession);
    }

    if (npc.faction) {
      professionalTags.add(npc.faction.toLowerCase());
    }

    return {
      common: npc.role !== "monster",
      local: Boolean(npc.locationId),
      professionalTags: Array.from(professionalTags),
      culturalTags: [npc.faction ?? "", npc.locationId ?? ""].filter(Boolean),
      scholarly: SCHOLARLY_ROLES.has(npc.role),
      secretAccess: false,
    };
  }
}
