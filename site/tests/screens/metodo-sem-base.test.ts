// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';

vi.mock('../../src/app/router', () => ({ navigate: vi.fn() }));
import { renderMetodo } from '../../src/screens/metodo/index';

const criterios = JSON.parse(readFileSync('public/data/criterios.json', 'utf-8'));

beforeEach(() => {
  document.body.replaceChildren();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      url.endsWith('/criterios.json') ? { ok: true, json: async () => criterios } : { ok: false, json: async () => ({}) }
    )
  );
});

describe('Método: seção dos critérios de viabilidade', () => {
  it('explica o que Sem base para avaliar quer dizer e o que não quer dizer', async () => {
    const tela = await renderMetodo();
    const texto = tela.textContent ?? '';
    expect(texto).toContain('Sem base para avaliar');
    expect(texto).toContain('falta de fonte aparece na concretude');
    expect(texto).toContain('fonte aberta e conferida');
  });

  it('explica que o selo mostra a concretude, N de 5 critérios avaliados', async () => {
    const tela = await renderMetodo();
    const texto = tela.textContent ?? '';
    expect(texto).toContain('O selo mostra a concretude do trecho');
    expect(texto).toContain('quantos dos cinco critérios deu para avaliar com fonte');
    expect(texto).toContain('N de 5');
  });

  it('não diz que não há nota nenhuma', async () => {
    const tela = await renderMetodo();
    expect(tela.textContent ?? '').not.toContain('Não há nota geral nem ranking: só o veredito por critério.');
  });

  it('não traz mais a contagem fixa de 125 avaliações em 25 trechos', async () => {
    const tela = await renderMetodo();
    const texto = tela.textContent ?? '';
    expect(texto).not.toContain('Hoje são 125 avaliações');
    expect(texto).toContain('cada trecho avaliado, no Comparador e no quiz, recebe cinco avaliações');
  });

  it('explica o bloco Outro lado do Comparador, que o site publica', async () => {
    const tela = await renderMetodo();
    const texto = tela.textContent ?? '';
    expect(texto).toContain('“Outro lado”');
    expect(texto).toContain('não muda o veredito');
  });
});

describe('Método: seção dos textos', () => {
  it('não publica percentuais de fidelidade que ninguém mediu', async () => {
    const tela = await renderMetodo();
    const texto = tela.textContent ?? '';
    for (const p of ['94,7%', '97,5%', '99,3%']) expect(texto).not.toContain(p);
    expect(texto).not.toContain('coincidem em');
    expect(texto).not.toContain('conferência feita pela equipe em 28/09/2026');
  });

  it('diz só que a frase é escolha da equipe e aponta os documentos de trabalho', async () => {
    const tela = await renderMetodo();
    const texto = tela.textContent ?? '';
    expect(texto).toContain('A equipe escolheu as frases');
    expect(texto).toContain('docs/avaliacao');
  });
});

describe('Método: o que os arquivos de dados revelam do anonimato', () => {
  it('diz que ids, candidato_id, arquivo da fonte e texto literal denunciam o autor a quem abrir os arquivos', async () => {
    const tela = await renderMetodo();
    const texto = tela.textContent ?? '';
    expect(texto).toContain('candidato_id');
    expect(texto).toContain('nome do arquivo do plano');
    expect(texto).toContain('texto sem máscara');
    expect(texto).toContain('de quem é cada trecho');
  });
});
