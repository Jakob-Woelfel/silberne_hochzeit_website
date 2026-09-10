# KICKOFF – Silberhochzeit-App (Schnitzeljagd & Live-Quiz)

## Current Goal

Eine mobile Web-App (Next.js + Supabase, Deployment auf Vercel), die ca. 60 Gäste einer Silberhochzeit per QR-Code durch den Tag führt: asynchrone Quiz-Level mit zeitgesteuerter Freischaltung, ein teambasiertes Selfie-Bingo mit Foto-Upload und eine synchrone Live-Session (Kahoot-Stil) am Abend, gesteuert über einen Host-Screen.

**Deadline: Feier am 12.09.2026.** Scope ist bewusst hart begrenzt (siehe „Nicht-Ziele“). Lieber wenige Module stabil als viele halb.

**Vorgehen: think first, then build.** Vor dem ersten Code:
1. Diese Datei komplett lesen.
2. Offene Fragen (Abschnitt 12) mit mir klären, soweit sie die Architektur betreffen.
3. Kurzen Plan für Phase 1 vorlegen, dann bauen.

---

## 1. Kontext

- Anlass: 25. Hochzeitstag meiner Eltern, Feier mit ~60 Gästen, gemischtes Alter (20–80), gemischte Technik-Affinität.
- Alle Gäste nutzen ihr eigenes Smartphone. Kein Login, kein App-Store, kein Account.
- Einstieg: QR-Code (auf Tischkarten/Plakat) → URL → Name eingeben → los.
- Die Gäste kennen sich teilweise nicht (Familie Vater / Familie Mutter / Freundeskreise). Ein Kernziel der App ist, dass Leute miteinander ins Gespräch kommen.
- Am Abend wird ein Beamer/TV für den Host-Screen verfügbar sein.
- Parallel gibt es ein physisches Geschenk (eine gestaltete Gartenbank), das im Finale enthüllt wird – die App muss das nicht abbilden, nur das Finale „ankündigen“.

## 2. Ziele

1. Gäste können jederzeit am Tag für 2–10 Minuten reinschauen und etwas tun.
2. Zwei Sieger am Abend: bester Einzelspieler (Solo-Score) und bestes Team (Team-Score).
3. Eine Live-Session am Abend, bei der alle gleichzeitig auf dem Handy antworten und das Ergebnis auf dem Beamer erscheint.
4. Alles muss auf einem 5 Jahre alten Android-Handy mit mäßigem Empfang funktionieren.

## 3. Nicht-Ziele (explizit ausgeschlossen)

- Kein Auth-System, keine E-Mail, kein Passwort.
- Keine native App, kein PWA-Install-Prompt (Add-to-Homescreen ist ok, aber kein Feature).
- Kein Admin-CMS: Fragen und Inhalte werden im Code gepflegt (siehe Abschnitt 7).
- Kein Anti-Cheat über „nicht mehrfach abstimmen pro Gast“ hinaus. Es ist eine Familienfeier.
- Keine Drag-and-Drop-Interaktionen (schlecht auf Touch, fehleranfällig). Zeitstrahl wird per Tap-Reihenfolge gelöst.
- Kein Dark Mode, keine i18n. Sprache: Deutsch.
- Keine Video-Uploads.

---

## 4. Spiele-Übersicht

### 4.1 Zeitachse

| Zeit  | Block                     | Modus | Inhalt                                                    |
|-------|---------------------------|-------|-----------------------------------------------------------|
| 12:00 | Level 1                   | Solo  | Kennenlern-Quiz, Haarfarbe, Hochzeitssong, Pfingsten-Frage |
| 14:00 | Level 2                   | Solo  | Zeitstrahl, Wohnorte, Umzüge, Ehe-Tage, Geburtstage (Schätzen) |
| 17:00 | Level 3                   | Solo  | Zoom-Bilder („Wer ist das?“), Alter auf Fotos schätzen      |
| 12:00–20:00 | Selfie-Bingo        | Team  | 9 Felder „Finde jemanden, der…“ + Selfie-Upload            |
| 20:00 | Live-Session              | Team  | Zitate zuordnen, „Wer würde eher…“, Menti-Fragen (synchron) |
| 20:30 | Finale                    | –     | Auflösung auf Beamer, Sieger, Bank                         |

Regeln:
- Level 1–3 bleiben nach Freischaltung offen bis zum Start der Live-Session. Nachzügler holen alles nach.
- Selfie-Bingo schließt beim Start der Live-Session (Team-Wertung muss vorher feststehen).
- Die Live-Session wird vom Host manuell gestartet, nicht per Uhrzeit.

### 4.2 Aufgabentypen (technisch)

| Typ         | Beschreibung                                                   | Wertung                              |
|-------------|----------------------------------------------------------------|--------------------------------------|
| `choice`    | Multiple Choice, 2–4 Optionen, eine richtig                    | fix (z. B. 10 P)                     |
| `estimate`  | Zahl eingeben, Lösung ist eine Zahl                            | gestaffelt nach Abweichung (%)       |
| `text`      | Freitext, Lösung ist Liste erlaubter Antworten (case-insens.)  | fix bei Treffer                      |
| `multi`     | Mehrere richtige Antworten (z. B. alle Wohnorte)               | Punkte pro Treffer, Abzug pro Fehler |
| `order`     | Ereignisse in Reihenfolge tippen (Zeitstrahl)                  | Punkte pro korrekter Position        |
| `zoom`      | Bild in 3 Zoomstufen, pro Stufe ein Versuch                    | 30 / 20 / 10 P je nach Stufe         |
| `age`       | Foto + Alter beider Personen schätzen                          | wie `estimate`, zweifach             |
| `bingo`     | Feld mit Text + Selfie-Upload                                  | 10 P pro Feld, Reihe +20 (Team)      |
| `live`      | Nur in Live-Session: `quote` (Bernd/Katrin), `either` (wer eher), `menti` (Freitext-Wolke) | siehe 4.4 |

### 4.3 Team-Mechanik

- Drei Teams, Zufallszuteilung beim Start (round-robin über die Anmelde-Reihenfolge, damit die Teams gleich groß werden).
- Teamnamen: PLATZHALTER – ich liefere sie (Idee: die drei Wohnorte der Eltern).
- Team-Score = Summe der Bingo-Punkte aller Mitglieder + Live-Session-Bonus (Abschnitt 4.4).
- Solo-Score = Summe der Punkte aus Level 1–3. Bingo und Live zählen NICHT in den Solo-Score.
- Ein Bingo-Feld lautet „Selfie mit jemandem aus einem anderen Team“ → das erzwingt Mischen.

### 4.4 Live-Session (Kahoot-Stil)

Ablauf (~15 Min):
1. Host öffnet Lobby. Gäste-Handys zeigen „Warten auf Start“ + Anzahl Verbundener.
2. Host schaltet Frage für Frage frei. Pro Frage: Frage + Optionen erscheinen sofort auf allen Handys, 15 s Countdown (berechnet aus `session.started_at` + Serverzeit, nicht aus lokaler Uhr).
3. Nach Ablauf: Host schaltet auf „Reveal“. Beamer zeigt Verteilung (Balken), aufgeschlüsselt nach Team. Bei `quote`: richtige Antwort. Bei `either`/`menti`: die Eltern antworten live auf der Bühne, der Host trägt die Antwort ein, Beamer zeigt, welches Team am nächsten liegt.
4. Am Ende: Team-Ranking der Live-Session → Bonus auf den Team-Score.

Wertung:
- `quote`: richtig = 100 P, plus Tempobonus (linear 0–50 P nach Restzeit). Solo-Punkte werden erfasst, aber nur der Team-Durchschnitt zählt.
- `either`: Team-Anteil, der mit der Elternantwort übereinstimmt, in %. Höchster Anteil gewinnt die Runde.
- `menti`: keine Punkte, nur Anzeige (Wortwolke oder Liste mit Häufigkeit).

Host-Steuerung: Seite `/host?key=<HOST_SECRET>`. Buttons: Lobby / Nächste Frage / Reveal / Elternantwort setzen / Ende. Der Beamer zeigt `/screen?key=<HOST_SECRET>` (nur Anzeige, keine Buttons – kann parallel auf dem Laptop und dem Handy des Hosts laufen).

---

## 5. Nutzerflow (Gast)

```
QR → /
  ├─ kein guest_id im localStorage → /start: Name eingeben → Gast anlegen → Team zuweisen
  └─ guest_id vorhanden → /home
/home
  ├─ Score-Header: „Dein Score · Rang x/y“ + „Team X · Platz n“
  ├─ Kacheln: Level 1 | Level 2 | Level 3 | Selfie-Bingo | Live-Session
  │    Zustand je Kachel: gesperrt (mit Countdown) | offen (Fortschritt x/y) | abgeschlossen
  └─ Banner, wenn Live-Session läuft → direkter Sprung
/level/[n]        Fragen nacheinander, Fortschritt oben, jede Antwort sofort gespeichert
/bingo            3x3 Grid, Tap auf Feld → Kamera/Galerie → Upload → Feld markiert
/live             Lobby / Frage / Reveal, gesteuert durch session-Tabelle
/ranking          Solo-Top-10 + Team-Ranking (öffentlich, für alle)
```

Wichtig:
- Jede Antwort wird sofort persistiert (kein „Absenden“-Button am Ende eines Levels). Wenn das Handy in die Tasche wandert, ist nichts verloren.
- Reload auf jeder Seite muss den korrekten Zustand wiederherstellen (guest_id aus localStorage, alles andere vom Server).
- Bereits beantwortete Fragen zeigen die eigene Antwort + erreichte Punkte, keine Korrektur möglich.

---

## 6. Architektur

### 6.1 Stack

- Next.js 15, App Router, TypeScript, Tailwind. Server Components wo sinnvoll, Client Components für alles Interaktive.
- Supabase: Postgres, Realtime (postgres_changes auf `session`), Storage (Bucket `selfies`).
- `@supabase/supabase-js` mit Anon-Key im Client. Serverseitige Schreibvorgänge mit Prüfung (Punkteberechnung, Host-Aktionen) laufen über Route Handlers / Server Actions mit Service-Role-Key.
- Kein ORM, kein Prisma. Supabase-Client direkt, Typen per `supabase gen types`.
- Deployment: Vercel, Region `fra1`.

### 6.2 Identität ohne Login

- `guest_id` = UUID, beim ersten Start generiert und in `localStorage` gespeichert; zusätzlich als Cookie, damit Server Components ihn lesen können.
- Verlust des localStorage (anderer Browser, Handy gewechselt) → neuer Gast. Akzeptiert. Optional: auf /start „Ich war schon dabei“ mit Namensauswahl aus der Gästeliste, um die alte guest_id zu übernehmen (nice-to-have, Phase 4).

### 6.3 Ordnerstruktur (modular)

```
app/
  (guest)/            Layout mit Score-Header, Bottom-Nav
    page.tsx          /home
    start/
    level/[n]/
    bingo/
    live/
    ranking/
  host/               Host-Steuerung, geschützt per HOST_SECRET
  screen/             Beamer-Ansicht
  api/
    answer/           POST: Antwort speichern + Punkte berechnen (Server, Service-Role)
    bingo/            POST: Upload registrieren
    host/             POST: Session-Aktionen
content/
  levels.ts           Fragen Level 1–3 (typisiert, mit Lösungen)
  bingo.ts            9 Bingo-Felder
  live.ts             Live-Fragen
  teams.ts            Teamnamen, Farben
  schedule.ts         Freischaltzeiten
lib/
  supabase/           client.ts, server.ts, types.ts
  scoring.ts          reine Funktionen: Antwort + Lösung → Punkte
  time.ts             Serverzeit, Countdown-Helper
  guest.ts            guest_id-Handling
components/
  tiles/              Kacheln auf /home
  questions/          eine Komponente pro Aufgabentyp (ChoiceQuestion, EstimateQuestion, …)
  bingo/
  live/
  ui/                 Button, Card, Countdown, Progress
supabase/
  migrations/         SQL
  seed.sql            optional
```

Prinzip: `content/` ist die einzige Stelle, an der Inhalte stehen. `scoring.ts` ist reine Logik ohne I/O und wird unit-getestet. Aufgabentypen sind über eine `type`-Union in `content/levels.ts` erweiterbar; `components/questions/index.tsx` mappt Typ → Komponente.

### 6.4 Lösungen nicht ins Frontend leaken

Lösungen dürfen nicht im Client-Bundle landen (sonst liest sie ein neugieriger Gast im DevTools). Deshalb:
- `content/levels.ts` exportiert Fragen und Lösungen getrennt: `questions` (client-safe) und `solutions` (nur server-seitig importiert, Datei mit `import 'server-only'`).
- Punkteberechnung ausschließlich in `/api/answer` mit Service-Role-Key.

---

## 7. Datenmodell (Supabase)

```sql
create table teams (
  id smallint primary key,
  name text not null,
  color text not null
);

create table guests (
  id uuid primary key,
  name text not null,
  team_id smallint references teams(id),
  created_at timestamptz default now()
);

create table answers (
  guest_id uuid references guests(id),
  task_id text not null,              -- z. B. 'l1_q3', 'bingo_5', 'live_q2'
  value jsonb not null,               -- Antwort roh
  points int not null default 0,
  answered_at timestamptz default now(),
  primary key (guest_id, task_id)     -- eine Antwort pro Gast und Aufgabe
);

create table uploads (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references guests(id),
  task_id text not null,
  storage_path text not null,
  created_at timestamptz default now()
);

create table session (                 -- genau eine Zeile (id = 1)
  id smallint primary key default 1,
  phase text not null default 'idle', -- idle | lobby | question | reveal | ended
  question_id text,
  started_at timestamptz,             -- Start der aktuellen Frage
  parents_answer jsonb,               -- Elternantwort für either/menti
  updated_at timestamptz default now()
);

-- Views für Rankings
create view solo_ranking as
  select g.id, g.name, g.team_id, coalesce(sum(a.points),0) as points
  from guests g left join answers a on a.guest_id = g.id and a.task_id like 'l%'
  group by g.id;

create view team_ranking as
  select t.id, t.name, coalesce(sum(a.points),0) as points, count(distinct g.id) as members
  from teams t left join guests g on g.team_id = t.id
  left join answers a on a.guest_id = g.id and (a.task_id like 'bingo%' or a.task_id like 'live%')
  group by t.id;
```

RLS:
- `guests`: insert für anon erlaubt, select für alle, update/delete nur Service-Role.
- `answers`, `uploads`: nur Service-Role schreibt (über die API). Select für alle (Ranking).
- `session`: select für alle, write nur Service-Role.
- Storage-Bucket `selfies`: public read, upload nur über signierte URL aus `/api/bingo` (verhindert, dass jemand beliebig hochlädt).

Zeitgesteuerte Freischaltung: `content/schedule.ts` enthält Unlock-Zeiten in `Europe/Berlin`. `/api/answer` prüft serverseitig, ob die Aufgabe offen ist (Serverzeit), das Frontend zeigt nur den Countdown. Für Tests: `.env`-Variable `UNLOCK_ALL=true` überschreibt alle Zeiten.

---

## 8. Realtime & Live-Session

- Client abonniert `session` per Supabase Realtime (`postgres_changes`, `UPDATE` auf id=1).
- Fallback: zusätzlich alle 3 s Polling der `session`-Zeile, falls der Websocket wegbricht (schlechtes WLAN). Realtime und Polling schreiben in denselben State.
- Countdown: beim Öffnen der Seite einmal Serverzeit holen (Route Handler gibt `Date.now()` zurück), Offset zur lokalen Uhr merken, Countdown aus `started_at + 15 s − (lokal + offset)` berechnen.
- Antworten in der Live-Session gehen ebenfalls durch `/api/answer`; dort wird geprüft: `phase = question`, `question_id` passt, `now <= started_at + 15 s + 2 s Toleranz`.
- Beamer (`/screen`): abonniert `session` und `answers` (INSERT-Events mit `task_id like 'live%'`) und rendert Balken live.

Supabase Free Tier: Realtime-Limit 200 gleichzeitige Verbindungen – reicht für 60 Gäste + Host + Screen.

---

## 9. Mobile-Anforderungen

- Zielviewport 360×640 aufwärts. Alles Single-Column.
- Tap-Ziele mindestens 44×44 px. Antwort-Buttons volle Breite, mindestens 56 px hoch.
- Schrift mindestens 16 px in Inputs (verhindert iOS-Autozoom), Fließtext 17–18 px (Gäste 60+).
- Bottom-Nav (Home / Bingo / Ranking), nicht Hamburger.
- Foto-Upload: `<input type="file" accept="image/*" capture="environment">`. Vor Upload clientseitig auf max. 1600 px / ~300 KB komprimieren (`browser-image-compression`), sonst dauern 60 Uploads über Mobilfunk ewig.
- Kein Layout-Shift beim Laden: Skeletons für Kacheln und Ranking.
- Bilder für Zoom-Rätsel vorab in drei Ausschnitten generieren (Script in `scripts/crop.ts`), nicht zur Laufzeit croppen. Ausgabe nach `public/zoom/<id>_1.jpg` etc.
- Erstes Laden unter 200 KB JS. Keine Chart-Library für Gäste; Balken auf dem Beamer als einfache Divs.

---

## 10. Umsetzungsphasen

**Phase 1 – Fundament (zuerst)**
- Next.js-Projekt, Tailwind, Supabase-Client, Migrations, Seed für Teams.
- Gast-Anlage (/start), Team-Zuteilung, /home mit Kacheln und Countdown.
- `scoring.ts` mit Tests für `choice`, `estimate`, `text`, `multi`, `order`.
- Level 1 komplett durchspielbar, Antworten persistiert, Solo-Ranking.

**Phase 2 – Restliche Level**
- Level 2 (inkl. `order`-Komponente per Tap), Level 3 (`zoom`, `age`).
- Crop-Script für Zoom-Bilder.

**Phase 3 – Bingo**
- Grid, Upload via signierte URL, Kompression, Team-Ranking.
- Galerie-Ansicht aller Selfies für den Beamer (`/screen/gallery`).

**Phase 4 – Live-Session**
- `session`-Tabelle, Realtime + Polling, /live, /host, /screen.
- Wertung `quote`/`either`, Elternantwort-Eingabe, Team-Bonus.

**Phase 5 – Härtung**
- Test mit 5 Handys parallel (iOS Safari, Android Chrome, ein altes Gerät).
- Fehlerzustände: kein Netz beim Antworten → Retry-Hinweis, nichts verloren.
- Vercel-Deploy, Env-Variablen, QR-Code auf Produktions-URL.

Nach jeder Phase: kurzer Zwischenstand, keine Weiterarbeit an Phase n+1 ohne meine Freigabe.

---

## 11. Env & Deployment

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # nur Server
HOST_SECRET=                    # für /host und /screen
UNLOCK_ALL=false                # true in Preview-Deployments
NEXT_PUBLIC_EVENT_DATE=2026-09-12
```

- Vercel: Production-Branch `main`, Preview für alles andere. Preview bekommt eigenes Supabase-Projekt oder `UNLOCK_ALL=true` + Prefix in `task_id`, damit Testdaten nicht in die Wertung laufen. Einfacher: vor der Feier alle Tabellen leeren (Script `scripts/reset.sql`).
- Custom Domain optional; wichtig ist nur, dass die URL im QR-Code am Freitagabend final ist.

---

## 12. Offene Fragen (vor dem Bauen klären)

Architektur-relevant:
1. Team-Zuteilung: Zufall (Vorschlag) oder vorgegeben per Namensliste? Zufall ist einfacher und mischt besser.
2. Wiedereinstieg bei verlorener guest_id: Namensauswahl aus Liste (Risiko: Verwechslung bei gleichen Vornamen) oder einfach neuer Gast?
3. Live-Session: Gäste ohne Handy oder ohne Empfang – soll der Host Antworten stellvertretend eintragen können? (Vorschlag: nein, die Person antwortet einfach mit dem Nachbarhandy.)
4. Soll das Solo-Ranking den ganzen Tag öffentlich sichtbar sein oder erst im Finale? (Öffentlich sichtbar treibt Ehrgeiz, verdirbt aber die Überraschung.)

Inhalt (blockiert Phase 1 nicht, aber Phase 2/3):
5. Alle Fragen mit Lösungen für Level 1–3 (Struktur siehe 4.2).
6. Neun Bingo-Felder.
7. Live-Fragen: 6 Zitate, 6 „Wer würde eher“, 2–3 Menti-Fragen.
8. Teamnamen und Farben.
9. Fotos für Zoom- und Alter-Rätsel (Original, ich croppe per Script).
10. Freischaltzeiten bestätigen (12/14/17/20 Uhr) und ob die Feier vor 12 Uhr beginnt.

Organisatorisch:
11. WLAN im Raum? Wenn ja: SSID + Passwort auf das QR-Plakat drucken.
12. Wer bedient den Host-Screen während der Live-Session (ich moderiere vermutlich selbst)?

---

## 13. Bekannte Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Schlechter Empfang im Raum | Polling-Fallback, kleine Bundles, Antworten sofort speichern, Retry bei Fehler |
| Gäste tippen Namen doppelt / Tippfehler | Name ist nur Anzeige, Identität ist guest_id; Host kann Namen in Supabase korrigieren |
| Countdown-Drift zwischen Handys | Serverzeit-Offset, Toleranz von 2 s serverseitig |
| Lösungen im Client-Bundle | `server-only` für Lösungen, Punkte nur serverseitig |
| Uploads zu groß / zu langsam | Clientseitige Kompression, signierte URLs, kein Upload über die API-Route selbst |
| Supabase Free-Tier-Limits (500 MB Storage) | 60 Gäste × 9 Selfies × 300 KB ≈ 160 MB, ok |
| Ich verliere mich in Features | Phasenplan, Nicht-Ziele, Freigabe nach jeder Phase |
