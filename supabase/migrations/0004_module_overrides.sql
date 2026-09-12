-- =========================================================
-- Manuelle Freischaltung: Admin kann Module unabhängig von der Uhrzeit
-- öffnen oder schließen (/admin, Tabelle „Freischaltung“).
-- Im Supabase SQL-Editor ausführen.
-- =========================================================

create table if not exists module_overrides (
  key text primary key,                -- 'l1' | 'l2' | 'l3' | 'bingo' | 'solutions'
  state text not null check (state in ('open', 'closed')),
  updated_at timestamptz not null default now()
);

alter table module_overrides enable row level security;
revoke all on module_overrides from anon, authenticated;
grant all on module_overrides to service_role;
