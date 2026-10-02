/** Funções puras da página Método e Fontes: organizam os dados de criterios.json para a tela. */

export interface NivelDeCriterio {
  nivel: string;
  texto: string;
}

/**
 * Devolve os níveis de um critério na ordem da escala publicada (do mais favorável a "Sem base para avaliar").
 * Nível que a escala não conhece vai para o fim, para não sumir da tela; nível da escala sem texto é omitido.
 */
export function niveisEmOrdem(escala: readonly string[], niveis: Readonly<Record<string, string>>): NivelDeCriterio[] {
  const conhecidos = escala.filter((n) => n in niveis).map((n) => ({ nivel: n, texto: niveis[n] ?? '' }));
  const extras = Object.keys(niveis)
    .filter((n) => !escala.includes(n))
    .map((n) => ({ nivel: n, texto: niveis[n] ?? '' }));
  return [...conhecidos, ...extras];
}

/** "2026-09-28T21:00:00-03:00" vira "28/09/2026" (horário de Brasília). Data inválida volta como veio. */
export function formatarDataPublicacao(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/** Número da seção com dois dígitos: 1 vira "01". */
export function numeroDaSecao(posicao: number): string {
  return String(posicao).padStart(2, '0');
}
