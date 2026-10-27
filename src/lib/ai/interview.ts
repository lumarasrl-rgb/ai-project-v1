import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { AiError, FALLBACK_BETA, MODEL, anthropic, clamp } from "@/lib/ai/client";

const SignalsSchema = z.object({
  interests: z
    .array(z.string())
    .describe("4-10 cuvinte-cheie, minuscule, fără diacritice decorative"),
  bio_summary: z
    .string()
    .describe("Portret psihologic la persoana a treia, 2-3 propoziții"),
  introversion_score: z
    .number()
    .describe("1 = profund introvertit, 5 = energic social"),
});

export interface ProfileSignals {
  interests: string[];
  bio_summary: string;
  introversion_score: number;
}

const SYSTEM_PROMPT = `Ești psihologul discret al SilentDate, o platformă de dating pentru introvertiți.
Primești transcrierea brută a unui interviu de onboarding și extragi din ea semnalele structurate ale profilului.

Reguli:
- "interests" este un vector de 4-10 cuvinte-cheie scurte (1-3 cuvinte fiecare), scrise cu minuscule. Extrage pasiuni, teme, medii și ritualuri concrete — nu adjective generice precum "interesant" sau "amuzant".
- "bio_summary" este un portret psihologic de 2-3 propoziții, scris la persoana a treia, cald și lucid, fără clișee de dating și fără detalii identificabile (nume, oraș, loc de muncă).
- "introversion_score" estimează energia socială de la 1 (profund introvertit, are nevoie de liniște îndelungată) la 5 (energic social, se încarcă în grup).
- Nu inventa informații care nu apar în interviu. Dacă interviul e sărac, rămâi la ce s-a spus.
- Răspunde exclusiv în limba română.`;

/**
 * Reads the raw onboarding interview and distils it into the structured
 * columns of `profiles`.
 */
export async function extractProfileSignals(
  rawInterview: string,
): Promise<ProfileSignals> {
  const response = await anthropic().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    system: SYSTEM_PROMPT,
    output_config: {
      effort: "medium",
      format: zodOutputFormat(SignalsSchema),
    },
    messages: [
      {
        role: "user",
        content: `Transcrierea interviului:\n\n${rawInterview}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new AiError(
      "Claude a refuzat să analizeze acest interviu. Reformulează răspunsurile și încearcă din nou.",
    );
  }

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new AiError("Claude nu a returnat un profil structurat valid.");
  }

  const interests = parsed.interests
    .map((interest) => interest.trim().toLowerCase())
    .filter((interest) => interest.length > 0 && interest.length <= 48)
    .slice(0, 10);

  return {
    interests: Array.from(new Set(interests)),
    bio_summary: parsed.bio_summary.trim(),
    introversion_score: clamp(parsed.introversion_score, 1, 5),
  };
}
