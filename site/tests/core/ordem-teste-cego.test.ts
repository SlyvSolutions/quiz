import { describe, it, expect } from 'vitest';
import { ordemInicialTesteCego } from '../../src/core/ordem-teste-cego';

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PLANOS = ['Candidato A', 'Candidato B', 'Candidato C', 'Candidato D', 'Candidato E'];

describe('ordemInicialTesteCego', () => {
  it('sorteia uma permutação dos planos usando o rng recebido', () => {
    const ordem = ordemInicialTesteCego(PLANOS, undefined, mulberry32(1));
    expect([...ordem].sort()).toEqual([...PLANOS].sort());
  });

  it('o resultado nao depende da ordem em que os planos chegam (nada derivado do autor)', () => {
    const a = ordemInicialTesteCego(PLANOS, undefined, mulberry32(7));
    const b = ordemInicialTesteCego([...PLANOS].reverse(), undefined, mulberry32(7));
    expect(a).toEqual(b);
  });

  it('chamadas com rngs diferentes dao ordens diferentes', () => {
    const vistas = new Set<string>();
    for (let s = 1; s <= 30; s++) vistas.add(ordemInicialTesteCego(PLANOS, undefined, mulberry32(s)).join('|'));
    expect(vistas.size).toBeGreaterThan(10);
  });

  it('ordem guardada valida é mantida sem consumir o rng (F5)', () => {
    const guardada = ['Candidato C', 'Candidato A', 'Candidato E', 'Candidato B', 'Candidato D'];
    const rng = () => {
      throw new Error('nao deveria sortear');
    };
    expect(ordemInicialTesteCego(PLANOS, guardada, rng)).toEqual(guardada);
  });

  it('ordem guardada invalida (incompleta, repetida ou com plano desconhecido) é sorteada de novo', () => {
    for (const ruim of [['Candidato A'], ['Candidato A', 'Candidato A', 'Candidato B', 'Candidato C', 'Candidato D'], ['x', ...PLANOS.slice(1)], []]) {
      const ordem = ordemInicialTesteCego(PLANOS, ruim, mulberry32(3));
      expect([...ordem].sort()).toEqual([...PLANOS].sort());
    }
  });

  it('sem viés de posição: em 1000 sorteios cada plano cai em cada posição perto de 1/5', () => {
    const rng = mulberry32(2026);
    const cont = PLANOS.map(() => PLANOS.map(() => 0));
    const N = 1000;
    for (let i = 0; i < N; i++) {
      ordemInicialTesteCego(PLANOS, undefined, rng).forEach((p, pos) => {
        cont[PLANOS.indexOf(p)]![pos]!++;
      });
    }
    for (const linha of cont) for (const c of linha) {
      expect(c / N).toBeGreaterThan(0.16);
      expect(c / N).toBeLessThan(0.24);
    }
  });
});
