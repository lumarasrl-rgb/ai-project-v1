import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { supabaseServiceRoleKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/lib/types";

let admin: SupabaseClient<Database> | null = null;

/**
 * Service-role client. It bypasses Row Level Security, so it is used in exactly
 * one place: serving a face variant from the private bucket, after the route
 * has already checked that the caller is in the room and worked out how sharp
 * the photo is allowed to be. Never import this from a client component.
 */
export function createAdminSupabase(): SupabaseClient<Database> {
  admin ??= createClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
