/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { iniciarFrasePresa } from '../../src/motion/frase-presa';

function secaoComAltura(top: number, height: number): HTMLElement {
  const el = document.createElement('section');
  el.getBoundingClientRect = () => ({ top, height, bottom: top + height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) });
  return el;
}

describe('Frase Presa Motion', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true });
  });

  it('amarra --p a rolagem: 0 no topo da secao, 1 no fim', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    const inicio = secaoComAltura(0, 1800);
    const limpar = iniciarFrasePresa(inicio);
    expect(inicio.style.getPropertyValue('--p')).toBe('0.000');
    limpar();

    const fim = secaoComAltura(-800, 1800);
    iniciarFrasePresa(fim)();
    expect(fim.style.getPropertyValue('--p')).toBe('1.000');
  });

  it('em movimento reduzido nao amarra nada a rolagem (o CSS mostra a frase inteira)', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    const secao = secaoComAltura(-400, 1800);
    iniciarFrasePresa(secao)();
    expect(secao.style.getPropertyValue('--p')).toBe('');
  });
});
