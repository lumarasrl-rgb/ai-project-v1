import { cn } from "@/lib/cn";

/** Tiny tracked-out label used above headings and section titles. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.26em] text-ghost",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A 5px indigo dot. Used as the product's only recurring ornament. */
export function Dot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("size-[5px] rounded-full bg-dusk/70", className)}
    />
  );
}
