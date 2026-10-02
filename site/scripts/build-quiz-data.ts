import * as fs from 'node:fs';
import * as path from 'node:path';
import crypto from 'node:crypto';
import { localizarTrecho } from './extrair-trecho';
import { expandirContexto } from './contexto';
import { mascararTexto } from '../src/core/mascarar-texto';

// Gera os quatro arquivos que o quiz por subtemas lê (subtemas, trechos_quiz, planos_cegos_quiz e
// avaliacoes_quiz) a partir dos trechos escolhidos e das avaliações finais em docs/avaliacao.
// Texto literal, linhas, página, hash, máscara e contexto saem do plano original, como no teste cego.

/** Os 15 subtemas aprovados (3 por assunto). O enunciado de cada um vem dos arquivos de trechos. */
export const SUBTEMAS: { id: string; eixo: string; nome: string }[] = [
  { id: 'seguranca-prisional', eixo: 'Segurança', nome: 'Sistema prisional' },
  { id: 'seguranca-fronteiras', eixo: 'Segurança', nome: 'Fronteiras, portos e aeroportos' },
  { id: 'seguranca-inteligencia', eixo: 'Segurança', nome: 'Inteligência, dados e tecnologia policial' },
  { id: 'economia-minerais-criticos', eixo: 'Economia', nome: 'Minerais críticos e terras raras' },
  { id: 'economia-agro', eixo: 'Economia', nome: 'Agro: crédito, seguro e valor agregado' },
  { id: 'economia-regra-fiscal', eixo: 'Economia', nome: 'Regra fiscal e controle de gastos' },
  { id: 'educacao-ensino-superior', eixo: 'Educação', nome: 'Ensino superior' },
  { id: 'educacao-alfabetizacao', eixo: 'Educação', nome: 'Alfabetização na idade certa' },
  { id: 'educacao-tempo-integral', eixo: 'Educação', nome: 'Escola em tempo integral' },
  { id: 'reformas-pacto-federativo', eixo: 'Reformas', nome: 'Pacto federativo' },
  { id: 'reformas-sistema-politico', eixo: 'Reformas', nome: 'Sistema político e eleitoral' },
  { id: 'reformas-governo-digital', eixo: 'Reformas', nome: 'Governo digital e desburocratização' },
  { id: 'saude-filas-regulacao', eixo: 'Saúde', nome: 'Filas e regulação de especialistas' },
  { id: 'saude-prontuario-eletronico', eixo: 'Saúde', nome: 'Prontuário eletrônico único' },
  { id: 'saude-atencao-primaria', eixo: 'Saúde', nome: 'Atenção primária e fixação de profissionais' },
];

export interface TrechoEscolhido {
  subtema_id: string;
  candidato_id: string;
  arquivo: string;
  /** texto literal exato, como está no plano original */
  query: string;
}

export interface EntradaQuiz {
  novos: { trechos: TrechoEscolhido[]; enunciados: Record<string, string> }[];
  /** avaliações finais; só os cinco campos publicados são copiados */
  avaliacoes: {
    criterio_id: string;
    trecho_id: string;
    veredito: string;
    justificativa: string;
    fonte: string;
    [extra: string]: unknown;
  }[];
  lerPlano: (arquivo: string) => string;
  apelidoDe: (candidatoId: string) => string;
}

function sha256(texto: string): string {
  return crypto.createHash('sha256').update(texto).digest('hex');
}

export function montarDadosQuiz(entrada: EntradaQuiz) {
  const comAvaliacao = new Set(entrada.avaliacoes.map((a) => a.trecho_id));
  const enunciados: Record<string, string> = Object.assign({}, ...entrada.novos.map((n) => n.enunciados));
  const subtemaInfo = new Map(SUBTEMAS.map((s) => [s.id, s]));

  const trechos: Record<string, unknown>[] = [];
  const planos: Record<string, unknown>[] = [];
  const subtemasUsados = new Set<string>();
  const linhasPorArquivo = new Map<string, { conteudo: string; linhas: string[] }>();

  for (const lote of entrada.novos) {
    for (const t of lote.trechos) {
      const id = `${t.candidato_id}-${t.subtema_id}`;
      // Subtema fora da tabela é erro de dado, mesmo que o trecho não tenha avaliação
      const info = subtemaInfo.get(t.subtema_id);
      if (!info) throw new Error(`O subtema '${t.subtema_id}' não está na tabela dos 15 subtemas aprovados.`);
      if (!comAvaliacao.has(id)) continue;

      const arquivo = path.basename(t.arquivo);
      if (!linhasPorArquivo.has(arquivo)) {
        const conteudo = entrada.lerPlano(arquivo);
        linhasPorArquivo.set(arquivo, { conteudo, linhas: conteudo.split(/\r?\n/) });
      }
      const { conteudo, linhas } = linhasPorArquivo.get(arquivo)!;

      const loc = localizarTrecho(conteudo, t.query);
      if (!loc) throw new Error(`Não achou ${id} em ${arquivo}: ${t.query.slice(0, 80)}`);
      const ctx = expandirContexto(linhas, loc.linha_inicio, loc.linha_fim, t.query);

      subtemasUsados.add(t.subtema_id);
      const textoMascarado = mascararTexto(t.query);
      const contextoMascarado = mascararTexto(ctx.texto);
      trechos.push({
        id,
        candidato_id: t.candidato_id,
        eixo: info.eixo,
        subtema_id: t.subtema_id,
        arquivo,
        linha_inicio: loc.linha_inicio,
        linha_fim: loc.linha_fim,
        pagina_pdf: loc.pagina_pdf ?? undefined,
        texto_literal: t.query,
        texto_mascarado: textoMascarado,
        hash_texto: sha256(t.query),
        contexto_literal: ctx.texto,
        contexto_mascarado: contextoMascarado,
        contexto_linha_inicio: ctx.linha_inicio,
        contexto_linha_fim: ctx.linha_fim,
        hash_contexto: sha256(ctx.texto),
      });
      // O que o eleitor lê no quiz: sem candidato, sem partido, só o apelido neutro
      planos.push({
        id,
        apelido_neutro: entrada.apelidoDe(t.candidato_id),
        eixo: info.eixo,
        subtema_id: t.subtema_id,
        texto_mascarado: textoMascarado,
        contexto_mascarado: contextoMascarado,
      });
    }
  }

  const subtemas = SUBTEMAS.filter((s) => subtemasUsados.has(s.id)).map((s) => ({
    id: s.id,
    eixo: s.eixo,
    nome: s.nome,
    enunciado: enunciados[s.id] ?? '',
  }));

  const idsPublicados = new Set(trechos.map((t) => t.id as string));
  const avaliacoes = entrada.avaliacoes
    .filter((a) => idsPublicados.has(a.trecho_id))
    .map((a) => ({
      criterio_id: a.criterio_id,
      trecho_id: a.trecho_id,
      veredito: a.veredito,
      justificativa: a.justificativa,
      fonte: a.fonte,
    }));

  return { subtemas, trechos, planos, avaliacoes };
}

// Sob o vite-node o process.argv não traz o caminho do script: a guarda é por ambiente, como nos verificar-*
if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test') {
  const raiz = path.join(import.meta.dirname, '../..');
  const lerJSON = <T>(rel: string): T => JSON.parse(fs.readFileSync(path.join(raiz, rel), 'utf-8')) as T;

  const assuntos = ['seguranca', 'economia', 'educacao', 'reformas', 'saude'];
  const novos = assuntos.map((a) =>
    lerJSON<{ trechos: TrechoEscolhido[]; enunciados: Record<string, string> }>(`docs/avaliacao/novos-trechos/${a}.json`)
  );
  const avaliacoes = lerJSON<EntradaQuiz['avaliacoes']>('docs/avaliacao/final/avaliacoes-quiz-final.json');

  // O apelido neutro de cada candidato é o mesmo de planos_cegos.json (o do teste cego)
  const trechosOriginais = lerJSON<{ id: string; candidato_id: string }[]>('site/public/data/trechos.json');
  const planosCegos = lerJSON<{ id: string; apelido_neutro: string }[]>('site/public/data/planos_cegos.json');
  const apelidos: Record<string, string> = {};
  for (const t of trechosOriginais) {
    const p = planosCegos.find((x) => x.id === t.id);
    if (p) apelidos[t.candidato_id] = p.apelido_neutro;
  }

  const dados = montarDadosQuiz({
    novos,
    avaliacoes,
    lerPlano: (arquivo) => fs.readFileSync(path.join(raiz, 'Planos_TSE', arquivo), 'utf-8'),
    apelidoDe: (cand) => {
      const a = apelidos[cand];
      if (!a) throw new Error(`Candidato sem apelido neutro: ${cand}`);
      return a;
    },
  });

  const saida = path.join(import.meta.dirname, '../public/data');
  const gravar = (nome: string, conteudo: unknown) =>
    fs.writeFileSync(path.join(saida, nome), JSON.stringify(conteudo, null, 2) + '\n');
  gravar('subtemas.json', dados.subtemas);
  gravar('trechos_quiz.json', dados.trechos);
  gravar('planos_cegos_quiz.json', dados.planos);
  gravar('avaliacoes_quiz.json', dados.avaliacoes);
  console.log(
    `✅ quiz por subtemas: ${dados.subtemas.length} subtemas, ${dados.trechos.length} trechos, ${dados.avaliacoes.length} avaliações.`
  );
}
