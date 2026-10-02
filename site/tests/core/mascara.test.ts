import { describe, it, expect } from 'vitest';
import { conferirMascara } from '../../src/core/mascara';

describe('conferirMascara', () => {
  it('trecho com zero marcadores é aprovado e sinalizado como nada ocultado', () => {
    const original = 'O Brasil precisa crescer.';
    const mascarado = 'O Brasil precisa crescer.';
    
    const resultado = conferirMascara(original, mascarado);
    expect(resultado.valido).toBe(true);
    expect(resultado.nadaOcultado).toBe(true);
    expect(resultado.ocultados.length).toBe(0);
  });

  it('trecho sem marcadores mas com erro de digitação é reprovado', () => {
    const original = 'O Brasil precisa crescer.';
    const mascarado = 'O Brasil precisa cair.';
    
    const resultado = conferirMascara(original, mascarado);
    expect(resultado.valido).toBe(false);
    expect(resultado.nadaOcultado).toBe(false);
  });

  it('mascarado com diferença além dos marcadores é reprovado', () => {
    const original = 'Eu, candidato João, prometo investir em saúde.';
    const mascarado = 'Eu, [***], prometo não investir em saúde.';
    
    const resultado = conferirMascara(original, mascarado);
    expect(resultado.valido).toBe(false);
  });

  it('os trechos ocultados são devolvidos para destaque na revelação', () => {
    const original = 'Eu, candidato João Silva, prometo investir muito em saúde no ano de 2026.';
    const mascarado = 'Eu, candidato [***], prometo investir muito em [***] no ano de [***].';
    
    const resultado = conferirMascara(original, mascarado);
    expect(resultado.valido).toBe(true);
    expect(resultado.nadaOcultado).toBe(false);
    expect(resultado.ocultados).toEqual(['João Silva', 'saúde', '2026']);
  });

  it('normalização de espaços é tolerada', () => {
    const original = 'O   candidato \n\n X falou    isso.';
    const mascarado = 'O candidato [***] falou isso.';
    
    const resultado = conferirMascara(original, mascarado);
    expect(resultado.valido).toBe(true);
    expect(resultado.ocultados).toEqual(['X']);
  });

  it('permite mudar o marcador', () => {
    const original = 'Vamos focar no estado do Rio de Janeiro.';
    const mascarado = 'Vamos focar no estado do ___BLANK___.';
    
    const resultado = conferirMascara(original, mascarado, '___BLANK___');
    expect(resultado.valido).toBe(true);
    expect(resultado.ocultados).toEqual(['Rio de Janeiro']);
  });
});
