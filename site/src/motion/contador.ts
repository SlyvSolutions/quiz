import { prefersReducedMotion } from './reduced-motion';

const DURACAO = 900; // ms, igual a --mq-dur-emocao

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Contador sobe de 0 ao valor quando entra na tela. Em movimento reduzido já nasce no valor final. */
export function animarContador(alvo: HTMLElement, final: number, formatar: (n: number) => string = (n) => `${n}%`) {
  if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
    alvo.textContent = formatar(final);
    return;
  }
  alvo.textContent = formatar(0);
  const observador = new IntersectionObserver((entradas) => {
    if (!entradas.some((e) => e.isIntersecting)) return;
    observador.disconnect();
    const inicio = performance.now();
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / DURACAO);
      alvo.textContent = formatar(Math.round(final * easeOut(t)));
      if (t < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  });
  observador.observe(alvo);
}

/** Barra de afinidade: nasce vazia e enche (transição em .barra-preenchimento) quando aparece. */
export function animarBarra(preenchimento: HTMLElement, pct: number) {
  const definir = () => preenchimento.style.setProperty('--pct', `${pct}%`);
  if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
    definir();
    return;
  }
  const observador = new IntersectionObserver((entradas) => {
    if (!entradas.some((e) => e.isIntersecting)) return;
    observador.disconnect();
    definir();
  });
  observador.observe(preenchimento);
}
