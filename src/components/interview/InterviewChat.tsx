"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Dot, Eyebrow } from "@/components/ui/Eyebrow";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { INTERVIEW_SCRIPT, buildTranscript } from "@/lib/interview-script";
import { ensureSession } from "@/lib/supabase/client";
import { GENDERS, LOOKING_FOR, type Gender, type LookingFor } from "@/lib/types";

interface Entry {
  key: string;
  role: "ai" | "user";
  text: string;
}

const BUBBLE_DELAY_MS = 850;

function isGender(value: string): value is Gender {
  return (GENDERS as readonly string[]).includes(value);
}

function isLookingFor(value: string): value is LookingFor {
  return (LOOKING_FOR as readonly string[]).includes(value);
}

export function InterviewChat() {
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [inputReady, setInputReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const step = INTERVIEW_SCRIPT[stepIndex];
  const finished = stepIndex >= INTERVIEW_SCRIPT.length;

  // Open the anonymous session in the background while the user reads.
  useEffect(() => {
    ensureSession().catch((cause: unknown) => {
      setError(
        cause instanceof Error
          ? cause.message
          : "Nu am putut deschide o sesiune anonimă.",
      );
    });
  }, []);

  // The AI's lines arrive one at a time, each fading in.
  useEffect(() => {
    if (!step) return;

    setInputReady(false);
    const timers = step.says.map((text, index) =>
      setTimeout(
        () => {
          const key = `${step.id}-ai-${index}`;
          setEntries((previous) =>
            previous.some((entry) => entry.key === key)
              ? previous
              : [...previous, { key, role: "ai", text }],
          );
          if (index === step.says.length - 1) setInputReady(true);
        },
        320 + index * BUBBLE_DELAY_MS,
      ),
    );

    return () => {
      for (const timer of timers) clearTimeout(timer);
    };
  }, [step]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries.length, inputReady, submitting]);

  /** The photo can only be attached once the profile row exists. */
  const uploadPhoto = useCallback(async (file: File) => {
    const body = new FormData();
    body.append("photo", file);
    const response = await fetch("/api/photo/upload", { method: "POST", body });
    if (!response.ok) {
      throw new Error("Profilul s-a creat, dar fotografia nu a putut fi urcată.");
    }
  }, []);

  const submitProfile = useCallback(
    async (allAnswers: Record<string, string>) => {
      setSubmitting(true);
      setError(null);
      try {
        await ensureSession();

        const gender = allAnswers.gender ?? "";
        const lookingFor = allAnswers.looking_for ?? "";
        if (!isGender(gender) || !isLookingFor(lookingFor)) {
          throw new Error("Răspunsurile despre preferințe lipsesc.");
        }

        const response = await fetch("/api/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: allAnswers.username ?? "",
            age: Number(allAnswers.age ?? "0"),
            gender,
            looking_for: lookingFor,
            raw_interview: buildTranscript(allAnswers),
          }),
        });

        if (!response.ok) {
          const payload: unknown = await response.json().catch(() => null);
          const message =
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof (payload as { error: unknown }).error === "string"
              ? (payload as { error: string }).error
              : "Nu am putut construi clona ta.";
          throw new Error(message);
        }

        if (photo) await uploadPhoto(photo);

        router.replace("/dashboard");
      } catch (cause: unknown) {
        setError(
          cause instanceof Error ? cause.message : "Ceva a mers greșit.",
        );
        setSubmitting(false);
      }
    },
    [photo, router, uploadPhoto],
  );

  const commit = useCallback(
    (rawValue: string, label?: string) => {
      if (!step) return;
      const value = rawValue.trim();
      if (value.length === 0) return;

      const next = { ...answers, [step.id]: value };
      setAnswers(next);
      setEntries((previous) => [
        ...previous,
        { key: `${step.id}-user`, role: "user", text: label ?? value },
      ]);
      setDraft("");
      setInputReady(false);
      setError(null);

      const isLast = stepIndex === INTERVIEW_SCRIPT.length - 1;
      setStepIndex(stepIndex + 1);
      if (isLast) void submitProfile(next);
    },
    [answers, step, stepIndex, submitProfile],
  );

  const validation = useMemo<string | null>(() => {
    if (!step) return null;
    const value = draft.trim();
    switch (step.kind) {
      case "handle":
        if (value.length < 3) return "Minim 3 caractere.";
        if (!/^[a-z0-9._-]+$/i.test(value))
          return "Doar litere, cifre, punct, minus sau underscore.";
        return null;
      case "age": {
        const age = Number(value);
        if (!Number.isInteger(age) || age < 18 || age > 120)
          return "Trebuie să ai cel puțin 18 ani.";
        return null;
      }
      case "open":
        if (value.length < step.minLength)
          return `Încă ${step.minLength - value.length} caractere.`;
        return null;
      case "choice":
      case "photo":
        return null;
    }
  }, [draft, step]);

  const progress = Math.min(
    1,
    (stepIndex + (inputReady ? 0.5 : 0)) / INTERVIEW_SCRIPT.length,
  );

  return (
    <div className="flex min-h-dvh flex-col">
      {/* A hairline that fills as the interview advances. */}
      <div className="fixed inset-x-0 top-0 z-50 h-px bg-white/[0.04]">
        <div
          className="h-px bg-gradient-to-r from-royal/0 via-dusk to-royal transition-[width] duration-1000 ease-out"
          style={{
            width: `${progress * 100}%`,
            boxShadow: "0 0 12px rgba(99,102,241,0.6)",
          }}
        />
      </div>

      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-9">
        <div className="flex items-center gap-3">
          <Dot />
          <span className="text-[0.875rem] font-medium tracking-[-0.02em] text-whisper">
            SilentDate
          </span>
        </div>
        <Eyebrow>
          {finished
            ? "Se construiește clona"
            : `Întrebarea ${stepIndex + 1} / ${INTERVIEW_SCRIPT.length}`}
        </Eyebrow>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-end px-6 pb-10">
        <div className="space-y-5 py-6">
          {entries.map((entry) => (
            <div
              key={entry.key}
              className={cn(
                "flex animate-rise",
                entry.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-[1.5rem] px-6 py-4 text-[0.9375rem] leading-relaxed",
                  entry.role === "ai"
                    ? "border border-white/[0.05] bg-white/[0.02] text-silver backdrop-blur-md shadow-xl shadow-black/20"
                    : "border border-dusk/20 bg-dusk/[0.07] text-silver/90 backdrop-blur-md",
                )}
              >
                {entry.text}
              </div>
            </div>
          ))}

          {!finished && !inputReady ? (
            <div className="flex justify-start">
              <div className="rounded-full border border-white/[0.05] bg-white/[0.02] px-5 py-3.5 backdrop-blur-md">
                <Spinner />
              </div>
            </div>
          ) : null}

          {finished ? (
            <div className="flex flex-col items-center gap-6 py-16 text-center animate-rise">
              <Spinner />
              <p className="max-w-[34ch] text-[0.9375rem] leading-relaxed text-whisper">
                {submitting
                  ? "Citesc tot ce mi-ai spus și construiesc clona ta digitală. Durează câteva secunde."
                  : "Clona ta e gata."}
              </p>
            </div>
          ) : null}

          {/* Clears the sticky composer, so the newest bubble never lands
              underneath it. */}
          <div ref={bottomRef} className="h-20" />
        </div>
      </main>

      {/* ── Composer ───────────────────────────────────────────────────────── */}
      {!finished && step ? (
        <div
          className={cn(
            "sticky bottom-0 border-t border-white/[0.05] bg-void/70 backdrop-blur-md transition-opacity duration-700",
            inputReady ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <div className="mx-auto w-full max-w-2xl px-6 py-6">
            {step.kind === "choice" ? (
              <div className="flex flex-wrap gap-2.5">
                {step.options.map((option) => (
                  <Button
                    key={option.value}
                    variant="ghost"
                    onClick={() => commit(option.value, option.label)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            ) : step.kind === "photo" ? (
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (file.size > 8 * 1024 * 1024) {
                      setError("Fotografia depășește 8 MB.");
                      return;
                    }
                    setPhoto(file);
                    setError(null);
                    commit("da", "Am ales o fotografie");
                  }}
                />
                <Button onClick={() => fileInput.current?.click()}>
                  Alege o fotografie
                </Button>
                <Button
                  variant="quiet"
                  onClick={() => commit("nu", "Mai târziu")}
                >
                  Mai târziu
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-end gap-3">
                  {step.kind === "open" ? (
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          (event.metaKey || event.ctrlKey) &&
                          !validation
                        ) {
                          event.preventDefault();
                          commit(draft);
                        }
                      }}
                      rows={3}
                      placeholder={step.placeholder}
                      className="min-h-[7rem] w-full resize-none rounded-[1.5rem] border border-white/[0.05] bg-white/[0.02] px-6 py-4 text-[0.9375rem] leading-relaxed text-silver placeholder:text-ghost backdrop-blur-md transition-colors duration-500 focus:border-dusk/30"
                    />
                  ) : (
                    <input
                      value={draft}
                      inputMode={step.kind === "age" ? "numeric" : "text"}
                      onChange={(event) =>
                        setDraft(
                          step.kind === "age"
                            ? event.target.value.replace(/\D/g, "").slice(0, 3)
                            : event.target.value.slice(0, 24),
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !validation) {
                          event.preventDefault();
                          commit(draft);
                        }
                      }}
                      placeholder={step.placeholder}
                      className="w-full rounded-full border border-white/[0.05] bg-white/[0.02] px-6 py-4 text-[0.9375rem] text-silver placeholder:text-ghost backdrop-blur-md transition-colors duration-500 focus:border-dusk/30"
                    />
                  )}

                  <Button
                    onClick={() => commit(draft)}
                    disabled={Boolean(validation)}
                    className="shrink-0"
                  >
                    Trimite
                  </Button>
                </div>

                <div className="flex items-center justify-between px-2 text-[0.75rem] text-ghost">
                  <span>{validation ?? "Gata."}</span>
                  {step.kind === "open" ? (
                    <span className="font-mono">⌘ + ↵</span>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mx-auto w-full max-w-2xl px-6 pb-10">
          <p className="rounded-[1.25rem] border border-red-400/20 bg-red-400/[0.04] px-6 py-4 text-[0.8125rem] leading-relaxed text-red-200/80">
            {error}
          </p>
        </div>
      ) : null}
    </div>
  );
}
