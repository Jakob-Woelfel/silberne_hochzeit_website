import { describe, expect, it } from 'vitest';
import {
  csvOverview,
  disambiguateNames,
  formatTime,
  groupPhotos,
  photoFilename,
  shortFieldText,
  zipEntryPath,
  type GalleryPhoto,
} from './gallery';

function photo(over: Partial<GalleryPhoto>): GalleryPhoto {
  return {
    id: 'u1',
    url: 'https://x/selfies/g1/bingo_01.jpg',
    guestId: 'g1',
    name: 'Anna',
    teamId: 1,
    fieldId: 'bingo_01',
    fieldIndex: 1,
    fieldText: 'Bernd oder Katrin schon vor der Hochzeit 2001 kannte',
    createdAt: '2026-09-12T15:42:00Z',
    filename: 'Anna – 01 Bernd oder Katrin schon.jpg',
    ...over,
  };
}

describe('shortFieldText', () => {
  it('entfernt das führende „… “', () => {
    expect(shortFieldText('… heute etwas Silbernes trägt')).toBe('heute etwas Silbernes trägt');
    expect(shortFieldText('ohne Auslassung')).toBe('ohne Auslassung');
  });
});

describe('photoFilename', () => {
  it('baut Name, Feldnummer und die ersten Wörter zusammen', () => {
    expect(photoFilename('Anna', 6, '… in einem anderen Team ist als du')).toBe(
      'Anna – 06 in einem anderen Team.jpg',
    );
  });

  it('lässt die Nummer weg, wenn das Feld unbekannt ist', () => {
    expect(photoFilename('Anna', 0, '… heute etwas Silbernes trägt')).toBe(
      'Anna – heute etwas Silbernes trägt.jpg',
    );
  });

  it('behält Umlaute, entfernt Pfad- und Sonderzeichen', () => {
    expect(photoFilename('Jörg/Müller: "Chef"', 3, '… zur „anderen Seite“ gehört')).toBe(
      'JörgMüller Chef – 03 zur „anderen Seite“ gehört.jpg',
    );
  });

  it('fällt bei leerem Namen auf „Gast“ zurück', () => {
    expect(photoFilename('   ', 2, '… x')).toBe('Gast – 02 x.jpg');
  });
});

describe('disambiguateNames', () => {
  it('nummeriert gleiche Namen unabhängig von Groß-/Kleinschreibung', () => {
    const map = disambiguateNames([
      { id: 'a', name: 'Anna' },
      { id: 'b', name: 'Bernd' },
      { id: 'c', name: 'anna ' },
      { id: 'd', name: 'Anna' },
    ]);
    expect(map.get('a')).toBe('Anna');
    expect(map.get('b')).toBe('Bernd');
    expect(map.get('c')).toBe('anna (2)');
    expect(map.get('d')).toBe('Anna (3)');
  });
});

describe('formatTime', () => {
  it('zeigt Berliner Uhrzeit', () => {
    expect(formatTime('2026-09-12T15:42:00Z')).toBe('17:42');
  });
  it('ist robust gegen kaputte Werte', () => {
    expect(formatTime('nope')).toBe('–');
  });
});

describe('groupPhotos', () => {
  const photos = [
    photo({ id: '1', guestId: 'g1', fieldId: 'bingo_01' }),
    photo({ id: '2', guestId: 'g2', fieldId: 'bingo_01' }),
    photo({ id: '3', guestId: 'g1', fieldId: 'bingo_02' }),
  ];

  it('gruppiert nach Gast in Reihenfolge des ersten Auftretens', () => {
    const groups = groupPhotos(photos, 'guest');
    expect(groups.map((g) => g.key)).toEqual(['g1', 'g2']);
    expect(groups[0].photos.map((p) => p.id)).toEqual(['1', '3']);
  });

  it('gruppiert nach Feld', () => {
    const groups = groupPhotos(photos, 'field');
    expect(groups.map((g) => [g.key, g.photos.length])).toEqual([
      ['bingo_01', 2],
      ['bingo_02', 1],
    ]);
  });
});

describe('zipEntryPath / csvOverview', () => {
  it('legt jedes Foto in den Ordner der Person', () => {
    expect(zipEntryPath(photo({}))).toBe(
      'Selfie-Bingo/Anna/Anna – 01 Bernd oder Katrin schon.jpg',
    );
  });

  it('schreibt BOM, Semikolon-Spalten und maskiert Anführungszeichen', () => {
    const csv = csvOverview(
      [photo({ fieldText: 'zur „anderen Seite“; gehört', teamId: 2 })],
      (id) => (id === 2 ? 'Team B' : '?'),
    );
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('﻿Datei;Name;Team;Feld;Aufgabe;Uhrzeit');
    expect(lines[1]).toBe(
      'Selfie-Bingo/Anna/Anna – 01 Bernd oder Katrin schon.jpg;Anna;Team B;1;"zur „anderen Seite“; gehört";17:42',
    );
    expect(lines[2]).toBe('');
  });
});
