-- =========================================================
-- Solo-Score: Bingo zählt zur Hälfte mit (lib/scoring.ts: BINGO_SOLO_FACTOR).
-- Gilt rückwirkend für alle Gäste, weil die View aus answers rechnet –
-- es wird keine Antwort verändert.
-- Im Supabase SQL-Editor ausführen.
-- =========================================================

create or replace view solo_ranking as
  with totals as (
    select
      g.id,
      g.name,
      g.team_id,
      (
        coalesce(sum(case when a.task_id ~ '^l[0-9]+_' then a.points else 0 end), 0)
        + floor(coalesce(sum(case when a.task_id ~ '^bingo_' then a.points else 0 end), 0) * 0.5)
      )::int as points
    from guests g
    left join answers a
      on a.guest_id = g.id
     and (a.task_id ~ '^l[0-9]+_' or a.task_id ~ '^bingo_')
    group by g.id, g.name, g.team_id
  )
  select
    id,
    name,
    team_id,
    points,
    rank() over (order by points desc)::int as rank
  from totals;

alter view solo_ranking set (security_invoker = off);
revoke all on solo_ranking from anon, authenticated;
