type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type FootballMemoryCache = Map<string, CacheEntry<unknown>>;

const globalCache = globalThis as typeof globalThis & {
  __analityqFootballCache?: FootballMemoryCache;
};

const cache = globalCache.__analityqFootballCache ?? new Map<string, CacheEntry<unknown>>();
globalCache.__analityqFootballCache = cache;

export const footballCacheTtl = {
  fixturesByDate: 20 * 60 * 1000,
  teamLastFixtures: 45 * 60 * 1000,
  fixtureStatistics: 24 * 60 * 60 * 1000,
  fixtureDetails: 24 * 60 * 60 * 1000,
  teamSearch: 60 * 60 * 1000,
} as const;

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  if (cache.size > 500) {
    const now = Date.now();
    for (const [entryKey, entry] of cache) {
      if (entry.expiresAt <= now) cache.delete(entryKey);
    }
  }
}
