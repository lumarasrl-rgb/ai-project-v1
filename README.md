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
| **Fotografia care se limpezește** | Da, există fotografii — dar nimeni nu le vede de la început. La upload, poza e randată într-o scară de șase variante tot mai clare; camera primește doar varianta pe care numărul de mesaje a câștigat-o. Complet clară abia după 50 de mesaje. |

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
IP_HASH_SALT=<șir aleator>          # opțional local, obligatoriu în producție
```

> Atenție: Next.js nu suprascrie variabilele deja prezente în `process.env` cu
> cele din `.env.local`. Dacă rulezi într-un mediu care injectează propriile
> variabile, ele câștigă.

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
- **Realtime, cu plasă de siguranță.** Camera ascultă `INSERT`-urile pe `messages`
  prin Supabase Realtime, dar reconciliază și pe cronometru — la 20s cât socket-ul
  e sănătos, la 5s cât nu e. Un canal poate raporta `SUBSCRIBED` și totuși să nu
  livreze nimic (slot de replicare greșit configurat, socket căzut, tab adormit),
  iar o cameră care încremenește în tăcere e mai rea decât una cu câteva secunde
  întârziere. Indicatorul `live` / `sincronizare` arată care cale o duce.
- **Fotografia: blurul e în pixeli, nu în CSS.** La upload, `sharp` randează șase
  variante (sigma 24 → 14 → 8 → 4.5 → 2.2 → 0) și le urcă într-un bucket privat.
  Originalul nu se păstrează: cel mai clar fișier din bucket e exact ce vede
  cineva după 50 de mesaje. Imaginea se servește doar prin `/api/photo/[id]`,
  care verifică întâi că ești în cameră, numără mesajele și alege singur
  nivelul — clientul nu cere niciodată un nivel anume. O variantă mai clară nu e
  ascunsă în browser, pur și simplu nu e trimisă. Pașii sunt spațiați
  geometric, nu uniform: blurul se percepe logaritmic, iar o scară uniformă ar
  arăta identic pe primele patru trepte și ar sări brusc la final.
- **Limitarea cheltuielii AI.** Fiecare apel la Claude lasă un rând în `ai_usage`.
  Cum sesiunile anonime sunt gratuite și nelimitate, o cotă per utilizator n-ar fi
  nicio cotă — așa că se numără și per IP apelant, păstrat doar ca SHA-256 cu sare
  (`IP_HASH_SALT`), niciodată în clar. Plafoanele stau în funcția SQL
  `claim_ai_usage`, nu în aplicație: funcția e expusă prin PostgREST, deci
  apelantul nu trebuie să-și poată trimite propriul plafon. Implicit: 5 interviuri
  și 20 de simulări pe zi per utilizator, 25 și 100 per IP.

---

## 6. Scripturi

```bash
npm run dev         # development
npm run build       # build de producție
npm run start       # rulează build-ul
npm run typecheck   # tsc --noEmit
npm test            # testele logicii pure (node:test, fără dependențe)
```

Testele acoperă `matching.ts`, `unlocks.ts` și `transcript.ts` — adică
algoritmul de potrivire, Message Unlocker-ul și parsarea transcrierii venite de
la Claude. Rulează pe runner-ul din Node, fără framework instalat.

---

## 7. Deploy pe Vercel

1. **Supabase** (o dată): creează proiectul, rulează `supabase/schema.sql` în SQL
   Editor, apoi **Authentication → Providers → Anonymous sign-ins: enabled**.
   Fără pasul cu anonymous sign-ins nimic nu funcționează — nu există alt mod de
   autentificare în aplicație.
2. **Vercel → Add New → Project → Import Git Repository**, alege repo-ul. Nu
   schimba nimic la Build Command sau Output Directory; Next.js e detectat
   automat.
3. **Environment Variables** — toate patru, pe Production *și* Preview:

   | Variabilă | De unde |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | același loc, cheia `anon` |
   | `SUPABASE_SERVICE_ROLE_KEY` | același loc, cheia `service_role` |
   | `ANTHROPIC_API_KEY` | console.anthropic.com |

   Opțional: `IP_HASH_SALT`, un șir aleator. Fără el limitarea per-IP
   funcționează, dar hash-urile sunt ghicibile.
4. **Deploy.** Dacă vrei să pornești de pe branch-ul de dezvoltare în loc de
   `main`, pune-l ca Production Branch în Settings → Git.

Note care contează:

- `maxDuration` pe `/api/matchmaker` e **60**, plafonul planului Hobby. Peste
  atât, deploy-ul e respins. Pe Pro poți urca la 300 — util dacă vrei mai multe
  simulări per cerere.
- `sharp` e dependență normală, Vercel o compilează singur. Nu e nevoie de
  configurare.
- `.env.local` e în `.gitignore`, deci nicio cheie nu ajunge în repo.

---

## 8. Ce a fost verificat și ce nu

Fluxul complet a fost rulat cap-coadă într-un browser, pe un stack local
(Postgres + GoTrue + PostgREST + Realtime): interviu → extracție → profil →
potrivire → simulări salvate → ecranul de conexiune → cameră → indiciu deblocat
la al zecelea mesaj → mesajul celuilalt ajuns în pagina deschisă fără reload.
Schema, politicile RLS și cheile externe sunt verificate pe Postgres real.

**Nu a fost verificată calitatea răspunsurilor lui Claude.** Rularea s-a făcut cu
un server-mock pus pe `ANTHROPIC_BASE_URL`, deci codul rutelor, validarea zod și
scrierile în bază sunt reale, dar scorurile și transcrierile au fost fabricate.
Cât de bine extrage Claude interesele și cât de credibile sunt simulările rămâne
de văzut la prima rulare cu o cheie adevărată.
