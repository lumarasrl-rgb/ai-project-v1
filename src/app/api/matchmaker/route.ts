import { NextResponse } from "next/server";
import { z } from "zod";

import { simulateConversation } from "@/lib/ai/matchmaker";
import { rankCandidates } from "@/lib/matching";
import { createServerSupabase } from "@/lib/supabase/server";
import type { AiSimulation, LookingFor, Profile } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Each simulation is one Claude call; keep the request alive long enough. */
export const maxDuration = 120;

const BodySchema = z
  .object({ limit: z.coerce.number().int().min(1).max(3).default(2) })
  .default({ limit: 2 });

export interface MatchmakerResponse {
  simulations: AiSimulation[];
  /** Candidates that were eligible but not simulated in this run. */
  remainingCandidates: number;
  message: string;
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

  const body = BodySchema.parse(
    await request.json().catch(() => undefined),
  );

  const { data: me, error: meError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (meError) {
    return NextResponse.json(
      { error: "Nu am putut citi profilul tău." },
      { status: 500 },
    );
  }
  if (!me) {
    return NextResponse.json(
      { error: "Termină mai întâi interviul de onboarding." },
      { status: 409 },
    );
  }

  // Everyone this user has already been simulated against.
  const { data: existing } = await supabase
    .from("ai_simulations")
    .select("user_one, user_two")
    .or(`user_one.eq.${me.id},user_two.eq.${me.id}`);

  const alreadyPaired = new Set<string>(
    (existing ?? []).flatMap((row) =>
      [row.user_one, row.user_two].filter((id) => id !== me.id),
    ),
  );

  // Coarse filter in Postgres (gender preference + similar low social energy),
  // fine ranking in `rankCandidates`.
  const energyFloor = Math.max(1, me.introversion_score - 1);
  const energyCeiling = Math.min(5, me.introversion_score + 1);

  let query = supabase
    .from("profiles")
    .select("*")
    .neq("id", me.id)
    .gte("introversion_score", energyFloor)
    .lte("introversion_score", energyCeiling);

  if (me.looking_for !== "everyone") {
    query = query.eq("gender", me.looking_for);
  }

  // `looking_for` has no "other" option, so a profile with gender "other" is
  // only reachable by people open to everyone.
  const acceptablePreferences: LookingFor[] =
    me.gender === "other" ? ["everyone"] : [me.gender, "everyone"];
  query = query.in("looking_for", acceptablePreferences);

  const { data: pool, error: poolError } = await query.limit(200);
  if (poolError) {
    return NextResponse.json(
      { error: "Nu am putut căuta candidați." },
      { status: 500 },
    );
  }

  const ranked = rankCandidates<Profile>(me, pool ?? [], {
    excludeUserIds: alreadyPaired,
    limit: body.limit,
  });

  if (ranked.length === 0) {
    return NextResponse.json<MatchmakerResponse>({
      simulations: [],
      remainingCandidates: 0,
      message:
        "Nu există încă nimeni cu ritmul tău. Clonele tale rămân în așteptare.",
    });
  }

  const simulations: AiSimulation[] = [];

  for (const candidate of ranked) {
    // Claim the pair first, so two concurrent runs cannot duplicate it.
    const { data: claimed, error: claimError } = await supabase
      .from("ai_simulations")
      .insert({
        user_one: me.id,
        user_two: candidate.id,
        status: "simulating",
        compatibility_score: null,
        simulation_transcript: null,
      })
      .select()
      .single();

    if (claimError || !claimed) {
      // 23505 → the pair was simulated by a parallel run. Skip quietly.
      if (claimError?.code !== "23505") {
        console.error("[matchmaker] could not claim pair", claimError);
      }
      continue;
    }

    try {
      const result = await simulateConversation(me, candidate);
      const { data: completed, error: updateError } = await supabase
        .from("ai_simulations")
        .update({
          compatibility_score: result.score,
          simulation_transcript: result.transcript,
          status: "completed",
        })
        .eq("id", claimed.id)
        .select()
        .single();

      if (updateError || !completed) throw updateError ?? new Error("update failed");
      simulations.push(completed);
    } catch (error) {
      console.error("[matchmaker] simulation failed", error);
      await supabase
        .from("ai_simulations")
        .update({ status: "archived" })
        .eq("id", claimed.id);
    }
  }

  const remaining = Math.max(
    0,
    (pool ?? []).filter((candidate) => !alreadyPaired.has(candidate.id)).length -
      ranked.length,
  );

  return NextResponse.json<MatchmakerResponse>({
    simulations,
    remainingCandidates: remaining,
    message:
      simulations.length > 0
        ? `${simulations.length} ${simulations.length === 1 ? "simulare" : "simulări"} finalizate.`
        : "Simulările nu au putut fi finalizate. Încearcă din nou.",
  });
}
