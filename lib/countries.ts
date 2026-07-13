const countries: Record<string, { code: string; pl: string }> = {
  argentina: { code: "AR", pl: "Argentyna" },
  brazil: { code: "BR", pl: "Brazylia" },
  croatia: { code: "HR", pl: "Chorwacja" },
  denmark: { code: "DK", pl: "Dania" },
  england: { code: "GB-ENG", pl: "Anglia" },
  finland: { code: "FI", pl: "Finlandia" },
  france: { code: "FR", pl: "Francja" },
  germany: { code: "DE", pl: "Niemcy" },
  italy: { code: "IT", pl: "Włochy" },
  netherlands: { code: "NL", pl: "Holandia" },
  norway: { code: "NO", pl: "Norwegia" },
  poland: { code: "PL", pl: "Polska" },
  portugal: { code: "PT", pl: "Portugalia" },
  scotland: { code: "GB-SCT", pl: "Szkocja" },
  serbia: { code: "RS", pl: "Serbia" },
  spain: { code: "ES", pl: "Hiszpania" },
  sweden: { code: "SE", pl: "Szwecja" },
  switzerland: { code: "CH", pl: "Szwajcaria" },
  ukraine: { code: "UA", pl: "Ukraina" },
  uruguay: { code: "UY", pl: "Urugwaj" },
  wales: { code: "GB-WLS", pl: "Walia" },
};

function key(value: string) {
  return value.trim().toLowerCase();
}

export function countryPresentation(
  countryName?: string | null,
  countryCode?: string | null,
) {
  const sourceName = countryName?.trim() || null;
  const mapped = sourceName ? countries[key(sourceName)] : undefined;
  return {
    countryCode: (countryCode || mapped?.code || null)?.toUpperCase() || null,
    countryName: mapped?.pl || sourceName,
  };
}

export function countryFlagEmoji(countryCode?: string | null) {
  const normalized = countryCode?.trim().toUpperCase();
  if (!normalized || !/^[A-Z]{2}$/.test(normalized)) return null;
  return String.fromCodePoint(
    ...[...normalized].map((character) => 127397 + character.charCodeAt(0)),
  );
}
