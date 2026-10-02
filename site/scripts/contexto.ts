import { normalizarTexto } from '../src/core/normalizar-texto';

/**
 * Amplia um trecho para o parágrafo do plano original em volta dele, com uma regra única para todos os
 * candidatos: o(s) parágrafo(s) que contém(êm) o trecho e, se ainda for curto, os vizinhos, até o teto.
 * O texto continua literal: só se juntam linhas, se tiram os números de página e se colapsam os espaços.
 */

export interface Contexto {
  texto: string;
  linha_inicio: number;
  linha_fim: number;
}

export interface OpcoesContexto {
  minimo?: number;
  maximo?: number;
}

interface Paragrafo {
  ini: number; // linha (1-indexada) do primeiro texto
  fim: number;
  texto: string;
  titulo: boolean;
}

const PAGINA = /^\s*\d{1,3}\s*$/;
const FIM_DE_FRASE = /[.!?…:;"”)\]]\s*$/;
const JANELA = 80; // linhas para cada lado do trecho

export function ehLinhaDePagina(linha: string): boolean {
  return PAGINA.test(linha);
}

/** Linhas do arquivo sem os números de página soltos (usado ao montar e ao conferir o contexto). */
export function semNumerosDePagina(linhas: string[]): string[] {
  return linhas.filter((l) => !ehLinhaDePagina(l));
}

/** Depois de linhas em branco vem um número de página e a frase continua em minúscula: é o mesmo parágrafo. */
function continuaAposQuebraDePagina(linhas: string[], de: number, ultimaLinha: string, ate: number): boolean {
  if (FIM_DE_FRASE.test(ultimaLinha)) return false;
  let viuPagina = false;
  for (let n = de; n <= ate; n++) {
    const l = linhas[n - 1] ?? '';
    if (l.trim() === '') continue;
    if (ehLinhaDePagina(l)) {
      viuPagina = true;
      continue;
    }
    return viuPagina && /^\s*[a-zà-ú]/.test(l);
  }
  return false;
}

function paragrafosDaJanela(linhas: string[], de: number, ate: number): Paragrafo[] {
  const saida: Paragrafo[] = [];
  let atual: { ini: number; fim: number; partes: string[] } | null = null;
  let quebrouPagina = false;

  const fechar = () => {
    if (!atual) return;
    const texto = normalizarTexto(atual.partes.join('\n'));
    const palavras = texto.split(' ').length;
    saida.push({
      ini: atual.ini,
      fim: atual.fim,
      texto,
      titulo: atual.partes.length <= 2 && palavras <= 14 && !FIM_DE_FRASE.test(texto),
    });
    atual = null;
  };

  for (let n = de; n <= ate; n++) {
    const linha = linhas[n - 1] ?? '';
    if (ehLinhaDePagina(linha)) {
      quebrouPagina = true;
      if (atual) atual.fim = n;
      continue;
    }
    if (linha.trim() === '') {
      // Linha em branco fecha o parágrafo, exceto se uma quebra de página cortou a frase ao meio
      if (atual && !continuaAposQuebraDePagina(linhas, n, atual.partes[atual.partes.length - 1] ?? '', ate)) fechar();
      continue;
    }
    if (atual && quebrouPagina && FIM_DE_FRASE.test(atual.partes[atual.partes.length - 1] ?? '')) fechar();
    quebrouPagina = false;
    if (!atual) atual = { ini: n, fim: n, partes: [] };
    atual.partes.push(linha);
    atual.fim = n;
  }
  fechar();
  return saida;
}

function frases(texto: string): string[] {
  return texto.split(/(?<=[.!?…])\s+(?=[A-ZÀ-Ú"“0-9])/);
}

/** Recorta em fronteira de frase, mantendo o trecho dentro. */
function recortarPorFrase(texto: string, trecho: string, maximo: number): string {
  if (texto.length <= maximo) return texto;
  const lista = frases(texto);
  const alvoNorm = normalizarTexto(trecho);
  let ini = lista.findIndex((f) => alvoNorm.includes(f) || f.includes(alvoNorm.slice(0, 40)));
  if (ini < 0) ini = 0;
  let fim = ini;
  const juntar = () => lista.slice(ini, fim + 1).join(' ');
  // Alterna: uma frase depois, uma antes, até bater no teto ou nas bordas
  let deuCerto = true;
  while (deuCerto) {
    deuCerto = false;
    if (fim + 1 < lista.length && lista.slice(ini, fim + 2).join(' ').length <= maximo) {
      fim++;
      deuCerto = true;
    }
    if (ini > 0 && lista.slice(ini - 1, fim + 1).join(' ').length <= maximo) {
      ini--;
      deuCerto = true;
    }
  }
  return juntar();
}

export function expandirContexto(
  linhas: string[],
  linhaInicio: number,
  linhaFim: number,
  trecho: string,
  { minimo = 650, maximo = 1300 }: OpcoesContexto = {}
): Contexto {
  const de = Math.max(1, linhaInicio - JANELA);
  const ate = Math.min(linhas.length, linhaFim + JANELA);
  const ps = paragrafosDaJanela(linhas, de, ate);

  let a = ps.findIndex((p) => p.fim >= linhaInicio && p.ini <= linhaFim);
  if (a < 0) throw new Error(`Nenhum parágrafo cobre as linhas ${linhaInicio}-${linhaFim}`);
  let b = a;
  for (let i = a; i < ps.length; i++) if (ps[i]!.ini <= linhaFim) b = i;

  const tamanho = () => ps.slice(a, b + 1).map((p) => p.texto).join(' ').length;

  // Cresce para os vizinhos, sem atravessar título e sem passar do teto
  let avancar = true;
  while (tamanho() < minimo) {
    const proximo = avancar ? ps[b + 1] : ps[a - 1];
    const ok = proximo && !proximo.titulo && tamanho() + proximo.texto.length + 1 <= maximo;
    if (ok) {
      if (avancar) b++;
      else a--;
    } else if (avancar) {
      avancar = false; // acabou para frente: tenta para trás
      if (!(ps[a - 1] && !ps[a - 1]!.titulo)) break;
    } else {
      break;
    }
  }

  // Título logo acima entra como abertura do contexto
  const anterior = ps[a - 1];
  if (anterior?.titulo) a--;

  const selecionados = ps.slice(a, b + 1).map((p) => p.texto);
  const tamanhoTotal = selecionados.join(' ').length;
  let texto: string;
  if (tamanhoTotal <= maximo) texto = selecionados.join('\n\n');
  else if (selecionados.length === 1) texto = recortarPorFrase(selecionados[0]!, trecho, maximo);
  else texto = recortarPorFrase(selecionados.join(' '), trecho, maximo);
  return { texto, linha_inicio: ps[a]!.ini, linha_fim: ps[b]!.fim };
}
