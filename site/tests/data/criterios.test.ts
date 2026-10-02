import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CriteriosSchema } from '../../src/data/tipos';

const dados = CriteriosSchema.parse(
  JSON.parse(readFileSync('public/data/criterios.json', 'utf-8'))
);

describe('criterios.json (T-026)', () => {
  it('tem cinco critérios com ids únicos', () => {
    const ids = dados.criterios.map((c) => c.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('cada critério define todos os níveis da escala, e só eles', () => {
    for (const c of dados.criterios) {
      expect(Object.keys(c.niveis).sort()).toEqual([...dados.escala].sort());
    }
  });

  it('a escala termina em "Sem base para avaliar" e não tem duplicata', () => {
    expect(dados.escala.at(-1)).toBe('Sem base para avaliar');
    expect(new Set(dados.escala).size).toBe(dados.escala.length);
  });

  it('não cita candidato nem partido (régua igual para todos)', () => {
    const texto = JSON.stringify(dados.criterios).toLowerCase();
    for (const nome of ['lula', 'flávio', 'flavio', 'caiado', 'cury', 'renan', 'missão']) {
      expect(texto).not.toContain(nome);
    }
  });
});
