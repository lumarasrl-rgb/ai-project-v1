import { cn } from "@/lib/cn";

interface AuroraProps {
  /** `"calm"` for ordinary screens, `"bloom"` for the connection moment. */
  intensity?: "calm" | "bloom";
  className?: string;
}

/**
 * The only colour in the product: two enormous, slow-moving indigo clouds
 * behind an almost-black canvas. Never interactive, never in focus.
 */
export function Aurora({ intensity = "calm", className }: AuroraProps) {
  const bloom = intensity === "bloom";

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void",
        className,
      )}
    >
      <div
        className={cn(
          "absolute left-1/2 top-[-28%] h-[72rem] w-[72rem] -translate-x-1/2 rounded-full blur-[140px] animate-drift",
          bloom ? "opacity-70" : "opacity-40",
        )}
        style={{
          background:
            "radial-gradient(circle at center, rgba(99,102,241,0.30) 0%, rgba(79,70,229,0.14) 38%, transparent 68%)",
        }}
      />
      <div
        className={cn(
          "absolute bottom-[-34%] right-[-14%] h-[58rem] w-[58rem] rounded-full blur-[150px] animate-breathe",
          bloom ? "opacity-60" : "opacity-30",
        )}
        style={{
          background:
            "radial-gradient(circle at center, rgba(79,70,229,0.26) 0%, rgba(11,15,25,0) 70%)",
        }}
      />
      {bloom ? (
        <div
          className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px] animate-breathe"
          style={{
            background:
              "radial-gradient(circle at center, rgba(129,140,248,0.22) 0%, transparent 65%)",
          }}
        />
      ) : null}
      {/* Vignette — keeps the edges matte. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, transparent 30%, rgba(10,10,12,0.75) 100%)",
        }}
      />
    </div>
  );
}
