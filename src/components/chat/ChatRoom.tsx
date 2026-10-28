"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { RevealCard } from "@/components/chat/RevealCard";
import { UnlockProgress } from "@/components/chat/UnlockProgress";
import { Button } from "@/components/ui/Button";
import { Dot } from "@/components/ui/Eyebrow";
import { cn } from "@/lib/cn";
import { subjectLabel } from "@/lib/labels";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";
import {
  REVEALS,
  type Reveal,
  type RevealSource,
  unlockedReveals,
} from "@/lib/unlocks";

interface ChatRoomProps {
  simulationId: number;
  myId: string;
  compatibilityScore: number | null;
  counterpart: RevealSource;
  initialMessages: Message[];
}

type TimelineItem =
  | { kind: "message"; message: Message }
  | { kind: "reveal"; reveal: Reveal };

const MAX_LENGTH = 1200;

export function ChatRoom({
  simulationId,
  myId,
  compatibilityScore,
  counterpart,
  initialMessages,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const addMessage = useCallback((incoming: Message) => {
    setMessages((previous) =>
      previous.some((message) => message.id === incoming.id)
        ? previous
        : [...previous, incoming].sort(
            (a, b) =>
              Date.parse(a.created_at) - Date.parse(b.created_at) || a.id - b.id,
          ),
    );
  }, []);

  // Live thread.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`room:${simulationId}`)
      .on<Message>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `simulation_id=eq.${simulationId}`,
        },
        (payload) => addMessage(payload.new),
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      setLive(false);
      void supabase.removeChannel(channel);
    };
  }, [addMessage, simulationId]);

  /**
   * Safety net. A room that silently stops updating is worse than a slow one,
   * and the realtime channel can report SUBSCRIBED while delivering nothing
   * (a misconfigured replication slot, a dropped socket, a sleeping tab). So
   * reconcile on a timer as well — often while the socket is down, rarely
   * while it is healthy. One indexed query against an id we already hold.
   */
  const latestId = useRef(0);
  latestId.current = messages.at(-1)?.id ?? 0;

  useEffect(() => {
    let cancelled = false;

    const reconcile = async () => {
      const { data } = await createClient()
        .from("messages")
        .select("*")
        .eq("simulation_id", simulationId)
        .gt("id", latestId.current)
        .order("created_at", { ascending: true });

      if (cancelled || !data) return;
      for (const message of data) addMessage(message);
    };

    const timer = setInterval(() => void reconcile(), live ? 20000 : 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [addMessage, live, simulationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (text.length === 0 || sending) return;

    setSending(true);
    setError(null);
    const supabase = createClient();

    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({ simulation_id: simulationId, sender_id: myId, text })
      .select()
      .single();

    if (insertError || !data) {
      setError("Mesajul nu a putut fi trimis.");
    } else {
      setDraft("");
      addMessage(data);
    }
    setSending(false);
  }, [addMessage, draft, myId, sending, simulationId]);

  const reveals = useMemo(
    () => unlockedReveals(messages.length, counterpart),
    [counterpart, messages.length],
  );

  /** Messages, with each reveal slotted in where it was earned. */
  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    messages.forEach((message, index) => {
      items.push({ kind: "message", message });
      const reveal = reveals.find((candidate) => candidate.at === index + 1);
      if (reveal) items.push({ kind: "reveal", reveal });
    });
    return items;
  }, [messages, reveals]);

  return (
    <div className="flex min-h-dvh flex-col">
      <UnlockProgress messageCount={messages.length} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="mx-auto w-full max-w-3xl px-6 pb-6 pt-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-[0.75rem] text-ghost transition-colors duration-500 hover:text-whisper"
            >
              <span aria-hidden>←</span> panoul
            </Link>
            <h1 className="mt-4 flex items-center gap-3 text-2xl font-medium tracking-[-0.03em] text-silver">
              <Dot />
              {subjectLabel(simulationId)}
            </h1>
          </div>
          {compatibilityScore !== null ? (
            <div className="text-right">
              <div className="font-mono text-lg text-silver">
                {compatibilityScore}%
              </div>
              <div className="text-[0.625rem] uppercase tracking-[0.22em] text-ghost">
                afinitate
              </div>
            </div>
          ) : null}
        </div>

        <div className="hairline mt-7" />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[0.8125rem] leading-relaxed text-ghost">
            Camera e anonimă. La fiecare 10 mesaje se deblochează un fragment din
            celălalt — {reveals.length}/{REVEALS.length} până acum.
          </p>
          <span
            className="flex shrink-0 items-center gap-2 text-[0.625rem] uppercase tracking-[0.22em] text-ghost"
            title={
              live
                ? "Mesajele sosesc instant."
                : "Conexiunea live lipsește; camera se sincronizează periodic."
            }
          >
            <span
              aria-hidden
              className={cn(
                "size-[5px] rounded-full",
                live ? "bg-dusk animate-breathe" : "bg-silver/25",
              )}
            />
            {live ? "live" : "sincronizare"}
          </span>
        </div>
      </header>

      {/* ── Thread ─────────────────────────────────────────────────────────── */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-end px-6">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-24 text-center">
            <p className="max-w-[42ch] text-[0.9375rem] leading-relaxed text-whisper">
              Clonele voastre au spart deja gheața. Nu mai e nevoie de „salut".
            </p>
            <p className="max-w-[42ch] text-[0.8125rem] leading-relaxed text-ghost">
              Începe din mijlocul conversației.
            </p>
          </div>
        ) : null}

        <div className="space-y-4 py-4">
          {timeline.map((item) =>
            item.kind === "reveal" ? (
              <RevealCard
                key={`reveal-${item.reveal.field}`}
                reveal={item.reveal}
              />
            ) : (
              <div
                key={item.message.id}
                className={cn(
                  "flex animate-settle",
                  item.message.sender_id === myId
                    ? "justify-end"
                    : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[78%] rounded-[1.5rem] px-6 py-4 text-[0.9375rem] leading-relaxed backdrop-blur-md",
                    item.message.sender_id === myId
                      ? "border border-dusk/20 bg-dusk/[0.07] text-silver/90"
                      : "border border-white/[0.05] bg-white/[0.02] text-silver shadow-xl shadow-black/20",
                  )}
                >
                  {item.message.text}
                </div>
              </div>
            ),
          )}
          {/* The composer is sticky, so scrolling to the end would otherwise
              park the last message underneath it. This spacer is what the
              scroll lands on instead. */}
          <div ref={bottomRef} className="h-24" />
        </div>
      </main>

      {/* ── Composer ───────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 border-t border-white/[0.05] bg-void/70 backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl px-6 py-6">
          <div className="flex items-end gap-3">
            <textarea
              value={draft}
              onChange={(event) =>
                setDraft(event.target.value.slice(0, MAX_LENGTH))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              rows={1}
              placeholder="Scrie fără grabă."
              className="min-h-[3.5rem] w-full resize-none rounded-[1.75rem] border border-white/[0.05] bg-white/[0.02] px-6 py-4 text-[0.9375rem] leading-relaxed text-silver placeholder:text-ghost backdrop-blur-md transition-colors duration-500 focus:border-dusk/30"
            />
            <Button
              onClick={() => void send()}
              disabled={sending || draft.trim().length === 0}
              className="shrink-0"
            >
              Trimite
            </Button>
          </div>

          <div className="flex items-center justify-between px-2 pt-3 text-[0.6875rem] text-ghost">
            <span>{error ?? `${messages.length} mesaje în această cameră`}</span>
            <span className="font-mono">↵</span>
          </div>
        </div>
      </div>
    </div>
  );
}
