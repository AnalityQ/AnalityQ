import "server-only";

import { getCached, setCached } from "./cache";
import { FootballApiError, type ApiFootballEnvelope } from "./types";

const defaultBaseUrl = "https://v3.football.api-sports.io";
const requestTimeoutMs = 15000;

function configuredBaseUrl() {
  return (process.env.FOOTBALL_API_BASE_URL || defaultBaseUrl).replace(/\/+$/, "");
}

function apiErrors(errors: ApiFootballEnvelope<unknown>["errors"]) {
  if (!errors) return [];
  if (Array.isArray(errors)) return errors.filter(Boolean);
  return Object.values(errors).filter(Boolean);
}

function classifyProviderError(messages: string[]) {
  const joined = messages.join(" ").toLowerCase();
  if (/limit|quota|request/.test(joined)) {
    return new FootballApiError("RATE_LIMIT", "Limit zapytań API został wykorzystany.", 429);
  }
  if (/key|token|auth|account/.test(joined)) {
    return new FootballApiError("INVALID_KEY", "Klucz API danych piłkarskich jest nieprawidłowy.", 401);
  }
  return new FootballApiError("PROVIDER_ERROR", "Nie udało się pobrać danych od dostawcy.", 502);
}

export async function apiFootballRequest<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined>,
  options: { cacheTtlMs: number; refresh?: boolean },
): Promise<T> {
  const apiKey = process.env.FOOTBALL_API_KEY?.trim();
  if (!apiKey) {
    throw new FootballApiError("MISSING_KEY", "Brakuje klucza API danych piłkarskich.", 503);
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const cacheKey = `${endpoint}?${search.toString()}`;
  if (!options.refresh) {
    const cached = getCached<T>(cacheKey);
    if (cached !== null) return cached;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(`${configuredBaseUrl()}${endpoint}?${search.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-apisports-key": apiKey,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (response.status === 429) {
      throw new FootballApiError("RATE_LIMIT", "Limit zapytań API został wykorzystany.", 429);
    }
    if (response.status === 401 || response.status === 403) {
      throw new FootballApiError("INVALID_KEY", "Klucz API danych piłkarskich jest nieprawidłowy.", 401);
    }
    if (!response.ok) {
      throw new FootballApiError("PROVIDER_ERROR", "Nie udało się połączyć z dostawcą danych.", 502);
    }

    const envelope = (await response.json()) as ApiFootballEnvelope<T>;
    const errors = apiErrors(envelope.errors);
    if (errors.length) throw classifyProviderError(errors);
    if (envelope.response === undefined) {
      throw new FootballApiError("INVALID_RESPONSE", "Dostawca zwrócił niepełną odpowiedź.", 502);
    }

    setCached(cacheKey, envelope.response, options.cacheTtlMs);
    return envelope.response;
  } catch (error) {
    if (error instanceof FootballApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new FootballApiError("TIMEOUT", "Przekroczono czas oczekiwania na dane piłkarskie.", 504);
    }
    throw new FootballApiError("PROVIDER_ERROR", "Nie udało się połączyć z dostawcą danych.", 502);
  } finally {
    clearTimeout(timeout);
  }
}
