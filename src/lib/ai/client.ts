import Anthropic from "@anthropic-ai/sdk";

import { anthropicApiKey } from "@/lib/env";

/** Every Claude call in SilentDate runs on the same model. */
export const MODEL = "claude-opus-5-5";

/**
 * Server-side refusal fallback: if a safety classifier declines a request,
 * Anthropic re-routes it by refusal category instead of handing us a dead
 * response. Costs nothing when it never triggers.
 */
export const FALLBACK_BETA = "server-side-fallback-2026-07-01";

let client: Anthropic | null = null;

export function anthropic(): Anthropic {
  client ??= new Anthropic({ apiKey: anthropicApiKey() });
  return client;
}

/** Thrown when Claude returned something we cannot use. */
export class AiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiError";
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
