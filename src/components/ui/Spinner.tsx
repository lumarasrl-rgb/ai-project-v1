import { cn } from "@/lib/cn";

/** Three breathing dots — quieter than a rotating spinner. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="size-1 rounded-full bg-silver/70 animate-thinking"
          style={{ animationDelay: `${index * 0.18}s` }}
        />
      ))}
    </span>
  );
}
