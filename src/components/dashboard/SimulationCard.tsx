"use client";

import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Surface } from "@/components/ui/Surface";
import { ScoreMeter } from "@/components/dashboard/ScoreMeter";
import { energyLabel, statusLabel, subjectLabel } from "@/lib/labels";
import { sharedInterests } from "@/lib/matching";
import { CONNECTION_THRESHOLD, type SimulationWithCounterpart } from "@/lib/types";

interface SimulationCardProps {
  item: SimulationWithCounterpart;
  myInterests: string[];
  onOpenTranscript: () => void;
  style?: React.CSSProperties;
}

/** A micro-card: one simulation, in glass, with nothing identifying on it. */
export function SimulationCard({
  item,
  myInterests,
  onOpenTranscript,
  style,
}: SimulationCardProps) {
  const { simulation, counterpart } = item;
  const overlap = sharedInterests(myInterests, counterpart.interests);
  const score = simulation.compatibility_score;
  const connected = (score ?? 0) >= CONNECTION_THRESHOLD;

  return (
    <Surface
      className="flex flex-col p-7 transition-colors duration-700 hover:border-white/[0.09] animate-settle"
      style={style}
    >
      <div className="flex items-start justify-between gap-4">
        <Eyebrow>{subjectLabel(simulation.id)}</Eyebrow>
        <span className="text-[0.6875rem] tracking-[0.02em] text-ghost">
          {statusLabel(simulation.status)}
        </span>
      </div>

      <div className="mt-8 flex items-baseline gap-2">
        <span className="font-mono text-[2.25rem] leading-none tracking-[-0.04em] text-silver">
          {score ?? "—"}
        </span>
        {score !== null ? (
          <span className="font-mono text-[0.8125rem] text-ghost">%</span>
        ) : null}
      </div>

      <ScoreMeter score={score} className="mt-6" />

      <dl className="mt-7 space-y-2.5 text-[0.8125rem]">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ghost">interese comune</dt>
          <dd className="text-whisper">{overlap.length}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ghost">ritm social</dt>
          <dd className="text-whisper">
            {energyLabel(counterpart.introversion_score)}
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={onOpenTranscript}
          disabled={!simulation.simulation_transcript}
          className="flex-1"
        >
          Transcrierea
        </Button>
      </div>

      {connected ? (
        <p className="mt-4 text-center text-[0.6875rem] uppercase tracking-[0.22em] text-dusk/80">
          peste prag
        </p>
      ) : null}
    </Surface>
  );
}
