import { describe, it, expect } from 'vitest';
import { gerarContraste } from '../../src/core/contraste';

describe('gerarContraste', () => {
  it('sessão sem voto no teste cego devolve só a afinidade (não gera contraste)', () => {
    const resultado = gerarContraste(['Candidato A'], null);
    expect(resultado.houveContraste).toBe(false);
    expect(resultado.mensagem).toBeNull();
  });

  it('mesmo candidato não gera frase', () => {
    const resultado = gerarContraste(['Candidato A'], 'Candidato A');
    expect(resultado.houveContraste).toBe(false);
    expect(resultado.mensagem).toBeNull();
  });

  it('mesmo candidato (em caso de empate) não gera frase', () => {
    const resultado = gerarContraste(['Candidato B', 'Candidato A'], 'Candidato A');
    expect(resultado.houveContraste).toBe(false);
    expect(resultado.mensagem).toBeNull();
  });

  it('plano e candidato diferentes geram a frase de contraste sem juízo de valor', () => {
    const resultado = gerarContraste(['Candidato A'], 'Candidato B');
    expect(resultado.houveContraste).toBe(true);
    expect(resultado.mensagem).toBe('No teste cego você escolheu o plano de Candidato B, mas suas respostas têm maior afinidade com Candidato A.');
  });

  it('formata corretamente empate de 2 candidatos na frase', () => {
    const resultado = gerarContraste(['Candidato A', 'Candidato C'], 'Candidato B');
    expect(resultado.houveContraste).toBe(true);
    expect(resultado.mensagem).toBe('No teste cego você escolheu o plano de Candidato B, mas suas respostas têm maior afinidade com Candidato A e Candidato C.');
  });

  it('formata corretamente empate de 3 ou mais candidatos na frase', () => {
    const resultado = gerarContraste(['Candidato A', 'Candidato C', 'Candidato D'], 'Candidato B');
    expect(resultado.houveContraste).toBe(true);
    expect(resultado.mensagem).toBe('No teste cego você escolheu o plano de Candidato B, mas suas respostas têm maior afinidade com Candidato A, Candidato C e Candidato D.');
  });
});
