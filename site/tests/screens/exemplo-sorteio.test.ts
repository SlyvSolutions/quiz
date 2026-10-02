// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { CANDIDATOS, TAMANHO_MAX_EXEMPLO, sortearIndice, escolherExemplo } from '../../src/screens/inicio/exemplo-sorteio';
import type { Trecho } from '../../src/data/tipos';

function trecho(id: string, candidato: string, texto: string): Trecho {
  return {
    id, candidato_id: candidato, eixo: 'Segurança', arquivo: 'Plano.md',
    linha_inicio: 1, linha_fim: 2, texto_literal: texto, texto_mascarado: texto, hash_texto: 'abc',
  };
}

describe('sorteio do exemplo', () => {
  it('conhece os 5 candidatos', () => {
    expect(CANDIDATOS.map((c) => c.id).sort()).toEqual(['caiado', 'cury', 'flavio', 'lula', 'renan']);
  });

  it('sorteia dentro do total com rng viciado', () => {
    expect(sortearIndice(5, () => 0)).toBe(0);
    expect(sortearIndice(5, () => 0.999)).toBe(4);
    expect(sortearIndice(25, () => 0.5)).toBe(12);
  });

  it('escolhe trecho curto, sem tratamento especial para candidato, e junta as 5 avaliações do trecho', () => {
    const trechos = [trecho('a', 'lula', 'curto'), trecho('b', 'renan', 'x'.repeat(TAMANHO_MAX_EXEMPLO + 1)), trecho('c', 'renan', 'curto do nosso')];
    const comRng = (v: number) => () => v;
    const primeiro = escolherExemplo(trechos, comRng(0));
    expect(primeiro?.trecho.id).toBe('a');
    expect(primeiro?.nomeCandidato).toBe('Lula');
    expect('eDoMissao' in (primeiro ?? {})).toBe(false);
    expect(primeiro?.avaliacoes).toEqual([]);
    const avals = ['C1', 'C2', 'C3', 'C4', 'C5'].map((c) => ({ criterio_id: c, trecho_id: 'a', veredito: 'Parcial', justificativa: 'j', fonte: 'f' }));
    const outra = { criterio_id: 'C1', trecho_id: 'c', veredito: 'Viável', justificativa: 'j', fonte: 'f' };
    expect(escolherExemplo(trechos, comRng(0), [...avals, outra])?.avaliacoes).toHaveLength(5);
    expect(escolherExemplo(trechos, comRng(0.99), [...avals, outra])?.avaliacoes).toEqual([outra]);
    const ultimo = escolherExemplo(trechos, comRng(0.99));
    expect(ultimo?.trecho.id).toBe('c');
    expect(ultimo?.nomeCandidato).toBe('Renan Santos');
  });

  it('devolve null sem trecho exibível', () => {
    expect(escolherExemplo([trecho('a', 'lula', 'x'.repeat(900))], () => 0)).toBeNull();
  });
});
