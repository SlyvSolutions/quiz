const MODULO = 2147483647;

// Seed positivo válido passa como está (mantém a ordem já publicada); negativo, zero ou grande demais é normalizado
function normalizarSeed(seed: number): number {
  const n = Math.trunc(seed);
  if (n > 0 && n < MODULO) return n;
  return (Math.abs(n) % (MODULO - 1)) + 1;
}

/**
 * Embaralha uma cópia do array usando Fisher-Yates.
 * Pode receber um seed opcional simples (para fins de reproducibilidade leve, não criptográfico).
 * O seed pode ser negativo ou zero (vem de hash): é normalizado para 1..MODULO-1.
 */
export function shuffleArray<T>(array: T[], seed?: number): T[] {
  const result = [...array];

  // Um pseudo-random generator básico se tiver semente
  let currentSeed = seed !== undefined ? normalizarSeed(seed) : 0;
  const random = () => {
    if (seed !== undefined) {
      currentSeed = (currentSeed * 16807) % MODULO;
      return (currentSeed - 1) / (MODULO - 1);
    }
    return Math.random();
  };

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const a = result[i] as T;
    const b = result[j] as T;
    result[i] = b;
    result[j] = a;
  }
  return result;
}
