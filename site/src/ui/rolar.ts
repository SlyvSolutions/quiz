import { el } from './dom';
import { prefersReducedMotion } from '../motion/reduced-motion';

export interface RolarAte {
  botao: HTMLButtonElement;
  desmontar(): void;
}

/**
 * Bolinha que rola o slide até o fim. Aparece enquanto o alvo (o ÚLTIMO
 * bloco de botões) estiver fora da vista; ao clicar, rola o slide até o fim.
 * O alvo continua sendo usado só pelo IntersectionObserver, que observa
 * com o slide como raiz.
 * O deck persiste até a troca de tela, quando o conjunto sai junto;
 * desmontar() desliga o observador nesse caso.
 */
export function criarBotaoRolar(raiz: HTMLElement, alvo: HTMLElement): RolarAte {
  const botao = el(
    'button',
    {
      class: 'rolar-bolha',
      attrs: { type: 'button', 'aria-label': 'Rolar até os botões', hidden: '' },
    },
    '↓',
  );

  if (typeof IntersectionObserver === 'undefined') {
    return { botao, desmontar(): void {} };
  }

  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) botao.hidden = entrada.isIntersecting;
    },
    { root: raiz, threshold: 1 },
  );
  observador.observe(alvo);

  function aoClicar(): void {
    raiz.scrollTo({ top: raiz.scrollHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }
  botao.addEventListener('click', aoClicar);

  return {
    botao,
    desmontar(): void {
      observador.disconnect();
      botao.removeEventListener('click', aoClicar);
    },
  };
}
