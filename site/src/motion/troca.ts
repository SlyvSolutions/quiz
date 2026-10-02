import { prefersReducedMotion } from './reduced-motion';
import { lerDuracaoMs } from './tokens';

export interface Origem {
  x: number;
  y: number;
}

export interface Troca {
  /** Resolve quando o círculo cobriu a tela inteira: é a hora de trocar o conteúdo por baixo. */
  cobriu: Promise<void>;
  /** Some com o círculo, revelando a tela nova. */
  revelar: () => void;
  /** Descarta a troca sem revelar nada (navegação cancelada). */
  cancelar: () => void;
}

/**
 * Troca de tela em íris a partir do clique (Livro Amarelo): um círculo na cor da tela de destino cresce
 * com um anel amarelo na borda, cobre a tela, e some revelando a nova. O CSS está em .troca (motion.css).
 * Em movimento reduzido não há íris: a troca é imediata.
 */
export function iniciarTroca(origem: Origem, temaDestino: 'claro' | 'escuro'): Troca {
  if (prefersReducedMotion() || typeof document === 'undefined') {
    return { cobriu: Promise.resolve(), revelar: () => {}, cancelar: () => {} };
  }

  document.querySelectorAll('.troca').forEach((t) => t.remove());

  const camada = document.createElement('div');
  camada.className = 'troca';
  camada.dataset.tema = temaDestino;
  camada.setAttribute('aria-hidden', 'true');
  camada.style.setProperty('--x', `${origem.x}px`);
  camada.style.setProperty('--y', `${origem.y}px`);
  const alcance = Math.hypot(Math.max(origem.x, window.innerWidth - origem.x), Math.max(origem.y, window.innerHeight - origem.y));
  camada.style.setProperty('--r-final', `${Math.ceil(alcance) + 80}px`);
  document.body.appendChild(camada);

  const duracao = lerDuracaoMs('dur-emocao');
  const cobriu = new Promise<void>((resolve) => {
    const fim = () => resolve();
    camada.addEventListener('transitionend', (e) => e.propertyName === '--r' && fim(), { once: false });
    setTimeout(fim, duracao + 150); // segurança: navegadores sem @property não emitem o evento
  });

  // força o layout para a transição partir de --r: 0
  camada.getBoundingClientRect();
  camada.classList.add('expandindo');

  const remover = () => camada.remove();
  return {
    cobriu,
    revelar: () => {
      camada.classList.add('some');
      setTimeout(remover, lerDuracaoMs('dur-saida') + 100);
    },
    cancelar: remover,
  };
}
