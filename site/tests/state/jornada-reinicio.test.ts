// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { salvarSessao, lerSessao, reiniciarJornada, aplicarOrdemTesteCego, type SessaoState } from '../../src/state/sessao-storage';

const perguntas = [{ id: 's1', eixo: 'Saúde', subtema_id: 's1', enunciado: 'P?', opcoes: ['a', 'b', 'c'] }];

function sessao(extra: Partial<SessaoState> = {}): SessaoState {
  return { versao: 1, ordemCandidatos: ['a', 'b'], respostasQuiz: { s1: 'a' }, finalizado: false, revelacaoVista: true, perguntasQuiz: perguntas, ...extra };
}

beforeEach(() => {
  localStorage.clear();
});

describe('reiniciarJornada (Começar / Refazer / Recomeçar no Início)', () => {
  it('apaga a sessão inteira (ordem, perguntas e respostas) e não deixa nenhuma outra chave de sessão', () => {
    salvarSessao(sessao());
    reiniciarJornada();
    expect(lerSessao()).toBeNull();
    expect(localStorage.length).toBe(0);
  });
});

describe('aplicarOrdemTesteCego (Pronto no Teste cego)', () => {
  it('quiz concluído: refazer o teste cego, mesmo com a mesma ordem, descarta perguntas e respostas e reabre o quiz', () => {
    const nova = aplicarOrdemTesteCego(sessao({ finalizado: true }), ['a', 'b']);
    expect(nova.perguntasQuiz).toBeUndefined();
    expect(nova.respostasQuiz).toEqual({});
    expect(nova.finalizado).toBe(false);
    expect(nova.revelacaoVista).toBe(true);
  });

  it('ordem mudou: descarta o quiz, exige rever a revelação', () => {
    const nova = aplicarOrdemTesteCego(sessao(), ['b', 'a']);
    expect(nova.ordemCandidatos).toEqual(['b', 'a']);
    expect(nova.perguntasQuiz).toBeUndefined();
    expect(nova.respostasQuiz).toEqual({});
    expect(nova.revelacaoVista).toBe(false);
    expect(nova.finalizado).toBe(false);
  });

  it('quiz no meio e mesma ordem: mantém perguntas e respostas', () => {
    const nova = aplicarOrdemTesteCego(sessao(), ['a', 'b']);
    expect(nova.perguntasQuiz).toEqual(perguntas);
    expect(nova.respostasQuiz).toEqual({ s1: 'a' });
    expect(nova.revelacaoVista).toBe(true);
  });

  it('sem sessão anterior: cria sessão limpa', () => {
    const nova = aplicarOrdemTesteCego(null, ['a']);
    expect(nova).toMatchObject({ ordemCandidatos: ['a'], respostasQuiz: {}, finalizado: false });
    expect(nova.perguntasQuiz).toBeUndefined();
  });

  it('sessão antiga sem perguntasQuiz não quebra', () => {
    const antiga = sessao();
    delete antiga.perguntasQuiz;
    expect(() => aplicarOrdemTesteCego(antiga, ['a', 'b'])).not.toThrow();
  });
});
