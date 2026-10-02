import { cobertura, TOTAL_CRITERIOS, type VereditoCriterio } from './cobertura';

export interface AvaliacaoDeTrecho extends VereditoCriterio {
  trecho_id: string;
}

export interface ConcretudeCandidato {
  /** Média, em %, de quantos dos 5 critérios foram avaliados em cada trecho (0 a 100, inteiro). */
  percentual: number;
  /** Quantos trechos entraram na conta (os que têm avaliações). */
  trechos: number;
}

/**
 * Concretude dos planos de um candidato: média, entre os trechos dele, da fração de critérios avaliados (N de 5).
 * "Sem base para avaliar" não conta como avaliado. Sem nenhum trecho avaliado devolve null.
 */
export function concretudeDoCandidato(
  trechoIds: string[],
  avaliacoes: AvaliacaoDeTrecho[]
): ConcretudeCandidato | null {
  const fracoes: number[] = [];
  for (const id of trechoIds) {
    const dele = avaliacoes.filter((a) => a.trecho_id === id);
    if (dele.length === 0) continue;
    fracoes.push(cobertura(dele).avaliados / TOTAL_CRITERIOS);
  }
  if (fracoes.length === 0) return null;
  const media = fracoes.reduce((a, b) => a + b, 0) / fracoes.length;
  return { percentual: Math.round(media * 100), trechos: fracoes.length };
}
