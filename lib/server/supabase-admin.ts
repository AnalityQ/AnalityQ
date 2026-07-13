import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class AdminSupabaseConfigError extends Error {
  constructor() {
    super("Brakuje serwerowej konfiguracji Supabase.");
    this.name = "AdminSupabaseConfigError";
  }
}

let adminClient: SupabaseClient | null = null;

export function getAdminSupabase() {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) throw new AdminSupabaseConfigError();

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return adminClient;
}
