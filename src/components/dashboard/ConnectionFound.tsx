"use client";

import { BlurredFace } from "@/components/photo/BlurredFace";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dot, Eyebrow } from "@/components/ui/Eyebrow";
import { sharedInterests } from "@/lib/matching";
import { subjectLabel } from "@/lib/labels";
import type { SimulationWithCounterpart } from "@/lib/types";

interface ConnectionFoundProps {
  item: SimulationWithCounterpart;
  myInterests: string[];
  onReadTranscript: () => void;
}

/**
 * The moment the whole product exists for: two clones crossed 85%.
 * Deliberately the only screen in SilentDate that glows.
 */
export function ConnectionFound({
  item,
  myInterests,
  onReadTranscript,
}: ConnectionFoundProps) {
  const { simulation, counterpart } = item;
  const overlap = sharedInterests(myInterests, counterpart.interests);

  return (
    <section className="relative overflow-hidden rounded-glass border border-dusk/[0.18] bg-white/[0.02] backdrop-blur-md shadow-2xl shadow-black/50 animate-rise">
      {/* Radial bloom — the dramatic background. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/3 animate-breathe"
        style={{
          background:
            "radial-gradient(circle at center, rgba(99,102,241,0.30) 0%, rgba(79,70,229,0.12) 42%, transparent 68%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(99,102,241,0.8), transparent)",
        }}
      />

      <div className="relative px-8 py-16 sm:px-16 sm:py-20">
        <div className="flex flex-col items-center text-center">
          <Eyebrow className="text-dusk/70">
            <Dot className="bg-dusk animate-breathe" />
            {subjectLabel(simulation.id)}
          </Eyebrow>

          {/* No caption here: the server decides the real stage from the
              message count, which this card does not know. The image is
              always correct; a label guessed from zero would not be. */}
          <BlurredFace
            simulationId={simulation.id}
            messageCount={0}
            className="mt-10 [&>div]:size-32 sm:[&>div]:size-40"
          />

          <h2 className="mt-10 text-[2.5rem] font-medium leading-[1.05] tracking-[-0.04em] text-silver sm:text-[3.5rem] animate-unveil">
            Conexiune Găsită
          </h2>

          <p className="mt-8 max-w-[46ch] text-[0.9375rem] leading-relaxed text-whisper">
            Clonele voastre au vorbit cinci replici și s-au înțeles mai bine decât
            majoritatea oamenilor la a treia întâlnire.
          </p>

          <div className="mt-12 flex items-end gap-3">
            <span className="font-mono text-[4.5rem] leading-none tracking-[-0.05em] text-silver drop-shadow-[0_0_28px_rgba(99,102,241,0.45)]">
              {simulation.compatibility_score}
            </span>
            <span className="pb-3 font-mono text-base text-dusk/80">%</span>
          </div>
          <span className="mt-4 text-[0.6875rem] uppercase tracking-[0.26em] text-ghost">
            compatibilitate reală
          </span>

          {overlap.length > 0 ? (
            <ul className="mt-12 flex max-w-xl flex-wrap justify-center gap-2">
              {overlap.slice(0, 6).map((interest) => (
                <li
                  key={interest}
                  className="rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 text-[0.75rem] text-whisper backdrop-blur-md"
                >
                  {interest}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href={`/chat/${simulation.id}`} size="lg">
              Deschide camera anonimă
              <span
                aria-hidden
                className="transition-transform duration-500 group-hover:translate-x-1"
              >
                →
              </span>
            </ButtonLink>
            <Button variant="ghost" size="lg" onClick={onReadTranscript}>
              Citește discuția clonelor
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
