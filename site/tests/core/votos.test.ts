import { describe, it, expect } from 'vitest';
import { montarVotos, RESPOSTA_PULAR, type AvaliacaoPublica } from '../../src/core/votos';
import { SessaoQuiz } from '../../src/core/sessao';
import { calcularResultado } from '../../src/core/resultado';

const perguntas = [
  { id: 's1', eixo: 'Saúde', subtema_id: 's1', enunciado: 'P1?', opcoes: ['lula-s1', 'flavio-s1', 'caiado-s1'] },
  { id: 's2', eixo: 'Saúde', subtema_id: 's2', enunciado: 'P2?', opcoes: ['lula-s2', 'flavio-s2', 'caiado-s2'] },
];
const subtemas = [
  { id: 's1', eixo: 'Saúde', nome: 'Filas', enunciado: 'P1?' },
  { id: 's2', eixo: 'Saúde', nome: 'Prontuário', enunciado: 'P2?' },
];
const trechos = ['lula-s1', 'flavio-s1', 'caiado-s1', 'lula-s2', 'flavio-s2', 'caiado-s2'].map((id) => ({
  id,
  candidato_id: id.split('-')[0]!,
  texto_literal: `texto de ${id}`,
}));
const av = (trecho_id: string, criterio_id: string, veredito: string): AvaliacaoPublica => ({
  trecho_id,
  criterio_id,
  veredito,
  justificativa: 'j',
  fonte: 'f',
});
const avaliacoes = ['C1', 'C2', 'C3', 'C4', 'C5'].map((c) =>
  av('flavio-s1', c, c === 'C3' ? 'Parcial' : 'Sem base para avaliar')
);

describe('montarVotos', () => {
  it('monta um voto com candidato, texto, avaliações e forças', () => {
    const v = montarVotos(perguntas, { s1: 'flavio-s1', s2: RESPOSTA_PULAR }, trechos, avaliacoes, subtemas);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({
      perguntaId: 's1',
      subtemaNome: 'Filas',
      candidatoId: 'flavio',
      textoLiteral: 'texto de flavio-s1',
    });
    expect(v[0]!.avaliacoes).toHaveLength(5);
  });

  it('mantém a ordem das perguntas e ignora pergunta sem resposta ou com trecho desconhecido', () => {
    const v = montarVotos(perguntas, { s2: 'lula-s2', s1: 'nao-existe' }, trechos, [], subtemas);
    expect(v.map((x) => x.perguntaId)).toEqual(['s2']);
  });

  it('pergunta pulada não gera linha na revelação', () => {
    const v = montarVotos(perguntas, { s1: RESPOSTA_PULAR, s2: RESPOSTA_PULAR }, trechos, avaliacoes, subtemas);
    expect(v).toEqual([]);
  });
});

describe('pular', () => {
  it('a sessão grava a mesma constante que o resultado ignora', () => {
    const s = new SessaoQuiz(2);
    s.iniciar();
    s.pular(1);
    expect(s.respostas.get(1)).toBe(RESPOSTA_PULAR);
    expect(calcularResultado([RESPOSTA_PULAR, 'lula'], ['lula']).totalValidas).toBe(1);
  });

  it('a constante é a palavra pular', () => {
    expect(RESPOSTA_PULAR).toBe('pular');
  });
});
