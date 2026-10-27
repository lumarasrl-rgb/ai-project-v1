import type { Profile } from "@/lib/types";

/** A new fragment of the other person surfaces every 10 messages. */
export const MESSAGES_PER_UNLOCK = 10;

export type RevealField =
  | "energy"
  | "interests"
  | "portrait"
  | "handle"
  | "age";

export interface RevealDefinition {
  field: RevealField;
  /** Number of messages in the thread required to unlock. */
  at: number;
  label: string;
}

export const REVEALS: readonly RevealDefinition[] = [
  { field: "energy", at: 10, label: "Energia lor socială" },
  { field: "interests", at: 20, label: "Ce ascultă și ce îi ține treaz" },
  { field: "portrait", at: 30, label: "Portretul lor psihologic" },
  { field: "handle", at: 40, label: "Pseudonimul lor" },
  { field: "age", at: 50, label: "Vârsta lor" },
];

const ENERGY_LABELS: Record<number, string> = {
  1: "Liniște profundă. Se încarcă singur, în tăcere lungă.",
  2: "Introvertit. Preferă unu-la-unu și serile fără planuri.",
  3: "Echilibrat. Social în doze mici, atent calibrate.",
  4: "Sociabil, dar selectiv. Puțini oameni, des.",
  5: "Energic social. Se încarcă în grup.",
};

export type RevealSource = Pick<
  Profile,
  "username" | "age" | "interests" | "introversion_score" | "bio_summary"
>;

export interface Reveal extends RevealDefinition {
  value: string;
}

function valueFor(field: RevealField, person: RevealSource): string {
  switch (field) {
    case "energy":
      return ENERGY_LABELS[person.introversion_score] ?? "Ritm necunoscut.";
    case "interests":
      return person.interests.length > 0
        ? person.interests.slice(0, 4).join(" · ")
        : "Încă nu a declarat nimic.";
    case "portrait":
      return person.bio_summary ?? "Portretul nu a fost încă scris.";
    case "handle":
      return person.username;
    case "age":
      return `${person.age} de ani`;
  }
}

/** Everything unlocked so far, oldest first. */
export function unlockedReveals(
  messageCount: number,
  person: RevealSource,
): Reveal[] {
  return REVEALS.filter((reveal) => messageCount >= reveal.at).map((reveal) => ({
    ...reveal,
    value: valueFor(reveal.field, person),
  }));
}

export function nextReveal(messageCount: number): RevealDefinition | null {
  return REVEALS.find((reveal) => messageCount < reveal.at) ?? null;
}

/** 0 → 1 progress towards the next reveal (1 when everything is unlocked). */
export function unlockProgress(messageCount: number): number {
  const next = nextReveal(messageCount);
  if (!next) return 1;
  const previous = next.at - MESSAGES_PER_UNLOCK;
  return Math.min(
    1,
    Math.max(0, (messageCount - previous) / MESSAGES_PER_UNLOCK),
  );
}
