import type { MarketKey, NumericValue } from "./types";

export type NormalizedOdds = Partial<Record<MarketKey, NumericValue>>;

export interface OddsDataProvider {
  getFixtureOdds(fixtureId: number): Promise<NormalizedOdds>;
}

// Kursy pozostają ręczne. Interfejs wyznacza neutralny kontrakt dla ewentualnej
// przyszłej integracji serwerowej i nie łączy aplikacji z żadnym dostawcą.
