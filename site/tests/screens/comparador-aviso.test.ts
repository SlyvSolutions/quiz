// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/app/router', () => ({ navigate: vi.fn() }));
import { renderComparador } from '../../src/screens/comparador/index';

const trechos = [
  { id: 'lula-saude', candidato_id: 'lula', eixo: 'Saúde', arquivo: 'Lula_Plano_Original.md', texto_literal: 'Texto A' },
  { id: 'flavio-saude', candidato_id: 'flavio', eixo: 'Saúde', arquivo: 'Flavio_Plano_Original.md', texto_literal: 'Texto B' },
];
const candidatos = [
  { id: 'lula', nome: 'Lula', partido: 'PT' },
  { id: 'flavio', nome: 'Flávio Bolsonaro', partido: 'PL' },
  { id: 'renan', nome: 'Renan Santos', partido: 'Missão' },
  { id: 'caiado', nome: 'Ronaldo Caiado', partido: 'PSD' },
  { id: 'cury', nome: 'Augusto Cury', partido: 'Sem Partido' },
];
const avaliacoes = trechos.flatMap((t) =>
  ['C1', 'C2', 'C3', 'C4', 'C5'].map((c) => ({
    trecho_id: t.id,
    criterio_id: c,
    veredito: 'Parcial',
    justificativa: `justificativa ${t.id} ${c}`,
    fonte: c === 'C1' ? 'https://www.planalto.gov.br/lei' : `Norma citada ${c}`,
    ...(t.id === 'lula-saude' && c === 'C2' ? { outro_lado: 'Texto do outro lado (Fonte: X)' } : {}),
  }))
);

beforeEach(() => {
  document.body.replaceChildren();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.endsWith('/trechos.json')) return { ok: true, json: async () => trechos };
      if (url.endsWith('/candidatos.json')) return { ok: true, json: async () => candidatos };
      if (url.endsWith('/avaliacoes.json')) return { ok: true, json: async () => avaliacoes };
      return { ok: false, json: async () => ({}) };
    })
  );
});

describe('Comparador: sem carimbo jurídico, com fonte por avaliação', () => {
  it('não traz carimbo nem menção de revisão jurídica, mas mantém a fonte e o Outro lado', async () => {
    const tela = await renderComparador();
    expect(tela.querySelectorAll('.comp-trecho-card .aviso')).toHaveLength(0);
    expect(tela.textContent).not.toMatch(/revis[aã]o jur[ií]dica/i);
    expect(tela.querySelectorAll('.comp-av-fonte').length).toBeGreaterThan(0);
    expect(tela.querySelectorAll('.comp-av-outro-lado').length).toBe(1);
  });

  it('mostra a fonte de cada avaliação; só vira link quando é endereço web', async () => {
    const tela = await renderComparador();
    const card = tela.querySelector('.comp-trecho-card')!;
    const fontes = [...card.querySelectorAll('.comp-av-fonte')];
    expect(fontes).toHaveLength(5);
    expect(fontes[0]!.tagName).toBe('A');
    expect(fontes[0]!.getAttribute('href')).toBe('https://www.planalto.gov.br/lei');
    expect(fontes[1]!.tagName).toBe('P');
    expect(fontes[1]!.textContent).toContain('Norma citada C2');
  });

  it('mostra o outro lado só quando a avaliação traz o texto', async () => {
    const tela = await renderComparador();
    const outros = [...tela.querySelectorAll('.comp-av-outro-lado')];
    expect(outros).toHaveLength(1);
    expect(outros[0]!.textContent).toContain('Texto do outro lado (Fonte: X)');
    expect(outros[0]!.querySelector('summary')?.textContent).toBe('Outro lado');
  });

  it('sem candidatos.json mostra erro visível e não usa nomes de reserva', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, statusText: 'x', json: async () => ({}) })));
    const tela = await renderComparador();
    expect(tela.textContent).toContain('Não foi possível carregar os candidatos');
    expect(tela.querySelector('.comp-trecho-card')).toBeNull();
  });
});
