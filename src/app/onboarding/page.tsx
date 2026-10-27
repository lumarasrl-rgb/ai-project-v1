import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { InterviewChat } from "@/components/interview/InterviewChat";
import { Aurora } from "@/components/ui/Aurora";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Interviul" };

export default async function OnboardingPage() {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();

  if (auth.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (profile) redirect("/dashboard");
  }

  return (
    <>
      <Aurora />
      <InterviewChat />
    </>
  );
}
