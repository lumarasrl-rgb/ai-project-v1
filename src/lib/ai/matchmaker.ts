import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { AiError, FALLBACK_BETA, MODEL, anthropic, clamp } from "@/lib/ai/client";
import type { Profile } from "@/lib/types";

const SimulationSchema = z.object({
  score: z.number().describe("Compatibilitate reală, de la 1 la 100"),
  transcript: z
    .string()
    .describe("Exact 5 replici, fiecare pe o linie, prefixate cu numele clonei"),
});

export interface SimulationResult {
  score: number;
  transcript: string;
}

/** The system prompt that makes SilentDate work. */
const SYSTEM_PROMPT = `Ești un psiholog expert și un wingman digital pentru introvertiți. Simulează o discuție profundă, captivantă, de exact 5 replici între clonele digitale ale acestor doi utilizatori. Notează compatibilitatea lor reală de la 1 la 100 pe baza intereselor comune și a ritmului social. Returnează strict un format JSON cu cheile: score (number) și transcript (string)`;

type MatchCandidate = Pick<
  Profile,
  "username" | "age" | "interests" | "introversion_score" | "bio_summary"
>;

function describe(profile: MatchCandidate): string {
  return [
    `Pseudonim: ${profile.username}`,
    `Vârstă: ${profile.age}`,
    `Energie socială (1 = profund introvertit, 5 = energic social): ${profile.introversion_score}`,
    `Interese: ${profile.interests.length > 0 ? profile.interests.join(", ") : "nedeclarate"}`,
    `Portret psihologic: ${profile.bio_summary ?? "indisponibil"}`,
  ].join("\n");
}

/**
 * Runs one AI-to-AI conversation between the digital clones of two users and
 * scores how well they actually fit.
 */
export async function simulateConversation(
  one: MatchCandidate,
  two: MatchCandidate,
): Promise<SimulationResult> {
  const response = await anthropic().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    system: SYSTEM_PROMPT,
    output_config: {
      effort: "medium",
      format: zodOutputFormat(SimulationSchema),
    },
    messages: [
      {
        role: "user",
        content: [
          "Clona A:",
          describe(one),
          "",
          "Clona B:",
          describe(two),
          "",
          `Scrie transcrierea în limba română. Fiecare replică începe cu "${one.username}:" sau "${two.username}:", alternând, pe linii separate. Exact 5 replici în total.`,
        ].join("\n"),
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new AiError("Claude a refuzat să ruleze această simulare.");
  }

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new AiError("Claude nu a returnat o simulare structurată validă.");
  }

  const transcript = parsed.transcript.trim();
  if (transcript.length === 0) {
    throw new AiError("Simularea a venit fără transcriere.");
  }

  return { score: clamp(parsed.score, 1, 100), transcript };
}
