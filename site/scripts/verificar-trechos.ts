import * as fs from 'node:fs';
import * as path from 'node:path';
import { normalizarTexto } from '../src/core/normalizar-texto';
import type { Trecho } from '../src/data/tipos';
import { semNumerosDePagina } from './contexto';

// Função exportada para facilitar os testes
export function validarTrechos(
  trechos: Trecho[], 
  leitor: (arquivo: string) => string | null
): string[] {
  const erros: string[] = [];

  for (const t of trechos) {
    const conteudo = leitor(t.arquivo);
    if (conteudo === null) {
      erros.push(`[${t.id}] ARQUIVO_INEXISTENTE: ${t.arquivo}`);
      continue;
    }

    // Dividimos o arquivo em linhas (1-indexed no JSON, 0-indexed no array)
    const linhas = conteudo.split(/\r?\n/);
    
    const inicioIdx = Math.max(0, t.linha_inicio - 1);
    const fimIdx = Math.min(linhas.length, t.linha_fim);
    const trechoDoArquivo = linhas.slice(inicioIdx, fimIdx).join('\n');

    const normOriginal = normalizarTexto(trechoDoArquivo);
    const normLiteral = normalizarTexto(t.texto_literal);

    if (!normOriginal.includes(normLiteral)) {
      erros.push(`[${t.id}] TRECHO_NAO_ENCONTRADO: O trecho '${t.texto_literal.substring(0, 30)}...' não foi encontrado no arquivo ${t.arquivo} entre as linhas ${t.linha_inicio} e ${t.linha_fim}`);
    }

    // Contexto ampliado: tem de existir no arquivo (sem os números de página) e conter o trecho
    if (t.contexto_literal) {
      const ci = Math.max(0, (t.contexto_linha_inicio ?? t.linha_inicio) - 1);
      const cf = Math.min(linhas.length, t.contexto_linha_fim ?? t.linha_fim);
      const normArquivo = normalizarTexto(semNumerosDePagina(linhas.slice(ci, cf)).join('\n'));
      const normContexto = normalizarTexto(t.contexto_literal);
      if (!normArquivo.includes(normContexto)) {
        erros.push(`[${t.id}] CONTEXTO_NAO_ENCONTRADO: o contexto não está em ${t.arquivo} entre as linhas ${ci + 1} e ${cf}`);
      }
      if (!normContexto.includes(normLiteral)) {
        erros.push(`[${t.id}] CONTEXTO_SEM_TRECHO: o contexto não contém o trecho`);
      }
    }
  }

  return erros;
}

// Execução no CLI (evitado no ambiente de testes)
if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test') {
  console.log('Verificando integridade dos trechos no Markdown...');
  
  // Como roda dentro de "site", o raiz dos planos fica em "../Planos_TSE"
  const repoRoot = path.join(import.meta.dirname, '../../Planos_TSE');
  const trechosPath = path.join(import.meta.dirname, '../public/data/trechos.json');

  if (!fs.existsSync(trechosPath)) {
    console.error('ARQUIVO_INEXISTENTE: O arquivo de trechos não foi encontrado em ' + trechosPath);
    // Ignoramos a falha silenciosamente ou falhamos? Como a build pipeline precisa rodar, 
    // se não tem JSON, falha.
    process.exit(1);
  }

  let trechos: Trecho[];
  try {
    trechos = JSON.parse(fs.readFileSync(trechosPath, 'utf-8'));
  } catch (e: any) {
    console.error('Erro ao parsear trechos.json:', e.message);
    process.exit(1);
  }

  const leitor = (arquivo: string) => {
    const p = path.join(repoRoot, arquivo);
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf-8');
  };

  const erros = validarTrechos(trechos, leitor);

  if (erros.length > 0) {
    console.error('❌ Falha na validação de trechos (código != 0):');
    erros.forEach(e => console.error(e));
    process.exit(1);
  } else {
    console.log('✅ Todos os trechos encontrados e validados com sucesso.');
    process.exit(0);
  }
}
