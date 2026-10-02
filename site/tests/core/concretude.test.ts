import { describe, it, expect } from 'vitest';
import { concretudeDoCandidato } from '../../src/core/concretude';

const SB = 'Sem base para avaliar';
const av = (trecho_id: string, criterio_id: string, veredito: string) => ({ trecho_id, criterio_id, veredito });
const trecho = (id: string, vs: string[]) => vs.map((v, i) => av(id, `C${i + 1}`, v));

describe('concretude dos planos do candidato', () => {
  it('média da fração de critérios avaliados por trecho, em %', () => {
    const avs = [
      ...trecho('a', ['Viável', 'Parcial', SB, SB, SB]), // 2 de 5
      ...trecho('b', ['Viável', 'Parcial', 'Difícil', 'Viável', SB]), // 4 de 5
    ];
    expect(concretudeDoCandidato(['a', 'b'], avs)).toEqual({ percentual: 60, trechos: 2 });
  });

  it('Sem base não conta como avaliado', () => {
    expect(concretudeDoCandidato(['a'], trecho('a', [SB, SB, SB, SB, SB]))).toEqual({ percentual: 0, trechos: 1 });
  });

  it('trecho sem avaliações fica fora da conta', () => {
    const avs = trecho('a', ['Viável', 'Viável', 'Viável', 'Viável', 'Viável']);
    expect(concretudeDoCandidato(['a', 'sem-aval'], avs)).toEqual({ percentual: 100, trechos: 1 });
  });

  it('sem nenhum trecho avaliado devolve null', () => {
    expect(concretudeDoCandidato(['x'], [])).toBeNull();
    expect(concretudeDoCandidato([], trecho('a', ['Viável']))).toBeNull();
  });
});
