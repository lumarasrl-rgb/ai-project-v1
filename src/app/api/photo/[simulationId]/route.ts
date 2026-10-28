import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { photoObjectPath, stageFor } from "@/lib/photo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ simulationId: string }>;
}

/**
 * Serves the other person's face, blurred to whatever this conversation has
 * earned. The caller never names a blur level — the server counts the messages
 * and picks. A sharper variant is not hidden from the browser, it is simply
 * never sent.
 */
export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { simulationId } = await context.params;
  const id = Number(simulationId);
  if (!Number.isInteger(id) || id <= 0) {
    return new Response("Not found", { status: 404 });
  }

  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response("Unauthorized", { status: 401 });

  // RLS limits this to the two participants, so a row coming back is the
  // authorisation check.
  const { data: simulation } = await supabase
    .from("ai_simulations")
    .select("user_one, user_two")
    .eq("id", id)
    .maybeSingle();

  if (!simulation) return new Response("Not found", { status: 404 });

  const counterpartId =
    simulation.user_one === auth.user.id
      ? simulation.user_two
      : simulation.user_one;

  const { data: counterpart } = await supabase
    .from("profiles")
    .select("photo_path")
    .eq("id", counterpartId)
    .maybeSingle();

  if (!counterpart?.photo_path) {
    return new Response("No photo", { status: 404 });
  }

  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("simulation_id", id);

  const stage = stageFor(count ?? 0);

  const { data: blob, error } = await createAdminSupabase()
    .storage.from("faces")
    .download(photoObjectPath(counterpart.photo_path, stage.level));

  if (error || !blob) {
    console.error("[photo] download failed", error);
    return new Response("Not found", { status: 404 });
  }

  return new Response(await blob.arrayBuffer(), {
    headers: {
      "Content-Type": "image/jpeg",
      // Private, and short-lived: the next ten messages change the answer.
      "Cache-Control": "private, max-age=15",
      "X-Photo-Stage": String(stage.level),
    },
  });
}
