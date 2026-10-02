import { z } from 'zod';

export const TrechoSchema = z.object({
  id: z.string(),
  candidato_id: z.string(),
  eixo: z.string(),
  arquivo: z.string(),
  linha_inicio: z.number().int().min(1),
  linha_fim: z.number().int().min(1),
  pagina_pdf: z.number().int().optional(),
  texto_literal: z.string(),
  texto_mascarado: z.string(),
  hash_texto: z.string(),
  // Parágrafo(s) do plano original em volta do trecho (parágrafos separados por linha em branco)
  contexto_literal: z.string().optional(),
  contexto_mascarado: z.string().optional(),
  contexto_linha_inicio: z.number().int().min(1).optional(),
  contexto_linha_fim: z.number().int().min(1).optional(),
  hash_contexto: z.string().optional(),
});
export type Trecho = z.infer<typeof TrechoSchema>;

export const OpcaoSchema = z.object({
  id: z.string(),
  trecho_id: z.string().optional(),
  texto: z.string().optional()
});
export type Opcao = z.infer<typeof OpcaoSchema>;

export const PerguntaQuizSchema = z.object({
  id: z.string(),
  eixo: z.string(),
  enunciado: z.string(),
  opcoes: z.array(OpcaoSchema)
});
export type PerguntaQuiz = z.infer<typeof PerguntaQuizSchema>;

export const PlanoCegoSchema = z.object({
  id: z.string(),
  candidato_id: z.string(),
  apelido_neutro: z.string(),
  trechos_ids: z.array(z.string())
});
export type PlanoCego = z.infer<typeof PlanoCegoSchema>;

export const AvaliacaoViabilidadeSchema = z.object({
  criterio_id: z.string(),
  trecho_id: z.string(),
  veredito: z.string(),
  justificativa: z.string(),
  fonte: z.string(),
  /** O outro lado da avaliação (pesquisa com fonte no corpo). Opcional até o join do build preencher. */
  outro_lado: z.string().optional()
});
export type AvaliacaoViabilidade = z.infer<typeof AvaliacaoViabilidadeSchema>;

export const CandidatoRegionalSchema = z.object({
  nome: z.string(),
  cargo: z.string(),
  numero: z.string(),
  fonte_verificacao: z.string(),
  atualizado_em: z.string() // datetime ISO
});
export type CandidatoRegional = z.infer<typeof CandidatoRegionalSchema>;

export const ManifestoIntegridadeSchema = z.object({
  arquivo: z.string(),
  sha256: z.string()
});
export type ManifestoIntegridade = z.infer<typeof ManifestoIntegridadeSchema>;

export const CriterioViabilidadeSchema = z.object({
  id: z.string(),
  nome: z.string(),
  pergunta: z.string(),
  evidencia: z.string(),
  niveis: z.record(z.string(), z.string())
});
export type CriterioViabilidade = z.infer<typeof CriterioViabilidadeSchema>;

export const CriteriosSchema = z.object({
  versao: z.number().int(),
  publicado_em: z.string(),
  escala: z.array(z.string()).min(2),
  regras: z.array(z.string()),
  criterios: z.array(CriterioViabilidadeSchema).length(5)
});
export type Criterios = z.infer<typeof CriteriosSchema>;

export const FonteCandidatoSchema = z.object({
  titulo: z.string(),
  url: z.string()
});
export type FonteCandidato = z.infer<typeof FonteCandidatoSchema>;

export const PropostaCandidatoSchema = z.object({
  titulo: z.string(),
  resumo: z.string(),
  fonte: z.string()
});
export type PropostaCandidato = z.infer<typeof PropostaCandidatoSchema>;

export const HistoricoCandidatoSchema = z.object({
  descricao: z.string(),
  fonte: z.string()
});
export type HistoricoCandidato = z.infer<typeof HistoricoCandidatoSchema>;

export const CandidatoPRSchema = z.object({
  id: z.string(),
  cargo: z.string(),
  nomeUrna: z.string(),
  nomeCompleto: z.string(),
  numero: z.string(),
  partido: z.string(),
  situacaoTSE: z.string(),
  nascimento: z.string().optional(),
  naturalidade: z.string().optional(),
  residencia: z.string().optional(),
  ocupacaoDeclarada: z.string().optional(),
  escolaridade: z.string().optional(),
  /** Perfil no Instagram, com ou sem arroba. */
  instagram: z.string().optional(),
  primeiraCandidatura: z.boolean().optional(),
  bio: z.string(),
  chapa: z.object({
    vice: z.string().optional(),
    titular: z.string().optional()
  }).optional(),
  suplentes: z.array(z.string()).optional(),
  planoDeGoverno: z.object({
    titulo: z.string(),
    paginas: z.number().int().optional(),
    fonte: z.string()
  }).optional(),
  propostas: z.array(PropostaCandidatoSchema),
  historico: z.array(HistoricoCandidatoSchema),
  observacoes: z.array(z.string()),
  fontes: z.array(FonteCandidatoSchema),
  lacunas: z.array(z.string()),
  revisar: z.boolean(),
  basico: z.boolean().optional(),
  /** Caminho local em public/fotos/ (sem link externo). Sem ele, o cartão mostra as iniciais. */
  foto: z.string().optional()
});
export type CandidatoPR = z.infer<typeof CandidatoPRSchema>;

export const BaseCandidatosPRSchema = z.object({
  versao: z.string(),
  geradoEm: z.string(),
  aviso: z.string(),
  fontesGerais: z.array(FonteCandidatoSchema),
  candidatos: z.array(CandidatoPRSchema)
});
export type BaseCandidatosPR = z.infer<typeof BaseCandidatosPRSchema>;

/** Subtema de um assunto do quiz: cada pergunta sorteada é um subtema. */
export const SubtemaSchema = z.object({
  id: z.string(),
  eixo: z.string(),
  nome: z.string(),
  enunciado: z.string(),
});
export type Subtema = z.infer<typeof SubtemaSchema>;

/** Trecho usado só no quiz: o mesmo formato do trecho do teste cego, mais o subtema. */
export const TrechoQuizSchema = TrechoSchema.extend({ subtema_id: z.string() });
export type TrechoQuiz = z.infer<typeof TrechoQuizSchema>;

/** O que o eleitor lê durante o quiz: texto mascarado, sem autor e sem partido. */
export const PlanoCegoQuizSchema = z.object({
  id: z.string(),
  apelido_neutro: z.string(),
  eixo: z.string(),
  subtema_id: z.string(),
  texto_mascarado: z.string(),
  contexto_mascarado: z.string().optional(),
});
export type PlanoCegoQuiz = z.infer<typeof PlanoCegoQuizSchema>;
