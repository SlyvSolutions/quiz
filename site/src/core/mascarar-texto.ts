import { conferirMascara, type ResultadoMascara } from './mascara';
import { MARCADOR_MASCARA, mascararNomes } from './mascarar-nomes';
import { MARCADORES_ROTULO, mascararProgramas } from './rotulos-programas';

/**
 * A máscara única do projeto: identificadores diretos do autor viram [***] e nomes de programas e
 * marcas de campanha viram um rótulo neutro entre colchetes. Idempotente. Usada nos scripts de build
 * (texto_mascarado, contexto_mascarado) e, em tempo de execução, nas justificativas mostradas durante o quiz.
 */
export function mascararTexto(texto: string): string {
  return mascararProgramas(mascararNomes(texto));
}

/** Como conferirMascara, mas aceitando os rótulos de programas como ocultação (cada um vale por um [***]). */
export function conferirMascaraTexto(original: string, mascarado: string): ResultadoMascara {
  const base = MARCADORES_ROTULO.reduce((t, r) => t.split(r).join(MARCADOR_MASCARA), mascarado);
  return conferirMascara(original, base, MARCADOR_MASCARA);
}

export interface PedacoMascara {
  texto: string;
  marcado: boolean;
}

/** Quebra o texto mascarado em pedaços comuns e pedaços ocultos ([***] ou rótulo), para destacar na revelação. */
export function dividirMarcadores(mascarado: string): PedacoMascara[] {
  const marcadores = [MARCADOR_MASCARA, ...MARCADORES_ROTULO];
  const re = new RegExp(marcadores.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  const pedacos: PedacoMascara[] = [];
  let ultimo = 0;
  for (const m of mascarado.matchAll(re)) {
    if (m.index > ultimo) pedacos.push({ texto: mascarado.slice(ultimo, m.index), marcado: false });
    pedacos.push({ texto: m[0], marcado: true });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < mascarado.length) pedacos.push({ texto: mascarado.slice(ultimo), marcado: false });
  return pedacos.length > 0 ? pedacos : [{ texto: mascarado, marcado: false }];
}

/**
 * Termos do dicionário e identificadores diretos que ainda aparecem no texto (já mascarado ou não).
 * Lista vazia = nada a esconder. Usado pelos verificadores para falhar se um termo vazar.
 */
export function termosRemanescentes(texto: string): string[] {
  const achados: string[] = [];
  const mascarado = mascararTexto(texto);
  if (mascarado === texto) return achados;
  // Compara o texto original com o mascarado palavra a palavra para devolver os trechos trocados
  const r = conferirMascaraTexto(texto, mascarado);
  if (r.valido) achados.push(...r.ocultados);
  else achados.push(texto.slice(0, 80));
  return achados;
}
