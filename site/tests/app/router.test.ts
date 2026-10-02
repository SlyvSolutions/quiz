// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { navigate, initRouter } from '../../src/app/router';
import { criarRodape } from '../../src/app/rodape';
import { criarCabecalho } from '../../src/app/cabecalho';

describe('Router & App', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"><div id="router-view"></div></div>';
    delete document.body.dataset.tema;
    window.location.hash = '';
    window.scrollTo = vi.fn();
    vi.restoreAllMocks();
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
  });

  it('deve navegar para a tela de inicio por padrao, no tema escuro (tela de emocao)', async () => {
    navigate('');
    await new Promise((r) => setTimeout(r, 0));
    expect(document.querySelector('.inicio-wizard')).not.toBeNull();
    expect(document.body.dataset.tema).toBe('escuro');
  });

  it('deve usar o tema claro nas telas de acao', () => {
    navigate('#metodo');
    expect(document.body.dataset.tema).toBe('claro');
    expect(document.body.dataset.tela).toBe('metodo');
  });

  it('deve barrar etapa fora de ordem e levar para a que falta, com aviso', () => {
    localStorage.clear();
    navigate('#comparador');
    expect(document.body.dataset.tela).toBe('teste-cego');
    expect(document.querySelector('.toast')?.textContent).toMatch(/Comparador abre/);
    navigate('#resultado');
    expect(document.body.dataset.tela).toBe('teste-cego');
  });

  it('deve montar o rodape com aviso de autoria', () => {
    const rodape = criarRodape();
    expect(rodape.textContent).toContain('Ferramenta idealizada e desenvolvida por apoiadores do Partido Missão');
  });

  it('deve montar o cabecalho com as duas logos e a navegacao', () => {
    const cab = criarCabecalho();
    expect(cab.querySelectorAll('img')).toHaveLength(2);
    expect(cab.querySelectorAll('.app-nav a')).toHaveLength(2);
    expect(cab.querySelector('.trilha')).not.toBeNull();
  });

  it('deve inicializar o router e ouvir o evento hashchange', () => {
    initRouter();
    window.location.hash = '#metodo';
    window.dispatchEvent(new Event('hashchange'));
    expect(document.body.dataset.tema).toBe('claro');
    expect(document.body.dataset.tela).toBe('metodo');
  });

  it('#330: navigate direto sincroniza o hash com a tela exibida', () => {
    localStorage.clear();
    window.location.hash = '#inicio';
    navigate('#inicio');
    navigate('#teste-cego');
    expect(window.location.hash).toBe('#teste-cego');
    expect(document.body.dataset.tela).toBe('teste-cego');
  });

  it('#330: com hash vazio, navigate sincroniza o hash', () => {
    localStorage.clear();
    window.location.hash = '';
    navigate('#teste-cego');
    expect(window.location.hash).toBe('#teste-cego');
    expect(document.body.dataset.tela).toBe('teste-cego');
  });

  it('#330: voltar ao #inicio via hashchange mostra a tela de inicio', () => {
    localStorage.clear();
    initRouter();
    window.location.hash = '#inicio';
    navigate('#inicio');
    navigate('#teste-cego');
    expect(window.location.hash).toBe('#teste-cego');
    window.location.hash = '#inicio';
    window.dispatchEvent(new Event('hashchange'));
    expect(document.body.dataset.tela).toBe('inicio');
  });

  it('#330: navigate para a mesma rota com hash certo nao empilha history', () => {
    localStorage.clear();
    window.location.hash = '#inicio';
    navigate('#inicio');
    const len = history.length;
    navigate('#inicio');
    expect(window.location.hash).toBe('#inicio');
    expect(history.length).toBe(len);
  });
});
