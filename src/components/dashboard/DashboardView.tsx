"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ConnectionFound } from "@/components/dashboard/ConnectionFound";
import { ScoreMeter } from "@/components/dashboard/ScoreMeter";
import { SimulationCard } from "@/components/dashboard/SimulationCard";
import { TranscriptSheet } from "@/components/dashboard/TranscriptSheet";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dot, Eyebrow } from "@/components/ui/Eyebrow";
import { Spinner } from "@/components/ui/Spinner";
import { Surface } from "@/components/ui/Surface";
import { energyLabel } from "@/lib/labels";
import {
  CONNECTION_THRESHOLD,
  type Profile,
  type SimulationWithCounterpart,
} from "@/lib/types";

interface DashboardViewProps {
  me: Profile;
  items: SimulationWithCounterpart[];
}

export function DashboardView({ me, items }: DashboardViewProps) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const autoRan = useRef(false);

  const runMatchmaker = useCallback(async () => {
    setRunning(true);
    setNotice(null);
    try {
      const response = await fetch("/api/matchmaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 2 }),
      });
      const payload: unknown = await response.json().catch(() => null);
      const text =
        typeof payload === "object" && payload !== null
          ? ((payload as { message?: string; error?: string }).message ??
            (payload as { error?: string }).error ??
            null)
          : null;
      setNotice(text ?? "Simulările au fost rulate.");
      router.refresh();
    } catch {
      setNotice("Nu am putut contacta matchmaker-ul. Încearcă din nou.");
    } finally {
      setRunning(false);
    }
  }, [router]);

  // The first visit after onboarding should already feel alive.
  useEffect(() => {
    if (autoRan.current || items.length > 0) return;
    autoRan.current = true;
    void runMatchmaker();
  }, [items.length, runMatchmaker]);

  const connections = useMemo(
    () =>
      items.filter(
        (item) =>
          (item.simulation.compatibility_score ?? 0) >= CONNECTION_THRESHOLD,
      ),
    [items],
  );

  const best = useMemo(
    () =>
      items.reduce<number | null>(
        (max, item) =>
          Math.max(max ?? 0, item.simulation.compatibility_score ?? 0) || null,
        null,
      ),
    [items],
  );

  const openItem = items.find((item) => item.simulation.id === openId) ?? null;
  const headline = connections[0] ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-32 sm:px-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-center justify-between gap-4 py-10">
        <div className="flex items-center gap-3">
          <Dot />
          <span className="text-[0.9375rem] font-medium tracking-[-0.02em] text-silver">
            SilentDate
          </span>
          <span className="ml-2 rounded-full border border-white/[0.05] bg-white/[0.02] px-3.5 py-1 font-mono text-[0.6875rem] text-whisper backdrop-blur-md">
            {me.username}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {running ? (
            <span className="flex items-center gap-3 text-[0.8125rem] text-ghost">
              <Spinner />
              clonele discută
            </span>
          ) : null}
          <Button onClick={() => void runMatchmaker()} disabled={running}>
            Trezește clonele
          </Button>
        </div>
      </header>

      {/* ── The moment ─────────────────────────────────────────────────────── */}
      {headline ? (
        <section className="pb-16">
          <ConnectionFound
            item={headline}
            myInterests={me.interests}
            onReadTranscript={() => setOpenId(headline.simulation.id)}
          />
        </section>
      ) : null}

      {/* ── Asymmetric status row ──────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-5 pb-16 lg:grid-cols-12">
        <Surface className="p-9 lg:col-span-7">
          <Eyebrow>
            <Dot />
            Starea clonelor
          </Eyebrow>

          <h1 className="mt-7 max-w-[26ch] text-3xl font-medium leading-[1.1] tracking-[-0.035em] text-silver sm:text-[2.5rem]">
            {headline
              ? "Cineva te aștepta de partea cealaltă."
              : items.length > 0
                ? "Clonele tale au vorbit. Încă nimic peste prag."
                : "Clona ta e trează și caută în liniște."}
          </h1>

          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: "simulări", value: String(items.length) },
              {
                label: "cea mai bună",
                value: best !== null ? `${best}%` : "—",
              },
              { label: "conexiuni", value: String(connections.length) },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-mono text-2xl tracking-[-0.03em] text-silver">
                  {stat.value}
                </div>
                <div className="mt-2 text-[0.6875rem] uppercase tracking-[0.2em] text-ghost">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <ScoreMeter score={best} />
            <p className="mt-4 text-[0.75rem] text-ghost">
              Pragul de conexiune este {CONNECTION_THRESHOLD}%. Sub el, nimeni nu
              află de nimeni.
            </p>
          </div>
        </Surface>

        <Surface tone="inset" className="p-9 lg:col-span-5">
          <Eyebrow>Semnalele tale</Eyebrow>

          <div className="mt-8">
            <div className="flex items-baseline justify-between">
              <span className="text-[0.8125rem] text-ghost">ritm social</span>
              <span className="text-[0.8125rem] text-whisper">
                {energyLabel(me.introversion_score)}
              </span>
            </div>
            <div className="mt-4 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((level) => (
                <span
                  key={level}
                  className={
                    level <= me.introversion_score
                      ? "h-[3px] flex-1 rounded-full bg-dusk/70"
                      : "h-[3px] flex-1 rounded-full bg-white/[0.07]"
                  }
                />
              ))}
            </div>
          </div>

          {me.interests.length > 0 ? (
            <ul className="mt-9 flex flex-wrap gap-2">
              {me.interests.map((interest) => (
                <li
                  key={interest}
                  className="rounded-full border border-white/[0.05] bg-white/[0.02] px-3.5 py-1.5 text-[0.75rem] text-whisper"
                >
                  {interest}
                </li>
              ))}
            </ul>
          ) : null}

          {me.bio_summary ? (
            <>
              <div className="hairline my-8" />
              <p className="text-[0.875rem] leading-relaxed text-whisper">
                {me.bio_summary}
              </p>
            </>
          ) : null}
        </Surface>
      </section>

      {/* ── Simulations ────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between pb-8">
          <Eyebrow>Simulări</Eyebrow>
          {notice ? (
            <span className="text-[0.75rem] text-ghost">{notice}</span>
          ) : null}
        </div>

        {items.length === 0 ? (
          <Surface className="px-8 py-20 text-center">
            {running ? (
              <div className="flex flex-col items-center gap-6">
                <Spinner />
                <p className="max-w-[40ch] text-[0.9375rem] leading-relaxed text-whisper">
                  Clona ta discută chiar acum cu clonele oamenilor care au ritmul
                  tău. Durează câteva secunde.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-7">
                <p className="max-w-[44ch] text-[0.9375rem] leading-relaxed text-whisper">
                  Încă nu există nimeni cu ritmul tău. Clona ta rămâne de veghe și
                  încearcă din nou când apar oameni noi.
                </p>
                <Button onClick={() => void runMatchmaker()}>
                  Încearcă din nou
                </Button>
              </div>
            )}
          </Surface>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <SimulationCard
                key={item.simulation.id}
                item={item}
                myInterests={me.interests}
                onOpenTranscript={() => setOpenId(item.simulation.id)}
                style={{ animationDelay: `${index * 70}ms` }}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Open rooms ─────────────────────────────────────────────────────── */}
      {connections.length > 1 ? (
        <section className="pt-16">
          <Eyebrow>Camere deschise</Eyebrow>
          <div className="mt-8 flex flex-wrap gap-3">
            {connections.map((item) => (
              <ButtonLink
                key={item.simulation.id}
                href={`/chat/${item.simulation.id}`}
                variant="ghost"
              >
                Subiect {String(item.simulation.id).padStart(2, "0")} ·{" "}
                {item.simulation.compatibility_score}%
              </ButtonLink>
            ))}
          </div>
        </section>
      ) : null}

      {openItem?.simulation.simulation_transcript ? (
        <TranscriptSheet
          transcript={openItem.simulation.simulation_transcript}
          score={openItem.simulation.compatibility_score}
          myUsername={me.username}
          theirUsername={openItem.counterpart.username}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </div>
  );
}
