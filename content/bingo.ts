/**
 * Selfie-Bingo (Team-Wertung).
 *
 * BINGO_POOL enthält alle Felder. Jeder Gast bekommt ein eigenes 4×4-Grid:
 * eine feste, aus seiner guest_id abgeleitete Zufallsauswahl (bingoFieldsFor),
 * damit nicht alle dieselben Leute jagen. Pflichtfelder (BINGO_REQUIRED) sind
 * immer dabei und stehen an fester Position.
 *
 * IDs bleiben stabil, auch wenn Felder umsortiert oder ergänzt werden – sie
 * stehen in answers.task_id. Pool erweiterbar: neue Felder mit fortlaufender
 * ID anhängen. Bestehende IDs nie umnummerieren.
 */

export type BingoField = { id: string; text: string };

export const BINGO_COLS = 4;
export const BINGO_SIZE = BINGO_COLS * BINGO_COLS;

/** Steht vor jedem Feldtext. */
export const BINGO_PREFIX = 'Mach ein Selfie mit jemandem, der/die …';

/** Feld-ID -> Grid-Position (0-basiert), immer im Grid. */
export const BINGO_REQUIRED: Record<string, number> = {
  bingo_10: 5, // „anderes Team“ auf Feld 6, damit es früh auffällt
};

export const BINGO_POOL: BingoField[] = [
  { id: 'bingo_01', text: '… Bernd oder Katrin schon vor der Hochzeit 2001 kannte' },
  {
    id: 'bingo_02',
    text: '… von Katrin oder Bernd gebabysittet wurde – oder selbst auf die Kinder aufgepasst hat',
  },
  { id: 'bingo_03', text: '… 2001 auf der Hochzeit dabei war' },
  { id: 'bingo_04', text: '… mit einem der beiden zur Schule gegangen ist' },
  { id: 'bingo_05', text: '… die erste gemeinsame Wohnung der beiden von innen gesehen hat' },
  { id: 'bingo_06', text: '… Bernd oder Katrin schon mal bei der Arbeit erlebt hat' },
  {
    id: 'bingo_07',
    text: '… schon mal ein Windrad von Bernd erklärt bekommen hat, ohne danach gefragt zu haben',
  },
  { id: 'bingo_08', text: '… schon mal auf der Couch am Allhornring übernachtet hat' },
  { id: 'bingo_09', text: '… von Katrin schon mal beraten wurde' },
  { id: 'bingo_10', text: '… in einem anderen Team ist als du' },
  { id: 'bingo_11', text: '… du heute zum ersten Mal siehst' },
  {
    id: 'bingo_12',
    text: '… zur „anderen Seite“ gehört (Familie Bernd ↔ Familie Katrin ↔ Freunde)',
  },
  { id: 'bingo_13', text: '… am weitesten angereist ist' },
  { id: 'bingo_14', text: '… heute etwas Silbernes trägt' },
  { id: 'bingo_15', text: '… schon mal mit Bernd oder Katrin im Urlaub war' },
  { id: 'bingo_16', text: '… die Namen aller drei Kinder in unter 5 Sekunden aufsagen kann' },
  { id: 'bingo_17', text: '… mit Katrin oder Bernd im Geburtsvorbereitungskurs war' },
  { id: 'bingo_18', text: '… die beiden erst in Hamburg kennengelernt hat' },
  { id: 'bingo_19', text: '… die beiden noch aus Darmstädter Zeiten kennt' },
  { id: 'bingo_20', text: '… schon mal mit Bernd oder Katrin die Nacht durchgemacht hat' },
  { id: 'bingo_21', text: '… mit einem der beiden mal auf einem Konzert war' },
  { id: 'bingo_22', text: '… schon mal beim Umzug der beiden Kisten geschleppt hat' },
  { id: 'bingo_23', text: '… im selben Jahr wie die beiden geheiratet hat' },
  { id: 'bingo_24', text: '… Nachbar oder Nachbarin der beiden ist' },
  { id: 'bingo_25', text: '… schon mal Kuchen von Katrin bekommen hat' },
  { id: 'bingo_26', text: '… aus demselben Bundesland wie du kommt' },
  { id: 'bingo_27', text: '… jünger ist als die Ehe von Bernd und Katrin' },
];

export function bingoFieldById(id: string): BingoField | undefined {
  return BINGO_POOL.find((f) => f.id === id);
}

// ── deterministische Auswahl pro Gast ────────────────────────────────────────

/** FNV-1a: Zeichenkette -> 32-Bit-Seed. */
function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: kleiner, reproduzierbarer PRNG. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Das Grid eines Gastes: BINGO_SIZE Felder in Grid-Reihenfolge. Gleiche
 * guest_id -> gleiches Grid, solange der Pool gleich bleibt (neue Felder am
 * Ende ändern die Auswahl bestehender Gäste – also nicht während der Feier).
 */
export function bingoFieldsFor(guestId: string): BingoField[] {
  const required = Object.keys(BINGO_REQUIRED);
  const rest = BINGO_POOL.filter((f) => !required.includes(f.id));

  // Fisher-Yates mit Seed
  const next = rng(hashSeed(guestId));
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }

  const picked = rest.slice(0, BINGO_SIZE - required.length);
  for (const id of required) {
    const field = bingoFieldById(id);
    if (!field) continue;
    const pos = Math.min(BINGO_REQUIRED[id], picked.length);
    picked.splice(pos, 0, field);
  }
  return picked;
}

/** Feld-IDs des Gastes als Zeilen (für Reihen-/Spaltenbonus). */
export function bingoGridFor(guestId: string): string[][] {
  const fields = bingoFieldsFor(guestId);
  const rows: string[][] = [];
  for (let i = 0; i < fields.length; i += BINGO_COLS) {
    rows.push(fields.slice(i, i + BINGO_COLS).map((f) => f.id));
  }
  return rows;
}
