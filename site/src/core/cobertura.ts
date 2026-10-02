/**
 * Cobertura dos 5 critérios de um trecho: quantos foram avaliados de verdade (veredito diferente de
 * "Sem base para avaliar"). É a base da concretude mostrada no site.
 */

export const SEM_BASE = 'Sem base para avaliar';

/** Total de critérios de viabilidade por trecho. */
export const TOTAL_CRITERIOS = 5;

const VEREDITOS_AVALIADOS = new Set([
  'Viável',
  'Viável com condições',
  'Parcial',
  'Difícil',
  'Inviável nos termos propostos',
]);

export interface VereditoCriterio {
  criterio_id: string;
  veredito: string;
}

export interface Cobertura {
  avaliados: number;
  total: number;
}

/** Quantos dos 5 critérios têm veredito de verdade. "Sem base para avaliar" não conta como avaliado. */
export function cobertura(avaliacoes: VereditoCriterio[]): Cobertura {
  return { avaliados: avaliacoes.filter((a) => VEREDITOS_AVALIADOS.has(a.veredito)).length, total: TOTAL_CRITERIOS };
}
