import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type FootballMemoryCache = Map<string, CacheEntry<unknown>>;
const maxMemoryCacheEntries = 500;

const globalCache = globalThis as typeof globalThis & {
  __analityqFootballCache?: FootballMemoryCache;
  __analityqFootballCacheWarning?: string;
};

const cache = globalCache.__analityqFootballCache ?? new Map<string, CacheEntry<unknown>>();
globalCache.__analityqFootballCache = cache;

export const footballCacheTtl = {
  fixturesByDate: 15 * 60 * 1000,
  teamLastFixtures: 60 * 60 * 1000,
  fixtureStatistics: 24 * 60 * 60 * 1000,
  fixtureDetails: 30 * 60 * 1000,
  teamSearch: 60 * 60 * 1000,
} as const;

let serverClient: SupabaseClient | null | undefined;

function getServerClient() {
  if (serverClient !== undefined) return serverClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    globalCache.__analityqFootballCacheWarning = "Cache Supabase jest niedostępny. Użyto cache w pamięci serwera.";
    serverClient = null;
    return serverClient;
  }
  serverClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return serverClient;
}

function memoryGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function memorySet<T>(key: string, value: T, ttlMs: number) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  if (cache.size > maxMemoryCacheEntries) {
    const now = Date.now();
    for (const [entryKey, entry] of cache) {
      if (entry.expiresAt <= now) cache.delete(entryKey);
    }
    while (cache.size > maxMemoryCacheEntries) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey === undefined) break;
      cache.delete(oldestKey);
    }
  }
}

export async function getCached<T>(key: string): Promise<T | null> {
  const memoryValue = memoryGet<T>(key);
  if (memoryValue !== null) return memoryValue;

  const client = getServerClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("api_cache")
      .select("payload,expires_at")
      .eq("cache_key", key)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const ttlMs = Math.max(1_000, new Date(data.expires_at).getTime() - Date.now());
    memorySet(key, data.payload, ttlMs);
    return data.payload as T;
  } catch {
    globalCache.__analityqFootballCacheWarning = "Cache Supabase jest niedostępny. Użyto cache w pamięci serwera.";
    return null;
  }
}

export async function setCached<T>(key: string, value: T, ttlMs: number) {
  memorySet(key, value, ttlMs);
  const client = getServerClient();
  if (!client) return;
  const now = new Date();
  try {
    const { error } = await client.from("api_cache").upsert({
      cache_key: key,
      payload: value,
      expires_at: new Date(now.getTime() + ttlMs).toISOString(),
      updated_at: now.toISOString(),
    });
    if (error) throw error;
  } catch {
    globalCache.__analityqFootballCacheWarning = "Cache Supabase jest niedostępny. Użyto cache w pamięci serwera.";
  }
}

export function getCacheStatus() {
  return {
    persistent: Boolean(getServerClient()) && !globalCache.__analityqFootballCacheWarning,
    warning: globalCache.__analityqFootballCacheWarning,
  };
}
