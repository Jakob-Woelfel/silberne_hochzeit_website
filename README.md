# Silberhochzeit-App

Mobile Web-App für die Silberhochzeit am 12.09.2026: Quiz-Level, Selfie-Bingo
und eine Live-Runde am Abend. Rund 60 Gäste, Einstieg per QR-Code, kein Login.

Konzept und Scope stehen in [KICKOFF.md](KICKOFF.md).

## Stand

**Phase 1 – Fundament** ist gebaut:

- Gast-Anlage ohne Login, Team-Zuteilung per Round-Robin
- Startseite mit Kacheln, Countdown auf die Freischaltzeiten
- Level 1 durchspielbar, jede Antwort sofort gespeichert
- Punkteberechnung ausschließlich serverseitig
- Ranking: Team-Wertung öffentlich, Solo nur der eigene Platz

Level 2/3, Bingo und Live-Runde sind angelegt, aber noch leer.

## Einrichten

### 1. Supabase-Projekt

Auf [supabase.com](https://supabase.com) ein Projekt in der Region
**Frankfurt (eu-central-1)** anlegen. Dann im **SQL Editor** den Inhalt von
`supabase/migrations/0001_init.sql` einfügen und ausführen. Das legt Tabellen,
Views, die Funktion `create_guest` und alle Zugriffsregeln an. Das Skript ist
idempotent, mehrfaches Ausführen schadet nicht.

### 2. Umgebungsvariablen

`.env.example` nach `.env.local` kopieren und ausfüllen. Die Schlüssel stehen
unter **Project Settings → API Keys**.

Die Variablennamen entsprechen dem, was im Dashboard steht. Der frühere anon
key heißt dort inzwischen **Publishable key**, der frühere service_role key
heißt **Secret key**. Beide zeigen weiterhin auf dieselben Datenbankrollen.

| Variable | Wert im Dashboard |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Publishable key**, beginnt mit `sb_publishable_` |
| `SUPABASE_SECRET_KEY` | **Secret key**, beginnt mit `sb_secret_`, **nur Server** |
| `HOST_SECRET` | frei wählbar, schützt `/admin` und später `/host` |
| `UNLOCK_ALL` | `true` in der Entwicklung, `false` in Produktion |
| `NEXT_PUBLIC_UNLOCK_ALL` | dasselbe, für die Countdowns im Browser |
| `NEXT_PUBLIC_EVENT_DATE` | `2026-09-12` |

Die **JWKS-URL** wird nicht gebraucht. Sie dient dazu, Anmelde-Token zu prüfen,
und die App hat keine Anmeldung.

Der Secret Key darf nie in eine Variable mit `NEXT_PUBLIC_` Präfix. Alles mit
diesem Präfix wird ins JavaScript gebacken, das die Gäste herunterladen.

### 3. Starten

```
npm install
npm run dev
```

## Skripte

```
npm run dev        Entwicklungsserver
npm run build      Produktions-Build
npm test           Scoring-Tests
npm run typecheck  TypeScript ohne Emit
npm run lint       ESLint
```

## Wo die Inhalte stehen

Alle Fragen, Texte und Zeiten liegen in `content/`. Das ist die einzige Stelle,
die für neue Inhalte angefasst werden muss.

| Datei | Inhalt |
|---|---|
| `content/levels.ts` | Fragen für Level 1–3, **ohne Lösungen** |
| `content/levels.solutions.ts` | die Lösungen, nur auf dem Server lesbar |
| `content/teams.ts` | Teamnamen und Farben |
| `content/schedule.ts` | Freischaltzeiten |
| `content/bingo.ts` | Bingo-Felder (Phase 3) |
| `content/live.ts` | Live-Fragen (Phase 4) |

Die Fragen in `levels.ts` sind aktuell **Platzhalter** und mit `PLATZHALTER`
markiert. Beim Ersetzen müssen Frage und Lösung dieselbe `id` behalten.

## Warum die Lösungen getrennt liegen

`content/levels.solutions.ts` beginnt mit `import 'server-only'`. Sobald jemand
diese Datei aus einer Client Component importiert, bricht der Build ab. So
landet keine Lösung im JavaScript, das die Gäste herunterladen. Die Punkte
berechnet ausschließlich `app/api/answer/route.ts`.

Gegenprobe nach einem Build:

```
npm run build
grep -r "Wonderful Tonight" .next/static   # darf nichts finden
```

## Vor der Feier

`scripts/reset.sql` im SQL-Editor ausführen. Das löscht alle Testgäste,
Antworten und Uploads. Teams und Live-Session bleiben stehen.
