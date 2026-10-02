import { embaralhar, type Rng } from './sorteio-quiz';

/**
 * Ordem inicial dos planos no Teste cego.
 * Se a ordem guardada na sessão ainda é uma permutação dos planos atuais, ela é mantida (F5 não troca os cards).
 * Caso contrário (sessão antiga, dados mudaram), sorteia de novo com Fisher-Yates uniforme.
 * Os planos entram ordenados por apelido: o sorteio nunca parte de uma ordem ligada ao autor.
 */
export function ordemInicialTesteCego(planos: readonly string[], guardada: readonly string[] | undefined, rng: Rng): string[] {
  const unicos = [...new Set(planos)].sort();
  if (guardada && guardada.length === unicos.length && new Set(guardada).size === unicos.length && guardada.every((p) => unicos.includes(p))) {
    return [...guardada];
  }
  return embaralhar(unicos, rng);
}
