// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarCabecalho, LINKS_NAV } from '../../src/app/cabecalho';

describe('cabecalho app-inicio', () => {
  it('tem a.app-inicio[#inicio] com aria-label Início, depois da marca e antes da trilha', () => {
    const cab = criarCabecalho();
    document.body.innerHTML = '';
    document.body.appendChild(cab);

    const inicio = cab.querySelector<HTMLAnchorElement>('a.app-inicio[href="#inicio"]');
    expect(inicio).not.toBeNull();
    expect(inicio?.getAttribute('aria-label')).toBe('Início');
    expect(inicio?.getAttribute('title')).toBe('Início');
    expect(inicio?.querySelector('svg.icone-casa')).not.toBeNull();

    const interno = cab.querySelector('.app-header-interno');
    expect(interno).not.toBeNull();
    const filhos = Array.from(interno?.children ?? []);
    const iMarca = filhos.findIndex((e) => e.classList.contains('app-marca'));
    const iInicio = filhos.findIndex((e) => e.classList.contains('app-inicio'));
    const iTrilha = filhos.findIndex((e) => e.classList.contains('trilha'));
    expect(iMarca).toBeGreaterThanOrEqual(0);
    expect(iInicio).toBeGreaterThanOrEqual(0);
    expect(iTrilha).toBeGreaterThanOrEqual(0);
    expect(iInicio).toBeGreaterThan(iMarca);
    expect(iTrilha).toBeGreaterThan(iInicio);
  });
});

describe('cabecalho app-menu (celular)', () => {
  it('tem button.app-menu com aria-label Menu, aria-haspopup dialog e aria-expanded false', () => {
    const cab = criarCabecalho();
    document.body.innerHTML = '';
    document.body.appendChild(cab);

    const menu = cab.querySelector<HTMLButtonElement>('button.app-menu');
    expect(menu).not.toBeNull();
    expect(menu?.getAttribute('type')).toBe('button');
    expect(menu?.getAttribute('aria-label')).toBe('Menu');
    expect(menu?.getAttribute('aria-haspopup')).toBe('dialog');
    expect(menu?.getAttribute('aria-expanded')).toBe('false');
    expect(menu?.querySelector('svg.icone-menu')).not.toBeNull();
  });

  it('app-menu é o último filho de .app-header-interno', () => {
    const cab = criarCabecalho();
    document.body.innerHTML = '';
    document.body.appendChild(cab);

    const interno = cab.querySelector('.app-header-interno');
    expect(interno).not.toBeNull();
    const filhos = Array.from(interno?.children ?? []);
    const ultimo = filhos[filhos.length - 1];
    expect(ultimo?.classList.contains('app-menu')).toBe(true);
    const iNav = filhos.findIndex((e) => e.classList.contains('app-nav'));
    const iTrilha = filhos.findIndex((e) => e.classList.contains('trilha'));
    const iMenu = filhos.findIndex((e) => e.classList.contains('app-menu'));
    expect(iMenu).toBeGreaterThan(iNav);
    expect(iMenu).toBeGreaterThan(iTrilha);
  });
});

describe('cabecalho renome Paraná', () => {
  it("app-nav mostra rótulo curto 'Candidatos PR' com aria-label e title completos", () => {
    const cab = criarCabecalho();
    document.body.innerHTML = '';
    document.body.appendChild(cab);

    const link = cab.querySelector<HTMLAnchorElement>('.app-nav a[href="#parana"]');
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe('Candidatos PR');
    expect(link?.getAttribute('aria-label')).toBe('Candidatos da Missão no PR');
    expect(link?.getAttribute('title')).toBe('Candidatos da Missão no PR');
    expect(LINKS_NAV.find((l) => l.hash === '#parana')?.rotulo).toBe('Candidatos PR');
  });

  it("texto 'Guia do Paraná' não existe em nenhum .ts de site/src (exceto tests/ e parana/index.ts, vedado pela task)", () => {
    const aqui = dirname(fileURLToPath(import.meta.url));
    const raizSrc = join(aqui, '..', '..', 'src');
    const alvos: string[] = [];
    const visitar = (dir: string) => {
      for (const nome of readdirSync(dir)) {
        const caminho = join(dir, nome);
        if (statSync(caminho).isDirectory()) visitar(caminho);
        else if (nome.endsWith('.ts')) alvos.push(caminho);
      }
    };
    visitar(raizSrc);
    const comOcorrencia = alvos
      .filter((f) => !f.replace(/\\/g, '/').endsWith('/screens/parana/index.ts'))
      .filter((f) => readFileSync(f, 'utf8').includes('Guia do Paraná'));
    expect(comOcorrencia).toEqual([]);
  });
});
