import { photoObjectPath } from "@/lib/photo";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Your own face, unblurred. Storage RLS already limits this to your folder. */
export async function GET(): Promise<Response> {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response("Unauthorized", { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("photo_path")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile?.photo_path) return new Response("No photo", { status: 404 });

  const { data: blob, error } = await supabase.storage
    .from("faces")
    .download(photoObjectPath(profile.photo_path, 0));

  if (error || !blob) return new Response("Not found", { status: 404 });

  return new Response(await blob.arrayBuffer(), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=60",
    },
  });
}
