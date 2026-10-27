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
--  ai_usage — one row per Claude call, so nobody can drain the API budget
-- ─────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ai_usage (
  id         bigint generated always as identity primary key,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  kind       text        not null
                         constraint ai_usage_kind_allowed
                         check (kind in ('interview', 'simulation')),
  -- Salted SHA-256 of the caller's IP. Anonymous sign-in makes new identities
  -- free, so a per-user cap alone is not a cap at all; the raw address is
  -- never stored.
  ip_hash    text,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_user_window_idx
  on public.ai_usage (user_id, kind, created_at desc);
create index if not exists ai_usage_ip_window_idx
  on public.ai_usage (ip_hash, kind, created_at desc);

/*
 * Checks both quotas and records the call, in one transaction. The limits live
 * here rather than in the application because this function is reachable over
 * PostgREST — a caller must not be able to pass its own ceiling.
 */
create or replace function public.claim_ai_usage(p_kind text, p_ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_limit int;
  v_ip_limit   int;
  v_user_count int;
  v_ip_count   int;
begin
  if auth.uid() is null then
    return false;
  end if;

  case p_kind
    when 'interview'  then v_user_limit := 5;  v_ip_limit := 25;
    when 'simulation' then v_user_limit := 20; v_ip_limit := 100;
    else return false;
  end case;

  select count(*) into v_user_count
    from public.ai_usage
   where user_id = auth.uid()
     and kind = p_kind
     and created_at > now() - interval '24 hours';

  if v_user_count >= v_user_limit then
    return false;
  end if;

  if coalesce(p_ip_hash, '') <> '' then
    select count(*) into v_ip_count
      from public.ai_usage
     where ip_hash = p_ip_hash
       and kind = p_kind
       and created_at > now() - interval '24 hours';

    if v_ip_count >= v_ip_limit then
      return false;
    end if;
  end if;

  insert into public.ai_usage (user_id, kind, ip_hash)
  values (auth.uid(), p_kind, nullif(p_ip_hash, ''));

  return true;
end;
$$;

revoke execute on function public.claim_ai_usage(text, text) from public, anon;
grant execute on function public.claim_ai_usage(text, text) to authenticated;

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
  -- Supabase-hosted projects already have this publication; a fresh or
  -- self-hosted Postgres does not.
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

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
