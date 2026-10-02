import { el } from './dom';

/** Barrinhas segmentadas: uma por passo. Passos anteriores cheios, o atual em amarelo. */
export function criarBarraDeProgresso(valorAtual: number, total: number): HTMLElement {
  const barra = el('div', {
    class: 'ui-progress',
    attrs: {
      role: 'progressbar',
      'aria-valuenow': String(valorAtual),
      'aria-valuemin': '0',
      'aria-valuemax': String(total),
    },
  });
  for (let i = 0; i < total; i++) {
    const estado = i < valorAtual ? ' feito' : i === valorAtual ? ' atual' : '';
    barra.appendChild(el('span', { class: `ui-progress-passo${estado}` }));
  }
  return barra;
}
