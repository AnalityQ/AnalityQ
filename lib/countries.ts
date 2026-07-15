import { polishPlural } from "./polish-count";

export type LocalizedCountry = {
  apiNames: string[];
  code: string;
  flagCode?: string;
  nominative: string;
  genitive: string;
  locative?: string;
  adjectiveMasculine?: string;
  adjectiveFeminine?: string;
  verbGender?: "feminine" | "masculine" | "plural" | "neuter";
};

export const localizedCountries: LocalizedCountry[] = [
  { apiNames: ["Argentina"], code: "AR", nominative: "Argentyna", genitive: "Argentyny", adjectiveMasculine: "argentyński", adjectiveFeminine: "argentyńska" },
  { apiNames: ["Austria"], code: "AT", nominative: "Austria", genitive: "Austrii", adjectiveMasculine: "austriacki", adjectiveFeminine: "austriacka" },
  { apiNames: ["Belgium"], code: "BE", nominative: "Belgia", genitive: "Belgii", adjectiveMasculine: "belgijski", adjectiveFeminine: "belgijska" },
  { apiNames: ["Brazil"], code: "BR", nominative: "Brazylia", genitive: "Brazylii", adjectiveMasculine: "brazylijski", adjectiveFeminine: "brazylijska" },
  { apiNames: ["Croatia"], code: "HR", nominative: "Chorwacja", genitive: "Chorwacji", adjectiveMasculine: "chorwacki", adjectiveFeminine: "chorwacka" },
  { apiNames: ["Bosnia and Herzegovina"], code: "BA", nominative: "Bośnia i Hercegowina", genitive: "Bośni i Hercegowiny", adjectiveMasculine: "bośniacki", adjectiveFeminine: "bośniacka" },
  { apiNames: ["Cape Verde"], code: "CV", nominative: "Republika Zielonego Przylądka", genitive: "Republiki Zielonego Przylądka", adjectiveMasculine: "kabowerdyjski", adjectiveFeminine: "kabowerdyjska" },
  { apiNames: ["Czech Republic", "Czechia"], code: "CZ", nominative: "Czechy", genitive: "Czech", adjectiveMasculine: "czeski", adjectiveFeminine: "czeska", verbGender: "plural" },
  { apiNames: ["Denmark"], code: "DK", nominative: "Dania", genitive: "Danii", adjectiveMasculine: "duński", adjectiveFeminine: "duńska" },
  { apiNames: ["DR Congo", "Congo DR"], code: "CD", nominative: "Demokratyczna Republika Konga", genitive: "Demokratycznej Republiki Konga", adjectiveMasculine: "kongijski", adjectiveFeminine: "kongijska" },
  { apiNames: ["England"], code: "GB-ENG", flagCode: "GB", nominative: "Anglia", genitive: "Anglii", adjectiveMasculine: "angielski", adjectiveFeminine: "angielska" },
  { apiNames: ["Finland"], code: "FI", nominative: "Finlandia", genitive: "Finlandii", adjectiveMasculine: "fiński", adjectiveFeminine: "fińska" },
  { apiNames: ["France"], code: "FR", nominative: "Francja", genitive: "Francji", locative: "Francji", adjectiveMasculine: "francuski", adjectiveFeminine: "francuska" },
  { apiNames: ["Germany"], code: "DE", nominative: "Niemcy", genitive: "Niemiec", adjectiveMasculine: "niemiecki", adjectiveFeminine: "niemiecka", verbGender: "plural" },
  { apiNames: ["Greece"], code: "GR", nominative: "Grecja", genitive: "Grecji", adjectiveMasculine: "grecki", adjectiveFeminine: "grecka" },
  { apiNames: ["Hungary"], code: "HU", nominative: "Węgry", genitive: "Węgier", adjectiveMasculine: "węgierski", adjectiveFeminine: "węgierska", verbGender: "plural" },
  { apiNames: ["Iceland"], code: "IS", nominative: "Islandia", genitive: "Islandii", adjectiveMasculine: "islandzki", adjectiveFeminine: "islandzka" },
  { apiNames: ["Ireland"], code: "IE", nominative: "Irlandia", genitive: "Irlandii", adjectiveMasculine: "irlandzki", adjectiveFeminine: "irlandzka" },
  { apiNames: ["Italy"], code: "IT", nominative: "Włochy", genitive: "Włoch", adjectiveMasculine: "włoski", adjectiveFeminine: "włoska", verbGender: "plural" },
  { apiNames: ["Ivory Coast", "Côte d'Ivoire", "Cote d'Ivoire"], code: "CI", nominative: "Wybrzeże Kości Słoniowej", genitive: "Wybrzeża Kości Słoniowej", adjectiveMasculine: "iworyjski", adjectiveFeminine: "iworyjska", verbGender: "neuter" },
  { apiNames: ["Netherlands"], code: "NL", nominative: "Holandia", genitive: "Holandii", adjectiveMasculine: "holenderski", adjectiveFeminine: "holenderska" },
  { apiNames: ["Norway"], code: "NO", nominative: "Norwegia", genitive: "Norwegii", adjectiveMasculine: "norweski", adjectiveFeminine: "norweska" },
  { apiNames: ["Poland"], code: "PL", nominative: "Polska", genitive: "Polski", adjectiveMasculine: "polski", adjectiveFeminine: "polska" },
  { apiNames: ["Portugal"], code: "PT", nominative: "Portugalia", genitive: "Portugalii", adjectiveMasculine: "portugalski", adjectiveFeminine: "portugalska" },
  { apiNames: ["Romania"], code: "RO", nominative: "Rumunia", genitive: "Rumunii", adjectiveMasculine: "rumuński", adjectiveFeminine: "rumuńska" },
  { apiNames: ["Scotland"], code: "GB-SCT", flagCode: "GB", nominative: "Szkocja", genitive: "Szkocji", adjectiveMasculine: "szkocki", adjectiveFeminine: "szkocka" },
  { apiNames: ["Serbia"], code: "RS", nominative: "Serbia", genitive: "Serbii", adjectiveMasculine: "serbski", adjectiveFeminine: "serbska" },
  { apiNames: ["Slovakia"], code: "SK", nominative: "Słowacja", genitive: "Słowacji", adjectiveMasculine: "słowacki", adjectiveFeminine: "słowacka" },
  { apiNames: ["Slovenia"], code: "SI", nominative: "Słowenia", genitive: "Słowenii", adjectiveMasculine: "słoweński", adjectiveFeminine: "słoweńska" },
  { apiNames: ["South Korea", "Korea Republic"], code: "KR", nominative: "Korea Południowa", genitive: "Korei Południowej", adjectiveMasculine: "południowokoreański", adjectiveFeminine: "południowokoreańska" },
  { apiNames: ["Spain"], code: "ES", nominative: "Hiszpania", genitive: "Hiszpanii", locative: "Hiszpanii", adjectiveMasculine: "hiszpański", adjectiveFeminine: "hiszpańska" },
  { apiNames: ["Sweden"], code: "SE", nominative: "Szwecja", genitive: "Szwecji", adjectiveMasculine: "szwedzki", adjectiveFeminine: "szwedzka" },
  { apiNames: ["Switzerland"], code: "CH", nominative: "Szwajcaria", genitive: "Szwajcarii", adjectiveMasculine: "szwajcarski", adjectiveFeminine: "szwajcarska" },
  { apiNames: ["Turkey", "Türkiye"], code: "TR", nominative: "Turcja", genitive: "Turcji", adjectiveMasculine: "turecki", adjectiveFeminine: "turecka" },
  { apiNames: ["Ukraine"], code: "UA", nominative: "Ukraina", genitive: "Ukrainy", adjectiveMasculine: "ukraiński", adjectiveFeminine: "ukraińska" },
  { apiNames: ["United States", "USA"], code: "US", nominative: "Stany Zjednoczone", genitive: "Stanów Zjednoczonych", adjectiveMasculine: "amerykański", adjectiveFeminine: "amerykańska", verbGender: "plural" },
  { apiNames: ["Uruguay"], code: "UY", nominative: "Urugwaj", genitive: "Urugwaju", adjectiveMasculine: "urugwajski", adjectiveFeminine: "urugwajska", verbGender: "masculine" },
  { apiNames: ["Wales"], code: "GB-WLS", flagCode: "GB", nominative: "Walia", genitive: "Walii", adjectiveMasculine: "walijski", adjectiveFeminine: "walijska" },
];

const worldNames = new Set(["world", "świat"]);

function canonical(value: string) {
  return value.trim().toLocaleLowerCase("pl-PL");
}

function countryByName(countryName?: string | null) {
  if (!countryName) return null;
  const wanted = canonical(countryName);
  return localizedCountries.find((country) =>
    country.apiNames.some((name) => canonical(name) === wanted)
      || canonical(country.nominative) === wanted,
  ) || null;
}

function countryByCode(countryCode?: string | null) {
  if (!countryCode) return null;
  const wanted = countryCode.trim().toUpperCase();
  return localizedCountries.find((country) => country.code === wanted) || null;
}

export function localizedCountry(countryName?: string | null, countryCode?: string | null) {
  return countryByName(countryName) || countryByCode(countryCode);
}

export function countryPresentation(countryName?: string | null, countryCode?: string | null) {
  const sourceName = countryName?.trim() || null;
  if (sourceName && worldNames.has(canonical(sourceName))) {
    return { countryCode: null, countryName: "Świat" };
  }
  const mapped = localizedCountry(sourceName, countryCode);
  return {
    countryCode: (countryCode || mapped?.code || null)?.toUpperCase() || null,
    countryName: mapped?.nominative || sourceName,
  };
}

export function countryFlagUrl(countryName?: string | null, countryCode?: string | null) {
  const mapped = localizedCountry(countryName, countryCode);
  const rawCode = countryCode?.trim().toUpperCase();
  const code = mapped?.flagCode || (rawCode && /^[A-Z]{2}$/.test(rawCode) ? rawCode : mapped?.code);
  return code && /^[A-Z]{2}$/.test(code)
    ? `https://media.api-sports.io/flags/${code.toLowerCase()}.svg`
    : null;
}

export function isNationalTeamName(name?: string | null) {
  return Boolean(countryByName(name));
}

export function localizeTeamName(name?: string | null) {
  if (!name) return "";
  return countryByName(name)?.nominative || name;
}

export function teamGenitive(name?: string | null) {
  if (!name) return "drużyny";
  const country = countryByName(name);
  return country ? country.genitive : `drużyny ${name}`;
}

export function teamVerb(name: string, masculine: string, feminine: string) {
  const country = countryByName(name);
  if (!country) return masculine;
  if (country.verbGender === "masculine") return masculine;
  if (country.verbGender === "plural") {
    return feminine.endsWith("a") ? `${feminine.slice(0, -1)}y` : feminine;
  }
  if (country.verbGender === "neuter") {
    return masculine.endsWith("ł") ? `${masculine}o` : masculine;
  }
  return feminine;
}

const competitionNames: Record<string, string> = {
  "world cup": "Mistrzostwa świata",
  "uefa european championship": "Mistrzostwa Europy",
  "uefa champions league": "Liga Mistrzów UEFA",
  "uefa europa league": "Liga Europy UEFA",
  "uefa europa conference league": "Liga Konferencji UEFA",
  "nations league": "Liga Narodów UEFA",
};

export function localizeCompetitionName(name?: string | null) {
  if (!name) return "";
  return competitionNames[canonical(name)] || name;
}

export function localizeRoundName(round?: string | null) {
  if (!round) return "";
  const normalized = round.trim();
  const exact: Record<string, string> = {
    "Semi-finals": "Półfinał",
    "Semi-final": "Półfinał",
    "Quarter-finals": "Ćwierćfinał",
    "Quarter-final": "Ćwierćfinał",
    "Round of 16": "1/8 finału",
    "Group Stage": "Faza grupowa",
    "Final": "Finał",
  };
  if (exact[normalized]) return exact[normalized];
  const regular = normalized.match(/^Regular Season\s*-\s*(\d+)$/i);
  if (regular) return `${regular[1]}. kolejka sezonu zasadniczego`;
  const group = normalized.match(/^Group\s+(.+)\s*-\s*(\d+)$/i);
  if (group) return `Grupa ${group[1]} · ${group[2]}. kolejka`;
  return normalized;
}

const playerPositions: Record<string, string> = {
  G: "Bramkarz", GK: "Bramkarz", Goalkeeper: "Bramkarz",
  D: "Obrońca", DF: "Obrońca", Defender: "Obrońca",
  M: "Pomocnik", MF: "Pomocnik", Midfielder: "Pomocnik",
  F: "Napastnik", FW: "Napastnik", Attacker: "Napastnik",
};

export function localizePlayerPosition(position?: string | null) {
  if (!position) return null;
  return playerPositions[position] || position;
}

export function localizePublicText(text?: string | null) {
  if (!text) return "";
  let result = text;
  for (const country of localizedCountries) {
    for (const apiName of country.apiNames) {
      const escaped = apiName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      result = result.replace(new RegExp(`\\b${escaped}\\b`, "g"), country.nominative);
    }
  }
  result = result
    .replace(/\bWorld Cup\b/g, "Mistrzostwa świata")
    .replace(/\bWorld\b/g, "Świat")
    .replace(/\bSemi-finals?\b/g, "Półfinał")
    .replace(/\bQuarter-finals?\b/g, "Ćwierćfinał")
    .replace(/\bGroup Stage\b/g, "Faza grupowa");

  const verbForms = [
    ["zdobywał", "zdobywała"],
    ["tracił", "traciła"],
    ["oddawał", "oddawała"],
    ["wykonywał", "wykonywała"],
    ["otrzymywał", "otrzymywała"],
    ["pozwalał", "pozwalała"],
    ["dopuszczał", "dopuszczała"],
    ["wygrał", "wygrała"],
  ] as const;

  for (const country of localizedCountries) {
    const name = country.nominative.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const hasOtherCountry = (segment: string) => localizedCountries.some(
      (other) => other !== country && segment.includes(other.nominative),
    );
    for (const [masculine, feminine] of verbForms) {
      const localizedVerb = teamVerb(country.nominative, masculine, feminine);
      result = result.replace(
        new RegExp(`${name}((?: (?:u siebie|na wyjazdach|na neutralnym boisku))?) ${masculine}(?=\\s|[.,;:!?)]|$)`, "g"),
        `${country.nominative}$1 ${localizedVerb}`,
      )
        .replace(
          new RegExp(`(${name}[^.!?]{0,160}?\\b(?:i|oraz) )${masculine}(?=\\s|[.,;:!?)]|$)`, "g"),
          (match: string, prefix: string) => hasOtherCountry(prefix) ? match : `${prefix}${localizedVerb}`,
        )
        .replace(
          new RegExp(`(${name}[^.!?]{0,160}?, a )${masculine}(?=\\s|[.,;:!?)]|$)`, "g"),
          (match: string, prefix: string) => hasOtherCountry(prefix) ? match : `${prefix}${localizedVerb}`,
        );
    }
    result = result
      .replace(
        new RegExp(`(Przewaga|Atak|Forma domowa|Celne strzały|Niepełne xG|Mała prób(?:a|ka)|Duża różnica formy) ${name}\\b`, "g"),
        (_, prefix: string) => `${prefix} ${country.genitive}`,
      )
      .replace(
        new RegExp(`defensywa ${name}\\b`, "gi"),
        `defensywa reprezentacji ${country.genitive}`,
      )
      .replace(
        new RegExp(`dopuszczane przez ${name}\\b`, "gi"),
        `dopuszczane przez reprezentację ${country.genitive}`,
      )
      .replace(
        new RegExp(`(\\d+) (?:mecz|mecze|meczów) ${name} (u siebie|na wyjeździe)`, "g"),
        (_, count: string, place: string) => {
          const value = Number(count);
          return `${count} ${polishPlural(value, ["mecz", "mecze", "meczów"])} reprezentacji ${country.genitive} ${place}`;
        },
      );
  }

  result = result
    .replace(/Różnica wynosi (\d+) (?:punktów|punkty|punkt)/g, (_, count: string) => {
      const value = Number(count);
      return `Różnica wynosi ${count} ${polishPlural(value, ["punkt", "punkty", "punktów"])}`;
    })
    .replace(/\b(\d+) nieobecnych\b/g, (_, count: string) => `${count} ${polishPlural(Number(count), ["nieobecny", "nieobecnych", "nieobecnych"])}`)
    .replace(/\b(\d+) wątpliwych\b/g, (_, count: string) => `${count} ${polishPlural(Number(count), ["wątpliwy", "wątpliwych", "wątpliwych"])}`)
    .replace(/\b(\d+) rekordów\b/g, (_, count: string) => `${count} ${polishPlural(Number(count), ["rekord", "rekordy", "rekordów"])}`);
  return result;
}

export function countryFlagEmoji(countryCode?: string | null) {
  const normalized = countryCode?.trim().toUpperCase();
  if (!normalized || !/^[A-Z]{2}$/.test(normalized)) return null;
  return String.fromCodePoint(
    ...[...normalized].map((character) => 127397 + character.charCodeAt(0)),
  );
}
