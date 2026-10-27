-- ═══════════════════════════════════════════════════════════════════════════════
--  SilentDate — Supabase / PostgreSQL initialisation
--  Run once in the Supabase SQL Editor (or `supabase db push`).
--  Idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────────
--  profiles — the only identity in SilentDate. No photos, ever.
-- ─────────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                  uuid        primary key references auth.users (id) on delete cascade,
  username            text        not null unique
                                  constraint profiles_username_length
                                  check (char_length(username) between 3 and 24),
  age                 int         not null
                                  constraint profiles_age_range check (age between 18 and 120),
  gender              text        not null
                                  constraint profiles_gender_allowed
                                  check (gender in ('female', 'male', 'non_binary', 'other')),
  looking_for         text        not null
                                  constraint profiles_looking_for_allowed
                                  check (looking_for in ('female', 'male', 'non_binary', 'everyone')),
  interests           text[]      not null default '{}',
  introversion_score  int         not null
                                  constraint profiles_introversion_range
                                  check (introversion_score between 1 and 5),
  bio_summary         text,
  raw_interview       text,
  created_at          timestamptz not null default now()
);

comment on table  public.profiles                    is 'Anonymous, photo-free user profiles.';
comment on column public.profiles.interests          is 'Keyword vector extracted from the interview by Claude.';
comment on column public.profiles.introversion_score is '1 = deeply introverted · 5 = socially energetic.';
comment on column public.profiles.bio_summary        is 'Short psychological portrait written by Claude.';
comment on column public.profiles.raw_interview      is 'Verbatim transcript of the onboarding interview.';

create index if not exists profiles_matching_idx
  on public.profiles (gender, looking_for, introversion_score);

create index if not exists profiles_interests_idx
  on public.profiles using gin (interests);

-- ─────────────────────────────────────────────────────────────────────────────────
--  ai_simulations — conversations between two users' digital clones
-- ─────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ai_simulations (
  id                    bigint generated always as identity primary key,
  user_one              uuid        not null references public.profiles (id) on delete cascade,
  user_two              uuid        not null references public.profiles (id) on delete cascade,
  compatibility_score   int
                                    constraint ai_simulations_score_range
                                    check (compatibility_score between 1 and 100),
  simulation_transcript text,
  status                text        not null default 'pending'
                                    constraint ai_simulations_status_allowed
                                    check (status in ('pending', 'simulating', 'completed', 'connected', 'archived')),
  created_at            timestamptz not null default now(),
  constraint ai_simulations_distinct_users check (user_one <> user_two)
);

comment on table  public.ai_simulations        is 'One AI-to-AI conversation per candidate pair.';
comment on column public.ai_simulations.status is 'pending → simulating → completed → connected (user opened the chat).';

-- A pair may only ever be simulated once, in either direction.
create unique index if not exists ai_simulations_pair_key
  on public.ai_simulations (
    least(user_one::text, user_two::text),
    greatest(user_one::text, user_two::text)
  );

create index if not exists ai_simulations_user_one_idx on public.ai_simulations (user_one, created_at desc);
create index if not exists ai_simulations_user_two_idx on public.ai_simulations (user_two, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────────
--  messages — the human conversation, unlocked once a simulation scores high
-- ─────────────────────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id            bigint generated always as identity primary key,
  simulation_id bigint      not null references public.ai_simulations (id) on delete cascade,
  sender_id     uuid        not null references public.profiles (id) on delete cascade,
  text          text        not null
                            constraint messages_text_not_blank check (char_length(btrim(text)) > 0),
  created_at    timestamptz not null default now()
);

create index if not exists messages_thread_idx on public.messages (simulation_id, created_at);

-- ─────────────────────────────────────────────────────────────────────────────────
--  Helper: is the current user a participant of a simulation?
-- ─────────────────────────────────────────────────────────────────────────────────
create or replace function public.is_simulation_participant(target_simulation bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.ai_simulations s
     where s.id = target_simulation
       and auth.uid() in (s.user_one, s.user_two)
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────────
--  Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.ai_simulations enable row level security;
alter table public.messages       enable row level security;

-- profiles: readable by any signed-in user (that is how matchmaking works —
-- there is nothing identifying in here), writable only by its owner.
drop policy if exists "profiles are readable by authenticated users" on public.profiles;
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "users insert their own profile" on public.profiles;
create policy "users insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ai_simulations: visible only to the two people it is about.
drop policy if exists "participants read their simulations" on public.ai_simulations;
create policy "participants read their simulations"
  on public.ai_simulations for select
  to authenticated
  using (auth.uid() in (user_one, user_two));

drop policy if exists "participants create their simulations" on public.ai_simulations;
create policy "participants create their simulations"
  on public.ai_simulations for insert
  to authenticated
  with check (auth.uid() in (user_one, user_two));

drop policy if exists "participants update their simulations" on public.ai_simulations;
create policy "participants update their simulations"
  on public.ai_simulations for update
  to authenticated
  using (auth.uid() in (user_one, user_two))
  with check (auth.uid() in (user_one, user_two));

-- messages: only the two participants, and you may only speak as yourself.
drop policy if exists "participants read thread messages" on public.messages;
create policy "participants read thread messages"
  on public.messages for select
  to authenticated
  using (public.is_simulation_participant(simulation_id));

drop policy if exists "participants send messages" on public.messages;
create policy "participants send messages"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_simulation_participant(simulation_id)
  );

-- ─────────────────────────────────────────────────────────────────────────────────
--  Realtime — the anonymous chat streams live
-- ─────────────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'ai_simulations'
  ) then
    alter publication supabase_realtime add table public.ai_simulations;
  end if;
end
$$;
