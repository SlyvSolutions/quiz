import { prefersReducedMotion } from './reduced-motion';

export interface PontoClique {
  x: number;
  y: number;
  t: number;
}

/** Quem recebe a onda de toque: botões, cards de opção e os botões de fechar. */
const ALVOS_ONDA = '.btn-pill, .btn-cartao, .quiz-option-card, .ui-slide-close, .ui-modal-close';

let ultimo: PontoClique | null = null;

/** Último clique, para a troca de tela abrir a íris a partir dele. Vale só por um instante. */
export function ultimoClique(maxIdadeMs = 1500): PontoClique | null {
  if (!ultimo) return null;
  return performance.now() - ultimo.t <= maxIdadeMs ? ultimo : null;
}

export function consumirClique(): void {
  ultimo = null;
}

function centroDe(el: Element): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function criarOnda(alvo: HTMLElement, x: number, y: number) {
  const caixa = alvo.getBoundingClientRect();
  const diametro = Math.hypot(caixa.width, caixa.height) * 2;
  const onda = document.createElement('span');
  onda.className = 'onda';
  onda.setAttribute('aria-hidden', 'true');
  onda.style.setProperty('--x', `${x - caixa.left}px`);
  onda.style.setProperty('--y', `${y - caixa.top}px`);
  onda.style.setProperty('--d', `${diametro}px`);
  alvo.appendChild(onda);
  onda.addEventListener('animationend', () => onda.remove(), { once: true });
  setTimeout(() => onda.remove(), 1500); // garante a limpeza se a animação não rodar
}

function aoTocar(e: PointerEvent | MouseEvent, x: number, y: number) {
  const alvo = (e.target as Element | null)?.closest<HTMLElement>(ALVOS_ONDA);
  ultimo = { x, y, t: performance.now() };
  if (!alvo || (alvo as HTMLButtonElement).disabled || prefersReducedMotion()) return;
  if ((e.target as Element).closest('summary')) return; // abrir/fechar um recolhível não é uma escolha
  criarOnda(alvo, x, y);
}

/** Liga uma vez: registra o ponto do clique e faz a onda de toque em todo o app. */
export function iniciarCliques(): () => void {
  const pointer = (e: PointerEvent) => aoTocar(e, e.clientX, e.clientY);
  // Ativação por teclado chega como click sem coordenadas: usa o centro do elemento
  const click = (e: MouseEvent) => {
    if (e.detail !== 0) return;
    const alvo = e.target as Element | null;
    if (!alvo) return;
    const c = centroDe(alvo);
    aoTocar(e, c.x, c.y);
  };
  document.addEventListener('pointerdown', pointer, true);
  document.addEventListener('click', click, true);
  return () => {
    document.removeEventListener('pointerdown', pointer, true);
    document.removeEventListener('click', click, true);
  };
}
