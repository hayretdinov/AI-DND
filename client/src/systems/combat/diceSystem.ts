export function rollDie(sides: number) {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollD20() {
  return rollDie(20);
}

export function rollDice(formula: string) {
  const match = formula.trim().match(/^(\d*)d(\d+)([+-]\d+)?$/i);

  if (!match) {
    return 0;
  }

  const diceCount = Math.max(1, Number(match[1] || 1));
  const dieSides = Math.max(1, Number(match[2]));
  const modifier = Number(match[3] ?? 0);

  let total = modifier;

  for (let index = 0; index < diceCount; index += 1) {
    total += rollDie(dieSides);
  }

  return total;
}

export function getAttributeModifier(score: number) {
  return Math.floor((score - 10) / 2);
}
