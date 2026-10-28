"use client";

import { useEffect } from "react";

import { Aurora } from "@/components/ui/Aurora";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dot, Eyebrow } from "@/components/ui/Eyebrow";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[silentdate] unhandled error", error);
  }, [error]);

  return (
    <>
      <Aurora />
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-6 py-24">
        <div className="animate-rise">
          <Eyebrow>
            <Dot />
            Ceva s-a întrerupt
          </Eyebrow>

          <h1 className="mt-8 text-4xl font-medium leading-[1.05] tracking-[-0.035em] text-silver sm:text-5xl">
            Liniște, dar nu cea bună.
          </h1>

          <p className="mt-7 max-w-[44ch] text-[0.9375rem] leading-relaxed text-whisper">
            A apărut o eroare neașteptată. Nimic din ce ai scris nu s-a pierdut —
            încearcă din nou.
          </p>

          {error.digest ? (
            <p className="mt-6 font-mono text-[0.75rem] text-ghost">
              referință: {error.digest}
            </p>
          ) : null}

          <div className="mt-12 flex flex-wrap items-center gap-3">
            <Button onClick={reset}>Încearcă din nou</Button>
            <ButtonLink href="/dashboard" variant="ghost">
              Înapoi la panou
            </ButtonLink>
          </div>
        </div>
      </main>
    </>
  );
}
