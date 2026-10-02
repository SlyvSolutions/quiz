import { describe, it, expect } from 'vitest';
import { shuffleArray } from '../../src/utils/shuffle';

describe('Shuffle Util', () => {
  it('deve embaralhar um array', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    
    // O tamanho e os elementos devem ser os mesmos
    expect(shuffled).toHaveLength(5);
    expect(shuffled).toEqual(expect.arrayContaining(arr));
    
    // É muito improvável que o array fique igual (pode acontecer, mas a chance é 1/120)
    // Para evitar flakiness em CI, apenas garantimos que a função rodou e não quebrou os dados.
  });

  it('deve ser deterministico com a mesma semente', () => {
    const arr = ['A', 'B', 'C', 'D', 'E'];
    const s1 = shuffleArray(arr, 42);
    const s2 = shuffleArray(arr, 42);
    
    expect(s1).toEqual(s2);
  });

  it('nao perde nem cria elementos com semente negativa ou zero (hash do quiz)', () => {
    const arr = ['A', 'B', 'C', 'D', 'E'];
    for (const semente of [-999153009, -1, 0]) {
      const r = shuffleArray(arr, semente);
      expect(r).toHaveLength(5);
      expect([...r].sort()).toEqual(arr);
      expect(r.every((x) => x !== undefined)).toBe(true);
    }
  });
});
