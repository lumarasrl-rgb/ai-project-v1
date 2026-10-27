import { Dot } from "@/components/ui/Eyebrow";
import type { Reveal } from "@/lib/unlocks";

/** A fragment of the other person, surfacing mid-conversation. */
export function RevealCard({ reveal }: { reveal: Reveal }) {
  return (
    <div className="flex justify-center py-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-[1.5rem] border border-dusk/[0.16] bg-white/[0.02] px-7 py-6 text-center backdrop-blur-md shadow-xl shadow-black/30">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(99,102,241,0.7), transparent)",
          }}
        />
        {/* A single light sweep as the card appears. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 animate-sweep"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(226,232,240,0.07), transparent)",
          }}
        />

        <div className="relative flex items-center justify-center gap-2.5">
          <Dot />
          <span className="text-[0.625rem] uppercase tracking-[0.24em] text-ghost">
            indiciu deblocat
          </span>
        </div>

        <p className="relative mt-5 text-[0.6875rem] uppercase tracking-[0.2em] text-dusk/70">
          {reveal.label}
        </p>
        <p className="relative mt-3 text-[1.0625rem] leading-relaxed text-silver animate-unveil">
          {reveal.value}
        </p>
      </div>
    </div>
  );
}
