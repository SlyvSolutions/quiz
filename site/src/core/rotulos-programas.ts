import dicionario from '../data/rotulos-programas.json';

/**
 * Dicionário versionado de nomes de programas e marcas de campanha, igual para os 5 candidatos.
 * Cada entrada: padrão (regex), flags e rótulo neutro descritivo. NÃO há campo de candidato aqui:
 * este arquivo vai para o bundle do site. O mapeamento termo -> candidato, para auditoria, fica em
 * docs/avaliacao/mascara-programas-auditoria.json.
 *
 * Para estender: acrescente uma entrada em src/data/rotulos-programas.json (id único, padrão, flags com "u",
 * rótulo descritivo que não nomeie o autor) e uma linha no arquivo de auditoria; os testes conferem os dois.
 */
export interface RotuloPrograma {
  id: string;
  padrao: string;
  flags: string;
  rotulo: string;
}

export const ROTULOS_PROGRAMAS: readonly RotuloPrograma[] = dicionario;

const COMPILADOS = ROTULOS_PROGRAMAS.map((e) => ({ re: new RegExp(e.padrao, e.flags), marcado: `[${e.rotulo}]` }));

/** Troca nomes de programas e marcas de campanha pelo rótulo neutro entre colchetes. Não toca em mais nada. */
export function mascararProgramas(texto: string): string {
  return COMPILADOS.reduce((t, c) => t.replace(c.re, c.marcado), texto);
}

/** Os rótulos como aparecem no texto mascarado, com colchetes. */
export const MARCADORES_ROTULO: readonly string[] = COMPILADOS.map((c) => c.marcado);
