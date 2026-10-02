import * as fs from 'node:fs';
import * as path from 'node:path';

// Gera avaliacoes.json (trechos do teste cego e do Comparador) e avaliacoes_demo.json (exemplo do
// início) a partir das avaliações finais em docs/avaliacao/final. O texto dos trechos não muda; só as
// avaliações. Só os cinco campos publicáveis saem.

export interface AvaliacaoFinal {
  criterio_id: string;
  trecho_id: string;
  veredito: string;
  justificativa: string;
  fonte: string;
  [extra: string]: unknown;
}

export interface AvaliacaoPublicada {
  criterio_id: string;
  trecho_id: string;
  veredito: string;
  justificativa: string;
  fonte: string;
}

const CRITERIOS = ['C1', 'C2', 'C3', 'C4', 'C5'];

function publicar(a: AvaliacaoFinal): AvaliacaoPublicada {
  return {
    criterio_id: a.criterio_id,
    trecho_id: a.trecho_id,
    veredito: a.veredito,
    justificativa: a.justificativa,
    fonte: a.fonte,
  };
}

/** Cada trecho recebe exatamente 5 avaliações (C1 a C5), na ordem dos ids e dos critérios. */
function paraTrechos(final: AvaliacaoFinal[], ids: string[]): AvaliacaoPublicada[] {
  const saida: AvaliacaoPublicada[] = [];
  for (const id of ids) {
    const dele = final.filter((a) => a.trecho_id === id);
    const criterios = dele.map((a) => a.criterio_id).sort();
    if (criterios.join(',') !== CRITERIOS.join(',')) {
      throw new Error(`O trecho '${id}' precisa de exatamente 5 avaliações (${CRITERIOS.join(', ')}); tem '${criterios.join(', ')}'.`);
    }
    for (const c of CRITERIOS) saida.push(publicar(dele.find((a) => a.criterio_id === c)!));
  }
  return saida;
}

export function montarAvaliacoesPublicadas(final: AvaliacaoFinal[], idsTrechos: string[], idsDemo: string[]) {
  const conhecidos = new Set([...idsTrechos, ...idsDemo]);
  const orfas = [...new Set(final.map((a) => a.trecho_id))].filter((id) => !conhecidos.has(id));
  if (orfas.length > 0) throw new Error(`Há avaliação de trecho que não existe: ${orfas.join(', ')}.`);
  return {
    avaliacoes: paraTrechos(final, idsTrechos),
    demo: paraTrechos(final, idsDemo),
  };
}

// Sob o vite-node o process.argv não traz o caminho do script: a guarda é por ambiente
if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test') {
  const raiz = path.join(import.meta.dirname, '../..');
  const dados = path.join(import.meta.dirname, '../public/data');
  const ler = <T>(caminho: string): T => JSON.parse(fs.readFileSync(caminho, 'utf-8')) as T;

  const final = ler<AvaliacaoFinal[]>(path.join(raiz, 'docs/avaliacao/final/avaliacoes-final.json'));
  const idsTrechos = ler<{ id: string }[]>(path.join(dados, 'trechos.json')).map((t) => t.id);
  const idsDemo = ler<{ id: string }[]>(path.join(dados, 'trechos_demo.json')).map((t) => t.id);

  const r = montarAvaliacoesPublicadas(final, idsTrechos, idsDemo);
  fs.writeFileSync(path.join(dados, 'avaliacoes.json'), JSON.stringify(r.avaliacoes, null, 2) + '\n');
  fs.writeFileSync(path.join(dados, 'avaliacoes_demo.json'), JSON.stringify(r.demo, null, 2) + '\n');
  console.log(`✅ avaliações: ${r.avaliacoes.length} dos trechos do site e ${r.demo.length} do demo.`);
}
