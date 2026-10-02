/**
 * Gesto 2: entrada de bloco. Cada bloco entra uma vez, quando o topo passa 75% da tela,
 * com filhos em sequência (--i, multiplicado por --mq-stagger no CSS). Duração, deslocamento
 * e blur vêm dos tokens; em movimento reduzido eles zeram e sobra só a opacidade (motion.css).
 */
export function revelarBlocos(raiz: HTMLElement, seletor = ':scope > :not([data-fixo])'): void {
  const alvos = Array.from(raiz.querySelectorAll<HTMLElement>(seletor));
  if (alvos.length === 0) return;

  alvos.forEach((alvo) => alvo.classList.add('entrada'));

  if (typeof IntersectionObserver === 'undefined') {
    alvos.forEach((alvo) => alvo.classList.add('entrou'));
    return;
  }

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas
        .filter((e) => e.isIntersecting)
        .forEach((e, ordem) => {
          const alvo = e.target as HTMLElement;
          alvo.style.setProperty('--i', String(ordem));
          alvo.classList.add('entrou');
          observador.unobserve(alvo);
        });
    },
    { rootMargin: '0% 0% -25% 0%', threshold: 0 }
  );
  alvos.forEach((alvo) => observador.observe(alvo));
}
