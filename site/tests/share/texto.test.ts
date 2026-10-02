import { describe, it, expect } from 'vitest';
import { gerarTextoCompartilhamento } from '../../src/share/texto';

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
    expect(texto).toContain('missao-quiz.com.br');
  });
});
