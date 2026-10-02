import { describe, it, expect } from 'vitest';
import { normalizarTexto } from '../../src/core/normalizar-texto';

describe('normalizarTexto', () => {
  it('texto vazio devolve vazio', () => {
    expect(normalizarTexto('')).toBe('');
    expect(normalizarTexto('   ')).toBe('');
  });

  it('remove quebras de linha e colapsa espaços', () => {
    const original = 'Este    é um\ntexto\n\ncom   muitos \r\nespaços.';
    const esperado = 'Este é um texto com muitos espaços.';
    expect(normalizarTexto(original)).toBe(esperado);
  });

  it('remove hifenização de fim de linha', () => {
    const original = 'Uma pala-\nvra hifenizada no final da li-\n nha.';
    const esperado = 'Uma palavra hifenizada no final da linha.';
    expect(normalizarTexto(original)).toBe(esperado);
  });

  it('mantém palavras com acento inalteradas e trata-as corretamente', () => {
    const original = 'Ação gover-\nnamental de exceção.';
    const esperado = 'Ação governamental de exceção.';
    expect(normalizarTexto(original)).toBe(esperado);
  });

  it('não altera palavras com hífen normal no meio da frase', () => {
    const original = 'Um texto bem-sucedido não deve per-\nder o sentido.';
    const esperado = 'Um texto bem-sucedido não deve perder o sentido.';
    expect(normalizarTexto(original)).toBe(esperado);
  });
});
