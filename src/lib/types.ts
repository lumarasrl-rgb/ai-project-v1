/**
 * Domain model for SilentDate, mirrored 1:1 with `supabase/schema.sql`.
 */

export const GENDERS = ["female", "male", "non_binary", "other"] as const;
export type Gender = (typeof GENDERS)[number];

export const LOOKING_FOR = ["female", "male", "non_binary", "everyone"] as const;
export type LookingFor = (typeof LOOKING_FOR)[number];

export const SIMULATION_STATUSES = [
  "pending",
  "simulating",
  "completed",
  "connected",
  "archived",
] as const;
export type SimulationStatus = (typeof SIMULATION_STATUSES)[number];

/** Above this score the two clones got along well enough to open a real room. */
export const CONNECTION_THRESHOLD = 85;

export type Profile = {
  id: string;
  username: string;
  age: number;
  gender: Gender;
  looking_for: LookingFor;
  interests: string[];
  introversion_score: number;
  bio_summary: string | null;
  raw_interview: string | null;
  /** Folder in the private `faces` bucket holding the blur ladder. */
  photo_path: string | null;
  created_at: string;
};

export type AiSimulation = {
  id: number;
  user_one: string;
  user_two: string;
  compatibility_score: number | null;
  simulation_transcript: string | null;
  status: SimulationStatus;
  created_at: string;
};

export type Message = {
  id: number;
  simulation_id: number;
  sender_id: string;
  text: string;
  created_at: string;
};

/** One row per Claude call, used to cap spend. See `lib/rate-limit.ts`. */
export type AiUsage = {
  id: number;
  user_id: string;
  kind: "interview" | "simulation";
  ip_hash: string | null;
  created_at: string;
};

/** A simulation as the dashboard sees it: paired with the other person's profile. */
export interface SimulationWithCounterpart {
  simulation: AiSimulation;
  counterpart: Pick<
    Profile,
    "id" | "username" | "age" | "interests" | "introversion_score" | "bio_summary"
  >;
}

export interface InterviewTurn {
  role: "assistant" | "user";
  content: string;
}

/* ────────────────────────────────────────────────────────────────────────────────
   Supabase generic — gives every query full type inference, no `any` anywhere.
   ──────────────────────────────────────────────────────────────────────────────── */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<
          Profile,
          "created_at" | "bio_summary" | "raw_interview" | "photo_path"
        > & {
          created_at?: string;
          bio_summary?: string | null;
          raw_interview?: string | null;
          photo_path?: string | null;
        };
        Update: Partial<Omit<Profile, "id">>;
        Relationships: [];
      };
      ai_simulations: {
        Row: AiSimulation;
        Insert: Omit<AiSimulation, "id" | "created_at" | "status"> & {
          status?: SimulationStatus;
          created_at?: string;
        };
        Update: Partial<Omit<AiSimulation, "id">>;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, "id" | "created_at"> & { created_at?: string };
        Update: Partial<Omit<Message, "id">>;
        Relationships: [];
      };
      ai_usage: {
        Row: AiUsage;
        Insert: Omit<AiUsage, "id" | "created_at"> & { created_at?: string };
        Update: Partial<Omit<AiUsage, "id">>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_simulation_participant: {
        Args: { target_simulation: number };
        Returns: boolean;
      };
      claim_ai_usage: {
        Args: { p_kind: string; p_ip_hash: string };
        Returns: boolean;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
