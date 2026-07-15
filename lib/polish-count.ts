type PolishUnit = "match" | "goal" | "point" | "card";

const forms: Record<PolishUnit, [string, string, string]> = {
  match: ["mecz", "mecze", "meczów"],
  goal: ["gol", "gole", "goli"],
  point: ["punkt", "punkty", "punktów"],
  card: ["kartka", "kartki", "kartek"],
};

export function polishPlural(value: number, [one, few, many]: [string, string, string]) {
  const absolute = Math.abs(value);
  if (absolute === 1) return one;
  const lastTwo = absolute % 100;
  const last = absolute % 10;
  return last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14) ? few : many;
}

export function formatPolishCount(value: number, unit: PolishUnit) {
  return `${value} ${polishPlural(value, forms[unit])}`;
}
