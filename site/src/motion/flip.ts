import { prefersReducedMotion } from './reduced-motion';
import { lerDuracaoMs, lerToken } from './tokens';

/**
 * Anima a reordenação de elementos (FLIP): mede antes, muda o DOM, mede depois e desliza cada elemento
 * que mudou de lugar da posição antiga para a nova. Serve para o card que voa da lista de opções para a
 * ordem preferida e para Subir/Descer. Em movimento reduzido só faz a mudança.
 */
export function animarReordenacao(raiz: ParentNode, seletor: string, mudar: () => void): void {
  const itens = () => Array.from(raiz.querySelectorAll<HTMLElement>(seletor));
  if (prefersReducedMotion() || typeof Element.prototype.animate !== 'function') {
    mudar();
    return;
  }

  const antes = new Map(itens().map((el) => [el, el.getBoundingClientRect()]));
  mudar();

  const duracao = lerDuracaoMs('dur-emocao');
  const curva = lerToken('ease-entrada') || 'ease-out';
  itens().forEach((el) => {
    const a = antes.get(el);
    if (!a) return;
    const d = el.getBoundingClientRect();
    const dx = a.left - d.left;
    const dy = a.top - d.top;
    if (dx === 0 && dy === 0) return;
    el.style.zIndex = '2';
    const anim = el.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
      { duration: duracao, easing: curva }
    );
    anim.addEventListener('finish', () => {
      el.style.zIndex = '';
    });
  });
}
