/**
 * The face ladder.
 *
 * A photo is never served as it was uploaded. At upload time it is rendered
 * into a fixed set of increasingly sharp variants, and a room only ever gets
 * the one its message count has earned. The blur is baked into the pixels, so
 * there is nothing to undo in the browser — a sharper version is not merely
 * hidden, it is not sent.
 */

export interface PhotoStage {
  /** Messages in the room required to reach this stage. */
  at: number;
  /** Gaussian sigma used to render the variant. 0 is the untouched photo. */
  sigma: number;
  /** Stored as `<photo_path>/<level>.jpg`. */
  level: number;
  label: string;
}

/*
 * The sigmas are spaced roughly geometrically, not evenly. Blur is perceived
 * on a log scale: past about sigma 25 on a 768px image everything is the same
 * featureless blob, so an evenly spaced ladder spends its first three rungs
 * looking identical and then jumps straight to a face.
 */
export const PHOTO_STAGES: readonly PhotoStage[] = [
  { at: 0, sigma: 24, level: 5, label: "Un contur, nimic mai mult" },
  { at: 10, sigma: 14, level: 4, label: "Se distinge o siluetă" },
  { at: 20, sigma: 8, level: 3, label: "Trăsăturile se adună" },
  { at: 30, sigma: 4.5, level: 2, label: "Aproape o față" },
  { at: 40, sigma: 2.2, level: 1, label: "Ultimul voal" },
  { at: 50, sigma: 0, level: 0, label: "Fără voal" },
];

export const FULLY_REVEALED_AT = PHOTO_STAGES.at(-1)?.at ?? 50;

/** The sharpest variant this conversation has earned. */
export function stageFor(messageCount: number): PhotoStage {
  let current = PHOTO_STAGES[0]!;
  for (const stage of PHOTO_STAGES) {
    if (messageCount >= stage.at) current = stage;
  }
  return current;
}

export function nextPhotoStage(messageCount: number): PhotoStage | null {
  return PHOTO_STAGES.find((stage) => messageCount < stage.at) ?? null;
}

/** 0 → 1 towards the next sharpening (1 once the photo is clear). */
export function photoProgress(messageCount: number): number {
  const next = nextPhotoStage(messageCount);
  if (!next) return 1;
  const previous = stageFor(messageCount).at;
  const span = next.at - previous;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (messageCount - previous) / span));
}

/** Where a user's variants live inside the private `faces` bucket. */
export function photoObjectPath(photoPath: string, level: number): string {
  return `${photoPath}/${level}.jpg`;
}

export const ACCEPTED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
