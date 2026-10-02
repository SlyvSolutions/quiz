import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

describe('build-data', () => {
  it('não regenera mais o regional.json de exemplo (Fulano de Tal / Ciclano da Silva)', () => {
    const fonte = readFileSync('scripts/build-data.ts', 'utf-8');
    expect(fonte).not.toMatch(/regional/);
    expect(fonte).not.toMatch(/Fulano|Ciclano/);
  });

  it('o regional.json de exemplo não é mais publicado (nem em public/data, nem no manifesto)', () => {
    expect(existsSync('public/data/regional.json')).toBe(false);
    expect(readFileSync('public/manifesto.json', 'utf-8')).not.toContain('regional.json');
  });
});
