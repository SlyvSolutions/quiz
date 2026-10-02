import { describe, it, expect } from 'vitest';
import { TOTAL_SLIDES, criarEstadoWizard } from '../../src/screens/inicio/wizard-state';

describe('estado do wizard', () => {
  it('tem 5 slides', () => {
    expect(TOTAL_SLIDES).toBe(5);
  });

  it('navega e trava nas bordas', () => {
    const e = criarEstadoWizard(0);
    e.anterior();
    expect(e.atual).toBe(0);
    e.irPara(99);
    expect(e.atual).toBe(0);
    e.irPara(4);
    e.proximo();
    expect(e.atual).toBe(4);
    e.irPara(2);
    e.proximo();
    expect(e.atual).toBe(3);
  });

  it('accordion abre um por vez', () => {
    const e = criarEstadoWizard(0);
    e.alternarAcordeao('s2-p1');
    expect(e.abertoAcordeao).toBe('s2-p1');
    e.alternarAcordeao('s2-p2');
    expect(e.abertoAcordeao).toBe('s2-p2');
    e.alternarAcordeao('s2-p2');
    expect(e.abertoAcordeao).toBeNull();
  });
});
