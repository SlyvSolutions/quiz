import { describe, it, expect } from 'vitest';
import { montarAvaliacoesPublicadas } from '../../scripts/build-avaliacoes';

const av = (trecho_id: string, criterio_id: string, extra: Record<string, unknown> = {}) => ({
  trecho_id,
  criterio_id,
  veredito: 'Parcial',
  justificativa: `j ${trecho_id} ${criterio_id}`,
  fonte: 'f',
  provisorio: false,
  revisar_dev: true,
  pendente_pesquisa: true,
  ...extra,
});
const cinco = (id: string) => ['C1', 'C2', 'C3', 'C4', 'C5'].map((c) => av(id, c));

describe('montarAvaliacoesPublicadas', () => {
  it('separa as avaliações dos trechos do site e dos demos', () => {
    const r = montarAvaliacoesPublicadas([...cinco('lula-seguranca'), ...cinco('demo-lula-saude')], ['lula-seguranca'], ['demo-lula-saude']);
    expect(r.avaliacoes).toHaveLength(5);
    expect(r.demo).toHaveLength(5);
    expect(r.avaliacoes.every((a) => a.trecho_id === 'lula-seguranca')).toBe(true);
    expect(r.demo.every((a) => a.trecho_id === 'demo-lula-saude')).toBe(true);
  });

  it('publica só os cinco campos, nunca os internos', () => {
    const r = montarAvaliacoesPublicadas(cinco('lula-seguranca'), ['lula-seguranca'], []);
    expect(Object.keys(r.avaliacoes[0]!).sort()).toEqual(['criterio_id', 'fonte', 'justificativa', 'trecho_id', 'veredito']);
  });

  it('falha se um trecho do site não tem avaliação', () => {
    expect(() => montarAvaliacoesPublicadas(cinco('lula-seguranca'), ['lula-seguranca', 'flavio-seguranca'], [])).toThrow(/flavio-seguranca/);
  });

  it('falha se um trecho não tem exatamente 5 avaliações', () => {
    const quatro = cinco('lula-seguranca').slice(0, 4);
    expect(() => montarAvaliacoesPublicadas(quatro, ['lula-seguranca'], [])).toThrow(/5/);
  });

  it('falha se há avaliação de trecho que não existe', () => {
    expect(() => montarAvaliacoesPublicadas([...cinco('lula-seguranca'), ...cinco('fantasma')], ['lula-seguranca'], [])).toThrow(/fantasma/);
  });

  it('mantém a ordem dos ids dos trechos e dos critérios', () => {
    const r = montarAvaliacoesPublicadas(
      [...cinco('b'), ...cinco('a')].reverse(),
      ['a', 'b'],
      []
    );
    expect(r.avaliacoes.map((x) => `${x.trecho_id}${x.criterio_id}`)).toEqual([
      'aC1', 'aC2', 'aC3', 'aC4', 'aC5', 'bC1', 'bC2', 'bC3', 'bC4', 'bC5',
    ]);
  });
});
