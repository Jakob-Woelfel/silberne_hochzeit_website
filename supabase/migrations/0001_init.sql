-- Silberhochzeit-App – Initiales Schema
-- Im Supabase SQL-Editor ausführen (einmalig).

-- =========================================================
-- Tabellen
-- =========================================================

create table if not exists teams (
  id smallint primary key,
  name text not null,
  color text not null
);

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  team_id smallint references teams(id),
  seq bigserial,
  created_at timestamptz not null default now()
);

create table if not exists answers (
  guest_id uuid not null references guests(id) on delete cascade,
  task_id text not null,               -- 'l1_q3', 'bingo_5', 'live_q2'
  value jsonb not null,
  points int not null default 0,
  answered_at timestamptz not null default now(),
  primary key (guest_id, task_id)
);

create index if not exists answers_task_idx on answers (task_id);

create table if not exists uploads (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id) on delete cascade,
  task_id text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists session (
  id smallint primary key default 1,
  phase text not null default 'idle',  -- idle | lobby | question | reveal | ended
  question_id text,
  started_at timestamptz,
  parents_answer jsonb,
  updated_at timestamptz not null default now(),
  constraint session_singleton check (id = 1)
);

-- =========================================================
-- Seed
-- =========================================================

insert into teams (id, name, color) values
  (1, 'Team A', '#c2410c'),
  (2, 'Team B', '#0369a1'),
  (3, 'Team C', '#15803d')
on conflict (id) do nothing;

insert into session (id, phase) values (1, 'idle')
on conflict (id) do nothing;

-- =========================================================
-- Views
-- =========================================================

-- Solo-Punkte: ausschliesslich Level-Aufgaben ('l1_...', 'l2_...', 'l3_...').
-- Achtung: 'l%' waere falsch, das trifft auch 'live_q1'.
create or replace view solo_ranking as
  select
    g.id,
    g.name,
    g.team_id,
    coalesce(sum(a.points), 0)::int as points,
    rank() over (order by coalesce(sum(a.points), 0) desc)::int as rank
  from guests g
  left join answers a
    on a.guest_id = g.id and a.task_id ~ '^l[0-9]+_'
  group by g.id, g.name, g.team_id;

-- Team-Punkte: Bingo + Live (nicht Solo)
create or replace view team_ranking as
  select
    t.id,
    t.name,
    t.color,
    coalesce(sum(a.points), 0)::int as points,
    count(distinct g.id)::int as members
  from teams t
  left join guests g on g.team_id = t.id
  left join answers a
    on a.guest_id = g.id
   and (a.task_id ~ '^bingo_' or a.task_id ~ '^live_')
  group by t.id, t.name, t.color;

-- Views laufen mit den Rechten des Erstellers (security definer).
-- team_ranking ist bewusst für anon lesbar, solo_ranking nicht.
alter view solo_ranking set (security_invoker = off);
alter view team_ranking set (security_invoker = off);

revoke all on solo_ranking from anon, authenticated;
grant select on team_ranking to anon, authenticated;

-- =========================================================
-- Gast anlegen (Round-Robin über die Anmeldereihenfolge)
-- =========================================================

create or replace function create_guest(p_name text)
returns guests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team smallint;
  v_guest guests;
begin
  if p_name is null or length(btrim(p_name)) = 0 then
    raise exception 'name_required';
  end if;

  select ((count(*) % 3) + 1)::smallint into v_team from guests;

  insert into guests (name, team_id)
  values (btrim(p_name), v_team)
  returning * into v_guest;

  return v_guest;
end;
$$;

-- Nur die API (service_role) darf Gaeste anlegen, der Browser nicht.
-- Achtung: `revoke from public` nimmt das Recht auch service_role weg,
-- deshalb muss das grant danach kommen.
revoke all on function create_guest(text) from public, anon, authenticated;
grant execute on function create_guest(text) to service_role;

-- =========================================================
-- RLS und Rechte
-- =========================================================
--
-- Grundregel: Der Browser (Rolle `anon`) darf fast nichts.
-- Alle Lese- und Schreibvorgaenge der App laufen ueber Route Handlers
-- mit dem Service-Role-Key. Ohne Login kann RLS nicht "nur die eigenen
-- Zeilen" ausdruecken, deshalb bleiben Punkte komplett serverseitig.
--
-- `anon` bekommt nur:
--   - teams        (Namen und Farben, unkritisch)
--   - session      (fuer Realtime in der Live-Session, Phase 4)
--   - team_ranking (oeffentliche Team-Wertung)
-- Insbesondere NICHT: answers, uploads, guests, solo_ranking.

alter table teams   enable row level security;
alter table guests  enable row level security;
alter table answers enable row level security;
alter table uploads enable row level security;
alter table session enable row level security;

-- Tabellenrechte auf Null setzen und gezielt neu vergeben.
-- (Supabase vergibt per default privileges grosszuegige Rechte an anon.)
revoke all on teams, guests, answers, uploads, session from anon, authenticated;

grant select on teams to anon, authenticated;
grant select on session to anon, authenticated;

grant all on teams, guests, answers, uploads, session to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Policies fuer das, was anon lesen darf
drop policy if exists teams_select_all on teams;
create policy teams_select_all on teams
  for select to anon, authenticated using (true);

drop policy if exists session_select_all on session;
create policy session_select_all on session
  for select to anon, authenticated using (true);

-- guests, answers und uploads haben bewusst keine Policy:
-- ohne Policy sieht und schreibt anon nichts, service_role umgeht RLS.
drop policy if exists guests_select_all on guests;

-- =========================================================
-- Realtime (Phase 4)
-- =========================================================

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'session'
  ) then
    alter publication supabase_realtime add table session;
  end if;
end $$;
