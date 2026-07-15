import { describe, expect, it } from "vitest";
import {
  isPremiumShortcut,
  mobilePremiumTapTarget,
  nextPremiumTapCount,
  shouldActivatePremiumFromTaps,
} from "./premium-mode-core";

describe("lokalny tryb Premium", () => {
  it("akceptuje wyłącznie skrót Shift + Alt + P", () => {
    expect(isPremiumShortcut({ key: "P", altKey: true, shiftKey: true, ctrlKey: false, metaKey: false })).toBe(true);
    expect(isPremiumShortcut({ key: "p", altKey: true, shiftKey: false, ctrlKey: false, metaKey: false })).toBe(false);
    expect(isPremiumShortcut({ key: "p", altKey: true, shiftKey: true, ctrlKey: true, metaKey: false })).toBe(false);
  });

  it("aktywuje wariant mobilny dokładnie przy trzynastym kliknięciu", () => {
    let count = 0;
    for (let index = 0; index < mobilePremiumTapTarget - 1; index += 1) count = nextPremiumTapCount(count);
    expect(count).toBe(12);
    expect(shouldActivatePremiumFromTaps(count)).toBe(false);
    count = nextPremiumTapCount(count);
    expect(count).toBe(13);
    expect(shouldActivatePremiumFromTaps(count)).toBe(true);
  });
});
