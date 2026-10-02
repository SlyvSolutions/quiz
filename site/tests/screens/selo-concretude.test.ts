// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';

import { criarSeloConcretude, criarBlocoConcretude } from '../../src/ui/selo-concretude';

describe('selo de concretude', () => {
  it('traz onça, "N de 5" e 5 barrinhas, uma cheia por critério avaliado', () => {
    const selo = criarSeloConcretude({ avaliados: 4, total: 5 });
    expect(selo.textContent).toMatch(/CONCRETUDE 4 de 5/);
    expect(selo.querySelector('.onca-borda')).not.toBeNull();
    expect(selo.querySelectorAll('.selo-concretude-barra').length).toBe(5);
    expect(selo.querySelectorAll('.selo-concretude-barra.cheia').length).toBe(4);
    expect(selo.getAttribute('aria-label')).toBe('Concretude da proposta: 4 de 5 critérios avaliados');
  });

  it('zero avaliados acende nenhuma barrinha', () => {
    const selo = criarSeloConcretude({ avaliados: 0, total: 5 });
    expect(selo.querySelectorAll('.selo-concretude-barra.cheia').length).toBe(0);
    expect(selo.textContent).toMatch(/CONCRETUDE 0 de 5/);
  });
});

describe('bloco de concretude', () => {
  const av = (veredito: string, criterio_id: string) => ({ criterio_id, veredito });
  const SB = 'Sem base para avaliar';

  it('1 critério avaliado: selo "1 de 5"', () => {
    const bloco = criarBlocoConcretude([av('Viável', 'C1'), av(SB, 'C2'), av(SB, 'C3'), av(SB, 'C4'), av(SB, 'C5')]);
    expect(bloco.querySelector('.selo-concretude')?.textContent).toMatch(/CONCRETUDE 1 de 5/);
  });

  it('5 Difícil: concretude 5 de 5', () => {
    const bloco = criarBlocoConcretude(['C1', 'C2', 'C3', 'C4', 'C5'].map((c) => av('Difícil', c)));
    expect(bloco.querySelector('.selo-concretude')?.textContent).toMatch(/CONCRETUDE 5 de 5/);
  });

  it('5 Sem base: concretude 0 de 5', () => {
    const bloco = criarBlocoConcretude(['C1', 'C2', 'C3', 'C4', 'C5'].map((c) => av(SB, c)));
    expect(bloco.querySelector('.selo-concretude')?.textContent).toMatch(/CONCRETUDE 0 de 5/);
  });

  it('não existe mais selo COM BASE', () => {
    const bloco = criarBlocoConcretude([av('Parcial', 'C1'), av(SB, 'C3')]);
    expect(bloco.querySelector('.selo-com-base')).toBeNull();
    expect(bloco.textContent).not.toContain('COM BASE');
  });

  it('sem avaliações mostra texto neutro, sem selos', () => {
    const bloco = criarBlocoConcretude([]);
    expect(bloco.querySelector('.selo-concretude')).toBeNull();
    expect(bloco.textContent).toBe('Sem avaliação carregada');
  });
});
