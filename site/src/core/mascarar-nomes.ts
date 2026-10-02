export const MARCADOR_MASCARA = '[***]';

/**
 * Identificadores diretos do autor que o eleitor não pode ler na hora de escolher (política de máscara).
 * Ordem importa: o que carrega o autor em bloco (cabeçalhos, rodapés, descrições) vem antes dos nomes soltos,
 * e os nomes compostos vêm antes dos simples. Tudo vira [***]. Programas e marcas de campanha NÃO entram aqui:
 * têm rótulo neutro próprio em rotulos-programas.ts.
 *
 * Leis, artigos da Constituição, números de norma, instituições públicas genéricas (STF, BNDES, SUS, INSS...)
 * e siglas de órgãos ficam de fora de propósito.
 */
const PADROES: RegExp[] = [
  // Cabeçalhos e rodapés que carregam o autor: o marcador substitui o bloco inteiro, sem deixar o cabeçalho à vista
  /Plano de Governo 2027 a 2030\s*·[^\n]*?Kassab/g,
  /LIVRO AMARELO\s*[-–]\s*(?:MISSÃO|Missão)\s*2026/g,
  /PROPOSTAS\s+E\s+SOLUÇÕES\s+DA\s+(?:MISSÃO|Missão)/g,
  /P\s+R\s+O\s+G\s+R\s+A\s+M\s+A\s+D\s+E\s+G\s+O?\s*V\s+E\s+R\s+N\s+O/g,
  /\bLivro Amarelo\b/gi,
  // Instituto do próprio autor
  /Centro de Debate de Políticas Públicas(?:\s*\(CDPP\))?|\bCDPP\b/g,
  // Descrição que aponta o candidato mesmo depois de mascarar o nome
  /senador e futuro presidente do Brasil(?:,\s*(?:Flávio Bolsonaro|Flávio|Bolsonaro))?/g,
  // Autorreferência de quem governa ou vai governar
  /(?<![\p{L}])(?:nosso governo|nossa gestão|atual gestão|próxima gestão|nosso mandato|neste mandato|(?:atual|próximo|novo) mandato)(?![\p{L}])/giu,
  // Nomes de candidatos
  /Luiz Inácio Lula da Silva|Lula da Silva|Lula/g,
  /Flávio Bolsonaro|Bolsonaro|Flávio/g,
  /Ronaldo Caiado|Caiado/g,
  /Augusto Cury|Cury/g,
  /Renan Santos|Renan/g,
  // Nomes de políticos ligados aos planos
  /Gilberto Kassab|Kassab/g,
  /Kim Kataguiri|Kataguiri/g,
  // Estado-sede do autor
  /(?<![\p{L}])(?:Goiás|goian[oa]s?)(?![\p{L}])/gu,
  // Nome e sigla dos partidos
  /Partido dos Trabalhadores|Partido Liberal|Partido Missão|União Brasil/g,
  // O nome do partido sozinho, só como nome próprio (Missão ou MISSÃO): a palavra comum "missão" fica
  /\b(?:Missão|MISSÃO)\b/g,
  /\b(?:PT|PL|PSDB|MDB|PSD|PP|PSB|PDT|PSOL|Republicanos)\b/g,
];

/** Troca identificadores diretos do autor (nomes, partidos, cabeçalhos, autorreferência) por [***]. Não altera mais nada. */
export function mascararNomes(texto: string): string {
  return PADROES.reduce((t, p) => t.replace(p, MARCADOR_MASCARA), texto);
}
