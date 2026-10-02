import { describe, it, expect } from 'vitest';
import { gerarTextoCompartilhamento, URL_SITE } from '../../src/share/texto';

describe('Share Texto', () => {
  it('deve gerar texto formatado com ranking', () => {
    const data = {
      ranking: [
        { nome: 'Candidato X', afinidade: 80 },
        { nome: 'Candidato Y', afinidade: 50 },
      ]
    };
    
    const texto = gerarTextoCompartilhamento(data);
    expect(texto).toContain('1º Candidato X - 80%');
    expect(texto).toContain('2º Candidato Y - 50%');
    expect(texto).toContain(URL_SITE);
    expect(texto).not.toContain('missao-quiz.com.br');
    expect(texto).not.toMatch(/Miss[aã]o/);
  });
});
