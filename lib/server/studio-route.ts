import "server-only";

import { AnalysisRepositoryError } from "./analysis-repository";
import { AdminSupabaseConfigError } from "./supabase-admin";
import { hasValidStudioSession } from "./studio-session";

export const studioUnauthorizedMessage = "Brak uprawnień do wykonania tej operacji.";
export const studioSessionExpiredMessage = "Sesja wygasła. Zaloguj się ponownie.";

export function studioUnauthorizedResponse() {
  return Response.json(
    { error: { code: "UNAUTHORIZED", message: studioUnauthorizedMessage } },
    { status: 401 },
  );
}

export function requireStudioSession(request: Request) {
  return hasValidStudioSession(request) ? null : studioUnauthorizedResponse();
}

export function studioApiErrorResponse(message = "Nie udało się wykonać operacji w Studio.") {
  return Response.json(
    { error: { code: "STUDIO_OPERATION_FAILED", message } },
    { status: 500 },
  );
}

export function studioOperationErrorResponse(error: unknown) {
  if (error instanceof AnalysisRepositoryError || error instanceof AdminSupabaseConfigError) {
    return studioApiErrorResponse(error.message);
  }
  return studioApiErrorResponse();
}

export function isValidAnalysisId(value: string) {
  return value.length > 0 && value.length <= 128;
}
