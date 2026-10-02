// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { criarRevelacaoVotos } from '../../src/screens/resultado/revelacao-votos';
import type { VotoRevelado } from '../../src/core/votos';

const nomes = {
  flavio: { nome: 'Flávio Bolsonaro', partido: 'PL' },
  lula: { nome: 'Lula', partido: 'PT' },
};
const criterios = ['C1', 'C2', 'C3', 'C4', 'C5'].map((id) => ({ id, nome: `Nome ${id}` }));
const avs = (t: string) =>
  criterios.map((c) => ({ trecho_id: t, criterio_id: c.id, veredito: 'Parcial', justificativa: 'j', fonte: 'f' }));
const voto = (id: string, cand: string): VotoRevelado => ({
  perguntaId: id,
  subtemaNome: `Subtema ${id}`,
  enunciado: `Pergunta ${id}?`,
  trechoId: `${cand}-${id}`,
  candidatoId: cand,
  textoLiteral: `Texto literal ${id}`,
  avaliacoes: avs(`${cand}-${id}`),
});

describe('criarRevelacaoVotos', () => {
  it('mostra cada voto com candidato, partido, texto literal e os 5 critérios', () => {
    const raiz = criarRevelacaoVotos([voto('a', 'flavio'), voto('b', 'lula')], criterios, nomes);
    const artigos = raiz.querySelectorAll('.res-revelacao-voto');
    expect(artigos).toHaveLength(2);
    expect(artigos[0]!.textContent).toContain('Flávio Bolsonaro');
    expect(artigos[0]!.textContent).toContain('PL');
    expect(artigos[0]!.textContent).toContain('Texto literal a');
    expect(artigos[0]!.textContent).toContain('Subtema a');
    expect(artigos[0]!.querySelectorAll('.slide-criterios-item')).toHaveLength(5);
    expect(artigos[1]!.textContent).toContain('Lula');
  });

  it('mantém a ordem dos votos', () => {
    const raiz = criarRevelacaoVotos([voto('b', 'lula'), voto('a', 'flavio')], criterios, nomes);
    const titulos = [...raiz.querySelectorAll('.res-revelacao-voto h4')].map((h) => h.textContent);
    expect(titulos).toEqual(['Pergunta b?', 'Pergunta a?']);
  });

  it('sem votos mostra mensagem e não quebra', () => {
    const raiz = criarRevelacaoVotos([], criterios, nomes);
    expect(raiz.textContent).toContain('Nenhum voto');
    expect(raiz.querySelectorAll('.res-revelacao-voto')).toHaveLength(0);
  });

  it('candidato desconhecido não quebra', () => {
    const raiz = criarRevelacaoVotos([voto('a', 'outro')], criterios, nomes);
    expect(raiz.querySelectorAll('.res-revelacao-voto')).toHaveLength(1);
  });

  it('trecho sem avaliações mostra a mensagem neutra do slide', () => {
    const v = { ...voto('a', 'flavio'), avaliacoes: [] };
    const raiz = criarRevelacaoVotos([v], criterios, nomes);
    expect(raiz.textContent).toContain('Ainda não há avaliação');
  });

  it('no Resultado a justificativa sai literal (autor já revelado), com nome de programa e do candidato', () => {
    const just = 'A proposta repete o Programa Mais Médicos, como Lula prometeu no nosso governo.';
    const v = {
      ...voto('a', 'lula'),
      avaliacoes: criterios.map((c) => ({ trecho_id: 'lula-a', criterio_id: c.id, veredito: 'Parcial', justificativa: just, fonte: 'f' })),
    };
    const t = criarRevelacaoVotos([v], criterios, nomes).textContent ?? '';
    expect(t).toContain(just);
    expect(t).not.toContain('[programa federal de atenção médica]');
  });
});
