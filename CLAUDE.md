# Arbeitsanweisungen

Konzept, Scope und Phasenplan stehen in `KICKOFF.md`. Diese Datei komplett
lesen, bevor etwas gebaut wird.

## Regeln

- **Nach jeder Phase Freigabe einholen.** Keine Arbeit an Phase n+1 ohne
  ausdrückliches Okay.
- **Keine Lösungen ins Client-Bundle.** Lösungen gehören nach
  `content/levels.solutions.ts` (`import 'server-only'`). Punkte werden nur in
  Route Handlers berechnet.
- **Inhalte nur in `content/`.** Keine Fragen, Texte oder Zeiten in Komponenten.
- **`lib/scoring.ts` bleibt frei von I/O** und ist unit-getestet.
- **Kein Drag-and-Drop, kein Dark Mode, keine i18n.** Sprache ist Deutsch.
- **Mobil zuerst:** 360×640, Tap-Ziele ab 44 px, Buttons ab 56 px,
  Schrift ab 17 px.
- Alle Datenbankzugriffe der App laufen über den Service-Role-Key auf dem
  Server. Der Anon-Key darf nur `teams`, `session` und `team_ranking` lesen.

## Prüfen vor der Übergabe

```
npm test && npm run typecheck && npm run lint && npm run build
```
