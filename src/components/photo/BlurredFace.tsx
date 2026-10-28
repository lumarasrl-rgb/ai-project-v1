"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { stageFor } from "@/lib/photo";

interface BlurredFaceProps {
  simulationId: number;
  messageCount: number;
  className?: string;
  /** Shows the stage caption underneath. */
  withCaption?: boolean;
}

/**
 * The other person's face, as blurred as the conversation leaves it.
 *
 * The blur is in the pixels, not in CSS — this only asks the server for the
 * current stage. When the stage changes the new image fades in over the old
 * one, so the face sharpens rather than blinking.
 */
export function BlurredFace({
  simulationId,
  messageCount,
  className,
  withCaption = false,
}: BlurredFaceProps) {
  const stage = stageFor(messageCount);
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(false);
  const previousLevel = useRef(stage.level);

  useEffect(() => {
    if (previousLevel.current !== stage.level) {
      previousLevel.current = stage.level;
      setLoaded(false);
    }
  }, [stage.level]);

  if (missing) return null;

  return (
    <figure className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative overflow-hidden rounded-full border border-white/[0.07] bg-white/[0.02] shadow-2xl shadow-black/50">
        {/* eslint-disable-next-line @next/next/no-img-element -- the route streams bytes, not a static asset */}
        <img
          key={stage.level}
          src={`/api/photo/${simulationId}?stage=${stage.level}`}
          alt={
            stage.sigma > 0
              ? "Fotografia celuilalt, încă neclară"
              : "Fotografia celuilalt"
          }
          onLoad={() => setLoaded(true)}
          onError={() => setMissing(true)}
          className={cn(
            "size-full object-cover transition-opacity duration-1000 ease-out",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
        {/* A faint indigo wash so the blur never reads as a broken image. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(120% 120% at 50% 0%, rgba(99,102,241,0.14) 0%, transparent 70%)",
          }}
        />
        {stage.sigma === 0 ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-dusk/40"
          />
        ) : null}
      </div>

      {withCaption ? (
        <figcaption className="text-center text-[0.625rem] uppercase tracking-[0.22em] text-ghost">
          {stage.label}
        </figcaption>
      ) : null}
    </figure>
  );
}
