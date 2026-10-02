import { describe, it, expect } from 'vitest';
import { embaralhar } from '../../src/core/embaralhar';

describe('embaralhar', () => {
  it('deve rejeitar sementes que não sejam números inteiros', () => {
    expect(() => embaralhar([1, 2, 3], 1.5)).toThrowError('inteiro');
    expect(() => embaralhar([1, 2, 3], NaN)).toThrowError('inteiro');
  });

  it('deve retornar uma lista vazia se a entrada for vazia', () => {
    expect(embaralhar([], 1)).toEqual([]);
  });

  it('deve retornar a mesma ordem para a mesma semente', () => {
    const lista = [1, 2, 3, 4, 5];
    const semente = 42;
    const resultado1 = embaralhar(lista, semente);
    const resultado2 = embaralhar(lista, semente);
    expect(resultado1).toEqual(resultado2);
  });

  it('as sementes 1 e 2 sobre a lista de cinco planos devem dar ordens diferentes', () => {
    const lista = ['Lula', 'Flavio', 'Renan', 'Caiado', 'Cury'];
    const resultado1 = embaralhar(lista, 1);
    const resultado2 = embaralhar(lista, 2);
    expect(resultado1).not.toEqual(resultado2);
    
    // Verifica se os elementos são os mesmos, só ordem diferente
    expect([...resultado1].sort()).toEqual([...lista].sort());
    expect([...resultado2].sort()).toEqual([...lista].sort());
  });

  it('não deve mutar a lista original', () => {
    const lista = [1, 2, 3, 4, 5];
    const listaOriginal = [...lista];
    embaralhar(lista, 99);
    expect(lista).toEqual(listaOriginal);
  });
});
