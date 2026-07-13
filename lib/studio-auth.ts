"use client";

export const studioSessionChangedEvent = "analityq-studio-session-changed";
export const studioSessionExpiredEvent = "analityq-studio-session-expired";
export const studioAccessOpenEvent = "analityq-studio-access-open";

type SessionEnvelope = {
  data?: { authenticated?: boolean };
  error?: { message?: string };
};

async function readSessionResponse(response: Response) {
  let payload: SessionEnvelope = {};
  try {
    payload = (await response.json()) as SessionEnvelope;
  } catch {
    // Nie pokazujemy surowej odpowiedzi serwera.
  }
  return payload;
}

export async function getStudioSessionStatus() {
  try {
    const response = await fetch("/api/studio/session", {
      credentials: "same-origin",
      cache: "no-store",
    });
    const payload = await readSessionResponse(response);
    return response.ok && payload.data?.authenticated === true;
  } catch {
    return false;
  }
}

export async function loginToStudio(password: string) {
  try {
    const response = await fetch("/api/studio/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({ password }),
    });
    const payload = await readSessionResponse(response);

    if (!response.ok || payload.data?.authenticated !== true) {
      return {
        ok: false,
        message: payload.error?.message || "Nie udało się zalogować do Studio.",
      };
    }

    window.dispatchEvent(new Event(studioSessionChangedEvent));
    return { ok: true, message: "" };
  } catch {
    return { ok: false, message: "Nie udało się połączyć z serwerem logowania." };
  }
}

export async function logoutFromStudio() {
  try {
    await fetch("/api/studio/session", {
      method: "DELETE",
      credentials: "same-origin",
      cache: "no-store",
    });
  } finally {
    window.dispatchEvent(new Event(studioSessionChangedEvent));
  }
}
