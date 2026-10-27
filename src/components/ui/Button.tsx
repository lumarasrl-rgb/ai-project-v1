import Link from "next/link";

import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "quiet";
type Size = "md" | "lg";

const BASE =
  "group relative inline-flex select-none items-center justify-center gap-2.5 overflow-hidden rounded-full font-medium transition-all duration-500 ease-out disabled:pointer-events-none disabled:opacity-35";

const VARIANTS: Record<Variant, string> = {
  primary:
    "border border-white/[0.08] bg-white/[0.045] text-silver hover:border-dusk/40 hover:bg-white/[0.07] hover:scale-[1.015] active:scale-[0.985] shadow-xl shadow-black/30",
  ghost:
    "border border-white/[0.05] bg-transparent text-whisper hover:border-white/[0.12] hover:text-silver hover:bg-white/[0.02]",
  quiet:
    "text-ghost hover:text-silver underline-offset-[6px] hover:underline decoration-white/20",
};

const SIZES: Record<Size, string> = {
  md: "px-6 py-2.5 text-[0.8125rem] tracking-[0.01em]",
  lg: "px-8 py-3.5 text-sm tracking-[0.005em]",
};

/** The soft indigo bloom that appears behind a button on hover. */
function Bloom({ variant }: { variant: Variant }) {
  if (variant === "quiet") return null;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
      style={{
        background:
          "radial-gradient(90% 180% at 50% 120%, rgba(99,102,241,0.38) 0%, transparent 62%)",
      }}
    />
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
    >
      <Bloom variant={variant} />
      <span className="relative flex items-center gap-2.5">{children}</span>
    </button>
  );
}

interface ButtonLinkProps
  extends Omit<React.ComponentProps<typeof Link>, "className"> {
  variant?: Variant;
  size?: Size;
  className?: string;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      {...rest}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
    >
      <Bloom variant={variant} />
      <span className="relative flex items-center gap-2.5">{children}</span>
    </Link>
  );
}
