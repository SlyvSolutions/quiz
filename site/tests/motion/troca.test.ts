// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { iniciarTroca } from '../../src/motion/troca';
import { ultimoClique, consumirClique, iniciarCliques } from '../../src/motion/clique';
import { animarReordenacao } from '../../src/motion/flip';

describe('Troca de tela em iris', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('em movimento reduzido nao cria camada e cobre na hora', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    const t = iniciarTroca({ x: 10, y: 20 }, 'escuro');
    await expect(t.cobriu).resolves.toBeUndefined();
    expect(document.querySelector('.troca')).toBeNull();
  });

  it('cria a camada no tema de destino, com o ponto do clique, e a remove ao cancelar', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    const t = iniciarTroca({ x: 10, y: 20 }, 'escuro');
    const camada = document.querySelector<HTMLElement>('.troca');
    expect(camada).not.toBeNull();
    expect(camada?.dataset.tema).toBe('escuro');
    expect(camada?.style.getPropertyValue('--x')).toBe('10px');
    expect(camada?.style.getPropertyValue('--y')).toBe('20px');
    expect(camada?.classList.contains('expandindo')).toBe(true);
    t.cancelar();
    expect(document.querySelector('.troca')).toBeNull();
  });
});

describe('Cliques', () => {
  it('guarda o ultimo clique por um instante e consome', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    const parar = iniciarCliques();
    const botao = document.createElement('button');
    botao.className = 'btn-pill';
    document.body.appendChild(botao);
    botao.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 33, clientY: 44 }));
    const c = ultimoClique();
    expect(c?.x).toBe(33);
    expect(c?.y).toBe(44);
    expect(botao.querySelector('.onda')).not.toBeNull();
    consumirClique();
    expect(ultimoClique()).toBeNull();
    parar();
  });

  it('sem movimento reduzido nao faz onda mas ainda registra o clique', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    const parar = iniciarCliques();
    const botao = document.createElement('button');
    botao.className = 'btn-pill';
    document.body.appendChild(botao);
    botao.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 1, clientY: 2 }));
    expect(botao.querySelector('.onda')).toBeNull();
    expect(ultimoClique()).not.toBeNull();
    parar();
  });
});

describe('Reordenacao animada', () => {
  it('em movimento reduzido so aplica a mudanca', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    const raiz = document.createElement('div');
    const mudar = vi.fn();
    animarReordenacao(raiz, '.x', mudar);
    expect(mudar).toHaveBeenCalledOnce();
  });
});
