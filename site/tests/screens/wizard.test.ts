// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { criarSlides, criarConteudoMetodo, criarConteudoSorteio } from '../../src/screens/inicio/slides';

function ctx() {
  return { sessao: null, aoAvancar: vi.fn(), aoPular: vi.fn(), aoComecar: vi.fn() };
}

describe('slides 1 e 5', () => {
  it('são 5 slides com data-slide e aria-label', () => {
    const slides = criarSlides(ctx());
    expect(slides).toHaveLength(5);
    slides.forEach((s, i) => {
      expect(s.getAttribute('data-slide')).toBe(String(i + 1));
      expect(s.getAttribute('aria-label')).toMatch(new RegExp(`Slide ${i + 1} de 5`));
    });
  });

  it('slide 1 tem a provocação e NÃO tem onça grande nem CTA de começar', () => {
    const [s1] = criarSlides(ctx());
    if (!s1) throw new Error("slide 1 ausente");
    expect(s1.textContent).toMatch(/A PROPOSTA ANTES DA NARRATIVA/);
    expect(s1.querySelector('.inicio-objeto, .onca-borda')).toBeNull();
    expect(s1.textContent).not.toMatch(/COMEÇAR TESTE CEGO/);
  });

  it('CTA do slide 5 chama aoComecar com #teste-cego', () => {
    const c = ctx();
    const slides = criarSlides(c);
    const s5 = slides[4]!;
    expect(s5.textContent).toMatch(/PRONTO PRA VOTAR NAS IDEIAS/);
    const cta = s5.querySelector('button');
    expect(cta?.textContent).toMatch(/COMEÇAR TESTE CEGO/);
    cta?.click();
    expect(c.aoComecar).toHaveBeenCalledWith('#teste-cego');
  });
});

describe('virada missão e navegação', () => {
  it('onça grande aparece SÓ no slide 4; o slide 3 não tem selo de candidato', () => {
    const slides = criarSlides(ctx());
    expect(slides[0]!.querySelector('.inicio-objeto')).toBeNull();
    expect(slides[1]!.querySelector('.inicio-objeto')).toBeNull();
    expect(slides[2]!.querySelector('.inicio-objeto')).toBeNull();
    expect(slides[2]!.querySelector('#sorteio-selo')).toBeNull();
    expect(slides[2]!.querySelector('#sorteio-base-cta')).toBeNull();
    expect(slides[3]!.querySelector('.inicio-objeto .onca-borda')).not.toBeNull();
    expect(slides[3]!.textContent).toMatch(/POR ISSO ABRIMOS TUDO/);
    expect(slides[3]!.textContent).toMatch(/Renan Santos/);
    expect(slides[3]!.textContent).not.toMatch(/COMEÇAR TESTE CEGO/);
  });

  it('slides do meio têm PRÓXIMO no conteúdo que avança sem a seta de baixo', async () => {
    const { criarWizard } = await import('../../src/screens/inicio/wizard');
    for (const n of ['2', '3', '4']) {
      const deck = criarWizard(Number(n) - 1);
      const btn = Array.from(deck.querySelectorAll(`[data-slide="${n}"] button`)).find((b) =>
        b.textContent?.match(/PRÓXIMO/)
      ) as HTMLButtonElement | undefined;
      expect(btn, `slide ${n} sem PRÓXIMO`).toBeTruthy();
      btn!.click();
      expect(deck.querySelector(`[data-slide="${Number(n) + 1}"]`)?.getAttribute('aria-hidden')).toBe('false');
    }
  });

  it('deck expõe dots, setas e pular; seta avança o slide visível', async () => {
    const { criarWizard } = await import('../../src/screens/inicio/wizard');
    const deck = criarWizard(0);
    expect(deck.querySelectorAll('[data-dot]').length).toBe(5);
    expect(deck.querySelector('[data-dot="1"]')?.textContent).toBe('1');
    expect(deck.querySelector('[data-dot="5"]')?.textContent).toBe('5');
    (deck.querySelector('[data-nav="proximo"]') as HTMLButtonElement).click();
    expect(deck.querySelector('[data-slide="2"]')?.getAttribute('aria-hidden')).toBe('false');
    expect(deck.querySelector('[data-slide="1"]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('deck expõe tema do slide atual em dataset.tema (escuro no 1, claro no 2)', async () => {
    const { criarWizard } = await import('../../src/screens/inicio/wizard');
    const deck = criarWizard(0);
    expect(deck.dataset.tema).toBe('escuro');
    (deck.querySelector('[data-dot="2"]') as HTMLButtonElement).click();
    expect(deck.dataset.tema).toBe('claro');
  });

  it('pular é o primeiro filho do deck (faixa fixa no topo)', async () => {
    const { criarWizard } = await import('../../src/screens/inicio/wizard');
    const deck = criarWizard(0);
    expect(deck.firstElementChild?.classList.contains('wizard-pular')).toBe(true);
  });

  it('slide 3 é demonstração neutra: trecho sorteado sem selos nem vereditos', async () => {
    const { criarWizard } = await import('../../src/screens/inicio/wizard');
    const deck = criarWizard(2);
    expect(deck.querySelectorAll('.wizard-veredito-linha').length).toBe(0);
    expect(deck.querySelector('#sorteio-forca')).toBeNull();
    expect(deck.querySelector('#sorteio-nome')).not.toBeNull();
    expect(deck.querySelector('#sorteio-trecho')).not.toBeNull();
    expect(deck.querySelector('#sorteio-ref')).not.toBeNull();
  });
});

describe('expansíveis', () => {
  it('slide 2 tem 4 passos expansíveis com o "como?" real', () => {
    const slides = criarSlides(ctx());
    const detalhes = slides[1]!.querySelectorAll('details');
    expect(detalhes.length).toBe(4);
    expect(slides[1]!.textContent).toMatch(/Plano 1.*Plano 5/);
    expect(slides[1]!.textContent).toMatch(/palavra por palavra/);
  });

  it('slide 3 sorteia exemplo real + overlay metodológico (sem selos, sem vereditos, sem CTA)', () => {
    const slides = criarSlides(ctx());
    const s3 = slides[2]!;
    expect(s3.textContent).toMatch(/A RÉGUA, NA PRÁTICA/);
    expect(s3.textContent).toMatch(/Trecho sorteado/);
    expect(s3.querySelector('#sorteio-nome')).not.toBeNull();
    expect(s3.querySelector('#sorteio-trecho')).not.toBeNull();
    expect(s3.querySelector('#sorteio-ref')).not.toBeNull();
    expect(s3.querySelector('#btn-sortear-outro')).not.toBeNull();
    expect(s3.querySelectorAll('.wizard-veredito-linha').length).toBe(0);
    expect(s3.querySelector('#sorteio-forca')).toBeNull();
    expect(s3.querySelector('#sorteio-base-cta')).toBeNull();
    expect(s3.querySelector('#sorteio-selo')).toBeNull();
    expect(s3.querySelector('#metodo-conteudo')).toBeNull();
    const overlay = criarConteudoMetodo();
    expect(overlay.textContent).toMatch(/Sem base para avaliar/);
    expect(overlay.querySelectorAll('.wizard-metodo-passos > li').length).toBe(5);
    expect(s3.querySelector('#btn-metodo-abrir')).not.toBeNull();
    expect(overlay.textContent).toMatch(/O SORTEIO É JUSTO/);
    expect(overlay.querySelector('.wizard-codigo')?.textContent).toMatch(/Math\.random/);
  });
});

describe('modal do método', () => {
  async function esperarDialogo(): Promise<HTMLElement | null> {
    for (let i = 0; i < 100 && !document.querySelector('[role="dialog"]'); i++) {
      await new Promise((r) => setTimeout(r, 10));
    }
    return document.querySelector<HTMLElement>('[role="dialog"]');
  }

  async function fecharDialogo(dialog: HTMLElement): Promise<void> {
    (dialog.querySelector('.ui-slide-close') as HTMLButtonElement).click();
    await new Promise((r) => setTimeout(r, 450));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  }

  it('slide 3: o botão abre o modal com título e 5 passos, e fecha pelo X', async () => {
    const s3 = criarSlides(ctx())[2]!;
    (s3.querySelector('#btn-metodo-abrir') as HTMLButtonElement).click();
    const dialog = await esperarDialogo();
    expect(dialog).not.toBeNull();
    expect(dialog!.getAttribute('aria-label')).toBe('COMO FUNCIONA O MÉTODO');
    expect(dialog!.querySelectorAll('.wizard-metodo-passos > li').length).toBe(5);
    await fecharDialogo(dialog!);
  });

  it('slide 2: o botão abre o modal O SORTEIO com o código do sorteio, e fecha pelo X', async () => {
    const s2 = criarSlides(ctx())[1]!;
    (s2.querySelector('#btn-jornada-metodo') as HTMLButtonElement).click();
    const dialog = await esperarDialogo();
    expect(dialog).not.toBeNull();
    expect(dialog!.getAttribute('aria-label')).toBe('O SORTEIO');
    expect(dialog!.querySelector('.wizard-codigo')?.textContent).toMatch(/embaralhar/);
    expect(criarConteudoSorteio().querySelectorAll('.wizard-metodo-passos > li').length).toBe(3);
    await fecharDialogo(dialog!);
  });
});

describe('swipe', () => {
  // jsdom não tem TouchEvent: um Event comum com as listas que o handler lê basta.
  function toque(tipo: string, clientX: number): Event {
    const evento = new Event(tipo);
    Object.assign(evento, tipo === 'touchstart' ? { touches: [{ clientX }] } : { changedTouches: [{ clientX }] });
    return evento;
  }

  it('deslizar o dedo no trilho NÃO troca de slide', async () => {
    const { criarWizard } = await import('../../src/screens/inicio/wizard');
    const deck = criarWizard(0);
    const trilho = deck.querySelector('.wizard-trilho');
    if (!trilho) throw new Error('trilho ausente');
    const dotSelecionado = (): string | null | undefined =>
      deck.querySelector('[data-dot][aria-selected="true"]')?.getAttribute('data-dot');

    expect(dotSelecionado()).toBe('1');

    // deslize para a esquerda (dx = -250), que antes avançava um slide
    trilho.dispatchEvent(toque('touchstart', 300));
    trilho.dispatchEvent(toque('touchend', 50));
    expect(dotSelecionado()).toBe('1');
    expect(deck.querySelector('[data-slide="1"]')?.getAttribute('aria-hidden')).toBe('false');

    // e para a direita (dx = +250), que antes voltava um slide
    trilho.dispatchEvent(toque('touchstart', 50));
    trilho.dispatchEvent(toque('touchend', 300));
    expect(dotSelecionado()).toBe('1');
  });
});
