import { GENDERS, LOOKING_FOR } from "@/lib/types";

/**
 * The onboarding interview. A fixed, carefully written sequence — no latency,
 * no small talk, no surprises. Everything the user types in the `open` steps
 * becomes `profiles.raw_interview`, which Claude then reads once.
 */

interface BaseStep {
  id: string;
  /** What the AI says, split into bubbles that fade in one after another. */
  says: readonly string[];
}

export interface OpenStep extends BaseStep {
  kind: "open";
  placeholder: string;
  minLength: number;
  /** Included verbatim in the transcript handed to Claude. */
  transcriptLabel: string;
}

export interface ChoiceStep extends BaseStep {
  kind: "choice";
  field: "gender" | "looking_for";
  options: readonly { value: string; label: string }[];
}

export interface HandleStep extends BaseStep {
  kind: "handle";
  placeholder: string;
}

export interface AgeStep extends BaseStep {
  kind: "age";
  placeholder: string;
}

export type InterviewStep = OpenStep | ChoiceStep | HandleStep | AgeStep;

const GENDER_LABELS: Record<(typeof GENDERS)[number], string> = {
  female: "Femeie",
  male: "Bărbat",
  non_binary: "Non-binar",
  other: "Altfel",
};

const LOOKING_FOR_LABELS: Record<(typeof LOOKING_FOR)[number], string> = {
  female: "Femei",
  male: "Bărbați",
  non_binary: "Persoane non-binare",
  everyone: "Nu contează",
};

export const INTERVIEW_SCRIPT: readonly InterviewStep[] = [
  {
    kind: "handle",
    id: "username",
    says: [
      "Bun venit. Eu sunt vocea care stă între tine și restul platformei.",
      "Nu vei încărca nicio fotografie și nu vei da niciodată swipe. Vorbesc eu în numele tău, iar tu apari doar atunci când merită.",
      "Cum vrei să te numesc? Un pseudonim e perfect.",
    ],
    placeholder: "ex. nocturn",
  },
  {
    kind: "age",
    id: "age",
    says: ["Câți ani ai?"],
    placeholder: "ex. 29",
  },
  {
    kind: "choice",
    id: "gender",
    field: "gender",
    says: ["Cum te identifici?"],
    options: GENDERS.map((value) => ({ value, label: GENDER_LABELS[value] })),
  },
  {
    kind: "choice",
    id: "looking_for",
    field: "looking_for",
    says: ["Și pe cine ai vrea să cunoști?"],
    options: LOOKING_FOR.map((value) => ({
      value,
      label: LOOKING_FOR_LABELS[value],
    })),
  },
  {
    kind: "open",
    id: "recharge",
    transcriptLabel: "Cum se reîncarcă după o zi grea",
    says: [
      "Acum partea care contează. Scrie cât vrei — nimeni în afară de mine nu citește aceste rânduri.",
      "Descrie-mi o seară în care te-ai simțit complet reîncărcat. Ce făceai, unde erai, cât de multă liniște era în jur?",
    ],
    placeholder: "Scrie liber. Nu există răspuns greșit.",
    minLength: 40,
  },
  {
    kind: "open",
    id: "obsession",
    transcriptLabel: "Subiectul despre care poate vorbi ore întregi",
    says: [
      "Există un subiect despre care ai putea vorbi ore în șir, dacă cineva te-ar întreba cu adevărat.",
      "Care e?",
    ],
    placeholder: "Un film, un oraș, o teorie, un instrument, un algoritm...",
    minLength: 30,
  },
  {
    kind: "open",
    id: "social-cost",
    transcriptLabel: "Ce îl obosește social",
    says: [
      "Ce anume te obosește cel mai repede când ești între oameni?",
    ],
    placeholder: "Zgomotul, grupurile mari, întrebările de complezență...",
    minLength: 30,
  },
  {
    kind: "open",
    id: "rhythm",
    transcriptLabel: "Ritmul ideal al unei cunoștințe noi",
    says: [
      "Cum arată ritmul ideal pentru tine, când cunoști pe cineva nou?",
      "Mesaje lungi și rare? Conversații dense noaptea? Luni de tăcere confortabilă?",
    ],
    placeholder: "Descrie ritmul în care te simți în siguranță.",
    minLength: 30,
  },
  {
    kind: "open",
    id: "unsaid",
    transcriptLabel: "Ce nu spune niciodată la prima întâlnire",
    says: [
      "Ultima întrebare, și e cea mai grea.",
      "Ce ai vrea ca cineva să știe despre tine, dar nu reușești niciodată să spui în primele întâlniri?",
    ],
    placeholder: "Spune-mi aici. Eu îl voi spune pentru tine, la momentul potrivit.",
    minLength: 40,
  },
];

export const OPEN_STEPS: readonly OpenStep[] = INTERVIEW_SCRIPT.filter(
  (step): step is OpenStep => step.kind === "open",
);

/** Builds `profiles.raw_interview` from the answers to the open questions. */
export function buildTranscript(answers: Readonly<Record<string, string>>): string {
  return OPEN_STEPS.map((step) => {
    const answer = answers[step.id]?.trim() ?? "";
    return `${step.transcriptLabel}:\n${answer}`;
  }).join("\n\n");
}
