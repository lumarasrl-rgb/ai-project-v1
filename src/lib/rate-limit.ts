import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types";

export type AiUsageKind = "interview" | "simulation";

/**
 * SilentDate signs people in anonymously, so a new identity costs nothing and a
 * per-user quota alone would not protect the Anthropic budget. Calls are
 * therefore also counted per caller IP — stored only as a salted hash, never in
 * the clear. Set IP_HASH_SALT in production; the fallback keeps local
 * development working but makes the hashes guessable.
 */
const FALLBACK_SALT = "silentdate-development-salt";

function salt(): string {
  return process.env.IP_HASH_SALT ?? FALLBACK_SALT;
}

/** Best-effort client address, as seen behind a proxy or load balancer. */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first && first.length > 0 ? first : headers.get("x-real-ip");
}

export function hashIp(ip: string | null): string {
  if (!ip) return "";
  return createHash("sha256").update(`${salt()}:${ip}`).digest("hex");
}

/**
 * Asks Postgres to count this caller's recent Claude calls and record another
 * one. The ceilings live in `claim_ai_usage` rather than here: the function is
 * reachable over PostgREST, so a caller must not be able to supply its own.
 *
 * Returns false when the quota is spent — treat that as "do not call Claude".
 */
export async function claimAiUsage(
  supabase: SupabaseClient<Database>,
  kind: AiUsageKind,
  headers: Headers,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("claim_ai_usage", {
    p_kind: kind,
    p_ip_hash: hashIp(clientIp(headers)),
  });

  if (error) {
    console.error("[rate-limit] claim failed", error);
    return false;
  }
  return data === true;
}

export const QUOTA_MESSAGE =
  "Ai atins limita de analize AI pentru astăzi. Încearcă din nou mâine.";
