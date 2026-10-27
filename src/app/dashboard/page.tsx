import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardView } from "@/components/dashboard/DashboardView";
import { Aurora } from "@/components/ui/Aurora";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Profile, SimulationWithCounterpart } from "@/lib/types";

export const metadata: Metadata = { title: "Panoul anonim" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createServerSupabase();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/onboarding");

  const { data: me } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!me) redirect("/onboarding");

  const { data: simulations } = await supabase
    .from("ai_simulations")
    .select("*")
    .or(`user_one.eq.${me.id},user_two.eq.${me.id}`)
    .neq("status", "archived")
    .order("compatibility_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const rows = simulations ?? [];
  const counterpartIds = Array.from(
    new Set(
      rows.map((row) => (row.user_one === me.id ? row.user_two : row.user_one)),
    ),
  );

  let counterparts: Profile[] = [];
  if (counterpartIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("id", counterpartIds);
    counterparts = data ?? [];
  }

  const byId = new Map(counterparts.map((profile) => [profile.id, profile]));

  const items: SimulationWithCounterpart[] = rows.flatMap((simulation) => {
    const otherId =
      simulation.user_one === me.id ? simulation.user_two : simulation.user_one;
    const counterpart = byId.get(otherId);
    if (!counterpart) return [];
    return [
      {
        simulation,
        counterpart: {
          id: counterpart.id,
          username: counterpart.username,
          age: counterpart.age,
          interests: counterpart.interests,
          introversion_score: counterpart.introversion_score,
          bio_summary: counterpart.bio_summary,
        },
      },
    ];
  });

  return (
    <>
      <Aurora intensity={items.some((item) => (item.simulation.compatibility_score ?? 0) >= 85) ? "bloom" : "calm"} />
      <DashboardView me={me} items={items} />
    </>
  );
}
