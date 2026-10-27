import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ChatRoom } from "@/components/chat/ChatRoom";
import { Aurora } from "@/components/ui/Aurora";
import { createServerSupabase } from "@/lib/supabase/server";
import { CONNECTION_THRESHOLD } from "@/lib/types";

export const metadata: Metadata = { title: "Cameră anonimă" };
export const dynamic = "force-dynamic";

interface ChatPageProps {
  params: Promise<{ simulationId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { simulationId } = await params;
  const id = Number(simulationId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/onboarding");

  // Row Level Security already limits this to the two participants.
  const { data: simulation } = await supabase
    .from("ai_simulations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!simulation) notFound();

  if ((simulation.compatibility_score ?? 0) < CONNECTION_THRESHOLD) {
    redirect("/dashboard");
  }

  const counterpartId =
    simulation.user_one === auth.user.id
      ? simulation.user_two
      : simulation.user_one;

  const { data: counterpart } = await supabase
    .from("profiles")
    .select("username, age, interests, introversion_score, bio_summary")
    .eq("id", counterpartId)
    .maybeSingle();

  if (!counterpart) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("simulation_id", id)
    .order("created_at", { ascending: true });

  if (simulation.status !== "connected") {
    await supabase
      .from("ai_simulations")
      .update({ status: "connected" })
      .eq("id", id);
  }

  return (
    <>
      <Aurora />
      <ChatRoom
        simulationId={id}
        myId={auth.user.id}
        compatibilityScore={simulation.compatibility_score}
        counterpart={counterpart}
        initialMessages={messages ?? []}
      />
    </>
  );
}
