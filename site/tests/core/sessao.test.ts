import { describe, it, expect, beforeEach } from 'vitest';
import { SessaoQuiz } from '../../src/core/sessao';

describe('SessaoQuiz', () => {
  let sessao: SessaoQuiz;

  beforeEach(() => {
    sessao = new SessaoQuiz(10);
    sessao.iniciar();
  });

  it('pergunta_atual fica entre 0 e 10', () => {
    expect(sessao.atual).toBeGreaterThanOrEqual(0);
    expect(sessao.atual).toBeLessThanOrEqual(10);
    
    sessao.voltar();
    sessao.voltar();
    expect(sessao.atual).toBe(0); // não deve descer menor que 0
    sessao.voltar();
    expect(sessao.atual).toBe(0);
  });

  it('responder de novo a pergunta 4 substitui a resposta anterior e a pergunta conta uma única vez', () => {
    sessao.atual = 4;
    sessao.responder(4, 'candidatoA');
    expect(sessao.respostas.get(4)).toBe('candidatoA');
    expect(sessao.respostas.size).toBe(1);
    
    // Responde de novo a pergunta 4
    sessao.responder(4, 'candidatoB');
    expect(sessao.respostas.get(4)).toBe('candidatoB');
    expect(sessao.respostas.size).toBe(1); // Conta apenas uma vez
  });

  it('a pergunta 10 leva ao resultado', () => {
    sessao.atual = 10;
    sessao.responder(10, 'candidatoC');
    expect(sessao.concluido).toBe(true);
  });

  it('pular todas as perguntas conclui o quiz', () => {
    for (let i = 1; i <= 10; i++) {
      sessao.pular(i); // 'pular'
    }
    expect(sessao.respostas.size).toBe(10);
    expect(sessao.concluido).toBe(true);
  });

  it('voltar desmarca a conclusão se estava no final', () => {
    sessao.atual = 10;
    sessao.responder(10, 'X');
    expect(sessao.concluido).toBe(true);
    
    sessao.voltar();
    expect(sessao.concluido).toBe(false);
    expect(sessao.atual).toBe(10); // volta para a tela 10 para revisar
  });
});
