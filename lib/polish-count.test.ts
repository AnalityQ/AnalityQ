import { describe, expect, it } from "vitest";
import { formatPolishCount } from "./polish-count";

describe("polska odmiana liczebników", () => {
  it.each([
    ["match", "1 mecz", "2 mecze", "5 meczów"],
    ["goal", "1 gol", "2 gole", "5 goli"],
    ["point", "1 punkt", "2 punkty", "5 punktów"],
    ["card", "1 kartka", "2 kartki", "5 kartek"],
  ] as const)("odmienia jednostkę %s", (unit, one, two, five) => {
    expect(formatPolishCount(1, unit)).toBe(one);
    expect(formatPolishCount(2, unit)).toBe(two);
    expect(formatPolishCount(5, unit)).toBe(five);
  });
});
