import { cn } from "@/lib/cn";
import { CONNECTION_THRESHOLD } from "@/lib/types";

/** A one-pixel line. The only data visualisation in the product. */
export function ScoreMeter({
  score,
  className,
}: {
  score: number | null;
  className?: string;
}) {
  const value = score ?? 0;
  const reached = value >= CONNECTION_THRESHOLD;

  return (
    <div className={cn("relative h-px w-full bg-white/[0.06]", className)}>
      <div
        className={cn(
          "absolute inset-y-0 left-0 transition-[width] duration-1000 ease-out",
          reached ? "bg-dusk" : "bg-silver/35",
        )}
        style={{
          width: `${value}%`,
          boxShadow: reached ? "0 0 10px rgba(99,102,241,0.7)" : undefined,
        }}
      />
      {/* The 85% gate, marked discreetly. */}
      <div
        aria-hidden
        className="absolute -top-1 h-[9px] w-px bg-white/[0.12]"
        style={{ left: `${CONNECTION_THRESHOLD}%` }}
      />
    </div>
  );
}
