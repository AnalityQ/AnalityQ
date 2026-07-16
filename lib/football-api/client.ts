import "server-only";

import { getCached, setCached } from "./cache";
import { FootballApiError, type ApiFootballEnvelope } from "./types";

const defaultBaseUrl = "https://v3.football.api-sports.io";
const requestTimeoutMs = 15000;

function configuredBaseUrl() {
  return (process.env.FOOTBALL_API_BASE_URL || defaultBaseUrl).replace(/\/+$/, "");
}

function redactApiKey(value: string, apiKey: string) {
  return apiKey ? value.replaceAll(apiKey, "[REDACTED]") : value;
}

function safeLogParams(
  params: Record<string, string | number | boolean | undefined>,
  apiKey: string,
) {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [
        key,
        /api[-_]?key|token|authorization|auth/i.test(key)
          ? "[REDACTED]"
          : typeof value === "string"
            ? redactApiKey(value, apiKey)
            : value,
      ]),
  );
}

function apiErrors(
  errors: ApiFootballEnvelope<unknown>["errors"],
  apiKey: string,
) {
  if (!errors) return [];
  const values = Array.isArray(errors) ? errors : Object.values(errors);
  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) =>
      redactApiKey(value, apiKey)
        .replace(/[\u0000-\u001f\u007f]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 240),
    )
    .filter(Boolean)
    .slice(0, 10);
}

function logProviderErrors(
  endpoint: string,
  status: number,
  params: Record<string, string | number | boolean | undefined>,
  errors: string[],
  apiKey: string,
) {
  if (!errors.length) return;

  console.error("[API-Football] Provider response errors", {
    endpoint,
    status,
    params: safeLogParams(params, apiKey),
    errors,
  });
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
    const cached = await getCached<T>(cacheKey);
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

    let providerBody = "";
    try {
      providerBody = await response.text();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
    }

    let envelope: ApiFootballEnvelope<T> | null = null;
    try {
      envelope = JSON.parse(providerBody) as ApiFootballEnvelope<T>;
    } catch {
      // Status-based errors below still provide a safe public response.
    }

    const errors = apiErrors(envelope?.errors, apiKey);

    if (!response.ok) {
      console.error("[API-Football] Provider HTTP error", {
        endpoint,
        status: response.status,
        params: safeLogParams(params, apiKey),
        response: redactApiKey(providerBody, apiKey).slice(0, 1000),
      });
    }

    logProviderErrors(endpoint, response.status, params, errors, apiKey);

    if (response.status === 429) {
      throw new FootballApiError("RATE_LIMIT", "Limit zapytań API został wykorzystany.", 429);
    }
    if (response.status === 401 || response.status === 403) {
      throw new FootballApiError("INVALID_KEY", "Klucz API danych piłkarskich jest nieprawidłowy.", 401);
    }
    if (!response.ok) {
      throw new FootballApiError("PROVIDER_ERROR", "Nie udało się połączyć z dostawcą danych.", 502);
    }

    if (errors.length) throw classifyProviderError(errors);
    if (!envelope || envelope.response === undefined) {
      throw new FootballApiError("INVALID_RESPONSE", "Dostawca zwrócił niepełną odpowiedź.", 502);
    }

    await setCached(cacheKey, envelope.response, options.cacheTtlMs);
    return envelope.response;
  } catch (error) {
    if (error instanceof FootballApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new FootballApiError("TIMEOUT", "Przekroczono czas oczekiwania na dane piłkarskie.", 504);
    }
    const cause = error instanceof Error && error.cause && typeof error.cause === "object"
      ? error.cause as { code?: unknown; message?: unknown }
      : null;
    console.error("[API-Football] Request connection failed", {
      endpoint,
      params: safeLogParams(params, apiKey),
      error: error instanceof Error ? error.message : String(error),
      causeCode: typeof cause?.code === "string" ? cause.code : undefined,
      causeMessage: typeof cause?.message === "string"
        ? redactApiKey(cause.message, apiKey).slice(0, 240)
        : undefined,
    });
    throw new FootballApiError("PROVIDER_ERROR", "Nie udało się połączyć z dostawcą danych.", 502);
  } finally {
    clearTimeout(timeout);
  }
}
