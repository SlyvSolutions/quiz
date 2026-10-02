/** Lê um token de movimento do CSS, para que JS e CSS usem a mesma duração e a mesma curva. */
export function lerToken(nome: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--mq-${nome}`).trim();
}

const PADRAO_MS = 900;

export function lerDuracaoMs(nome: string, padrao = PADRAO_MS): number {
  const bruto = lerToken(nome);
  const n = parseFloat(bruto);
  if (Number.isNaN(n)) return padrao;
  return bruto.endsWith('ms') ? n : n * 1000;
}
