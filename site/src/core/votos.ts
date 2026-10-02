import type { PerguntaSorteada, SubtemaQuiz } from './sorteio-quiz';

/** Resposta de quem escolhe "Nenhuma das opções / Pular". É a única grafia usada no código. */
export const RESPOSTA_PULAR = 'pular';

export interface AvaliacaoPublica {
  criterio_id: string;
  trecho_id: string;
  veredito: string;
  justificativa: string;
  fonte: string;
}

export interface VotoRevelado {
  perguntaId: string;
  subtemaNome: string;
  enunciado: string;
  trechoId: string;
  candidatoId: string;
  textoLiteral: string;
  avaliacoes: AvaliacaoPublica[];
}

/**
 * Junta cada resposta do quiz com o candidato votado, o trecho e os 5 critérios, na ordem das
 * perguntas. Pergunta pulada, sem resposta ou com trecho desconhecido não gera linha.
 */
export function montarVotos(
  perguntas: PerguntaSorteada[],
  respostas: Record<string, string>,
  trechos: { id: string; candidato_id: string; texto_literal: string }[],
  avaliacoes: AvaliacaoPublica[],
  subtemas: SubtemaQuiz[]
): VotoRevelado[] {
  const votos: VotoRevelado[] = [];
  for (const p of perguntas) {
    const resposta = respostas[p.id];
    if (!resposta || resposta === RESPOSTA_PULAR) continue;
    const trecho = trechos.find((t) => t.id === resposta);
    if (!trecho) continue;
    const dele = avaliacoes.filter((a) => a.trecho_id === trecho.id);
    votos.push({
      perguntaId: p.id,
      subtemaNome: subtemas.find((s) => s.id === p.subtema_id)?.nome ?? p.subtema_id,
      enunciado: p.enunciado,
      trechoId: trecho.id,
      candidatoId: trecho.candidato_id,
      textoLiteral: trecho.texto_literal,
      avaliacoes: dele,
    });
  }
  return votos;
}
