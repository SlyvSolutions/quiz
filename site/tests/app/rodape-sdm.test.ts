// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('../../src/app/router', () => ({ navigate: vi.fn() }));
import { criarRodape } from '../../src/app/rodape';
import { renderMetodo } from '../../src/screens/metodo/index';

const raiz = join(import.meta.dirname, '../../..');
const SUPERLATIVO = /mais avançado|à prova de fraude|impossível fraudar|infalível|perfeito/i;

beforeEach(() => {
  document.body.replaceChildren();
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })));
});

describe('selo SDM no rodapé', () => {
  it('cita o método, a autoria e o contato e não usa superlativo', () => {
    const texto = criarRodape().querySelector('.app-footer-sdm')?.textContent ?? '';
    expect(texto).toContain('SDM Sled-Development-Method');
    expect(texto).toContain('SlyvSolutions');
    expect(texto).toContain('(41) 99946-7052');
    expect(texto).not.toMatch(SUPERLATIVO);
  });
});

describe('Método: como foi construído', () => {
  it('traz fatos verificáveis, sem superlativo, sem menção a revisão jurídica', async () => {
    const secao = (await renderMetodo()).querySelector('#metodo-construcao');
    expect(secao).not.toBeNull();
    const texto = secao!.textContent!;
    expect(texto).toContain('SDM Sled-Development-Method');
    expect(texto).toMatch(/reprova trecho que não seja literal/);
    expect(texto).toMatch(/SHA-256/);
    expect(texto).not.toMatch(/revis[aã]o jur[ií]dica/i);
    expect(texto).not.toMatch(SUPERLATIVO);
  });

  it('todo link da seção aponta para um arquivo que existe no repositório,', async () => {
    const secao = (await renderMetodo()).querySelector('#metodo-construcao')!;
    const hrefs = [...secao.querySelectorAll('a')].map((a) => a.getAttribute('href')!);
    expect(hrefs.length).toBeGreaterThanOrEqual(3);
    for (const href of hrefs) {
      expect(href).toMatch(/^https:\/\/github\.com\/SlyvSolutions\/quiz\/blob\/main\//);
      const caminho = href.replace('https://github.com/SlyvSolutions/quiz/blob/main/', '');
      expect(existsSync(join(raiz, caminho)), caminho).toBe(true);
    }
  });
});
