import { el } from './dom';

export interface OpcoesDica {
  idBalao: string;
  rotulo: string;
  texto: string;
}

export interface Dica {
  gatilho: HTMLButtonElement;
  balao: HTMLElement;
}

/** Dica aberta no momento (só uma por vez em todo o documento). */
let aberta: { fechar(): void } | null = null;
let ouvintesProntos = false;

/** Fecha a dica aberta ao teclar Escape ou ao pressionar fora dela. */
function garantirOuvintes(): void {
  if (ouvintesProntos) return;
  ouvintesProntos = true;
  document.addEventListener('pointerdown', (ev) => {
    const atual = aberta;
    if (!atual) return;
    const alvo = ev.target as Element | null;
    if (alvo && typeof alvo.closest === 'function' && alvo.closest('.dica-gatilho, .dica-balao')) return;
    atual.fechar();
  });
  document.addEventListener('keydown', (ev) => {
    if ((ev as KeyboardEvent).key === 'Escape' && aberta) aberta.fechar();
  });
}

/**
 * Gatilho "?" + balão explicativo. Abre com mouse, foco ou toque;
 * fecha com Escape, saída do mouse, blur ou toque fora. Sem HTML textual.
 */
export function criarDica(op: OpcoesDica): Dica {
  garantirOuvintes();

  const balao = el('span', {
    class: 'dica-balao',
    attrs: { role: 'tooltip', id: op.idBalao, hidden: '' },
    texto: op.texto,
  });

  const gatilho = el(
    'button',
    {
      class: 'dica-gatilho wizard-ajuda',
      attrs: {
        type: 'button',
        'aria-label': op.rotulo,
        'aria-describedby': op.idBalao,
        'aria-expanded': 'false',
      },
    },
    '?',
  );

  const api: { fechar(): void } = {
    fechar() {
      if (balao.hidden) return;
      balao.hidden = true;
      gatilho.setAttribute('aria-expanded', 'false');
      if (aberta === api) aberta = null;
    },
  };

  function abrir(): void {
    if (aberta && aberta !== api) aberta.fechar();
    aberta = api;
    balao.hidden = false;
    gatilho.setAttribute('aria-expanded', 'true');
  }

  function alternar(): void {
    if (balao.hidden) abrir();
    else api.fechar();
  }

  /** Instante do último foco que abriu (o clique do toque chega logo depois). */
  let focoAbriuEm = 0;

  gatilho.addEventListener('pointerenter', (ev) => {
    if ((ev as PointerEvent).pointerType === 'mouse') abrir();
  });
  gatilho.addEventListener('pointerleave', (ev) => {
    if ((ev as PointerEvent).pointerType === 'mouse') api.fechar();
  });
  gatilho.addEventListener('focus', () => {
    abrir();
    focoAbriuEm = Date.now();
  });
  gatilho.addEventListener('blur', () => api.fechar());
  gatilho.addEventListener('click', () => {
    if (Date.now() - focoAbriuEm < 400) return;
    alternar();
  });

  return { gatilho, balao };
}
