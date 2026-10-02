export function embaralhar<T>(lista: T[], semente: number): T[] {
  if (!Number.isInteger(semente)) {
    throw new Error('A semente deve ser um número inteiro.');
  }

  if (lista.length === 0) {
    return [];
  }

  // Cria uma cópia da lista para não mutar a original
  const resultado = [...lista];

  // Gerador de Números Pseudo-Aleatórios (LCG)
  let seed = semente;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // Fisher-Yates shuffle
  for (let i = resultado.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [resultado[i], resultado[j]] = [resultado[j]!, resultado[i]!] as any;
  }

  return resultado;
}
