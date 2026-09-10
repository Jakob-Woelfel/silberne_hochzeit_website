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

## Admin-Bereich

`/admin` zeigt alles, was Gästen verborgen bleibt, und steuert die Spielrunde.
Geschützt ist er allein durch `HOST_SECRET`.

Einstieg auf zwei Wegen:

- `/admin` aufrufen und den Schlüssel in das Formular tippen
- einmalig `/admin/enter?key=DEIN_SECRET` aufrufen, dann reicht künftig `/admin`

Der Schlüssel liegt danach zwölf Stunden in einem Cookie, das JavaScript nicht
lesen kann.

### Was dort geht

| Bereich | Inhalt |
|---|---|
| Status | Datenbankverbindung, Anzahl Gäste, Antworten, vergebene Punkte |
| Freischaltung | wann welches Modul öffnet und ob es gerade offen ist |
| Inhalte | Fragen pro Level, fehlende Lösungen, verbliebene Platzhalter |
| Teams | Team-Wertung |
| Gäste | vollständiges Solo-Ranking, für Gäste unsichtbar |

Pro Gast: Name korrigieren, Team umhängen, in die Gast-Ansicht schlüpfen,
Antworten zurücksetzen, Gast löschen. Unter `/admin/content` stehen alle Fragen
mit ihren Lösungen im Klartext.

### Vorschau-Modus

Der Schalter unter *Steuerung* hebt alle Freischaltzeiten auf, aber nur für
deinen Browser. Gäste merken davon nichts. So lässt sich am Vorabend jedes Level
durchspielen, während in Produktion `UNLOCK_ALL=false` steht.

### In einen Gast schlüpfen

In der Gästetabelle öffnet *als Gast öffnen* die App mit dessen Identität.
Oben läuft dann ein dunkler Balken mit, damit klar bleibt, dass das nicht die
eigene Sitzung ist. *Identität ablegen* im Dashboard beendet das wieder.

### Zurücksetzen

Ganz unten löscht *Zurücksetzen* alle Gäste, Antworten und Uploads. Der
Bestätigungstext muss wörtlich getippt werden. Vor der Feier einmal ausführen,
damit keine Testdaten in die Wertung laufen. Alternativ `scripts/reset.sql` im
SQL-Editor.

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

Testdaten löschen: entweder im Admin-Bereich unter *Zurücksetzen* oder
`scripts/reset.sql` im SQL-Editor. Teams und Live-Session bleiben stehen.

Außerdem `HOST_SECRET` durch etwas Langes und Zufälliges ersetzen. Das Dashboard
warnt, solange der Wert zu kurz oder erratbar ist. Einen erzeugen:

```
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```
