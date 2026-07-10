"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const supabaseMissingConfigMessage =
  "Brakuje konfiguracji Supabase. Uzupełnij NEXT_PUBLIC_SUPABASE_URL oraz NEXT_PUBLIC_SUPABASE_ANON_KEY.";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured =
  supabaseUrl.trim().startsWith("http") && supabaseAnonKey.trim().length > 0;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

