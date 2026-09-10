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

## Admin-Bereich

`/admin` ist hinter `HOST_SECRET`. Alles, was Gästen verborgen bleibt (volles
Solo-Ranking, Lösungen im Klartext), gehört dorthin und nirgendwo sonst hin.
Neue Admin-Aktionen kommen in `app/api/admin/route.ts` und prüfen zuerst
`isAdmin()`.

Der Vorschau-Modus (`isAdminPreview()`) hebt Freischaltzeiten nur für den
eigenen Browser auf. Jede neue Zeitsperre muss ihn berücksichtigen, sonst kann
man das Modul vorab nicht testen.

## Prüfen vor der Übergabe

```
npm test && npm run typecheck && npm run lint && npm run build
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
