// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { criarBotaoRolar } from '../../src/ui/rolar';

/**
 * jsdom não implementa IntersectionObserver, e `criarBotaoRolar` desiste cedo
 * quando ele não existe (rolar.ts:27-29) — sem o stub abaixo o clique na
 * bolinha nem chega a ser ligado, e o teste passaria por engano.
 */
class ObservadorFalso {
  static instancias: ObservadorFalso[] = [];
  observados: Element[] = [];
  desconectado = false;
  opcoes?: IntersectionObserverInit;

  constructor(_cb: IntersectionObserverCallback, opcoes?: IntersectionObserverInit) {
    this.opcoes = opcoes;
    ObservadorFalso.instancias.push(this);
  }

  observe(alvo: Element): void {
    this.observados.push(alvo);
  }

  unobserve(): void {}

  disconnect(): void {
    this.desconectado = true;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

describe('criarBotaoRolar', () => {
  beforeEach(() => {
    ObservadorFalso.instancias = [];
    vi.stubGlobal('IntersectionObserver', ObservadorFalso);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('monta a bolinha e observa o alvo, usando o slide como raiz', () => {
    const raiz = document.createElement('div');
    const alvo = document.createElement('div');
    const { botao } = criarBotaoRolar(raiz, alvo);

    expect(botao.className).toBe('rolar-bolha');
    expect(botao.getAttribute('aria-label')).toBe('Rolar até os botões');
    expect(botao.hasAttribute('hidden')).toBe(true);

    const observador = ObservadorFalso.instancias[0]!;
    expect(observador.observados).toEqual([alvo]);
    expect(observador.opcoes).toMatchObject({ root: raiz, threshold: 1 });
  });

  it('ao clicar, rola o contêiner até o FIM (top = scrollHeight)', () => {
    const raiz = document.createElement('div');
    const alvo = document.createElement('div');
    raiz.appendChild(alvo);
    const scrollTo = vi.fn();
    Object.defineProperty(raiz, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(raiz, 'scrollTo', { value: scrollTo, configurable: true, writable: true });

    const { botao } = criarBotaoRolar(raiz, alvo);
    botao.click();

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 1000 }));
  });

  it('desmontar() desliga o observador e o clique', () => {
    const raiz = document.createElement('div');
    const alvo = document.createElement('div');
    const scrollTo = vi.fn();
    Object.defineProperty(raiz, 'scrollTo', { value: scrollTo, configurable: true, writable: true });

    const { botao, desmontar } = criarBotaoRolar(raiz, alvo);
    desmontar();

    expect(ObservadorFalso.instancias[0]!.desconectado).toBe(true);
    botao.click();
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
