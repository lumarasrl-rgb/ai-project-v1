import type { Gender, LookingFor, Profile } from "@/lib/types";

/** How far apart two people's social energy may be and still be paired. */
export const MAX_ENERGY_GAP = 1;

export type MatchableProfile = Pick<
  Profile,
  "id" | "gender" | "looking_for" | "interests" | "introversion_score"
>;

function accepts(preference: LookingFor, gender: Gender): boolean {
  if (preference === "everyone") return true;
  return preference === gender;
}

/** Both sides have to want to meet the other side. No one-way matches. */
export function isMutualPreferenceMatch(
  a: Pick<MatchableProfile, "gender" | "looking_for">,
  b: Pick<MatchableProfile, "gender" | "looking_for">,
): boolean {
  return accepts(a.looking_for, b.gender) && accepts(b.looking_for, a.gender);
}

/** SilentDate pairs low-energy with low-energy. Rhythm matters more than taste. */
export function hasCompatibleEnergy(
  a: Pick<MatchableProfile, "introversion_score">,
  b: Pick<MatchableProfile, "introversion_score">,
): boolean {
  return Math.abs(a.introversion_score - b.introversion_score) <= MAX_ENERGY_GAP;
}

export function sharedInterests(a: string[], b: string[]): string[] {
  const right = new Set(b.map((value) => value.trim().toLowerCase()));
  return Array.from(
    new Set(
      a
        .map((value) => value.trim().toLowerCase())
        .filter((value) => right.has(value)),
    ),
  );
}

/**
 * A cheap pre-score used only to decide which pairs are worth spending a
 * Claude simulation on: shared interests first, matching rhythm second.
 */
export function affinity(a: MatchableProfile, b: MatchableProfile): number {
  const overlap = sharedInterests(a.interests, b.interests).length;
  const energyGap = Math.abs(a.introversion_score - b.introversion_score);
  return overlap * 10 + (MAX_ENERGY_GAP - energyGap) * 3;
}

export interface RankOptions {
  /** Pairs that have already been simulated and must not be repeated. */
  excludeUserIds?: ReadonlySet<string>;
  limit?: number;
}

/** Filters and orders candidates for one user. Pure — easy to reason about. */
export function rankCandidates<T extends MatchableProfile>(
  me: MatchableProfile,
  candidates: readonly T[],
  { excludeUserIds, limit = 3 }: RankOptions = {},
): T[] {
  return candidates
    .filter(
      (candidate) =>
        candidate.id !== me.id &&
        !excludeUserIds?.has(candidate.id) &&
        isMutualPreferenceMatch(me, candidate) &&
        hasCompatibleEnergy(me, candidate),
    )
    .map((candidate) => ({ candidate, score: affinity(me, candidate) }))
    .sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id))
    .slice(0, limit)
    .map((entry) => entry.candidate);
}
