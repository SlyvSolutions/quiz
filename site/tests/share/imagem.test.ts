import { describe, it, expect } from 'vitest';
import { quebrarEquilibrado, quebrarLinhas } from '../../src/share/imagem';

/** Cada caractere mede 10; fica fácil prever as quebras. */
const medir = (t: string) => t.length * 10;

describe('quebrarLinhas', () => {
  it('mantém numa linha o que cabe', () => {
    expect(quebrarLinhas(medir, 'minha concordância', 200)).toEqual(['minha concordância']);
  });

  it('quebra nas palavras quando passa do limite', () => {
    expect(quebrarLinhas(medir, 'aaaa bbbb cccc dddd', 90)).toEqual(['aaaa bbbb', 'cccc dddd']);
  });

  it('palavra maior que o limite fica sozinha, sem cortar', () => {
    expect(quebrarLinhas(medir, 'ab palavragigante cd', 50)).toEqual(['ab', 'palavragigante', 'cd']);
  });

  it('texto vazio não gera linhas', () => {
    expect(quebrarLinhas(medir, '   ', 100)).toEqual([]);
  });
});

describe('quebrarEquilibrado', () => {
  it('em duas linhas, evita deixar uma palavra sozinha na segunda', () => {
    expect(quebrarLinhas(medir, 'minha concordância com 3 trechos', 270)).toEqual(['minha concordância com 3', 'trechos']);
    expect(quebrarEquilibrado(medir, 'minha concordância com 3 trechos', 270)).toEqual(['minha concordância', 'com 3 trechos']);
  });

  it('uma linha só continua igual', () => {
    expect(quebrarEquilibrado(medir, 'curto', 270)).toEqual(['curto']);
  });

  it('nunca passa do limite', () => {
    const linhas = quebrarEquilibrado(medir, 'minha concordância com 3 trechos', 270);
    for (const l of linhas) expect(medir(l)).toBeLessThanOrEqual(270);
  });
});
