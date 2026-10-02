import { describe, it, expect } from 'vitest';
import { TOTAL_PERGUNTAS } from '../../src/core/jornada';
import { gerarTextoCompartilhamento } from '../../src/share/texto';

describe('texto de compartilhamento honesto', () => {
  const t = gerarTextoCompartilhamento({ ranking: [{ nome: 'Lula', afinidade: 50 }] });

  it('diz que mede concordância com o total de trechos do quiz e não afinidade com o programa', () => {
    expect(t).toContain(`${TOTAL_PERGUNTAS} trechos`);
    expect(gerarTextoCompartilhamento({ ranking: [], total: 7 })).toContain('7 trechos');
    expect(t).not.toMatch(/ranking/i);
  });

  it('diz que não é recomendação de voto', () => {
    expect(t).toMatch(/Não é recomendação de voto/);
  });
});
