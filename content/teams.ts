/** PLATZHALTER – Jakob liefert die echten Namen (Idee: die drei Wohnorte der Eltern). */
export type Team = { id: 1 | 2 | 3; name: string; color: string; tint: string };

export const TEAMS: Team[] = [
  { id: 1, name: 'Team A', color: '#c2410c', tint: '#fff1e7' },
  { id: 2, name: 'Team B', color: '#0369a1', tint: '#e8f3fb' },
  { id: 3, name: 'Team C', color: '#15803d', tint: '#eaf6ee' },
];

export function teamById(id: number | null | undefined): Team | undefined {
  return TEAMS.find((t) => t.id === id);
}
