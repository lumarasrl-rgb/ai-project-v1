import { Aurora } from "@/components/ui/Aurora";
import { ButtonLink } from "@/components/ui/Button";
import { Dot, Eyebrow } from "@/components/ui/Eyebrow";
import { Surface } from "@/components/ui/Surface";
import { createServerSupabase } from "@/lib/supabase/server";

const PRINCIPLES = [
  {
    title: "Zero fotografii",
    body: "Nu există galerie, nu există filtru, nu există prima impresie vizuală. Nimeni nu te judecă după un cadru prost.",
  },
  {
    title: "Zero swiping",
    body: "Nu dai swipe. Clona ta digitală discută în locul tău cu clonele celorlalți, în liniște, în fundal.",
  },
  {
    title: "Zero small-talk",
    body: "Primele cinci replici sunt deja purtate. Tu intri în conversație exact în punctul în care devine interesantă.",
  },
] as const;

const STEPS = [
  {
    index: "01",
    title: "Interviul",
    body: "Un AI protector îți pune câteva întrebări profunde. Nu completezi niciun formular, nu bifezi hobby-uri dintr-o listă.",
  },
  {
    index: "02",
    title: "Simularea",
    body: "Claude construiește o clonă a personalității tale și o pune să vorbească cu clonele oamenilor care au ritmul tău.",
  },
  {
    index: "03",
    title: "Conexiunea",
    body: "Dacă două clone trec de 85% compatibilitate, se deschide o cameră anonimă. Detaliile despre celălalt apar treptat.",
  },
] as const;

export default async function LandingPage() {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();

  let hasProfile = false;
  if (auth.user) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", auth.user.id)
      .maybeSingle();
    hasProfile = Boolean(data);
  }

  return (
    <>
      <Aurora />

      <main className="mx-auto w-full max-w-6xl px-6 sm:px-10">
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between py-10">
          <div className="flex items-center gap-3">
            <Dot />
            <span className="text-[0.9375rem] font-medium tracking-[-0.02em] text-silver">
              SilentDate
            </span>
          </div>
          <nav className="flex items-center gap-2">
            {hasProfile ? (
              <ButtonLink href="/dashboard" variant="ghost">
                Panoul tău
              </ButtonLink>
            ) : (
              <ButtonLink href="/onboarding" variant="ghost">
                Începe
              </ButtonLink>
            )}
          </nav>
        </header>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 items-end gap-16 pb-32 pt-24 sm:pt-36 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-8 animate-rise">
            <Eyebrow>
              <Dot />
              Dating pentru introvertiți
            </Eyebrow>

            <h1 className="mt-8 max-w-[22ch] text-[2.75rem] font-medium leading-[1.02] text-silver sm:text-6xl lg:text-7xl">
              Vorbește AI-ul tău.
              <span className="block text-whisper">Tu apari mai târziu.</span>
            </h1>

            <p className="mt-10 max-w-[52ch] text-[1.0625rem] leading-relaxed text-whisper">
              SilentDate nu îți cere fotografii, nu îți cere să dai swipe și nu îți
              cere să deschizi conversații. Un intermediar AI poartă primele discuții
              în locul tău și te cheamă doar atunci când a găsit ceva real.
            </p>

            <div className="mt-12 flex flex-wrap items-center gap-4">
              <ButtonLink href={hasProfile ? "/dashboard" : "/onboarding"} size="lg">
                {hasProfile ? "Deschide panoul" : "Începe interviul"}
                <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">
                  →
                </span>
              </ButtonLink>
              <span className="text-[0.8125rem] text-ghost">
                Șapte întrebări. Fără cont, fără parolă, fără poze.
              </span>
            </div>
          </div>

          {/* Asymmetric counterweight: a fragment of a real simulation. */}
          <div className="lg:col-span-4">
            <Surface
              className="p-7 animate-settle"
              style={{ animationDelay: "0.25s" }}
            >
              <div className="flex items-center justify-between">
                <Eyebrow>Simulare</Eyebrow>
                <span className="font-mono text-[0.6875rem] text-dusk/80">
                  92%
                </span>
              </div>
              <div className="mt-6 space-y-4 text-[0.8125rem] leading-relaxed">
                <p className="text-whisper">
                  <span className="text-ghost">clona a · </span>
                  „Mi se pare că liniștea e singurul lux care nu se poate cumpăra."
                </p>
                <p className="text-whisper">
                  <span className="text-ghost">clona b · </span>
                  „Eu o cumpăr în fiecare dimineață, la 5:40, înainte să se trezească orașul."
                </p>
              </div>
              <div className="hairline my-6" />
              <p className="text-[0.75rem] leading-relaxed text-ghost">
                Două clone care au vorbit 5 replici înainte ca oamenii lor să afle
                unul de celălalt.
              </p>
            </Surface>
          </div>
        </section>

        {/* ── Principles ───────────────────────────────────────────────────── */}
        <section className="pb-32">
          <div className="hairline" />
          <div className="grid grid-cols-1 gap-x-10 gap-y-12 pt-14 sm:grid-cols-3">
            {PRINCIPLES.map((principle) => (
              <div key={principle.title}>
                <h2 className="text-[1.0625rem] font-medium text-silver">
                  {principle.title}
                </h2>
                <p className="mt-4 text-[0.875rem] leading-relaxed text-whisper">
                  {principle.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <section className="pb-36">
          <Eyebrow>Cum funcționează</Eyebrow>
          <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {STEPS.map((step, index) => (
              <Surface
                key={step.index}
                className="p-8 transition-colors duration-700 hover:border-white/[0.09]"
                glow={index === 2}
              >
                <span className="font-mono text-[0.6875rem] tracking-[0.2em] text-dusk/70">
                  {step.index}
                </span>
                <h3 className="mt-7 text-xl font-medium tracking-[-0.025em] text-silver">
                  {step.title}
                </h3>
                <p className="mt-4 text-[0.875rem] leading-relaxed text-whisper">
                  {step.body}
                </p>
              </Surface>
            ))}
          </div>
        </section>

        {/* ── Closing ──────────────────────────────────────────────────────── */}
        <section className="pb-40">
          <Surface className="overflow-hidden px-8 py-16 sm:px-16" glow>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-medium text-silver sm:text-[2.5rem]">
                Liniștea nu e un defect de personalitate.
              </h2>
              <p className="mx-auto mt-7 max-w-[46ch] text-[0.9375rem] leading-relaxed text-whisper">
                E doar un ritm diferit. SilentDate e construit în jurul lui.
              </p>
              <div className="mt-11 flex justify-center">
                <ButtonLink href={hasProfile ? "/dashboard" : "/onboarding"} size="lg">
                  {hasProfile ? "Deschide panoul" : "Începe interviul"}
                </ButtonLink>
              </div>
            </div>
          </Surface>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-14 sm:px-10">
        <div className="hairline" />
        <div className="flex flex-col items-start justify-between gap-3 pt-8 text-[0.75rem] text-ghost sm:flex-row sm:items-center">
          <span>SilentDate · fără poze, fără swiping, fără small-talk</span>
          <span className="font-mono">AI intermediat de Claude</span>
        </div>
      </footer>
    </>
  );
}
