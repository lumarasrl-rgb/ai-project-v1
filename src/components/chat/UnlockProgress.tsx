import { nextReveal, unlockProgress } from "@/lib/unlocks";

/**
 * The Message Unlocker: a single neon hairline across the top of the screen.
 * It fills as the two of you write, and each time it completes, a new
 * fragment of the other person is revealed.
 */
export function UnlockProgress({ messageCount }: { messageCount: number }) {
  const progress = unlockProgress(messageCount);
  const upcoming = nextReveal(messageCount);
  const remaining = upcoming ? upcoming.at - messageCount : 0;

  return (
    <div className="fixed inset-x-0 top-0 z-40">
      <div className="relative h-px w-full bg-white/[0.05]">
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-1000 ease-out"
          style={{
            width: `${progress * 100}%`,
            background:
              "linear-gradient(90deg, rgba(79,70,229,0) 0%, rgba(99,102,241,0.9) 60%, rgba(165,180,252,1) 100%)",
            boxShadow: "0 0 14px rgba(99,102,241,0.75)",
          }}
        />
      </div>

      <div className="mx-auto flex w-full max-w-3xl justify-end px-6 pt-2.5">
        <span className="text-[0.625rem] uppercase tracking-[0.22em] text-ghost">
          {upcoming
            ? `${upcoming.label} · încă ${remaining} ${remaining === 1 ? "mesaj" : "mesaje"}`
            : "totul deblocat"}
        </span>
      </div>
    </div>
  );
}
