"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { Dot, Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/lib/cn";
import { parseTranscript, unquote } from "@/lib/transcript";

interface TranscriptSheetProps {
  transcript: string;
  score: number | null;
  myUsername: string;
  theirUsername: string;
  onClose: () => void;
}

/** The AI-to-AI conversation, structured and anonymised. */
export function TranscriptSheet({
  transcript,
  score,
  myUsername,
  theirUsername,
  onClose,
}: TranscriptSheetProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const lines = parseTranscript(transcript, myUsername, theirUsername);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Transcrierea simulării"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <button
        aria-label="Închide"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-void/80 backdrop-blur-sm"
      />

      <div className="relative m-0 flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-glass border border-white/[0.05] bg-ink/80 shadow-2xl shadow-black/60 backdrop-blur-md animate-rise sm:m-6 sm:rounded-glass">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-48 opacity-70"
          style={{
            background:
              "radial-gradient(120% 100% at 50% 0%, rgba(99,102,241,0.14) 0%, transparent 70%)",
          }}
        />

        <header className="relative flex items-start justify-between gap-6 px-8 pt-8">
          <div>
            <Eyebrow>
              <Dot />
              Discuția clonelor
            </Eyebrow>
            <h2 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-silver">
              Cinci replici, purtate fără voi
            </h2>
          </div>
          {score !== null ? (
            <div className="shrink-0 text-right">
              <div className="font-mono text-2xl text-silver">{score}%</div>
              <div className="text-[0.6875rem] uppercase tracking-[0.2em] text-ghost">
                afinitate
              </div>
            </div>
          ) : null}
        </header>

        <div className="relative mt-7 flex-1 space-y-6 overflow-y-auto px-8 pb-2">
          {lines.map((line, index) => (
            <div
              key={`${index}-${line.text.slice(0, 12)}`}
              className="animate-settle"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              {line.speaker === "narration" ? (
                <p className="text-[0.8125rem] leading-relaxed text-ghost">
                  {line.text}
                </p>
              ) : (
                <div
                  className={cn(
                    "flex flex-col gap-2",
                    line.speaker === "mine" ? "items-start" : "items-end",
                  )}
                >
                  <span className="text-[0.625rem] uppercase tracking-[0.24em] text-ghost">
                    {line.speaker === "mine" ? "clona ta" : "clona lor"}
                  </span>
                  <p
                    className={cn(
                      "max-w-[88%] rounded-[1.5rem] px-6 py-4 text-[0.9375rem] leading-relaxed backdrop-blur-md",
                      line.speaker === "mine"
                        ? "border border-white/[0.05] bg-white/[0.02] text-silver"
                        : "border border-dusk/20 bg-dusk/[0.07] text-silver/90",
                    )}
                  >
                    {unquote(line.text)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <footer className="relative flex items-center justify-between gap-4 border-t border-white/[0.05] px-8 py-6">
          <p className="max-w-[40ch] text-[0.75rem] leading-relaxed text-ghost">
            Transcrierea rămâne între voi doi. Nimeni altcineva nu o poate citi.
          </p>
          <Button variant="ghost" onClick={onClose}>
            Închide
          </Button>
        </footer>
      </div>
    </div>
  );
}
