import { NextResponse } from "next/server";
import { z } from "zod";

import { AiError } from "@/lib/ai/client";
import { extractProfileSignals } from "@/lib/ai/interview";
import { createServerSupabase } from "@/lib/supabase/server";
import { GENDERS, LOOKING_FOR, type Profile } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Pseudonimul are nevoie de minim 3 caractere.")
    .max(24, "Pseudonimul e prea lung.")
    .regex(
      /^[a-z0-9._-]+$/i,
      "Folosește doar litere, cifre, punct, minus sau underscore.",
    ),
  age: z.coerce.number().int().min(18, "SilentDate e 18+.").max(120),
  gender: z.enum(GENDERS),
  looking_for: z.enum(LOOKING_FOR),
  raw_interview: z
    .string()
    .trim()
    .min(120, "Interviul e prea scurt pentru a construi o clonă credibilă.")
    .max(20000),
});

export interface InterviewResponse {
  profile: Profile;
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json(
      { error: "Nu există o sesiune activă." },
      { status: 401 },
    );
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Date de interviu invalide.",
        issues: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 422 },
    );
  }

  const body = parsed.data;

  let signals;
  try {
    signals = await extractProfileSignals(body.raw_interview);
  } catch (error) {
    const message =
      error instanceof AiError
        ? error.message
        : "Analiza interviului a eșuat. Încearcă din nou în câteva momente.";
    console.error("[interview] extraction failed", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: auth.user.id,
        username: body.username.toLowerCase(),
        age: body.age,
        gender: body.gender,
        looking_for: body.looking_for,
        raw_interview: body.raw_interview,
        interests: signals.interests,
        bio_summary: signals.bio_summary,
        introversion_score: signals.introversion_score,
      },
      { onConflict: "id" },
    )
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation → the pseudonym is taken.
    const status = error.code === "23505" ? 409 : 500;
    return NextResponse.json(
      {
        error:
          status === 409
            ? "Pseudonimul acesta este deja folosit. Alege altul."
            : "Nu am putut salva profilul.",
      },
      { status },
    );
  }

  return NextResponse.json<InterviewResponse>({ profile: data });
}
