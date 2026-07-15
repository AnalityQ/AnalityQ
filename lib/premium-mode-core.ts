export const mobilePremiumTapTarget = 13;

type ShortcutInput = {
  key: string;
  altKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
};

export function isPremiumShortcut(input: ShortcutInput) {
  return input.key.toLowerCase() === "p"
    && input.altKey
    && input.shiftKey
    && !input.ctrlKey
    && !input.metaKey;
}

export function nextPremiumTapCount(current: number) {
  return Math.min(mobilePremiumTapTarget, Math.max(0, current) + 1);
}

export function shouldActivatePremiumFromTaps(count: number) {
  return count >= mobilePremiumTapTarget;
}
