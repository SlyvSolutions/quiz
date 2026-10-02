import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { BaseCandidatosPRSchema } from '../../src/data/tipos';

const dir = path.join(__dirname, '../../public/data');
const base = BaseCandidatosPRSchema.parse(
  JSON.parse(fs.readFileSync(path.join(dir, 'candidatos_pr.json'), 'utf8'))
);

describe('candidatos_pr.json', () => {
  it('parseia no schema e tem 66 candidatos', () => {
    expect(base.candidatos.length).toBe(66);
  });

  it('presidente Renan Santos 14, versao final-3', () => {
    expect(base.versao).toBe('final-3');
    const r = base.candidatos.find((c) => c.id === 'pr-pres-14')!;
    expect(r.cargo).toBe('Presidente');
    expect(r.nomeUrna).toBe('Renan Santos');
    expect(r.numero).toBe('14');
    expect(r.partido).toBe('MISSÃO');
    expect(r.bio.split(/\s+/).length).toBeLessThanOrEqual(60);
    expect(r.propostas.length).toBeLessThanOrEqual(3);
  });

  it('ids unicos', () => {
    const ids = base.candidatos.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('numero e string nao vazia e partido MISSÃO', () => {
    for (const c of base.candidatos) {
      expect(typeof c.numero).toBe('string');
      expect(c.numero.trim().length, c.id).toBeGreaterThan(0);
      expect(c.partido, c.id).toBe('MISSÃO');
    }
  });

  it('nenhum id proibido', () => {
    const ids = new Set(base.candidatos.map((c) => c.id));
    for (const proibido of ['pr-fed-1401', 'pr-est-14900', 'pr-est-14444']) {
      expect(ids.has(proibido), proibido).toBe(false);
    }
  });

  it('propostas com titulo resumo fonte nao vazios e fonte https', () => {
    for (const c of base.candidatos) {
      for (const p of c.propostas) {
        expect(p.titulo.trim().length, c.id).toBeGreaterThan(0);
        expect(p.resumo.trim().length, c.id).toBeGreaterThan(0);
        expect(p.fonte.trim().length, c.id).toBeGreaterThan(0);
        expect(p.fonte.startsWith('https://'), `${c.id} ${p.titulo}`).toBe(true);
      }
    }
  });

  it('fontes com url https', () => {
    for (const f of base.fontesGerais) {
      expect(f.url.startsWith('https://'), f.titulo).toBe(true);
    }
    for (const c of base.candidatos) {
      for (const f of c.fontes) {
        expect(f.url.startsWith('https://'), `${c.id} ${f.titulo}`).toBe(true);
      }
    }
  });

  it('nenhum texto proibido', () => {
    const texto = JSON.stringify(base).toLowerCase();
    for (const termo of [
      'pena de morte',
      'gaeco',
      'indefer',
      'sanepar',
      'justa causa',
      'peculato',
      'investiga',
    ]) {
      expect(texto, termo).not.toContain(termo);
    }
  });
});
