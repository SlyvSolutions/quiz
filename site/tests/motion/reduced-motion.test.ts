// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prefersReducedMotion } from '../../src/motion/reduced-motion';
import { revelarBlocos } from '../../src/motion/entrada-de-bloco';

describe('Motion Utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve retornar true quando prefers-reduced-motion for reduce', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    expect(prefersReducedMotion()).toBe(true);
  });

  it('revelarBlocos marca os blocos com .entrada e, sem IntersectionObserver, ja com .entrou', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const raiz = document.createElement('div');
    raiz.appendChild(document.createElement('header'));
    const fixo = document.createElement('footer');
    fixo.dataset.fixo = '';
    raiz.appendChild(fixo);
    revelarBlocos(raiz);
    expect(raiz.children[0]?.classList.contains('entrada')).toBe(true);
    expect(raiz.children[0]?.classList.contains('entrou')).toBe(true);
    expect(fixo.classList.contains('entrada')).toBe(false);
  });
});
