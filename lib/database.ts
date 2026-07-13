"use client";

import { rowToAnalysis, type AnalysisRow } from "./analysis-persistence";
import { studioSessionExpiredEvent } from "./studio-auth";
import { supabase, supabaseMissingConfigMessage } from "./supabase";
import type { MatchAnalysisRecord, PublicationStatus } from "./types";

export const databaseChangeEvent = "analityq-database";
export const databaseFetchErrorMessage =
  "Nie udało się pobrać danych z bazy. Sprawdź połączenie lub konfigurację Supabase.";

type ApiEnvelope<T> = {
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

export class SupabaseConfigError extends Error {
  constructor() {
    super(supabaseMissingConfigMessage);
    this.name = "SupabaseConfigError";
  }
}

export class SupabaseDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseDatabaseError";
  }
}

export class StudioSessionExpiredError extends Error {
  constructor() {
    super("Sesja wygasła. Zaloguj się ponownie.");
    this.name = "StudioSessionExpiredError";
  }
}

function ensureSupabase() {
  if (!supabase) throw new SupabaseConfigError();
  return supabase;
}

function notifyDatabaseChange() {
  window.dispatchEvent(new Event(databaseChangeEvent));
}

function notifySessionExpired() {
  window.dispatchEvent(new Event(studioSessionExpiredEvent));
}

async function studioRequest<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });

  let payload: ApiEnvelope<T> = {};
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // Zwracamy jednolity komunikat zamiast szczegółów odpowiedzi serwera.
  }

  if (response.status === 401) {
    notifySessionExpired();
    throw new StudioSessionExpiredError();
  }

  if (!response.ok || payload.data === undefined) {
    throw new SupabaseDatabaseError(
      payload.error?.message || "Nie udało się wykonać operacji w Studio.",
    );
  }

  return payload.data;
}

export function getPublicDatabaseErrorMessage(error: unknown) {
  if (error instanceof SupabaseConfigError) return supabaseMissingConfigMessage;
  return databaseFetchErrorMessage;
}

export function getStudioDatabaseErrorMessage(error: unknown) {
  if (error instanceof StudioSessionExpiredError) return error.message;
  if (error instanceof SupabaseDatabaseError) return error.message;
  return "Wystąpił problem podczas pracy z bazą Supabase.";
}

export async function getAllAnalyses() {
  return studioRequest<MatchAnalysisRecord[]>("/api/studio/analyses");
}

export async function getPublishedAnalyses() {
  const { data, error } = await ensureSupabase()
    .from("analyses")
    .select("*")
    .eq("publication_status", "published")
    .order("slot_number", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new SupabaseDatabaseError(databaseFetchErrorMessage);
  return ((data || []) as AnalysisRow[]).map(rowToAnalysis);
}

export async function getAnalysisBySlug(slug: string) {
  const { data, error } = await ensureSupabase()
    .from("analyses")
    .select("*")
    .eq("slug", slug)
    .eq("publication_status", "published")
    .maybeSingle();

  if (error) throw new SupabaseDatabaseError(databaseFetchErrorMessage);
  return data ? rowToAnalysis(data as AnalysisRow) : null;
}

export async function createAnalysis(analysis: MatchAnalysisRecord) {
  const saved = await studioRequest<MatchAnalysisRecord>("/api/studio/analyses", {
    method: "POST",
    body: JSON.stringify({ analysis }),
  });
  notifyDatabaseChange();
  return saved;
}

export async function updateAnalysis(id: string, analysis: MatchAnalysisRecord) {
  const saved = await studioRequest<MatchAnalysisRecord>(
    `/api/studio/analyses/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ analysis }),
    },
  );
  notifyDatabaseChange();
  return saved;
}

export async function deleteAnalysis(id: string) {
  await studioRequest<{ deleted: boolean }>(
    `/api/studio/analyses/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  notifyDatabaseChange();
}

async function updatePublicationStatus(id: string, status: PublicationStatus) {
  const saved = await studioRequest<MatchAnalysisRecord>(
    `/api/studio/analyses/${encodeURIComponent(id)}/status`,
    {
      method: "POST",
      body: JSON.stringify({ status }),
    },
  );
  notifyDatabaseChange();
  return saved;
}

export function publishAnalysis(id: string) {
  return updatePublicationStatus(id, "published");
}

export function unpublishAnalysis(id: string) {
  return updatePublicationStatus(id, "draft");
}

export function restoreAnalysis(id: string) {
  return updatePublicationStatus(id, "draft");
}

export function archiveAnalysis(id: string) {
  return updatePublicationStatus(id, "archived");
}

export async function duplicateAnalysis(id: string) {
  const saved = await studioRequest<MatchAnalysisRecord>(
    `/api/studio/analyses/${encodeURIComponent(id)}/duplicate`,
    { method: "POST" },
  );
  notifyDatabaseChange();
  return saved;
}

export async function importAnalysesToDatabase(data: unknown) {
  const imported = await studioRequest<MatchAnalysisRecord[]>("/api/studio/analyses/import", {
    method: "POST",
    body: JSON.stringify({ data }),
  });
  notifyDatabaseChange();
  return imported;
}

export function exportAnalysesFromDatabase() {
  return getAllAnalyses();
}
