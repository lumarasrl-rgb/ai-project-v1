"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/lib/types";

export type SilentDateClient = SupabaseClient<Database>;

let cached: SilentDateClient | null = null;

/** Browser-side client. Writes its session to cookies so the server can read it. */
export function createClient(): SilentDateClient {
  cached ??= createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
  return cached;
}

/**
 * SilentDate has no passwords and no email collection — identity is an
 * anonymous Supabase session. Enable "Anonymous sign-ins" under
 * Authentication → Providers in the dashboard.
 */
export async function ensureSession(): Promise<string> {
  const supabase = createClient();

  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;

  const { data: created, error } = await supabase.auth.signInAnonymously();
  if (error || !created.session) {
    throw new Error(
      error?.message ??
        "Could not open an anonymous session. Is anonymous sign-in enabled in Supabase?",
    );
  }
  return created.session.user.id;
}
