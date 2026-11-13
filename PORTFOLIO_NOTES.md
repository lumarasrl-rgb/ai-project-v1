# Portfolio notes — five delivered sites

Captured on 2026-11-13 with headless Chromium (Playwright). Desktop viewport 1440×900,
mobile viewport 390×844 @2x. Every statement below comes from a page that was actually
loaded in this session; nothing is drawn from memory or from search. Where something
could not be established from the page, it says so.

**Capture caveats (environment, not the sites):**

- This container's network policy allows only the five site hosts. Third-party assets are
  therefore blocked. On `racingandargroup.ro` all 9 car photos come from `cdn.sanity.io`
  and failed with `ERR_TUNNEL_CONNECTION_FAILED`, so both Racing Andar screenshots show the
  layout with empty image slots. On `loveandcareretreat.com`, `assets.calendly.com` was
  blocked, so the embedded Calendly widget did not render. Embedded maps (OpenStreetMap,
  Google Maps) were blocked for the same reason, though the `<iframe>` elements are present
  in the markup.
- `racingandargroup.ro` served a bot-verification interstitial ("Please wait while your
  request is being verified…") on the first desktop request. The page was re-requested and
  captured normally on the second attempt.
- Figures such as stock counts or service counts are quoted as the page presents them.
  They have not been independently verified.

---

## 1. AUTOASH — https://autoash.ro

**Brand name as written:** `AUTOASH` in the header wordmark (set as "AUTO" + "ASH", the second
half in orange). `og:site_name` is `AUTOASH`; the page title is "AUTOASH Buftea — Mașini rulate
verificate, rate cu buletinul". The building signage in the hero photo reads "AutoAsh".

**What the business does:** Used-car dealership ("parc auto"). The hero kicker reads
`PARC AUTO · BUFTEA, ILFOV`; the contact page gives the address as "Șos. București–Târgoviște 24A,
Buciumeni", at the edge of Buftea, Ilfov county, Romania. It sells used cars, offers financing
("Rate cu buletinul. Fără adeverință de venit.", "0% avans", "Garanție 12 luni"), and also buys
cars from the public ("Cumpărăm auto") and sources cars to order.

**Main navigation (verbatim, header):**
`Mașini disponibile` · `În curând pe stoc` · `Blog` · `Finanțare` · `Cumpărăm auto` ·
`Despre noi` · `Contact` · `0724 310 753`

**Features — evidence seen:**

| Feature | Evidence |
| --- | --- |
| Online booking / appointment form | No. No booking flow found. The contact page states "Poți veni fără programare". |
| Contact form | No. Neither the homepage nor `/contact` has a form; contact is by phone, WhatsApp and email (`info@autoash.ro`). |
| Online shop / cart | No. |
| Price list | No price-list page. Prices are per car; the hero states "Prețuri de la 3.990 €" and the stock filter offers max-price brackets (5.000 € … 20.000 €). |
| Gallery | No standalone gallery page. Photos are per car; an H2 reads "Fiecare mașină, fotografiată exact așa cum arată." |
| Stock / product listing | Yes. `/masini` lists available cars with a filter form (Marcă, Model, Combustibil, Transmisie, An de fabricație minim, Preț maxim, submit "Caută în stoc"). `/in-curand` lists cars arriving soon. Individual car pages exist, e.g. `/masini/audi-a4-avant-2-0-tdi-136-cp-2020`. |
| Language switcher | No. |
| WhatsApp button | Yes. Several pre-filled `wa.me/40724310753` links (financing, selling a car, requesting a model), plus a sticky WhatsApp button on desktop and a fixed bottom bar on mobile ("Sună / WhatsApp / Credit"). |
| Embedded map | Yes, on `/contact` — an OpenStreetMap `<iframe>`. |
| Blog | Yes. `Blog` is in the main navigation (`/blog`). |
| Newsletter signup | No. |

Also present: links to Instagram, TikTok, Facebook and YouTube, and a Google-reviews summary
block ("4,5 din 5 · 30 recenzii Google").

**Language(s):** Romanian only (`<html lang="ro">`).

**Visual style:** Dark hero over a full-bleed photograph of the car lot, with a light
(cream, `rgb(246,244,241)`) body below. Accent colour is a strong orange. Type is Inter /
Inter Tight, the H1 set large (≈74 px) and semi-bold with tight tracking. Photography-heavy
above the fold, shifting to dense data and type lower down.

**Main headline (exact):** "Mașina potrivită, verificată înainte să întrebi."
Sub-headline: "Mașini rulate atent selecționate, verificate înainte să ajungă în parc. Poți duce
oricare la un service autorizat înainte să cumperi."

**Single- or multi-page:** Multi-page. At least 8 distinct top-level routes observed
(`/`, `/masini`, `/in-curand`, `/blog`, `/credit`, `/cumparam-auto`, `/despre`, `/contact`),
plus per-car detail pages, `/politica-de-confidentialitate` and `/lumara-studio`.

**Weight:** The heaviest of the five as captured — about 2.5 MB over 46 requests on desktop,
3.5 s to load event, driven by the large hero photograph.

---

## 2. Racing Andar Group — https://racingandargroup.ro

**Brand name as written:** `RACING ANDAR GROUP`, set in the header as "RACING ANDAR" above
"GROUP" with an orange rule to the left. `og:site_name` is `Racing Andar Group`.

**What the business does:** Used-vehicle dealership covering both passenger cars and commercial
vans. The hero kicker reads `SECTORUL 2, BUCURESTI`; the body text places it on "Șoseaua
Colentina, Sectorul 2", Bucharest, Romania. The page states "41 unități în stoc în Colentina —
autoturisme și utilitare" and describes two parks under one roof ("30 UNITĂȚI Autoturisme",
"11 UNITĂȚI Vehicule utilitare"). It also offers financing and buys cars ("Vinde mașina").

**Main navigation (verbatim, header):**
`Inventar` · `Utilitare` · `Finanțare` · `Vinde mașina` · `Despre noi` · `Contact` · `0722 722 470`

**Features — evidence seen:**

| Feature | Evidence |
| --- | --- |
| Online booking / appointment form | Partly. No calendar booking, but the `/contact` form's subject dropdown includes "Programare test drive", and the page says "Îți confirmăm disponibilitatea și programăm vizionarea." |
| Contact form | Yes, on `/contact`: subject select, name, phone, email, message, consent checkbox, submit labelled "Trimite pe WhatsApp". |
| Online shop / cart | No. |
| Price list | No price-list page. Prices are per unit in EUR (e.g. "18.900 EUR", net prices where "TVA DEDUCTIBIL"), with a monthly-rate estimate "de la 390 €/lună*" and a "Calculează rata" calculator. A footnote states the estimate assumes 60 months, no deposit, 9% indicative interest. |
| Gallery | Per-unit photo galleries rather than a gallery page. A stat block reads "FOTOGRAFII ÎN FIȘE 1601". |
| Stock / product listing | Yes. `/inventar` lists the full stock with filters (segment, brand, budget, year, mileage, fuel, transmission) and a homepage search box ("Caută: BMW X3, Crafter, Passat…"). Per-unit pages exist, e.g. `/inventar/mercedes-benz-glc-250-d-4matic-2017-…`. |
| Language switcher | No. |
| WhatsApp button | Yes. `wa.me/40722722470` and `wa.me/40768034365`, including a pre-filled enquiry link. |
| Embedded map | Yes — an OpenStreetMap `<iframe>` on both the homepage and `/contact`. |
| Blog | No. |
| Newsletter signup | No. |

**Language(s):** Romanian only (`<html lang="ro">`).

**Visual style:** Light shell (cream `rgb(243,241,237)` header and page) wrapped around a
near-black hero and footer (`rgb(14,15,17)`); accent colour is orange-red. Headings are Archivo,
set very large (88 px) and bold, with monospaced-feeling uppercase micro-labels ("01 — ALEGE
DIRECȚIA", "ADĂUGAT ACUM 22 ZILE"); body text is Instrument Sans. Strongly type- and data-led —
numeric stat rows, spec tables, numbered sections — rather than photography-led.

**Main headline (exact):** "Fiecare mașină, cu fișa pe masă."
Sub-headline: "41 unități în stoc în Colentina — autoturisme și utilitare. Specificații complete,
kilometraj, dotări și galerie foto pentru fiecare, înainte să ne vizitezi."

**Single- or multi-page:** Multi-page. At least 6 top-level routes (`/`, `/inventar`,
`/finantare`, `/vinde-masina`, `/despre-noi`, `/contact`), plus per-unit detail pages and three
legal pages (`/politica-de-confidentialitate`, `/politica-cookie`, `/termeni-si-conditii`).

**Weight:** About 560 KB over 40 requests with the car photography blocked, so the real page is
heavier than measured here. The first desktop request was delayed by the bot-verification
interstitial described above.

---

## 3. Love & Care Retreat — https://loveandcareretreat.com

**Brand name as written:** `Love & Care Retreat`, with the standing line underneath
"Vindecare Anxietate + Wellness pentru Femei" and a circular "L" monogram mark.

**What the business does:** One-to-one emotional-wellbeing and anxiety work for women, run by a
practitioner named Daniela (the `/about` page is titled "Despre Daniela"). The hero text reads:
"Ajut femeile să se vindece de suprasolicitare mentală, anxietate, copleșire emoțională, stres și
burnout — prin yoga, masaj terapeutic, theta healing, retreaturi și sprijin emoțional." A line
under the hero states "SESIUNI ÎN ROMÂNĂ ȘI ENGLEZĂ · ONLINE ȘI ÎN PERSOANĂ". A testimonial is
attributed to "— ANA, BUCHAREST"; no company address is given on the homepage, so the city of
operation is **nu se poate determina din pagină**.

**Main navigation (verbatim, header):**
`ACASĂ` · `DESPRE` · `SERVICII` · `GHID GRATUIT` · `CONTACT` · `RO` / `EN` ·
`PROGRAMEAZĂ O SESIUNE →`

**Features — evidence seen:**

| Feature | Evidence |
| --- | --- |
| Online booking / appointment form | Yes. A "DESCHIDE CALENDLY →" link, an `assets.calendly.com` request, a section headed "Alege o oră care simți că e potrivită.", and on `/contact` the offer to "rezervă un apel gratuit de 30 de minute". The widget itself was blocked in this environment. |
| Contact form | Yes, on `/contact`: name, email, phone/WhatsApp (optional), a service select, message, submit "TRIMITE MESAJUL →". |
| Online shop / cart | No cart. Services are priced but there is no checkout. |
| Price list | Yes, as priced offers listed in the footer and in the `/contact` select: "Yoga 60 min pentru Anxietate (60 €)", "Reset Emoțional 3 Sesiuni (199 €)", "Suport VIP Lunar (399 €)", "Retreat Privat de Vindecare (999 €)", "Anxiety Reset Bundle (222 €)". |
| Gallery | No gallery page. An Instagram-feed section appears near the foot ("VEZI MAI MULTE PE INSTAGRAM→"). |
| Stock / product listing | No. |
| Language switcher | Yes — a `RO` / `EN` toggle in the header, with `RO` active. A stat tile reads "RO · EN BILINGV". The English rendering of the site was not opened, so how much is translated is **nu se poate determina din pagină**. |
| WhatsApp button | Yes. A floating green WhatsApp button and `wa.me/40730894080` links, one pre-filled. |
| Embedded map | No. |
| Blog | No blog route. A section is headed "Devotamente zilnice, adevăruri blânde". |
| Newsletter signup | Yes. An email capture form on the homepage ("Email-ul tău" → "TRIMITE-MI GHIDUL →") tied to the free guide "Ghidul Calmării Anxietății într-un minut", and a second "ABONEAZĂ-TE →" email form on `/contact`. |

**Language(s):** Romanian is the default (`<html lang="ro">`) and all body copy observed is in
Romanian; a RO/EN switcher is present, and one pull-quote is in English ("I finally exhaled — for
the first time in years.").

**Visual style:** Light and warm — cream background (`rgb(250,246,240)`), warm brown text
(`rgb(61,47,38)`) and a dusty-rose accent used for buttons and italic display words. Headings are
Fraunces, a high-contrast serif, with the emphasised phrase set in italic; body is DM Sans.
Editorial and photography-led, with soft rounded image cards and generous whitespace.

**Main headline (exact):** "Lumea are nevoie de mai mult sentiment."
(The second line, "mai mult sentiment.", is set in rose italic.) Kicker above it:
"VINDECARE EMOȚIONALĂ · WELLNESS PENTRU SISTEM NERVOS".

**Single- or multi-page:** Multi-page — 5 pages: `/`, `/about`, `/offerings`, `/freebie`,
`/contact`. Note: requesting `/about`, `/offerings` and `/contact` directly by URL returned a
"This Page Does Not Exist" 404 in this environment, while navigating to the same routes by
clicking the menu loaded them correctly (e.g. `/about` → "Despre Daniela · Love & Care Retreat").
Whether that affects real visitors arriving on a deep link was not established here.

**Weight:** About 1.1 MB over 15 requests on desktop; loaded quickly (≈0.8 s to load event),
with roughly 30 images on the page, most of them lazy-loaded below the fold.

---

## 4. Cizmărie Expert — https://cizmarie-expert.vercel.app/

**Brand name as written:** `CIZMĂRIE EXPERT`, set in spaced serif capitals in the header.
`og:site_name` is `Cizmărie Expert`.

**What the business does:** A shoe-repair workshop (cizmărie) and leather-goods restorer. The
hero sub-line reads "Reparăm, restaurăm și redăm frumusețea încălțămintei și articolelor din
piele." The location given is "Bulevardul Corneliu Coposu nr. 4, București, România" — central
Bucharest. Listed services: `Reparații încălțăminte`, `Înlocuire tălpi`, `Schimbare flecuri`,
`Schimbare fermoare`, `Reparații genți`, `Recondiționare piele`. Opening hours on `/contact`:
"Luni – Vineri 08:30 – 17:30", lunch break "14:30 – 15:…".

**Main navigation (verbatim, header):**
`Acasă` · `Despre noi` · `Servicii` · `Galerie` · `Contact` · `Solicită o evaluare`

**Features — evidence seen:**

| Feature | Evidence |
| --- | --- |
| Online booking / appointment form | No appointment scheduling. Instead a quote-request flow: "Solicită o evaluare" / "Trimite fotografii pentru evaluare". |
| Contact form | Yes, and it is the most complete of the five: name, phone, email, product type select, service select, description textarea, **file upload** (for photographs of the item), consent checkbox, submit "Trimite solicitarea". Present on the homepage and on `/contact`. |
| Online shop / cart | No. |
| Price list | No prices shown anywhere on the pages loaded; pricing goes through the evaluation request. |
| Gallery | Yes. `/galerie` in the navigation, plus a before/after section headed "Înainte și după". |
| Stock / product listing | No. |
| Language switcher | No. |
| WhatsApp button | Yes. A labelled "Scrie-ne pe WhatsApp" button (floating, bottom right) and a pre-filled `wa.me/40727667039` link. |
| Embedded map | No `<iframe>` map; there is a "Vezi traseul în Google Maps" link instead. |
| Blog | No. There is an FAQ page, `/intrebari-frecvente` ("Întrebări frecvente"). |
| Newsletter signup | No. |

**Language(s):** Romanian only (`<html lang="ro">`).

**Visual style:** The darkest of the five above the fold — a full-bleed, warm-toned, low-key
photograph of boots and cobbler's tools, with cream text over it; below the fold the page turns
light (`rgb(245,241,233)`) with dark brown text and a tan/leather accent. The H1 is Cormorant
Garamond, a fine-stroked serif set very large (≈116 px); body text is Manrope. A dashed rule
under the headline carries the craft feel. Photography-heavy hero, calm and type-led below.

**Main headline (exact):** "Lucrurile de calitate merită o a doua viață."

**Single- or multi-page:** Multi-page. 5 nav routes (`/`, `/despre-noi`, `/servicii`, `/galerie`,
`/contact`) plus 6 individual service pages under `/servicii/…`, `/intrebari-frecvente`, and two
legal pages (`/confidentialitate`, `/cookies`) — at least 14 routes in total.

**Weight:** The lightest of the five as captured — about 330 KB over 35 requests, ≈1.1 s to load
event. Nothing slow was observed.

---

## 5. Salon Geo Gab — https://salon-geo-gab.vercel.app/

**Brand name as written:** `Salon Geo Gab` — "Salon" set small in red italic above "Geo Gab" in a
serif face, with the standing line `BEAUTY · WELLNESS · ESTETICĂ` beneath.

**What the business does:** A beauty salon on Șoseaua Colentina 15, Bucharest, sector 2, Romania,
open since 2003. The hero states: "Din 2003, pe Șoseaua Colentina. Coafor, cosmetică, proceduri
estetice, masaj, manichiură și tatuaj cosmetic — toate în același loc, lucrate de aceleași patru
mâini pricepute pe care le știi de ani de zile." Stat tiles read "Deschis din 2003 · 23 de ani",
"Servicii cu preț afișat 150", "Specialiste 4". Six service rooms are listed with counts and entry
prices: Coafor femei (45, de la 10 lei), Servicii cosmetice (34, de la 15 lei), Proceduri estetice
(21, de la 40 lei), Masaje și fizioterapie (19, de la 70 lei), Manichiură și pedichiură (26, de la
30 lei), Tatuaj și piercing (5, de la 100 lei).

**Main navigation (verbatim, header):**
`Acasă` · `Servicii` (with a dropdown listing the six categories and `Toată lista de prețuri`) ·
`Despre noi` · `Galerie` · `Oferte` · `Contact` · `Programează-te`

**Features — evidence seen:**

| Feature | Evidence |
| --- | --- |
| Online booking / appointment form | Yes, as a guided request rather than a live calendar. `/programare` is a four-step composer (choose room → choose service → optional specialist → preferred day/time, name, notes) that ends in "Trimite pe WhatsApp". The page states explicitly: "Salonul nu are rezervare automată. Butonul de mai jos deschide mesajul deja scris — ora se confirmă de către salon, prin telefon sau WhatsApp." |
| Contact form | Yes, on `/contact`: name (required), phone (optional), message (required), with the note "Completează și alege cum trimiți. Mesajul pleacă din WhatsApp-ul sau din aplicația ta de email". |
| Online shop / cart | No. |
| Price list | Yes, and it is a central feature. `/servicii` is titled "Servicii și prețuri" — "150 de servicii, în șase cabinete, fiecare cu prețul și durata scrise alături", with a per-category breakdown. The homepage states "Nimic nu se negociază la casă." and "Lista de prețuri e publică, pe fiecare serviciu, cu durata alături". |
| Gallery | Yes. `/galerie` in the navigation, with captioned images ("Trusa de coafor", "Coafat cu peria", "Raftul de culori", "Precizie pe sprâncene", "Cabinetul de tratamente"). |
| Stock / product listing | No. |
| Language switcher | No. |
| WhatsApp button | Yes. A WhatsApp icon button in the header, a fixed bottom bar on mobile (phone, WhatsApp, "Programează-te"), and a pre-filled `wa.me/40745280495` link. |
| Embedded map | Yes — a Google Maps `<iframe>` (`Șoseaua Colentina 15, București`) on the homepage and on `/contact`. |
| Blog | No blog. `/oferte` carries current offers and news ("Vezi toate noutățile", "NOUTATE ÎN SALON — Aparat profesional de presoterapie"). |
| Newsletter signup | No. |

Also present: a live open/closed indicator ("Închis acum · Vineri 08:00–20:00"), links to
Instagram and Facebook, and ANPC/SOL consumer-protection links in the footer.

**Language(s):** Romanian only (`<html lang="ro">`).

**Visual style:** Light throughout — warm off-white background (`rgb(246,241,232)`), near-black
text, and a deep red accent for buttons and figures. The H1 is Bodoni Moda, a high-contrast
didone serif (≈78 px, regular weight); body and labels are Archivo. A split hero pairs the
headline with a single documentary photograph of a treatment in progress. Balanced between
photography and type, with numerals used as a design element.

**Main headline (exact):** "Frumusețe, îngrijire și răsfăț complet"

**Single- or multi-page:** Multi-page. At least 14 routes: `/`, `/servicii` plus six
`/servicii/<categorie>` pages, `/despre`, `/galerie`, `/oferte`, `/contact`, `/programare`.

**Weight:** About 590 KB over 46 requests, ≈1.3 s to load event. Nothing slow was observed.

---

## Screenshot inventory

All files are JPEG, quality 82, viewport-only (not full page), captured after the network went
idle plus a 2.5 s settle. No cookie banner or blocking modal appeared on any of the five sites,
so none needed dismissing.

| File | Viewport | Size |
| --- | --- | --- |
| `public/lumara/work/autoash-desktop.jpg` | 1440×900 | 146 KB |
| `public/lumara/work/autoash-mobile.jpg` | 390×844 @2x (780×1688) | 161 KB |
| `public/lumara/work/racing-andar-desktop.jpg` | 1440×900 | 83 KB |
| `public/lumara/work/racing-andar-mobile.jpg` | 390×844 @2x (780×1688) | 102 KB |
| `public/lumara/work/love-and-care-desktop.jpg` | 1440×900 | 122 KB |
| `public/lumara/work/love-and-care-mobile.jpg` | 390×844 @2x (780×1688) | 110 KB |
| `public/lumara/work/cizmarie-expert-desktop.jpg` | 1440×900 | 147 KB |
| `public/lumara/work/cizmarie-expert-mobile.jpg` | 390×844 @2x (780×1688) | 112 KB |
| `public/lumara/work/salon-geo-gab-desktop.jpg` | 1440×900 | 114 KB |
| `public/lumara/work/salon-geo-gab-mobile.jpg` | 390×844 @2x (780×1688) | 110 KB |

No file exceeds 400 KB, so no re-encoding was needed.
