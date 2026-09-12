-- =========================================================
-- Phase 4: Live-Session – Team-Bonus und Team-Wertung
-- Im Supabase SQL-Editor ausführen (wie 0001_init.sql).
-- =========================================================

-- Bonus aus der Live-Runde, pro Team genau eine Zeile.
-- Wird beim Beenden der Runde vom Host geschrieben (/api/admin, liveEnd).
create table if not exists team_bonus (
  team_id smallint primary key references teams(id) on delete cascade,
  points int not null default 0,
  note text,
  updated_at timestamptz not null default now()
);

alter table team_bonus enable row level security;
revoke all on team_bonus from anon, authenticated;
grant all on team_bonus to service_role;

-- Team-Wertung = Bingo-Punkte aller Mitglieder + Live-Bonus.
-- Die Einzelpunkte der Live-Runde ('live_...') zählen NICHT mehr direkt,
-- sonst würde die Live-Runde das Bingo erdrücken und größere Teams bevorzugen.
-- Stattdessen: Team-Durchschnitt -> Rangfolge -> Bonus (content/live.ts).
create or replace view team_ranking as
  select
    t.id,
    t.name,
    t.color,
    (
      coalesce(sum(a.points), 0)
      + coalesce((select b.points from team_bonus b where b.team_id = t.id), 0)
    )::int as points,
    count(distinct g.id)::int as members
  from teams t
  left join guests g on g.team_id = t.id
  left join answers a
    on a.guest_id = g.id
   and a.task_id ~ '^bingo_'
  group by t.id, t.name, t.color;

alter view team_ranking set (security_invoker = off);
grant select on team_ranking to anon, authenticated;
