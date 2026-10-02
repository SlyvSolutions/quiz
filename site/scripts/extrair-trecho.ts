import * as fs from 'node:fs';
// import * as path from 'node:path';
import { normalizarTexto } from '../src/core/normalizar-texto';

export interface ResultadoExtracao {
  linha_inicio: number;
  linha_fim: number;
  pagina_pdf: number | null;
}

export function localizarTrecho(conteudoOriginal: string, textoProcurado: string): ResultadoExtracao | null {
  const procuradoNorm = normalizarTexto(textoProcurado);
  if (!procuradoNorm) return null;

  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let patternStr = '';
  for (let i = 0; i < procuradoNorm.length; i++) {
    const char = procuradoNorm[i];
    if (char === ' ') {
      // Entre palavras vale espaço comum ou, sozinho em sua propria linha, um numero de pagina
      // ou um marcador de lista solto pela extracao do PDF
      // Um marcador de lista no inicio do proximo item tambem e tolerado (nao e conteudo)
      patternStr += '(?:\\s*[\\r\\n]+[ \\t]*(?:\\d{1,3}|[•▪●◦])[ \\t]*[\\r\\n]+\\s*|\\s+(?:[•▪●◦][ \\t]*)?)';
    } else {
      // Cada letra pode ser seguida por uma hifenização de fim de linha
      patternStr += escapeRegex(char!) + '(?:-\\s*[\\r\\n]+\\s*)?';
    }
  }

  // Regex case-sensitive, match across newlines
  const regex = new RegExp(patternStr);
  const match = regex.exec(conteudoOriginal);

  if (!match) return null;

  const trechoOriginal = match[0];
  const antesDoTrecho = conteudoOriginal.substring(0, match.index);

  // Conta quantas quebras de linha existem ANTES do trecho
  let linhaInicio = 1;
  for (let i = 0; i < antesDoTrecho.length; i++) {
    if (antesDoTrecho[i] === '\n') linhaInicio++;
  }

  // Conta quantas quebras de linha existem DENTRO do trecho original
  let quebrasDentro = 0;
  for (let i = 0; i < trechoOriginal.length; i++) {
    if (trechoOriginal[i] === '\n') quebrasDentro++;
  }

  const linhaFim = linhaInicio + quebrasDentro;

  // Encontrar a página PDF buscando números isolados antes de linhaInicio
  const linhasAntes = antesDoTrecho.split(/\r?\n/);
  let paginaPdf: number | null = null;
  // A última linha de linhasAntes é a parte da linha atual antes do match
  // Iteramos de trás para frente, ignorando a última que é parcial
  for (let i = linhasAntes.length - 2; i >= 0; i--) {
    const linhaStr = linhasAntes[i]!.trim();
    if (/^\d+$/.test(linhaStr)) {
      paginaPdf = parseInt(linhaStr, 10);
      break;
    }
  }

  return {
    linha_inicio: linhaInicio,
    linha_fim: linhaFim,
    pagina_pdf: paginaPdf
  };
}

if (process.argv[1] && process.argv[1].endsWith('extrair-trecho.ts')) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Uso: npx tsx scripts/extrair-trecho.ts <caminho_do_arquivo> "<texto_procurado>"');
    process.exit(1);
  }
  
  const arquivo = args[0];
  const textoProcurado = args[1];
  
  const conteudo = fs.readFileSync(arquivo!, 'utf-8');
  const resultado = localizarTrecho(conteudo.toString(), textoProcurado!);
  
  if (resultado) {
    console.log(JSON.stringify(resultado, null, 2));
    process.exit(0);
  } else {
    console.error('TRECHO_NAO_ENCONTRADO');
    process.exit(1);
  }
}
