# SilentDate

Dating pentru introvertiți. Fără fotografii de profil, fără swiping, fără small-talk.
Un intermediar AI (Claude) poartă primele conversații în locul tău și te cheamă doar
atunci când două clone digitale chiar s-au înțeles.

Next.js 15 (App Router) · TypeScript strict · Tailwind CSS v4 · Supabase · Claude (`claude-opus-5-5`).

---

## 1. Cum funcționează

| Etapă | Ce se întâmplă |
| --- | --- |
| **Interviu** | Un AI protector pune 9 întrebări într-un chat imersiv. Răspunsurile deschise devin `profiles.raw_interview`. |
| **Extracție** | `POST /api/interview` trimite transcrierea la Claude, care întoarce un vector de interese, un portret psihologic și un scor de introversie. |
| **Potrivire** | `POST /api/matchmaker` filtrează candidații (preferințe de gen reciproce + energie socială similară), apoi pune Claude să simuleze o discuție de exact 5 replici între cele două clone și să o noteze de la 1 la 100. |
| **Conexiune** | Peste **85%** se deschide ecranul „Conexiune Găsită" și o cameră de chat anonimă. |
| **Message Unlocker** | La fiecare 10 mesaje din cameră se deblochează un fragment din celălalt: ritm social → interese → portret → pseudonim → vârstă. |

---

## 2. Instalare

```bash
npm install
cp .env.local.example .env.local   # completează valorile
npm run dev
```

### Variabile de mediu

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
ANTHROPIC_API_KEY=sk-ant-...        # doar pe server, niciodată NEXT_PUBLIC_
```

### Supabase

1. Rulează `supabase/schema.sql` în SQL Editor. Scriptul creează tabelele, cheile
   externe, constrângerile de unicitate, politicile RLS și publicația Realtime.
   Este idempotent.
2. **Authentication → Providers → Anonymous sign-ins: enabled.** SilentDate nu
   colectează email și nu are parole — identitatea este o sesiune anonimă Supabase.

---

## 3. Structura

```
supabase/schema.sql              Schema completă: tabele, RLS, indecși, Realtime
src/
  app/
    page.tsx                     Landing
    onboarding/page.tsx          Interviul tip chat
    dashboard/page.tsx           Panoul anonim
    chat/[simulationId]/page.tsx Camera anonimă
    api/interview/route.ts       Claude → interese + bio_summary + scor
    api/matchmaker/route.ts      Filtrare + simulare AI-vs-AI + salvare
  components/
    ui/                          Aurora, Surface (glass), Button, Eyebrow, Spinner
    interview/InterviewChat.tsx  Chat-ul de onboarding
    dashboard/                   DashboardView, ConnectionFound, SimulationCard,
                                 ScoreMeter, TranscriptSheet
    chat/                        ChatRoom, UnlockProgress, RevealCard
  lib/
    ai/                          Clientul Anthropic + cele două operații AI
    supabase/                    Client browser / server (cookie-based)
    matching.ts                  Algoritmul de filtrare și ranking (funcții pure)
    unlocks.ts                   Message Unlocker
    interview-script.ts          Întrebările interviului
    transcript.ts                Parsarea transcrierii AI
    types.ts                     Modelul de domeniu + genericul `Database`
  middleware.ts                  Reîmprospătează sesiunea Supabase
```

---

## 4. Design

Fundal mat aproape negru (`#0A0A0C`), accente de violet amurg (`#6366F1`) și indigo
regal (`#4F46E5`), text argintiu (`#E2E8F0`). Toate suprafețele sunt sticlă mată:
`backdrop-blur-md bg-white/[0.02] border border-white/[0.05]`, colțuri de 1.75rem,
umbre stratificate. Butoanele nu au fundal plin — au un bloom radial indigo care
apare la hover, plus o scalare de 1.5%. Tipografia este Geist (sans + mono), cu
tracking negativ pe titluri și interliniație generoasă în corp.

Tokenii, animațiile (`rise`, `settle`, `breathe`, `drift`, `unveil`, `sweep`) și
utilitarele (`glass`, `hairline`) sunt definite în `src/app/globals.css` prin
`@theme` / `@utility` (Tailwind v4). Totul respectă `prefers-reduced-motion`.

---

## 5. Note de implementare

- **Fără `any`.** `Database` din `src/lib/types.ts` tipizează fiecare query Supabase.
- **Securitate.** Cheia Anthropic nu părăsește serverul. Toate citirile și scrierile
  trec prin RLS: profilurile sunt vizibile autentificaților (nu conțin nimic
  identificabil), simulările și mesajele doar participanților.
- **Structured outputs.** Ambele rute AI folosesc `client.beta.messages.parse()` cu
  `zodOutputFormat`, deci JSON-ul lui Claude este validat înainte să atingă baza de
  date. Este activat și fallback-ul server-side la refuz (`fallbacks: "default"`).
- **Perechi unice.** Un index unic pe `(least(user_one, user_two), greatest(...))`
  garantează că două persoane nu sunt simulate de două ori, nici în paralel.
  Matchmaker-ul rezervă perechea înainte de a chema Claude.
- **Interviul** este un scenariu fix (fără latență, fără cost de API). Claude
  intervine o singură dată, la final, ca să citească tot.
- **Message Unlocker** numără mesajele din cameră (ale amândurora), ca indiciile să
  se deblocheze simultan pentru cei doi.
- **Realtime.** Camera anonimă ascultă `INSERT`-urile pe `messages` prin Supabase
  Realtime; mesajele proprii sunt deduplicate după `id`.

---

## 6. Scripturi

```bash
npm run dev         # development
npm run build       # build de producție
npm run start       # rulează build-ul
npm run typecheck   # tsc --noEmit
```
