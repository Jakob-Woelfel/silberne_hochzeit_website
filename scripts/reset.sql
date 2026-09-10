-- Alle Spieldaten löschen (vor der Feier ausführen!). Teams und session bleiben.
delete from uploads;
delete from answers;
delete from guests;
alter sequence guests_seq_seq restart with 1;
update session set phase = 'idle', question_id = null, started_at = null,
                   parents_answer = null, updated_at = now() where id = 1;
