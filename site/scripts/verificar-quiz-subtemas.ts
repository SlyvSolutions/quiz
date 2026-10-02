import * as fs from 'node:fs';
import * as path from 'node:path';
import crypto from 'node:crypto';
import { localizarTrecho } from './extrair-trecho';
import { mascararTexto } from '../src/core/mascarar-texto';

// Verificação dos dados do quiz por subtemas. Roda no build: se algum dado do quiz estiver fora
// das regras (trecho que não existe no plano, avaliação faltando, nome do autor no texto que o
// eleitor lê, termo interno publicado), o build falha.

export interface SubtemaPublicado {
  id: string;
  eixo: string;
  nome: string;
  enunciado: string;
}

export interface TrechoQuizPublicado {
  id: string;
  candidato_id: string;
  eixo: string;
  subtema_id: string;
  arquivo: string;
  texto_literal: string;
  texto_mascarado: string;
  hash_texto: string;
  linha_inicio?: number;
  linha_fim?: number;
}

export interface PlanoCegoQuizPublicado {
  id: string;
  apelido_neutro: string;
  eixo: string;
  subtema_id: string;
  texto_mascarado: string;
  contexto_mascarado?: string;
}

export interface AvaliacaoQuizPublicada {
  trecho_id: string;
  criterio_id: string;
  veredito: string;
  justificativa: string;
  fonte: string;
}

export interface DadosQuiz {
  subtemas: SubtemaPublicado[];
  trechos: TrechoQuizPublicado[];
  planos: PlanoCegoQuizPublicado[];
  avaliacoes: AvaliacaoQuizPublicada[];
  criterios: { criterios: { id: string }[]; escala: string[] };
  /** apelido neutro de cada candidato, como em planos_cegos.json */
  apelidosPorCandidato: Record<string, string>;
  /** devolve o texto do plano original (arquivo .md) */
  lerPlano: (arquivo: string) => string;
}

export const ASSUNTOS = ['Segurança', 'Economia', 'Educação', 'Reformas', 'Saúde'];
export const MIN_SUBTEMAS_POR_ASSUNTO = 3;
export const MIN_CANDIDATOS_POR_SUBTEMA = 3;
const INVIAVEL = 'Inviável nos termos propostos';

/** Termos de trabalho que não podem aparecer no texto publicado (justificativa e fonte). */
const TERMO_INTERNO = /\b(?:dev|rodada|staging|duelo|contraponto)\b|revisar_dev|pendente_pesquisa|provis[oó]rio|\bR[0-6]\b/i;

function sha256(texto: string): string {
  return crypto.createHash('sha256').update(texto).digest('hex');
}

export function verificarQuiz(d: DadosQuiz): string[] {
  const erros: string[] = [];
  const subtemaPorId = new Map(d.subtemas.map((s) => [s.id, s]));
  const trechoPorId = new Map(d.trechos.map((t) => [t.id, t]));

  // 1. Cada assunto precisa de pelo menos 3 subtemas elegíveis (3 ou mais candidatos), os que o quiz usa
  const candidatosPorSubtema = new Map<string, Set<string>>();
  for (const t of d.trechos) {
    const c = candidatosPorSubtema.get(t.subtema_id) ?? new Set<string>();
    c.add(t.candidato_id);
    candidatosPorSubtema.set(t.subtema_id, c);
  }
  for (const assunto of ASSUNTOS) {
    const elegiveis = d.subtemas.filter(
      (s) => s.eixo === assunto && (candidatosPorSubtema.get(s.id)?.size ?? 0) >= MIN_CANDIDATOS_POR_SUBTEMA
    );
    if (elegiveis.length < MIN_SUBTEMAS_POR_ASSUNTO) {
      erros.push(
        `[${assunto}] ASSUNTO_SEM_SUBTEMAS: tem ${elegiveis.length} subtema(s) com ${MIN_CANDIDATOS_POR_SUBTEMA} ou mais candidatos; precisa de pelo menos ${MIN_SUBTEMAS_POR_ASSUNTO}.`
      );
    }
  }

  // 2. Cada trecho aponta para um subtema do mesmo assunto, e há um por candidato em cada subtema
  const vistos = new Set<string>();
  for (const t of d.trechos) {
    const s = subtemaPorId.get(t.subtema_id);
    if (!s || s.eixo !== t.eixo) {
      erros.push(`[${t.id}] TRECHO_SEM_SUBTEMA: o subtema '${t.subtema_id}' não existe ou é de outro assunto.`);
    }
    const chave = `${t.candidato_id}|${t.subtema_id}`;
    if (vistos.has(chave)) erros.push(`[${t.id}] TRECHO_REPETIDO: já há trecho de '${t.candidato_id}' no subtema '${t.subtema_id}'.`);
    vistos.add(chave);
  }

  // 3. Cada trecho tem exatamente 5 avaliações, na escala, sem campo vazio, sem termo interno
  const porTrecho = new Map<string, AvaliacaoQuizPublicada[]>();
  for (const a of d.avaliacoes) {
    if (!trechoPorId.has(a.trecho_id)) {
      erros.push(`[${a.trecho_id}] AVALIACAO_ORFA: avaliação de trecho que não existe.`);
      continue;
    }
    const lista = porTrecho.get(a.trecho_id) ?? [];
    lista.push(a);
    porTrecho.set(a.trecho_id, lista);
    if (!d.criterios.escala.includes(a.veredito)) {
      erros.push(`[${a.trecho_id}] VEREDITO_FORA_DA_ESCALA: '${a.veredito}' em ${a.criterio_id}.`);
    }
    if (a.veredito === INVIAVEL) {
      erros.push(`[${a.trecho_id}] INVIAVEL_PUBLICADO: '${INVIAVEL}' não pode ser publicado sem revisão jurídica (${a.criterio_id}).`);
    }
    if (!a.justificativa?.trim() || !a.fonte?.trim()) {
      erros.push(`[${a.trecho_id}] AVALIACAO_VAZIA: justificativa ou fonte vazia em ${a.criterio_id}.`);
    }
    if (TERMO_INTERNO.test(`${a.justificativa} ${a.fonte}`)) {
      erros.push(`[${a.trecho_id}] TERMO_INTERNO: justificativa ou fonte de ${a.criterio_id} traz termo de trabalho interno.`);
    }
  }
  const idsCriterios = d.criterios.criterios.map((c) => c.id).sort().join(',');
  for (const t of d.trechos) {
    const ids = (porTrecho.get(t.id) ?? []).map((a) => a.criterio_id).sort().join(',');
    if (ids !== idsCriterios) {
      erros.push(`[${t.id}] AVALIACOES: precisa de exatamente 1 avaliação por critério (${idsCriterios}); tem '${ids}'.`);
    }
  }

  // 4. O texto literal existe no plano original, o hash bate e a máscara é a esperada
  const planoPorArquivo = new Map<string, string>();
  for (const t of d.trechos) {
    if (!planoPorArquivo.has(t.arquivo)) planoPorArquivo.set(t.arquivo, d.lerPlano(t.arquivo));
    if (!localizarTrecho(planoPorArquivo.get(t.arquivo)!, t.texto_literal)) {
      erros.push(`[${t.id}] LITERAL_NAO_ENCONTRADO: o texto não está em ${t.arquivo}.`);
    }
    if (sha256(t.texto_literal) !== t.hash_texto) {
      erros.push(`[${t.id}] HASH_DIVERGENTE: hash_texto não bate com o texto literal.`);
    }
    if (mascararTexto(t.texto_literal) !== t.texto_mascarado) {
      erros.push(`[${t.id}] MASCARA_FORA_DO_PADRAO: o texto mascarado difere do esperado.`);
    }
  }

  // 5. O que o eleitor lê: plano cego de cada trecho, com o apelido do candidato e sem nome nenhum
  const planoCego = new Map(d.planos.map((p) => [p.id, p]));
  for (const t of d.trechos) {
    const p = planoCego.get(t.id);
    if (!p) {
      erros.push(`[${t.id}] PLANO_AUSENTE: o trecho não tem entrada em planos_cegos_quiz.json.`);
      continue;
    }
    if (p.apelido_neutro !== d.apelidosPorCandidato[t.candidato_id]) {
      erros.push(`[${p.id}] APELIDO_DIVERGENTE: '${p.apelido_neutro}' difere do apelido do candidato.`);
    }
  }
  for (const p of d.planos) {
    for (const texto of [p.texto_mascarado, p.contexto_mascarado]) {
      if (texto && mascararTexto(texto) !== texto) {
        erros.push(`[${p.id}] NOME_NO_TEXTO: o texto que o eleitor lê cita candidato ou partido.`);
        break;
      }
    }
  }

  return erros;
}

const ARQUIVOS = ['subtemas', 'trechos_quiz', 'planos_cegos_quiz', 'avaliacoes_quiz'];

if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test') {
  console.log('Verificando os dados do quiz por subtemas...');
  const dataDir = path.join(import.meta.dirname, '../public/data');
  const caminho = (nome: string) => path.join(dataDir, `${nome}.json`);
  const existem = ARQUIVOS.filter((n) => fs.existsSync(caminho(n)));

  if (existem.length === 0) {
    console.warn('AVISO: os dados do quiz por subtemas ainda não foram publicados; verificação pulada.');
    process.exit(0);
  }
  if (existem.length !== ARQUIVOS.length) {
    const faltam = ARQUIVOS.filter((n) => !existem.includes(n)).map((n) => `${n}.json`);
    console.error(`ARQUIVO_INEXISTENTE: faltam ${faltam.join(', ')}.`);
    process.exit(1);
  }

  const ler = <T>(nome: string): T => JSON.parse(fs.readFileSync(caminho(nome), 'utf-8')) as T;
  const planosCegos = ler<{ apelido_neutro: string; id: string }[]>('planos_cegos');
  const trechosOriginais = ler<{ id: string; candidato_id: string }[]>('trechos');
  const apelidosPorCandidato: Record<string, string> = {};
  for (const t of trechosOriginais) {
    const p = planosCegos.find((x) => x.id === t.id);
    if (p) apelidosPorCandidato[t.candidato_id] = p.apelido_neutro;
  }

  const erros = verificarQuiz({
    subtemas: ler('subtemas'),
    trechos: ler('trechos_quiz'),
    planos: ler('planos_cegos_quiz'),
    avaliacoes: ler('avaliacoes_quiz'),
    criterios: ler('criterios'),
    apelidosPorCandidato,
    lerPlano: (arquivo) =>
      fs.readFileSync(path.join(import.meta.dirname, '../../Planos_TSE', path.basename(arquivo)), 'utf-8'),
  });

  if (erros.length > 0) {
    console.error('Falha na verificação do quiz por subtemas:');
    erros.forEach((e) => console.error(e));
    process.exit(1);
  }
  console.log('Quiz por subtemas validado com sucesso.');
  process.exit(0);
}
