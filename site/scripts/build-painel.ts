import * as fs from 'node:fs';
import * as path from 'node:path';

// Junta o "outro lado" de cada avaliação (pesquisa/contrapontos-viabilidade.json) ao avaliacoes.json
// por trecho_id|criterio_id. Nunca mexe em veredito, justificativa nem fonte: só acrescenta outro_lado.
// A palavra do arquivo de pesquisa é "contraponto"; no que vai para o site (site/src) o campo é
// outro_lado, porque o blueprint (BP-013) veta aquela palavra na tela e no código do site.

const CRITERIOS_VALIDOS = ['C1', 'C2', 'C3', 'C4', 'C5'];

export interface ContrapontoEntrada {
  chave: string;
  contraponto: string;
}

export interface AvaliacaoEntrada {
  trecho_id: string;
  criterio_id: string;
  veredito: string;
  justificativa: string;
  fonte: string;
  outro_lado?: string;
}

const ARQUIVO_PESQUISA = path.join(import.meta.dirname, '../../pesquisa/contrapontos-viabilidade.json');

export function carregarContrapontos(arquivo = ARQUIVO_PESQUISA): ContrapontoEntrada[] {
  const bruto = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));
  return (bruto.contrapontos as { chave: string; contraponto: string }[]).map((c) => ({
    chave: c.chave,
    contraponto: c.contraponto,
  }));
}

/**
 * Faz o join e devolve a lista de erros (vazia = ok). Só preenche outro_lado nas avaliações cujo
 * contraponto passou em todas as regras. Erros: ORFA, CRITERIO_INVALIDO, SEM_FONTE, SEM_CONTRAPONTO
 * e VEREDITO_DIVERGENTE (conclusão que cita um veredito diferente do publicado).
 */
export function juntarPainel(
  trechos: { id: string }[],
  avs: AvaliacaoEntrada[],
  contrapontos: ContrapontoEntrada[] = carregarContrapontos()
): string[] {
  const erros: string[] = [];
  const trechoIds = new Set(trechos.map((t) => t.id));
  const validos = new Map<string, string>();
  const recusados = new Set<string>();

  for (const cp of contrapontos) {
    const [trechoId, criterioId] = cp.chave.split('|');
    if (!trechoId || !trechoIds.has(trechoId)) {
      erros.push(`ORFA: ${cp.chave} — trecho_id '${trechoId}' não existe em trechos.json`);
      recusados.add(cp.chave);
    } else if (!criterioId || !CRITERIOS_VALIDOS.includes(criterioId)) {
      erros.push(`CRITERIO_INVALIDO: ${cp.chave} — criterio_id '${criterioId}' fora de C1 a C5`);
      recusados.add(cp.chave);
    } else if (!cp.contraponto.includes('(Fonte:')) {
      erros.push(`SEM_FONTE: ${cp.chave} — o texto não traz '(Fonte:' no corpo; volta para a pesquisa`);
      recusados.add(cp.chave);
    } else {
      validos.set(cp.chave, cp.contraponto);
    }
  }

  for (const av of avs) {
    const chave = `${av.trecho_id}|${av.criterio_id}`;
    const texto = validos.get(chave);
    if (texto === undefined) {
      if (!recusados.has(chave)) erros.push(`SEM_CONTRAPONTO: ${chave} — a avaliação não tem texto de pesquisa`);
      continue;
    }
    const citado = texto.match(/veredito '([^']+)'/)?.[1];
    if (citado !== undefined && citado !== av.veredito) {
      erros.push(`VEREDITO_DIVERGENTE: ${chave} cita '${citado}', o painel tem '${av.veredito}' — re-revisar antes de publicar`);
      continue;
    }
    av.outro_lado = texto;
  }

  return erros;
}

if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test') {
  const dataDir = path.join(import.meta.dirname, '../public/data');
  const trechos = JSON.parse(fs.readFileSync(path.join(dataDir, 'trechos.json'), 'utf-8'));
  const caminho = path.join(dataDir, 'avaliacoes.json');
  const avs: AvaliacaoEntrada[] = JSON.parse(fs.readFileSync(caminho, 'utf-8'));
  // Parte sempre do avaliacoes.json sem outro_lado, para o resultado não depender de rodadas anteriores
  for (const a of avs) delete a.outro_lado;

  const erros = juntarPainel(trechos, avs);
  if (erros.length > 0) {
    console.error(`Join do outro lado falhou (${erros.length} erros). avaliacoes.json NÃO foi alterado.`);
    erros.forEach((e) => console.error(e));
    process.exit(1);
  }

  const saida = JSON.stringify(avs, null, 2);
  if (process.argv.includes('--escrever')) {
    fs.writeFileSync(caminho, saida);
    console.log(`Join concluído: ${avs.length} avaliações com outro_lado. Rode npm run manifesto (BP-008).`);
  } else if (fs.readFileSync(caminho, 'utf-8').trim() !== saida.trim()) {
    console.error('avaliacoes.json não está em dia com a pesquisa. Rode: npm run painel, depois npm run manifesto.');
    process.exit(1);
  } else {
    console.log(`Join conferido: ${avs.length} avaliações com outro_lado, em dia com a pesquisa.`);
  }
}
