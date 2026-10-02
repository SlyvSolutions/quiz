import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CriteriosSchema } from '../../src/data/tipos';
import { formatarDataPublicacao, niveisEmOrdem, numeroDaSecao } from '../../src/screens/metodo/criterios';

const dados = CriteriosSchema.parse(JSON.parse(readFileSync('public/data/criterios.json', 'utf-8')));

describe('niveisEmOrdem', () => {
  it('segue a ordem da escala publicada, do critério real', () => {
    for (const c of dados.criterios) {
      expect(niveisEmOrdem(dados.escala, c.niveis).map((n) => n.nivel)).toEqual(dados.escala);
    }
  });

  it('omite nível da escala sem texto e põe nível desconhecido no fim', () => {
    const r = niveisEmOrdem(['A', 'B', 'C'], { C: 'c', X: 'x', A: 'a' });
    expect(r).toEqual([
      { nivel: 'A', texto: 'a' },
      { nivel: 'C', texto: 'c' },
      { nivel: 'X', texto: 'x' },
    ]);
  });
});

describe('formatarDataPublicacao', () => {
  it('mostra a data no horário de Brasília', () => {
    expect(formatarDataPublicacao('2026-09-28T21:00:00-03:00')).toBe('28/09/2026');
    expect(formatarDataPublicacao('2026-09-29T01:30:00Z')).toBe('28/09/2026');
  });

  it('devolve o texto original quando a data é inválida', () => {
    expect(formatarDataPublicacao('não é data')).toBe('não é data');
  });
});

describe('numeroDaSecao', () => {
  it('usa dois dígitos', () => {
    expect(numeroDaSecao(1)).toBe('01');
    expect(numeroDaSecao(12)).toBe('12');
  });
});
