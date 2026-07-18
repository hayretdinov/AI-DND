import { parseTextCombatAction } from "./combatActionParser";
import type { BodyZone, CombatIntent, WeaponCategory } from "./combatTextTypes";

export type TextCombatParserFixture = {
  text: string;
  expectedIntent: CombatIntent;
  expectedZone?: BodyZone;
  expectedWeaponCategory?: WeaponCategory;
  shouldWarnClaimedOutcome?: boolean;
};

export const TEXT_COMBAT_PARSER_FIXTURES: TextCombatParserFixture[] = [
  {
    text: "Резко шагаю вперед и наношу короткий рубящий удар мечом по правой руке разбойника",
    expectedIntent: "weaponStrike",
    expectedZone: "rightArm",
  },
  {
    text: "Отрубаю ему голову",
    expectedIntent: "weaponStrike",
    expectedZone: "head",
    shouldWarnClaimedOutcome: true,
  },
  {
    text: "Поднимаю щит и закрываюсь от удара",
    expectedIntent: "block",
  },
  {
    text: "Бью разбойника кулаком в корпус",
    expectedIntent: "weaponStrike",
    expectedZone: "torso",
    expectedWeaponCategory: "unarmed",
  },
  {
    text: "Пинаю разбойника по правой ноге",
    expectedIntent: "weaponStrike",
    expectedZone: "rightLeg",
    expectedWeaponCategory: "unarmed",
  },
  {
    text: "Толкаю разбойника щитом",
    expectedIntent: "shove",
    expectedWeaponCategory: "shield",
  },
  {
    text: "Колю копьём в корпус",
    expectedIntent: "weaponStrike",
    expectedZone: "torso",
    expectedWeaponCategory: "spear",
  },
  {
    text: "Бью молотом по щиту",
    expectedIntent: "weaponStrike",
    expectedZone: "shield",
    expectedWeaponCategory: "hammer",
  },
  {
    text: "Рублю топором по руке",
    expectedIntent: "weaponStrike",
    expectedZone: "rightArm",
    expectedWeaponCategory: "axe",
  },
  {
    text: "Ухожу назад и держу дистанцию",
    expectedIntent: "holdDistance",
  },
];

export function runTextCombatParserSelfTest() {
  return TEXT_COMBAT_PARSER_FIXTURES.map((fixture) => {
    const parsed = parseTextCombatAction(fixture.text);

    return {
      text: fixture.text,
      passed:
        parsed.intent === fixture.expectedIntent &&
        (!fixture.expectedZone || parsed.targetZone === fixture.expectedZone) &&
        (!fixture.expectedWeaponCategory || parsed.weaponCategory === fixture.expectedWeaponCategory) &&
        (!fixture.shouldWarnClaimedOutcome || parsed.warnings.includes("claimedOutcome")),
      parsed,
    };
  });
}
