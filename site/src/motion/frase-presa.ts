import { prefersReducedMotion } from './reduced-motion';

/**
 * Gesto 3: frase presa. A seção é alta (--mq-frase-altura) e o conteúdo fica preso (sticky) enquanto a
 * rolagem preenche --p, de 0 a 1. O CSS decide o que aparece em cada ponto. Em movimento reduzido nada
 * é amarrado à rolagem: o CSS já mostra a frase inteira.
 */
export function iniciarFrasePresa(secao: HTMLElement): () => void {
  if (prefersReducedMotion()) return () => {};

  const atualizar = () => {
    const r = secao.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    secao.style.setProperty('--p', p.toFixed(3));
  };

  window.addEventListener('scroll', atualizar, { passive: true });
  window.addEventListener('resize', atualizar);
  atualizar();

  return () => {
    window.removeEventListener('scroll', atualizar);
    window.removeEventListener('resize', atualizar);
  };
}
