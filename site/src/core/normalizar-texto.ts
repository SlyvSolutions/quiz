export function normalizarTexto(texto: string): string {
  if (!texto) return '';

  return texto
    // Remove hifenização de fim de linha (ex: "pala-\n vra" -> "palavra")
    // Pega um hífen seguido de espaços/tabs, uma quebra de linha, e mais espaços/tabs no início da próxima linha
    .replace(/-\s*[\r\n]+\s*/g, '')
    // Substitui as quebras de linha restantes por espaço
    .replace(/[\r\n]+/g, ' ')
    // Colapsa múltiplos espaços (incluindo tabs) em um único espaço
    .replace(/\s+/g, ' ')
    // Remove espaços no início e no fim
    .trim();
}
