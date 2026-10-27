import { cn } from "@/lib/cn";

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `"panel"` is the standard deep-glass card, `"inset"` sits inside one. */
  tone?: "panel" | "inset";
  glow?: boolean;
}

/**
 * Deep glassmorphism: 2% white fill, 5% white hairline, heavy blur, layered
 * soft shadow. Every card in SilentDate is one of these.
 */
export function Surface({
  tone = "panel",
  glow = false,
  className,
  children,
  ...rest
}: SurfaceProps) {
  return (
    <div
      {...rest}
      className={cn(
        "relative rounded-glass border backdrop-blur-md",
        tone === "panel"
          ? "border-white/[0.05] bg-white/[0.02] shadow-2xl shadow-black/40"
          : "border-white/[0.04] bg-white/[0.015]",
        glow && "ring-1 ring-dusk/20",
        className,
      )}
    >
      {glow ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-glass opacity-60"
          style={{
            background:
              "radial-gradient(130% 100% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 60%)",
          }}
        />
      ) : null}
      <div className="relative">{children}</div>
    </div>
  );
}
