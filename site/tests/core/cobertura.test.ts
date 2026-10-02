import { describe, it, expect } from 'vitest';
import { cobertura } from '../../src/core/cobertura';

const SB = 'Sem base para avaliar';
const av = (veredito: string, criterio_id = 'C1') => ({ criterio_id, veredito });

describe('cobertura dos 5 critérios', () => {
  it('1 Viável + 4 Sem base: 1 de 5 avaliados', () => {
    expect(cobertura([av('Viável', 'C1'), av(SB, 'C2'), av(SB, 'C3'), av(SB, 'C4'), av(SB, 'C5')])).toEqual({ avaliados: 1, total: 5 });
  });

  it('5 Difícil: 5 de 5', () => {
    expect(cobertura(['C1', 'C2', 'C3', 'C4', 'C5'].map((c) => av('Difícil', c)))).toEqual({ avaliados: 5, total: 5 });
  });

  it('todos os níveis da escala contam como avaliados', () => {
    const niveis = ['Viável', 'Viável com condições', 'Parcial', 'Difícil', 'Inviável nos termos propostos'];
    expect(cobertura(niveis.map((n, i) => av(n, `C${i + 1}`)))).toEqual({ avaliados: 5, total: 5 });
  });

  it('5 Sem base: 0 de 5', () => {
    expect(cobertura(['C1', 'C2', 'C3', 'C4', 'C5'].map((c) => av(SB, c)))).toEqual({ avaliados: 0, total: 5 });
  });

  it('lista vazia: 0 de 5', () => {
    expect(cobertura([])).toEqual({ avaliados: 0, total: 5 });
  });

  it('veredito desconhecido não conta como avaliado', () => {
    expect(cobertura([av('Qualquer coisa')])).toEqual({ avaliados: 0, total: 5 });
  });
});
